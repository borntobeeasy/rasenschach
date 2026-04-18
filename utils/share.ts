import { TacticSnapshot } from "@/types/tactics";

export function encodeSnapshot(snapshot: TacticSnapshot) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.btoa(encodeURIComponent(JSON.stringify(snapshot)));
}

export function decodeSnapshot(value: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(window.atob(value));
    return JSON.parse(decoded) as TacticSnapshot;
  } catch {
    return null;
  }
}
