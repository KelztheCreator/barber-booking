// The main booking page. Fetches the barber's profile from Supabase and displays it.
// This is a "server component" — it runs on the server, not in the customer's browser,
// which means the database query happens before the page is sent to the customer.

import { supabase } from "@/lib/supabase";
import BarberHeader from "@/components/barber-header";
import BookingSection from "@/components/booking-section";

export default async function Home() {
  const { data: barber } = await supabase
    .from("barbers")
    .select("*")
    .limit(1)
    .single();

  if (!barber) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <p className="text-center text-gray-500">
          Booking page not set up yet.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <div className="rounded-2xl bg-white shadow-sm">
        <BarberHeader
          name={barber.name}
          shopName={barber.shop_name}
          photoUrl={barber.photo_url}
        />
        <div className="mx-6 border-t border-gray-100" />
        <div className="px-6 pb-8 pt-6">
          <BookingSection
            barberId={barber.id}
            homeServiceFee={barber.home_service_fee}
          />
        </div>
      </div>
    </main>
  );
}
