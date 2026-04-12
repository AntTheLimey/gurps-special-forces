# Campaign Organizer: Image Attachment Support

**Target skill:** `gm-apprentice:campaign-organizer`
**Plugin repo:** `/Users/antonypegg/PROJECTS/gm-apprentice`
**Requested by:** gurps-special-forces site generator work (2026-04-12)
**Status:** Spec — not yet implemented

## Purpose

Add image attachment support to the campaign-organizer vault schema so that entity pages (PCs, NPCs, Locations, Factions, Items, Creatures) can have portrait images and body illustrations. The schema change enables downstream consumers (static site generators, publishing tools, future Obsidian plugins) to find and display images using a documented, predictable convention — without each consumer needing to invent its own.

## The Convention

### 1. Attachment folder structure

Add `_attachments/` to the vault scaffold at the vault root. Organise by entity type to keep files discoverable:

```
vault_root/
├── _attachments/
│   ├── characters/          # PC and NPC portraits
│   ├── locations/           # Location images
│   ├── factions/            # Faction logos, HQ shots
│   ├── items/               # Item/artifact illustrations
│   ├── creatures/           # Creature art
│   ├── events/              # Event scene art
│   └── documents/           # Document scans, letter images
└── ...
```

**Naming:** Filenames should use the same slug format as entity files (lowercase, hyphens) so they're easy to match — e.g., `characters/ronnie-vint.jpg`, `characters/jens-hartmann.jpg`. Multiple images per entity get suffixed: `ronnie-vint-young.jpg`, `ronnie-vint-scarred.jpg`.

**Formats:** jpg, jpeg, png, webp, gif. No HEIC or RAW (not web-safe).

### 2. Frontmatter `portrait` field

Add an optional `portrait` field to the frontmatter schema of entity types that can have a primary image:

- `pc` — character portrait
- `npc` — character portrait
- `location` — establishing shot
- `faction` / `organization` — logo or HQ image
- `item` — item illustration
- `creature` — creature art

Value format: a path relative to the vault root, pointing to a file under `_attachments/`:

```yaml
portrait: "_attachments/characters/ronnie-vint.jpg"
```

The field is **optional** — existing entities without a portrait continue to render cleanly. Downstream consumers check for the field and fall back to no-image rendering when absent.

### 3. Body image embeds (Obsidian native)

Body content can use Obsidian's wiki-embed syntax for inline images:

```markdown
## Background

Grew up rough on a council estate...

![[ronnie-vint-selection.jpg]]

...passed SAS selection first attempt.
```

Obsidian already resolves `![[filename.ext]]` by searching configured attachment paths. Downstream consumers (the site generator) will detect these patterns and handle the copy/rewrite independently — campaign-organizer doesn't need to do anything special for body embeds beyond making sure `_attachments/` is in the documented vault structure.

## Files to Update in `gm-apprentice:campaign-organizer`

The skill lives at `/Users/antonypegg/PROJECTS/gm-apprentice/`. Identify the campaign-organizer skill directory and update these files (the gm-apprentice session that implements this should explore the exact paths first):

### 1. Vault config documentation

**File:** Likely `skills/campaign-organizer/references/vault-config.md` or similar (check the gm-apprentice repo structure).

Add `_attachments/` to the documented folder scaffold with a paragraph explaining:
- It's for image files referenced by entity frontmatter or body embeds
- Subfolders by entity type (`characters/`, `locations/`, etc.)
- Naming convention (slug format, same as entity files)
- Accepted formats (jpg, jpeg, png, webp, gif)

### 2. Entity type schemas

**File:** Likely `skills/campaign-organizer/references/entity-types.md` or the equivalent entity schema reference.

For each of the entity types listed below, document the new optional frontmatter field:

```yaml
portrait: ""   # optional; path under _attachments/ (e.g., "_attachments/characters/name.jpg")
```

Entity types to update:
- `pc` (Player Character)
- `npc` (Non-Player Character)
- `location`
- `faction` / `organization`
- `item`
- `creature`

Do NOT add `portrait` to: `event`, `clue`, `document`, `chapter`, `session`, `scene`, `campaign_overview`, `timeline`, `pc_roster`. These don't have a "portrait" concept — images embedded in their body are sufficient.

### 3. Entity templates

**File:** Likely `skills/campaign-organizer/references/templates/` directory with one template per type.

