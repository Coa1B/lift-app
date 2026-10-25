# lift.

A mobile-first workout tracker for logging lifts, building workout plans, and tracking 1RM PRs. It runs in the browser and installs to your home screen as a PWA, and all data stays on your device.

## Features

- **Workout logging**: log sets with weight and reps, see what you did last time, check sets off as you go, and drag exercises to reorder them. A built-in rest timer runs between sets, and progressive-overload suggestions show what to try next.
- **Plans**: build reusable workout templates from the exercise library. Each exercise has its own set rows (weight and reps, starting at 0) and rest time. Tap a plan to edit it, swipe left to delete it, or press **Start workout** to log from it.
- **PRs**: record one-rep maxes and chart your 1RM progress for each lift.
- **Exercise detail**: per-exercise history, progress chart, and estimated 1RM.
- **Cardio**: track runs, walks, rides, and other sessions by time and distance.
- **History and streaks**: see past workouts and your weekly streak on the home screen.
- **Settings**: lb or kg units, light and dark themes, and a default rest timer.

## Tech stack

- [React 19](https://react.dev) with [React Router](https://reactrouter.com)
- [Vite](https://vite.dev) with [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for offline support and installability
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org) for charts
- [dnd-kit](https://dndkit.com) for drag-to-reorder
- [Lucide](https://lucide.dev) icons

Data is saved locally in IndexedDB. There's no backend or account.

## Getting started

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. To try it on your phone, run `npm run dev -- --host` and open the network URL it prints.

## Scripts

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Serve the production build locally  |
| `npm run lint`    | Run ESLint                           |

## Project structure

```
src/
  screens/      Pages: Home, LogWorkout, Plans, PRs, Cardio, History, Profile, …
  components/   Shared UI: nav bars, log sheet, stat cards, onboarding
  hooks/        User name, theme, and weight-unit state
  lib/          Local storage (IndexedDB) for plans, cardio, and app data
  data/         Exercise library, cardio types, rest-timer presets
public/         PWA icons and manifest
```

## Installing on iPhone

Open the app in Safari, tap **Share**, then **Add to Home Screen**. It opens full-screen like a native app and works offline.

## Deployment

The app is a static site, so any static host works. It's set up for [Vercel](https://vercel.com): the build command is `npm run build` and the output directory is `dist`.
