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
    if (vaultRelPath === vaultDir || vaultRelPath.startsWith(vaultDir + path.sep)) {
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
        if (excludeDirs.some(ex => relPath.startsWith(ex)) || entry.name.startsWith('.')) continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        let frontmatter, content;
        try {
          ({ data: frontmatter, content } = matter(raw));
        } catch (e) {
          console.warn(`scanner: skipping ${fullPath} — malformed frontmatter: ${e.message}`);
          continue;
        }

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
