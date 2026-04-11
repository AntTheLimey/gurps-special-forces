# Vault-to-Site Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js script that reads the GURPS Special Forces Obsidian vault and generates a mobile-friendly static HTML site in `docs/`, served by GitHub Pages.

**Architecture:** Single `build.js` script using `gray-matter` for frontmatter parsing and `markdown-it` for markdown conversion. Templates are JS functions returning HTML strings. The script scans the vault, processes each markdown file, resolves wiki-links, filters player-only sections, selects a template by entity type, and writes static HTML to `docs/`.

**Tech Stack:** Node.js, gray-matter, markdown-it. No frameworks, no bundlers. Vanilla CSS and minimal vanilla JS for accordion behaviour.

**Design Spec:** `docs/superpowers/specs/2026-04-11-vault-to-site-design.md`

**Vault path:** `/Users/antonypegg/Documents/specialforces_vault`

**Key vault templates to reference:** `_Templates/Template - NPC.md`, `_Templates/Template - Location.md`, `_Templates/Template - PC.md` — these define the section structure that gm-apprentice uses when creating entities.

---

## File Structure

```
gurps-special-forces/
├── build.js                    # Main build script — orchestration
├── lib/
│   ├── scanner.js              # Vault scanning, frontmatter parsing, slug generation
│   ├── processor.js            # Markdown conversion, wiki-link resolution, section filtering
│   └── templates.js            # All HTML template functions (PC, NPC, Location, Wiki, Index, Landing)
├── css/
│   └── style.css               # Maritime theme (already exists, needs minor updates)
├── vault.config.json           # Vault path and site settings
├── package.json                # Dependencies: gray-matter, markdown-it
├── .gitignore                  # node_modules, .DS_Store
├── .nojekyll                   # Already exists at root — also copied to docs/
└── docs/                       # Generated output (GitHub Pages serves this)
```

**Why three lib files instead of one big script:**
- `scanner.js` (~80 lines) — pure functions for reading the vault. No HTML knowledge.
- `processor.js` (~120 lines) — transforms markdown content. Knows about wiki-links and section filtering but not templates.
- `templates.js` (~300 lines) — all HTML generation. The largest file because it contains template markup for 6 page types. Each template is one function.
- `build.js` (~60 lines) — orchestration. Calls scanner → processor → templates → writes files.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vault.config.json`
- Create: `.gitignore`
- Remove: `characters/jens-hartmann.html` (old hand-crafted file, replaced by build output)
- Remove: `characters/` directory
- Remove: `npcs/`, `world/`, `rules/` directories (created during earlier aborted build)
- Keep: `css/style.css` (will be updated in Task 2)
- Keep: `.nojekyll`

- [ ] **Step 1: Clean up old hand-crafted files**

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
rm -f characters/jens-hartmann.html
rmdir characters npcs world rules 2>/dev/null; true
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "gurps-special-forces",
  "version": "1.0.0",
  "private": true,
  "description": "Static site generator for the GURPS Special Forces campaign vault",
  "scripts": {
    "build": "node build.js"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "markdown-it": "^14.1.0"
  }
}
```

- [ ] **Step 3: Create vault.config.json**

```json
{
  "vaultPath": "/Users/antonypegg/Documents/specialforces_vault",
  "outputDir": "./docs",
  "siteTitle": "GURPS Special Forces",
  "siteUrl": "https://antthelimey.github.io/gurps-special-forces",
  "excludeDirs": ["_meta", "_Templates", "_resources", ".obsidian", ".smart-env", "node_modules", "GURPS Special Forces"],
  "excludeSections": ["Player Notes", "Source References"],
  "folderMap": {
    "_Campaign": "campaign",
    "Characters/PCs": "characters/pcs",
    "Characters/NPCs": "characters/npcs",
    "Factions & Organizations": "factions",
    "Events": "events",
    "Locations": "locations",
    "Items & Artifacts": "items",
    "Documents": "documents",
    "Clues": "clues",
    "Chapters": "chapters"
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.DS_Store
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
npm install
```

