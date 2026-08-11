import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anthropic } from "@/lib/anthropic";
import { buildSystemPrompt, type ParserContext } from "@/lib/voice-parser";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCaptureToken } from "@/lib/capture-tokens";
import { contentHash, findReceipt, saveReceipt } from "@/lib/capture-receipts";
import { appendJournalSegment, resolveEntryDate, resolveEntryTime } from "@/lib/journal";
import { getAuthenticatedClient } from "@/lib/google-calendar";
import { google } from "googleapis";

// Sources that carry their own provenance value through to created rows.
// Everything else predates the source column widening and stays 'voice'.
function rowSourceFor(captureSource: string) {
  return captureSource === "drafts" ? "drafts" : "voice";
}

// Dictated captures come from the in-app mic and phone shortcuts; Drafts and
// anything else that posts typed text gets the text-shaped parser prompt.
function inputKindFor(captureSource: string): "speech" | "text" {
  return captureSource === "drafts" ? "text" : "speech";
}

async function getInboxDomainId(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("stewardship_domains")
    .select("id")
    .eq("is_system", true)
    .single();
  return data?.id as string;
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

type Action = Record<string, unknown> & { type: string };
type ActionResult = { message: string; undo?: Record<string, unknown> };

async function executeAction(
  action: Action,
  supabase: SupabaseClient,
  captureSource: string,
): Promise<ActionResult> {
  switch (action.type) {
    case "create_task": {
      let domain_id = (action.domain_id as string) || null;
      if (!domain_id) domain_id = await getInboxDomainId(supabase);
      const { data } = await supabase
        .from("tasks")
        .insert({
          title: action.title,
          notes: (action.notes as string) || null,
          domain_id,
          project_id: (action.project_id as string) || null,
          due_date: (action.due_date as string) || null,
          due_time: (action.due_time as string) || null,
          priority: (action.priority as string) || null,
          source: rowSourceFor(captureSource),
        })
        .select("id")
        .single();
      return {
        message: `Added task "${action.title}"`,
        undo: { type: "delete_task", id: data?.id },
      };
    }
    case "complete_task": {
      await supabase
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", action.task_id);
      return {
        message: "Marked task complete",
        undo: { type: "reopen_task", id: action.task_id },
      };
    }
    case "create_project": {
      const { data } = await supabase
        .from("projects")
        .insert({
          name: action.name,
          domain_id: action.domain_id,
          target_date: (action.target_date as string) || null,
        })
        .select("id")
        .single();
      return {
        message: `Created project "${action.name}"`,
        undo: { type: "delete_project", id: data?.id },
      };
    }
    case "update_project_status": {
      const { data: prior } = await supabase
        .from("projects")
        .select("status")
        .eq("id", action.project_id)
        .single();
      await supabase
        .from("projects")
        .update({
          status: action.status,
          completed_at: action.status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", action.project_id);
      return {
        message: `Updated project status to ${action.status}`,
        undo: {
          type: "set_project_status",
          id: action.project_id,
          status: prior?.status ?? "active",
        },
      };
    }
    case "log_activity": {
      const { data } = await supabase
        .from("activity_log")
        .insert({
          project_id: action.project_id,
          entry: action.entry,
          hours_logged: (action.hours_logged as number) ?? null,
          source: rowSourceFor(captureSource),
        })
        .select("id")
        .single();
      return {
        message: "Logged activity",
        undo: { type: "delete_activity_log", id: data?.id },
      };
    }
    case "update_milestone": {
      const { data: prior } = await supabase
        .from("milestones")
        .select("status")
        .eq("id", action.milestone_id)
        .single();
      await supabase
        .from("milestones")
        .update({
          status: action.status,
          completed_at: action.status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", action.milestone_id);
      return {
        message: `Updated milestone to ${action.status}`,
        undo: {
          type: "set_milestone_status",
          id: action.milestone_id,
          status: prior?.status ?? "pending",
        },
      };
    }
    case "create_calendar_event": {
      const { data } = await supabase
        .from("calendar_events")
        .insert({
          title: action.title,
          starts_at: action.start,
          ends_at: action.end,
          location: (action.location as string) || null,
          source: "manual",
        })
        .select("id")
        .single();

      const googleAuth = await getAuthenticatedClient();
      if (googleAuth) {
        const calendar = google.calendar({ version: "v3", auth: googleAuth });
        await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: action.title as string,
            start: { dateTime: action.start as string },
            end: { dateTime: action.end as string },
            location: (action.location as string) || undefined,
          },
        });
      }
      return {
        message: `Created calendar event "${action.title}"`,
        undo: { type: "delete_calendar_event", id: data?.id },
      };
    }
    default:
      return { message: `Unrecognized action: ${action.type}` };
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  // "transcript" is what the iOS shortcut sends; "text" is the natural name
  // for typed captures out of Drafts. Both mean the same thing here.
  const text = (body.text ?? body.transcript) as unknown;
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const source = typeof body.source === "string" ? body.source : "in_app";
  const mode = body.mode === "journal" ? "journal" : "parse";
  const externalId = typeof body.external_id === "string" ? body.external_id : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];

  // Two auth paths: a capture token from a mobile shortcut or Drafts action,
  // or the logged-in browser session for the in-app mic.
  let supabase: SupabaseClient;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const result = await validateCaptureToken(authHeader.slice(7).trim());
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === "rate_limited" ? "Rate limit exceeded" : "Invalid token" },
        { status: result.reason === "rate_limited" ? 429 : 401 },
      );
    }
    supabase = createAdminClient();
  } else {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    supabase = sessionClient;
  }

  // Replay an identical re-send instead of doing the work twice. Only clients
  // that identify the capture (Drafts sends the draft UUID) can opt in.
  const hash = externalId ? contentHash(text, mode) : null;
  if (externalId && hash) {
    const prior = await findReceipt(supabase, source, externalId, hash);
    if (prior) return NextResponse.json({ ...prior, deduplicated: true });
  }

  const respond = async (payload: Record<string, unknown>) => {
    if (externalId && hash) await saveReceipt(supabase, source, externalId, hash, payload);
    return NextResponse.json(payload);
  };

  if (mode === "journal") {
    const entryDate = resolveEntryDate(body.entry_date);
    const { appended } = await appendJournalSegment(supabase, {
      source: rowSourceFor(source),
      entryDate,
      entryTime: resolveEntryTime(body.entry_time),
      text,
      tags: Array.from(new Set(["daily", source, ...tags])),
    });

    const message = `${appended ? "Appended to" : "Started"} the ${entryDate} daily log`;
    await supabase.from("notifications").insert({
      type: "journal_entry",
      title: message,
      body: text,
      source_ref: externalId ? `${source}:${externalId}` : source,
    });

    return respond({ message, spoken_confirmation: message, entry_date: entryDate });
  }

  const [{ data: domains }, { data: projects }, { data: openTasks }, { data: milestones }] =
    await Promise.all([
      supabase.from("stewardship_domains").select("id, name").eq("active", true),
      supabase.from("projects").select("id, name, domain_id").eq("status", "active"),
      supabase.from("tasks").select("id, title, project_id").eq("status", "open").limit(100),
      supabase.from("milestones").select("id, title, project_id").neq("status", "done").limit(100),
    ]);

  const context: ParserContext = {
    now: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    domains: domains ?? [],
    projects: projects ?? [],
    openTasks: openTasks ?? [],
    milestones: milestones ?? [],
    source,
    inputKind: inputKindFor(source),
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: buildSystemPrompt(context),
    messages: [{ role: "user", content: text }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Parser returned no text" }, { status: 502 });
  }

  let parsed: {
    actions?: Action[];
    needs_disambiguation?: boolean;
    question?: string;
    candidates?: unknown[];
    error?: string;
  };
  try {
    parsed = extractJson(textBlock.text);
  } catch {
    return NextResponse.json({ error: "Could not parse response", raw: textBlock.text }, { status: 502 });
  }

  if (parsed.error) {
    return NextResponse.json({
      message: parsed.error,
      spoken_confirmation: parsed.error,
      transcript: text,
    });
  }

  // No receipt on the two inconclusive outcomes below: re-sending the draft
  // should get another go at parsing rather than replaying "I wasn't sure".
  if (parsed.needs_disambiguation) {
    await supabase.from("pending_captures").insert({
      raw_transcript: text,
      source: context.source,
      parsed_intent: parsed,
      candidates: parsed.candidates ?? [],
      status: "pending",
    });
    const msg = parsed.question || "I wasn't sure what you meant -- saved for later review.";
    return NextResponse.json({ message: msg, spoken_confirmation: msg });
  }

  const results: string[] = [];
  for (const action of parsed.actions ?? []) {
    try {
      const { message, undo } = await executeAction(action, supabase, source);
      results.push(message);
      await supabase.from("notifications").insert({
        type: action.type,
        title: message,
        body: text,
        source_ref: externalId ? `${source}:${externalId}` : source,
        undo_payload: undo ?? null,
      });
    } catch (err) {
      results.push(`Failed: ${action.type} (${err instanceof Error ? err.message : "error"})`);
    }
  }

  const summary = results.join(". ") || "Nothing to do";
  return respond({ message: summary, spoken_confirmation: summary });
}
