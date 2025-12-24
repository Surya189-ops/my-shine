"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

type Booking = {
  _id: string;
  profileId: string;
  tier: string;
  duration: number;
  price: number;
  status: "pending" | "paid" | "cancelled" | "completed";
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  /* -------- FETCH BOOKINGS -------- */
  useEffect(() => {
    const userStr = localStorage.getItem("myshine_user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userStr);

    fetch("/api/bookings/cleanup", { method: "POST" });

    fetch(`/api/bookings?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBookings(data.bookings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  /* -------- UPDATE BOOKING STATUS -------- */
  const updateBookingStatus = async (
    bookingId: string,
    status: Booking["status"]
  ) => {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status }),
    });

    const data = await res.json();

    if (data.success) {
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data.booking : b))
      );
    }
  };

  const cancelBooking = (bookingId: string) => {
    if (!confirm("Cancel this booking?")) return;
    updateBookingStatus(bookingId, "cancelled");
  };

  /* -------- DERIVED LISTS -------- */
  const activeBookings = bookings.filter((b) => b.status === "paid");
  const pastBookings = bookings.filter((b) => b.status !== "paid");

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 pb-28 pt-4">
        <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

        {loading && (
          <p className="text-sm text-gray-500">
            Loading bookings...
          </p>
        )}

        {!loading && bookings.length === 0 && (
          <p className="text-sm text-gray-500">
            You don’t have any bookings yet.
          </p>
        )}

        {/* -------- ACTIVE -------- */}
        {activeBookings.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">
              Active
            </h2>

            <div className="space-y-3 mb-6">
              {activeBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl p-4 shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {booking.tier} Plan
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.duration} mins • ₹{booking.price}
                      </p>
                    </div>

                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      disabled={navigating}
                      onClick={() => {
                        setNavigating(true);
                        router.push(`/chat/${booking.profileId}`);
                      }}
                      className="flex-1 text-sm bg-pink-500 text-white py-2 rounded-full disabled:bg-gray-300"
                    >
                      Continue Chat
                    </button>

                    <button
                      onClick={() => cancelBooking(booking._id)}
                      className="text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* -------- HISTORY -------- */}
        {pastBookings.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">
              History
            </h2>

            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl p-4 shadow"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {booking.tier} Plan
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.duration} mins • ₹{booking.price}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded ${statusStyles[booking.status]}`}
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>

                  <button
                    disabled={navigating}
                    onClick={() => {
                      setNavigating(true);
                      router.push(
                        `/payment?profileId=${booking.profileId}`
                      );
                    }}
                    className="mt-3 text-sm px-6 py-2 rounded-full bg-gray-100 text-gray-700 disabled:bg-gray-300"
                  >
                    Book again
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