Expected: `added 2 packages` (gray-matter pulls in a few transitive deps, markdown-it is standalone).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vault.config.json .gitignore
git rm -r --cached characters 2>/dev/null; true
git commit -m "Scaffold project with build dependencies and vault config"
```

---

### Task 2: CSS — finalise the stylesheet

**Files:**
- Modify: `css/style.css` (already exists from earlier build, needs minor updates)

The existing stylesheet has the maritime colour scheme, mobile-first design, accordion components, scrollable tables, card components, roster grid, hero section, nav overlay, stub badges, and dark mode support. It's mostly complete.

- [ ] **Step 1: Review existing CSS and add any missing styles**

Add styles for:
- `.metadata-badges` — inline badges for Location frontmatter fields (type, security, atmosphere)
- `.breadcrumb` — parent location breadcrumb trail
- `.quick-stats` — compact stat block for NPCs (smaller than full accordion tables)
- `.contact-stats` — contact reference box for NPC contacts
- `.relationship-list` — rendered relationship list replacing dataview blocks

```css
/* NPC quick stats block */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.quick-stats .stat-item {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  text-align: center;
}
.quick-stats .stat-item .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.quick-stats .stat-item .value {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 1.1rem;
}

/* Contact stats box */
.contact-box {
  background: var(--card-bg);
  border: 1px solid var(--accent);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}
.contact-box h4 {
  color: var(--accent);
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  text-transform: uppercase;
}

/* Metadata badges */
.metadata-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.metadata-badge {
  display: inline-block;
  background: var(--medium);
  color: var(--white);
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.2rem;
}

/* Breadcrumb */
.breadcrumb {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}
.breadcrumb a {
  color: var(--accent);
}
.breadcrumb .sep {
  margin: 0 0.3rem;
  opacity: 0.5;
}

/* Relationship list */
.relationship-list {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}
.relationship-list li {
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.relationship-list .rel-type {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: 0.5rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "Finalise CSS with NPC, location, and relationship styles"
```

---

### Task 3: Scanner module — read the vault

**Files:**
- Create: `lib/scanner.js`

This module exports functions to scan the vault directory, parse frontmatter from each markdown file, generate URL slugs, and build the wiki-link lookup map.

- [ ] **Step 1: Create lib/ directory**

```bash
mkdir -p /Users/antonypegg/PROJECTS/gurps-special-forces/lib
```

- [ ] **Step 2: Write scanner.js**

```js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapFolder(vaultRelPath, folderMap) {
  for (const [vaultDir, outputDir] of Object.entries(folderMap)) {
    if (vaultRelPath.startsWith(vaultDir)) {
      return vaultRelPath.replace(vaultDir, outputDir);
    }
  }
  return null;
}

function scanVault(config) {
  const { vaultPath, excludeDirs, folderMap } = config;
  const pages = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(vaultPath, fullPath);

      if (entry.isDirectory()) {
        if (excludeDirs.some(ex => relPath.startsWith(ex) || entry.name.startsWith('.'))) continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        if (!frontmatter.type) continue; // skip files without typed frontmatter

        const dirRel = path.relative(vaultPath, dir);
        const outputDir = mapFolder(dirRel, folderMap);
        if (!outputDir && dirRel !== '') continue; // skip unmapped directories

        const baseName = path.basename(entry.name, '.md');
        const slug = slugify(baseName);
        const outputPath = outputDir
          ? path.join(outputDir, slug + '.html')
          : slug + '.html';

        pages.push({
          sourcePath: fullPath,
          title: baseName,
          slug,
          outputPath,
          outputDir: outputDir || '',
          frontmatter,
          markdown: content,
        });
      }
    }
  }

  walk(vaultPath);
  return pages;
}

function buildLinkMap(pages) {
  const map = {};
  for (const page of pages) {
    map[page.title] = page.outputPath;
    if (page.frontmatter.aliases) {
      for (const alias of page.frontmatter.aliases) {
        map[alias] = page.outputPath;
      }
    }
  }
  return map;
}

