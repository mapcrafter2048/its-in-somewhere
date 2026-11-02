# Interfaces as office objects

The archive keeps its typography and muted palette, while each tool has a physical identity appropriate to its job.

| Interface | Treatment |
| --- | --- |
| Notebook and individual sheets | Blue cloth cover, broad facing pages, sewn binding, small horizontal page flags, numbered sheets and previous/next page controls |
| Discoveries | Case headings, labelled evidence clippings and conclusions flow across the shared notebook leaves |
| Original files | Drawer close-up with overlapping labelled folders; an opened jacket has one continuous edge, aligned sheets and a right-hand tool flap |
| Correspondence / reports / forms / references / workbooks | Distinct letter stationery, report headings, typewritten fields, book extracts and ledger paper |
| Carried inventory | Brown leather document wallet with numbered occupied and empty file pockets |
| Supplies | Equipment requisition on a hard clipboard, with an order register and ruled rows |
| Floor plan | Folded drafting paper, printed grid and blue drafting ink |
| Desk | Felt blotter, labelled tool cards, drawer-handle controls and voucher paperwork |
| Printer | Equipment housing, separate original-feed/output trays, a status display and physical control buttons |
| Shredder | Disposal console, guarded copy controls and rating plate |
| Personal pinboard / public notices | Separate cork surfaces, mounted controls and pinned notices |
| Collection | Numbered catalogue spaces and 24 individual local SVG ink drawings on the notebook paper |
| Shift log / completion | Ruled activity ledger, downloadable receipt and certificate inside the shared notebook; assignment completion retains its own paperwork |
| Comparison | Two document supports on a stand; each retains independent controls and stationery |
| Printed copies | A stack of physical paper with a perforated margin |
| Legacy copies | Bound desk binder |
| Assignment / onboarding | Office letter packet and a taped personal memo |
| Filing hints / source credits | Retained index card and bibliographic catalogue slips |
| Pause / reset / import | Personnel settings card and routing slips |
| Stationery | Inline pinboard editor and saved sticky/notebook stacks; equipment-free board tools |
| Office fixtures | Modelled clocks in all four wings, shared-date desk calendar, free W2 drinks machine and recycling bin |
| Computer | Vintage CRT with Mail, Files, Directory, Print Queue and Snake; a separate reply sheet beside Mail |

Close controls, keyboard navigation and existing actions retain their normal positions and behaviour. Material decoration introduces no evidence or puzzle requirements. Computer response availability is explicit gameplay state; digital clippings are labelled separately from physical evidence. Text-size settings, reduced motion, hidden spreadsheet rows, source attribution and original pagination remain intact.

## Implementation

`src/ui/notebook.ts` owns the persistent book frame, four tabs, contents bookmark, section navigation and measured pagination. Notes, discoveries, the collection and shift log supply view-only entries. Desktop leaves have identical grid tracks and heights; the binding overlays their common gutter. Below 900px, the same frame displays one leaf at a time. Reading text is split using measured DOM layout, preserving whitespace and Unicode. Stable entry IDs and offsets anchor reflow after resizing or changing text size.

Writing uses the left leaf and sketch/clippings use the right; narrow windows turn between them. Text editors scroll internally. Leaving an editor flushes pending text and strokes before changing sections, entries, sources or screens. All 12/36 numbered sheets are browsable. An empty spread is a view, not a saved note; the first written title/text, stroke or clipping retains it. Saved sheet positions survive recycling, and blank paper preferences are separate from note counters. Session navigation remains separate from saved progress. Short sections distribute their entries across both desktop leaves instead of reserving an index leaf.

Opening storage presents a drawer without inspecting its first file. Folder selection opens the reader, with page controls below the paper and handling tools on its right flap. The contents slip is removed. Bracket keys still switch files and Escape returns to the drawer. Obsolete source loads cannot replace the current file.

The pinboard composes sticky notes inline and places them automatically. Notes render as readable paper elements over responsive cork and threads. The corner cross returns a note to its saved stack; sheet selection, dragging, arrow-key arrangement and thread connections remain available. The stationery-box asset is retained but detached from the game world. Whiteboards edit only the current room and require no equipment. Notebook page transitions are immediate, and very narrow Contents views omit the inside cover.

Shared physical-control spacing lives in `src/styles/physical-life.css`: consistent height, type, padding, gaps, focus and destructive-action treatment. Object materials stay distinct and the computer retains its CRT controls. Obsolete note-preview/editor styles and the permanent reader grid have been removed.

`src/ui/surfaces.ts` continues to decorate the other office tools. The notebook and computer bypass that generic decoration. Document-treatment classes from `src/ui/document.ts` remain shared by original files, comparisons and printed copies. Obsolete notebook, display-case collection, tear-off receipt and folder override layouts have been removed from the surface stylesheet.

Book pagination runs only when content or layout changes. Scoped resize/style observers disconnect when the book closes; transitions cancel on rapid navigation and become immediate with reduced motion. The interfaces add no polling or per-frame pagination. Office fixtures add bounded shared/batched geometry, a single atlas for vending labels and a calendar texture updated only on date changes. Clock hands use saved office time; the can-drop animation runs only while dispensing. There are no new live lights.

## Visual checks

`tests/browser/physical-life.spec.ts` checks blank sheets, drawer semantics, sticky drafts, equipment, thread cancellation, recycling, vending, calendar rollover and bounded resources. Its 26px layout matrix is in `test-results/physical-life/`.

`tests/browser/unified-notebook.spec.ts` captures all four sections at 1440×900, 1024×768 and 680×850 at 18px and 26px, including reduced motion. It asserts equal desktop leaves and persistent frame identity, reconstructs long Unicode writing from its rendered pages, checks editor flush/reload, all 24 illustrations, catalogue controls, ledger downloads and physical folder navigation. Captures are in `test-results/unified/`.

`tests/browser/interface-personality.spec.ts` covers the remaining tools and all five stationery families. Existing desk-life, desktop, evidence and source-loading browser checks cover the preserved interaction rules.

## Desktop and notebook lifecycle

The notebook keeps the same saved sheets across contents, previous/next navigation and pinning. Digital excerpts use a separate `digitalExcerpt` field, so their IDs never enter the physical evidence system. Selecting their source opens Files when at the desk; elsewhere the notebook explains where to read it.

Mail has a 60/40 monitor/reply layout above 900px and stacks below that width. Other apps use the wider monitor. Authored response IDs, not free text, determine outcomes. App navigation flushes drafts and disposes the previous app's timers. Files and Snake load on demand; only the active app is mounted. Snake requires an explicit resume after focus loss.

The broad screen inventory is captured at 1440×900 and 1024×768, with narrow 680px and 26px-text checks. Desktop captures cover 1440, 1024 and 680px. Screenshot capture disables finite animations so mid-transition transparency does not obscure review. The browser checks also exercise lifecycle behaviour, not only appearance.
