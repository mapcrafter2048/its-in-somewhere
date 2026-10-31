# Archive verification

## GitHub and Vercel preparation — 31 October 2026

The publishable project is staged independently of this workspace's unavailable Git metadata. Node.js 24 is pinned in `.nvmrc`, package metadata and CI. `vercel.json` selects Vite, `npm ci`, `npm run build` and `dist`, with immutable caching confined to hashed assets and revalidation for HTML and unversioned bundled content. No backend or environment variables are required. The project remains a single-page static document without a catch-all asset rewrite.

On Node.js 24.22.2, a clean staged install, all 78 logic tests, content validation and production build pass. The production smoke test passes through the ordinary clock-in and keyboard UI, edits a notebook sheet, opens supplies, confirms real model/palette loading, imports the built lazy computer/Snake modules and validates reference JSON and Ogg audio. It confirms development-only game hooks are absent and records no unexpected page errors or failed application requests. The existing Vite large-chunk advisory remains. This verifies deployment readiness, not hardware FPS; a live Vercel deployment has not been created.

GitHub Actions repeats these checks. [Deployment instructions](DEPLOYMENT.md) document Vercel import settings and moving browser saves between origins.

## Room-light override removed — 31 October 2026

The room switches and per-fixture override point lights have been removed after the full-room mode caused a major FPS loss on the player's hardware. Proximity lighting uses its original capped pool again. Earlier saves containing `office.roomLights` still load; validation discards that obsolete field. The earlier geometry, frame pacing and file-count optimizations remain in place. The production build, 78 logic tests and three targeted browser scenarios pass. The removal regression loads an override-enabled save and confirms there are no switches or fixed override lights, only the original six pooled point lights, with proximity lighting active.

## Frame and action stress test — 31 October 2026

The game now has an optional **F9** performance meter. It reports browser frame callbacks per second, the 95th-percentile frame interval, 3D redraws per second, the last rendered scene's draw calls and triangles, and the selected quality. The meter samples the existing frame loop only while visible. Its 3D redraw count is intentionally lower while an interface is open; the UI FPS remains a separate number. No quality setting is changed automatically.

The fresh baseline and post-interface-optimization audit used three isolated 1440×900 medium-quality Chromium runs, six warmup frames and 18 measured animation-frame intervals per scene. It exercised the work nook, a dense W1 aisle, actual walking, the W2 machine, a crowded drawer, a 24-pin/48-link synthetic board, the notebook, and six repeated screen-opening actions including a 7,990-character note. The `stress-before.json` and `stress-after.json` files contain the raw results. **This host has no exposed graphics device and Chromium reports ANGLE Vulkan SwiftShader software rendering. These timings are not the player's hardware FPS.**

The median of the three baseline per-run medians was 194.1 ms (about 5.2 browser frames/s) in the nook, 571.0 ms (1.8/s) in the aisle, 577.2 ms (1.7/s) while walking and 145.8 ms (6.9/s) at the W2 machine. An instrumented aisle frame submitted 132 draw calls and 234,640 triangles. Cabinet handles were the largest named category at 78,912 triangles; cabinet construction contributed 46,032. This identifies geometry volume, while actual GPU and fragment costs must be measured on the player's device.

A second source of hitches was background WebGL work while panels were open. Redraws behind a panel are now limited to once per second, while simulation, active shift time, mail and machine completion continue. In the initial short samples, drawer, board and notebook median UI-frame intervals changed from 42.9 / 42.5 / 39.7 ms to 16.8 / 16.7 / 16.8 ms. These 18-frame samples can miss the remaining once-per-second redraw, so they are not sustained hardware FPS; the longer paired overlay audit provides the stronger comparison. The background is updated less often while a panel is open.

The longer alternating drawer audit (`stress-paired-overlay.json`) sampled at least 3.2 seconds per run, capturing intermittent redraws. Across three paired runs the median UI callback rate was **5.9 → 18.2 callbacks/s**; median frame interval was **38.6 → 16.8 ms**. The median p95 remained high (**578.2 → 521.6 ms**) and p99 was **578.2 → 605.6 ms**, showing that individual software-rendered redraws can still stall the UI. These are software-renderer callback rates, not the player's hardware FPS.

The box-paper detail update previously recomputed each box's file count by scanning the entire printed-copy list for each material batch. It now groups copy counts once, reuses each box's result and counts originals from the existing move index. With 1,541 boxes and 2,000 synthetic stored copies, the median of six warmed samples changed from 41.1 ms to 3.9 ms; the no-copy case changed from 7.5 ms to 4.3 ms. `hotpaths-before.json` and `hotpaths-after.json` record these isolated JavaScript timings; a further final-version run is in `hotpaths-final.json` and illustrates timing variation. A populated-board canvas redraw measured approximately 0.9 ms median in the same baseline, so it was not the priority.

Distant cabinet handles now use a single bar geometry; full handles and drawer interaction remain at close range, and both handle variants follow an opening drawer. A matched aisle capture changed from 234,640 to 201,616 submitted triangles (14.1% fewer) with 132 draw calls in both. The two views are retained in `stress-geometry-before.png` and `stress-geometry-after.png`; the geometry breakdowns are alongside them. The lower triangle count alone does not establish a hardware FPS improvement.

The subsequent adjacent, order-alternating aisle test is in `stress-paired-render.json`. The median of three run medians was **562.8 → 533.8 ms** for the stationary aisle and **568.5 → 541.2 ms** while walking. One stationary pair was 7.2% slower after the change, while the other two improved; these SwiftShader timings are noisy and do not establish a hardware FPS gain. Each sample has 12 frame intervals, so its tail estimate is coarse.

The separate initial action runs drifted substantially over time. Three adjacent, order-alternating comparisons (`stress-paired-actions.json`) found warmed medians around 0.6–0.7 ms to open a drawer, 3.6–3.8 ms for the populated board, 15.0–15.5 ms for Collection and 18.3–18.8 ms to paginate the long note. This indicates little change in synchronous screen construction itself; reduced background interruptions are the measured interface improvement.

Production build and all **77 logic tests pass**, as do **seven targeted browser scenarios** covering the meter, near/far geometry and drawer transforms, resource stability, physical filing and immediate phrase completion, active-time clock/vending, mail delivery and printer workflow. A logic regression compares indexed counts with actual file lists through original moves, copies and returns. Existing save data, ownership rules and graphics-quality settings remain compatible.

## Fixture and folder refinements — 31 October 2026

Folder tabs inherit the selected folder stock on hover and keyboard focus. The office epoch is now **Monday, 8 January 2007 at 08:00**; existing elapsed shift time is preserved. Returned mugs occupy a separate rear row, clear of the repositioned calendar. The stationery box contains three spool models and five markers, batched with their respective tool stock and removed together when equipped.

The vending cabinet now has a hollow collection bay, supported tray and side walls, a bounded visible can-drop path, framed display, hinge details and numbered drink labels. Label text fits its artwork rather than overlapping lines; fixed labels remain in one atlas. No lights, physics or extra running loops were added.

