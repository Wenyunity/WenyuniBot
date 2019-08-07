// -- REQUIRE -- 
const Discord = require('discord.js');
const fs = require('fs');
const SQLite = require("better-sqlite3");

// -- MODULES --
const arena = require('./Arena/Arena.js');
const chess = require('./Chess/Chess.js');
const eggplant = require('./Eggplant/Eggplant.js');
const mathfind = require('./Mathfind/Mathfind.js');
const sillyboss = require('./Boss/Boss.js');

// -- JSON AND SQL FILES -- 
const auth = require('./auth.json');
const helpText = require('./help.json');
const easterEgg = JSON.parse(fs.readFileSync('./Data/easterEgg.json', 'utf8'));
const botInfo = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const countBoard = JSON.parse(fs.readFileSync('./Data/countBoard.json', 'utf8'));
const channelAllow = JSON.parse(fs.readFileSync('./Data/channels.json', 'utf8'));
const sql = new SQLite('./scores.sqlite');
const guildSQL = new SQLite('./guild.sqlite');

// -- NUMBERS --
let timeOn = 0;
const cost = 1000;
const hour = 1000 * 60 * 60;
const minute = 1000 * 60;
const second = 1000;
const voteDelay = 1000 * 60 * 90; // 90 minutes
const findDelay = 1000 * 30; // 30 seconds
const findBounds = {min: 0, max: 9999} // Bounds for find


