"use client";

import type { DeckKeyConfig, ObsSnapshot } from "@/lib/types";

function isActive(action: DeckKeyConfig["action"], snapshot: ObsSnapshot): boolean {
  switch (action.kind) {
    case "toggle-source": {
      const item = snapshot.sceneItems[action.sceneName]?.find(
        (i) => i.sourceName === action.sourceName
      );
      return !!item?.sceneItemEnabled;
    }
    case "switch-scene":
      return snapshot.currentScene === action.sceneName;
    case "toggle-record":
      return snapshot.recording;
    case "toggle-stream":
      return snapshot.streaming;
    default:
      return false;
  }
}

function actionSubtitle(action: DeckKeyConfig["action"]): string {
  switch (action.kind) {
    case "toggle-source":
      return action.sceneName;
    case "switch-scene":
      return "scene";
    case "toggle-mute":
      return "mute";
    case "toggle-record":
      return "record";
    case "toggle-stream":
      return "stream";
  }
}

export default function DeckKey({
  config,
  snapshot,
  onPress,
  onEdit,
  editing,
}: {
  config: DeckKeyConfig;
  snapshot: ObsSnapshot;
  onPress: () => void;
  onEdit: () => void;
  editing: boolean;
}) {
  const active = isActive(config.action, snapshot);

  return (
    <button
      onClick={editing ? onEdit : onPress}
      className={[
        "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border px-2 text-center transition-colors",
        "shadow-key active:shadow-keyActive",
        active
          ? "border-live/60 bg-live/10"
          : "border-key-border bg-key hover:bg-key-hover",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-live" />
      ) : null}
      <span className="font-mono text-sm font-medium leading-tight text-ink">
        {config.label}
      </span>
      <span className="font-mono text-[10px] text-ink-faint">
        {actionSubtitle(config.action)}
      </span>
      {editing ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-panel/80 font-sans text-xs text-ink-muted opacity-0 group-hover:opacity-100">
          Edit
        </span>
      ) : null}
    </button>
  );
}
