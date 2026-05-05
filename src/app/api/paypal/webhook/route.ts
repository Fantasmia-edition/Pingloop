import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const event = await req.json();

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const listingId = event.resource?.purchase_units?.[0]?.reference_id;
    if (listingId) {
      const supabase = await createClient();
      await supabase
        .from("listings")
        .update({ sold_at: new Date().toISOString() })
        .eq("id", listingId);
    }
  }

  return NextResponse.json({ received: true });
}