module.exports = { slugify, scanVault, buildLinkMap, mapFolder };
```

- [ ] **Step 3: Quick test — run scanner standalone**

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
node -e "
const { scanVault, buildLinkMap } = require('./lib/scanner');
const config = require('./vault.config.json');
const pages = scanVault(config);
console.log('Found', pages.length, 'pages:');
pages.forEach(p => console.log(' ', p.frontmatter.type, '|', p.title, '->', p.outputPath));
const linkMap = buildLinkMap(pages);
console.log('Link map entries:', Object.keys(linkMap).length);
"
```

Expected: Lists all entity files (Ronnie Vint, Jens Hartmann, Dave Crockett, The Meteor Event, The Defense Contractor, NATO, Campaign Overview, Timeline, Player Characters) with their output paths.

- [ ] **Step 4: Commit**

```bash
git add lib/scanner.js
git commit -m "Add vault scanner module with frontmatter parsing and link map"
```

---

### Task 4: Processor module — content transformation

**Files:**
- Create: `lib/processor.js`

This module converts markdown to HTML, resolves `[[wiki-links]]`, filters out excluded sections, strips dataview blocks, and renders relationships from frontmatter.

- [ ] **Step 1: Write processor.js**

```js
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true, typographer: true });

function resolveWikiLinks(markdown, linkMap, currentOutputPath) {
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, displayText) => {
    const display = displayText || target;
    const targetPath = linkMap[target];
    if (!targetPath) return display;
    const currentDir = currentOutputPath.substring(0, currentOutputPath.lastIndexOf('/'));
    const relative = relativePath(currentDir, targetPath);
    return `[${display}](${relative})`;
  });
}

function relativePath(fromDir, toPath) {
  if (!fromDir) return toPath;
  const fromParts = fromDir.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);
  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++;
  }
  const ups = fromParts.length - common;
  const result = '../'.repeat(ups) + toParts.slice(common).join('/');
  return result || toPath;
}

function filterSections(markdown, excludeSections) {
  const lines = markdown.split('\n');
  const result = [];
  let excluding = false;
  let excludeLevel = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      if (excluding && level <= excludeLevel) {
        excluding = false;
      }

      if (excludeSections.some(s => title.toLowerCase() === s.toLowerCase())) {
        excluding = true;
        excludeLevel = level;
        continue;
      }

      // Also exclude Appearances sections that are just placeholder text
      if (title === 'Appearances') {
        const nextContentLines = [];
        const idx = lines.indexOf(line);
        for (let i = idx + 1; i < lines.length; i++) {
          if (lines[i].match(/^#{1,6}\s/)) break;
          if (lines[i].trim()) nextContentLines.push(lines[i].trim());
        }
        const content = nextContentLines.join(' ');
        if (!content || content.startsWith('*Scenes') || content.startsWith('*Events')) {
          excluding = true;
          excludeLevel = level;
          continue;
        }
      }
    }

    if (!excluding) {
      result.push(line);
    }
  }

  return result.join('\n');
}

function stripDataview(markdown) {
  return markdown.replace(/```dataview[\s\S]*?```/g, '');
}

function renderRelationships(frontmatter, linkMap, currentOutputPath) {
  const rels = frontmatter.relationships;
  if (!rels || !Array.isArray(rels)) return '';
  const valid = rels.filter(r => r.target && r.type);
  if (valid.length === 0) return '';

  const currentDir = currentOutputPath.substring(0, currentOutputPath.lastIndexOf('/'));
  const items = valid.map(r => {
    const targetName = r.target.replace(/\[\[|\]\]/g, '');
    const targetPath = linkMap[targetName];
    const link = targetPath
      ? `<a href="${relativePath(currentDir, targetPath)}" class="entity-link">${targetName}</a>`
      : targetName;
    const type = r.type.replace(/_/g, ' ');
    const desc = r.description ? ` &mdash; ${r.description}` : '';
    return `<li>${link} <span class="rel-type">${type}</span>${desc}</li>`;
  });

  return `<h2>Relationships</h2>\n<ul class="relationship-list">\n${items.join('\n')}\n</ul>`;
}

function processContent(page, linkMap, excludeSections) {
  let markdown = page.markdown;
  markdown = stripDataview(markdown);
  markdown = filterSections(markdown, excludeSections);
  markdown = resolveWikiLinks(markdown, linkMap, page.outputPath);
  const html = md.render(markdown);
  const relationships = renderRelationships(page.frontmatter, linkMap, page.outputPath);
  return { html, relationships };
}

// Extract ## sections for accordion rendering (used by PC/NPC templates)
function extractSections(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (current) sections.push(current);
      current = { title: h2Match[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return sections.map(s => ({
    title: s.title,
    id: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    html: md.render(s.lines.join('\n')),
  }));
}

module.exports = { processContent, extractSections, resolveWikiLinks, filterSections, stripDataview, renderRelationships, relativePath };
```

