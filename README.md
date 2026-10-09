# Expo Asset Studio

Visual workspace to create, preview and export **app icons**, **Android adaptive icons** and **splash screens** for Expo / React Native apps. Everything runs in the browser — no account, no upload.

- **Next.js (App Router) + React + TypeScript**, no UI/runtime dependencies beyond that.
- Design charter inspired by Welcome to the Jungle (signature yellow `#FFCD00`, near-black ink, warm paper canvas, pill actions); **Google Sans** (UI) + **Google Sans Code** (technical text); light/dark toggle.
- Live preview in Android/iOS device mockups, adaptive-icon masks and exploded layers, safe-area guides.
- SDK-aware generation: `src/lib/sdk.ts` is the single source of truth for what each Expo SDK supports. UI and generators only read its `rules`.
- Export: ZIP package (assets + config + README), individual PNGs, or copy the config (fragment / complete).
- Projects persist in this browser only (`localStorage`); the toolbar says so.

> SDK rules are bundled with the app and **not yet verified** against Expo's published schema. The UI says so; review the output before shipping.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build && npm start
```

## Structure

```
src/lib/        sdk rules, asset registry (files/config/issues), canvas renderers, store, zip, export
src/components/ Topbar, Panel (controls), Preview (devices), Config/Files views, ExportDialog
```

Adding an asset type = add an entry to `ASSETS` in `src/lib/assets.ts` (files, config, issues) and a panel + preview.
