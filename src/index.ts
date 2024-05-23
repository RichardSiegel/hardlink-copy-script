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

type PathSignature = `inode=${number}:path="${string}"`;

function getPathSignature(filePath: string): PathSignature {
  const { ino } = fs.statSync(filePath);
  return `inode=${ino}:path="${filePath}"`;
}

function createHardlinks(
  src: string,
  dest: string,
  skipPaths: PathSignature[],
  checkedPaths: PathSignature[]
): void {
  const srcItems = fs.readdirSync(src, { withFileTypes: true });

  for (const srcItem of srcItems) {
    const srcPath = path.join(src, srcItem.name);
    const destPath = path.join(dest, srcItem.name);

    if (srcItem.isDirectory()) {
      ensureDirectoryExistence(destPath);
      createHardlinks(srcPath, destPath, skipPaths, checkedPaths);
    } else if (srcItem.isFile()) {
      const pathSignature = getPathSignature(srcPath);
      checkedPaths.push(pathSignature);
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

      // if not the hardlink we could create already
      if (!existsAsHardlink(srcPath, finalDestPath)) {
        // if not removed after it was hardlinked before
        if (!skipPaths.includes(pathSignature)) {
          // New files will be hardlinked
          fs.linkSync(srcPath, finalDestPath);
        }
      }
    }
  }
}

const sourceDirStateFileName = ".last-synced-source-dir-state.json";

function loadListOfKnownSourceFiles(targetDir: string): PathSignature[] {
  const filename = path.join(targetDir, sourceDirStateFileName);
  if (!fs.existsSync(filename)) return [] as PathSignature[];
  const jsonString = fs.readFileSync(filename, "utf-8");
  const sourceDirState = JSON.parse(jsonString);
  return sourceDirState?.checkedPaths ?? ([] as PathSignature[]);
}

function saveListOfKnownSourceFiles(
  targetDir: string,
  checkedPaths: PathSignature[]
) {
  const filename = path.join(targetDir, sourceDirStateFileName);
  const sourceDirState = {
    scanDate: new Date().toISOString(),
    checkedPaths,
  };
  fs.writeFileSync(filename, JSON.stringify(sourceDirState));
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

  // use the list of files, which were synced already to skip them
  // thus, if they got deleted in the target they will not be restored
  const skipPaths = loadListOfKnownSourceFiles(targetDir);
  const checkedPaths: PathSignature[] = [];

  ensureDirectoryExistence(targetDir);
  createHardlinks(sourceDir, targetDir, skipPaths, checkedPaths);

  // save what got synced this time, to be able to skip it in the future
  saveListOfKnownSourceFiles(targetDir, checkedPaths);

  console.log(
    `Directory tree replicated from ${sourceDir} to ${targetDir} using hardlinks.`
  );
}

main();
