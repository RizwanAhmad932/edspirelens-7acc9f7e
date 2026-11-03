import { supabase } from "@/integrations/supabase/client";
/**
 * Global, date-based spaced-repetition deck (SM-2 style).
 * Every flashcard the user sees in any lecture is registered here so it can be
 * reviewed later from a single "Due Today" deck.
 */
export interface SrsCard {
  id: string;
  front: string;
  back: string;
  topic?: string;
  deck: string;
  ease: number;      // SM-2 ease factor
  interval: number;  // days
  reps: number;
  due: number;       // epoch ms
  updated?: number;  // epoch ms, for cloud merge
}

export type SrsRating = "again" | "hard" | "good" | "easy";

const KEY = "srs-global-v1";
const DAY = 86_400_000;
const EVENT = "srs-global-change";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function loadDeck(): Record<string, SrsCard> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; }
}

const dirty = new Set<string>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function markDirty(ids: string[]) {
  ids.forEach((i) => dirty.add(i));
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushDirty, 1500);
}

async function pushDirty() {
  if (!dirty.size) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const d = loadDeck();
  const ids = [...dirty]; dirty.clear();
  const rows = ids.filter((i) => d[i]).map((i) => ({ user_id: user.id, card_id: i, data: d[i] as never, updated_at: new Date(d[i].updated || Date.now()).toISOString() }));
  if (!rows.length) return;
  const { error } = await supabase.from("srs_cards").upsert(rows);
  if (error) ids.forEach((i) => dirty.add(i));
}

/** Pull cloud cards, merge (newest wins), push local-only/newer cards. */
export async function syncDeck() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase.from("srs_cards").select("card_id,data").eq("user_id", user.id);
  if (error) return;
  const local = loadDeck();
  const remote: Record<string, SrsCard> = {};
  (data || []).forEach((r) => { remote[r.card_id] = r.data as unknown as SrsCard; });
  const toPush: string[] = [];
  let changed = false;
  for (const [id, rc] of Object.entries(remote)) {
    const lc = local[id];
    if (!lc || (rc.updated || 0) > (lc.updated || 0)) { local[id] = rc; changed = true; }
    else if ((lc.updated || 0) > (rc.updated || 0)) toPush.push(id);
  }
  for (const id of Object.keys(local)) if (!remote[id]) toPush.push(id);
  if (changed) saveDeck(local, []);
  if (toPush.length) { toPush.forEach((i) => dirty.add(i)); await pushDirty(); }
}

let syncStarted = false;
export function startSrsSync() {
  if (syncStarted) return; syncStarted = true;
  supabase.auth.onAuthStateChange((evt) => {
    if (evt === "SIGNED_IN" || evt === "INITIAL_SESSION") setTimeout(() => { void syncDeck(); }, 0);
  });
  window.addEventListener("online", () => { void syncDeck(); });
}

function saveDeck(d: Record<string, SrsCard>, changedIds: string[] = []) {
  if (changedIds.length) markDirty(changedIds);
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage full */ }
  window.dispatchEvent(new Event(EVENT));
}

export function onDeckChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

export const cardId = (front: string) => hash(front.trim().toLowerCase());

/** Add new cards (existing review progress is kept). New cards are due now. */
export function registerCards(deck: string, cards: { front: string; back: string; topic?: string }[]) {
  if (!cards?.length) return;
  const d = loadDeck();
  const added: string[] = [];
  for (const c of cards) {
    if (!c?.front) continue;
    const id = cardId(c.front);
    if (d[id]) continue;
    d[id] = { id, front: c.front, back: c.back, topic: c.topic, deck, ease: 2.5, interval: 0, reps: 0, due: Date.now(), updated: Date.now() };
    added.push(id);
  }
  if (added.length) saveDeck(d, added);
}

export function reviewCard(id: string, rating: SrsRating) {
  const d = loadDeck();
  const c = d[id];
  if (!c) return;
  const q = { again: 1, hard: 3, good: 4, easy: 5 }[rating];
  if (q < 3) { c.reps = 0; c.interval = 0; }
  else {
    c.reps += 1;
    c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round(c.interval * c.ease);
    if (rating === "hard") c.interval = Math.max(1, Math.round(c.interval * 0.6));
    if (rating === "easy") c.interval = Math.round(c.interval * 1.3) + 1;
  }
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  // "Again" comes back in 10 minutes; others on a future day.
  c.due = q < 3 ? Date.now() + 10 * 60_000 : Date.now() + c.interval * DAY;
  c.updated = Date.now();
  saveDeck(d, [id]);
}

export function dueCards(now = Date.now()) {
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  return Object.values(loadDeck())
    .filter((c) => c.due <= endOfToday.getTime())
    .sort((a, b) => a.due - b.due);
}
