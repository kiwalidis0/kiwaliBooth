# Codebase Audit: Security, Logic, and Improvements

Date: 2026-10-26
Scope: all files under `src/`, build configuration, PWA configuration, repository hygiene.
Status: findings documented first, then implementation started after maintainer decisions. See Section 10 for what has been resolved.

## 1. Method and Limits

- Manual review of `src/context`, `src/utils`, `src/hooks`, and targeted review of `CaptureScreen.tsx`, `EditorScreen.tsx`, `CustomThemeModal.tsx`.
- Pattern scan for risky APIs (`innerHTML`, `dangerouslySetInnerHTML`, `eval`, `window.open`, `JSON.parse`, `crossOrigin`, timers, listeners, object URLs).
- `npm audit` could not run (no network access in the audit environment). Dependency advisories are therefore unverified; see item S-8.
- `npx tsc -b` and `npx eslint .` both completed with no errors, so the findings below are not type or lint failures.
- The two largest components (`CaptureScreen.tsx` about 69 KB, `EditorScreen.tsx` about 89 KB) were reviewed selectively, not line by line.

No use of `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `window.open` was found. No secrets or API keys were found in tracked files.

## 2. Severity Key

| Level | Meaning |
|-------|---------|
| High | Contradicts a stated guarantee, or causes visible breakage in production |
| Medium | Real risk or defect with limited blast radius |
| Low | Hardening, hygiene, or minor defect |

## 3. Summary

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| S-1 | High | Privacy | Presence feature contacts third-party relays, contradicting "zero external" claims |
| L-1 | High | Logic | Asset filename case mismatch breaks favicon and PWA precache on case-sensitive hosts |
| L-2 | High | Logic | Custom overlay feature has no entry point and is documented as shipped |
| S-2 | Medium | Security | Unvalidated `localStorage` JSON flows into SVG generation unescaped |
| S-3 | Medium | Security | No Content Security Policy or other hardening headers |
| S-4 | Medium | Privacy | Session photos persisted unencrypted for 24 hours on shared devices |
| S-5 | Medium | Security | Restored session data is trusted without schema validation |
| L-3 | Medium | Logic | Untracked `setTimeout` calls fire after unmount or navigation |
| L-4 | Medium | Logic | `resetBooth` leaves stale state; `restoreSession` omits state |
| L-5 | Medium | Resource | GIF object URLs are never revoked |
| P-1 | Medium | Performance | Auto-save rewrites all photo data URLs on every sticker or stamp change |
| Q-1 | Medium | Quality | No error boundary; any render error blanks the app |
| S-6 | Low | Security | Sticker upload validated by MIME string only |
| S-7 | Low | Security | `crossOrigin` on arbitrary `http:` URLs allows mixed content |
| S-8 | Low | Supply chain | Dependencies unaudited; caret ranges and no CI gate |
| S-9 | Low | Privacy | Google Fonts loaded from third-party origin |
| L-6 | Low | Logic | Session expiry is only checked at load, never purged |
| Q-2 | Low | Quality | Text encoding corruption in source, README, and title |
| Q-3 | Low | Quality | `alert()` used for errors; deprecated `substr`; weak ID generation |
| Q-4 | Low | Quality | No tests, no CI, no LICENSE, `.env` not ignored |
| Q-5 | Low | Quality | Oversized components and no code splitting |

## 4. Security and Privacy Findings

### S-1 (High): Presence feature contacts third-party relays

File: `src/hooks/useOnlinePresence.ts`

`joinRoom({ appId }, roomId)` from `trystero` uses its default signaling strategy, which connects to public relays (BitTorrent trackers or Nostr relays) and exchanges WebRTC offers with unknown peers. Consequences:

- The user's IP address is exposed to the relays and, via WebRTC, to every other visitor in the room.
- This happens automatically on page load with no consent, while the UI, `README.md`, `PrivacyModal.tsx`, and `LandingScreen.tsx` describe the app as "zero cloud" and "no telemetry".
- The online count is trivially spoofable (any client can join the room), so it cannot be trusted as a metric.

Recommendation, in order of preference:
1. Remove the feature.
2. Make it opt-in behind an explicit toggle, off by default, with a clear disclosure in the privacy modal.
3. At minimum, disclose accurately and set `iceServers`/relay configuration explicitly so behavior is predictable.

### S-2 (Medium): Unvalidated stored theme flows into SVG markup

Files: `src/context/BoothContext.tsx` (lines 87-95), `src/utils/templateGenerator.ts`

`kb_custom_theme` is read with `JSON.parse` and cast to `TemplateConfig` with no validation. `accentColor` and `textColor` are interpolated directly into an SVG string (`fill="${brandColor}"`) that becomes a data URL image. Because it is rendered through an image element, scripts do not execute, but a crafted value (for example one containing a quote) can break out of the attribute and alter or break the rendered overlay. Any script running on the origin could plant such a value.

Recommendation: validate colors against `/^#[0-9a-fA-F]{6}$/` on read and on write, fall back to `DEFAULT_CUSTOM_THEME` on failure, and XML-escape any user-supplied text interpolated into SVG.

