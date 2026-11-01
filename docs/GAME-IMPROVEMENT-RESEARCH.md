# Improvement and expansion research

Prepared 1 November 2026. This is a design review, not a gameplay usability study. Reviewed the repository README, content and verification documentation, archive generation and hint logic, upgrades and completion logic, document types, desktop correspondence, and existing desk/aisle captures. No new playtest or hardware benchmark was performed. Effort labels below are relative implementation scope, including authoring and validation, not delivery estimates.

## Main recommendation

Build a denser investigation inside the existing archive before enlarging it. The project already has 152,616 originals, four wings, 53 optional chains, physical storage and copies, a comparison stand, mail, notes, sketches, a pinboard, collectibles and office machinery. Its distinctive combination is tactile bureaucracy, office comedy and discovering why apparently mundane records matter.

The next investment should make players form and test conclusions, encounter more kinds of evidence, and see consequences. More addresses or more reusable prose alone would increase the amount of searching without necessarily increasing discovery.

## What the current implementation suggests

- `src/state.ts` awards story completion when the story's evidence IDs have been discovered. This tracks evidence gathering, but does not generally ask the player to explain a contradiction. Spreadsheet clues add interaction, and mail has evidence gates; these are useful foundations for deeper deduction.
- `src/desk/conversations.ts` offers authored clarification, evidence and humorous responses. Expand this existing system rather than adding a second dialogue framework immediately.
- The retained records index costs 48 credits and requires 80 inspections. Treat this as a pacing hypothesis to test. It could encourage routine opening before the player has learned how to search intelligently.
- `readPage` completes the assignment as soon as the requested phrase is read. Keep that accessible victory condition for existing shifts; an optional final dossier can provide narrative closure without retroactively changing the rules.
- Half of each ordinary 16-file drawer's generation schedule consists of reference attachments. These can support leisurely reading, but their relationship to investigation deserves testing. More reference packs should bring useful annotations or case connections.
- Existing aisle captures communicate scale and atmosphere, but long runs of similar cabinets and dim signage suggest an opportunity for landmarks and readability. These are observations about saved captures, not proof of current live usability.
- Saves and released content have substantial compatibility requirements. New mysteries should use versioned packs and stable identities rather than silently changing released generation schedules.
- Verification documentation already distinguishes software-renderer measurements from hardware performance. Preserve that discipline when expanding the world.

## Research and useful precedents

These games illustrate possible techniques; they do not prove that adopting those techniques will improve retention in this game.

