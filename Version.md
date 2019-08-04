# Version Control

## Version 0.10.0
- Arena: Name sanitizer for @, \\, and * characters.
- Arena: Character -> CharacterList, also changed from object to array.
- Arena: DEF now forced to int.
- Arena: Various changes to text functions to accomodate new array.
- Arena: Enemy stats now able to be displayed.
- Arena: Battle able to be viewed.
- Arena: Battle JSON has been created.
- Arena: Old view -> team.
- Arena: New view views current battle.
- Attackboss/Newboss: Moved to separate module.
- Attackboss: Now accessed by wy!sillyboss attack.
- Attackboss: Now functional.
- Newboss: Now accessed by wy!sillyboss new.
- Newboss: Stores boss in an object. Does not store to JSON.
- Yuni: New SQLite for guild.
- Yuni: Prints all guild names in console on start.
- Yuni: Counts number of posts per guild.
- Yuni: Guild load, save, new functions added.
- Leaderboard: Now has a try/catch. Failed loads will just spit out ID number.
- Botinfo: Now shows how many times Wenyunibot has been used in the server.
- guildlead: Function added, shows how many times Wenyunibot has been used per server.
- help: sillyboss added under basic.
- help: guildlead added under auxiliary.

### Version 0.9.1
- Arena: Separated requires from constants.
- Arena: Reverted to two characters.
- Arena: Added MaxHP, MaxMP, team to player team JSON.
- Arena: Added moduleColor.
- Arena: Use Ceiling function on MP costs, to adjust to non-integer MP weights.
- Movelist: Now uses non-integer MP weights.
- Arena: Movelist now has tags in front of them.
- Arena: View function added.
- Arena: Start function added, but only spits out a JSON.
- Chess: Added different textbox when passing the argument "flip".
- Yuni/Attackboss: Different error textbox.

## Version 0.9.0
- Mathfind: SQL added.
- Mathfind: Changed module color.
- Mathfind: Questions list added to its own function.
- Mathfind: question/q is not needed to ask a question.
- Mathfind: Fixed errors in error message on question.
- Mathfind: Can no longer fail by asking your last question with no guesses.
- Mathfind: List of questions is viewable.
- Mathfind: Many messages now have author's tag attached to them.
- Mathfind: List of guesses is viewable.
- Mathfind: SQL counts number of wins in each difficulty, and number of games started.
- Mathfind: Added hasdigit.
- Mathfind: Added square.
- Mathfind: Added cube.
- Mathfind: Added fibonacci.
- Mathfind: Added binary.
- Mathfind: Added trinary.
- Mathfind: Added digitroot.
- Mathfind: Added prime.
- Mathfind: Added view function.
- Mathfind: Added profile function.
- Mathfind: Added abort function.
- Mathfind: Difficulty automatically lowercased.
- Mathfind: Added help function.
- Mathfind: Added help question function.
- Mathfind: Added question json.
- Yuni/Mathfind: Initiates table on start.
- Help: Added mathfind to fun section.
- Package: Edited description.

## Version 0.8.0
- Mathfind: Added module.
- Mathfind: Saving/Loading through JSON.
- Mathfind: Can ask questions.
- Mathfind: Can guess the number.
- Mathfind: Game ends properly.
- Mathfind: Divisible question added.
- Mathfind: Triangle Number question added.
- Yuni: Halfhour, Attackboss, Mathfind added.
- Halfhour: Messages the channel every half hour after the initial message is sent.
- Halfhour: Repeating the command will stop the messages in the channel.
- Halfhour: Works with multiple channels at once, with different timers each.
- Help: Fixed text for find.
- Help: Added halfhour text.
- Help: Chess text now says it works with different channels.
- Newboss: Added new bosses.
- Attackboss: Incomplete. Exits out with a message without crashing.
- Eggplant: Help is pulled up if an unrecognized command is input.
- Eggplant: Organized imports and constants.
- Chess: Removed errant comment.
- Arena: Reorganizing of functions.
- Arena/Battle: Added, but unused.

## Version 0.7.0
- Chess: Each channel now has their own game.
- Chess: Games are auto-loaded on reset.
- Chess: Load spits out a new board if auto-loading fails. No more failure message.
- Chess: Load only prints out board if auto.
- Yuni: newboss command added.

### Version 0.6.2
- Profile: Added helper function to reduce repeated code.
- Find: Fixed error with saving find.
- Find: New error for putting a number outside of bounds.
- Find: findBounds object holds minimum and maximum possible numbers.
- Find: Maximum moved up to 10000.
- Admin: Delete function added for testing.

### Version 0.6.1
- Yuni: Fixed error when creating new row.
- Find, Vote: Fixed error when checking for new row.
- Find: Added title when using wy!find with no arguments.
- Find: Added return statement to NaN error, preventing the cooldown timer from activating.

