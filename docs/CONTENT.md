# Expanded archive content and persistence (version 3)

## Shared layout

`src/archive.ts` preserves the original 65,536 IDs and appends independent rear banks, wall-cabinet drawers, and boxes. `src/storage.ts` is the catalogue and canonical container-address interface. There are 512 front banks, 512 rear banks, 72 wall banks, and 1,541 boxes: 152,616 originals in total. Cabinet banks have eight 16-file drawers with capacity twenty; boxes have eight originals and capacity ten.

The appended ranges are 65,536–131,071 (rear), 131,072–140,287 (wall), and 140,288–152,615 (boxes). `fileId`/`location` round-trip every ID, including the eight-file box stride. Original `archive:cabinet:drawer` keys remain unchanged; new canonical prefixes are `rear`, `wall`, and `box`. A marker’s `cabinet` field now identifies a catalogue unit, so original marker IDs retain their meaning. Room positions and orientations come from the same catalogue used by interaction and collision.

References include the wing: `W2–A08 / 3.12`. Department letters and cabinet months identify retention batches, not necessarily the dates of the events described. The labels remain useful, but reference attachments and ordinary records can be misfiled. Earned target hints remain accurate.

## Content schedule and narrative

Each seeded 16-folder drawer rotates a schedule of eight reference attachments, five office records and three social/odd records. Authored story placements, the target and welcome note override ordinary slots. Index fragments and vouchers overlay eligible ordinary files. Every tested drawer and box has social, story, evidence or annotated material. Boxes use four reference attachments, three office records and one social record.

The authored pool contains 99 situations, each with six independently written fragments: setup, trace, response, complication, evidence and outcome. These provide 594 individual fragments. Ambient versions recur globally at different narrative stages; they are not 12,000 separate original scandals. Some refer to named recurring staff; others are anonymous retained office accounts.

Thirty-two situations also form three-document local chains, with previous/next references. Twelve additional situations form six-document chains using emails, reports, letters, calendar notes, workbooks and resolutions. Together with the original nine stories, there are 53 optional chains and 224 story evidence records. Workbook evidence requires inspecting a clue cell, including in the comparison stand. Story and discovery rewards are paid once.

The story data keeps facts within a case consistent. Cast and authority details remain fictional. The tone is adult office comedy: jealousy, affairs, ambition, cover-ups, innocent explanations and kindness, without graphic sexual content. Martin’s original eight-record misconduct trail remains separate and rare.

Ordinary office records cover twenty procedures through twelve distinct document structures: service tickets, proposals, training sheets, transcripts, visitor registers, instructions, resignation drafts, complaints, annotated research, surveys, reports and memos. Their 240 base body variants are permuted to avoid adjacent repeats. They contain actual different procedural facts instead of a generic purchasing paragraph attached to every document type.

Additional ordinary records use the same twenty procedure topics with supporting evidence, action/handover and follow-up sections. Existing originals retain their text; the added records generally display over two to four pages.

Repetition is deliberately audited. Exact body keys, source excerpt IDs and social fragment keys have at least a 634-file reuse distance in the tested seeds. Global repetition remains: 152,616 file addresses do not imply 152,616 unique narratives. The audit reports distinct searchable-text counts and the size of the underlying reference corpus.

## Real reading and licensing

Six pinned reference packs provide 2,722 excerpts and 587,886 source words. The originals are Babbage’s machinery/manufacturing work, Darwin’s Origin of Species, Vegetable Mould and Voyage of the Beagle, Faraday’s Chemical History of a Candle, and the Python 3.14 tutorial. Original scientific content may reflect historical theories, terminology and prejudices.

The books were selected individually as nineteenth-century originals by authors/editors who died before 1930. Their catalog entries and downloaded headers were checked. Python documentation is licensed under PSF License Version 2 with the included notices retained. Manifest entries record the source URL, edition description, author, license URL, reuse notice, excerpt count, word count and SHA-256 hash. Original boilerplate wrappers are excluded from the book extracts. Python notices are bundled as self-contained HTML and plain text.

The reference importer preserves paragraphs and normally combines them into moderate-length extracts. Very short remnants are excluded; long original paragraphs remain intact, so not every excerpt fits an 80–200-word range. The shared pagination adapter in `src/pagination.ts` splits display text at natural boundaries without changing wording or corpus hashes. Original page boundaries and complete target phrases are preserved. Reader, comparison and printed copies use the same adapter after source loading; workbook state remains independent. Section headings are retained where identified. Office cover sheets and handwritten annotations are fictional and visually separate from the source text.

Only the manifest is in the main JavaScript. A pack is loaded from the game’s own host when its document is opened; failed or malformed loads can be retried without marking the unread document inspected. The cache is bounded by the six packs. There are no requests to external text services during gameplay.

The source-build script is an explicit maintenance tool, not a build or runtime prerequisite. It uses cached snapshots where available. Replacing any released pack changes the meaning of excerpt identifiers, so ship a new content version and migration rather than silently regenerating packs.

## Vouchers and tools

Opening files no longer earns inspection-milestone credits. Existing credits and milestone history survive migration. New shifts retain 12 starting credits. Original evidence, index fragments and completed stories still pay their configured rewards.

