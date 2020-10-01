# Overseer
This changelog is for the HTML5 idle/incremental game [Overseer](https://mrsperry.github.io/overseer).

Dates are formatted as year-month-day.

## Upcoming changes
### Additions
- Added scan/purge buttons next to disk usage percentages
- Added a message to the `OrderedNumbers` hack to differentiate it from `NumberMultiples`
- Added new settings to the settings menu
    - **Stop searching automatically**: Stops core searches automatically when your disks are full
    - **Poor eyesight features**: For now this setting removes the `HiddenPasswords` hack
- Added a network channel system
    - Crack channels to access the memory core inside of them
    - Once a channel has been cracked you may siphon data from it
    - Siphoning data increases the chance you will be detected
    - When detected, a hack minigame will need to be completed
        - If you win then data siphoning continues
        - If you lose the channel will lock and you will need to re-crack it
    - Channel siphoning progress is displayed in a box labelled "Memory core defragmentation"
        - Every 1% of data you siphon from a channel will add a cube to the display to easily track your progress
- Added an event system called 'Verdicts'
    - Each verdict presents a scenario with multiple option on how to proceed
    - Some options may give reliability or free files to scan/purge
    - Other options will make you lose reliability or other resources
    - And of course a few options will do absolutely nothing
- Added new hack types
    - **HexMatcher**: Match the same hex value on the left and right side of the board to create a connection between the two
    - **LogMismatch**: Compare hexadecimal values and find which pairs do not match
    - **DataCorruption**: Find which hexadecimal numbers contain a corrupted sequence
- Added a system for general progression prompts (story updates to make understanding new mechanics easier)
- Added a drop shadow filter to the main menu image
- Added links to [the wiki](https://github.com/mrsperry/overseer/wiki) on the main menu and in-game footer

### Changes
- Core power now matches the maximum number of core speed upgrades you have
- Moved `Reset settings` to the same line as `Restart game` in the settings menu and made it permanently red
- Kilobyte values above 1,000 are now shortened to megabyte (mb) values
- Research is now sometimes displayed as a choice between two options
    - Some research, such as threat level, do not have an alternative option
- Hacks now trigger when using the new channel system rather than when you have files in your quarantine
    - Hack level is now determined by the number of channels instead of threat level
    - Failing a hack will now lock a channel you are currently siphoning
    - Added an additional five seconds to every level of every hack

### Removals
- Removed the concept of quarantine breakouts in favor of channel lockdowns

### Bug fixes
- Fixed core upgrade buttons wrongly enabling after reload
- Fixed quarantine zones not updating their usage percentage if their files were not displayed
- Fixed artificial inflation of the number of times hacked

## v1.0.0 - 2020-09-08
### Initial public release