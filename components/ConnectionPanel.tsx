"use client";

import { useState } from "react";
import type { ConnectionSettings } from "@/lib/types";

type Status = "idle" | "connecting" | "connected" | "error";

export default function ConnectionPanel({
  settings,
  status,
  errorMessage,
  onConnect,
  onDisconnect,
  onChange,
}: {
  settings: ConnectionSettings;
  status: Status;
  errorMessage?: string;
  onConnect: (settings: ConnectionSettings) => void;
  onDisconnect: () => void;
  onChange: (settings: ConnectionSettings) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const statusMeta: Record<Status, { label: string; dot: string }> = {
    idle: { label: "Not connected", dot: "bg-ink-faint" },
    connecting: { label: "Connecting…", dot: "bg-live animate-pulse" },
    connected: { label: "Connected", dot: "bg-good" },
    error: { label: "Connection failed", dot: "bg-live" },
  };

  return (
    <div className="rounded-lg border border-key-border bg-panel-raised p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusMeta[status].dot}`} />
          <span className="text-sm text-ink-muted">{statusMeta[status].label}</span>
        </div>
        {status === "connected" ? (
          <button
            onClick={onDisconnect}
            className="rounded-md border border-key-border px-3 py-1.5 text-sm text-ink-muted hover:bg-key-hover hover:text-ink"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      {status !== "connected" ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onConnect(settings);
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Tunnel address</span>
            <input
              value={settings.url}
              onChange={(e) => onChange({ ...settings, url: e.target.value })}
              placeholder="wss://your-tunnel.trycloudflare.com"
              className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-live"
              spellCheck={false}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Server password</span>
            <div className="flex gap-2">
              <input
                value={settings.password}
                onChange={(e) => onChange({ ...settings, password: e.target.value })}
                type={showPassword ? "text" : "password"}
                placeholder="Set in OBS → Tools → WebSocket Server Settings"
                className="w-full rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-live"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 rounded-md border border-key-border px-3 text-sm text-ink-muted hover:bg-key-hover"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {status === "error" && errorMessage ? (
            <p className="text-sm text-live">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "connecting" || !settings.url}
            className="mt-1 rounded-md bg-live px-3 py-2 text-sm font-medium text-panel disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "connecting" ? "Connecting…" : "Connect"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