### S-3 (Medium): No Content Security Policy

File: `index.html`, deployment config (none present)

There is no CSP and no documented security headers. A restrictive CSP is an effective second line of defense for an app that handles camera streams and personal photos.

Recommendation: add a CSP via host headers (preferred) or a `<meta http-equiv>` fallback. Starting point:

```
default-src 'self';
img-src 'self' data: blob:;
media-src 'self' blob:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
connect-src 'self';
worker-src 'self';
```

Also set `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(self)`. If S-1 is kept, `connect-src` must list the relay origins, which makes the exposure visible and reviewable.

### S-4 (Medium): Unencrypted 24-hour photo persistence

Files: `src/utils/sessionStorageDb.ts`, `src/context/BoothContext.tsx`

Every captured photo is written to IndexedDB as a data URL and kept for 24 hours. For a booth used on a shared or kiosk device, the next person can restore the previous person's photos via the restore banner. The README states the data is local, but does not warn about shared devices.

Recommendation: make auto-save opt-in or provide a clear "private mode" toggle; add a visible "Clear my data" action; shorten the default retention (for example 1 hour); document the shared-device caveat in the privacy modal and README.

### S-5 (Medium): Restored session trusted without validation

File: `src/utils/sessionStorageDb.ts`, `restoreSession` in `BoothContext.tsx`

`loadSessionFromDb` casts IndexedDB and `sessionStorage` content to `SavedBoothSession` with no schema check. Corrupt or tampered data (wrong `step`, missing arrays, non-string `imageUrl`) will throw during render and, with no error boundary (Q-1), blank the app on every reload because the bad record is never purged.

Recommendation: validate shape and types on load (a small hand-written guard is sufficient), delete the record and return `null` on failure.

### S-6 (Low): Sticker upload checks MIME string only

File: `src/components/EditorScreen.tsx` (`handleCustomStickerUpload`)

`file.type.includes('png')` trusts the browser-reported type and has no size cap. A very large PNG can exhaust memory. Recommendation: enforce a size limit and route through the existing downscale pipeline in `uploadPipeline.ts` (preserving alpha by encoding as PNG for stickers).

### S-7 (Low): `crossOrigin` and `http:` URLs

File: `src/components/EditorScreen.tsx` (lines 68, 105), `src/utils/gifEncoder.ts` (line 31)

Images from `http://` origins are accepted. On an HTTPS page they will be blocked as mixed content, and where allowed they can be tampered with in transit. Recommendation: accept `https:`, `data:`, and `blob:` only.

### S-8 (Low): Dependency and supply-chain posture

- Advisories could not be checked offline. Run `npm audit` and `npm outdated` locally.
- All dependencies use caret ranges; `package-lock.json` is committed, which is good. Use `npm ci` in CI.
- Several pinned majors are very recent (Vite 8, ESLint 10, TypeScript 6, Konva 10). Confirm they are intended and stable.
- `sharp` is a dev dependency used only by `scripts/generate-icons.mjs`; acceptable, but keep out of production builds.
- Add Dependabot or Renovate and an `npm audit --omit=dev --audit-level=high` CI step.

### S-9 (Low): Google Fonts third-party origin

Files: `index.html`, `vite.config.ts`

Fonts are fetched from Google at runtime, which leaks the visitor's IP and user agent to Google and weakens the offline claim. Recommendation: self-host Fredoka and Open Sans as `woff2` (for example via `@fontsource`), remove the preconnect links, and drop the two Google runtime caching rules.

## 5. Logic Flaws

### L-1 (High): Asset filename case mismatch

Files: `index.html`, `vite.config.ts`, `public/kiwalibooth.svg`

The tracked file is `public/kiwalibooth.svg` (lowercase). `index.html` references `/kiwaliBooth.svg` and `vite.config.ts` lists `'kiwaliBooth.svg'` in `includeAssets`. This works on Windows and macOS (case-insensitive) but returns 404 on Linux hosts and CDNs, and can fail the PWA precache build step. Recommendation: standardize on the lowercase filename in both places.

### L-2 (High): Custom overlay has no entry point

Files: `src/context/BoothContext.tsx` (line 388), `src/components/EditorScreen.tsx`

`setCustomOverlayUrl` is called only from `restoreSession`. No component calls it, so users cannot upload or set a custom overlay, yet the README advertises "Custom Canva Overlays". The state, persistence, rendering, and export paths are dead code. Recommendation: either add the upload UI (reusing `uploadPipeline.ts` with PNG output) or remove the code and the documentation claim. The README rewrite accompanying this audit no longer claims the feature.

