export const TUTORIAL_KEY = "edspire_tutorial_done";

export const shouldShowTutorial = () => {
  try { return localStorage.getItem(TUTORIAL_KEY) !== "1"; } catch { return false; }
};

export const resetTutorial = () => {
  try { localStorage.removeItem(TUTORIAL_KEY); } catch {}
};

export const completeTutorial = () => {
  try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
};
