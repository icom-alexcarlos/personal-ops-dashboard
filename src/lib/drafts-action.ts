/**
 * Source for the Drafts action's Script step. Rendered verbatim on the
 * Settings page so it can be copied straight onto the device running Drafts.
 *
 * Kept free of backticks and ${...} so it needs no escaping in this literal --
 * edit it as plain JavaScript.
 */
export const DRAFTS_ACTION_SCRIPT = `// "Capture to Dashboard" -- Drafts action, Script step.
// Untagged drafts are parsed into tasks/projects/events. Drafts tagged
// "journal" are appended to that day's daily log instead.

const JOURNAL_TAG = "journal";

const run = function () {
  const credential = Credential.create(
    "Personal Ops Dashboard",
    "Dashboard URL and capture token"
  );
  credential.addTextField("baseUrl", "Dashboard URL (no trailing slash)");
  credential.addPasswordField("token", "Capture token");
  if (!credential.authorize()) {
    context.cancel("Dashboard credentials are required.");
    return;
  }

  const body = draft.content.trim();
  if (!body) {
    context.cancel("Draft is empty.");
    return;
  }

  const pad = function (n) {
    return n < 10 ? "0" + n : "" + n;
  };
  const now = new Date();
  const tags = draft.tags;

  const http = HTTP.create();
  const response = http.request({
    url: credential.getValue("baseUrl") + "/api/capture",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + credential.getValue("token"),
      "Content-Type": "application/json"
    },
    data: {
      text: body,
      source: "drafts",
      mode: tags.indexOf(JOURNAL_TAG) === -1 ? "parse" : "journal",
      // Lets the dashboard ignore a re-send of an unchanged draft.
      external_id: draft.uuid,
      tags: tags,
      // Device-local date/time: the server runs in UTC and would otherwise
      // roll the daily log over in the evening.
      entry_date:
        now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()),
      entry_time: pad(now.getHours()) + ":" + pad(now.getMinutes())
    }
  });

  if (response.success) {
    let message = "Captured";
    try {
      const parsed = JSON.parse(response.responseText);
      message = parsed.spoken_confirmation || parsed.message || message;
      if (parsed.deduplicated) {
        message = message + " (already sent)";
      }
    } catch (e) {
      // Non-JSON success body: the generic confirmation is good enough.
    }
    app.displaySuccessMessage(message);
    return;
  }

  if (response.statusCode === 401) {
    // Forget the stored token so the next run prompts for a fresh one.
    credential.forget();
    context.fail("Capture token rejected -- generate a new one in Settings.");
    return;
  }
  if (response.statusCode === 429) {
    context.fail("Rate limit exceeded -- try again shortly.");
    return;
  }
  context.fail("Capture failed (" + response.statusCode + ").");
};

run();
`;
