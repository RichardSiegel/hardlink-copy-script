import * as fs from "fs";
import * as path from "path";

function ensureDirectoryExistence(dirPath: string): void {
  if (fs.existsSync(dirPath)) return;
  ensureDirectoryExistence(path.dirname(dirPath));
  fs.mkdirSync(dirPath);
}

function existsAsHardlink(srcPath: string, destPath: string): boolean {
  if (!fs.existsSync(destPath)) return false;
  const srcStats = fs.statSync(srcPath);
  const destStats = fs.statSync(destPath);
  return srcStats.ino === destStats.ino;
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
      let finalDestPath = destPath;
      let counter = 1;

      while (
        fs.existsSync(finalDestPath) &&
        !existsAsHardlink(srcPath, finalDestPath)
      ) {
        const { name, ext } = path.parse(destPath);
        finalDestPath = path.join(dest, `${name}(${counter})${ext}`);
        counter++;
      }

      if (!existsAsHardlink(srcPath, finalDestPath)) {
        fs.linkSync(srcPath, finalDestPath);
      }
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