## Version 0.6.0
- Chess, Yuni, Eggplant: Reorganizing of functions.
- Yuni: Reorganizing of imports.
- Arena: Create now takes in defense parameter.
- Arena: Create now stores and shows HP growth, MP growth, HP, MP, Defense.
- Arena: Now gets passed client.
- Yuni: Added find function.
- Yuni: Added vote function.
- Yuni: Added count function.
- Yuni: Added invite function.
- Yuni: Added botinfo function.
- Yuni: Added bothomeserver function.
- Yuni: Now requires package.json
- Easter Egg: Moved to Data folder.
- CountBasic: Added to Data folder.
- Help: General section renamed to Basic.
- Help: Added Auxiliary section.
- Help: Help moved to Auxiliary section.
- Help: Vote added to Basic section.
- Help: Find added to Basic section.
- Help: Switched order of functions in Economy section.
- Help: Count added to Economy section.
- Help: Invite added to Auxiliary section.
- Help: Botinfo added to Auxiliary section.
- Help: Bothomeserver added to Auxiliary section.

### Version 0.5.2
- Arena: Changed order of attack/support move for consistency.
- Arena: Saves team to JSON (incomplete).
- Chess: Save, load functions added.
- Chess: Load/Reset can only be used if game has been saved or 2 hours pass.
- Chess: Autosaves after every move.
- Chess: Embeds for all chess move fails.
- Chess: Setup for next turn (from Castling/not Castling) in a different function.
- Chess: Move is not a necessary argument.
- Chess: Style alternate for set, clear alternate for reset.
- Client: baseEmbed/basicEmbed now asks for a channel instead of a message.
- Eggplant: Updated baseEmbed to match client change.
- Yuni: Various functions updated to use basicEmbed.
- Help: Updated chess, leaderboard to display current argument functions.

### Version 0.5.1
- Arena: Changes made to character creation
- Arena: Character creation now supports character names
- Eggplant: Max Price is now a cubic function.
- Yuni/Eggplant: getData now asks for a user instead of a message.
- Eggplant: Fixed error where sendEmbed was not given a client.
- Eggplant: Reroll time now does not display negative.
- Yuni: Invite function added.
- Yuni: Profile function added.
- Yuni/Admin: Sync function added.
- SQL: Tag field added.
- Yuni: Bot activity added ("Watching for wy!help")
- Help: Added profile function.

## Version 0.5.0
- Chess: Minor edit to wy!chess set help
- Yuni/Eggplant: getData now a client function.
- Eggplant: NaN protection for buy/sell.
- Eggplant: Initial sell price max upped to 95 from 90.
- Eggplant: Various functions now have important parts bolded.
- Eggplant: View, when having no eggplants, now shows current market.
- Eggplant: Buy/View embed with eggplants now is a little bit more stacked.
- Eggplant: Market demand added.
- Eggplant: Market demand and stability no longer show raw numbers, only descriptions.
- Eggplant: Descriptions for demand and stability in a JSON.
- Eggplant: Sell price updated to factor in demand.
- Eggplant: Expiration text no longer comes up if you have no eggplants.
- Eggplant: Selling and rerolling market now have a user tag in the message.
- Eggplant: Help embed added.
- Leaderboard: Can now sort by eggplants and bestEggplant.
- Client/SQL: Updated to reflect eggplant rows.
- Client: getData updated for eggplant rows.
- Work: Bold on how many points gained.
- Work: Best text changed.
- EasterEgg: Lowercase on found and first.
- Leaderboard: Redirects to easteregg on found and first.
- Help: Added "help" to easteregg arguments.

## Version 0.4.0
- Arena: Create now displays two units.
- Chess: Fixed crash that would occur when passing no arguments.
- Chess: Set help will give a list of all current chessboard styles.
- Chess: Removed errant comments.
- Eggplant: Module added.
- Eggplant: Buy function buys eggplants for 100 points.
- Eggplant: Sell function sells eggplants.
- Eggplant: View function views current eggplant market.
- Eggplant: Reroll time set to 6 hours.
- Eggplant: Expire time set to 7 days.
- Eggplant: Throw function throws away expired eggplants.
- Eggplant: Reroll function rerolls market price or market randomness.
- Leaderboard: Now uses emoji to count the top 10.
- Client: Added function basicEmbed.
- Client: Added function footer.
- Help: Added chess to help under fun.
- Help: Added eggplant to help under economy.
- Help: Moved work, leaderboard to economy section.

### Version 0.3.1
- Waluigi: Removed illegal break statement, placed back where it's supposed to belong.
- SQL: Added columns for eggplant.

## Version 0.3.0
- Chess: White now starts on rows 1-2 and Black now starts on rows 7-8.
- Chess: Board styles are now defined in a JSON.
- Chess: Board automatically flips so that the player to move is on the bottom.
- Chess: Castling implemented.
- Chess: Check implemented.
- Chess: Moves now check if they would put the King in check.
- Chess: Promotion implemented.
- Chess: En Passant implemented.
- Chess: Castling disabling implemented.
- SQLite: Primary key is now user.
- SQLite: Best added to SQL table.
- Yuni: Command removed.
- Leaderboard: Command added.
- Work: Results now shown in embed.
- Work: Exact time is now displayed in US format, UTC.
- Work: Best work period is now kept track of.
- Work: If unable to work, `wy!work` will only give the approximation.
- Work: If unable to work, `wy!work detail` will give the exact time.
- Help: Work, chess, and leaderboard added under the help section.

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



