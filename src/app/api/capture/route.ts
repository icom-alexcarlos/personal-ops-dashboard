import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { buildSystemPrompt, type ParserContext } from "@/lib/voice-parser";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedClient } from "@/lib/google-calendar";
import { google } from "googleapis";

async function getInboxDomainId(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ActionResult> {
  switch (action.type) {
    case "create_task": {
      let domain_id = (action.domain_id as string) || null;
      if (!domain_id) domain_id = await getInboxDomainId(supabase);
      const { data } = await supabase
        .from("tasks")
        .insert({
          title: action.title,
          domain_id,
          project_id: (action.project_id as string) || null,
          due_date: (action.due_date as string) || null,
          due_time: (action.due_time as string) || null,
          priority: (action.priority as string) || null,
          source: "voice",
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
          source: "voice",
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
  const { transcript, source } = await request.json();
  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }

  const supabase = await createClient();

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
    source: source || "in_app",
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: buildSystemPrompt(context),
    messages: [{ role: "user", content: transcript }],
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
    return NextResponse.json({ message: parsed.error, transcript });
  }

  if (parsed.needs_disambiguation) {
    await supabase.from("pending_captures").insert({
      raw_transcript: transcript,
      source: context.source,
      parsed_intent: parsed,
      candidates: parsed.candidates ?? [],
      status: "pending",
    });
    return NextResponse.json({
      message: parsed.question || "I wasn't sure what you meant -- saved for later review.",
    });
  }

  const results: string[] = [];
  for (const action of parsed.actions ?? []) {
    try {
      const { message, undo } = await executeAction(action, supabase);
      results.push(message);
      await supabase.from("notifications").insert({
        type: action.type,
        title: message,
        body: transcript,
        undo_payload: undo ?? null,
      });
    } catch (err) {
      results.push(`Failed: ${action.type} (${err instanceof Error ? err.message : "error"})`);
    }
  }

  return NextResponse.json({ message: results.join(". ") || "Nothing to do" });
}
