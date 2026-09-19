"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ObsClient } from "@/lib/obsClient";
import {
  loadConnectionSettings,
  saveConnectionSettings,
  loadDeckKeys,
  saveDeckKeys,
} from "@/lib/storage";
import type {
  ConnectionSettings,
  DeckKeyConfig,
  ObsSnapshot,
} from "@/lib/types";
import ConnectionPanel from "./ConnectionPanel";
import DeckKeyButton from "./DeckKey";
import KeyEditor from "./KeyEditor";

type Status = "idle" | "connecting" | "connected" | "error";

const emptySnapshot: ObsSnapshot = {
  currentScene: null,
  scenes: [],
  sceneItems: {},
  streaming: false,
  recording: false,
  mutedInputs: {},
};

export default function Deck() {
  const clientRef = useRef<ObsClient | null>(null);
  const [settings, setSettings] = useState<ConnectionSettings>({
    url: "",
    password: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [snapshot, setSnapshot] = useState<ObsSnapshot>(emptySnapshot);
  const [keys, setKeys] = useState<DeckKeyConfig[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<DeckKeyConfig | "new" | null>(
    null,
  );

  useEffect(() => {
    setSettings(loadConnectionSettings());
    setKeys(loadDeckKeys());
  }, []);

  useEffect(() => {
    clientRef.current = new ObsClient({
      onStatusChange: (s, message) => {
        setStatus(s);
        setErrorMessage(message);
      },
      onSnapshot: setSnapshot,
    });
    return () => {
      clientRef.current?.disconnect().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    const muteInputs = keys.flatMap((k) =>
      k.action.kind === "toggle-mute" ? [k.action.inputName] : [],
    );
    clientRef.current?.syncMuteStates(muteInputs).catch(() => {});
  }, [status, keys]);

  const handleConnect = useCallback(async (next: ConnectionSettings) => {
    saveConnectionSettings(next);
    try {
      await clientRef.current?.connect(next.url.trim(), next.password);
    } catch {
      // status already surfaced via onStatusChange
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    clientRef.current?.disconnect().catch(() => {});
  }, []);

  const handlePress = useCallback((config: DeckKeyConfig) => {
    clientRef.current?.runAction(config.action).catch((err) => {
      console.error("Action failed:", err);
    });
  }, []);

  function persistKeys(next: DeckKeyConfig[]) {
    setKeys(next);
    saveDeckKeys(next);
  }

  function handleSaveKey(config: DeckKeyConfig) {
    const exists = keys.some((k) => k.id === config.id);
    persistKeys(
      exists
        ? keys.map((k) => (k.id === config.id ? config : k))
        : [...keys, config],
    );
    setEditingKey(null);
  }

  function handleDeleteKey(id: string) {
    persistKeys(keys.filter((k) => k.id !== id));
    setEditingKey(null);
  }

  const connected = status === "connected";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-ink">
            Welcome to OUSIDECK Dashboard
          </h1>
          <p className="text-sm text-ink-muted">Remote control for OBS</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={() => setEditing((v) => !v)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm",
                editing
                  ? "border-live bg-live/10 text-live"
                  : "border-key-border text-ink-muted hover:bg-key-hover",
              ].join(" ")}
            >
              {editing ? "Done" : "Edit layout"}
            </button>
          ) : null}
        </div>
      </header>

      <ConnectionPanel
        settings={settings}
        status={status}
        errorMessage={errorMessage}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onChange={setSettings}
      />

      {connected ? (
        <>
          <div className="flex items-center gap-4 rounded-lg border border-key-border bg-panel-raised px-4 py-3 text-sm">
            <span className="text-ink-muted">Scene</span>
            <span className="font-mono text-ink">
              {snapshot.currentScene ?? "—"}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-ink-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${snapshot.recording ? "bg-live" : "bg-ink-faint"}`}
              />
              REC
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${snapshot.streaming ? "bg-live" : "bg-ink-faint"}`}
              />
              LIVE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {keys.map((config) => (
              <DeckKeyButton
                key={config.id}
                config={config}
                snapshot={snapshot}
                editing={editing}
                onPress={() => handlePress(config)}
                onEdit={() => setEditingKey(config)}
              />
            ))}

            {editing ? (
              <button
                onClick={() => setEditingKey("new")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-key-border text-ink-faint hover:border-live/60 hover:text-live"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="font-mono text-[10px]">add key</span>
              </button>
            ) : null}
          </div>

          {keys.length === 0 && !editing ? (
            <p className="text-center text-sm text-ink-faint">
              No keys yet. Tap "Edit layout" to add your first one.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-ink-faint">
          Connect to your tunneled OBS WebSocket address to load scenes and
          sources.
        </p>
      )}

      {editingKey ? (
        <KeyEditor
          snapshot={snapshot}
          initial={editingKey === "new" ? null : editingKey}
          onSave={handleSaveKey}
          onDelete={
            editingKey !== "new"
              ? () => handleDeleteKey(editingKey.id)
              : undefined
          }
          onClose={() => setEditingKey(null)}
        />
      ) : null}
    </div>
  );
}