Build and all 76 logic tests pass. Four existing browser scenarios pass for drawers, time/vending, fixture access and resource stability. An additional regression checks hover/focus colour matching, all three returned mugs against the calendar and the dispensed can bounds through its visible drop. Reviewed close-up captures are in `test-results/fixture-refinement/`. Earlier performance numbers below describe the preceding model revision.

## Physical filing, stationery and office life — 31 October 2026

The notebook now has horizontal page flags and 12 immediately browsable numbered sheets, expanding to 36 with Personal stationery. Blank browsing creates no saved note or counter; writing, drawing and clipping retain stable sheet positions, and recycling leaves a blank slot. Equal leaves, reading pagination, reduced motion and the shared book frame remain intact. Discoveries use case dividers and pasted evidence slips; Collection uses larger ink illustrations, aligned captions and blank unknown spaces. Physical controls share spacing, focus and action treatments across the notebook, files, boards, wallet, requisition and equipment.

Storage opens a drawer close-up without inspecting a record. Overlapping labelled folders support keyboard selection, bracket switching, remembered drawer position and an on-demand Contents slip. Opening and returning from a folder preserves the physical reading layout, source guards, workbook controls, ownership and immediate phrase completion. Front/rear drawers, wall storage, boxes, personal storage, copies, moved originals and bottom-of-drawer finds retain their existing rules.

The W4 utility table holds a stationery box and dimensional calendar, clear of the coffee machine and printer. Separate sticky notes support a retained 280-character draft, detachment, carrying, storage, return and confirmed recycling. Eight reusable notes expand to 24 for 24 credits; three additional colours cost 16 credits. The reusable thread tool links typed sticky/notebook endpoints without ID collisions; Escape cancels the first endpoint. Markers enable drawing and erasing, while unequipped whiteboards remain readable. One held object is enforced across files, tools, notes and drinks. Upgrade descriptions state their effect followed by restrained office humour.

Four dimensional clocks, HUD and calendar derive from saved active shift seconds: Monday 8 January 2024 at 08:00, advancing one-to-one through reading and equipment interactions, stopping during explicit pause, onboarding, focus loss and hidden/offline time. W2 has a free three-choice vending machine with labelled stock, buttons, a collection chute, finite drop animation and adjacent recycling bin. One pending, collected or stored can persists across reload; drinking and recycling grant no investigation benefit. Fixed cabinet geometry and label artwork are batched; fixtures add no lights or reflections.

`deskLife.version: 3` migrates stable sheet positions and typed board references while preserving existing writing, drawings, correspondence, drafts, rewards and scores. The exact original raw save is backed up under `archive-office-before-stationery-v3`; backup failure keeps the established paused-write recovery flow. Archive IDs, authored content and save identity remain unchanged.

**Validation:** production build, content validation and **76 logic tests pass**. **67 distinct browser scenarios pass across the broad run and corrective reruns**, including nine new physical-life scenarios. The broad run initially exposed a stale notebook Contents list and an obsolete whiteboard-equipment expectation; the interaction was fixed and the checks rerun. Resource assertions now allow the fixed added fixtures and continue asserting a stable plateau rather than permitting recurring growth. The final interaction run passed all 13 scenarios; the screenshot matrix and two world-fixture scenarios also passed after the final inventory-contrast refinement.

Screenshots in `test-results/physical-life/` were reviewed at **1440×900, 1024×768 and 680×850**, including **26px text and reduced motion**, across notes, discoveries, collection, shift log, drawer, folder, board, inventory, supplies, stationery and vending. Desktop leaf measurements remain equal within one pixel. Additional world captures verify projecting clocks, vending/bin placement and reachable tabletop stationery. Logic/browser checks cover rapid edit flush before autosave, stable blank slots and reload, migration failure, full hands, capacities/colours, typed endpoints, cancellation, removal/recycling, marker access, midnight rollover, active-time delivery, printer/mail progression, source failures, evidence and phrase completion.

### Performance evidence

Three matched runs at 1440×900/medium are saved in `docs/performance/physical-before.json` and `physical-after.json`, with captures and a summary. These are **Chromium SwiftShader software-renderer measurements**, not hardware FPS. Median frame intervals (median of three runs) were 164.5→168.8 ms in the work nook (+2.6%), 39.4→39.2 ms in the crowded drawer (−0.5%) and 42.6→46.1 ms at the populated board (+8.2%). Corresponding p95 intervals were 223.9→225.0, 260.2→271.2 and 259.5→274.6 ms. Unchanged-scene median and p95 changes remain below 10%; the deliberately throttled background rendering contributes to overlay p95 intervals.

The directly visible W2 machine changes that scene: draw calls rise from 45 to 48 and triangles from 80,574 to 85,022. The initial candidate cost 53 calls and 93,374 triangles; shared flat trim and a label atlas remove **5 calls and 8,352 triangles** from that candidate. The sequential matrix measured 94.2→127.8 ms there (+35.7%), so an adjacent, order-alternating frozen-before/current comparison is recorded separately in `physical-paired.json`. The adjacent comparison measured **106.9→116.0 ms median (+8.5%)** and **160.0→155.2 ms p95 (−3.0%)** across three runs, showing that the sequential 35.7% result includes substantial run-to-run timing drift. The machine still has a measurable scene cost; no overall hardware performance improvement is claimed.

Repeated visits and equipment cycles reach stable resource counts (250 geometries, 61 textures and 30 root objects in the all-room audit). The extra resources are bounded fixtures; no recurring polling, persistent Snake loop or growing scene/listener allocation was introduced. Median loading was 3,386→3,228 ms; sampled heap ranges were 47.8–56.3→46.9–54.2 MB. Loading times and sampled heap are retained in the raw matrix; software timings and sampled browser heap are environmental observations, not hardware or leak-proof guarantees. The existing Vite large-chunk advisory remains. See [Interfaces](INTERFACES.md) and [Desk life](DESK-LIFE.md) for layouts and controls.

## Unified notebook and physical file browsing — 30 October 2026

The four notebook sections now use one persistent cloth-bound frame, equal facing leaves, overlaid binding, four permanent right-edge tabs, a Contents bookmark and shared page controls. Collection and Shift log no longer open separate containers. Notes have paginated reading and a two-leaf editor; discoveries retain their evidence and conclusions as paper clippings. The catalogue contains 24 individual SVG ink illustrations, numbered unknown spaces, identification controls, milestone details, stamp selection and the certificate. The activity ledger and full receipt download remain inside the book. No save-schema migration was introduced.

The reader keeps its filing index beside an open manila jacket with printed reference/storage labels, a projecting tab, three decorative sheet edges and handling tools below the sheet. All five document stationery families, original wording, pagination, source credits and workbook controls remain. Loading and Retry use the same folder. Request generations reject obsolete attachment results before inspection or phrase detection.