| Precedent | What the official source describes | Application here |
| --- | --- | --- |
| [The Roottrees are Dead](https://roottrees.com/en/) | Searching photos, books and articles, then using relationships to complete a family tree | Introduce a structured place to record deductions and give photos a factual role |
| [Her Story](https://www.herstorygame.com/about/) | A nonlinear story explored through a police footage database | Let discovered names and phrases lead to further records through a partial catalogue |
| [Hypnospace Outlaw](https://jay-tholen.itch.io/hypnospace-outlaw) | Investigation within a fictional internet and operating-system setting | Extend the existing CRT through a small authored intranet, with links back to physical evidence |
| [Overboard!](https://www.inklestudios.com/overboard/) | Characters remember actions and story situations support repeated play | Let evidence disclosure and recipient choice affect later correspondence and epilogues |
| [Return of the Obra Dinn](https://www.dukope.com/) | First-person investigation based on exploration and logical deduction | Keep the physical archive central while adding a precise reasoning task |

Implementation references: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/) for remapping, readable text and contextual help; [Three.js object optimization](https://threejs.org/manual/pages/optimize-lots-of-objects.html) and [rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html) for rendering decisions; [MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) for save growth and persistence; [ink/Inky](https://www.inklestudios.com/ink/) if branching story authoring outgrows the present TypeScript data; [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) for an optional CC0 audio source.

## Ranked improvements

| Priority | Improvement | Concrete first version | Scope |
| --- | --- | --- | --- |
| 1 | Strong first investigation | A short case near the starting desk, with three linked records and one contradiction | Medium |
| 1 | Explicit deductions | Select a conclusion and attach two or three supporting facts in one optional case | Medium |
| 1 | Helpful lead tracking | A notebook page separating observed facts, untested theories and remaining questions | Small–medium |
| 1 | Pacing review | Observe new players; compare first useful lead, first resolved case and progress toward the index | Small–medium |
| 1 | Wayfinding and readable labels | Distinct wing landmarks, clearer rear-bank labels and an optional route to a known reference | Small–medium |
| 1 | Hardware performance baseline | Repeat representative routes on integrated graphics and a midrange GPU | Medium |
| 2 | New evidence formats | A photograph and two conflicting versions in a single authored case | Medium |
| 2 | Functional board links | Optional typed connections such as contradicts, approved by and happened before | Medium |
| 2 | Meaningful correspondence | Recipient-specific evidence disclosure and persistent follow-up consequences | Medium–large |
| 2 | Searchable discovered records | Search the player's discovered text, names and references without revealing unread contents | Medium |
| 2 | Better comparison | Manual matching of dates, signatures, rows and quoted passages | Medium |
| 2 | Optional closing dossier | An epilogue based on evidence and conclusions after the phrase is found | Medium |
| 3 | One themed case pack | Four to six authored cases sharing people and a larger mystery | Large |
| 3 | New shifts | Independent saves and assignments; replay based on changed case facts | Large |
| 3 | Community case authoring | Versioned declarative packs, validation and a preview interface | Large |

## New records and evidence

1. **Annotated photographs:** a group photo identifies who was present; a reflected calendar or visible badge establishes a date. Include readable descriptions providing equivalent information.
2. **Version pairs:** an original and revised report have identical totals but different approval names. Make the comparison stand useful for finding the change.
3. **Scanned marginalia:** handwriting connects an annotation to an employee. Provide a clear text view; do not require deciphering difficult handwriting.
4. **Tape recordings and voicemail:** a call contradicts a written summary. Include transcripts and manual replay controls.
5. **Fax transmissions:** a cover sheet, sender line and delivery timestamp distinguish the genuine instruction from a later copy.
6. **Carbon copies:** a retained sheet preserves a line omitted from the filed original. Use authored visual differences and a readable transcript.
7. **Badge and visitor logs:** compare entries against meeting minutes and leave records to test an alibi.
8. **Shipment and stock records:** serial numbers connect a delivery, a supposedly obsolete asset and a sale.
9. **Expense trails:** receipts and approvals expose a duplicate reimbursement or an innocent explanation for an odd purchase.
10. **Organization charts:** reporting lines explain who had authority at the relevant time; date each revision.
11. **Floor plans:** old room names resolve a misleading location reference or a cupboard reclassified as an office.
12. **Certificates and training records:** credentials contradict an appointment date or explain unexpected access.
13. **Contracts and amendments:** the critical difference sits in an addendum rather than a hidden keyword.
14. **Damaged records:** reconstruct the order of a few torn fragments, with a skip or assisted version for the physical puzzle.
15. **Microfilm:** a viewer exposes a small dated sequence of archived records. Prototype the evidence interaction before building a full machine.
16. **Internal newsletters:** recurring jokes and announcements become useful evidence across cases.
17. **Personal letters:** reveal motives and acts of kindness alongside misconduct.
18. **Reference annotations:** Faraday, Darwin or Babbage attachments acquire fictional notes tied to a case. Keep licensed source wording separate from fictional annotations.

Each new format should answer a different investigative question. A new visual skin for another paragraph has less value than an existing memo that changes what a player believes.

## Investigation and narrative extensions

- **Evidence-backed conclusions:** let players state who did what and why a record supports that claim. Evaluate structured choices and evidence IDs; free text can remain personal notes.
- **Timelines:** let players arrange dated events and mark an uncertain interval. The dates should be inferable from records, not arbitrary drag-and-drop ordering.
- **Relationship board:** connect people, departments, assets and records. Keep decorative freeform string use available.
- **Source reliability:** distinguish an original, a copy, a draft and a secondhand claim. A character's assertion should not automatically become established fact.
- **Fair misleading leads:** allow an initially plausible explanation, with an accessible record that can disprove it. Avoid unsupported accusations or unavoidable guessing.
- **Multiple routes:** expose a name through either an expense trail or a visitor record; essential conclusions should have redundant support.
- **Graduated hints:** offer a question, then the relevant document category, then a filing area. Let the player request each step.
- **Evidence disclosure:** sending a sensitive original to Accounts versus Martin changes who replies and what they reveal.
- **Reputation through actions:** establish trust through accurate conclusions and follow-through, rather than a generic meter that rewards agreeable replies.
- **Optional epilogues:** acknowledge whether the player preserved full context, corrected a record or only fulfilled the narrow request.
- **Recurring consequences:** a corrected room name appears on a notice; a resolved case changes a newsletter or later email.
- **Kindness cases:** locate a lost retirement letter or establish who anonymously helped a coworker. Broaden emotional range beyond cover-ups.

## World, desk and atmosphere

- Give Administration, Commercial, Technical and Executive wings recognizable signage, cabinet wear, stationery and sound details.
- Add a few distinctive landmarks: an obsolete directory, a crooked award cabinet, a broken terminal or a dated evacuation plan.
- Put a simple early lead near the W4 start, then teach a cross-wing trip through a short case. The current tutorial directs the player to W1–A08.
- Add a route sketch to a discovered reference, cabinet-level completion feedback and a recent-files list.
- Add a book trolley for a narrowly scoped transport task, rather than general physics for every object.
- Add an archive cart, label maker, stamp tray or date stamp only where the interaction improves organizing or a case.
- Develop small environmental events: a delivery, a message lamp or a maintenance notice. Use authored triggers without forcing a countdown on the relaxed main mode.
- Consider radio programmes, office announcements or coworker voicemail. Provide captions and separate volume control.
- Add desk decoration rewards linked to cases. Existing mugs, machinery, stationery and collectibles already provide substantial ambient interaction.
- Use cheap visual changes such as texture details and baked shading before adding more dynamic lights. Profile actual scenes before choosing an optimization.

## Expansion concepts

| Expansion | Premise | Useful new mechanics | Cost/risk |
| --- | --- | --- | --- |
| The Missing Department | A team appears in payroll but disappears from room plans | Organization charts, plans, badge logs | Strong fit; can initially use existing wings |
| The Duplicate Original | Two signed originals disagree about one event | Version comparison, signatures, fax records | Strong fit; concentrated authoring |
| The Merger Archive | Two companies use incompatible names and filing systems | Aliases, translated references, linked ledgers | Requires careful address and identity design |
| The Last Working Friday | Retirement, farewell messages and forgotten promises | Personal correspondence, emotional conclusions | Lower technical scope, substantial writing |
| Records Recovery | A damaged collection must be catalogued | Fragment reconstruction and provenance | Extra interface and accessibility work |
| Night Shift | Familiar rooms support a separate eerie investigation | Audio testimony and controlled environmental events | Optional tonal departure; keep distinct from comedy |
| Internal Audit | The player prepares an evidence-based account for review | Dossier submission and branching follow-up | Natural continuation after the current assignment |

Prototype a pack in the existing rooms before constructing another wing. A new environment is justified when its layout matters to the mystery.

## Replayability and community

- Independent shift/save slots, so experimentation does not replace a long-running archive.
- Handcrafted short cases for a focused session alongside open-ended exploration.
- Seed sharing with a pinned content version, so references and evidence match.
- A daily case selected from a validated authored pool, before attempting arbitrary procedural mysteries.
- Constraint-based variants: define the truth first, derive mutually consistent records, and validate that clues support a solvable conclusion. Changing names or hiding the same target elsewhere is limited narrative replay.
- Optional timed filing mode with a separate score and save, preserving the current no-countdown main mode.
- Achievements for meaningful investigation, preservation and kindness; avoid making opening thousands of ordinary records the main achievement loop.
- Shareable notebook or solved-dossier exports with spoiler controls.
- A community case editor and pack import, first supporting text, tables and explicit references.
- Asynchronous community cases before real-time multiplayer. Cooperative play would require decisions about file ownership, moved records, concurrent board edits, shared progression and save authority.
- A desk-only investigation mode could make a smaller touch-friendly edition possible, but would be a deliberate alternate experience rather than a trivial responsive-layout change.

## Accessibility, reach and technical foundations

Existing text-size, reduced-motion, keyboard and mouse-fallback support should be retained. Add remappable controls, configurable field of view, toggle sprint, distinct audio sliders, stronger text/sign contrast, non-colour marker symbols and plain-text alternatives to handwriting. Test the complete investigation flow with keyboard navigation. Captions must carry evidence delivered by sound. These follow the direction of the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/).

Controller support needs focus behavior for documents, tables, mail and notebook editing as well as movement. Touch controls and mobile rendering need their own design and performance work. Offline installation, desktop packaging and localization are reasonable later directions once the core experience has human playtest evidence.

As richer evidence grows, consider IndexedDB for larger saves/assets and persistent-storage requests where supported. Browser storage is origin-specific, quotas differ and best-effort data can be evicted; keep the existing import/export recovery path. See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria). Offline support also needs versioned caches and an intentional update policy.

Refactor only where a new feature needs a boundary. `src/game.ts` and `src/world.ts` are roughly 1,450 and 1,490 lines respectively; new cases should not automatically add more unrelated orchestration to those files. Continue using current instancing, culling, bounded lighting and lazy loading. Profile draw calls, geometry, texture memory, load time and p95 frame time on actual GPUs before promising performance.

## Possible implementation files

These are proposed boundaries, not a request to create empty files or add every abstraction immediately.

| Proposed file | Purpose | Existing integration |
| --- | --- | --- |
| `src/cases/types.ts` | Stable fact, case, question and conclusion definitions | `src/types.ts`, content stories |
| `src/cases/engine.ts` | Evaluate selected conclusions against discovered facts | `src/state.ts`, desk mail |
| `src/cases/hints.ts` | Authored graduated hints | Current archive hints, notebook |
| `src/ui/case-dossier.ts` | Questions, evidence citations and optional final report | Notebook and shared surfaces |
| `src/ui/timeline.ts` | Arrange events and uncertainty | Notes and evidence IDs |
| `src/evidence/types.ts` | Photo, audio and version-pair metadata | `ArchiveDocument` |
| `src/ui/evidence-viewer.ts` | Accessible media display and transcripts | Shared document reader |
| `src/desk/catalogue-search.ts` | Search discovered records and partial index entries | Existing Files app |
| `src/content/packs/missing-department.ts` | A first versioned authored pack | Generator and source manifests |
| `scripts/validate-cases.ts` | References, consistency, reachability and required evidence checks | Existing validation command |
| `tests/cases.test.ts` | Correct/incorrect conclusions, alternative proof paths and one-time rewards | Existing test runner |
| `tests/browser/case-dossier.spec.ts` | Full player flow, keyboard operation and save/reload | Existing Playwright suite |

If dialogue becomes much more complex, prototype one case in [ink/Inky](https://www.inklestudios.com/ink/) before choosing a migration. The present authored TypeScript approach is adequate for a small first expansion.

## Recommended first playable addition

**The Duplicate Original:** a 20–30 minute design target, to be verified in playtests.

1. Accounts sends a request about two incompatible approvals.
2. A nearby folder holds an original request; the player learns how to retain and cite it.
3. A photograph establishes that the supposed approver was elsewhere.
4. A fax record identifies when a replacement instruction arrived.
5. The comparison stand exposes the changed approval line.
6. The player selects a conclusion and cites evidence. An incorrect claim receives an actionable question rather than a permanent failure.
7. Sending the dossier to the chosen recipient produces a short consequence and a new archive notice.

This tests richer evidence, deductions, correspondence and consequences without requiring more rooms, online services or a replacement of the main win condition.

## Validation before scaling

Observe five to eight new players as an initial qualitative study, not a statistically representative sample. Track time to first useful lead, whether cabinet references are understood, time to first case conclusion, requests for help, confusion between finding and proving, and reasons for stopping. Ask players to explain why their conclusion follows from the evidence.

Then compare the existing opening with the compact starter case. Success means players can explain a discovery and choose a next action, rather than merely opening more folders. Test whether the index's 80-inspection gate and the initial equipment costs support that experience.

For the first deduction system, validate wrong-answer feedback, alternate evidence routes, saving midway, old-save loading, duplicate reward prevention, moved originals, copies, keyboard access and large text. Hardware benchmarks should cover exploration and media-heavy interfaces separately.

Recommended order: opening and navigation improvements; one optional deduction case; new evidence and consequences; one themed pack; then replay variants and authoring tools. Large maps, freeform real-time NPC simulation, generated live dialogue and multiplayer should wait until those smaller experiments establish their value.
