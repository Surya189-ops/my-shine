"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiBarChart2, FiDollarSign, FiUsers, FiMessageSquare, FiLock, FiTrendingUp } from "react-icons/fi";
import BottomNav from "../components/BottomNav";

const HOMEPAGE_COUNTRY_CODES = ["JP", "KR", "BR", "CO", "VE", "AR"];

type AnalyticsData = {
  totalEarnings: number;
  thisMonthEarnings: number;
  totalConnections: number;
  totalMessages: number;
  profileViews: number;
  withdrawableBalance: number;
  transactions: { date: string; amount: number; type: string }[];
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null); // null = loading
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  /* ── Check if user's country is allowed ── */
  useEffect(() => {
    fetch("/api/detect-country")
      .then((r) => r.json())
      .then((data) => setAllowed(data.canApplyToHomepage === true))
      .catch(() => setAllowed(false));
  }, []);

  /* ── Load analytics once allowed ── */
  useEffect(() => {
    if (!allowed) return;

    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user.profileId) return;

    fetch(`/api/analytics?profileId=${user.profileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          // Fallback mock data if API not yet built
          setAnalytics({
            totalEarnings: 0,
            thisMonthEarnings: 0,
            totalConnections: 0,
            totalMessages: 0,
            profileViews: 0,
            withdrawableBalance: 0,
            transactions: [],
          });
        }
      })
      .catch(() => {
        setAnalytics({
          totalEarnings: 0,
          thisMonthEarnings: 0,
          totalConnections: 0,
          totalMessages: 0,
          profileViews: 0,
          withdrawableBalance: 0,
          transactions: [],
        });
      });
  }, [allowed]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return alert("Enter a valid amount");
    if (!analytics || amount > analytics.withdrawableBalance)
      return alert("Insufficient balance");
    if (!withdrawAccount.trim()) return alert("Enter your account details");

    setWithdrawing(true);
    try {
      const userStr = localStorage.getItem("myshine_user");
      const user = JSON.parse(userStr || "{}");

      const res = await fetch("/api/analytics/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: user.profileId,
          amount,
          method: withdrawMethod,
          account: withdrawAccount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Withdrawal of $${amount} requested successfully! It will be processed in 2–3 business days.`);
        setAnalytics((prev) =>
          prev ? { ...prev, withdrawableBalance: prev.withdrawableBalance - amount } : prev
        );
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawAccount("");
      } else {
        alert(data.message || "Withdrawal failed. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  /* ── Loading state ── */
  if (allowed === null) {
    return (
      <div className="min-h-screen bg-pink-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  /* ── Not allowed (India, etc.) ── */
  if (!allowed) {
    return (
      <div className="min-h-screen bg-pink-50 dark:bg-gray-900 transition-colors duration-300 pb-24">
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <FiArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <FiLock size={36} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            Analytics Not Available
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            Analytics and earnings are only available for profiles from Korea, Japan, and Latin countries.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── Allowed — show full analytics ── */
  const statCards = [
    { icon: FiDollarSign,    label: "Total Earnings",      value: `$${analytics?.totalEarnings?.toFixed(2) ?? "0.00"}`, color: "text-green-500",  bg: "bg-green-50 dark:bg-green-900/20" },
    { icon: FiTrendingUp,    label: "This Month",          value: `$${analytics?.thisMonthEarnings?.toFixed(2) ?? "0.00"}`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: FiUsers,         label: "Total Connections",   value: analytics?.totalConnections ?? 0, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { icon: FiMessageSquare, label: "Total Messages",      value: analytics?.totalMessages ?? 0,    color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-900/20" },
    { icon: FiBarChart2,     label: "Profile Views",       value: analytics?.profileViews ?? 0,     color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-gray-900 transition-colors duration-300 pb-24">

      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <FiArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* WITHDRAWABLE BALANCE CARD */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-pink-100 text-sm mb-1">Withdrawable Balance</p>
          <p className="text-4xl font-bold mb-4">
            ${analytics?.withdrawableBalance?.toFixed(2) ?? "0.00"}
          </p>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!analytics || analytics.withdrawableBalance <= 0}
            className="bg-white text-pink-500 font-semibold px-6 py-2 rounded-full text-sm disabled:opacity-50 hover:bg-pink-50 transition-colors"
          >
            Withdraw
          </button>
          {analytics && analytics.withdrawableBalance <= 0 && (
            <p className="text-pink-200 text-xs mt-2">Minimum $10 required to withdraw</p>
          )}
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
              <div className={`w-9 h-9 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Transaction History</h3>
          {!analytics?.transactions?.length ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No transactions yet</p>
              <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Earnings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.transactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`font-semibold text-sm ${tx.type === "withdrawal" ? "text-red-500" : "text-green-500"}`}>
                    {tx.type === "withdrawal" ? "-" : "+"}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HOW EARNINGS WORK */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">How Earnings Work</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> Earn when users connect with your profile</li>
            <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> Earn from messages received on your profile</li>
            <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> Minimum withdrawal amount is $10</li>
            <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> Withdrawals processed in 2–3 business days</li>
          </ul>
        </div>

      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Withdraw Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold">✕</button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Available: <span className="font-bold text-green-500">${analytics?.withdrawableBalance?.toFixed(2)}</span>
            </p>

            {/* AMOUNT */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Amount ($)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                max={analytics?.withdrawableBalance}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
              />
            </div>

            {/* METHOD */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Withdrawal Method</label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
              >
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>

            {/* ACCOUNT DETAILS */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                {withdrawMethod === "bank" ? "Bank Account Number" : withdrawMethod === "paypal" ? "PayPal Email" : "Wallet Address"}
              </label>
              <input
                type="text"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                placeholder={withdrawMethod === "bank" ? "Account number" : withdrawMethod === "paypal" ? "your@email.com" : "0x..."}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || !withdrawAccount.trim()}
              className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-pink-600 transition-colors"
            >
              {withdrawing ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}