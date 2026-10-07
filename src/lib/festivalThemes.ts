import republic from "@/assets/festival-republic_day.jpg";
import independence from "@/assets/festival-independence_day.jpg";
import eid from "@/assets/festival-eid.jpg";
import diwali from "@/assets/festival-diwali.jpg";
import dussehra from "@/assets/festival-dussehra.jpg";
import holi from "@/assets/festival-holi.jpg";
import navratri from "@/assets/festival-navratri.jpg";
import christmas from "@/assets/festival-christmas.jpg";
import newYear from "@/assets/festival-new_year.jpg";

export const FESTIVAL_THEMES = [
  { name: "none", label: "Original", greeting: "Edspire Lens", message: "Your learning, in focus.", icon: "◎", art: undefined, motif: "" },
  { name: "republic_day", label: "Republic Day", greeting: "Happy Republic Day", message: "Celebrate knowledge. Shape tomorrow.", icon: "🇮🇳", art: republic, motif: "✦" },
  { name: "independence_day", label: "Independence Day", greeting: "Happy Independence Day", message: "Dream freely. Learn fearlessly.", icon: "🇮🇳", art: independence, motif: "🪁" },
  { name: "eid", label: "Eid", greeting: "Eid Mubarak", message: "A season of kindness, joy and new possibilities.", icon: "🌙", art: eid, motif: "✧" },
  { name: "diwali", label: "Diwali", greeting: "Happy Diwali", message: "Let knowledge light your way.", icon: "🪔", art: diwali, motif: "🪔" },
  { name: "dussehra", label: "Dussehra", greeting: "Happy Dussehra", message: "Overcome every challenge. Keep moving forward.", icon: "🏹", art: dussehra, motif: "✦" },
  { name: "holi", label: "Holi", greeting: "Happy Holi", message: "Bring a little colour to every new idea.", icon: "🎨", art: holi, motif: "✦" },
  { name: "navratri", label: "Navratri", greeting: "Happy Navratri", message: "Nine nights of celebration. Endless possibilities.", icon: "💃", art: navratri, motif: "✧" },
  { name: "christmas", label: "Christmas", greeting: "Merry Christmas", message: "A little wonder. A world of discovery.", icon: "🎄", art: christmas, motif: "❄" },
  { name: "new_year", label: "New Year", greeting: "Happy New Year", message: "New beginnings. Bigger dreams.", icon: "🎉", art: newYear, motif: "✦" },
] as const;

export type ThemeName = typeof FESTIVAL_THEMES[number]["name"];
export type FestivalTheme = typeof FESTIVAL_THEMES[number];
export function normalizeTheme(value: unknown): ThemeName {
  return FESTIVAL_THEMES.find(theme => theme.name === value)?.name ?? "none";
}
export function getFestivalTheme(name: ThemeName) {
  return FESTIVAL_THEMES.find(theme => theme.name === name) ?? FESTIVAL_THEMES[0];
}