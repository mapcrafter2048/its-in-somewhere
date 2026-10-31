# Deploying the archive

The game is a static Vite application. It needs no backend, API keys, database or runtime environment variables. All models, audio, reference packs and licence notices ship in `public/` and are copied into `dist/` by the build.

## Verify locally

Use Node.js 24 (`nvm use` reads `.nvmrc`):

```bash
npm ci
npm test
npm run validate
npm run build
npx playwright install chromium
npm run test:production
npm run preview
```

The production smoke test serves `dist/` on an ephemeral localhost port, walks through clock-in, opens ordinary game interfaces, checks reference/model/audio responses and imports the lazy computer chunks. It uses no development-only game hooks. Chromium can use software rendering in CI; this is a functionality check, not a hardware FPS benchmark. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing browser executable.

## Import into Vercel

Import **mapcrafter2048/its-in-somewhere** as a new Vercel project when ready to publish. Creating the project and clicking Deploy can publish the site; the repository preparation itself does not do this.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | Repository root |
| Production branch | `main` |
| Node.js | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None required |

The checked-in `vercel.json` supplies the build settings and caching rules. Preserve Vite's relative asset base. The game uses a single document and query parameters, so there is no catch-all SPA rewrite. Missing assets should return 404 rather than the game's HTML.

Only hashed files under `/assets/` receive year-long immutable caching. HTML and the unversioned reference, model and audio paths revalidate so future releases do not retain stale content. Vercel serves only `dist/`; source, tests and performance captures are not public deployment assets.

GitHub Actions validates pushes to `main` and pull requests, including the production smoke test. Once Vercel is connected, it builds independently from Git pushes: its deployment does not automatically wait for GitHub Actions to finish. Check both results before treating a release as verified.

## Release checks and saves

After the first live deployment, check clock-in, movement, notebook editing, a reference-backed file, computer apps, audio and a reload in a desktop WebGL 2 browser. Confirm that `/content/`, `/models/` and `/audio/` respond with the expected data rather than HTML. Development routes and `window.__GAME__` are excluded from production.

Saves belong to a browser profile and origin. Before moving from localhost, a preview URL or another domain, use **Escape → Export backup**. On the new address use **Settings & saved progress → Import backup**. Existing tabs and browser profiles retain their own saves. A stable production domain keeps future releases on the same save origin.

To roll back after deployment, promote a previously verified deployment in Vercel. Export a save before manually importing it into an older game release; an older release may not understand a newer save format.
