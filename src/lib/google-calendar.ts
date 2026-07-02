import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

const SETTINGS_KEY = "google_oauth_tokens";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export async function saveTokens(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}) {
  const supabase = createAdminClient();

  // Google only returns refresh_token on the first consent; merge with
  // whatever we already have so re-authorizing doesn't wipe it out.
  const { data: existing } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  const merged = { ...(existing?.value ?? {}), ...tokens };
  if (!merged.refresh_token && existing?.value?.refresh_token) {
    merged.refresh_token = existing.value.refresh_token;
  }

  await supabase
    .from("app_settings")
    .upsert({ key: SETTINGS_KEY, value: merged, updated_at: new Date().toISOString() });
}

export async function getAuthenticatedClient() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (!data?.value?.refresh_token) return null;

  const client = getOAuthClient();
  client.setCredentials({
    access_token: data.value.access_token,
    refresh_token: data.value.refresh_token,
    expiry_date: data.value.expiry_date,
  });

  client.on("tokens", (tokens) => {
    saveTokens(tokens);
  });

  return client;
}

export async function isCalendarConnected() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  return Boolean(data?.value?.refresh_token);
}

export async function syncCalendarEvents() {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Google Calendar is not connected");

  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 7);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 30);

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const supabase = createAdminClient();
  let count = 0;

  for (const event of data.items ?? []) {
    if (!event.id || event.status === "cancelled") continue;
    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;
    if (!start || !end) continue;

    await supabase.from("calendar_events").upsert(
      {
        google_event_id: event.id,
        title: event.summary ?? "(no title)",
        starts_at: start,
        ends_at: end,
        location: event.location ?? null,
        attendees: event.attendees ?? [],
        synced_at: new Date().toISOString(),
        source: "google",
      },
      { onConflict: "google_event_id" },
    );
    count += 1;
  }

  return count;
}