Update these template markdown files to include the `portrait` field in frontmatter:

- `Template - PC.md`
- `Template - NPC.md`
- `Template - Location.md`
- `Template - Faction.md`
- `Template - Item.md`
- `Template - Creature.md`

Add the line below the existing `canon_status:` field:

```yaml
portrait: ""    # Optional: path to portrait image, e.g. "_attachments/characters/name.jpg"
```

Keep it empty by default — the gm-apprentice workflow can optionally prompt for it during entity creation, but should never require it.

### 4. Skill SKILL.md routing / guidance

**File:** `skills/campaign-organizer/SKILL.md`

If the skill's main routing document describes what the skill does and what a user can ask for, add a short note under "Capabilities" or equivalent section:

> **Image attachments:** When creating or editing entities that support portraits (PC, NPC, Location, Faction, Item, Creature), accept an optional image path. Store images in `_attachments/<entity-type>/<slug>.<ext>` under the vault root. Write the relative path into the frontmatter `portrait` field.

### 5. Vault migration guidance

Add a short note to the skill's documentation (or a new `references/migration-notes.md`) explaining how to migrate existing vaults:

1. Create `_attachments/` at vault root with subfolders
2. Existing entities need no changes — they work without a portrait field
3. Add portraits incrementally as images become available

## Validation

After implementation:

1. **Create a test entity** via the skill and verify the resulting frontmatter includes the `portrait` field (empty)
2. **Manually add a portrait path** to the test entity and confirm the frontmatter parses
3. **Verify existing vaults** still work — entities without `portrait` should scan and render normally
4. **Verify the convention is discoverable** — a user reading the skill's references docs should find `_attachments/` and `portrait` described together

Use the skill-creator workflow per memory guidance (`feedback_use_opus_and_skill_creator.md`) — skill edits require Opus + skill-creator validation.

## Downstream Integration (not part of this spec)

After this spec is implemented in gm-apprentice, a separate task in the `gurps-special-forces` repo (`/Users/antonypegg/PROJECTS/gurps-special-forces`) will:

1. Read `portrait` from entity frontmatter in `lib/scanner.js`
2. Detect `![[image.ext]]` embeds in markdown body in `lib/processor.js`
3. Copy referenced files from vault `_attachments/` to `docs/images/` in `build.js`
4. Inject `<img>` tags into PC/NPC/Location header cards in `lib/templates.js`
5. Add CSS for `.portrait` and `.inline-image` classes to `css/style.css`

This downstream work is blocked on this spec landing first, so the convention is documented before consumers implement against it.

## Rationale

**Why define the convention in campaign-organizer rather than the site generator?**

The site generator is one consumer of the vault. If image handling lives only in its code, then:
- The convention is undocumented in the vault schema
- New vaults created by the skill won't have `_attachments/`
- New entity templates won't include the `portrait` field
- Any future consumer (another site generator, an Obsidian plugin, a PDF exporter) will invent its own incompatible convention
- Users manually editing entities won't know about the field

Defining it in campaign-organizer makes it part of the vault contract. Every vault the skill touches gets this capability, every entity template includes the field, and downstream consumers just read a documented schema.

**Why slug-format filenames rather than matching entity display names?**

Slug format (`ronnie-vint.jpg`) is URL-safe, web-safe, cross-platform safe, and matches the HTML output filenames exactly. This makes matching entity files to their images trivial: the entity `Ronnie Vint.md` has slug `ronnie-vint`, so its image is `_attachments/characters/ronnie-vint.jpg`. Display-name-matching files (`Ronnie Vint.jpg`) would need case-insensitive fuzzy matching and break on spaces in URLs.

**Why a single `portrait` field rather than an array of images?**

A single canonical portrait is the common case — one representative image for the character/location/item that goes in the header card. Multiple/additional images go in the body via `![[embed]]` syntax, which is already Obsidian-native and needs no schema change. Keeping the frontmatter field simple avoids speculative complexity.

**Why not use Obsidian's built-in `cssclass` or `image` frontmatter conventions?**

Obsidian has no standard frontmatter image convention — the closest is plugin-specific (e.g., Dataview, the Image Gallery plugin). Introducing our own `portrait` field keeps us independent of any specific Obsidian plugin and gives us a clear semantic name (this is specifically a portrait, not "any image"). Users who want to use this field with Obsidian rendering can still do so via Dataview queries if they want.
