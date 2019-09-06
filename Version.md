# Version Control

### Version 1.0.4
- Work: Increased count bonus to up to 150x count.
- ALL: Added support for "wy! command".
- Count: Shows number of times counted personally upon success.
- Ping: Command added.

### Version 1.0.3
- Arena: Fixed reward error for ranks 9 and lower.
- Easteregg: Fixed saving error.
- Work: Added bonus points via count.
- Help: Changed find description for the lowered time.
- Help: Changed work and count description to indicate work change.

### Version 1.0.2
- Mathfind: Fix for new players.
- Mathfind: Alternate commands added.

### Version 1.0.1
- Arena: Fix for any target moves.

# Version 1.0.0 (Release!)
- Arena: Enemy teams added.
- Arena: Help text added.
- Arena: Level-up function added.
- Arena: Added units able to move.
- Arena: Battle now does not allow overwriting.
- Arena: Cooldown added to battling.
- Arena: Enemy team determined by player rank.
- Arena: Checks for level-ups.
- All: Regex function used for spaces.
- Arena: Default uses help.
- ArenaData: Getter/Setter for battleTime.
- ArenaData: Profile's battleTime uses US format.
- ArenaData: Check Levelup Function.
- ArenaData: Added new exports.
- arenaHelp.json: Added.
- rewards.json: Buffed winning SP rewards.
- status.json: Added def-down.
- status.json: Added blind.
- Chess: Added help.
- chessHelp.json: Added.
- help: Added arena to fun section.
- help: Added more arguments to leaderboard.
- Yuni: Added try/catch to arena.
- Yuni: Added server/guild argument to leaderboard, which leads to serverlead.

## Version 0.15.0 (Arena Profile, Rewards)
- Arena: Profile function added.
- Arena: Delete function added.
- Arena: Delete function only occurs if user's tag is passed.
- Yuni/Arena: OnStart function passed and added on client start.
- Arena: Creates data on user creation.
- ArenaData: addRewards -> findRewards function.
- ArenaData: SQL added.
- ArenaData: Rank up only happens if userRank = upRank.
- ArenaData: setup added.
- ArenaData: createData added.
- ArenaData: viewData added.
- ArenaData: (new) addRewards added.
- ArenaData: getNextMatch added.
- ArenaData: deleteUser added.
- ArenaData: Added setup, viewData, createData, deleteUser, getNextMatch exports.
- rewards.json: Changed coin rewards.
- Boss: Added new boss and attack names.
- Boss: Added defeat text for boss.
- Boss: Changed error text.
- Yuni: mod commands (if used by mod) increment serverlead.
- profile: Changed SQL prepare.
- serverLead: Changed title.

## Version 0.14.2
- Arena: Battle end connects to ArenaData.json
- ArenaData: Preliminary setup; not working.
- Battle: Negative DEF fix; statuses cannot cause negative DEF.
- rewards.json: Added and filled out.

## Version 0.14.1
- Arena: Added ownerID, arenaRank, teamName to json files.
- Arena: teamName is used for field title.
- Arena: End of battle function added, not implemented fully.
- ArenaData: JS file added.
- Battle: Fixed bug with statuses added.
- Status: HP capped for HP raising statuses.
- movelist: Added burn.
- status.json: Added burn.
- Find: Reduced cooldown to 10 seconds.

## Version 0.14.0 (Arena Text, Enemy Phase)
- Arena: Move results are now printed out in fields in embed.
- Arena: Return values are now stored in an array.
- Arena: Enemy phase is added.
- Arena: Enemy phase moves are printed out in fields in embed.
- Battle: Returns necessary object for Arena to print out field.
- Battle: Death check implemented.
- Status: Fixed error with damaging statuses.
- Status: Statuses only extend if the new status is higher.
- movelist.json: Added more adjectives and nouns.
- movelist.json: Removed 5-turn statuses.
- Chess: Changed flip text.
- help: guildlead -> serverlead.
- serverlead: Works with both guildlead and serverlead.
- Admin/Sync: try/catch added so it doesn't crash.
- Admin/Sync: Logs ID's that cause errors.
- Find: Altered text for numbers higher than the number needed to be found.

