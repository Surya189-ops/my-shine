"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function TourPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🌍</div>
        <h1 className="text-3xl font-bold text-pink-500 mb-3">Tour</h1>
        <p className="text-gray-500 text-lg mb-2">Coming Soon</p>
        <p className="text-gray-400 text-sm mb-8">
          We're working on something exciting. Stay tuned!
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mx-auto px-6 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-all"
        >
          <FiArrowLeft size={18} />
          Go Back
        </button>
      </div>
    </div>
  );
}