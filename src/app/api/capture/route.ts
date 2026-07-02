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

async function executeAction(
  action: Action,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  switch (action.type) {
    case "create_task": {
      let domain_id = (action.domain_id as string) || null;
      if (!domain_id) domain_id = await getInboxDomainId(supabase);
      await supabase.from("tasks").insert({
        title: action.title,
        domain_id,
        project_id: (action.project_id as string) || null,
        due_date: (action.due_date as string) || null,
        due_time: (action.due_time as string) || null,
        priority: (action.priority as string) || null,
        source: "voice",
      });
      return `Added task "${action.title}"`;
    }
    case "complete_task": {
      await supabase
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", action.task_id);
      return "Marked task complete";
    }
    case "create_project": {
      await supabase.from("projects").insert({
        name: action.name,
        domain_id: action.domain_id,
        target_date: (action.target_date as string) || null,
      });
      return `Created project "${action.name}"`;
    }
    case "update_project_status": {
      await supabase
        .from("projects")
        .update({
          status: action.status,
          completed_at: action.status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", action.project_id);
      return `Updated project status to ${action.status}`;
    }
    case "log_activity": {
      await supabase.from("activity_log").insert({
        project_id: action.project_id,
        entry: action.entry,
        hours_logged: (action.hours_logged as number) ?? null,
        source: "voice",
      });
      return "Logged activity";
    }
    case "update_milestone": {
      await supabase
        .from("milestones")
        .update({
          status: action.status,
          completed_at: action.status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", action.milestone_id);
      return `Updated milestone to ${action.status}`;
    }
    case "create_calendar_event": {
      await supabase.from("calendar_events").insert({
        title: action.title,
        starts_at: action.start,
        ends_at: action.end,
        location: (action.location as string) || null,
        source: "manual",
      });

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
      return `Created calendar event "${action.title}"`;
    }
    default:
      return `Unrecognized action: ${action.type}`;
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
      results.push(await executeAction(action, supabase));
    } catch (err) {
      results.push(`Failed: ${action.type} (${err instanceof Error ? err.message : "error"})`);
    }
  }

  return NextResponse.json({ message: results.join(". ") || "Nothing to do" });
}
