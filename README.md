# hardlink-copy-script
Keep all new hardlinks from a source directory safe in a target directory, where they will not be deleted if they are removed from the source dir.


## Warning

Be sure you understand hardlinks before using this script!


## How to use the script

you can reacreate a hardlink file structure like follows:

npx ts-node src/index.ts /path/to/source /path/to/target


## Features

Outcome should be:
- files are only added if now on source (not removed when missing on source)
- when a hardlink is created save incremental names should be used if name is taken (if target inode != source inode)
- if something is deleted on target, it is not recreated from an unchanged source