- [ ] **Step 2: Quick test — run processor on a vault file**

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
node -e "
const { scanVault, buildLinkMap } = require('./lib/scanner');
const { processContent } = require('./lib/processor');
const config = require('./vault.config.json');
const pages = scanVault(config);
const linkMap = buildLinkMap(pages);
const meteor = pages.find(p => p.title === 'The Meteor Event');
const result = processContent(meteor, linkMap, config.excludeSections);
console.log(result.html.substring(0, 500));
console.log('---RELATIONSHIPS---');
console.log(result.relationships);
"
```

Expected: HTML output of The Meteor Event with wiki-links resolved and Player Notes / Source References stripped.

- [ ] **Step 3: Commit**

```bash
git add lib/processor.js
git commit -m "Add content processor with wiki-links, section filtering, and relationship rendering"
```

---

### Task 5: Templates module — HTML generation

**Files:**
- Create: `lib/templates.js`

All template functions in one file. Each function takes page data and returns a complete HTML string. The nav menu is passed in pre-rendered.

- [ ] **Step 1: Write templates.js**

This is the largest file. It contains:

1. `generateNav(pages, config)` — builds the nav menu HTML from the page list
2. `baseShell(opts)` — wraps any content in the full HTML document shell (head, header, nav, footer)
3. `pcTemplate(page, processedContent, sections, nav, config)` — PC character sheet with accordions
4. `npcTemplate(page, processedContent, nav, config)` — NPC page with header card and quick stats
5. `locationTemplate(page, processedContent, nav, config)` — Location page with metadata badges
6. `wikiTemplate(page, processedContent, nav, config)` — Generic wiki prose page
7. `indexTemplate(title, pages, nav, config, sectionDescription)` — Directory listing page
8. `landingTemplate(pages, nav, config)` — Root landing page with nav grid

```js
const { relativePath } = require('./processor');

function cssPath(outputPath) {
  const depth = outputPath.split('/').length - 1;
  return '../'.repeat(depth) + 'css/style.css';
}

function rootPath(outputPath) {
  const depth = outputPath.split('/').length - 1;
  return '../'.repeat(depth) || './';
}

function generateNav(pages, config) {
  const sections = {};
  const sectionLabels = {
    'campaign': 'Campaign',
    'characters/pcs': 'Player Characters',
    'characters/npcs': 'NPCs',
    'factions': 'Factions & Organisations',
    'events': 'Events',
    'locations': 'Locations',
    'items': 'Items & Artifacts',
    'documents': 'Documents',
    'clues': 'Clues',
    'chapters': 'Chapters',
  };

  for (const page of pages) {
    const dir = page.outputDir || 'campaign';
    if (!sections[dir]) sections[dir] = [];
    sections[dir].push(page);
  }

  // Return a function that produces nav HTML relative to a given page
  return function navFor(currentOutputPath) {
    const root = rootPath(currentOutputPath);
    let html = '';
    for (const [dir, label] of Object.entries(sectionLabels)) {
      const dirPages = sections[dir];
      if (!dirPages || dirPages.length === 0) continue;
      html += `<h2>${label}</h2>\n<ul>\n`;
      for (const p of dirPages.sort((a, b) => a.title.localeCompare(b.title))) {
        const currentDir = currentOutputPath.substring(0, currentOutputPath.lastIndexOf('/'));
        const href = relativePath(currentDir, p.outputPath);
        html += `<li><a href="${href}">${p.title}</a></li>\n`;
      }
      html += `</ul>\n`;
    }
    return html;
  };
}

