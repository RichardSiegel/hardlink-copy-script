# hardlink-copy-script
Keep all new hardlinks from a source directory safe in a target directory, where they will not be deleted if they are removed from the source dir.


## Warning

Be sure you understand hardlinks before using this script!


## How to use the script

you can reacreate a hardlink file structure like follows:

npx ts-node src/index.ts /path/to/source /path/to/target


## TODOs

Outcome should be:
- [x] files are only added if now on source (not removed when missing on source)
- [x] when a hardlink is created save incremental names should be used if name is taken (if target inode != source inode)
- [ ] if something is deleted on target, it is not recreated from an unchanged source

How-To:
1. create a list of all files to sync (currently in source)
	- identify via path, size, inode
2. for each file in that list:
    - check if it is in the list of "lastKnownSourceState"
       ---> YES --> do nothing (it must be/have been hradlinked)
       ---> NO ---> add a hardlink
3. use the list of all files synced (currently in source) (from 1.) as future lastKnownSourceState

