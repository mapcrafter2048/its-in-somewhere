# It’s In Here Somewhere

A first-person archive comedy built with Three.js, TypeScript, and Next.js. Martin wants one sentence before lunch. There are now **152,616 files**, four connected wings, inconveniently good recordkeeping, and people with reasons to prefer the edited version.

## Archive variety and optional discoveries

New shifts add twelve physical record families with 48 authored ordinary variants: fax sheets, carbon copies, access logs, deliveries, receipts, charts, plans, contracts, annotations, damaged transcripts, newsletters and original/revised reports. Three optional threads connect 18 physical records with new digital files and password clues. The CRT’s **Catalogue** searches selected pre-existing batch descriptions; reading paper never digitizes it. Correct evidence sent through mail can produce a saved office notice or farewell message.

Martin’s sentence remains the only main requirement. Existing shifts keep their original records; start a new shift for the expanded collection, using **Export backup and start new shift** to retain a return copy. [Expansion guide](docs/RECORDS-EXPANSION.md) explains the catalogue, correspondence, accessibility and compatibility.

## Play

Requires Node.js 24 and npm. Run `nvm use` to select the version pinned in `.nvmrc`.

```bash
npm ci
npm run dev
```

Open **http://localhost:5173** in a desktop browser with hardware-accelerated WebGL 2. To run the production build:

```bash
npm run build
npm run preview
```

The build is in `.next/`; run it with `npm run start` (or `npm run preview`). Next.js serves the bundled game and the assets in `public/`. The normal preview address is **http://localhost:3000**. All reference texts, geometry, sound and dependencies are bundled locally; the game calls no external AI or content service. Reference packs load on demand from the same host as the game. No API key is needed.

Saves belong to a browser profile and origin. **Use the same address/port you used before to resume your existing shift**, or export/import a backup when moving between addresses.

## Deployment

The repository is prepared for Vercel: use the existing `mapcrafter2048/its-in-somewhere` project, the repository root, and the checked-in Next.js build settings. Verify a preview deployment before releasing to `main`. No environment variables are required. [Deployment instructions](docs/DEPLOYMENT.md) cover validation, caching and transferring browser saves. Deployment preparation does not publish a live site.

## Make the desk yours

The **personal desk expansion** adds 24 objects hidden beneath drawer contents, a notebook for typed notes and sketches, and a physical pinboard with coloured strings. Return to your W4 desk for internal email with Tess, Martin, Facilities and Accounts: six optional correspondence cases use records already in the archive. Supply credits buy more stationery, a larger board and optional catalogue identification. Collection milestones unlock cosmetic stamps, desk accessories and a certificate.

The desk computer is a chair-facing vintage CRT workstation with a tower beneath the desk, a full keyboard, wired mouse, and its own period office desktop.

Press **N** to open one cloth-bound notebook: Notes, Discoveries, Collection and Shift log share equal facing pages, with a Contents bookmark and page turns. On narrow windows, turn through one leaf at a time. Open storage to browse overlapping physical folder tabs; the aligned reader keeps a folded Contents slip rather than a permanent file-list sidebar. All 12 notebook sheets are browsable immediately (36 after the stationery upgrade); blank browsing does not create notes. Pick up a separate sticky pad, infinite thread spool or marker from the W4 stationery box. Equip thread and select two pinned notes to connect them. Inventory can stow, return or recycle loose notes. Wall clocks and the desk calendar share fictional office time, beginning at 8:00 AM on Monday, 8 January 2007. W2 has a free drinks machine and can-recycling bin. Arrange pinned sheets and read/send mail at the desk. No AI service is involved: selected subjects and uncovered evidence drive authored replies after 30–90 seconds of active shift time. The main assignment remains independent of these activities. [Personal desk guide](docs/DESK-LIFE.md) explains controls, rewards, saves and timing.

## What expanded

