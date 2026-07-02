import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google-calendar";

export async function GET() {
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  return NextResponse.redirect(url);
}
