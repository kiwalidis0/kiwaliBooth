# KiwaliBooth — Capture Enhancements & Suggestions

Date: 2026-09-25
Scope: Step 2 Capture + related Review / Editor / Export improvements

## 1. Current Feature Inventory

Flow: `Landing -> LayoutSelect -> Capture -> Review -> Editor -> Download` — see `src/App.tsx:22-29`.

- **Layout & Theme (`src/data/layouts.ts:3-54`, `src/components/LayoutSelectScreen.tsx`):**
  Multi-select 1/2/3/4-cut layouts (Polaroid, Double, Triple, Classic), 4 built-in themes + custom colors persisted to `localStorage`, custom overlay URL support in context (`src/context/BoothContext.tsx:91-99`).

- **Capture (`src/components/CaptureScreen.tsx`):**
  `getUserMedia` with `facingMode` / `deviceId` selector (`src/components/CaptureScreen.tsx:82-85`), front/back toggle, mirror toggle, portrait/landscape container toggle (`src/components/CaptureScreen.tsx:370-372`, `src/components/CaptureScreen.tsx:456-460`), 3s auto-countdown sequence + manual snap (`src/components/CaptureScreen.tsx:214-270`), slot targeting UI, screen flash overlay (`src/components/CaptureScreen.tsx:402-404`), shutter/beep via WebAudio (`src/utils/audio.ts`), multi-file upload + sample photos fallback (`src/components/CaptureScreen.tsx:289-287`).

- **Review (`src/components/ReviewScreen.tsx`):**
  Per-slot retake / replace-upload, retake-all with confirm modal.

- **Editor (`src/components/EditorScreen.tsx`):**
  Konva stage with cover-fit + clamped pan, 6 color filters (`src/utils/filters.ts`), zoom slider, date/memory stamp, emoji + PNG stickers with Transformer, multi-layout offscreen export at `pixelRatio:2`.

- **Download (`src/components/DownloadScreen.tsx`):**
  Dispenser animation, copy to clipboard, save one / save all, `resetBooth`.

- **Chrome (`src/components/Navbar.tsx`):**
  Stepper + progress bar, floating mobile action pill (hidden on capture), tools menu for theme / dark / font / mute.

Privacy model: 100% in-browser memory, no uploads. Preserve this in all enhancements.

---

## 2. Planned Enhancements (User Proposed)

### 2.1 Landscape Mode in Step 2 Capture
**Intent:** Phone in landscape/horizontal view for wider group shots.

**Status:** Partially exists — container switches `aspect-[16/9]` vs `aspect-[3/4]` in `src/components/CaptureScreen.tsx:456-460`.

**Suggestion:**
- Keep as UI-only mode (web has no true sensor orientation API; `videoWidth/Height` is source of truth).
- Add WYSIWYG crop guide overlay matching target slot aspect (e.g. 500x370) so users see what will be cropped in Editor.
- Add rotate-device prompt using `src/utils/useMediaQuery.ts` + screen orientation listener when `captureOrientation === 'landscape'` but device is portrait.
- Persist `captureOrientation` in `BoothContext` (already in `src/context/BoothContext.tsx:89`) across retakes.

### 2.2 Front-Camera Flash (Screen Flash)
**Intent:** White vignette + max brightness for low-light front captures.

**Feasibility:** Emulation only. No standard web API for system brightness (Screen Brightness API is Chrome-Android only, behind flag).

**Suggestion:**
- Pre-capture: fullscreen white overlay 300-500ms + temporarily boost capture canvas with `filter: brightness(1.3-1.5)`.
- Keep existing flash overlay in `src/components/CaptureScreen.tsx:402-404`, extend to `frontFlash` state tied to `cameraFacingMode === 'user'`.
- Back camera alternative: real torch via `track.applyConstraints({ advanced: [{ torch: true }] })` where `track.getCapabilities().torch === true`. Check in `initCamera` in `src/components/CaptureScreen.tsx:70-122`.
- Add toggle with Auto / On / Off, default Auto on front lens.

### 2.3 Snap Button as In-Viewfinder Circle + Full-Width Countdown
**Intent:** Native camera ergonomics.

**Suggestion:**
- Move Snap into viewfinder bottom-center: 72px circle, white ring, red/theme core, `disabled={isCapturing}` same as `src/components/CaptureScreen.tsx:620-628`.
- Make Auto Countdown full-width above it (`flex-1 h-12` -> `w-full h-12` in `src/components/CaptureScreen.tsx:607-618`).
- Keep keyboard support: Spacebar = Snap, Enter = Countdown.
- Ensure 44px+ touch targets, `aria-label="Take photo now"`.

### 2.4 Floating Camera Settings Cluster (Mirror / Switch / Orientation)
**Intent:** Replace icon-only buttons with intentional, labeled controls like native camera apps.

**Status:** Current cluster `src/components/CaptureScreen.tsx:527-566` uses 32px icon-only buttons with `title` only — undiscoverable + a11y fail.

**Suggestion:**
- Bottom-centered floating pill inside viewfinder: `[Mirror | Flip | Rotate | Grid | Flash]` with icon + 10px label.
- Active state: `bg-theme-primary text-white`, inactive: `bg-black/50 text-white/80 backdrop-blur-md`.
- Add `aria-pressed`, tooltips, haptic (`navigator.vibrate(10)` on toggle).
- Collapsible `...` overflow on small screens to avoid covering faces.

### 2.5 Enhance Camera Selection / Upload / Use Samples Row
**Intent:** Current row `src/components/CaptureScreen.tsx:632-674` is cramped, `Use Samples` looks like link, device `select` truncates at 140px.

