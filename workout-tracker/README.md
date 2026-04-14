# Lift Log — Workout Tracker PWA

A self-contained **Progressive Web App** (plain HTML / CSS / JavaScript, no build step, no
framework) for tracking workouts on your iPhone. Open it in Safari and tap **Share → Add to
Home Screen** and it behaves like a native app (runs full-screen, offline, with its own icon).

## Features

- **Pre-filled templates**: Push Day, Pull Day, Leg Day, Upper, Lower, Full Body A, Full Body B.
- **Add / edit / delete** your own workouts.
- **Log every set** (weight × reps), tap the ✓ to mark complete.
- **History** with per-session detail, total volume, and sets-done counts.
- **Auto-fills** the last weight you used for each exercise when you start a session.
- **Settings**: kg / lb unit toggle, import / export JSON, restore defaults, wipe data.
- **Fully offline** after first load (service worker caches the app shell).
- **Data lives on your phone only** (`localStorage`). Back it up via **Settings → Export JSON**.

## How to install on your iPhone

You need to host the `workout-tracker/` folder somewhere Safari can reach it over HTTPS.
Three easy options:

### Option A — Netlify Drop (fastest, no account needed for a temporary URL)

1. Go to <https://app.netlify.com/drop> in your computer's browser.
2. Drag the entire `workout-tracker/` folder onto the page.
3. Netlify gives you an HTTPS URL like `https://random-name.netlify.app`.
4. On your iPhone open that URL in **Safari** → tap the **Share** icon →
   **Add to Home Screen**. Done.

### Option B — Dedicated GitHub repo + GitHub Pages

1. Create a new public repo on GitHub (e.g. `liftlog`).
2. Copy everything inside `workout-tracker/` into the repo root and push.
3. In the repo **Settings → Pages**, choose **Deploy from a branch**, pick `main` / `(root)`.
4. Wait a minute; Pages gives you a URL like `https://<user>.github.io/liftlog/`.
5. Open that URL in Safari on iPhone → **Share → Add to Home Screen**.

### Option C — Local network (dev only)

```bash
cd workout-tracker
python3 -m http.server 8080
```

Then on your computer open `http://localhost:8080`. For the iPhone you'll need HTTPS for the
"Add to Home Screen" install to give you a full PWA — use Option A or B for real use.

## File layout

```
workout-tracker/
├── index.html              # shell + tab bar
├── styles.css              # all styling
├── app.js                  # state, router, views (vanilla JS modules)
├── defaults.js             # default workout templates
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # service worker (offline cache)
└── icons/
    ├── icon.svg            # vector icon
    ├── icon-192.png        # manifest icon
    ├── icon-512.png        # manifest icon
    ├── icon-512-maskable.png
    ├── apple-touch-icon.png
    └── _make_icons.py      # regenerator script (not served)
```

## Customising the defaults

Edit [`defaults.js`](./defaults.js) to change the pre-filled workouts and their starter
weights. The values there are plain JavaScript — add / remove / reorder exercises freely.
On your phone, any change you make inside the app (edit a template, log a session, change
units) is saved locally and won't be affected when you update the source later, because
the app uses `localStorage` as the source of truth after first launch.

To push fresh defaults to yourself later: **Settings → Erase all data** (nukes local state and
reloads the defaults), or use **Settings → Restore default workouts** to re-add any default
templates you had deleted without touching your history.

## Browser support

Designed for mobile Safari (iOS 16+). Works in Chrome / Edge / Firefox on the desktop too.
