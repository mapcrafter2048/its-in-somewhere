# Deploying the archive

The game uses the Next.js App Router with a statically prerendered home page and a browser-only Three.js runtime. It needs no backend, API keys, database or runtime environment variables. All models, audio, reference packs and licence notices ship in `public/` and retain their existing root URLs.

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

The production smoke test starts the built Next.js server on an ephemeral localhost port, walks through clock-in, opens ordinary game interfaces, checks reference/model/audio responses and opens Files and Snake through the computer interface. It uses no development-only game hooks. Chromium can use software rendering in CI; this is a functionality check, not a hardware FPS benchmark. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing browser executable.

## Check a hosted build

The same smoke test can target a hosted production-mode build:

```bash
PRODUCTION_BASE_URL=https://your-preview.vercel.app npm run test:production
```

For a protected preview, also set `PRODUCTION_ACCESS_URL` to its temporary Vercel share URL. The test opens that URL to establish the normal protection cookie, then runs all application checks on the deployment origin. The access URL must belong to the same origin. Keep temporary access links out of committed files.

## Migrate the existing Vercel project

Keep the existing **mapcrafter2048/its-in-somewhere** Vercel project and production domain so browser saves remain on the same origin. Prepare this migration on a separate branch and verify its Vercel Preview before merging to the production branch. A push to the configured production branch may deploy immediately.

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | Repository root |
| Production branch | `main` |
| Node.js | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Default Next.js output; clear any `dist` override |
| Environment variables | None required |

On 1 November 2026, the existing project settings were updated to Next.js and Node.js 24, with `npm ci`, `npm run build`, and the output-directory and development-command overrides reset to their defaults. The current production deployment remained READY after this settings update.

The checked-in `vercel.json` selects `nextjs`, `npm ci`, and `npm run build`. In the existing project's Build and Development Settings, select Next.js and remove an explicit `dist` output-directory override before deploying the migration. The repository intentionally omits `outputDirectory` so Vercel uses its Next.js integration. Use the existing project rather than creating another production domain. The game uses the home page and query parameters; missing assets return 404.

Next.js manages immutable caching for hashed bundles under `/_next/static/`. The unversioned reference, model and audio paths retain the existing revalidation headers in `vercel.json`. Next.js serves `public/` assets; source, tests and performance captures are not public deployment assets. The production smoke test uses `next start`; Vercel-specific headers and dashboard overrides must also be checked on the preview.

GitHub Actions validates pushes to `main` and pull requests, including the production smoke test. Once Vercel is connected, it builds independently from Git pushes: its deployment does not automatically wait for GitHub Actions to finish. Check both results before treating a release as verified.

## Release checks and saves

On the preview, and again after production promotion, check clock-in, movement, notebook editing, a reference-backed file, computer apps, audio and a reload in a desktop WebGL 2 browser. Confirm that `/content/`, `/models/` and `/audio/` respond with the expected data rather than HTML. Development routes and `window.__GAME__` are excluded from production.

Saves belong to a browser profile and origin. Before moving from localhost, a preview URL or another domain, use **Escape → Export backup**. On the new address use **Settings & saved progress → Import backup**. Existing tabs and browser profiles retain their own saves. A stable production domain keeps future releases on the same save origin.

Record the current production deployment URL before release. To roll back after deployment, promote that previously verified deployment in Vercel. Revert the migration before the next Git deployment; otherwise the production branch will redeploy Next.js. Export a save before manually importing it into an older game release; an older release may not understand a newer save format.

## Migration implementation

`src/app/layout.tsx` retains page metadata and global styles. The client component starts the existing imperative game after mount; a cached startup promise prevents duplicate renderers under React Strict Mode. The game owns the contents of `#app` for the document lifetime. Future client-side navigation away from the game will require an explicit disposal lifecycle first.

Vite environment variables are replaced with root asset URLs and compile-time `process.env.NODE_ENV` checks. Development model inspection and the test bridge remain gated to development builds. Browser tests use bundled development modules instead of Vite-only `/src/*.ts` URLs. No save keys or save formats change in this framework migration.

Build and development scripts explicitly use Next.js's webpack compiler. Game initialization is an async function called after the client mounts, rather than a module with top-level await. TypeScript 6 uses the compiler API through `experimental.useTypeScriptCli: false`; strict type checking remains enabled.

The production rollback point recorded before the migration is deployment `dpl_3i7MMgMi24m1EuzyfMRh5DiVuXJL`: [existing production deployment](https://its-in-somewhere-jmq0p4cfo-aadish-jains-projects-c3aa0be6.vercel.app), built from commit `111eb273a16440241e1b0005c279d99bef3fb20f`.

## Verified migration preview — 1 November 2026

[Next.js preview](https://its-in-somewhere-qyult5c7h-aadish-jains-projects-c3aa0be6.vercel.app), deployment `dpl_J5SJdSvzjE2r5SXBwvaL95ojePnT`, is READY. Its hosted smoke test and cache-header probes pass. This is a CLI source-snapshot preview; it does not create a Git commit or update the production aliases. Review it in a desktop WebGL 2 browser, save the migration and current game changes to a review branch in GitHub, and release after review. Keep the recorded production rollback point until the release has been verified.
