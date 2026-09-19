"use client";

import OBSWebSocket from "obs-websocket-js";
import type { KeyAction, ObsSnapshot, SceneItem } from "./types";

export type ObsClientEvents = {
  onStatusChange?: (status: "idle" | "connecting" | "connected" | "error", message?: string) => void;
  onSnapshot?: (snapshot: ObsSnapshot) => void;
};

/**
 * Thin wrapper around obs-websocket-js (protocol v5) that:
 *  - connects to a remote OBS instance (e.g. via a Cloudflare/ngrok tunnel)
 *  - pulls the current scene/source state
 *  - keeps that state in sync by listening to OBS events
 *  - exposes helpers for the actions a deck key can trigger
 */
export class ObsClient {
  private obs: OBSWebSocket;
  private events: ObsClientEvents;
  private snapshot: ObsSnapshot = {
    currentScene: null,
    scenes: [],
    sceneItems: {},
    streaming: false,
    recording: false,
    mutedInputs: {},
  };

  constructor(events: ObsClientEvents = {}) {
    this.obs = new OBSWebSocket();
    this.events = events;
    this.registerEventListeners();
  }

  private registerEventListeners() {
    this.obs.on("CurrentProgramSceneChanged", ({ sceneName }) => {
      this.snapshot.currentScene = sceneName;
      this.emitSnapshot();
      // scene items for the newly active scene may not be cached yet
      this.refreshSceneItems(sceneName).catch(() => {});
    });

    this.obs.on("SceneItemEnableStateChanged", ({ sceneName, sceneItemId, sceneItemEnabled }) => {
      const items = this.snapshot.sceneItems[sceneName];
      if (!items) return;
      const item = items.find((i) => i.sceneItemId === sceneItemId);
      if (item) item.sceneItemEnabled = sceneItemEnabled;
      this.emitSnapshot();
    });

    this.obs.on("StreamStateChanged", ({ outputActive }) => {
      this.snapshot.streaming = outputActive;
      this.emitSnapshot();
    });

    this.obs.on("RecordStateChanged", ({ outputActive }) => {
      this.snapshot.recording = outputActive;
      this.emitSnapshot();
    });

    this.obs.on("InputMuteStateChanged", ({ inputName, inputMuted }) => {
      this.snapshot.mutedInputs = { ...this.snapshot.mutedInputs, [inputName]: inputMuted };
      this.emitSnapshot();
    });

    this.obs.on("ConnectionClosed", () => {
      this.events.onStatusChange?.("idle", "Connection closed");
    });
  }

  private emitSnapshot() {
    this.events.onSnapshot?.({ 
      ...this.snapshot, 
      sceneItems: { ...this.snapshot.sceneItems },
      mutedInputs: { ...this.snapshot.mutedInputs },
    });
  }

  async connect(url: string, password: string) {
    this.events.onStatusChange?.("connecting");
    try {
      await this.obs.connect(url, password || undefined);
      await this.loadFullState();
      this.events.onStatusChange?.("connected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      this.events.onStatusChange?.("error", message);
      throw err;
    }
  }

  async disconnect() {
    await this.obs.disconnect();
    this.events.onStatusChange?.("idle");
  }

  private async loadFullState() {
    const [{ scenes, currentProgramSceneName }, { outputActive: streaming }, { outputActive: recording }] =
      await Promise.all([
        this.obs.call("GetSceneList"),
        this.obs.call("GetStreamStatus"),
        this.obs.call("GetRecordStatus"),
      ]);

    const sceneNames = (scenes as Array<{ sceneName: string }>).map((s) => s.sceneName).reverse();
    this.snapshot.scenes = sceneNames;
    this.snapshot.currentScene = currentProgramSceneName;
    this.snapshot.streaming = streaming;
    this.snapshot.recording = recording;

    await Promise.all(sceneNames.map((name) => this.refreshSceneItems(name)));
    this.emitSnapshot();
  }
  
  /**
   * Reads the mute state of the given inputs (the ones used by mute keys).
   * Looking inputs up by name also works for OBS's global audio devices
   * such as "Mic/Aux" and "Desktop Audio".
   */
  async syncMuteStates(inputNames: string[]) {
    const unique = Array.from(new Set(inputNames.map((n) => n.trim()).filter(Boolean)));
    const results = await Promise.all(
      unique.map(async (inputName) => {
        try {
          const { inputMuted } = await this.obs.call("GetInputMute", { inputName });
          return [inputName, inputMuted] as const;
        } catch (err) {
          console.warn(
            `[OUSIDECK] Could not read mute state for input "${inputName}". ` +
              `Check that the name matches the Audio Mixer in OBS exactly.`,
            err
          );
          return null;
        }
      })
    );
    const next = { ...this.snapshot.mutedInputs };
    for (const r of results) if (r) next[r[0]] = r[1];
    this.snapshot.mutedInputs = next;
    this.emitSnapshot();
  }

  private async refreshSceneItems(sceneName: string) {
    try {
      const { sceneItems } = await this.obs.call("GetSceneItemList", { sceneName });
      const items: SceneItem[] = (sceneItems as any[]).map((i) => ({
        sceneItemId: i.sceneItemId,
        sourceName: i.sourceName,
        sceneItemEnabled: i.sceneItemEnabled,
      }));
      this.snapshot.sceneItems[sceneName] = items;
      this.emitSnapshot();
    } catch {
      // scene may not exist yet / not readable — ignore, UI will just show it empty
    }
  }

  getSnapshot(): ObsSnapshot {
    return this.snapshot;
  }

  async runAction(action: KeyAction) {
    switch (action.kind) {
      case "toggle-source": {
        const items = this.snapshot.sceneItems[action.sceneName] || [];
        const item = items.find((i) => i.sourceName === action.sourceName);
        if (!item) throw new Error(`Source "${action.sourceName}" not found in "${action.sceneName}"`);
        await this.obs.call("SetSceneItemEnabled", {
          sceneName: action.sceneName,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: !item.sceneItemEnabled,
        });
        break;
      }
      case "switch-scene": {
        await this.obs.call("SetCurrentProgramScene", { sceneName: action.sceneName });
        break;
      }
      case "toggle-mute": {
        await this.obs.call("ToggleInputMute", { inputName: action.inputName });
        break;
      }
      case "toggle-record": {
        if (this.snapshot.recording) {
          await this.obs.call("StopRecord");
        } else {
          await this.obs.call("StartRecord");
        }
        break;
      }
      case "toggle-stream": {
        if (this.snapshot.streaming) {
          await this.obs.call("StopStream");
        } else {
          await this.obs.call("StartStream");
        }
        break;
      }
    }
  }
}
