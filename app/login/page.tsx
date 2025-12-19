"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const router = useRouter();

  /* ---------------- AUTO REDIRECT IF LOGGED IN ---------------- */


  // useEffect(() => {
  //   const user = localStorage.getItem("myshine_user");
  //   if (user) {
  //     try {
  //       const parsed = JSON.parse(user);
  //       if (parsed.loggedIn) {
  //         router.replace("/profile");
  //       }
  //     } catch {}
  //   }
  // }, [router]);

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!phone) return alert("Enter phone number");
    if (mode === "signup" && !agree)
      return alert("Accept Terms & Conditions");

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (data.success) setShowOtp(true);
      else alert(data.message);
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem(
          "myshine_user",
          JSON.stringify({
            id: data.user.id,
            phone: data.user.phone,
            loggedIn: true,
          })
        );
        router.push("/profile");
      }
      else {
        alert(data.message);
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">

        {/* APP NAME */}
        <h1 className="text-2xl font-bold text-center text-pink-500">
          My Shine 💖
        </h1>

        {/* LOGIN / SIGNUP TOGGLE */}
        <div className="flex mt-6 mb-6 bg-gray-100 rounded-lg p-1">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m as "login" | "signup");
                setShowOtp(false);
              }}
              className={`w-1/2 py-2 rounded-lg font-semibold transition ${mode === m
                  ? "bg-white shadow text-pink-500"
                  : "text-gray-500"
                }`}
            >
              {m === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* PHONE INPUT */}
        {!showOtp && (
          <>
            <PhoneInput
              country="in"
              value={phone}
              onChange={setPhone}
              inputClass="!w-full !py-3 !pl-14"
              containerClass="mb-4"
            />

            {/* TERMS (SIGNUP ONLY) */}
            {mode === "signup" && (
              <div className="flex gap-2 mb-4 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                  I agree to{" "}
                  <span
                    onClick={() => setShowTerms(true)}
                    className="text-pink-500 cursor-pointer underline"
                  >
                    Terms & Conditions
                  </span>
                </span>
              </div>
            )}

            <button
              onClick={sendOtp}
              disabled={loading || (mode === "signup" && !agree)}
              className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Sending..." : "Get OTP"}
            </button>
          </>
        )}

        {/* OTP INPUT */}
        {showOtp && (
          <>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full mt-1 mb-4 p-3 border rounded-lg"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </>
        )}

        {/* TERMS MODAL */}
        {showTerms && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm">
              <p className="text-sm mb-4">
                You must be 18+. Respect users. No misuse.
              </p>
              <button
                onClick={() => setShowTerms(false)}
                className="w-full bg-pink-500 text-white py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-center mt-4 text-gray-400">
          Test OTP: <span className="font-semibold">123456</span>
        </p>
      </div>
    </div>
  );
}
