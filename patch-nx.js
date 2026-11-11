const fs = require('fs');
const path = require('path');

// 1. Fix package-lock.json: remove invalid versionless package stubs causing 'Missing field `version`' in Rust serde parser
const lockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    let cleaned = 0;
    if (lock.packages) {
      for (const [pkgPath, pkg] of Object.entries(lock.packages)) {
        if (pkgPath !== '' && !pkg.link && !pkg.version) {
          delete lock.packages[pkgPath];
          cleaned++;
        }
      }
    }
    if (cleaned > 0) {
      fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf8');
      console.log(`[patch-nx] Cleaned ${cleaned} versionless package stub(s) from package-lock.json`);
    } else {
      console.log('[patch-nx] package-lock.json has no versionless package stubs');
    }
  } catch (err) {
    console.error('[patch-nx] Error cleaning package-lock.json:', err);
  }
}

// 2. Fix findTarget in all nx npm-parser.js and yarn-parser.js files across node_modules
const replacementFindTarget = `function findTarget(sourcePath, keyMap, targetName, versionRange) {
    if (!sourcePath || !keyMap || !targetName) return;
    versionRange = (typeof versionRange === 'string' ? versionRange : '*');
    if (!sourcePath.endsWith('/')) {
        sourcePath = \`\${sourcePath}/\`;
    }
    const searchPath = \`\${sourcePath}node_modules/\${targetName}\`;
    if (keyMap.has(searchPath)) {
        const child = keyMap.get(searchPath);
        if (child && child.data) {
            const childVersion = (typeof child.data.version === 'string' ? child.data.version : '0.0.0');
            if (childVersion.startsWith('npm:') && versionRange.startsWith('npm:')) {
                const nodeVersion = childVersion.slice(childVersion.indexOf('@', 5) + 1);
                const depVersion = versionRange.slice(versionRange.indexOf('@', 5) + 1);
                if (nodeVersion === depVersion || (0, semver_1.satisfies)(nodeVersion, depVersion)) {
                    return child;
                }
            } else if (childVersion === versionRange || (0, semver_1.satisfies)(childVersion, versionRange)) {
                return child;
            }
        }
    }
    const parts = sourcePath.split('node_modules/');
    if (parts.length <= 1) {
        return;
    }
    return findTarget(parts.slice(0, -1).join('node_modules/'), keyMap, targetName, versionRange);
}`;

function findFiles(dir, filenames, results = []) {
  if (!fs.existsSync(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findFiles(fullPath, filenames, results);
      } else if (filenames.includes(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return results;
}

const parserFiles = findFiles(path.join(__dirname, 'node_modules'), ['npm-parser.js', 'yarn-parser.js']);
console.log(`[patch-nx] Found ${parserFiles.length} lockfile parser file(s)`);

let patchedCount = 0;
for (const file of parserFiles) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    content = content.replace(/function findTarget\([\s\S]*?\n(?=function addV1NodeDependencies)/, replacementFindTarget + '\n');
    content = content.replace(/versionRange\.startsWith\('npm:'\)/g, '(typeof versionRange === "string" && versionRange.startsWith("npm:"))');
    content = content.replace(/child\.data\.version\.startsWith\('npm:'\)/g, '(typeof child?.data?.version === "string" && child.data.version.startsWith("npm:"))');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`[patch-nx] Successfully patched ${file}`);
      patchedCount++;
    } else {
      console.log(`[patch-nx] Already patched or clean: ${file}`);
    }
  } catch (err) {
    console.error(`[patch-nx] Error patching ${file}:`, err);
  }
}

console.log(`[patch-nx] Completed successfully. Total files patched: ${patchedCount}`);