// -- LISTS AND LINKS --
const sortRows = ["points", "bestWork", "eggplant", "bestEggplant", "countTime", "find"];
const topTenEmoji = [":trophy:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];
const inviteLink = "https://discordapp.com/api/oauth2/authorize?client_id=599476939194892298&permissions=0&scope=bot";
const serverLink = "https://discord.gg/Y2fTCHM";
let halfHourDelay = {};

// -- DISCORD FUNCTIONS --
// Initialize Discord client
const client = new Discord.Client({
});

// Prepare SQL
client.on('ready', function (evt) {
    console.log(`Logged in as ${client.user.tag}!`);

	// Check if the table exists
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		sql.prepare("CREATE TABLE scores (user TEXT PRIMARY KEY, tag TEXT, points INTEGER, work INTEGER, "
		+ "bestWork INTEGER, eggplant INTEGER, eggplantExpire INTEGER, eggplantRandom INTEGER, "
		+ "eggplantSellPrice INTEGER, eggplantMaxSellPrice INTEGER, eggplantReroll INTEGER, bestEggplant INTEGER, "
		+ "countTime INTEGER, voteTime INTEGER, findTime INTEGER, find INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (user);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}

    // And then we have two prepared statements to get and set the score data.
    client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ?");
    client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (user, tag, points, work, bestWork, eggplant,"
		+ " eggplantExpire, eggplantRandom, eggplantSellPrice, eggplantMaxSellPrice, eggplantReroll, bestEggplant, countTime, voteTime, findTime, find)" 
		+ " VALUES (@user, @tag, @points, @work, @bestWork, @eggplant, @eggplantExpire, @eggplantRandom, @eggplantSellPrice,"
		+ " @eggplantMaxSellPrice, @eggplantReroll, @bestEggplant, @countTime, @voteTime, @findTime, @find);");
	//client.addColumn = sql.prepare("ALTER TABLE scores ADD name = ? type = ? NOT NULL DEFAULT default = ?")
	
	// Prepare guild table
	guildTable();
	
	// Send basic embed
	client.basicEmbed = baseEmbed;
	// Footer
	client.footer = textWenyuniFooter;
	// Load data
	client.loadData = getData;
	
	// Tag
	client.user.setActivity('for wy!help', {type: 'WATCHING'})
	
	// Time bot started
	timeOn = Date.now();
	
	// Get list of guilds
	guildList = client.guilds.array().sort();
	
	console.log("\x1b[41mServer List\x1b[0m");
	guildList.forEach(list => console.log(list.name));
	
	// For Modules
	mathfind.onStart;
	
	console.log(`${client.user.tag} is ready!`);
});

// Upon getting a message
client.on('message', msg => {
    // It will listen for messages that will start with `WY!`
	// Except for those that came from the client itself.
    if ((msg.content.substring(0, 3) == 'WY!' || msg.content.substring(0, 3) == 'wy!') && !msg.author.bot) {
		
		// Get rid of WY!
		let args = msg.content.substring(3).split(' ');
		// Find the main command
		let mainCommand = args[0];
		// And then the rest of the arguments
		let commandArgs = args.slice(1);
		
		// -- MOD FUNCTIONS --
		
		// Placed before channel check so that mods can access Wenyunibot.
		if (msg.guild && mainCommand === "mod") {
			if (msg.member.hasPermission("MANAGE_MESSAGES", false, true, true)) {
				let modCommand = commandArgs[0];
				switch(modCommand) {
					case 'addchannel':
						addChannel(commandArgs[1], msg);
						break;
					
					case 'removechannel':
						removeChannel(commandArgs[1], msg);
						break;
						
					case 'viewchannel':
						viewChannel(msg);
						break;
						
					case 'help':
					case 'modhelp':
						helpCommand(commandArgs.slice(1), msg);
						break;
					
					case 'reset':
						resetChannels(msg);
						break;
					
					default:
						baseEmbed("Mod Command Failed", "Could not find the mod command!", msg.channel); // Couldn't find command
						break;
				}
			}
			else {
				if (channelAllow[msg.guild.id]) { // Don't want to spam
					if (!channelAllow[msg.guild.id].includes(msg.channel.id)) { // If not approved channel, end
						return;
					}
				}
				baseEmbed("Access Denied", "You do not have the ability to manage messages!", msg.channel); // Message only if approved
			}
			return;
		}
		
		// -- CHANNEL CHECK --
		// For all non-mod functions, returns if not in a good channel.
		if (msg.guild) {
			if (channelAllow[msg.guild.id]) {
				if (!channelAllow[msg.guild.id].includes(msg.channel.id)) { // If not approved channel, end
					return;
				}
			}
		}
		
		// These messages will only work if it's a guild
		if (msg.guild) {
			
			// Increment number of posts in guild
			countGuildPost(msg.guild);
			
			switch(mainCommand) {
				
				// -- MODULE COMMANDS --
				// These have their own separate JS files.
				
				case 'arena':
					arena.arenaCommand(sql, msg, client);
					break;
				case 'eggplant':
					eggplant.eggplantCommand(sql, msg, client);
					break;
				case 'chess':
					chess.chessCommand(msg, client);
					break;
				case 'mathfind':
					mathfind.mathfindCommand(msg, client);
					break;
				case 'sillyboss':
					sillyboss.bossCommand(msg, client);
					break;
					
				// -- BASIC FUNCTIONS --
				
				case 'choose':
					chooseCommand(commandArgs, msg)
					break;
				case 'random':
					randomCommand(commandArgs, msg)
					break;
				case 'vote':
					voteCommand(commandArgs, msg)
					break;
				case 'find':
					findCommand(commandArgs, msg)
					break;
				case 'halfhour':
					halfHourCommand(msg)
					break;
					
				
				// -- FUN FUNCTIONS --
				
				case 'waluigi':
				case 'Waluigi':
				case 'WALUIGI':
					waluigiCommand(msg);
					break;
				case 'easteregg':
					easterEggCommand(commandArgs, msg)
					break;
					
				// -- ECONOMY FUNCTIONS --
				
				case 'work':
					workCommand(commandArgs, msg)
					break;
				case 'leaderboard':
					leaderBoardCommand(commandArgs, msg)
					break;
				case 'profile':
					profileCommand(msg, commandArgs[0])
					break;
				case 'count':
					countCommand(msg)
					break;
					
				// -- AUXILIARY FUNCTIONS -- 
				
				case 'help':
					helpCommand(commandArgs, msg)
					break;
				case 'invite':
					inviteCommand(msg)
					break;
				case 'bothomeserver':
					botHomeServerCommand(msg);
					break;
				case 'botinfo':
					botInfoCommand(msg);
					break;
				case 'guildlead':
					guildLeaderboard(msg);
					break;
				
				// -- ADMIN FUNCTIONS --
				
				case 'admin':
					if (msg.author.id === auth.admin) {
						let adminCommand = commandArgs[0];
						switch(adminCommand) {
							case 'sync':
								sync(msg);
								break;
							case 'delete':
								deleteRow(msg);
								break;
							case 'crash':
								// Doesn't crash it
								baseEmbed("Crashing now!", "Why, Wenyunity?", msg.channel);
								// Does crash it
								baseEmbed("Crash", "Crash", msg);
								break;
							default:
								baseEmbed("Admin Command Failed", "Wenyunity, what are you doing?", msg.channel);
								break;
						}
					}
					else {
						baseEmbed("Access Denied", "You are not Wenyunity! Access denied!", msg.channel);
					}
					break;
					
				// -- NOT FOUND --
				
				default:
					// Easter Egg Support
					if (mainCommand in easterEgg) {
						easterEggFound(mainCommand, msg)
					}
					else {
						baseEmbed("Input Failed", "Sorry!\r\nCommand not found. Try WY!help for a list of commands.", msg.channel);
					}
					break;
			}
		}
     }
});

// -- ADMIN FUNCTIONS --

// Syncs all user ids to current tag
function sync(msg) {
	const sync = sql.prepare(`SELECT user, tag FROM scores`).all();
		
		for(const data of sync) {
			let save = sql.prepare(`UPDATE scores SET tag = '${client.users.get(data.user).tag}' WHERE user = ${data.user};`);
			save.run(data);
		}
		baseEmbed("Sync", "Complete!", msg.channel)
}

// Deletes user
function deleteRow(msg) {
	sql.prepare(`DELETE FROM scores WHERE user = ${msg.author.id}`).run();
	
	baseEmbed("Delete", `Deleted ${msg.author.tag}'s data!`, msg.channel)
}

// -- OWNER PERMISSIONS --

// Sets channel
function addChannel(channel, msg) {
	let addChannel = channel || msg.channel.id;
	try {
		if (msg.guild.channels.has(addChannel)) { // Find Channel
			if (channelAllow[msg.guild.id]) { // Already has channels
				if (channelAllow[msg.guild.id].includes(addChannel)) { // Channel already is in list
					baseEmbed("Add Channel Fail", "Channel is already on whitelist!", msg.channel);
					return;
				}
				else { // Add channel to list
					channelAllow[msg.guild.id].push(addChannel);
				}
			}
			else { // Create list with channel
				channelAllow[msg.guild.id] = [addChannel];
			}

		}
		else {
			baseEmbed("Add Channel Fail", "Could not find the channel!", msg.channel);
			return;
		}
		// Save
		fs.writeFile ("Data/channels.json", JSON.stringify(channelAllow, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to channelAllow.json');
		})
		baseEmbed("Add Channel Success", `Successfully added ${msg.guild.channels.get(addChannel).name} to Wenyunibot's whitelist!`, msg.channel);
	}
	catch {
		baseEmbed("Add Channel Fail", "Something went bad.", msg.channel);
	}
}

// Resets channel list
function resetChannels(msg) {
	if (channelAllow[msg.guild.id]) {
		delete channelAllow[msg.guild.id];
	}
	else {
		baseEmbed("No Channels Set", "There were no channels to reset!", msg.channel)
		return;
	}
	// Save
	fs.writeFile ("Data/channels.json", JSON.stringify(channelAllow, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to channelAllow.json');
	})
	baseEmbed("Reset success!", "Successfully reset all responses! Wenyunibot should work in all channels.", msg.channel);
}

// Views channel list
function viewChannel(msg) {
	deleteMsg = [];
	if (channelAllow[msg.guild.id]) {
		let message = "";
		channelAllow[msg.guild.id].forEach(function(item) {
			try { 
				message += msg.guild.channels.get(item).name + "\r\n";
			} 
			catch { 
				deleteMsg.push(item);
			}
		});
		if (message) {
			baseEmbed("Channel List", message, msg.channel, "#00FF00");
		}
		else {
			baseEmbed("Channel List", "Wenyunibot seems to be available in all channels.", msg.channel, "#00FF00");
		}
	}
	else {
		baseEmbed("Channel List", "Wenyunibot seems to be available in all channels.", msg.channel, "#00FF00");
		return;
	}
	
	if (!(deleteMsg === [])) {
		// Delete channels that could not be found
		channelAllow[msg.guild.id] = channelAllow[msg.guild.id].filter(item => !deleteMsg.includes(item))
		
		if (channelAllow[msg.guild.id].length === 0) {
			delete channelAllow[msg.guild.id];
		}
		
		// Save
		fs.writeFile ("Data/channels.json", JSON.stringify(channelAllow, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to channelAllow.json');
		})
	}
}

// Removes channel
function removeChannel(channel, msg) {
	let addChannel = channel || msg.channel.id;
	try {
		if (msg.guild.channels.has(addChannel)) { // Find Channel
			if (channelAllow[msg.guild.id]) { // If there is a whitelist
				let index = channelAllow[msg.guild.id].indexOf(addChannel);
				if (index != -1) { // Channel is in list, so remove it
					channelAllow[msg.guild.id].splice(index, 1);
					
					if (channelAllow[msg.guild.id].length === 0) { // No more channels, allow all
						delete channelAllow[msg.guild.id];
						baseEmbed("Whitelist Removed", "All channels were removed, so Wenyunibot is available in all channels.", msg.channel, "#FFFFFF");
					}
				}
				else { // Channel not on whitelist
					baseEmbed("Remove Channel Fail", "The channel was not on the whitelist!", msg.channel);
					return;
				}
			}
			else { // Couldn't find whitelist
				baseEmbed("No Whitelist", "There is no whitelist to remove channels from!", msg.channel);
				return;
			}

		}
		else {
			baseEmbed("Add Channel Fail", "Could not find the channel!", msg.channel);
			return;
		}
		// Save
		fs.writeFile ("Data/channels.json", JSON.stringify(channelAllow, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to channelAllow.json');
		})
		baseEmbed("Remove Channel Success", `Successfully removed ${msg.guild.channels.get(addChannel).name} from Wenyunibot's whitelist!`, msg.channel);
	}
	catch {
		baseEmbed("Remove Channel Fail", "Something went bad.", msg.channel);
	}
}

// -- CLIENT FUNCTIONS -- 

// Passes a simple embed.
function baseEmbed(title, description, channel, color) {
	let embedColor = color || "#888888";
	
	let basicEmbed = new Discord.RichEmbed()
		.setColor(embedColor)
		.setTitle(title)
		.setAuthor('Wenyunibot')
		.setDescription(description)
		.setFooter(textWenyuniFooter())
		
	channel.send(basicEmbed);
}

// Passes a simple embed.
function textWenyuniFooter() {
	let currentDate = new Date()
	return 'Wenyunibot thinks today is ' + currentDate.getFullYear() + '/' + (currentDate.getMonth()+1)
		+ '/' + currentDate.getDate()
}

// Gets user data
function getData(user) {
	let data = client.getScore.get(user.id);
	
	if (!data) {
		data = createData(user);
	}
	return data;
}

// Creates user data
function createData(user) {
	data = {
		user: user.id,
		tag: user.tag,
		points: 0,
		work: 0,
		bestWork: 0,
		eggplant: 0,
		eggplantExpire: 0,
		eggplantRandom: 50,
		eggplantSellPrice: 0,
		eggplantMaxSellPrice: 250,
		eggplantReroll: 0,
		bestEggplant: 0,
		countTime: 0,
		voteTime: 0,
		findTime: 0,
		find: 0
	}
	
	// Save data
	client.setScore.run(data);
	
	// Return data
	return data;
}

// Get data for a guild
function getGuildData(guild) {
	let data = guildSQL.prepare(`SELECT * FROM guild WHERE id = ${guild.id}`).get();
	
	if (!data) {
		data = createGuildData(guild);
	}
	return data;
}

// Create guild data
function createGuildData(guild) {
	data = {
		id: guild.id,
		name: guild.name,
		posts: 0
	}
	
	return data;
}

// Create a guild table
function guildTable() {
	// Check if the table exists
    const table = guildSQL.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'guild';").get();
    if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		guildSQL.prepare("CREATE TABLE guild (id TEXT PRIMARY KEY, name TEXT, posts INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		guildSQL.prepare("CREATE UNIQUE INDEX idx_scores_id ON guild (id);").run();
		guildSQL.pragma("synchronous = 1");
		guildSQL.pragma("journal_mode = wal");
	}
}

// Save guild data
function saveGuildData(data) {
	guildSQL.prepare("INSERT OR REPLACE INTO guild (id, name, posts) VALUES (@id, @name, @posts);").run(data);
}

// Count a post
function countGuildPost(guild) {
	data = getGuildData(guild);
	data.posts++;
	saveGuildData(data);
}

// -- BASIC FUNCTIONS -- 

// Chooses between choices
function chooseCommand(commandArgs, msg) {
	let chooseText = "";
	for (i = 0; i < commandArgs.length; i++) {
			chooseText += commandArgs[i] + " ";
	}
	let chooseArgs = chooseText.split(', ');
	
	if (chooseArgs.length == 0) {
		baseEmbed("Wenyunibot (doesn't) choose", "What is there for me to choose?", msg.channel, "#992299")
	}
	else if (chooseArgs.length == 1) {
		baseEmbed("Wenyunibot (doesn't) choose", "It appears I have no choice. I choose " + chooseArgs[0], msg.channel, "#992299")
	}
	else {
		randomNumber = Math.floor(Math.random() * (chooseArgs.length))
		baseEmbed("Wenyunibot Chooses", "I choose " + chooseArgs[randomNumber], msg.channel, "#992299")
	}
}

// Chooses a random number
function randomCommand(commandArgs, msg) {
	// Two numbers: Minimum and maximum
	if (commandArgs.length == 2) {
		let randomNum = Math.random() * (Number(commandArgs[1]) - Number(commandArgs[0])) + Number(commandArgs[0])
		if (isNaN(randomNum)) {
			baseEmbed("Input Error", "At least one of your inputs wasn't a number...", msg.channel)
		}
		else {
			baseEmbed("Random Number", "Here's a number between " + commandArgs[0] + " and " + commandArgs[1] + ": " + randomNum, msg.channel, "#DECADE")
		}
	}
	// One number: Assumed the other is 0
	else if (commandArgs.length == 1) {
		let randomNum = Math.random() * Number(commandArgs[0])
		if (isNaN(randomNum)) {
			baseEmbed("Input Error", "That doesn't look like a number to me...", msg.channel)
		}
		else {
			baseEmbed("Random Number", "Here's a number between 0 and " + commandArgs[0] + ": " + randomNum, msg.channel, "#DECADE")
		}
	}
	// No arguments: Between 0 and 1
	else {
		baseEmbed("Random Number", "Here's a number between 0 and 1: " + Math.random(), msg.channel, "#DECADE")
	}
}

// Counts up or down
function voteCommand(commandArgs, msg) {
	data = sql.prepare(`SELECT user, voteTime FROM scores WHERE user = ${msg.author.id}`).get();
	if (!data) {
		data = createData(msg.author)
	}
	
	// Return current number
	if (commandArgs.length === 0) {
		baseEmbed("Current Vote", `The vote is at ${countBoard.vote} right now.`, msg.channel, "#9944EE");
		return;
	} 
	
	// Can't vote
	if (Date.now() < data.voteTime) {
		baseEmbed("Vote Not Accepted", `You need to wait **${(Math.floor(((data.voteTime - Date.now())/minute)*100)/100)} minutes** to vote again!`, msg.channel, "#9944EE");
		return;
	} // Vote Up
	else if (["yes", "up", "upvote", "plus"].includes(commandArgs[0].toLowerCase())) {
		countBoard.vote = countBoard.vote + 1;
		baseEmbed("You voted up!", `The vote is at ${countBoard.vote} right now.`, msg.channel, "#9944EE");
	} // Vote Down
	else if (["no", "down", "downvote", "minus"].includes(commandArgs[0].toLowerCase())) {
		countBoard.vote = countBoard.vote - 1;
		baseEmbed("You voted down!", `The vote is at ${countBoard.vote} right now.`, msg.channel, "#9944EE");
	} // Error
	else {
		baseEmbed("Vote Error!", "Please vote `up` or `down` to choose.", msg.channel, "#9944EE");
		return;
	}
	
	// Save user data
	sql.prepare(`UPDATE scores SET voteTime = ${(Date.now() + voteDelay)} WHERE user = ${data.user};`).run();
	
	// Save vote
	fs.writeFile ("./Data/countBoard.json", JSON.stringify(countBoard, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to countBoard.json');
	})
}

// Find the number
function findCommand(commandArgs, msg) {
	// Get or create data
	data = sql.prepare(`SELECT user, findTime, find FROM scores WHERE user = ${msg.author.id}`).get();
	if (!data) {
		data = createData(msg.author)
	}

	// Return places to find
	if (commandArgs.length === 0) {
		baseEmbed("Find Bounds", `The lower bound is at **${countBoard.findMin}**, and the upper bound at **${countBoard.findMax}**.`, msg.channel, "#AA1177");
		return;
	} 
	
	// Can't find
	if (Date.now() < data.findTime) {
		baseEmbed("Find Not Accepted", `You need to wait **${(Math.floor(((data.findTime - Date.now())/second)*100)/100)} seconds** to find again!`, msg.channel, "#AA1177");
		return;
	}
	
	// Number
	let suggestedNumber = parseInt(commandArgs[0]);
	// Error handling
	if (isNaN(suggestedNumber)) {
		baseEmbed("Find Failed", "You did not put in a number!", msg.channel, "#AA1177");
		return;
	} // It's outside of the legal bounds
	else if (suggestedNumber < findBounds.min || suggestedNumber > findBounds.max) {
		baseEmbed("Find Failed", `Please put in a number between **${findBounds.min}** and **${findBounds.max}**`, msg.channel, "#AA1177");
		return;
	} // It's lower
	else if (suggestedNumber < countBoard.findNumber) {
		countBoard.findMin = suggestedNumber;
		baseEmbed("Your Number is Lower", `You've updated the **lower bound** to ${countBoard.findMin}.`, msg.channel, "#AA1177");
	} // It's higher
	else if (suggestedNumber > countBoard.findNumber) {
		countBoard.findMax = suggestedNumber;
		baseEmbed("Your Number is Higher", `You've updated the **higher bound** to ${countBoard.findMax}.`, msg.channel, "#AA1177");
	} // Exactly
	else {
		data.find = data.find + 1;
		countBoard.findMin = findBounds.min - 1;
		countBoard.findMax = findBounds.max + 1;
		countBoard.findNumber = Math.floor(Math.random() * (findBounds.max - findBounds.min) + findBounds.min);
		sql.prepare(`UPDATE scores SET find = ${data.find} WHERE user = ${data.user};`).run();
		baseEmbed("You found the right number!", `You've now found the number **${data.find} times**!`, msg.channel, "#AA1177");
	}
	
	// Save user data
	sql.prepare(`UPDATE scores SET findTime = ${(Date.now() + findDelay)} WHERE user = ${data.user};`).run();
	
	// Save vote
	fs.writeFile ("./Data/countBoard.json", JSON.stringify(countBoard, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to countBoard.json');
	})
}
	
// Sends a message every half-hour.
function halfHourCommand(msg) {
	// Get channel name
	let commandChannelName = `${msg.guild.id}CH${msg.channel.id}`;
	// Start a timer
	if (!halfHourDelay[commandChannelName]) {
		// Setup timer
		halfHourDelay[commandChannelName] = setInterval(function() {halfHourMessage(msg.channel);}, hour/2);
		baseEmbed("Half Hour Notice", "Your timer has started. Use **wy!halfhour** to stop messages.", msg.channel, "#1B7740");
	}
	else { // Stop
		clearInterval(halfHourDelay[commandChannelName]);
		halfHourDelay[commandChannelName] = null;
		baseEmbed("Half Hour Ended", "Your timer has ended. No more messages will be sent.", msg.channel, "#1B7740");
	}
}

// Helper function for halfHourCommand. Actually sends the message.
function halfHourMessage(channel) {
	baseEmbed("Half Hour Notice", "It has been half an hour since the last message. Use **wy!halfhour** to stop messages.", channel, "#1B7740");
}

// -- FUN FUNCTIONS --

// Waluigi
function waluigiCommand(msg) {
	// Look for WALUIGI and Luigi roles
	const guildMember = msg.member;
	const waluigiAdd = msg.guild.roles.find(role => role.name === "WALUIGI");
	const luigiAdd = msg.guild.roles.find(role => role.name === "Luigi");
	
	// Pick between Waluigi and Luigi
	let luigiRoll = Math.random()
	
	// Luigi
	if (luigiRoll < 0.5) {
		if (luigiAdd) {
			guildMember.addRole(luigiAdd);
		}
		if (waluigiAdd) {
			guildMember.removeRole(waluigiAdd);
		}
		baseEmbed("WALUIGI Failure", 'Oh yeah! Luigi time!', msg.channel, "#23e844");
	} // Waluigi
	else {
		if (waluigiAdd) {
			guildMember.addRole(waluigiAdd);
		}
		if (luigiAdd) {
			guildMember.removeRole(luigiAdd);
		}
		baseEmbed("WALUIGI", "WALUIGI", msg.channel, "#A100D0");
	};
}

// All about easter eggs
function easterEggFound(mainCommand, msg) {
	// Create text
	let easterEggEmbed = new Discord.RichEmbed()
		.setColor(easterEgg[mainCommand]["color"])
		.setTitle(mainCommand)
		.setAuthor('Wenyunibot')
		.setDescription(easterEgg[mainCommand]['text'])
		.setFooter(textWenyuniFooter());
	
	// Determine if first find
	if (easterEgg[mainCommand]["num"] == 0) {
		// Tell user it's first find
		easterEggEmbed.addField("First find!", "Congrats!")
		// Get tag of user
		easterEgg[mainCommand]["found"] = msg.author.tag
	}
	else { // Not first find
		// How many times used
		easterEggEmbed.addField("Easter Egg!", "Number of times used prior: " + easterEgg[mainCommand]["num"])
		// Who found it first
		easterEggEmbed.addField("First Found By", easterEgg[mainCommand]["found"])
	}
	
	// Send message
	msg.channel.send(easterEggEmbed);
	
	// Write the number down
	easterEgg[mainCommand]["num"] = easterEgg[mainCommand]["num"] + 1;
	fs.writeFile (".Data/easterEgg.json", JSON.stringify(easterEgg, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to easterEgg.json');
	})
}

// Lists all unfound easter egg text
function easterEggCommand(commandArgs, msg) {
	// Default
	if (commandArgs.length == 0) {
		message = ""
		for (x in easterEgg) {
			if (easterEgg[x]["num"] == 0) {
				message += "\r\n" + easterEgg[x]["text"]
			}
		}
		// If there's none
		if (message == "") {
			message += "\r\n" + "None at this time!"
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#567890")
			.setTitle("Unfound Easter Egg Quotes")
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}	
	else if (commandArgs[0].toLowerCase() == "found") { // Found
		let message = ""
		let count = []
		for (x in easterEgg) {
			if (easterEgg[x]["num"] != 0) {
				count.push([x, easterEgg[x]["num"]])
			}
		}
		// If there's none
		if (count == []) {
			message += "\r\n" + "None at this time!"
		}
		else {
			// Sort all items
			count.sort(function (a, b){return b[1]-a[1]});
			let rank = 0
			let lastSeen = -1
			
			// And then rank them.
			for (x = 0; x < count.length; x++) {
				if (lastSeen != count[x][1]) {
					rank += 1;
					lastSeen = count[x][1]
				}
				message += "R" + rank + " - " + count[x][0] + ": " + count[x][1] + "\r\n";
			}
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#987654")
			.setTitle("Found Easter Eggs")
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
	else if (commandArgs[0].toLowerCase() == "first") { // Found
		let message = ""
		let counter = []
		// For each easter egg
		for (egg in easterEgg) {
			// Check if iser already found one
			if (easterEgg[egg]["num"] != 0) { // If they did
				found = false;
				for (x = 0; x < counter.length; x++) { // Add
					if (easterEgg[egg]["found"] === counter[x][0]) {
						counter[x][1] += 1;
						found = true;
					}
				}
				if (!found) { // Push user onto list
					counter.push([easterEgg[egg]["found"], 1])
				}
			}
		}
		// If there's none
		if (counter == {}) {
			message += "\r\n" + "None at this time!"
		}
		else {
			// Sort all items
			counter.sort(function (a, b){return b[1]-a[1]});
			let rank = 0
			let lastSeen = -1
			
			// And then rank them.
			for (x = 0; x < counter.length; x++) {
				if (lastSeen != counter[x][1]) {
					rank += 1;
					lastSeen = counter[x][1]
				}
				message += "R" + rank + " - " + counter[x][0] + ": " + counter[x][1] + "\r\n";
			}
		}
		
		// Create text
		let easterEggEmbed = new Discord.RichEmbed()
			.setColor("#24e857")
			.setTitle("Easter Egg Finders")
			.setAuthor('Wenyunibot')
			.setDescription(message)
			.setFooter(textWenyuniFooter());
		
		// Send message
		msg.channel.send(easterEggEmbed);
	}
	else {
		if (commandArgs[0] in easterEgg) {
			easterEggFound(commandArgs[0], msg)
		}
		else {
			baseEmbed("Easter Egg Failure", "Invalid easter egg! All easter eggs are written without spaces and use PascalCase.", msg.channel);
		}
	}
}

// -- ECONOMY FUNCTIONS --

// Work for your money
function workCommand(args, msg) {
	data = getData(msg.author);
	
	if (Date.now() > data.work) { // Get points
		// Gain money
		pointGain = Math.floor(Math.random() * 1200) + 600;
		// Gain points
		data.points += pointGain;
		// Set date
		data.work = Date.now() + pointGain * 1000 * 60 * 1;
		let nextWork = new Date(data.work);
		
		let workEmbed = new Discord.RichEmbed()
			.setColor("#982489")
			.setTitle("Work Results for " + msg.author.tag)
			.setAuthor('Wenyunibot')
			.setDescription("You got **" + pointGain + "** points!")
			.setFooter(textWenyuniFooter())
			.addField("Total Points", data.points)
			.addField("Work Cooldown Time", "About " + Math.floor((pointGain/60)*100)/100 + " hours.")
			.addField("Exact Cooldown", nextWork.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}));
		
		if (pointGain > data.bestWork) {
			workEmbed.addField("New best work session!", `Previous best was ${data.bestWork} points.`);
			data.bestWork = pointGain;
		}
		
		// You got money!
		msg.channel.send(workEmbed);
		
		// Save
		client.setScore.run(data);
	}
	else {
		let workDate = new Date(data.work);
		// Give detailed time
		if (args[0] === "detail") {
			baseEmbed("Work Timer", "You need to wait until **" + workDate.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}) + "** to work for more points.", msg.channel);
		}
		else { // Give approximation
			let hours = (data.work - Date.now()) / (60 * 60 * 1000) 
			hours = Math.round(hours * 100)/100;
			// Singular special message
			if (hours === 1) {
				baseEmbed("Work Timer", "You can work again in one hour!", msg.channel);
			} // Normal message
			else {
				baseEmbed("Work Timer", "You need to wait about **" + hours + " hours** to work for more points.", msg.channel);
			}
		}
	}
}

// Profile
function profileCommand(msg, args) {
	if (!args) { // Not finding a user
		data = getData(msg.author);
		data.tag = msg.author.tag;
		
		// Print
		msg.channel.send(profileEmbed(data));
		
		// Save for now
		client.setScore.run(data)
	}
	else { // Finding a user
		const user = sql.prepare(`SELECT * FROM scores WHERE tag LIKE '${args}%' LIMIT 1;`).get();
		
		if (user) {
			msg.channel.send(profileEmbed(user));
		} // Not found
		else {
			baseEmbed("Profile Error", `Could not find ${args} in user database.`, msg.channel);
		}
	}
}

// Helper function for profile
function profileEmbed(data) {
	let profileEmbed = new Discord.RichEmbed()
		.setColor("#00AAFF")
		.setTitle("Profile of " + data.tag)
		.setAuthor('Wenyunibot')
		.setDescription("Profile")
		.setFooter(textWenyuniFooter())
		.addField("Total Points", data.points, true)
		.addField("Best Work", data.bestWork, true)
		.addField("Eggplants", data.eggplant, true)
		.addField("Counting!", data.countTime, true)
		.addField("Find Successes", data.find, true);
	
	return profileEmbed;
}

// Leaderboard
function leaderBoardCommand(commandArgs, msg) {
	
	if (commandArgs.length === 0) {
		baseEmbed("Leaderboard Error", "Did not pass an argument for leaderboard!", msg.channel);
		return;
	}
	
	// Easter egg leaderboard commands
	if (["first", "found"].includes(commandArgs[0].toLowerCase())) {
		easterEggCommand(commandArgs, msg);
		return;
	}
	// Otherwise
	if (!sortRows.includes(commandArgs[0])) {
		baseEmbed("Leaderboard Error", "Could not find the row you wanted to sort by!", msg.channel);
		return;
	}
	
	const top10 = sql.prepare(`SELECT * FROM scores ORDER BY ${commandArgs[0]} DESC LIMIT 10;`).all();

	let messageDesc = "";
	let rank = 0;
	for(const data of top10) {
		try {
			messageDesc += `${topTenEmoji[rank]} - **${client.users.get(data.user).tag}** - ${data[commandArgs[0]]} \r\n`;
		}
		catch {
			messageDesc += `${topTenEmoji[rank]} - **ID ${data.user}** - ${data[commandArgs[0]]} \r\n`;
		}
		rank++;
	}
	
	var x = sql.prepare("SELECT count(*) AS userCount FROM scores");
	
	messageDesc += `Total users: ${x.all()[0].userCount}`;
	
    // Now shake it and show it! (as a nice embed, too!)
	const leaderboardEmbed = new Discord.RichEmbed()
		.setTitle(`Top 10 ${commandArgs[0]}`)
		.setAuthor("Wenyunibot")
		.setDescription(messageDesc)
		.setColor("#101010")
		.setFooter(textWenyuniFooter());


	
	return msg.channel.send(leaderboardEmbed);
}

// Counts up. Costs money.
function countCommand(msg) {
	const data = getData(msg.author);
	let price = cost * (1+data.countTime)
	
	if (data.points < price) {
		baseEmbed("Count Error", `You do not have **${price} points** to spend to count!`, msg.channel);
		return;
	}
	else {
		countBoard.number += 1;
		countBoard.counters[countBoard.number] = msg.author.id;
		data.points -= price;
		data.countTime++;
		baseEmbed("Count Successful", `You spent **${price} points** to increase the count to **${countBoard.number}**!\r\nYou now have **${data.points} points.**`, msg.channel, "#ACECAB")
	}
	
	// Save data
	client.setScore.run(data);
	
	// Save other data
	fs.writeFile ("./Data/countBoard.json", JSON.stringify(countBoard, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to countUp.json');
	})
}

// -- AUXILIARY FUNCTIONS --

// For help
function helpCommand(commandArgs, msg) {
	// Replaced by a dictionary
	if (commandArgs.length > 0) {
		foundCommand = false;
		for (x in helpText) {
			if (commandArgs[0] in helpText[x]) {
				const helpEmbed = new Discord.RichEmbed()
				.setColor('#559955')
				.setTitle(commandArgs[0])
				.setAuthor('Wenyunibot')
				.setDescription(helpText[x][commandArgs[0]]["desc"])
				.setFooter(textWenyuniFooter());
				
				// Add argument message
				argsmessage = "";
				for (key in helpText[x][commandArgs[0]]["args"]) {
					argsmessage += "**" + key + "** - " + helpText[x][commandArgs[0]]["args"][key] + "\r\n"
				}
				if (argsmessage) {
					helpEmbed.addField("Command Arguments", argsmessage);
				}
				
				// Send
				msg.channel.send(helpEmbed);
				foundCommand = true;
			}
		}
		if (!foundCommand) { // Failed to find
		baseEmbed("Help Error", "Could not find the command. Try wy!help for a list of commands.", msg.channel)
		}
	}
	// Generic command if no arguments given
	else {
		// Create list of all commands
		const helpEmbed = new Discord.RichEmbed()
			.setColor('#DECADE')
			.setTitle('Wenyunibot Help')
			.setAuthor('Wenyunibot')
			.setDescription("If you want to learn more about a command, try `wy!help command` to learn more about it.")
			.setFooter(textWenyuniFooter())
			for (x in helpText) {
				desc = ""
				for (y in helpText[x]) {
					desc = desc + " - " + y
				}
				desc = desc + " - "
				helpEmbed.addField(x, desc)
			};
		msg.channel.send(helpEmbed);
	}
}

// Invite
function inviteCommand(msg) {
	baseEmbed("Invite Wenyunibot to your server!", inviteLink, msg.channel, "#FACADE")
}

// Bot home server
function botHomeServerCommand(msg) {
	baseEmbed("Check out Wenyunibot's home server!", serverLink, msg.channel, "#FACADE")
}

// Bot info
function botInfoCommand(msg) {
	let infoEmbed = new Discord.RichEmbed()
		.setColor("#0000FF")
		.setTitle("Wenyunibot Info")
		.setAuthor('Wenyunibot')
		.setDescription(botInfo.description)
		.setFooter(textWenyuniFooter())
		.addField("Version", botInfo.version, true)
		.addField("Bot Creator", botInfo.author, true)
		.addField("Current Runtime", `${(Math.floor(((Date.now() - timeOn)/hour)*100)/100)} hours`, true)
		.addField("Creation Time", client.user.createdAt.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}), true)
		.addField("Server Join Time", msg.guild.joinedAt.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}), true)
		.addField("Number of Wenyunibot Calls", getGuildData(msg.guild).posts, true);
		
	msg.channel.send(infoEmbed);
}

// Guild posts
function guildLeaderboard(msg) {
	const top10 = guildSQL.prepare(`SELECT * FROM guild ORDER BY posts DESC LIMIT 10;`).all();

	let messageDesc = "";
	let rank = 0;
	for(const data of top10) {
		try {
			messageDesc += `${topTenEmoji[rank]} - **${client.guilds.get(data.id).name}** - ${data.posts} \r\n`;
		}
		catch {
			messageDesc += `${topTenEmoji[rank]} - **ID ${data.id}** - ${data.posts} \r\n`;
		}
		rank++;
	}
	
	var x = guildSQL.prepare("SELECT count(*) AS userCount FROM guild");
	
	messageDesc += `Total guilds: ${x.all()[0].userCount}`;
	
    // Now shake it and show it! (as a nice embed, too!)
	const leaderboardEmbed = new Discord.RichEmbed()
		.setTitle(`Top 10 Guilds`)
		.setAuthor("Wenyunibot")
		.setDescription(messageDesc)
		.setColor("#101010")
		.setFooter(textWenyuniFooter());
	
	return msg.channel.send(leaderboardEmbed);
}

// -- IMPORTANT LOGIN --

// Log in
client.login(auth.token);