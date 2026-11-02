# kiwaliBooth

A browser-based digital photobooth. Capture or upload photos, arrange them into photostrips, decorate them in a canvas editor, and export the result as an image. Photo capture, editing, and export run entirely in the browser.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Browser Support and Requirements](#browser-support-and-requirements)
- [Privacy and Data Handling](#privacy-and-data-handling)
- [Progressive Web App](#progressive-web-app)
- [Known Issues and Roadmap](#known-issues-and-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features

- **Strip layouts**: 1-cut Polaroid, 2-cut Double, 3-cut Triple, and 4-cut Classic. Multiple layouts can be exported from one session.
- **Capture**: webcam capture with automatic countdown or manual shutter, front and back camera selection, mirror toggle, portrait and landscape viewfinder, and low-light boost.
- **Upload**: add photos from the device. Large images are downscaled before use to limit memory usage.
- **Review**: retake or replace individual shots, reorder photos, and assign photos to strip slots.
- **Editor**:
  - Color filters (Warm, Vintage, Pastel, B&W, Cyber) and brightness, contrast, saturation, and warmth adjustments.
  - Pan and zoom within each slot, with edge clamping to avoid empty gaps.
  - Emoji stickers and custom transparent PNG stickers with move, resize, and rotate controls.
  - Date stamp and custom message text.
  - Built-in templates and a custom color theme.
- **Export**: high-resolution PNG export, clipboard copy, save one or all layouts, and animated GIF generation.
- **Sharing**: QR code that links to the app.
- **Preferences**: color theme, dark mode, font size, and sound mute, stored locally.
- **Session recovery**: the active session can be resumed after a refresh (see [Privacy and Data Handling](#privacy-and-data-handling)).

## Tech Stack

| Area | Technology |
|------|------------|
| UI framework | [React 19](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vite.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Canvas | [Konva](https://konvajs.org/) with [react-konva](https://konvajs.org/docs/react/) |
| Animation | [GSAP](https://gsap.com/) and `canvas-confetti` |
| GIF encoding | [gifenc](https://github.com/mattdesl/gifenc) |
| QR codes | [qrcode](https://github.com/soldair/node-qrcode) |
| Icons | [Lucide](https://lucide.dev/) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Optional live user count | [Trystero](https://github.com/dmotz/trystero) (opt-in, see privacy notes) |

## Getting Started

### Prerequisites

- Node.js 20 or later (the latest LTS release is recommended)
- npm 10 or later

### Installation

```bash
git clone https://github.com/kiwalidis0/kiwaliBooth.git
cd kiwaliBooth
npm install
```

### Run in development

```bash
npm run dev
```

The dev server prints a local URL, usually `http://localhost:5173`. Camera access requires a secure context: `localhost` and HTTPS origins work, plain HTTP on a LAN address does not.

### Build for production

```bash
npm run build
npm run preview
```

The production build is written to `dist/` and can be served by any static host. Serve it over HTTPS so camera access and the service worker function.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check with `tsc -b`, then create a production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

Icon assets in `public/` can be regenerated with `node scripts/generate-icons.mjs` (requires the `sharp` dev dependency).

## Project Structure

```
src/
  components/     Screens and UI (Landing, Capture, Review, Editor, Download, modals)
    capture/      Capture screen subcomponents
  context/        Booth state provider and hooks
  data/           Layouts, templates, and sticker definitions
  hooks/          Reusable hooks (wake lock, orientation, PWA install, presence)
  types/          Shared TypeScript types
  utils/          Filters, GIF encoder, upload pipeline, session storage, audio
public/           Icons and web app manifest
scripts/          Build-time helper scripts
docs/             Project documentation, including the codebase audit
```

User flow: `Landing -> Layout select -> Capture -> Review -> Editor -> Download`.

## Browser Support and Requirements

- A current version of Chrome, Edge, Firefox, or Safari.
- Camera features need `getUserMedia` and a secure context (HTTPS or `localhost`).
- HEIC images may not decode in every browser. Convert to JPEG or PNG if an upload fails.
- Clipboard image copy depends on browser support for the async Clipboard API.

## Privacy and Data Handling

Photo processing happens on the device. The app has no backend and does not upload photos.

What is stored locally:

- **IndexedDB** (`kiwalibooth_db`): the active session (photos, layout choices, stickers) so it can be resumed for up to 24 hours. A `sessionStorage` fallback is used if IndexedDB is unavailable.
- **localStorage**: preferences such as theme, dark mode, font size, mute state, selected camera, and custom theme colors.
- No cookies are used.

Clearing data: choosing "Shoot Another" or "Discard" removes the saved session. You can also clear site data in your browser settings.

Network activity to be aware of:

- **Fonts**: Google Fonts (Fredoka and Open Sans) are loaded from Google servers.
- **Live user count (optional, off by default)**: the home page can show how many people are online using Trystero, a peer-to-peer WebRTC library. Nothing connects, and the library is not loaded, until the user explicitly turns it on. Once on, the device connects to public signaling relays and to other participating visitors, who can see the device's IP address. No photos or personal details are sent. The user can turn it off at any time, which disconnects immediately. The choice is stored in `localStorage` under `kb_presence_optin`.

The in-app privacy policy (`src/components/PrivacyModal.tsx`) explains all of this in plain language and must be kept in sync with this section.

Shared devices: because sessions are kept for 24 hours, use "Discard" before leaving a shared or public device.

## Progressive Web App

The app registers a service worker and web app manifest so it can be installed and used offline after the first load. Built assets are precached, and fonts and images use runtime caching. Updates are applied automatically (`registerType: 'autoUpdate'`).

## Known Issues and Roadmap

A full review of security, logic, and improvement areas is documented in [docs/AUDIT.md](docs/AUDIT.md). Highlights:

- Stored settings and sessions need validation on load.
- Untracked timers on the capture screen and incomplete state reset between sessions.
- No automated tests or CI yet.

## Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Make your change and run `npm run lint` and `npm run build`.
4. Open a pull request describing the change and how you tested it.

Report security issues privately to the maintainer rather than opening a public issue.

## License

Released under the [MIT License](LICENSE).

## Author

Andreas Luy, [andreas-luy.me](https://www.andreas-luy.me/)
