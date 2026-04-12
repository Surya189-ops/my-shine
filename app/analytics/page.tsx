"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiBarChart2 } from "react-icons/fi";
import BottomNav from "../components/BottomNav";

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-gray-900 transition-colors duration-300 pb-24">

      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Analytics</h1>
        </div>
      </div>

      {/* EMPTY STATE */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
          <FiBarChart2 size={36} className="text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          Analytics Coming Soon
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          We're working on detailed analytics for your profile. Check back soon!
        </p>
      </div>

      <BottomNav />
    </div>
  );
}