**Verification:** production build, content validation and all **68 logic tests pass**. **41 relevant browser scenarios passed across targeted runs**: the existing desk-life, desktop, expansion, game and interface suites; five new notebook/folder scenarios; and representative storage/moved-original checks. Failed intermediate checks were corrected and rerun. The final targeted checks pass.

The notebook matrix was captured and reviewed at **1440×900, 1024×768 and 680×850**, at both **18px and 26px**, including reduced motion. Desktop leaves have equal measured widths and heights (within the one-pixel assertion), and section changes preserve the exact book DOM node. Narrow layouts expose one leaf. Initial measurement hides the second narrow leaf before fitting content, preventing transient extra pages and focus changes. Reflow restores focused entry controls; modal focus wrapping includes source links and handles detached/disabled controls.

Long note text, including unbroken words, Unicode and whitespace, reconstructs exactly from its rendered pages. Tests cover writing/sketch flush, section changes, narrow editing leaves, reload, pinned-sheet restrictions, recycling, empty/partial/full states, multiple cases and conclusions, all 24 distinct illustrations, identification cost without collection credit, stamps, certificates and receipt download. Folder checks cover all stationery families, crowded drawers, bracket navigation, rapid switching, source failure/retry, late results after another selection or closing, moved originals, ownership, printing, visible-cell clipping, hidden rows/comments and immediate target-phrase completion.

Captures are in `test-results/unified/` and `test-results/interfaces/`. [The interface guide](INTERFACES.md) describes the new controllers and layouts. This work changes no world geometry, lights or game-frame rendering. Pagination runs on content/layout changes; its scoped observers disconnect on close. Existing repeated-room/drawer and desk resource checks remain bounded. Chromium uses SwiftShader here; no new hardware FPS claim is made. The existing Vite large-chunk advisory remains.

Earlier sections below document previous revisions and their historical layouts and test counts.

## Coffee mug and shredder cleanup — 30 October 2026

The active mug now uses shared procedural ceramic geometry with a smooth hollow shell and side handle instead of the faceted imported cup. Placed and held mugs share the same liquid radius and level. The dispenser has a shorter round spout and a matching pour stream. The shredder's decorative paper fragments are removed, leaving its bin window clear; the feed-paper animation remains available during shredding.

Production build and all **68 logic tests pass**. The coffee browser regression passes brewing, pickup, drinking, replacement, reload and stopped-cycle restoration. It now waits for the raycast target before interacting and confirms brewing actually starts. Filled/empty mug and clean shredder views were visually reviewed without page errors in `test-results/coffee-model/`.

## Office UI and desktop revamp — 30 October 2026

The notebook now uses a broad clothbound spread, ruled sheets, section tabs during editing, numbered pages and previous/next navigation. Leather inventory pockets, blue drafting paper, a requisition clipboard, cork boards, enamel whiteboard, equipment housings, display compartments and five document stocks distinguish the remaining interfaces. Existing document words, evidence controls and pagination are unchanged. Screenshots were reviewed at desktop and intermediate widths; narrow layouts and 26px text retain usable controls. Finite animation is disabled for review captures so screenshots show the settled material colours.

The computer retains its CRT shell and adds Mail, Files, Directory, Print Queue and Snake. An opened message presents three authored replies on the adjacent response sheet; selecting one prepares a draft before sending. The six existing cases and Martin assessment have contextual enquiry/discussion/resolution responses, explicit physical-evidence requirements, optional verbatim personal notes and idempotent outcomes. Prior humorous choices affect subsequent clarification wording. Unresolved cases may send one follow-up after three active minutes; this is not a deadline. Twenty-four digital files provide twelve case leads/alternate drafts and twelve office-life documents across five folders. Digital excerpts remain separate from physical evidence. The directory routes to existing cases and the queue reflects the actual printer. Snake is lazy-loaded, pauses on focus loss and disposes its timer when closed; its saved best and fictional coworker scores have no progression effect.

`deskLife.version: 2` adds response history, a Snake best score and separate digital excerpt metadata. Version-1 desk saves retain their notes, drawings, mail and drafts, with exact raw backups under `archive-office-before-desktop-v2`. Backup failure retains the existing paused-write recovery path. Old drafts require a response choice before sending. Archive save/content versions, the assignment target and physical file identities remain unchanged.

The fan keeps its supported desktop location and derives its yaw from the shared chair position. Geometry and assembled-office checks confirm that its grille points toward the chair, its bounds remain clear, E toggles it, its rotor turns and its power state survives reload. The reviewed chair-side capture is `test-results/revamp-apps/fan-from-chair.png`.

### Validation

- Production build and all **68 logic tests pass**. New cases cover every correspondence case, distinct reply outcomes, evidence gates, Martin hints, timed follow-up deduplication, old-desk migration/backup failure, digital locks, Snake rules and fan direction.
- **31 distinct browser scenarios pass** across the broad audit and finishing reruns. Coverage includes the original game loop, immediate phrase completion, spreadsheet evidence, import/export/corrupt storage, physical interactions, fan and door lights at all qualities, notebook/board persistence, desktop navigation, three viewport widths, 26px text, reduced motion, draft preservation, response selection, digital clippings, live mail status in Files, Snake disposal and resource plateaus.
- The initial document-family run was interrupted by a development reload; the stable rerun passes all five families. A legacy fixed-delay focus assertion was replaced with confirmed real browser focus loss before measuring the paused clock; its rerun passes.
- Content validation passes seeds **7391, 1 and 9041**, each with **152,616 originals, one target phrase, and no dry storage containers**. Source hashes and original reference material remain intact.

### Rendering and performance method

Simulation and delivery now run independently of background rendering. Interfaces cap background WebGL rendering at four submissions of the main scene per second instead of twenty and reserve at least three UI-only animation frames between background draws. This also protects UI time when a software-rendered frame itself exceeds the throttle interval. Targeting/held-object work is skipped while inactive; machine completion and shift timing continue. Portal visibility is cached until camera/projection/door state changes; light sensors and pooled-light selection update at most at 10 Hz. Existing distance-based paper detail and quality settings remain intact. New apps add no world lights or meshes, render only when active, and load desktop content/Snake on demand.

The repeatable audit is `scripts/performance/revamp.mjs`: three sequential runs, 1440×900, medium quality, identical seed/camera/view sequence and twelve sampled animation-frame intervals per view. It records loading, median/p95 intervals, draw calls, triangles, memory and resource counts for desk, aisle, drawer, all four wings, notebook, file reader and computer. Before runs use an untouched source snapshot on a separate server/cache; before and after browsers run sequentially without competing browser tests. Use `REVAMP_BASE_URL=http://127.0.0.1:PORT node scripts/performance/revamp.mjs LABEL` to select another server. Interface interval measurements describe UI responsiveness while reading; they are not exploration FPS.

