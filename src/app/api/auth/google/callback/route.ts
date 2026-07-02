import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, saveTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/today?calendar_error=missing_code", request.url));
  }

  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens);

  return NextResponse.redirect(new URL("/today?calendar_connected=1", request.url));
}
