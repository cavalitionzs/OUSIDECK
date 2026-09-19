export type ConnectionSettings = {
  url: string; // e.g. wss://your-tunnel.trycloudflare.com
  password: string;
};

export type KeyAction =
  | { kind: "toggle-source"; sceneName: string; sourceName: string }
  | { kind: "switch-scene"; sceneName: string }
  | { kind: "toggle-mute"; inputName: string }
  | { kind: "toggle-record" }
  | { kind: "toggle-stream" };

export type DeckKeyConfig = {
  id: string;
  label: string;
  action: KeyAction;
};

export type SceneItem = {
  sceneItemId: number;
  sourceName: string;
  sceneItemEnabled: boolean;
};

export type ObsSnapshot = {
  currentScene: string | null;
  scenes: string[];
  sceneItems: Record<string, SceneItem[]>;
  streaming: boolean;
  recording: boolean;
  mutedInputs: Record<string, boolean>; // inputName -> muted?
};