Results are retained in `docs/performance/revamp-before.json` and `revamp-after.json`, with settled screenshots in the matching `captures-*` directories. These are Chromium **SwiftShader software-renderer** comparisons. Hardware GPU FPS, multi-hour play and subjective sound quality have not been measured in this pass. The existing large-chunk build advisory remains; desktop apps and Snake are separate lazy chunks.





### Measured results

The original sequential audit and the final sequential audit were separated by several hours; the unchanged original desk went from about 186 ms to about 281–292 ms in later runs. Those sequential timings cannot establish a code regression. The adjacent audit therefore compares versions view by view, reverses their order on the second run, fixes device scale to 1, and records the actual renderer and drawing buffer. Both versions report the same Vulkan SwiftShader renderer at 1440×900.

The table uses medians of three run-level measurements. Most views use twelve intervals per run. The desk row uses a dedicated **60-interval** audit after eight warmup frames: the short audit had isolated desk spikes that disproportionately affected its p95 estimate. Paired change is the median of the per-run percentage changes. These are software-renderer intervals in milliseconds, not hardware FPS.

| View | Median ms, before → after | p95 ms, before → after | Median paired change |
| --- | ---: | ---: | ---: | ---: |
| desk | 283.2 → 275.7 | 320.1 → 314.7 | -2.8% |
| aisle | 951.0 → 942.9 | 1012.7 → 977.3 | -0.9% |
| drawer | 720.0 → 721.4 | 807.7 → 770.7 | 0.7% |
| travel-W1 | 944.4 → 943.4 | 990.9 → 992.2 | -0.1% |
| travel-W2 | 941.9 → 941.3 | 1006.9 → 1006.2 | 0.8% |
| travel-W3 | 969.7 → 971.9 | 1055.1 → 1036.5 | 0.2% |
| travel-W4 | 1405.2 → 1430.6 | 3117.9 → 2931.9 | 1.8% |
| notebook | 293.1 → 62.1 | 314.0 → 328.1 | -78.3% |
| files | 297.4 → 67.1 | 358.5 → 349.8 | -77.4% |
| computer | 293.7 → 79.8 | 390.7 → 327.8 | -72.8% |

Paired median exploration changes remain below the 10% regression threshold; the longer desk p95 comparison also remains below that threshold in all three pairs. Interface medians improve by approximately **73–78%** in the paired audit. Individual software-rendered stalls remain visible in the raw intervals, so this does not establish smooth hardware play or uniform tail latency.

The resource comparison caught an initialization issue in the first throttle implementation: immediately opening a panel could leave dirty paper detail pending, and held visuals needed to be hidden immediately on unlock. The final correction processes dirty detail through its existing cache guard and hides held visuals while inactive. Three final desk/notebook/reader/computer passes now all report **115 draw calls, 100,595 triangles and 49 geometries**, matching the original W4 budget; no held visual remains visible. Their final panel medians are 73.3 ms (notebook), 63.3 ms (reader) and 59.6 ms (computer). The active-view path retains the same detail update behaviour.

Raw data: `revamp-before.json`, `revamp-after.json`, `revamp-paired.json`, `revamp-final-paused.json`, `revamp-desk-tail.json` and `revamp-summary.json` under `docs/performance/`. The adjacent collector is `scripts/performance/paired-revamp.mjs`; the longer desk collector is `desk-tail-revamp.mjs`. The before server uses the untouched snapshot on port 5175 and the current server uses port 5174. Only one page renders at a time.

The audits below describe earlier revisions and retain their original test counts, images and bundle figures.

## Physical interface personalities — 30 October 2026

The overlay system now assigns each tool a physical presentation rather than giving every tool the same paper-panel appearance. The notebook has an olive cover, facing index/page spread, metal rings, section tabs and ruled writing area. Files use a manila cover, projecting folder tabs, stacked sheets and a paperclip; letters, reports, forms, reference extracts and spreadsheets retain their own shared stationery across originals, comparison and copies. Inventory has labelled occupied/empty pockets; supplies use a clipped requisition sheet; the floor plan uses folded drafting paper. The desk is a blotter with tool cards and drawer-handle controls. Printer/shredder housings, whiteboard rails, cork boards, display compartments, receipts, source catalogue, personnel settings and routing slips complete the remaining tools. The computer retains its dedicated vintage desktop.

`src/ui/surfaces.ts` applies the object presentation once when an overlay is replaced. Notebook navigation moves onto its index page as the same live DOM controls; document bodies, hidden cells/comments, pagination, inventory capacities, costs, progression and saves are unchanged. Printer feed/output trays and empty wallet pockets describe actual game state. There are no new frame-loop writes, WebGL assets, lights, texture uploads, polling or permanent event listeners. The keyboard focus loop now includes real source links as well as buttons, form fields and drawing surfaces.

Production build and all **62 logic tests pass**. **Fourteen distinct browser scenarios pass** across the new gallery and focused regressions: writing/drawing and board persistence; wallet storage; requisitions; map and desk navigation; printer trays and copies; all five document families; hidden collectibles; visible-cell clipping and cosmetic stamps; comparison evidence; immediate phrase completion; save export/import/reset and blocked persistence; whiteboard tools; and the vintage mail desktop. The gallery also checks 680px layouts, 26px document text, a long unbroken note title, reduced motion, Tab/Shift+Tab wrapping, source-link focus and Escape. The final accessibility rerun passes.

Thirty-four interface captures are under `test-results/interfaces/`, including desktop tools, all document families and narrow views. [The interface guide](INTERFACES.md) maps each tool to its presentation and explains extension points. This pass adds no hardware FPS or human listening claim. Production output is approximately 996 kB / 289 kB gzip for the game script, with the existing large-chunk advisory; the additional styles are bundled locally.


## Vintage workstation — 30 October 2026

The desk PC is now a beige, chair-facing 486-style workstation, rotated 180 degrees from the previous terminal. The CRT has a deep tapered case, curved glass, raised bezel, rear ventilation, controls and a monitor cable. Its keyboard has individual keycaps, legends, a function row and numeric pad; a wired two-button mouse sits on a pad. A floor-supported tower with drive bays, ventilation and power details fits below the desktop, clear of the personal filing cabinet. The computer remains usable from both sides of the desk without adding a seating interaction.

The computer uses dedicated desktop chrome rather than the archive's paperwork panel: a CRT bezel, muted desktop, title bar, working Mailbox/Correspondence/Enclosures commands, bevelled folder controls, selected message rows, inset message/editor panes, queue status and a taskbar. Scanlines are static and faint; no flicker, boot delay or new live light is introduced. Drafts are retained before navigating between folders, and Enclosures focuses the attachment search after the screen's normal focus transition. Existing message rules, delayed delivery, save contracts and assignment progression are unchanged.

The model uses **four render meshes and 2,594 triangles**, including individual keys and cables. Fixed solids are batched with vertex colours; keyboard legends use one atlas, and the existing cached screen texture refreshes only when unread mail changes. Two geometry regressions verify the opposite screen normal, CRT depth, actual desktop bounds, mouse clearance, floor-supported tower, and the fixed rendering budget.

