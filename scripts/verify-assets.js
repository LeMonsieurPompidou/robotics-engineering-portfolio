import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(process.argv[1]), '..');
const sourceFiles = ['index.html', 'projects.html', 'contact.html', 'script.js'];
const references = new Map();

function normalizeAssetPath(rawPath) {
    if (!rawPath) return null;

    let assetPath = String(rawPath)
        .trim()
        .replaceAll('&amp;', '&')
        .replace(/^['"]|['"]$/g, '')
        .split(/[?#]/, 1)[0]
        .replace(/\\/g, '/');

    try {
        assetPath = decodeURIComponent(assetPath);
    } catch (error) {
        // Keep the original path when it contains malformed URL encoding.
    }

    assetPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    if (!assetPath.toLowerCase().startsWith('assets/')) return null;

    const normalized = path.normalize(assetPath);
    const resolved = path.resolve(projectRoot, normalized);
    const assetsRoot = `${path.resolve(projectRoot, 'assets')}${path.sep}`;
    if (!resolved.startsWith(assetsRoot)) return null;

    return normalized;
}

function addReference(rawPath, group, source) {
    const assetPath = normalizeAssetPath(rawPath);
    if (!assetPath) return;

    if (!references.has(assetPath)) references.set(assetPath, []);
    const assetReferences = references.get(assetPath);
    const referenceKey = `${group}|${source}`;

    if (!assetReferences.some((reference) => reference.key === referenceKey)) {
        assetReferences.push({ key: referenceKey, group, source });
    }
}

function getProjectCardRanges(html) {
    const ranges = [];
    const cardPattern = /<article\b[^>]*class=(['"])[^'"]*\bproject-card\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi;
    let match;

    while ((match = cardPattern.exec(html)) !== null) {
        const openingTag = match[0].match(/^<article\b[^>]*>/i)?.[0] || '';
        const projectId = openingTag.match(/\bdata-project-id=(['"])(.*?)\1/i)?.[2] || 'unknown-project';
        ranges.push({
            start: match.index,
            end: match.index + match[0].length,
            group: `project:${projectId}`
        });
    }

    return ranges;
}

function scanHtml(fileName, html) {
    const cardRanges = getProjectCardRanges(html);
    const groupAt = (index) => (
        cardRanges.find((range) => index >= range.start && index < range.end)?.group
        || `${fileName}:global`
    );

    const scanAttribute = (attributeName, splitValues = false) => {
        const pattern = new RegExp(`\\b${attributeName}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'gi');
        let match;

        while ((match = pattern.exec(html)) !== null) {
            const values = splitValues ? match[2].split(',') : [match[2]];
            values.forEach((value) => addReference(value, groupAt(match.index), `${fileName}:${attributeName}`));
        }
    };

    scanAttribute('data-images', true);
    scanAttribute('data-video', true);
    scanAttribute('data-pdf');
    scanAttribute('data-recommendation-pdf');
    scanAttribute('data-recommendation-pdf-2');

    const tagPattern = /<(img|a)\b[^>]*>/gi;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(html)) !== null) {
        const attributeName = tagMatch[1].toLowerCase() === 'img' ? 'src' : 'href';
        const attributeMatch = tagMatch[0].match(new RegExp(`\\b${attributeName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
        if (attributeMatch) {
            addReference(attributeMatch[2], groupAt(tagMatch.index), `${fileName}:${attributeName}`);
        }
    }

    const backgroundPattern = /url\(\s*(['"]?)(assets\/.*?)\1\s*\)/gi;
    let backgroundMatch;
    while ((backgroundMatch = backgroundPattern.exec(html)) !== null) {
        addReference(backgroundMatch[2], groupAt(backgroundMatch.index), `${fileName}:background-image`);
    }
}

function scanJavaScript(fileName, source) {
    const assetStringPattern = /(['"`])((?:\.?\/)?assets\/[^'"`\r\n]+?)\1/g;
    let match;

    while ((match = assetStringPattern.exec(source)) !== null) {
        addReference(match[2], `${fileName}:direct-references`, `${fileName}:string`);
    }
}

for (const fileName of sourceFiles) {
    const filePath = path.join(projectRoot, fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`Source file not found: ${fileName}`);
        process.exitCode = 1;
        continue;
    }

    const source = fs.readFileSync(filePath, 'utf8');
    if (fileName.endsWith('.html')) scanHtml(fileName, source);
    else scanJavaScript(fileName, source);
}

const missingAssets = new Map();
for (const [assetPath, assetReferences] of references.entries()) {
    if (fs.existsSync(path.resolve(projectRoot, assetPath))) continue;

    for (const reference of assetReferences) {
        if (!missingAssets.has(reference.group)) missingAssets.set(reference.group, []);
        missingAssets.get(reference.group).push({ assetPath, source: reference.source });
    }
}

const totalAssets = references.size;
const uniqueMissingAssets = new Set(
    Array.from(missingAssets.values()).flat().map(({ assetPath }) => assetPath)
);

console.log('\nAsset Verification Report');
console.log('=========================');

if (uniqueMissingAssets.size === 0) {
    console.log('\nNo missing assets found.');
} else {
    console.log('\nMissing assets by project/source:');
    for (const [group, assets] of Array.from(missingAssets.entries()).sort(([a], [b]) => a.localeCompare(b))) {
        console.log(`\n[${group}]`);
        const uniqueGroupAssets = Array.from(
            new Map(assets.map((asset) => [`${asset.assetPath}|${asset.source}`, asset])).values()
        ).sort((a, b) => a.assetPath.localeCompare(b.assetPath));

        uniqueGroupAssets.forEach(({ assetPath, source }) => {
            console.log(`  - ${assetPath} (${source})`);
        });
    }
}

console.log('\nSummary');
console.log('-------');
console.log(`Total assets checked: ${totalAssets}`);
console.log(`Total missing:        ${uniqueMissingAssets.size}`);
console.log(`Status:               ${uniqueMissingAssets.size === 0 ? 'PASS' : 'FAIL'}`);

if (uniqueMissingAssets.size > 0) process.exitCode = 1;
