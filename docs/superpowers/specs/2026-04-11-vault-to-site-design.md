# GURPS Special Forces — Vault-to-Site Generator Design

## Purpose

Publish the GURPS Special Forces Obsidian vault as a mobile-friendly GitHub Pages site. The vault is the single source of truth, maintained by gm-apprentice and Claude. The site is a read-only view that gets regenerated from the vault on demand.

## Workflow

1. Sessions are played, transcripts processed by gm-apprentice, vault updated
2. User tells Claude "update the site from the vault"
3. Claude runs `node build.js` which reads vault markdown, generates static HTML into `docs/`
4. Claude commits and pushes — GitHub Pages serves `docs/` automatically

## Architecture

### Build Pipeline (`build.js`)

A single Node.js script (~200-300 lines) that:

1. Reads `vault.config.json` for vault path and site settings
2. Scans the vault for all `.md` files, skipping: `_meta/`, `_Templates/`, `_resources/`, `.obsidian/`, `.smart-env/`, `node_modules/`
3. Parses each file's YAML frontmatter with `gray-matter`
4. Builds a wiki-link lookup map (entity filename → output URL path)
5. Converts markdown body to HTML with `markdown-it`
6. Resolves `[[wiki-links]]` to relative `<a href>` tags using the lookup map
7. Strips Obsidian-specific blocks (dataview queries, callouts)
8. Selects a template based on frontmatter `type` (character vs wiki vs index)
9. Wraps content in the HTML template with nav, header, footer
10. Writes output to `docs/`
11. Copies `css/style.css` into `docs/css/`
12. Generates index pages for each folder
13. Generates root landing page

### Dependencies

- **`gray-matter`** — YAML frontmatter parsing
- **`markdown-it`** — Markdown to HTML conversion

No frameworks, no bundlers, no build tools beyond Node.js.

### Templates

Three template types, selected by frontmatter `type`:

#### 1. Character Template (`type: pc` or `type: npc`)

Interactive mobile-first character sheet with:
- Always-visible header card (name, concept, point total, player)
- Section nav bar for jumping between sections
- Collapsible accordion sections (all collapsed by default except header)
- Scrollable tables for weapon stats, skill lists, equipment
- Expandable cards for skill chains and UW maneuvers
- Monospace font for stat values

Applied to files in `Characters/PCs/` and `Characters/NPCs/`.

#### 2. Wiki Template (all other entity types)

Clean prose layout with:
- Maritime colour scheme
- Auto-applied stub badge when `canon_status: STUB`
- Auto-generated "Needs Development" box from `## Needs` sections
- Cross-links between entities via wiki-link resolution
- Responsive readable prose

Applied to: events, factions, organizations, locations, items, documents, clues, campaign overview, timeline.

#### 3. Index Template

Auto-generated directory pages for each folder:
- Cards listing each entity with name, type/role summary, and link
- Sorted alphabetically
- "No entries yet" for empty folders
- Root `index.html` is a landing page with nav grid to all sections

### Content Filtering