Production build and all **62 logic tests pass**. Five relevant browser scenarios pass across targeted runs: existing draft/delivery/pause/focus behaviour; repeated room/edit resource plateaus; physical E interaction with desk features; the new desktop, working menus, fast draft navigation, sent/incoming message selection, 680px layout, 26px message text, focus trapping and Escape; and access from both aisle and chair side. Front/rear/tower and inbox/compose/message/narrow screenshots are in `test-results/vintage-pc/`. Hardware GPU frame rates were not remeasured in this presentation pass.


## Personal desk expansion — 30 October 2026

The additive desk expansion preserves the archive generator, document IDs, original story rewards and immediate phrase-completion rule. Its independent `deskLife.version: 1` state contains notes, board references, collection, correspondence, cosmetic stamps and counters. Existing shifts receive empty stationery and already-read copies of previously earned Martin exchanges. Raw JSON is backed up as `archive-office-before-desk-life` before writing a migration; backup failure leaves automatic writes paused and export available.

Twenty-four artifacts occupy unique seeded drawers, six per wing. They appear only below the opened drawer's originals, moved-file notices and copies, and remain collectible when its files move elsewhere. Remote retained readers omit the collection control. Identification costs four credits but does not gate free contextual/exact email leads or collection. Milestones are idempotent; stamps cannot change searched/evidence/completion state.

Notebook sheets retain typed text, normalized sketches, paper colour and source-labelled visible excerpts. Board pins reference the same sheets, preserving writing on pin/return. Pinned editing requires the work nook. The board supports keyboard movement, labelled connection controls, string colours, arrangement undo and recycling confirmation. Original whiteboards retain their independent drawings. Limits and safe text rendering are described in [the desk guide](DESK-LIFE.md).

The four-contact terminal uses authored recipient/subject/evidence rules and retained free-text bodies. Case submissions require two uncovered evidence records; unopened workbook evidence cannot satisfy them. Six optional cases use existing story references. Replies are due after deterministic 30–90-second active-shift delays, survive reload, and do not advance during breaks or offline time. The unread light updates once per second or when correspondence changes, with a quiet nearby cue. New Martin hints are applied when a reply is opened; migrated hints remain earned.

The board and public notices use cached canvas textures, refreshed by edits/progress rather than frame-loop writes. Found objects use fixed-capacity instancing and shared geometry. The compact terminal adds no live light. Its fixed solids and collection shelves are batched into one vertex-colour mesh; the expanding frame and cached screen remain separate. Audio adds tear, pin, keyboard, mail and collection cues through the existing bounded/muted/focus-aware engine.

### Checks and remaining limits

Production build, all **60 logic tests**, and the content audit across seeds 7391, 1 and 9041 pass. The seven new logic cases cover five-seed placement, original movement, optional identification/rewards, capacities and saved drawings, mail evidence/delay/deduplication, all six cases and all 24 exact leads, Martin migration and backup failure. **34 distinct browser scenarios pass** across the broad run and targeted reruns. Older tests now select the Discoveries tab explicitly, include both bundled asset credits, and use low quality for functional doorway traversal under software rendering. The final targeted run passes all eight scenarios, including direct E interaction with every new feature and actual board-upgrade bounds. Follow-up checks cover live inbox arrival without replacing drafts, supported positions for all 24 display objects, and the earned paperweight/stand bounds.

New browser checks cover notebook/sketch/link reload, keyboard board movement, hidden drawer bottoms and empty drawers, remote-reader exclusion, drafts/replies/pause/focus, visible-cell clipping, cosmetic stamp invariants, rewards/receipt, audio cleanup and repeated room/edit resource plateaus. Screenshots are under `test-results/desk-life/`. Existing regressions cover original inventory, vouchers, comparison, printing, save import/export, corruption recovery, focus trapping, phrase completion, furniture, clocks and source loading.


### Final performance comparison

[Final samples](performance/desk-life-after.json) use the same Chromium/SwiftShader renderer, 1440 × 900 viewport, medium quality, camera positions and seed as the [previous polish samples](performance/polish-after.json): 35 frames per view and 12 for the open drawer. The measurement script now passes the frame count explicitly into the browser; it no longer accidentally reads `window.name` for that choice.

| View | Mean frame ms, prior → desk expansion | Draw calls, prior → expansion | Triangles, prior → expansion |
| --- | ---: | ---: | ---: |
| desk | 146.6 → 146.7 | 111 → 113 | 97,689 → 100,125 |
| aisle | 513.0 → 492.2 | 131 → 131 | 233,466 → 233,466 |
| drawer | 511.3 → 548.7 | 122 → 122 | 227,154 → 227,154 |
| travel-W1 | 643.9 → 620.3 | 131 → 131 | 233,466 → 233,466 |
| travel-W2 | 589.1 → 595.9 | 130 → 130 | 230,766 → 230,766 |
| travel-W3 | 611.3 → 605.9 | 145 → 145 | 265,706 → 265,706 |
| travel-W4 | 890.1 → 873.1 | 274 → 273 | 318,473 → 318,509 |

Desk mean frame time is essentially unchanged, with two additional draw calls over the previous polish pass. Batching the terminal and shelf solids reduced the expansion's desk submission count from 121 to 113 despite adding the display shelves; the [unbatched sample](performance/desk-life-unbatched.json) is retained. The aisle/travel timings vary in both directions, and the drawer sample is slower; these single runs do not establish a general speedup. Cold navigation to clock-in measured 4.68 → 4.22 seconds, with the same single-run limitation.

The final room sample contains **235 geometries, 61 textures and 29 top-level objects**, within the existing 240/96 resource ceilings. Browser cycles and repeated board edits keep settled geometry/texture counts flat. Sampled JavaScript heap ranges from 43.6 to 50.9 MiB, including the expanded archive and desk state. Production game output is approximately 983 kB / 284 kB gzip and retains the existing large-chunk advisory. The production bundle excludes the debug bridge and model viewer.


A human listening pass, integrated-GPU 60 FPS measurement, extended playthrough and embedded IDE preview remain unverified. Automated audio checks establish event coverage, bounds and cleanup rather than subjective sound quality. The physical display uses stylised shared-geometry keepsakes rather than 24 bespoke asset models.


## Archive polish — 29 October 2026

The archive keeps its existing content schedule, typography and palette. The reader, comparison and physical copies now share five stationery families, department letterheads, seeded wear and retained-record footers. The notebook presents a working case file; requisitions and inventory have paper details. A coffee ring and a corrected notice add small authored details to the work nook. Screens, shared document presentation, shift timing and light selection have dedicated modules; CSS is separated into tokens, screens, HUD and document styles.

