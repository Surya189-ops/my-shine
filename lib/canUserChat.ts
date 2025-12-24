import Booking from "@/models/Booking";

export async function canUserChat(
  userId: string,
  profileId: string
) {
  const now = new Date();

  const activeBooking = await Booking.findOne({
    userId,
    profileId,
    status: "paid",
    startTime: { $lte: now },
    endTime: { $gte: now },
  });

  return !!activeBooking;
}
