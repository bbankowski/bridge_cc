# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Vite + React 19 single-page app (react-router 8, Bulma 1) hosted on GitHub Pages at https://bbankowski.github.io/bridge_cc/. It has two bridge tools:
- **Convention card** (`/#/cc`) renders the bidding system in `bidding.txt`.
- **PBN viewer** (`/#/pbn?filename=<file>.pbn&deal=<n>`) shows tournament deals from `public/*.pbn`.

The UI text and the bidding notes are in Polish.

## Commands

```bash
npm run dev                  # http://localhost:5173/bridge_cc/
npm test                     # vitest run
npx vitest run -t "name"     # run a single test by name
npm run lint                 # eslint (flat config)
npm run build                # dist/
```

## Deployment

`.github/workflows/deploy.yml` lints, tests, builds and deploys `dist/` to GitHub Pages on every push to `master`. Built files are not committed. The `base` setting in `vite.config.js` is `/bridge_cc/`. Routing uses `createHashRouter` because GitHub Pages has no fallback to `index.html`.

To add a tournament, put the `.pbn` file in `public/` and add an entry to `TOURNAMENTS` in `src/HomePage.jsx`.

## Architecture

- `src/common/` holds the shared `Suit` and `Bid` components and `suits.js`. Suits are identified by PBN letters `S/H/D/C`. The convention card uses Polish letters `T/K/C/P` (clubs/diamonds/hearts/spades) and `BA` for no trump. Polish bids are converted with `polishBidToPbn` before rendering. Note that `C` means clubs in PBN but hearts in Polish.
- **Convention card**: `bidding.txt` is bundled with `?raw`, so changing it needs a rebuild, which a push triggers. `ConventionCard/bidding.js` parses it into entries:
  - Lines have the form `<sequence> => <description>`, with `-` separating calls. Lines starting with `#` are comments.
  - `^`, `&` and `*` lines start sections. `*` means we open and `^` means the opponents open, which decides whose calls are shown in parentheses.
  - `T<sequence>` lines draw an auction table.
  - A line without `-` is an opening.
  - Continuation lines are indented relative to the last table.
- **PBN viewer**: `PbnViewer/pbn.js` contains `parsePbn`, a pure function that returns plain deal objects. Each deal object keeps its original lines (`rawLines`) without the comment. `serializePbn` writes the file back from those lines plus the edited `commentText`, so unknown tags survive the round trip. Comments and notes are formatted only when rendered: `formatText` turns `\S`, `\H`, `\D` and `\C` into suit icons. The current deal lives in the `deal` URL parameter (1-based). Edited comments exist only in memory until "Pobierz PBN" is clicked. Unsaved edits are guarded by `beforeunload` and `useBlocker`.
- Tests (`*.test.js`) cover the parsers. `pbn.test.js` round-trips every file in `public/`, so a new `.pbn` file that the parser cannot handle makes the tests fail.