The chair remains between the desk and wall, facing the desktop, with no seat registration or interaction hit. Exactly one decorative stool per wing uses the existing seeded placement. Tests check actual model bounds against storage across five seeds and all four wings, and confirm the chair does not intersect the desk or wall. Device-local wall clocks and HUD time update once per second. The saved shift counter uses monotonic real elapsed time rather than capped movement time, counts reading and in-shift tools, and excludes onboarding, pauses, hidden tabs and unfocused windows. Import and reset keep their existing save contracts; prior undercounted time is not reconstructed.

Audio adds page variations, folder tabs, notebook opening/closing, pencil marks, mug placement, completion cues, nearby clock ticks and irregular building sounds. Effects have duplicate suppression, subtle variation and a 48-voice admission bound. Browser checks cover cue coverage, mute, focus suppression, finite-source cleanup and overlap limits. Subjective listening remains a human check; no manual listening result is claimed.

### Performance evidence

HUD writes are idempotent and inventory totals update with state changes. Rendering reuses room/light selection buffers, uploads fixture changes only while changing, and refreshes held models on physical-state changes. Background boxes keep detailed silhouettes nearby and use 32-triangle jacket/tab bundles farther away; open storage retains its detailed contents. Existing instancing, portal culling, pooled lights and cached shadows remain.

The following measurements use the same Chromium, 1440 × 900 viewport, medium quality and camera positions with software WebGL. All views use 35 frames except the separately corrected 12-frame open-drawer sample. “Travel” samples restore each wing/camera in sequence; physical door traversal is tested separately. Baseline summaries and final measurements are retained in `docs/performance/polish-before.json` and `polish-after.json`. The original baseline output file was cleared by Playwright; its captured command output supplies the retained summary, without invented baseline p95 or JS-heap values.

| View | Mean frame ms, before → after | Triangles, before → after | Draw calls, before → after |
| --- | ---: | ---: | ---: |
| desk | 144.2 → 146.6 | 103,053 → 97,689 | 111 → 111 |
| aisle | 555.1 → 513.0 | 259,386 → 233,466 | 129 → 131 |
| Open drawer (12 frames) | 408.2 → 511.3 | 253,986 → 227,154 | 121 → 122 |
| travel-W1 | 711.3 → 643.9 | 259,386 → 233,466 | 129 → 131 |
| travel-W2 | 674.3 → 589.1 | 256,686 → 230,766 | 128 → 130 |
| travel-W3 | 689.0 → 611.3 | 291,626 → 265,706 | 143 → 145 |
| travel-W4 | 1005.4 → 890.1 | 344,769 → 318,473 | 270 → 274 |

Aisle and room-travel samples improve approximately 8–13% in mean frame time, with roughly 9–10% fewer submitted triangles. Desk timing is essentially unchanged. The isolated open-drawer sample is slower and does not establish a speedup. Cold navigation to clock-in is 4.50 s before and 4.68 s after; loading has not improved. These single-run timings are affected by software-renderer variability. Final sampled JS heap is about 42–47 MiB, with no comparable baseline heap retained. The final full-room sample uses 240 geometries / 58 textures / 29 scene children; the three-cycle drawer/room audit settles at 237 / 58 / 29 in every cycle, within existing ceilings.

**60 FPS at 1440 × 900 on integrated graphics remains an unverified target.** Software WebGL measurements are not evidence of hardware GPU performance. The production game chunk is approximately 937 kB / 268 kB gzip and retains Vite’s large-chunk advisory. Development inspection tools and the `__GAME__` bridge remain excluded from production.

### Verification

Strict production build, 53 logic tests and content validation for seeds 7391, 1 and 9041 pass. Fifteen distinct focused browser scenarios cover timing through reading, notebook, pause, focus loss, reload and new shift; all stationery families; actual clock hands; near/far paper counts and open/closed box transitions; audio; save/import compatibility; printing and workbook comments; shared pagination; decorative furniture; storage access; low/medium/high quality; continuous door traversal; held-file clearance, unsuccessful-placement equip display, and resource plateau. Screenshots are in `test-results/polish/` and the existing quality/traversal audit locations.

Human listening, a hardware GPU profile and a multi-hour human playthrough remain unverified. Earlier sections below describe preceding revisions.


## Desk fan, walking pace, doors and wall art

A small shared procedural desk-fan model has a weighted base, stand, rear motor, three curved blades, front/rear guard wires and a power switch. The inspector offers a separate Fan power toggle. The model and industrial double doors were inspected from front, back, both sides, top, underneath and perspective before warehouse assembly. The door preview also checks opened leaves.

The fan occupies the clear rear-right desktop area. E toggles saved power; blades accelerate and coast to rest. Quiet filtered airflow follows distance, volume, pause and focus fading. Legacy appliance state defaults to fan off. Browser checks use the actual E interaction, verify rotor motion, reload power and compare real bounds against the lamp, pen stand and desk papers.

Walking is now 1.8 units/second and running 3, matched to 0.864/1.02-unit footfall distances and minimum 0.48/0.34-second spacing. The existing shoe recordings and small echo remain unchanged. Logic checks exercise both gaits at 30, 60 and 120 FPS and stationary/blocked movement.

Room doors now have recessed metal panels, push bars, hinges, fasteners and kick plates on both faces. Their meeting edge has an overlapping metal seal on both faces, closing the former visible centre slit while moving with the left leaf. Each side has an overhead warm lamp using the existing quality-dependent live-light pool (2/4/6). Lights use the existing 7.5-unit proximity, eight-second delay and fading. The aperture and functional hinge origins remain aligned with shared-wall collision.

All 32 wall compositions use geometry matching their native 2:1 artwork. The four shorter W4 pictures shrink proportionally instead of squeezing the complete canvas into a wide strip.

Validation: strict production build, 49 logic tests and content validation passed. Three focused browser checks passed for isolated model views, in-game fan interaction/save/clearance/art ratios, and door lighting at every quality with activation from both sides and delayed shutoff. The existing four-door browser check also passed closed collisions, physical opening, and continuous walks out and back through every connection. Repeated room/drawer visits settle at 239 geometries, 55 textures and 29 scene children across all three cycles, within the unchanged 240-geometry budget. Solid fan and door parts are batched with vertex colours; the rotor and hinged leaves remain independently animated. Captures: `test-results/fan-doors/`.

## Work-nook clipping and walking cadence

The right-hand nook box stack physically overlapped the personal cabinet, and the cabinet intersected the desk edge. Nook boxes now use a shared layout array for storage positions and collision, moved left to leave over 0.6 units beside the cabinet. The cabinet is separated from the desk and has a floor plinth. Stack spacing now follows the actual box height, leaving a 3 mm seam rather than floating gaps. Desk papers, lamp, pen stand, printer, coffee machine, envelopes and document trays are aligned to the shared 0.94-unit desktop height.

Geometry regression checks compare the real model bounds of every nook box, the full personal cabinet and the desk. They verify disjoint bounds, stacked-box support, matching collision/storage coordinates and a clear passage. Browser checks physically open all five boxes and verify eight files in each, then check personal filing/save restore, printing/storage/shredding and the nearby dispenser. Reviewed captures of the reported angle and complete desk area are in `test-results/nook-clearance/`.