**Suggestion:**
- Split hierarchy:
  - Primary row: `[Auto Countdown] [Snap Circle]`
  - Secondary card: labeled `Camera source` dropdown with friendly names (`Back Wide (0)`, `Front`), `Upload` as outlined button with count badge, `Samples` as ghost button with thumbnail preview.
- Handle empty labels pre-permission (enumerateDevices returns blank until granted) — show `Camera 1/2` fallback, refresh after grant.
- Fix `facingMode` vs `deviceId` conflict in `src/components/CaptureScreen.tsx:82-85`: when deviceId is set, facingMode is ignored. Remember last device in `localStorage`.
- Upload: show `Uploaded! Now select photo for shot #N` feedback already exists — extend with progress + slot assignment preview.

---

## 3. Additional Suggested Enhancements

### 3.1 Capture Reliability (High ROI)
- [ ] **Configurable countdown:** 3s / 5s / 10s / Off selector + per-shot pause. Replace hard-coded `3` in `src/components/CaptureScreen.tsx:221-266`.
- [ ] **Live filmstrip:** Thumbnail strip under viewfinder, tap to target slot, inline delete. Avoids ping-pong to Review.
- [ ] **Composition aids:** Rule-of-thirds grid toggle, center crosshair, pose ghost (prev shot at 30% opacity).
- [ ] **Exposure controls:** Zoom slider + torch toggle if `track.getCapabilities()` supports `zoom` / `torch`.
- [ ] **Wake Lock + shortcuts:** `navigator.wakeLock.request('screen')` during `isCapturing`, Spacebar to snap.
- [ ] **Upload hardening:** Drag-drop zone, downscale to max 2000px via canvas, strip EXIF, warn if <800px, HEIC notice. Current `handleFileUpload` in `src/components/CaptureScreen.tsx:289` can OOM on 4x phone photos.
- [ ] **Samples preview:** Thumbnail sheet modal before `setPhotos()` auto-skip to review.

### 3.2 Review Improvements
- [ ] Drag to reorder shots.
- [ ] Missing-slot banner with jump-to-capture CTA.
- [ ] Sharpness / brightness badge (Laplacian variance) to suggest best duplicate.
- [ ] Compare view (tap to enlarge side-by-side).

### 3.3 Editor / Creative Ceiling
- [ ] Filter intensity slider + live thumbnails from actual photo (extend `src/utils/filters.ts`).
- [ ] Adjust panel: brightness / contrast / saturate / warmth per frame.
- [ ] Draggable date stamp + multi-text layers (currently fixed bottom in `src/components/EditorScreen.tsx:444-456`).
- [ ] Background patterns / gradients, not just solid `template.backgroundColor`.
- [ ] Sticker search, recent tray, opacity + bring-forward / send-backward.
- [ ] Undo / redo stack for `updatePhoto` / `updateSticker` in `src/context/BoothContext.tsx:310-336`.
- [ ] Session recovery: persist thumbnails to `sessionStorage` / IndexedDB, restore prompt on reload (currently refresh = total loss).

### 3.4 Export / Sharing
- [ ] `navigator.share()` for mobile native share to IG / TikTok.
- [ ] QR code transfer (client-side `qrcode` lib) — shoot on tablet, grab on phone. Still privacy-preserving if ephemeral + local network.
- [ ] JPG + quality option, print sizes (4x6, 2x6 strip). PNG 600x1800 @2x is 5-8MB.
- [ ] GIF / boomerang mode from 4 rapid frames + strip bundle.
- [ ] Event name / watermark field auto-piped to `dateStamp.customText` in `src/context/BoothContext.tsx:197-204`.

### 3.5 Mobile / PWA / Accessibility
- [ ] Rotate prompt + safe-area tuning for landscape phones (`src/utils/useMediaQuery.ts`).
- [ ] `touch-action: none` + prevent double-tap zoom on shutter.
- [ ] All icon buttons: `aria-label`, `aria-pressed`, visible focus ring, min 44px target.
- [ ] PWA offline + install prompt polish (`src/hooks/usePWAInstall.ts`, `vite-plugin-pwa` in `package.json:40`).
- [ ] Dark-mode contrast audit, reduced-motion respect (`prefers-reduced-motion` disables confetti / GSAP eject in `src/components/DownloadScreen.tsx:49-86`).
- [ ] i18n scaffolding (EN + midterm target locale), RTL-safe layout.

### 3.6 Trust / Empty States
- [ ] Permission primer screen before `getUserMedia` prompt (higher grant rate).
- [ ] Explicit `Delete all` + memory cleanup (`revokeObjectURL`, stop tracks in `src/components/CaptureScreen.tsx:126-131`).
- [ ] EXIF-stripped badge + `100% private` copy already in Download — surface earlier in Capture.

---

## 4. Suggested Priority

**P0 — Next sprint:**
1. Floating labeled settings cluster (2.4)
2. Circle Snap + full-width Countdown (2.3)
3. Secondary row redesign (2.5)
4. Countdown selector + WakeLock

**P1 — Soon:**
5. Front screen-flash emulation + back torch detection (2.2)
6. Landscape crop guide + rotate prompt (2.1)
7. Live filmstrip + upload hardening

**P2 — Big bets:**
8. GIF mode, QR share, session recovery, adjust panel

---

## 5. Implementation Notes
- Keep all image processing client-side to preserve privacy claim in `README.md:7`.
- Reuse `ConfirmModal`, `soft-btn-coral` / `soft-btn-secondary` classes for visual consistency.
- Verify on: Chrome Android (front/back + torch), Safari iOS (device enumeration quirks, no torch), Firefox desktop (no device labels pre-permission), PWA standalone.
