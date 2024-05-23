import * as fs from "fs";
import * as path from "path";

function ensureDirectoryExistence(dirPath: string): void {
  if (fs.existsSync(dirPath)) return;
  ensureDirectoryExistence(path.dirname(dirPath));
  fs.mkdirSync(dirPath);
}

function createHardlinks(src: string, dest: string): void {
  const srcItems = fs.readdirSync(src, { withFileTypes: true });

  for (const srcItem of srcItems) {
    const srcPath = path.join(src, srcItem.name);
    const destPath = path.join(dest, srcItem.name);

    if (srcItem.isDirectory()) {
      ensureDirectoryExistence(destPath);
      createHardlinks(srcPath, destPath);
    } else if (srcItem.isFile()) {
      // TODO check not only if exists but also if hardlink
      if (!fs.existsSync(destPath)) fs.linkSync(srcPath, destPath);
      // TODO save number increment names
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error(
      "Usage: ts-node src/index.ts <source-directory> <target-directory>"
    );
    process.exit(1);
  }

  const [sourceDir, targetDir] = args.map((arg) => path.resolve(arg));

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory does not exist: ${sourceDir}`);
    process.exit(1);
  }

  ensureDirectoryExistence(targetDir);
  createHardlinks(sourceDir, targetDir);

  console.log(
    `Directory tree replicated from ${sourceDir} to ${targetDir} using hardlinks.`
  );
}

main();