function baseShell({ title, siteTitle, cssHref, navHtml, rootHref, content, bodyClass }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${siteTitle}</title>
  <link rel="stylesheet" href="${cssHref}">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>

<header class="site-header">
  <button class="menu-toggle" onclick="document.getElementById('nav').classList.add('open')" aria-label="Menu">&#9776;</button>
  <h1><a href="${rootHref}index.html">${siteTitle}</a></h1>
</header>

<nav id="nav" class="site-nav">
  <button class="nav-close" onclick="document.getElementById('nav').classList.remove('open')" aria-label="Close">&times;</button>
  ${navHtml}
</nav>

<main class="content">
${content}
</main>

<footer class="site-footer">
  GURPS is a trademark of Steve Jackson Games. Fan creation for personal use. GURPS 4th Edition.
</footer>

<script>
document.querySelectorAll('.site-nav a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('nav').classList.remove('open'));
});
</script>

</body>
</html>`;
}

function stubBadge(frontmatter) {
  if (frontmatter.canon_status === 'STUB') {
    return ' <span class="stub-badge">Stub</span>';
  }
  return '';
}

function needsDevBox(html) {
  // Check if there's a Needs heading in the processed HTML
  const match = html.match(/<h2[^>]*>Needs<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!match) return '';
  return `<div class="needs-dev"><h3>Needs Development</h3>${match[1]}</div>`;
}

function pcTemplate(page, processedContent, sections, navFor, config) {
  const fm = page.frontmatter;
  const headerCard = `
<div class="char-header">
  <h1>${page.title}</h1>
  <p class="concept">${fm.key_traits ? fm.key_traits.join(', ') : ''}</p>
  <div class="meta">
    <span><span class="label">Player</span> ${fm.player_name || ''}</span>
    <span><span class="label">Points</span> ${fm.point_total || 200}/200</span>
    <span><span class="label">Background</span> ${fm.occupation || ''}</span>
    <span><span class="label">Status</span> ${fm.status || 'active'}</span>
  </div>
</div>`;

  const sectionNav = sections.length > 0
    ? `<nav class="section-nav" aria-label="Sheet sections">${sections.map(s => `<a href="#${s.id}">${s.title}</a>`).join('\n')}</nav>`
    : '';

  const accordions = sections.map(s => `
<div class="accordion" id="${s.id}">
  <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">${s.title}</button>
  <div class="accordion-body">
    ${s.html}
  </div>
</div>`).join('\n');

  const content = `${headerCard}\n${sectionNav}\n${accordions}\n${processedContent.relationships}`;

  return baseShell({
    title: page.title,
    siteTitle: config.siteTitle,
    cssHref: cssPath(page.outputPath),
    navHtml: navFor(page.outputPath),
    rootHref: rootPath(page.outputPath),
    content,
  });
}

function npcTemplate(page, processedContent, navFor, config) {
  const fm = page.frontmatter;

  const headerCard = `
<div class="char-header">
  <h1>${page.title}${stubBadge(fm)}</h1>
  <div class="meta">
    ${fm.occupation ? `<span><span class="label">Role</span> ${fm.occupation}</span>` : ''}
    ${fm.nationality ? `<span><span class="label">Nationality</span> ${fm.nationality}</span>` : ''}
    ${fm.status ? `<span><span class="label">Status</span> ${fm.status}</span>` : ''}
    ${fm.age ? `<span><span class="label">Age</span> ${fm.age}</span>` : ''}
    ${fm.rank ? `<span><span class="label">Rank</span> ${fm.rank}</span>` : ''}
  </div>
