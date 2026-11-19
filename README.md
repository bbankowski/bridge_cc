Bridge utils:
 - convention card viewer (`bidding.txt`)
 - PBN files viewer (`public/*.pbn`)
 - training: convention card, openings and situations from tournaments (`trening/sytuacje.json`)

https://bbankowski.github.io/bridge_cc/

## Development

Requires Node.js 22.12+.

```bash
npm install
npm run dev      # http://localhost:5173/bridge_cc/
npm test
npm run lint
npm run build    # output in dist/
```

## Deployment

Every push to `master` is built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

To add a tournament, put the `.pbn` file in `public/` and add it to `src/tournaments.js`.