## Version 0.13.0 (Arena Statuses)
- Arena: Fixed error with name.
- Arena: Statuses added to view.
- Arena/Battle: moveText replaced with returnValue object.
- Battle: Winner check placed, but not implemented.
- Battle: Attack now pushes an array.
- Battle: Ally-moves are now working.
- Battle: Moves can now miss.
- Battle: Damage is affected by statuses.
- Battle: Statuses now affect health.
- Battle: Moves now give statuses if they don't miss.
- Battle: Attacks and AoE statuses skip dead units.
- Battle/Status: Statuses now countdown correctly.
- Status: Added findStatus.
- Status: Added findTypeStatus.
- Status: Implemented addStatus.
- Status: Implemented preTurnStatus.
- Status: Implemented postTurnStatus.
- Status: Implemented hitCheck.
- Status: Implemented power.
- Status: Implemented defense.
- Status: Implemented healthStatus.
- Status: Added healthStatus export.
- movelist.json: Readded Any/All to ally moves.
- movelist.json: Removed payback, fixed dodgy.

### Version 0.12.1
- Find: Reduced cooldown to 30 seconds.
- Mathfind: Switched view with no game error to proper text.
- help: Changed find text to reflect find change.
- status (json): Added.
- Status (js): Has exports.
- Battle: Framework for Status.js started.
- Arena: Various changes to formatting text.

## Version 0.12.0 (Arena Attacking)
- Arena: Reactivated Battle requirement.
- Arena: Switched moves to an array.
- Arena: Player now has strikethrough when dead.
- Arena: Display battle now can change description text.
- Arena: Move framework now setup.
- Battle: Status activated (but not used.)
- Battle: Basic attacking framework setup.
- Battle: Turn properly set and changed.
- Battle: Attacking moves work.
- Battle: Proper targeting.
- Mathfind: Error messages changed.

### Version 0.11.1
- Mathfind: Fixed issue where perfect squares were called prime.
- .gitignore: Updated to remove some folders.
- package-lock.json: Added.

## Version 0.11.0 (Mod Functions)
- start: Added .bat file to start Wenyunibot.
- startRepeat: .bat file that restarts Wenyunibot on crash.
- Arena: Name character limit.
- Arena: Each occassion of @, \\, and * results in a 1-to-1 change to +.
- Yuni: ChannelAllow JSON used.
- Yuni/Mod: Mod commands happen before checking if channel is whitelisted.
- Yuni: Checks if channel is whitelisted (or if there is a whitelist).
- Yuni/Mod: wy!mod help added.
- Yuni/Mod: addChannel added.
- Yuni/Mod: removeChannel added.
- Yuni/Mod: reset added.
- Yuni/Mod: viewChannel added.
- Help: modhelp, reset, addChannel, reset, viewChannel added under Mod.
- Help: Mod header shows requirements.
- Yuni/Mod: Only those with Manage Messages permissions can use Mod commands.
- Yuni: wy!admin crash added; crashes Wenyunibot on command.
- Easteregg: Changed to Data/Easteregg.
- Help: Added argument to help.

## Version 0.10.0 (Arena View, Sillyboss, Guildlead)
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

## Version 0.9.0 (Mathfind Functions)
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

## Version 0.8.0 (Mathfind Basics, Halfhour)
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

## Version 0.7.0 (Chess Channel Separation)
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

## Version 0.6.0 (Reorganization, Auxiliary)
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

### Version 0.5.2 (Chess Save)
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

## Version 0.5.0 (Eggplant Demand)
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

## Version 0.4.0 (Eggplant Base)
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

## Version 0.3.0 (Chess Check + Unusual Moves, Work Format)
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

## Version 0.2.0 (Chess Style, Work)
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

## Version 0.1.0 (Chess View, Waluigi Role, Easteregg first)
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

### Version 0.0.5 (Arena Create)
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

### Version 0.0.3 (Easteregg)
- Added easterEgg command; lists all flavor texts for non-found easter eggs.
- Easter egg now in embed
- Easter egg activations counted
- Footer generated in own function.
- Help command w/ arguments now embed.
- Added random command support w/ 1 or 2 arguments.
- Help text updated.

### Version 0.0.2 (help)
- Added support for wy! prefix
- Add alternate text for Waluigi commands
- Added help command w/o arguments
- Help.json structure altered
- Altered help command w/ arguments to support new Help.json structure
- Fixed off-by-one error with choose command
- Random command (no arguments) added.
- Easter eggs moved to own file.

### Version 0.0.1 (Base)
- Added help command w/ Arguments
- Added choose command
- Added waluigi, Waluigi, WALUIGI command
- Added Yuni command
- Added easter eggs.



