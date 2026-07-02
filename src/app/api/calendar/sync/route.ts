import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/google-calendar";

export async function POST() {
  try {
    const count = await syncCalendarEvents();
    return NextResponse.json({ synced: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 400 },
    );
  }
}
