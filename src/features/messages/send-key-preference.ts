import { useSyncExternalStore } from "react";

const preferenceKey = "buzz-enter-inserts-new-line.v1";
const changedEvent = "buzz-enter-inserts-new-line-changed";
let unsavedPreference: boolean | undefined;

/** Device-local: when on, Enter starts a new line and ⌘/Ctrl+Enter sends. */
export function enterInsertsNewLine(): boolean {
  if (unsavedPreference !== undefined) return unsavedPreference;
  try {
    return localStorage.getItem(preferenceKey) === "on";
  } catch {
    return false;
  }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    unsavedPreference = undefined;
    listener();
  };
  window.addEventListener(changedEvent, listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(changedEvent, listener);
    window.removeEventListener("storage", storage);
  };
}
export function useEnterInsertsNewLine() {
  return useSyncExternalStore(subscribe, enterInsertsNewLine);
}
export function setEnterInsertsNewLine(enabled: boolean): string | null {
  let error: string | null = null;
  unsavedPreference = enabled;
  try {
    localStorage.setItem(preferenceKey, enabled ? "on" : "off");
    unsavedPreference = undefined;
  } catch {
    error =
      "This choice is active, but could not be saved on this device. Try again.";
  }
  window.dispatchEvent(new Event(changedEvent));
  return error;
}

/** Whether a composer keydown sends under the current Enter preference. */
export function sendsMessage(
  event: Pick<
    KeyboardEvent,
    "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey"
  >,
  newLine: boolean,
) {
  if (event.key !== "Enter" || event.shiftKey || event.altKey) return false;
  return newLine === (event.ctrlKey || event.metaKey);
}
