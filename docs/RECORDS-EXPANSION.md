# Archive variety and optional discoveries

New shifts include record pack 1: twelve physical record families, 48 ordinary authored variants, three optional six-record threads, 24 additional digital files, a partial batch catalogue and correspondence outcomes visible beside the desk. The archive still contains 152,616 originals; new material occupies eligible ordinary filing slots.

Martin’s sentence remains the main assignment. Reading its page wins immediately. No password, side thread, purchase, evidence submission or return trip is required. The archive and optional correspondence remain available afterward.

## Physical records

Fax headers, carbon stock, access tables, delivery serials, itemized receipts, charts, historical plans, contracts, annotations, damaged transcripts, newsletters and revision histories use shared presentation in the original reader, comparison stand and printed copies. Graphs have readable data tables; plans have textual routes. Wear never requires reconstructing unreadable text. No photos, speech assets or external services are used.

The 48 variants supplement the existing office-record rotation; most ordinary office records retain the original generation. Reference attachments, existing story records, index fragments, vouchers and the target are protected. The new records reuse authored material globally. Across seeds 7391, 1 and 9041, the shortest repeated body-key interval is 192 file positions for the expanded pack, compared with 634 for the released pack. These are template counts, not thousands of independently authored documents.

## Records Desktop

**Catalogue** describes selected batches entered before the archive transfer. Search titles, departments, staff, event dates, retention dates and keywords. It gives filing ranges, not remote access to paper. Coverage is deliberately incomplete: 58 ordinary batch entries, plus six optional-thread entries in expanded shifts. Event dates describe events; retention dates describe filing batches.

**Files** retains its existing folders and filename search. Expanded shifts add twelve ambient files and four digital files per optional thread. Three files have passwords whose requested format and answer are explicitly recorded in physical paperwork. Case and surrounding whitespace are ignored. Failed attempts are unlimited and successful unlocks survive reload and backup import. A known password works without an invisible inspection prerequisite. Locked content cannot be clipped or read in the UI.

The computer never copies a document because the player read it. Existing notebook clippings remain the player’s own reference material. Digital drafts provide context rather than substituting for the physical accounts attached to a correction.

## Optional correspondence

The Duplicate Original, The Missing Department and The Last Working Friday can be entered through an ordinary drawer, a catalogue description or a digital filename. Their physical records have enclosure references. Each thread has two relevant existing contacts and a specific pair of original supporting accounts.

Choose an authored reply and attach up to two opened records. Incomplete evidence receives clarification and can be resent. Personal prose is retained verbatim, not interpreted. Replies arrive after 30–90 seconds of active shift time. There are no deadlines or automatic reminder campaigns for the new threads.

Reading every thread record adds notebook discoveries but does not resolve it. Opening the delivered correction reply records its outcome. A corrected records notice, updated directory notice or farewell message then appears beside the desk and in Public notices. Reopening or resubmitting cannot create repeated credits. The new threads grant no investigation credits and do not change main-search hints.

## Existing shifts and backups

The optional `recordPack: 1` field is written only for new shifts. Missing means the released archive. The existing archive/content version remains 3, and the released placement and story implementations are unchanged.

Existing shifts keep their complete document generation, placements, target and progress. They receive interface/wayfinding improvements and the ordinary partial catalogue, but no replacement physical records or expansion-only digital files. Start a new shift for the new collection. The replacement screen offers Export backup and start new shift, Keep this shift, and Replace progress. Import the exported JSON to return to the previous collection.

Desk `unlockedFiles` is an optional bounded list of the three known password file IDs. Existing `resolved` correspondence IDs also store new outcomes when record pack 1 is present. Missing new fields need no destructive migration or save rewrite; raw migration backup and paused-write recovery for older formats remain intact.

## Implementation and verification

`src/content/packs/records.ts` overlays deterministic eligible slots without editing frozen generators or story collections. Document presentation is shared through the existing letterhead path. Catalogue entries are lightweight metadata, not a full-text archive index. World outcomes use three fixed sheets and upload their canvases only when outcomes change; wing identity reuses existing wall-art surfaces and label atlases. No dynamic lights, collision volumes or rooms are added.

Run:

```bash
npm test
npm run validate
npm run build
npm run test:browser
npm run test:production
```

The content validator audits original and expanded packs across the same three seeds, checking protected content, exactly one target, references, all twelve families and local template reuse. Tests cover old/expanded save round trips, passwords, incomplete and correct evidence, alternate recipients, duplicate mail, shared rendering and main completion without optional progress.

Browser coverage includes the catalogue, password retry and persistence, digital clipping, large-text/narrow record layouts, comparison and copies, delivered world outcomes, and export-before-replacement. Performance measurements use Chromium software rendering; they cannot establish hardware FPS or replace human playtesting.
