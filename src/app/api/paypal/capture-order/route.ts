import { NextRequest, NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();

  const capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (capture.status === "COMPLETED") {
    const listingId = capture.purchase_units?.[0]?.reference_id;
    if (listingId) {
      const supabase = await createClient();
      await supabase
        .from("listings")
        .update({ sold_at: new Date().toISOString() })
        .eq("id", listingId);
    }
  }

  return NextResponse.json({ status: capture.status });
}
