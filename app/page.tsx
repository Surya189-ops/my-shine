"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is already logged in, redirect to home
    const user = localStorage.getItem("myshine_user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.loggedIn) { router.replace("/home"); return; }
      } catch {}
    }

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(236,72,153,0.4); }
          50% { box-shadow: 0 0 60px rgba(236,72,153,0.8), 0 0 100px rgba(236,72,153,0.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 8s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-marquee { animation: marquee 20s linear infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #ec4899 30%, #fff 60%, #ec4899 90%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .pink-glow {
          background: radial-gradient(circle at center, rgba(236,72,153,0.15) 0%, transparent 70%);
        }

        .card-hover {
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-8px);
          border-color: rgba(236,72,153,0.4) !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ec4899, #be185d);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before { left: 100%; }
        .btn-primary:hover { transform: scale(1.03); box-shadow: 0 20px 40px rgba(236,72,153,0.4); }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 font-body ${scrolled ? "glass py-3" : "py-5"}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-700 animate-pulse-glow" />
            <span className="font-display text-xl font-bold text-white">My Shine</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2"
            >
              Log In
            </button>
            <button
              onClick={() => router.push("/login")}
              className="btn-primary text-sm font-medium text-white px-5 py-2 rounded-full"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">

        {/* Background orbs */}
        <div className="orb w-[600px] h-[600px] bg-pink-600/20 top-[-200px] right-[-200px]" />
        <div className="orb w-[400px] h-[400px] bg-purple-600/15 bottom-[-100px] left-[-100px]" />
        <div className="orb w-[300px] h-[300px] bg-pink-400/10 top-[40%] left-[20%]" />

        {/* Rotating ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-pink-500/10 animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-pink-500/5" style={{ animation: "spin-slow 30s linear infinite reverse" }} />

        {/* Floating profile cards */}
        <div className="absolute left-[5%] top-[30%] animate-float hidden md:block">
          <div className="glass rounded-2xl p-3 w-36">
            <div className="w-full h-20 rounded-xl bg-gradient-to-br from-pink-400/30 to-purple-500/30 mb-2 flex items-center justify-center text-2xl">🇯🇵</div>
            <p className="text-xs text-white font-medium text-center">Yuki, Tokyo</p>
            <div className="flex justify-center mt-1"><span className="text-[10px] text-pink-400">● Online</span></div>
          </div>
        </div>

        <div className="absolute right-[5%] top-[25%] animate-float-reverse hidden md:block">
          <div className="glass rounded-2xl p-3 w-36">
            <div className="w-full h-20 rounded-xl bg-gradient-to-br from-orange-400/30 to-pink-500/30 mb-2 flex items-center justify-center text-2xl">🇰🇷</div>
            <p className="text-xs text-white font-medium text-center">Mina, Seoul</p>
            <div className="flex justify-center mt-1"><span className="text-[10px] text-pink-400">● Online</span></div>
          </div>
        </div>

        <div className="absolute right-[8%] bottom-[25%] animate-float hidden md:block">
          <div className="glass rounded-2xl p-3 w-36">
            <div className="w-full h-20 rounded-xl bg-gradient-to-br from-green-400/30 to-teal-500/30 mb-2 flex items-center justify-center text-2xl">🌎</div>
            <p className="text-xs text-white font-medium text-center">Valentina, Brazil</p>
            <div className="flex justify-center mt-1"><span className="text-[10px] text-pink-400">● Online</span></div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-pink-300 font-body">
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
            Connect with people from Japan, Korea & Latin America
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6">
            <span className="block text-white">Find Your</span>
            <span className="shimmer-text">Perfect Match</span>
          </h1>

          <p className="font-body text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with real people from Japan, Korea, and Latin America.
            Chat, video call, and build meaningful relationships across borders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push("/login")}
              className="btn-primary font-body font-medium text-white text-base px-8 py-4 rounded-full w-full sm:w-auto"
            >
              Start Connecting — Free ✨
            </button>
            <button
              onClick={() => router.push("/login")}
              className="font-body text-gray-300 hover:text-white text-base px-8 py-4 rounded-full border border-white/10 hover:border-white/30 transition-all w-full sm:w-auto"
            >
              Book a Video Call →
            </button>
          </div>

          <p className="font-body text-gray-600 text-sm mt-6">
            No credit card required • Free to join • ₹199 for 10-min video calls
          </p>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="py-6 border-y border-white/5 overflow-hidden bg-pink-500/5">
        <div className="flex animate-marquee whitespace-nowrap">
          {["🇯🇵 Japan", "🇰🇷 Korea", "🌎 Brazil", "🌎 Colombia", "🌎 Argentina", "🌎 Venezuela",
            "💬 Real Conversations", "📹 Video Calls", "💖 Meaningful Connections", "✨ Verified Profiles",
            "🇯🇵 Japan", "🇰🇷 Korea", "🌎 Brazil", "🌎 Colombia", "🌎 Argentina", "🌎 Venezuela",
            "💬 Real Conversations", "📹 Video Calls", "💖 Meaningful Connections", "✨ Verified Profiles"].map((item, i) => (
            <span key={i} className="font-body text-sm text-pink-300/60 mx-8">{item}</span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 relative">
        <div className="orb w-[400px] h-[400px] bg-pink-500/10 top-0 left-1/2 -translate-x-1/2" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="font-body text-pink-400 text-sm uppercase tracking-widest mb-3">Simple & Easy</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "👤", title: "Create Your Profile", desc: "Sign up free and tell us about yourself. Takes less than 2 minutes." },
              { step: "02", icon: "🔍", title: "Browse & Connect", desc: "Explore profiles from Japan, Korea, and Latin America. Connect with who interests you." },
              { step: "03", icon: "📹", title: "Book a Video Call", desc: "Book a private 10-minute video session for just ₹199. Real connections, real people." },
            ].map((item) => (
              <div key={item.step} className="glass rounded-2xl p-7 card-hover border border-white/5">
                <div className="flex items-start justify-between mb-5">
                  <span className="text-4xl">{item.icon}</span>
                  <span className="font-display text-5xl font-black text-white/5">{item.step}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="font-body text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-pink-400 text-sm uppercase tracking-widest mb-3">Everything You Need</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Why My Shine?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🌏", title: "Global Connections", desc: "Meet verified people from Japan, Korea, Brazil, Colombia, Venezuela & Argentina" },
              { icon: "📹", title: "HD Video Calls", desc: "Crystal clear video sessions for just ₹199 per 10 minutes" },
              { icon: "💬", title: "Real-time Chat", desc: "Message instantly with image sharing, view-once photos and read receipts" },
              { icon: "✅", title: "Verified Profiles", desc: "All profiles from featured countries are manually verified by our team" },
              { icon: "🔒", title: "Safe & Secure", desc: "Block, report, and stay in control. Your safety is our priority" },
              { icon: "💰", title: "Earn Money", desc: "Profiles from Japan, Korea & Latin countries can earn by connecting with users" },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 card-hover border border-white/5">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="font-body text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 px-6 relative">
        <div className="orb w-[500px] h-[500px] bg-pink-500/10 bottom-0 right-0" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="font-body text-pink-400 text-sm uppercase tracking-widest mb-3">Transparent Pricing</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Simple & Affordable</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="glass rounded-2xl p-8 border border-white/5">
              <p className="font-body text-gray-400 text-sm mb-2">For everyone</p>
              <h3 className="font-display text-3xl font-bold text-white mb-1">Free</h3>
              <p className="font-body text-gray-500 text-sm mb-8">Forever, no credit card needed</p>
              <ul className="space-y-3 mb-8">
                {["Create your profile", "Browse all profiles", "Send connect requests", "Chat with matches", "Share photos & images"].map((f) => (
                  <li key={f} className="flex items-center gap-3 font-body text-sm text-gray-300">
                    <span className="text-pink-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/login")} className="w-full py-3 rounded-full border border-white/15 hover:border-pink-500/50 text-white font-body font-medium transition-all">
                Get Started Free
              </button>
            </div>

            {/* Video Call */}
            <div className="relative rounded-2xl p-8 border border-pink-500/30 animate-pulse-glow" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(190,24,93,0.05))" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs font-body font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <p className="font-body text-pink-300 text-sm mb-2">Premium experience</p>
              <div className="flex items-end gap-2 mb-1">
                <h3 className="font-display text-4xl font-bold text-white">₹199</h3>
                <span className="font-body text-gray-400 text-sm mb-1">per session</span>
              </div>
              <p className="font-body text-gray-500 text-sm mb-8">10-minute private video call</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "HD video call session", "Private 1-on-1 experience", "Secure Razorpay payment", "Instant connection"].map((f) => (
                  <li key={f} className="flex items-center gap-3 font-body text-sm text-gray-300">
                    <span className="text-pink-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/login")} className="btn-primary w-full py-3 rounded-full text-white font-body font-medium">
                Book a Video Call
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-white/5 relative overflow-hidden">
            <div className="orb w-64 h-64 bg-pink-500/20 top-[-50px] right-[-50px]" />
            <div className="orb w-48 h-48 bg-purple-500/15 bottom-[-30px] left-[-30px]" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Shine? ✨
              </h2>
              <p className="font-body text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of users already connecting across borders. Free to start, no commitment required.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="btn-primary font-body font-medium text-white text-base px-10 py-4 rounded-full"
              >
                Create Free Account →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-700" />
            <span className="font-display text-lg font-bold text-white">My Shine</span>
          </div>
          <p className="font-body text-gray-600 text-sm">© 2025 My Shine. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push("/login")} className="font-body text-gray-500 hover:text-white text-sm transition-colors">Login</button>
            <button onClick={() => router.push("/login")} className="font-body text-gray-500 hover:text-white text-sm transition-colors">Sign Up</button>
            <a href="mailto:support@myshine.site" className="font-body text-gray-500 hover:text-white text-sm transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}