About one in 24 eligible ordinary files contains a voucher, generally worth 1–4 credits, with occasional 5- or 8-credit values. Vouchers have explicit collection and desk redemption. `collectedVouchers` and `redeemedVouchers` prevent repeated payouts. Two early guaranteed placements avoid inspected files during migration. Voucher value is deterministic for the saved seed and placements.

The six original upgrades keep their effects. The comparison stand costs 40 credits and compares retained copies without solving discrepancies. Coloured tabs cost 28 credits and support 64 global storage markers with a colour and up-to-32-character note. The physical tab colour appears in the room; its note appears when aiming at a marked drawer. Maps render one wing at a time and use incrementally cached inspected/searched counts.

## Save/content version 3

New saves use version/content version 3, environment version 2, and placement version 3. `src/content/generator-v2.ts` retains the previous 65,536-file placement schedule with an explicit base-range bound. `src/legacy/` retains the earlier version-1 generator and validator. These compatibility implementations must not be regenerated for a released version.

Migrating version 2 sets placement version 2, preserving its target, story positions, voucher placements and original text. New storage is available in the same shift. Fresh placement-version-3 shifts select their single target across the whole catalogue; the previous generated target is replaced with its ordinary record so the phrase remains unique. Version-1 bindings continue through the existing ID conversion and remain pinned.

The loader prefers `archive-office-save-v3`, then version 2, then version 1. It never deletes older entries. Before writing the converted save it preserves raw JSON in `archive-office-before-expanded-storage`; existing version-1 and pre-warehouse backups remain intact. Failure leaves automatic writes paused, including when clocking into an unstarted shift. Imports accept up to 32 MiB and require the existing in-game replacement confirmation. Validation checks canonical addresses, per-container initial counts/capacities, held originals, progress limits and deterministic target placement.

Tests compare every original version-2 record against its migrated equivalent and cover target/text/progress preservation, invalid saves, capacity enforcement, moved originals, boxes, marker independence, one-time migration and blocked backups.

## Physical originals and warehouse equipment

The warehouse revision keeps original document IDs and version-2 generation unchanged, while the version-3 generator adds the new storage range. `src/physical.ts` stores only relocation overrides; an absent entry means the original cabinet/drawer. Each drawer starts with 16 originals and has 20 spaces; each box starts with 8 and has 10 spaces. Two personal containers hold 20 originals each; the desk tray holds four. A file in the single held slot is absent from storage until placed. A cached index of moved originals supplies drawer contents and relocation notes without scanning the full archive on each interaction.

`Save.physical` contains the single held object, sparse file locations, and three persistent mugs. Active surfaces are the coffee tray and utility table. Legacy surface and food identifiers remain accepted only by the migration validator; old meals are removed, dangling held-food references are cleared, and mugs are relocated to retained surfaces. Imports validate canonical references, capacities, unique IDs and held-state consistency.

`Save.environmentVersion` separates physical arrangement from content and placement versions. Older version-2 JSON is backed up as `archive-office-before-warehouse` before conversion. The four original cabinet coordinate systems are translated into a 2 × 2 block by `src/hub-layout.ts`. Camera movement uses one continuous world space; saved positions remain local to their wing. Former hub positions restore to W4’s work nook, and obstructed positions restore safely. One physical whiteboard exposes the four original drawing arrays as selectable pages. The map’s counts follow moved originals; printed references still lead to relocation notes.

The authoritative win event is reading the page containing the requested phrase (`readPage`). Main reading, retained copies, the comparison stand and printed copies use that same completion rule. Assignment text is never passed into it. No submission, possession, side-chain completion or equipment is required.

The retained mug uses a shared procedural ceramic shell with a hollow interior and side handle. Its liquid surface uses the same dimensions when placed or held. Other active props use reusable procedural builders in `src/prop-models.ts`; the development model viewer and warehouse share those builders. Archived bundled asset provenance remains in `public/models/manifest.json`. No runtime third-party download is used. Coffee and print cycles are transient and restore stopped; completed print output persists.

## Physical inventory and paper copies

`Save.inventoryVersion = 1` adds a two-document bag (five with the existing `bookmarks` upgrade ID, now the satchel), separate from the single equipped object. Original locations additionally accept `inventory` and `printer-input`; existing filing keys and document IDs do not change. Physical copies have an independent stable ID, source file ID and location. They share storage capacities and bag slots with originals, and never count as additional archive originals or pay evidence/voucher rewards. The printer requires an inserted carried original and an empty output tray; input and output can be collected independently or atomically. Copies can be stored, equipped and shredded; originals cannot be shredded.

Migration preserves raw JSON in `archive-office-before-inventory` before conversion. Old bookmarks become physical copies in a dedicated desk binder; old completed output becomes a collectable paper copy. Existing held/moved originals remain in place. Migration is idempotent, old backups are retained, imported backups use the same conversion, and failed backups keep automatic writes paused. The earlier corpus/content and placement versions remain frozen. New validation checks duplicate copy IDs, occupied output, original/copy holding, combined storage load, bag capacity and printer-input uniqueness.

The water dispenser fills a tray mug once per two-second cycle; the shredder runs for 2.2 seconds. Machine jobs restore stopped while documents and mug contents persist. Lighting sensors use wall-clock time: activation within 7.5 units, an eight-second grace period, then a short fade shared by bulb emission and the bounded live light pool. Footsteps use actual travelled distance and stop against obstacles; machine, relay, bag and footstep audio remains local Web Audio with focus/volume controls.
