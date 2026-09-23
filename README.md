# kiwaliBooth 📸

A privacy-first digital photobooth web application built with React, TypeScript, Tailwind CSS, react-konva, and GSAP.

## ✨ Features

- **100% In-Browser Memory**: All photo captures, filters, canvas edits, and exports run entirely client-side. Zero cloud uploads and zero external database storage.
- **Multiple Strip Formats**: Choose from 1-Cut Polaroid, 2-Cut Double, 3-Cut Triple, or 4-Cut Classic photostrips.
- **Webcam & Multi-File Upload**: Capture photos with auto-countdowns or upload photos directly from your device.
- **Studio Editor**:
  - Real-time color grading filters (Warm, Vintage, Pastel, B&W, Cyber).
  - Photo auto-snap boundary clamping (no transparent/empty gaps).
  - Floating frame indicator for fast pose adjustments.
  - Transparent PNG sticker uploads & sticker resizing controls.
  - Photobooth vintage date stamping.
- **Custom Canva Overlays**: Support for uploading custom transparent PNG frame overlays.
- **Instant Export & Copy**: Direct high-resolution PNG export cropped to exact strip dimensions, plus instant clipboard copy.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Canvas Engine**: [react-konva](https://konvajs.org/docs/react/) + [Konva](https://konvajs.org/)
- **Animations**: [GSAP](https://gsap.com/) + `@gsap/react` + `canvas-confetti`
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kiwalidis0/kiwaliBooth.git
   cd kiwaliBooth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🔒 Privacy & Architecture

Kiwalibooth is designed to be completely ephemeral:
- Webcam streams utilize the browser's native `MediaStream` API.
- Photo frames are stored as in-memory data URLs.
- Closing or refreshing the tab clears all buffers.
- No analytics trackers or image telemetry.

## 👤 Author

- **Andreas Luy** — [andreas-luy.me](https://www.andreas-luy.me/)
