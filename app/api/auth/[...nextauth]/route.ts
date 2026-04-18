import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              authProvider: "google",
              isVerified: true,
            });
          } else if (!existingUser.googleId) {
            existingUser.googleId = account.providerAccountId;
            existingUser.authProvider = "google";
            existingUser.isVerified = true;
            await existingUser.save();
          }

          // Always return true — never block Google users
          return true;
        } catch (err) {
          console.error("Google sign in error:", err);
          // Still return true even on DB error so user isn't shown "Access Denied"
          // The session will be created and user can retry profile fetch
          return true;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.provider = "google";
          } else {
            // DB might have been slow — store email so session still works
            token.userId = null;
            token.provider = "google";
            token.email = user.email;
          }
        } catch (err) {
          console.error("JWT callback error:", err);
          token.provider = "google";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.provider) {
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    // Remove error page override so NextAuth doesn't show "Access Denied" page
    // errors are handled in the signIn callback above
  },
});

export { handler as GET, handler as POST };