At that revision, walking used a 1.35-unit stride with a minimum 0.48-second interval; running used 1.55 units and 0.34 seconds. The newer synchronized pace and strides are documented above. Stopping resets pending distance, and blocked movement emits nothing. The shoe recordings and short echo remain unchanged. Cadence regression tests simulate sustained walking/running and confirm walking stays around two steps per second rather than the previous four-plus.

Strict build, all 47 logic tests, and four targeted browser scenarios pass. Existing storage IDs, contents and saved progress are unchanged; normal collision-safe restoration handles an old player position that becomes obstructed by corrected furniture placement.

## Glass pickup, shoe audio and shredder polish

The dispenser control collider is restricted to the taps. Nearby pickup hits take priority over overlapping equipment, and a filled tray glass can also be collected through its tap control. A browser regression fills, collects, drinks, replaces and refills the vessel, then collects it from above and verifies a saved held full glass after reload. This covers the actual raycast/UI path rather than only `canTake`.

`water-cup` keeps its saved ID and item type, but now uses a smooth hollow glass shared by the isolated viewer, dispenser tray and held-object view. Rounded taps end above the rim; a smaller translucent water surface rises during filling and the pour reaches that surface. The base rests on the drip grate. The shredder now has a real recessed feed gap, rollers, moulded head halves, a removable-bin fascia, vents, power control and a window with small paper scraps inside. Its opaque parts share one vertex-colour material while the window remains separate. Seven-angle captures for all three models are in `test-results/machine-polish/models/`.

The pitched synthetic footstep thump is replaced by five concrete-shoe recordings from Kenney Impact Sounds 1.0 (CC0), bundled with the original license and hashes. Samples are level-matched with headroom and modest left/right variation. A short 0.32-second, low-level stereo room response supplies the requested small echo; no looping or feedback delay is used. The offline browser check verifies five decoded samples, nonzero post-impact reflections, a quiet late tail, headroom and voice cleanup. It exports `test-results/machine-polish/footsteps-preview.wav` for listening. Asset loading and gameplay remain local, with existing mute/focus controls.

Strict build, all 45 logic tests and five targeted browser checks pass. The final browser run covers isolated model views, the complete glass pickup cycle, actual decoded footwear audio and echo, printer/copy shredding, and repeated room visits. Resource counts plateau at 233 geometries, 55 textures and 29 top-level objects, within the existing limits. Production output excludes the debug bridge and model viewer. Earlier audit results are retained below.

## Physical inventory, machines and proximity lights

Retain now carries the actual original in a two-slot document bag. The existing bookmarks upgrade becomes the five-file satchel. I opens the inventory; originals and printed copies share capacity, can be equipped or stowed, and must be filed manually. At the desk, choose a personal drawer/tray and Store; G places an equipped or first carried document into aimed filing storage. Copy and original loads share container capacities. Reference IDs, progress and archive content remain unchanged.

Printing requires a carried original in the physical input tray. The four-second cycle leaves that original in place and creates a separately collectable copy in the output tray. Occupied output cannot be overwritten. Both trays may be collected independently or atomically if the bag has space. Stored copies can be retrieved and read with preserved pagination/workbooks; copying, moving and shredding pay no evidence or voucher rewards. The shredder only accepts carried copies, protects every original and runs for 2.2 seconds. The dispenser fills a mug in two seconds and blocks pickup while pouring. Both machines are placed in W4 with clear front access.

The box-view obstruction is addressed by lowering equipped documents and hiding them while aiming into filing storage or reading. `test-results/inventory/box-clear-view.png` verifies a retained original no longer covers the open box view. Footsteps use actual distance travelled, with stronger heel/scuff layers and faster running cadence. New sounds cover inventory handling, water pouring, shredding and sensor relays; machine voices stop on reset/import and focus/mute controls remain in effect.

Nearby fixtures activate within 7.5 units, stay awake for eight seconds after leaving proximity, then fade. The same sensor drives visible bulb emission and the existing live-light pool, capped at two/four/six by quality. Browser checks verify delayed shutoff, relighting, walking sounds and a clear held-file view. Quality captures retain readable local labels and darker inactive areas.

`Save.inventoryVersion = 1` versions this environment interaction change without regenerating the content schedule. Migration backs up untouched raw data as `archive-office-before-inventory`, preserves earlier backups, moves old retained copies into a desk binder and makes old completed output collectable. Held and moved originals remain in place. Import uses the same idempotent conversion; failed backups pause automatic writes. Validation covers duplicate/held copy IDs, bag and combined filing capacity, input uniqueness and agreement between the output tray and its saved physical copy.

The shredder and dispenser were inspected separately before placement from seven angles including the underside; refreshed captures also include the printed-copy model (21 images in `test-results/inventory/models/`). Loaded in-room captures verify mug/nozzle clearance, shredder access, printer trays and the compact five-slot panel.

Strict production build and all 44 logic tests pass. Fourteen distinct relevant browser scenarios pass across initial checks and targeted reruns, covering the above flows plus older-save imports, comparison evidence, printer attachment retry, persistence and low/medium/high lighting. Three repeated room cycles settle at 238 geometries, 55 textures and 29 top-level objects without growth. The original resource ceilings are unchanged; that software-renderer audit now allows 150 seconds instead of 60. The main game chunk is approximately 889 kB / 253 kB gzip, with the existing large-chunk advisory. Hardware GPU performance remains unmeasured.

The following sections retain audits of earlier revisions.

## Latest visual refinement

The striped box fill has been replaced with separate thin paper files: soft manila jackets, exposed sheets, staggered tabs, small labels and metal fasteners. Open drawers and held originals use the same file builder. Background contents preserve separate paper silhouettes with 112 triangles per eight-file group and one shared material; detailed active containers are merged by material and cached per file count.

Slim twin fluorescent fixtures alternate with open conical pendant shades. The pendant has a cable, ceiling cup, socket, lining, rim and visible warm bulb. Mounts touch the ceiling, and the shapes remain above cabinet clearance. Each room has sixteen pendants and twenty-two tube fixtures, including the perimeter fixtures. The existing two/four/six nearby live-light pool remains unchanged. The coloured centre-floor guide stripe is removed.

Eight wall compositions per room now contain readable notices, labelled fictional bar/line charts, a floor plan, a retention table, pinned correspondence and office jokes. Decorative text introduces no filing rules or live statistics. Original drawings and searchable records are unaffected.

Before room assembly, five models were captured and inspected from front, back, left, right, top, underside and perspective views, plus an archive-light underside view of the pendant. Seven further captures inspect simplified file geometry: 43 images in `test-results/refinement/models/`. The viewer now offers an underside view, hiding its neutral floor only for that angle. Fixtures are grounded for inspection while their shared geometry keeps its ceiling origin in the game.

