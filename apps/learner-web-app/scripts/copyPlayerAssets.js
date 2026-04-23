const fs = require("fs-extra");
const path = require("path");

// Source: The root of the @project-sunbird/content-player package
// Calculated from script location: /home/ttpl-rt-151/Documents/Shikshav/Shiksha-mfe/shiksha-mfe/apps/learner-web-app/scripts
// To: /home/ttpl-rt-151/Documents/Shikshav/Shiksha-mfe/shiksha-mfe/node_modules/@project-sunbird/content-player
const playerSourceDir = path.join(
  __dirname,
  "../../node_modules/@project-sunbird/sunbird-content-player/preview"
); // <--- CRITICAL CHANGE HERE

const playerDestDir = path.join(__dirname, "../public/sbplayer");

console.log(`[Sunbird Player Copy] Copying assets from: ${sourceDir}`);
console.log(`[Sunbird Player Copy] To: ${destDir}`);

fs.copy(
  sourceDir,
  destDir,
  {
    overwrite: true,
    filter: (src, dest) => {
      try {
        const stats = fs.lstatSync(src);
        if (stats.isSymbolicLink()) {
          const linkTarget = fs.readlinkSync(src);
          const resolvedLinkTarget = path.resolve(
            path.dirname(src),
            linkTarget
          );
          // This filter is for symlinks that point *back into* node_modules or itself, preventing recursion
          // It might need adjustment if other symlink issues arise.
          return (
            !resolvedLinkTarget.includes(
              path.join(sourceDir, "node_modules")
            ) && !resolvedLinkTarget.startsWith(sourceDir)
          );
        }
      } catch (e) {
        console.warn(
          `[Sunbird Player Copy] Warning: Could not stat ${src}. Skipping.`,
          e.message
        );
        return false; // Skip if lstat fails (e.g., broken symlink)
      }
      return true; // Copy everything else (files, directories)
    },
  },
  (err) => {
    if (err) {
      console.error("[Sunbird Player Copy] Error copying player assets:", err);
      process.exit(1); // Exit with an error code if copy fails
    } else {
      console.log(
        "[Sunbird Player Copy] Sunbird player assets copied successfully!"
      );
    }
  }
);