- **Four wings:** Administration, Commercial Records, Technical Services, and Executive Depository. The four large archive rooms form a connected 2 × 2 warehouse: W1/W2 above W4/W3. Shared doors connect W1–W2–W3–W4–W1; there is no central hub.
- **512 back-to-back floor cabinets, 72 wall cabinets, and 1,541 searchable file boxes.** Front and rear banks are independent. Each drawer starts with 16 files and holds 20; boxes start with 8 and hold 10. Original references remain stable; new examples are `W2–A08R / 3.12`, `W2–WC01 / 3.12`, and `W2–BX001 / 1`.
- **99 social situations and 594 written fragments:** awkward relationships, jealousy, cover-ups, ambition, kindness, and misunderstandings. The existing stories remain, with **32 new short chains and 12 new six-record chains**, for 53 story chains in total.
- **Six real reference packs:** Babbage on machinery, Darwin on species/worms/travel, Faraday on candles, and the Python tutorial. The source corpus contains about **588,000 words in 2,722 excerpts**; attribution and licenses are available in-game.
- **Discovery-funded equipment:** opening ordinary files no longer earns money. Collect supply vouchers, redeem them at your W4 work nook desk, and earn existing discovery/story rewards.
- **Two new upgrades:** the comparison stand (40 credits) and coloured cabinet tabs (28 credits).
- **Save migration:** existing targets, inspected file text, original story placements, money, equipment, bookmarks, search markings and submission state carry forward. Original saves are backed up before conversion, and existing backups remain intact.

The archive intentionally reuses its source excerpts, office procedures and social situations at a distance. It does **not** contain 152,616 individually authored unique texts. For the released record pack at the default seed, the audit counts approximately 25.84 million displayed words across the full archive, drawn from a much smaller reusable corpus. Expanded shifts mix shorter new forms into that archive. Local body/fragment repetitions are separated by at least 634 file positions in the released pack and 192 in the expanded pack for the tested seeds. The 3–5 hour playthrough remains a design target requiring human playtesting.

## Interfaces with a physical identity

The notebook is a clothbound book with facing ruled pages, numbered sheets, section tabs and previous/next navigation. Original records retain their manila folders and five stationery families. Carried files occupy a leather wallet; equipment orders sit on a clipboard; the floor plan uses blue drafting ink. The desk, machines, cork boards, whiteboard, collection, receipts and office paperwork use distinct materials and layouts. Large text, narrow windows, keyboard navigation and reduced motion remain supported. See the [interface guide](docs/INTERFACES.md).

## Records Desktop

The W4 computer has **Mail, Files, Directory, Print Queue and Snake** in its taskbar. Mail pairs the CRT with a response sheet: choose one of three authored replies and optionally add a personal note. Physical evidence unlocks stronger responses; typed prose is retained, not interpreted. Cases and Martin's assessment support clarification, evidence discussion and follow-ups without permanently blocking the investigation.

Five folders contain 24 authored digital files: twelve case leads/alternate drafts and twelve pieces of office life. Search filenames, follow case links, and clip digital extracts into your notebook. Digital material never substitutes for original evidence. Directory connects to the four existing contacts; Print Queue reports the actual printer. Snake has pause/restart, a saved personal best and fictional coworker scores, with no investigation rewards.

Desktop save version 2 preserves prior notes, sketches, correspondence and drafts. Before upgrading a version-1 desk save, the game retains its raw data under `archive-office-before-desktop-v2`. Existing drafts require a response selection before sending. [Desk guide](docs/DESK-LIFE.md) explains the rules.

## Controls and tools

| Control | Action |
| --- | --- |
| WASD / arrows | Move |
| Mouse | Look freely through 360° |
| Q / R | Turn left / right, including without mouse capture |
| Click and drag | Look when mouse capture is unavailable |
| E | Interact, open drawers/boxes, pick up an object, or use equipment |
| I | Open the carried-file inventory; read, equip, stow or manually store documents |
| G | Place the equipped document or first carried file; insert an original in the printer; place a mug |
| F | Read the equipped or first carried original/copy |
| Left click | Drink from the held mug; otherwise interact (dragging only looks) |
| Shift | Walk faster |
| M | Wing-level floor plan and cabinet tabs |
| N | Notes and sketches, discoveries, collection catalogue, and shift log |
| U | Equipment requisitions |
| Esc | Pause / close the active document |
| [ / ] | Previous / next folder in the current drawer |
| Tab / Shift+Tab | Navigate menus and document controls |

You start beside your desk in **W4’s work nook**, against its outer wall near the W1 doorway. All four rooms retain their large filing floors. Shared doors connect neighbouring rooms in a loop; open a door with E and walk through continuously. The map shows both the warehouse arrangement and each room’s cabinets. Low storage racks and archive-box stacks crowd the aisles without blocking filing fronts.

