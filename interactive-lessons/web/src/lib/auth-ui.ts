export type AuthTab = "in" | "up";
type State = { open: boolean; tab: AuthTab };
let state: State = { open: false, tab: "in" };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeAuthUi = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getAuthUi = () => state;
/** Open the one shared sign-in dialog (mounted once per page by Overlays). */
export const openAuth = (tab: AuthTab = "in") => { state = { open: true, tab }; emit(); };
export const closeAuth = () => { state = { ...state, open: false }; emit(); };
