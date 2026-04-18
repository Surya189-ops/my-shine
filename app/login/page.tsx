"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

type Step = "home" | "signup-email" | "signup-otp" | "login-email";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const googleLoginHandled = useRef(false);

  const [step, setStep] = useState<Step>("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (googleLoginHandled.current) return;

    const wasLoggedOut = localStorage.getItem("myshine_logged_out");
    if (wasLoggedOut === "true") {
      localStorage.removeItem("myshine_logged_out");
      signOut({ redirect: false });
      return;
    }

    googleLoginHandled.current = true;
    handleGoogleSessionLogin();
  }, [status, session]);

  const handleGoogleSessionLogin = async () => {
    if (!session?.user?.email) return;

    try {
      let userId = session.user.id;

      if (!userId) {
        // Step 1: try lookup by email
        const lookupRes = await fetch(
          `/api/auth/user-by-email?email=${encodeURIComponent(session.user.email)}`
        );
        const lookupData = await lookupRes.json();

        if (lookupData.success && lookupData.userId) {
          userId = lookupData.userId;
        } else {
          // Step 2: create user
          const createRes = await fetch("/api/auth/ensure-google-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
            }),
          });
          const createData = await createRes.json();

          if (createData.success && createData.userId) {
            userId = createData.userId;
          } else {
            // Show actual error for debugging
            setError(createData.message || "Failed to create account. Please try again.");
            googleLoginHandled.current = false;
            return;
          }
        }
      }

      // Fetch profile
      const profileRes = await fetch(`/api/profile?userId=${userId}`);
      const profileData = await profileRes.json();

      if (profileData.success && profileData.profile) {
        localStorage.setItem("myshine_user", JSON.stringify({
          id: userId,
          profileId: profileData.profile._id,
          email: session.user.email,
          name: profileData.profile.name,
          loggedIn: true,
          provider: "google",
        }));
        router.push("/");
      } else {
        localStorage.setItem("myshine_user", JSON.stringify({
          id: userId,
          email: session.user.email,
          name: session.user.name,
          loggedIn: true,
          provider: "google",
        }));
        router.push("/profile");
      }
    } catch (err: any) {
      console.error("Google session error:", err);
      setError(`Login error: ${err.message}. Please try again.`);
      googleLoginHandled.current = false;
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const clearError = () => setError("");

  const handleSignupSendOtp = async () => {
    if (!email) return setError("Enter your email");
    if (!password) return setError("Enter a password");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords don't match");
    if (!agree) return setError("Please accept Terms & Conditions");
    setLoading(true); clearError();
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { setStep("signup-otp"); setResendTimer(60); }
      else setError(data.message);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleSignupVerifyOtp = async () => {
    if (!otp) return setError("Enter the OTP");
    setLoading(true); clearError();
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, isLogin: false }),
      });
      const data = await res.json();
      if (data.success) {
        const userId = data.user.id;
        const profileRes = await fetch(`/api/profile?userId=${userId}`);
        const profileData = await profileRes.json();
        if (profileData.success && profileData.profile) {
          localStorage.setItem("myshine_user", JSON.stringify({
            id: userId, profileId: profileData.profile._id,
            email: data.user.email, name: profileData.profile.name,
            loggedIn: true, provider: "email",
          }));
          router.push("/");
        } else {
          localStorage.setItem("myshine_user", JSON.stringify({
            id: userId, email: data.user.email, loggedIn: true, provider: "email",
          }));
          router.push("/profile");
        }
      } else setError(data.message);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!email) return setError("Enter your email");
    if (!password) return setError("Enter your password");
    setLoading(true); clearError();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const userId = data.user.id;
        const profileRes = await fetch(`/api/profile?userId=${userId}`);
        const profileData = await profileRes.json();
        if (profileData.success && profileData.profile) {
          localStorage.setItem("myshine_user", JSON.stringify({
            id: userId, profileId: profileData.profile._id,
            email: data.user.email, name: profileData.profile.name,
            loggedIn: true, provider: "email",
          }));
          router.push("/");
        } else {
          localStorage.setItem("myshine_user", JSON.stringify({
            id: userId, email: data.user.email, loggedIn: true, provider: "email",
          }));
          router.push("/profile");
        }
      } else setError(data.message);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true); clearError();
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { setResendTimer(60); setOtp(""); }
      else setError(data.message);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

  // Show spinner while Google is processing
  if (status === "loading" || (status === "authenticated" && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">

        <h1 className="text-2xl font-bold text-center text-pink-500 mb-2">My Shine 💖</h1>
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm mb-6">Find your perfect match</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm px-4 py-2 rounded-lg mb-4 break-words">
            {error}
          </div>
        )}

        {/* HOME */}
        {step === "home" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                localStorage.removeItem("myshine_logged_out");
                googleLoginHandled.current = false;
                signIn("google", { callbackUrl: "/login" });
              }}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-gray-600 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>
            <button onClick={() => { setStep("signup-email"); clearError(); }}
              className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition">
              Sign Up with Email
            </button>
            <button onClick={() => { setStep("login-email"); clearError(); }}
              className="w-full border-2 border-pink-500 text-pink-500 py-3 rounded-xl font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition">
              Log In
            </button>
          </div>
        )}

        {/* SIGNUP */}
        {step === "signup-email" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Create your account</p>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="Email address" className={inputClass} />
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} placeholder="Create password (min 6 chars)" className={inputClass} />
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }} placeholder="Confirm password" className={inputClass} />
            <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 items-start">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
              <span>I agree to <span onClick={() => setShowTerms(true)} className="text-pink-500 cursor-pointer underline">Terms & Conditions</span></span>
            </div>
            <button onClick={handleSignupSendOtp} disabled={loading} className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <button onClick={() => { setStep("home"); clearError(); }} className="text-sm text-gray-400 text-center hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* OTP */}
        {step === "signup-otp" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              We sent a 6-digit OTP to<br />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>
            </p>
            <input value={otp} onChange={(e) => { setOtp(e.target.value); clearError(); }} placeholder="Enter 6-digit OTP" maxLength={6} className={inputClass + " text-center tracking-widest text-lg"} />
            <button onClick={handleSignupVerifyOtp} disabled={loading} className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition">
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className="text-sm text-center text-pink-500 disabled:text-gray-400">
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </button>
            <button onClick={() => { setStep("signup-email"); clearError(); }} className="text-sm text-gray-400 text-center hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* LOGIN */}
        {step === "login-email" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Welcome back!</p>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} placeholder="Email address" className={inputClass} />
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} placeholder="Password" className={inputClass} />
            <button onClick={handleLogin} disabled={loading} className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition">
              {loading ? "Logging in..." : "Log In"}
            </button>
            <button onClick={() => { setStep("home"); clearError(); }} className="text-sm text-gray-400 text-center hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* TERMS MODAL */}
        {showTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You must be 18 or older to use My Shine. You agree to treat all users with respect. Any misuse, harassment, or inappropriate behavior will result in permanent account suspension.
              </p>
              <button onClick={() => setShowTerms(false)} className="w-full bg-pink-500 text-white py-2 rounded-xl font-semibold">I Understand</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}