Opening and marking a file searched are separate actions. Spreadsheet evidence requires inspecting the relevant cell, sometimes after restoring hidden rows. A folded cell corner indicates a comment.

To collect a voucher, open its file and choose **Collect voucher**. Its value remains pending until **Redeem vouchers** at your desk. Reopening or reimporting a file cannot pay it again. Two early voucher opportunities are placed in accessible uninspected files.

Choose **Retain original** in an opened drawer or box to put the actual original in your carried inventory. The bag holds **two documents**, including printed copies; the **Five-file satchel** upgrade raises this to **five**. After buying the **comparison stand**, compare carried documents, plus documents in personal storage while at the desk. Hidden rows and cell comments work there too. The stand does not solve the mystery automatically.

After buying **coloured cabinet tabs**, select a front bank, rear bank, wall cabinet, or box on the floor plan, choose a colour and write a note (32 characters maximum). Up to 64 markers appear on the map and physical storage; aiming at marked storage shows its note.

**Opening the page containing Martin’s phrase wins immediately.** No selected text, carrying, submission, upgrades or side quests are required. The archive stays accessible afterward.

## Holding and organising originals

Choose **Retain original** to carry a file in your bag, or **Pick up original** to equip it. I opens the inventory; F reads the equipped or first carried document. G places an equipped document (or the first carried file) into aimed filing storage. At the work nook, I also offers a destination selector and a Store action for the two personal drawers or desk tray. Storage is manual: retaining does not send files to your desk. Originals and copies share document capacities and bag slots. Mugs use the hand, without consuming a file slot.

A full destination or inventory refuses the transfer without losing a document. Original references remain stable, and relocation notes lead to the bag, printer input or current filing location. Held documents are lowered and hidden while aiming into filing storage so they cannot obscure the box contents. Retained reference copies from older saves migrate into a **desk binder**, accessible through the desk; they do not overflow the new carried inventory.

Each front, rear, or wall-cabinet drawer starts with 16 files and holds 20. Every file box starts with 8 and holds 10. Your W4 desk has two empty **20-file personal drawers** and a four-file tray. Files retain their text, discoveries, search marks and vouchers when moved. Refiling creates no rewards. The map’s searched counts follow current contents.

## A neglected archive warehouse

You are alone; coworkers appear only in documents. Worn painted metal, yellowed paper, chipped labels, storage bundles, scuffed floors and stained walls give the archive its character. The work nook contains one desk, chair, lamp, pen stand, utility table, coffee machine, printer, shredder, water dispenser, whiteboard, personal pinboard, collection compartment, mail terminal and public notices. The fitted kitchen, microwave, fridge, sink, cupboards, reception seating, plants and coat stands are removed.

- **Coffee:** E operates the coffee machine. Pick up its mug with E, click to drink, and use G to return the empty mug to the tray before brewing again. Three mugs exist; the utility table also accepts them. Coffee grants no reward.
- **Desk fan:** aim at the small fan and press E to switch it on or off. The guarded blades spin up and coast down, with a quiet local motor/air sound; power is saved.
- **Furniture:** the decorative chair is tucked behind the desk, facing its work surface. Each room has one decorative stool in a seed-stable position clear of filing access. Neither offers a seating prompt.
- **Time:** wall clocks and the HUD show device-local time. “Time on shift” preserves cumulative active play, including reading and in-shift tools; pauses, onboarding, unfocused windows and hidden tabs are excluded. There is no countdown.
- **Paperwork:** correspondence, reports, forms, references and workbooks share distinct stationery treatments across originals, comparison and printed copies. Your notebook presents a working case file; supplies and carried files use requisition and file-pocket details.
- **Printer:** carry and insert an original, then print. The original remains in the input tray and a separate copy appears in the output tray. Collect each or both; both occupy inventory slots. Occupied output cannot be overwritten. Copies can be read, manually stored, picked up again, or shredded; workbooks and pagination remain available without discovery rewards. Attachment failures offer retry without partial copies.
- **Shredder:** feed a carried printed copy to the 2.2-second cycle. Originals are protected; shredding never removes source text or progress. The model has a recessed feed opening, rollers, a removable-bin seam and a window into the paper scraps.
- **Water:** place an empty mug on the dispenser tray with G, then E fills it in two seconds. After filling, E on the tap or glass picks it up; click to drink, then G returns it. The smooth hollow glass sits below rounded taps with a visible gap. Pickup is blocked only during filling.
- **Whiteboard:** one mounted board provides four selectable wing pages. Marker colours, sizes, eraser, undo and confirmed clearing remain available. Older wing drawings are preserved. The corkboard is decorative.
- **Lighting:** open conical pendants with visible warm bulbs alternate with slim twin fluorescent tubes. Fixtures wake within 7.5 units, stay on for eight seconds after leaving proximity, and fade out; their visible emission follows the same sensor as the existing nearby light pool. A modest increase in fluorescent output and ambient fill, localized fluorescent pools and a warm desk lamp keep nearby labels readable while leaving darker corners. Perimeter and overhead door fixtures share the existing light pool. Medium/high quality add cached desk shadows; low quality reduces resolution and uses static contact shading.