</div>`;

  const content = `${headerCard}\n${processedContent.html}\n${processedContent.relationships}\n${needsDevBox(processedContent.html)}`;

  return baseShell({
    title: page.title,
    siteTitle: config.siteTitle,
    cssHref: cssPath(page.outputPath),
    navHtml: navFor(page.outputPath),
    rootHref: rootPath(page.outputPath),
    content,
  });
}

function locationTemplate(page, processedContent, navFor, config) {
  const fm = page.frontmatter;

  const badges = [];
  if (fm.location_type) badges.push(fm.location_type);
  if (fm.security_level) badges.push(`Security: ${fm.security_level}`);
  if (fm.atmosphere) badges.push(fm.atmosphere);

  const badgeHtml = badges.length > 0
    ? `<div class="metadata-badges">${badges.map(b => `<span class="metadata-badge">${b}</span>`).join('\n')}</div>`
    : '';

  const breadcrumb = fm.parent_location
    ? `<div class="breadcrumb">${fm.parent_location.replace(/\[\[|\]\]/g, '')} <span class="sep">&rsaquo;</span> ${page.title}</div>`
    : '';

  const headerCard = `
<div class="char-header">
  <h1>${page.title}${stubBadge(fm)}</h1>
</div>`;

  const content = `${headerCard}\n${breadcrumb}\n${badgeHtml}\n${processedContent.html}\n${processedContent.relationships}\n${needsDevBox(processedContent.html)}`;

  return baseShell({
    title: page.title,
    siteTitle: config.siteTitle,
    cssHref: cssPath(page.outputPath),
    navHtml: navFor(page.outputPath),
    rootHref: rootPath(page.outputPath),
    content,
  });
}

function wikiTemplate(page, processedContent, navFor, config) {
  const fm = page.frontmatter;

  const content = `<h1 class="page-title">${page.title}${stubBadge(fm)}</h1>\n${processedContent.html}\n${processedContent.relationships}\n${needsDevBox(processedContent.html)}`;

  return baseShell({
    title: page.title,
    siteTitle: config.siteTitle,
    cssHref: cssPath(page.outputPath),
    navHtml: navFor(page.outputPath),
    rootHref: rootPath(page.outputPath),
    content,
  });
}

function indexTemplate(outputDir, title, pages, navFor, config) {
  const outputPath = outputDir ? `${outputDir}/index.html` : 'index.html';

  const cards = pages.length > 0
    ? `<div class="roster">${pages.map(p => {
        const fm = p.frontmatter;
        const subtitle = fm.occupation || fm.event_type || fm.faction_type || fm.location_type || fm.type || '';
        const currentDir = outputDir || '';
        const href = p.outputPath.startsWith(currentDir)
          ? p.outputPath.substring(currentDir.length + 1)
          : relativePath(currentDir, p.outputPath);
        return `
<div class="roster-card">
  <h3><a href="${href}">${p.title}</a>${stubBadge(fm)}</h3>
  ${subtitle ? `<div class="role">${subtitle}</div>` : ''}
</div>`;
      }).join('\n')}</div>`
    : '<p>No entries yet.</p>';

  const content = `<h1 class="page-title">${title}</h1>\n${cards}`;

  return baseShell({
    title,
    siteTitle: config.siteTitle,
    cssHref: cssPath(outputPath),
    navHtml: navFor(outputPath),
    rootHref: rootPath(outputPath),
    content,
  });
}

function landingTemplate(pages, navFor, config) {
  const outputPath = 'index.html';

  const sectionLabels = {
    'characters/pcs': 'Player Characters',
    'characters/npcs': 'NPCs',
    'campaign': 'Campaign',
    'factions': 'Factions & Organisations',
    'events': 'Events',
    'locations': 'Locations',
  };

  const navCards = Object.entries(sectionLabels).map(([dir, label]) => {
    const dirPages = pages.filter(p => p.outputDir === dir);
    const links = dirPages.map(p => `<li><a href="${p.outputPath}">${p.title}</a></li>`).join('\n');
    return `
