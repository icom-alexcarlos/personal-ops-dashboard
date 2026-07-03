"use client";

import { useState } from "react";
import { createCaptureToken, revokeCaptureToken } from "./actions";

type TokenRow = {
  id: string;
  label: string;
  device_name: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function TokenManager({ tokens }: { tokens: TokenRow[] }) {
  const [label, setLabel] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token } = await createCaptureToken(label, deviceName);
      setNewToken(token);
      setLabel("");
      setDeviceName("");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {newToken && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium">New token — copy it now, it won&apos;t be shown again:</p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{newToken}</code>
          <button
            onClick={handleCopy}
            className="mt-2 rounded bg-black px-3 py-1 text-xs text-white"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="label" className="block text-xs text-zinc-500">
            Label
          </label>
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="iPhone shortcut"
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="device" className="block text-xs text-zinc-500">
            Device (optional)
          </label>
          <input
            id="device"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Alex's iPhone"
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "Generating..." : "Generate token"}
        </button>
      </form>

      <div className="space-y-2">
        {tokens.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded border p-3 text-sm"
          >
            <div>
              <span className={t.revoked_at ? "text-zinc-400 line-through" : "font-medium"}>
                {t.label}
              </span>
              <div className="text-xs text-zinc-500">
                {t.device_name && `${t.device_name} · `}
                {t.last_used_at
                  ? `last used ${new Date(t.last_used_at).toLocaleString()}`
                  : "never used"}
              </div>
            </div>
            {!t.revoked_at && (
              <button
                onClick={() => revokeCaptureToken(t.id)}
                className="text-xs text-red-600 underline"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
        {tokens.length === 0 && (
          <p className="text-sm text-zinc-400">No capture tokens yet.</p>
        )}
      </div>
    </div>
  );
}