- **Walls:** artwork and frames preserve the original 2:1 proportions, including the smaller pictures above the work nook. Faded prints, readable safety notices, labelled fictional charts, pinned correspondence and dry office jokes. The coloured centre-floor guide strip has been removed.

- **Sound:** distinct drawer runners and clunks, cardboard, paper, placement, five locally bundled Kenney concrete-shoe recordings with a short, quiet stereo room echo, distance-based footfalls matched to a 1.8-unit/second walk and 3-unit/second run, spaced at least 0.48 seconds while walking (0.34 when running), inventory handling, sensor relays, pouring, shredding, coffee and printer cycles. Paper-page variants, folder tabs, notebook covers, pencil marks, mug placement and completion cues add tactile feedback. Quiet positional clock ticks, electrical hum and irregular building creaks accompany exploration; ambience fades in menus and on focus loss. Footsteps use [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) (CC0); other effects are generated locally through Web Audio. The bundled footstep license and SHA-256 manifest are in `public/audio/footsteps/`. Volume, focus fading and positional machine effects remain available.

Carried documents, stored/held copies, mugs, moved originals, both printer trays and all four whiteboard pages are saved. Machine cycles restore stopped, and seated saves restore standing.

### Inspecting models

Run the development server and open **http://localhost:5173/?models=1**. Choose a model, orbit/zoom it, use the front/back/left/right/top/underneath/perspective presets, toggle wireframe, or switch between neutral and archive lighting. Previews include the powered desk fan, open/closed industrial double doors, stocked front-access boxes, wall cabinets and double cabinets. Toggle Fan power to inspect the moving blades and coast-down. Choose front, rear or both drawer faces when inspecting an open double cabinet. The viewer uses the same procedural model builders as the warehouse and is excluded from production builds.

Reader, printed copies and the comparison stand share layout-only pagination of roughly 90–120 words. Existing wording and authored boundaries remain intact, while new ordinary records include supporting records, actions and follow-up sections. Short notes may remain one page. The target phrase is never broken across pages.

Horizontal mouse turning remains unlimited. Switching windows or tabs pauses exploration. Return and click **Click to resume looking** to recapture the mouse. A genuine denial offers **Retry mouse capture** and an external-browser link; reloading is unnecessary. Stale capture errors are ignored. Hold and drag at the left/right edge to turn continuously, or use Q/R. Dragging never activates an object.

## Existing saves and backups

On first opening this version, a valid version-1 save is migrated automatically. The old `archive-office-save-v1` entry is retained and an untouched copy is stored as `archive-office-v1-backup`. New progress uses `archive-office-save-v3`. Version-2 progress remains in `archive-office-save-v2`, and its untouched raw JSON is backed up as `archive-office-before-expanded-storage` before conversion.

Previously inspected ordinary files retain their old text, so the reader’s memory and search markings remain meaningful. Old target and story locations remain in wing one at the same cabinet/drawer/folder coordinates. Version-2 generation remains pinned for migrated saves, including uninspected original records. New IDs follow the original range. Fresh shifts may place the target in any real storage type; existing saved targets remain unchanged. Historic instructions inside preserved documents may describe the old layout; the current tutorial and map explain the expansion.

