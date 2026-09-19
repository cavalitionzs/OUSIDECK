"use client";

import { useState } from "react";
import type { DeckKeyConfig, KeyAction, ObsSnapshot } from "@/lib/types";

export default function KeyEditor({
  snapshot,
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  snapshot: ObsSnapshot;
  initial: DeckKeyConfig | null;
  onSave: (config: DeckKeyConfig) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [kind, setKind] = useState<KeyAction["kind"]>(initial?.action.kind ?? "toggle-source");
  const [sceneName, setSceneName] = useState(
    initial?.action.kind === "toggle-source" || initial?.action.kind === "switch-scene"
      ? initial.action.sceneName
      : snapshot.currentScene ?? snapshot.scenes[0] ?? ""
  );
  const [sourceName, setSourceName] = useState(
    initial?.action.kind === "toggle-source" ? initial.action.sourceName : ""
  );

  const sourcesForScene = snapshot.sceneItems[sceneName] ?? [];

  function buildAction(): KeyAction {
    switch (kind) {
      case "toggle-source":
        return { kind, sceneName, sourceName };
      case "switch-scene":
        return { kind, sceneName };
      case "toggle-record":
        return { kind };
      case "toggle-stream":
        return { kind };
      case "toggle-mute":
        return { kind, inputName: sourceName };
    }
  }

  function handleSave() {
    if (!label.trim()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      label: label.trim(),
      action: buildAction(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-key-border bg-panel-raised p-5">
        <h2 className="font-sans text-sm font-semibold text-ink">
          {initial ? "Edit key" : "New key"}
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Label</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Webcam"
              className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-live"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Action</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as KeyAction["kind"])}
              className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink focus:border-live"
            >
              <option value="toggle-source">Show / hide source</option>
              <option value="switch-scene">Switch scene</option>
              <option value="toggle-mute">Mute / unmute audio input</option>
              <option value="toggle-record">Start / stop recording</option>
              <option value="toggle-stream">Start / stop streaming</option>
            </select>
          </label>

          {(kind === "toggle-source" || kind === "switch-scene") && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-muted">Scene</span>
              <select
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink focus:border-live"
              >
                {snapshot.scenes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === "toggle-source" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-muted">Source</span>
              <select
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink focus:border-live"
              >
                <option value="" disabled>
                  Select a source
                </option>
                {sourcesForScene.map((s) => (
                  <option key={s.sceneItemId} value={s.sourceName}>
                    {s.sourceName}
                  </option>
                ))}
              </select>
            </label>
          )}

          {kind === "toggle-mute" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-muted">Input name</span>
              <input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Mic/Aux"
                className="rounded-md border border-key-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-live"
              />
            </label>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="rounded-md border border-key-border px-3 py-2 text-sm text-live hover:bg-key-hover"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-key-border px-3 py-2 text-sm text-ink-muted hover:bg-key-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!label.trim() || (kind === "toggle-source" && !sourceName)}
              className="rounded-md bg-live px-3 py-2 text-sm font-medium text-panel disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