### L-3 (Medium): Untracked timers

File: `src/components/CaptureScreen.tsx` (about 15 `setTimeout` calls, for example lines 385-402, 491-502, 596-665)

Many timeouts call `setStep('review')` or state setters without being stored or cleared. If the user navigates back, discards, or unmounts the screen during the delay, the stale timer still fires and can force the app to the review step or update unmounted state. Recommendation: keep timer ids in a ref set, clear all in an unmount effect and when the sequence is cancelled; consider a small `useTimeout` helper.

### L-4 (Medium): Inconsistent reset and restore

File: `src/context/BoothContext.tsx`

- `resetBooth` does not reset `customOverlayUrl`, `dateStamp`, `selectedTemplateId`, `captureOrientation`, or `activeStudioLayoutId`. Settings from a previous visitor persist into the next session on the same tab.
- `restoreSession` does not restore `layoutPhotoAssignments` (not part of `SavedBoothSession`), so slot assignments made in review are lost after refresh, and the strip can differ from what the user saved.
- `selectedLayoutId` is derived from `selectedLayoutIds[0]`, while `activeStudioLayoutId` is separate state kept in sync by hand in `toggleLayoutId`, which calls a setter inside a state updater (side effect inside a reducer-style function). Under React strict or concurrent rendering this can run twice.

Recommendation: add `layoutPhotoAssignments` to the persisted session, reset all session-scoped state in `resetBooth`, and derive `activeStudioLayoutId` instead of storing it, or move to `useReducer`.

### L-5 (Medium): Leaked GIF object URLs

File: `src/utils/gifEncoder.ts` (line 78)

`URL.createObjectURL(blob)` is returned as a field misleadingly named `dataUrl` and is never revoked. Each GIF generation leaks the blob until page close. Recommendation: rename to `objectUrl`, revoke on unmount or regeneration, and revoke after download.

### L-6 (Low): Expiry only on read

File: `src/utils/sessionStorageDb.ts`

The 24-hour check occurs in `loadSessionFromDb`. Expired records stay on disk until the next save or manual clear, and the `sessionStorage` fallback path duplicates the logic. Recommendation: delete expired records when detected.

### Additional logic notes

- `useOnlinePresence`: `handleOnline` sets count to `Math.max(1, prev)` but the room effect reconnects independently; the count can briefly show 1 while connected to peers. `getPeers()` is polled every 10 seconds redundantly with join and leave callbacks. Moot if S-1 removes the feature.
- `uploadPipeline.ts`: warns on HEIC but still tries to decode, then rejects with a generic "Failed to load image". Surface a specific message when the extension is HEIC and decoding fails. Image orientation from EXIF is handled by modern browsers via `image-orientation: from-image`, but verify on Safari.
- `uploadPipeline.ts`: warning text contains a corrupted multiplication sign (see Q-2).

## 6. Performance

### P-1 (Medium): Full-session auto-save on every change

File: `src/context/BoothContext.tsx` (lines 225-244)

The debounced effect depends on `stickers` and `dateStamp`, so dragging a sticker rewrites every photo data URL (potentially several MB) to IndexedDB every 600 ms. Recommendation: store photos once in a separate key (or store `Blob`s instead of base64 strings, which is about 33 percent smaller), and write only the small settings object on frequent changes.

### Other

- Photos are held as base64 data URLs in React state and context. Prefer `Blob` plus `URL.createObjectURL` with cleanup.
- Context value object is recreated on every render and includes many non-memoized functions, re-rendering every consumer. Split into state and actions contexts, or memoize.
- No route or screen-level code splitting. `konva`, `gsap`, `qrcode`, `trystero`, and `gifenc` ship in the initial bundle. Use `React.lazy` for `EditorScreen`, `QRShareModal`, and the GIF encoder.
- `workbox` `globPatterns` precaches all PNG and SVG; confirm bundle and precache size after changes.

## 7. Code Quality

### Q-1 (Medium): No error boundary

`src/main.tsx` and `src/App.tsx` have no `ErrorBoundary`. Any render exception unmounts the whole tree. Add a boundary with a "Reset and reload" action that also clears the saved session.

### Q-2 (Low): Encoding corruption

Mojibake appears in `README.md` (emoji headings), `ENHANCEMENTS.md`, `index.html` `<title>`, `uploadPipeline.ts` warning strings, and the filmstrip text in `templateGenerator.ts` (for example `24A`, `K-400 ...`). Files should be saved as UTF-8 without BOM. Replace decorative characters with plain ASCII.

### Q-3 (Low): Minor code issues

