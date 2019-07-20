# Version Control

### Version 0.2.1
- Waluigi: Moved to own function.
- Work: Added hour approximation when collecting.
- Work: Fixed collecting after the first time.

## Version 0.2.0
- Work: Command added.
- Work: Uses SQL table to save next work date and points.
- Work: If used when not working, says how many hours until able to use command.
- Chess: Added highlight board style.
- Chess: Added versus board style.
- Chess: Added diagonal board style.
- Chess: Allow black and white to change board style separately.
- Help: Revamped. Top description now describes the function.
- Help: Command arguments for commands now described in fields.
- Support for bot-creator-only commands added using auth.admin field.
- Removed FEN notes from package.json

## Version 0.1.0
- Chess.js connected with Yuni.js
- Chess: Placed into own folder.
- Chess: View added.
- Chess: Pieces move and capture.
- Chess: FEN available.
- Chess: Turn counter.
- Arena: Placed into own folder.
- Waluigi: Luigi chance upped to 0.5
- Waluigi: Now gives the WALUIGI role and removes the Luigi role if WALUIGI appears.
- Waluigi: Now gives the Luigi role and removed the WALUIGI role if Luigi appears.
- easteregg: Lowercased easteregg
- easteregg: Added easteregg first command, showing creators who were first
- easteregg: wy!easteregg Egg is now an alternative.
- choose: Now separated by ", " instead of " ".

### Version 0.0.5
- Arena: create creates a full moveset.
- Arena: create spits out moves in proper form; no more JSON.
- Arena: create now includes support moves
- Arena: Magic moves cost at least 1 MP.
- Arena: With "none" selected, length is 0.
- Arena: Strength/MP cost for effects adjusted based on move length.
- Discord.io and Winston fully removed; bot converted to Discord.js
- Added count and rank to easterEgg found command.

### Version 0.0.4
- Arena.js connected with Yuni.js
- Added unfinished (but stable) version of arena create.
- Added nickname of person who first found an easter egg.
- Added easterEgg found command; lists all easterEggs found.
- Updated help text for easterEgg.
- Added SQL support for Yuni.js. Currently unused.

### Version 0.0.3
- Added easterEgg command; lists all flavor texts for non-found easter eggs.
- Easter egg now in embed
- Easter egg activations counted
- Footer generated in own function.
- Help command w/ arguments now embed.
- Added random command support w/ 1 or 2 arguments.
- Help text updated.

### Version 0.0.2
- Added support for wy! prefix
- Add alternate text for Waluigi commands
- Added help command w/o arguments
- Help.json structure altered
- Altered help command w/ arguments to support new Help.json structure
- Fixed off-by-one error with choose command
- Random command (no arguments) added.
- Easter eggs moved to own file.

### Version 0.0.1
- Added help command w/ Arguments
- Added choose command
- Added waluigi, Waluigi, WALUIGI command
- Added Yuni command
- Added easter eggs.



