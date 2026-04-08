// API endpoint that handles the "Book Now" button.
// It does three things:
// 1. Validates the incoming data
// 2. Checks the slot hasn't been booked by someone else (race condition protection)
// 3. Marks the slot as booked and creates the booking record

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use a server-side Supabase client here (not the browser one).
// This uses the same anon key but runs on the server, which is where we
// want the booking logic to happen for security.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request." },
      { status: 400 }
    );
  }

  const { slot_id, customer_name, customer_phone, customer_address } = body;

  // Basic validation
  if (!slot_id || !customer_name || !customer_phone) {
    return NextResponse.json(
      { message: "Please fill in all required fields." },
      { status: 400 }
    );
  }

  if (typeof customer_name !== "string" || customer_name.trim().length < 2) {
    return NextResponse.json(
      { message: "Please enter a valid name." },
      { status: 400 }
    );
  }

  const cleanPhone = customer_phone.replace(/\s/g, "");
  if (!/^0\d{10}$/.test(cleanPhone)) {
    return NextResponse.json(
      { message: "Please enter a valid Nigerian phone number (11 digits starting with 0)." },
      { status: 400 }
    );
  }

  // Try to claim the slot: update is_booked to true, but ONLY if it's currently false.
  // If two customers submit at the same time, only one update will succeed because
  // the second one won't find a row where is_booked = false.
  const { data: updatedSlots, error: updateError } = await supabase
    .from("slots")
    .update({ is_booked: true })
    .eq("id", slot_id)
    .eq("is_booked", false)
    .eq("is_unavailable", false)
    .select();

  if (updateError) {
    console.error("Slot update failed:", updateError);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // If no rows were updated, the slot was already taken
  if (!updatedSlots || updatedSlots.length === 0) {
    return NextResponse.json(
      { message: "Sorry, that slot was just taken — please pick another.", code: "SLOT_TAKEN" },
      { status: 409 }  // 409 = Conflict
    );
  }

  // Slot claimed successfully — now create the booking record
  const { error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id,
      customer_name: customer_name.trim(),
      customer_phone: cleanPhone,
      customer_address: customer_address?.trim() || null,
    });

  if (bookingError) {
    // If the booking insert fails, un-book the slot so it's not stuck as booked
    console.error("Booking insert failed:", bookingError);
    await supabase
      .from("slots")
      .update({ is_booked: false })
      .eq("id", slot_id);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Booking confirmed!" }, { status: 200 });
}
