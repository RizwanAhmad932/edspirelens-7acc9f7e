# Plan: Major Feature Enhancements & Bug Fixes

## 1. Fix XP Not Increasing
**Problem**: `add_xp` RPC exists but may not be called consistently after quiz attempts.
**Fix**: Audit `QuizPanel.tsx` — ensure `supabase.rpc('add_xp', { _user_id, _amount })` is invoked after each correct answer and quiz completion. Add toast feedback. Refresh profile XP in real-time.

## 2. Fix Profile Not Saving
**Problem**: Profile updates silently fail (likely missing `.select()` or RLS edge case).
**Fix**: In `Profile.tsx`, ensure update uses `auth.uid()` as `id`, awaits properly, surfaces errors. Add explicit upsert fallback.

## 3. Forgot Password with Email OTP
**Flow**:
- "Forgot password?" link on `/auth` → opens dialog with email input
- Use `supabase.auth.signInWithOtp({ email })` to send 6-digit code
- User enters code + new password → verify OTP via `verifyOtp({ type: 'email', token, email })` → then `updateUser({ password })`
- Uses existing Lovable auth email infrastructure (no new templates needed)

## 4. App Tutorial for New Users
- New `TutorialOverlay.tsx` — 5-step guided tour using floating cards pointing to: VideoInput, FloatingLens, AppDrawer, Profile, Analytics
- Triggered on first login (localStorage flag `lens_tutorial_done`)
- "Skip" button + "Next/Prev" navigation
- Replay option in Profile settings

## 5. Diagram-Based MCQ Section
**New panel**: `DiagramQuizPanel.tsx` in FloatingLens
- Edge function action `generate-diagram-quiz`: Gemini Vision extracts diagrams from video frames (uses video thumbnails + key timestamps) → generates labeling MCQs (e.g., "What is part A?")
- Returns: `{ imageUrl, question, labels: [{id, x, y}], options, correct }`
- UI: Renders image with labeled points (A, B, C) over diagram, MCQ below
- Tagged for NEET/Board/JEE exam styles

## 6. Short Notes Section
**New tab in FloatingLens**: "Quick Notes"
- New edge function action `generate-short-notes`: Gemini generates 1-page bullet-point cheat sheet from transcript (≤15 bullets, formula highlights, key terms bold)
- Component: `ShortNotesPanel.tsx` with copy/download buttons

## 7. Enhanced Infographics
- Upgrade `generate-infographic` to use `google/gemini-3-pro-image-preview` with structured prompt: title + 4-6 visual concept cards + chapter name + brand styling
- Add "Regenerate with different style" button (academic/colorful/minimal)

## 8. Better Video AI (YouTube + Gemini)
- Enhance `analyze-video` to extract YouTube video metadata (chapters, description, captions) via oEmbed + youtube transcript
- Pass full metadata + transcript to Gemini for richer context
- Cross-reference timestamps with chapter markers for accuracy

## Database Changes
```sql
-- New table for diagram quiz attempts (analytics)
CREATE TABLE public.diagram_attempts (
  id uuid PK, user_id uuid, analysis_id uuid,
  question text, selected text, correct text,
  is_correct boolean, image_url text, created_at timestamptz
);
-- + GRANTs + RLS (own-data)
```

## Files
- **New**: `TutorialOverlay.tsx`, `DiagramQuizPanel.tsx`, `ShortNotesPanel.tsx`, `ForgotPasswordDialog.tsx`
- **Edit**: `Auth.tsx`, `Profile.tsx`, `QuizPanel.tsx`, `FloatingLens.tsx`, `Index.tsx`, `InfographicPanel.tsx`, `supabase/functions/analyze-video/index.ts`
- **Migration**: `diagram_attempts` table
