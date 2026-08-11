"use client";

import { useState } from "react";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-black px-3 py-1 text-xs text-white"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export function DraftsSetup({
  baseUrl,
  script,
}: {
  baseUrl: string;
  script: string;
}) {
  const [showScript, setShowScript] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      <ol className="list-decimal space-y-1.5 pl-5 text-zinc-600">
        <li>Generate a capture token above and keep it on the clipboard.</li>
        <li>
          In Drafts: <span className="font-medium">Actions → + → New Action</span>, name it
          &ldquo;Capture to Dashboard&rdquo;.
        </li>
        <li>
          Add one <span className="font-medium">Script</span> step and paste the script below
          into it.
        </li>
        <li>
          Run it once on any draft. Drafts prompts for the dashboard URL and the token, then
          stores them in its credential keychain — it won&apos;t ask again.
        </li>
      </ol>

      <div>
        <p className="text-xs text-zinc-500">
          Dashboard URL to enter when prompted (no trailing slash — the script appends{" "}
          <code className="rounded bg-zinc-100 px-1">/api/capture</code>)
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 break-all rounded bg-zinc-100 p-2 text-xs">{baseUrl}</code>
          <CopyButton value={baseUrl} label="Copy URL" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowScript((v) => !v)}
          className="rounded border px-3 py-1 text-xs"
        >
          {showScript ? "Hide script" : "Show script"}
        </button>
        <CopyButton value={script} label="Copy script" />
      </div>

      {showScript && (
        <pre className="max-h-96 overflow-auto rounded bg-zinc-900 p-3 text-xs text-zinc-100">
          {script}
        </pre>
      )}

      <p className="text-xs text-zinc-400">
        An untagged draft is parsed into tasks, projects, or calendar events, same as voice
        capture. Tag a draft <code className="rounded bg-zinc-100 px-1">journal</code> and it is
        appended to that day&apos;s daily log instead, alongside the Obsidian note. Re-running
        the action on an unchanged draft does nothing.
      </p>
    </div>
  );
}