<div class="nav-card">
  <h3><a href="${dir}/index.html">${label}</a></h3>
  <ul>${links || '<li>No entries yet</li>'}</ul>
</div>`;
  }).join('\n');

  const content = `
<div class="hero">
  <h1>${config.siteTitle}</h1>
  <p class="tagline">2019. Meteor fragments grant superhuman abilities. You do NOT have a fragment.</p>
  <p class="params">GURPS 4th Edition &bull; 200 points &bull; TL8 + experimental</p>
</div>

<div class="nav-grid">
${navCards}
</div>`;

  return baseShell({
    title: 'Home',
    siteTitle: config.siteTitle,
    cssHref: 'css/style.css',
    navHtml: navFor(outputPath),
    rootHref: './',
    content,
  });
}

// NOTE: relativePath is imported at the top of this file:
// const { relativePath } = require('./processor');

module.exports = {
  generateNav, baseShell, pcTemplate, npcTemplate, locationTemplate,
  wikiTemplate, indexTemplate, landingTemplate,
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/templates.js
git commit -m "Add HTML template functions for all page types"
```

---

### Task 6: Build script — orchestration

**Files:**
- Create: `build.js`

The main entry point. Reads config, scans vault, processes content, selects templates, writes output.

- [ ] **Step 1: Write build.js**

```js
const fs = require('fs');
const path = require('path');
const { scanVault, buildLinkMap } = require('./lib/scanner');
const { processContent, extractSections, filterSections, stripDataview } = require('./lib/processor');
const { generateNav, pcTemplate, npcTemplate, locationTemplate, wikiTemplate, indexTemplate, landingTemplate } = require('./lib/templates');

const config = require('./vault.config.json');
const outputDir = path.resolve(config.outputDir);

// Clean output dir (except specs/plans)
function cleanOutput() {
  if (!fs.existsSync(outputDir)) return;
  const preserve = ['superpowers'];
  for (const entry of fs.readdirSync(outputDir)) {
    if (preserve.includes(entry)) continue;
    const full = path.join(outputDir, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function copyCSS() {
  const src = path.resolve('css/style.css');
  const dest = path.join(outputDir, 'css/style.css');
  ensureDir(dest);
  fs.copyFileSync(src, dest);
}

function writeNoJekyll() {
  fs.writeFileSync(path.join(outputDir, '.nojekyll'), '');
}

function main() {
  console.log('Scanning vault:', config.vaultPath);
  const pages = scanVault(config);
  console.log(`Found ${pages.length} pages`);

  const linkMap = buildLinkMap(pages);
  console.log(`Built link map with ${Object.keys(linkMap).length} entries`);

  cleanOutput();
  copyCSS();
  writeNoJekyll();

  const navFor = generateNav(pages, config);

  // Render each page
  for (const page of pages) {
    const processed = processContent(page, linkMap, config.excludeSections);
    let html;

    switch (page.frontmatter.type) {
      case 'pc': {
        let filtered = stripDataview(page.markdown);
        filtered = filterSections(filtered, config.excludeSections);
        const sections = extractSections(filtered);
        html = pcTemplate(page, processed, sections, navFor, config);
        break;
      }
      case 'npc':
        html = npcTemplate(page, processed, navFor, config);
        break;
      case 'location':
        html = locationTemplate(page, processed, navFor, config);
        break;
      default:
        html = wikiTemplate(page, processed, navFor, config);
    }

    const outPath = path.join(outputDir, page.outputPath);
    ensureDir(outPath);
    fs.writeFileSync(outPath, html);
    console.log(`  wrote ${page.outputPath}`);
  }

  // Generate index pages for each output directory
  const dirs = {};
  for (const page of pages) {
    const dir = page.outputDir;
    if (!dirs[dir]) dirs[dir] = [];
    dirs[dir].push(page);
  }

  const dirLabels = {
    'campaign': 'Campaign',
    'characters/pcs': 'Player Characters',
    'characters/npcs': 'NPCs',
    'factions': 'Factions & Organisations',
    'events': 'Events',
    'locations': 'Locations',
    'items': 'Items & Artifacts',
    'documents': 'Documents',
    'clues': 'Clues',
    'chapters': 'Chapters',
  };

  for (const [dir, label] of Object.entries(dirLabels)) {
    const dirPages = dirs[dir] || [];
    const indexHtml = indexTemplate(dir, label, dirPages, navFor, config);
    const outPath = path.join(outputDir, dir, 'index.html');
    ensureDir(outPath);
    fs.writeFileSync(outPath, indexHtml);
    console.log(`  wrote ${dir}/index.html`);
  }

  // Landing page
  const landingHtml = landingTemplate(pages, navFor, config);
  fs.writeFileSync(path.join(outputDir, 'index.html'), landingHtml);
  console.log('  wrote index.html');

  console.log('Done!');
}

main();
```