Existing version-2 saves without an environment version are migrated once to the warehouse. Before conversion, their untouched JSON is retained as `archive-office-before-warehouse`. Hub positions move to the W4 nook; archive positions remain room-local, with obsolete entrance positions moved inside the room. Retired kitchen/food state is removed, a held food reference is cleared, and surviving mugs move to the coffee tray or utility table. Filing progress and held originals are preserved. If backup storage fails, automatic writes pause and backup export remains available.

Export/import is available in the pause menu. Old JSON backups up to 32 MiB are accepted and migrated, with confirmation before replacing current progress. Storage failures leave an actionable message and offer backup export. Export before clearing browser storage or changing hosts.

## Checks and authoring

```bash
npm test
npm run validate
npm run build
npm run test:browser
```

Browser checks use installed system Chromium when available. Otherwise run `npx playwright install chromium`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select a custom browser. Screenshots and reports are in ignored `test-results/`.

`npm run validate` checks every document across multiple seeds, reference-pack hashes, the unique target, references, content proportions, discovery spacing, voucher rates and local reuse. It reports corpus reuse rather than presenting total displayed word count as unique writing.

- [Content and source architecture](docs/CONTENT.md)
- [Verification and practical limits](docs/VERIFICATION.md)

`src/legacy/` and the version-2 placement schedule in `src/content/generator-v2.ts` are frozen compatibility implementations. Do not edit its generation or layout rules. New content lives in `src/content/`; source metadata is pinned in its manifest, and packs are in `public/content/`. The optional source-build tool is `python3 scripts/import-sources.py`; normal play and builds never download the originals. Changing a released corpus or placement schedule requires a new content version and migration.

## Distribution

Desktop keyboard and mouse are supported. Document panels adapt to narrow screens; touch movement and mobile performance are not implemented. Steam packaging, Steamworks, cloud sync, and multiplayer remain outside this browser deliverable.

The four room shells share one continuous coordinate system, with original cabinet coordinates translated into the 2 × 2 arrangement. Cabinet geometry is instanced by room and row and culled by the camera; room geometry is cached, so crossing a doorway does not rebuild it or teleport the camera. Only one detailed filing container is open at a time; distant box contents use file bundles and tabs. Held objects render in a separate depth pass to prevent clipping into walls. Pixel ratio is capped by quality settings. A cached spotlight shadow map is used for the desk on medium/high quality; no postprocessing chain is used. Six pooled fluorescent lights follow nearby visible fixtures. Closed rooms are culled through shared-door visibility.

Runtime license notices are in `public/third-party-notices.txt`. Reference attribution and required Python notices are included in the content directory and accessible in-game. Kenney model sources, hashes and CC0 notices are in `public/models/manifest.json` and the adjacent licence files.

## Polish architecture and performance

`src/ui/` owns shared document treatments, tool-specific physical surfaces, onboarding screens and decorative office details. `src/styles/surfaces.css` contains the notebook, folder, wallet, clipboard, plan and equipment presentations. `src/runtime/` owns active-shift timing and pooled-light selection. `src/desk/` owns personal notes, the pinboard, collectibles and authored mail. `src/style.css` imports separate token, screen, HUD, document and polish styles; the desk expansion adds its own stylesheet. Existing save and content versions remain unchanged.

The HUD writes only changed values. Background boxes use full paper silhouettes nearby and smaller geometry at a distance, while open containers remain detailed. Light selection uses a reused bounded list; settled light attributes stop uploading; held models refresh on physical-state changes. Medium quality targets 60 FPS at 1440 × 900 on integrated graphics; this is a target, pending a hardware GPU run.

Press **F9** during play to toggle a local performance meter. It shows browser FPS, the 95th-percentile frame time, 3D redraws per second, draw calls and triangles; the 3D rate is deliberately lower while a panel is open. Press F9 again to hide it.

With the local development server running, use `node scripts/performance/stress-actions.mjs` for a repeatable Chromium stress audit. Results go to `docs/performance/`; `docs/VERIFICATION.md` explains measurement limits.

### Ideas for later

1. Department personalities: recurring stationery habits, office disputes and distinct environmental details.
2. Optional office errands: locate small misplaced records for cosmetic rewards.
3. More case-specific collectible models and stationery illustrations.