- `alert()` is used for user errors (sticker upload); replace with the existing toast or modal pattern.
- `String.prototype.substr` is deprecated (`BoothContext.tsx` line 361); use `slice`. Prefer `crypto.randomUUID()` for sticker IDs.
- `catch {}` blocks that silently ignore errors hide real failures. Log at `console.debug` at minimum in development.
- `package.json` version is `0.0.0` and `name` is lowercase while branding is `kiwaliBooth` / `Kiwalibooth` / `kiwalibooth`. Pick one canonical spelling.

### Q-4 (Low): Repository hygiene

- No tests. Recommended starting set with Vitest: `uploadPipeline` sizing math, `sessionStorageDb` validation and expiry, `templateGenerator` escaping, `filters`, and `reorderPhotos` logic.
- No CI. Add a GitHub Actions workflow running `npm ci`, `npm run lint`, `npx tsc -b`, `npm run build`, and `npm audit`.
- No `LICENSE` file; the README previously did not state a license. Add one.
- `.gitignore` does not exclude `.env*`. Add `.env` and `.env.*` (keep `.env.example`).
- No `.nvmrc` or `engines` field. Several dependencies need a recent Node; state it.

### Q-5 (Low): Component size

`EditorScreen.tsx` (about 89 KB) and `CaptureScreen.tsx` (about 69 KB) mix state, canvas logic, and large JSX. Extract hooks (`useCameraStream`, `useCountdown`, `useStickerLayer`, `useExport`) and presentational subcomponents. This also makes L-3 easier to fix and enables unit tests.

### Accessibility (not fully reviewed)

Verify keyboard operation of the canvas editor, focus trapping in modals (`ConfirmModal`, `PrivacyModal`, `CustomThemeModal`, `QRShareModal`), `aria-live` for countdown and toasts, and color contrast for user-chosen custom themes. Respect `prefers-reduced-motion` for GSAP and confetti.

## 8. Recommended Implementation Order

1. L-1 filename case fix (trivial, high impact).
2. S-1 decision on presence feature (remove, or opt-in plus disclosure) and align privacy copy.
3. L-2 decide on custom overlay (build or remove).
4. S-2 and S-5 input validation for stored data; Q-1 error boundary.
5. L-3, L-4, L-5 lifecycle and state-reset fixes.
6. S-3 CSP and headers; S-9 self-host fonts.
7. P-1 and remaining performance work.
8. Q-2 through Q-5: encoding cleanup, tests, CI, LICENSE, refactors.

## 9. Open Questions for the Maintainer

1. Is the live online-user count worth the privacy trade-off, or should it be removed?
2. Should the custom overlay feature be built or removed?
3. Is this deployed to a case-sensitive host (Linux, Vercel, Netlify, GitHub Pages)?
4. Is the booth intended for shared or kiosk devices? That changes the retention defaults in S-4.
5. Which license should apply?

## 10. Implementation Log

Maintainer decisions: presence feature becomes opt-in with prominent disclosure; custom overlay dead code removed; MIT license; privacy policy rewritten in plain language; booth is used on personal devices (no kiosk), so the 24-hour session retention stays.

| ID | Status | Change |
|----|--------|--------|
| S-1 | Resolved | Live user count is off by default and opt-in via a disclosure panel. The networking library is lazy-loaded only after opt-in. Turning it off disconnects immediately. |
| L-1 | Resolved | References in index.html and vite.config.ts now use kiwalibooth.svg to match the file. |
| L-2 | Resolved | Unused custom overlay state, props, and types removed. |
| S-2 | Resolved | Hex color validation and XML escaping in templateGenerator.ts; sanitizeTheme falls back to defaults on corrupt storage. |
| S-5 | Resolved | Runtime schema guard isSavedBoothSession validates stored data; corrupt sessions are safely purged. |
| L-6 | Resolved | Expired sessions (>24 hours) automatically purged from IndexedDB and sessionStorage. |
| Q-1 | Resolved | Added ErrorBoundary component wrapping application tree with reload and data-reset recovery options. |
| L-3 | Resolved | useSafeTimers hook created and integrated into CaptureScreen; timeouts and intervals safely tracked and auto-cleared on unmount/navigation. |
| L-4 | Resolved | resetBooth resets all session-scoped state; layoutPhotoAssignments and captureOrientation persisted and restored. |
| L-5 | Resolved | createAnimatedGif returns objectUrl; DownloadScreen explicitly revokes previous and unmounted blob URLs. |
| Q-4 | Partly resolved | MIT LICENSE added; Vitest test suite added with 21 unit tests covering validation, storage, escaping, and timer hooks. CI and .env rules remain open. |
| Privacy copy | Resolved | PrivacyModal and landing text rewritten for non-technical readers and aligned with actual behavior. |

Open items: S-3, S-4, S-6 to S-9, P-1, Q-2, Q-3, Q-4 (CI/.env), Q-5.
