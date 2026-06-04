"use client";
import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/recentlyViewed";

export default function TrackView({ id }: { id: string }) {
  useEffect(() => { addRecentlyViewed(id); }, [id]);
  return null;
}