- `## Player Notes` sections are **excluded** from all generated pages (player strategy stays in vault only)
- `## Source References` sections are **excluded** (GURPS book page references aren't useful on the web)
- Dataview code blocks are **stripped** (Obsidian-specific, can't render in static HTML)
- `## Appearances` sections with only placeholder text are **excluded**
- `## Relationships` sections with only dataview queries are **replaced** with a rendered list built from frontmatter relationship data

### Wiki-Link Resolution

The build script builds a map of all entity filenames to their output paths:

```
"Ronnie Vint" → "characters/pcs/ronnie-vint.html"
"The Defense Contractor" → "factions/the-defense-contractor.html"
"The Meteor Event" → "events/the-meteor-event.html"
```

`[[Ronnie Vint]]` in any markdown file becomes `<a href="../characters/pcs/ronnie-vint.html">Ronnie Vint</a>` (with correct relative path).

Unresolvable links render as plain text with no broken hrefs.

### Filename Conventions

Vault filenames are slugified for URLs:
- Spaces → hyphens
- Lowercase
- Special characters stripped
- `Dave Crockett.md` → `dave-crockett.html`

### Folder Mapping

| Vault Folder | Output Folder |
|---|---|
| `_Campaign/` | `campaign/` |
| `Characters/PCs/` | `characters/pcs/` |
| `Characters/NPCs/` | `characters/npcs/` |
| `Factions & Organizations/` | `factions/` |
| `Events/` | `events/` |
| `Locations/` | `locations/` |
| `Items & Artifacts/` | `items/` |
| `Documents/` | `documents/` |
| `Clues/` | `clues/` |
| `Chapters/` | `chapters/` |

Empty vault folders still get an index page.

## Output Structure

```
docs/
├── index.html
├── css/style.css
├── .nojekyll
├── campaign/
│   ├── index.html
│   ├── campaign-overview.html
│   ├── player-characters.html
│   └── timeline.html
├── characters/
│   ├── pcs/
│   │   ├── index.html
│   │   ├── ronnie-vint.html
│   │   └── jens-hartmann.html
│   └── npcs/
│       ├── index.html
│       └── dave-crockett.html
├── events/
│   ├── index.html
│   └── the-meteor-event.html
├── factions/
│   ├── index.html
│   ├── the-defense-contractor.html
│   └── nato.html
├── locations/
│   └── index.html
├── items/
│   └── index.html
├── documents/
│   └── index.html
├── clues/
│   └── index.html
└── chapters/
    └── index.html
```

## Design: CSS & Visual

### Colour Scheme (Maritime/Navy)

- Dark: `#1a2f3a`
- Medium: `#2d5a6b`
- Light: `#e8f0f3`
- Accent/Teal: `#3d8a7a`
- White text on dark backgrounds for headers

### Mobile-First

- 375px minimum viewport
- Character sheets are the primary mobile use case
- Tap-friendly accordion targets (minimum 44px touch targets)
- Horizontally scrollable tables on small screens
- System font stack, no web fonts
- Monospace for GURPS stat values
- Body text 16px minimum on mobile
- Dark mode via `prefers-color-scheme`

### Navigation

- Sticky header with site title and hamburger menu
- Full-screen nav overlay listing all sections and pages
- Auto-generated from folder structure — no manual maintenance

### Footer

Every page: "GURPS is a trademark of Steve Jackson Games. Fan creation for personal use. GURPS 4th Edition."

## Configuration

### `vault.config.json`

```json
{
  "vaultPath": "/Users/antonypegg/Documents/specialforces_vault",
  "outputDir": "./docs",
  "siteTitle": "GURPS Special Forces",
  "siteUrl": "https://antthelimey.github.io/gurps-special-forces"
}
```

### `package.json` Scripts

- `npm run build` — `node build.js` (full site rebuild)

## Repo Structure

```
gurps-special-forces/
├── build.js
├── templates/
│   ├── base.html          # Shared HTML shell (head, header, nav, footer)
│   ├── character.html     # Character sheet template
│   ├── wiki.html          # Wiki page template
│   └── index-page.html    # Directory listing template
├── css/
│   └── style.css
├── vault.config.json
├── package.json
├── .nojekyll
├── .gitignore
└── docs/                  # Generated output — served by GitHub Pages
```

## GitHub Pages Setup

1. Create repo `AntTheLimey/gurps-special-forces`
2. Settings → Pages → Source: Deploy from branch → Branch: `main`, folder: `/docs`
3. Site live at `https://antthelimey.github.io/gurps-special-forces`

## Future Improvements

- Automated build via GitHub Actions (push vault changes, site rebuilds)
- Search functionality (client-side lunr.js or similar)
- Relationship graph visualisation
- Session log pages with chapter/session structure
- Auto-diff detection (only rebuild changed pages)