Strict build and 39 logic tests pass. Seven relevant browser scenarios cover isolated models, simplified files, storage access, original pickup/refiling/restoration, sign faces, the integrated scene, and low/medium/high quality. In-room captures in `test-results/refinement/` show static/detailed boxes, the clear hallway, fixtures, both charts and the notices. The reviewed lit scenes retain dark corners, readable local references, a warm desk pool and warm pendant pools. No new live lights or dynamic shadows are introduced.

The main game bundle is approximately 871 kB / 247 kB gzip. The final quality audit reports 99,940 triangles / 157 calls in the angled nook view and 256,648 triangles / 124 calls down the aisle, with 29 top-level objects. These views differ from the initial-camera sample below. The new visible paper geometry costs more than a solid fill; simplified geometry reduces the provisional aisle result from 397,960 to 256,648 triangles. Hardware GPU performance remains unmeasured.

The following sections retain the preceding full-archive audit; their screenshot counts and rendering measurements describe that earlier revision.

## Automated checks

- Strict TypeScript and production build pass. The main game chunk is approximately 865 kB / 244 kB gzip; Vite retains its existing large-chunk advisory.
- All 39 logic tests pass. Expanded checks enumerate every original and container, verify capacities and relocation, compare all 65,536 original records with the frozen version-2 generator, and exercise migration, independent searched totals and tabs, pagination, and actual model clearance.
- Browser verification covers all 39 distinct scenarios successfully across the full suite and targeted finishing reruns. Real-focus recapture and sound checks pass after disabling Chromium focus emulation after navigation. Door traversal uses low quality and longer timeouts for software rendering; quality comparisons separately cover all three levels.
- Production asset inspection confirms that the model viewer and `__GAME__` bridge are absent.
- Content validation passes seeds 7391, 1 and 9041: 152,616 originals per seed, exactly one target phrase, no storage without correspondence/story/annotated material, and minimum measured full-body repeat distance 634. Seed 7391 contains approximately 25.84 million displayed words and 37,078 distinct full-text strings. Reference excerpts and ordinary records are intentionally reused; the archive does not claim individually authored text for every file.

## Storage and collision

The catalogue contains 512 front banks, 512 independent rear banks, 72 wall-cabinet banks, and 1,541 front-access boxes. All banks have eight drawers, initially sixteen originals each and capacity twenty. Boxes initially hold eight originals and capacity ten. Original front keys and IDs are unchanged; appended ranges end at ID 152,615.

A browser audit checks an unobstructed operating position for every catalogue unit and physically opens representative front/rear drawers, cabinets on both walls, shelf boxes and the final nook box. Relocation checks move an original through rear, wall and box storage, retain its original reference and text, save and reload its searched state and coloured tab, and display the tab on aim. The complete connected-room loop, closed-door collision, room visibility and the original 512 frontages are covered separately.

Geometry checks measure at least 0.6575 units beside the extended floor drawer and 0.9825 units between an extended wall drawer and the adjacent row. Row positions and racks move together; room envelopes remain unchanged. Detailed contents are created only for the open container; simplified box contents and static cabinet components are instanced by room/row. Nearby row filtering bounds ray searches.

## Models, decoration and lighting

The development-only `/?models=1` viewer shares warehouse builders. The 100 captures in `test-results/models/` cover all sixteen models from front, back, left, right, top and perspective, plus loaded/open and wireframe previews and separate front/rear open states. Contact-sheet inspection found supported file contents, joined furniture parts, contained drawer trays, mounted handles and closed cabinet seams.

Both faces of each aisle sign use separately oriented single-sided planes. Browser checks count all 64 faces and eight restrained wall compositions per room. Decoration includes faded prints, filing plans, safety and retention notices, and correspondence.

`test-results/warehouse-{nook,aisle}-{low,medium,high}.png` captures each quality level. Fluorescent output rises approximately ten percent, with a small ambient lift; perimeter fixtures use the existing nearest-light pool of two/four/six lights. The warm desk pool and darker corners remain. Medium/high cache a desk spotlight shadow; low uses static contact shading.

## Saves, reading, input and sound

Save/content version 3 is independent of environment version 2 and placement version 2/3. Migration preserves the original target, original generation schedule, story placements, progress, credits, upgrades, moved/held originals, printing, bookmarks and drawings. Fresh placement-version-3 targets may occupy any storage kind. Raw JSON is backed up before conversion in `archive-office-before-expanded-storage`; older save entries and prior backups remain intact. A failed backup pauses automatic writes, including clock-in. Imported version-1 and version-2 backups use the same migration; imports accept up to 32 MiB.

Shared layout pagination preserves original wording and authored boundaries for the reader, comparison and print views. Unit tests move the intact target phrase across every nearby candidate split and verify text equality; spreadsheet structure remains unchanged. New ordinary records have supporting evidence, action/handover and follow-up sections. Short notes stay short.

Focus-loss checks switch tabs/windows, release Escape, retry a genuine capture denial, inject stale capture errors, and verify trusted-click recapture without a reload or unintended object action. Pending requests are invalidated on blur; late capture grants in menus are released. Drag-look and Q/R remain available.

Web Audio checks verify finite effect voices, mute, focus-loss state and restored ambience. Sounds distinguish cardboard, runners/clunks, paper, placement, footsteps, chairs and timed machines. Quiet electrical hum and occasional creaks accompany exploration. These are locally synthesized effects; human listening and the embedded IDE browser remain outside automated coverage.

## Rendering measurements and limits

Browser checks use system Chromium, 1440 × 900 and SwiftShader software WebGL. Hardware GPU performance has not been measured. Reference/cabinet construction increases workload compared with the prior archive; the expanded archive retains room culling, nearby light pooling and bounded resources. The final audit is saved in `test-results/fuller-audit.json`, with no page errors and no lit meshes lacking normals. The prior and final samples use the same browser/hardware, viewport and initial W4 camera, although their storage construction differs.

| Measurement | Prior connected warehouse | Expanded archive |
| --- | ---: | ---: |
| Draw calls | 69 | 86 |
| Triangles | 106,130 | 79,168 |
| GPU geometries | 42 | 41 |
| GPU textures | 9 | 11 |
| Top-level scene objects | 29 | 29 |
| Mean frame time, 40 frames | 241.3 ms | 286.7 ms |

The final sample ranges from 266.6 to 316.7 ms. A separate suite run measured 397.3 ms, demonstrating software-renderer variability; these results do not establish smooth hardware play. Static row batching reduces submitted triangles despite the added independent storage, while additional calls and textures remain. After warm-up, three room cycles plateau at 186 geometries / 56 textures / 29 top-level objects, with no growth.

`test-results/full-storage-{rear,wall,box}.png` and `test-results/full-wall-art.png` capture the added physical details. A multi-hour human playthrough, hardware GPU profiling, subjective listening and the user’s embedded IDE preview remain unverified. Saves remain browser-origin-specific; export before changing ports or clearing storage.