- [ ] **Step 2: Run the build**

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
npm run build
```

Expected output:
```
Scanning vault: /Users/antonypegg/Documents/specialforces_vault
Found 9 pages
Built link map with N entries
  wrote characters/pcs/ronnie-vint.html
  wrote characters/pcs/jens-hartmann.html
  wrote characters/npcs/dave-crockett.html
  wrote events/the-meteor-event.html
  wrote factions/the-defense-contractor.html
  wrote factions/nato.html
  wrote campaign/campaign-overview.html
  wrote campaign/timeline.html
  wrote campaign/player-characters.html
  wrote characters/pcs/index.html
  wrote characters/npcs/index.html
  ... (index pages for all directories)
  wrote index.html
Done!
```

- [ ] **Step 3: Verify output files exist**

```bash
find docs -name '*.html' | sort
```

Expected: All HTML files listed above.

- [ ] **Step 4: Commit**

```bash
git add build.js
git commit -m "Add build script orchestrating vault-to-site generation"
```

---

### Task 7: First full build, verify, and commit output

- [ ] **Step 1: Run the build and fix any errors**

```bash
npm run build
```

Fix any runtime errors. Common issues: path resolution, missing frontmatter fields, template rendering edge cases.

- [ ] **Step 2: Visual check — open in browser**

```bash
open docs/index.html
```

Check:
- Landing page loads with nav grid and maritime colour scheme
- Click through to a PC character sheet — accordions collapse/expand on tap
- Click through to an NPC page — header card shows role, quick stats visible
- Click through to a wiki page (Meteor Event) — stub badge visible, prose reads cleanly
- Wiki-links between pages work (e.g., Ronnie Vint's page links to Defense Contractor)
- Mobile viewport: resize browser to 375px width, verify layout doesn't break
- Nav hamburger menu opens and closes, links work

- [ ] **Step 3: Commit all generated output**

```bash
git add docs/
git commit -m "Generate initial site from vault"
```

- [ ] **Step 4: Commit everything together**

```bash
git add -A
git commit -m "Complete vault-to-site generator with all templates and initial build"
```

---

### Task 8: Git remote setup and push instructions

- [ ] **Step 1: Provide push commands to user**

The user will create the repo on GitHub, then run:

```bash
cd /Users/antonypegg/PROJECTS/gurps-special-forces
git remote add origin git@github.com:AntTheLimey/gurps-special-forces.git
git branch -M main
git push -u origin main
```

Then in GitHub: Settings → Pages → Source: Deploy from branch → Branch: `main`, folder: `/docs`.

Site will be live at `https://antthelimey.github.io/gurps-special-forces`.

Do NOT push — wait for user to create the repo and confirm.
