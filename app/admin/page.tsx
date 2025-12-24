"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  revenueByTier: {
    Bronze: number;
    Silver: number;
    Gold: number;
  };
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load data
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-10">
      <h1 className="text-lg font-semibold mb-4">
        Admin Dashboard
      </h1>

      {/* -------- SUMMARY -------- */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-lg font-semibold">
            ₹{stats.totalRevenue}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500">Total Bookings</p>
          <p className="text-lg font-semibold">
            {stats.totalBookings}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-semibold">
            {stats.activeBookings}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-lg font-semibold">
            {stats.completedBookings}
          </p>
        </div>
      </div>

      {/* -------- REVENUE BY TIER -------- */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="text-sm font-semibold mb-3">
          Revenue by Tier
        </h2>

        {Object.entries(stats.revenueByTier).map(
          ([tier, amount]) => (
            <div
              key={tier}
              className="flex justify-between text-sm mb-2"
            >
              <span>{tier}</span>
              <span className="font-medium">
                ₹{amount}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
