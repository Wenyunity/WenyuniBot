// -- REQUIRE -- 
const Discord = require('discord.js');
const fs = require('fs');
const SQLite = require("better-sqlite3");

// -- MODULES --
const arena = require('./Arena/Arena.js');
const chess = require('./Chess/Chess.js');
const eggplant = require('./Eggplant/Eggplant.js');

// -- JSON AND SQL FILES -- 
const auth = require('./auth.json');
const helpText = require('./help.json');
const easterEgg = JSON.parse(fs.readFileSync('./Data/easterEgg.json', 'utf8'));
const botInfo = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const countBoard = JSON.parse(fs.readFileSync('./Data/countBoard.json', 'utf8'));
const sql = new SQLite('./scores.sqlite');

// -- NUMBERS --
let timeOn = 0;
const cost = 1000;
const hour = 1000 * 60 * 60;
const minute = 1000 * 60;
const second = 1000;
const voteDelay = 1000 * 60 * 90; // 90 minutes
const findDelay = 1000 * 60 * 2; // 2 minutes

// -- LISTS AND LINKS --
const sortRows = ["points", "bestWork", "eggplant", "bestEggplant", "countTime", "find"];
const topTenEmoji = [":trophy:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];
const inviteLink = "https://discordapp.com/api/oauth2/authorize?client_id=599476939194892298&permissions=0&scope=bot";
const serverLink = "https://discord.gg/Y2fTCHM";



// -- DISCORD FUNCTIONS --
// Initialize Discord client
const client = new Discord.Client({
});

// Prepare SQL
client.on('ready', function (evt) {
    console.log(`Logged in as ${client.user.tag}!`);

	// Check if the table "points" exists.
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
	
	// Send basic embed
	client.basicEmbed = baseEmbed;
	client.footer = textWenyuniFooter;
	client.loadData = getData;
	
	// Tag
	client.user.setActivity('for wy!help', {type: 'WATCHING'})
	
	timeOn = Date.now();
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
		
		// These messages will only work if it's a guild
		if (msg.guild) {
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
				
				// -- ADMIN FUNCTIONS --
				
				case 'admin':
					if (msg.author.id === auth.admin) {
						let adminCommand = commandArgs[0];
						switch(adminCommand) {
							case 'sync':
								sync(msg);
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
		countBoard.findMin = -1;
		countBoard.findMax = 1000;
		countBoard.findNumber = Math.floor(Math.random() * 1000);
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
	fs.writeFile ("easterEgg.json", JSON.stringify(easterEgg, null, 4), function(err) {
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
	if (!args) {
		data = getData(msg.author);
		data.tag = msg.author.tag;
		
		// Add embed
		let profileEmbed = new Discord.RichEmbed()
			.setColor("#00AAFF")
			.setTitle("Profile of " + msg.author.tag)
			.setAuthor('Wenyunibot')
			.setDescription("Profile")
			.setFooter(textWenyuniFooter())
			.addField("Total Points", data.points, true)
			.addField("Best Work", data.bestWork, true)
			.addField("Eggplants", data.eggplant, true)
			.addField("Counting!", data.countTime, true)
			.addField("Find Successes", data.find, true);
		
		// Print
		msg.channel.send(profileEmbed);
		
		// Save for now
		client.setScore.run(data)
	}
	else {
		const user = sql.prepare(`SELECT * FROM scores WHERE tag LIKE '${args}%' LIMIT 1;`).all();
		let found = false;
		for(const data of user) {
			// Add embed
			let profileEmbed = new Discord.RichEmbed()
				.setColor("#00AAFF")
				.setTitle("Profile of " + data.tag)
				.setAuthor('Wenyunibot')
				.setDescription("Profile")
				.setFooter(textWenyuniFooter())
				.addField("Total Points", data.points)
				.addField("Best Work", data.bestWork)
				.addField("Eggplants", data.eggplant)
				.addField("Counting!", data.countTime, true);
				
			// Print
			msg.channel.send(profileEmbed);
			
			found = true;
		}
		
		// Not found
		if (!found) {
			baseEmbed("Profile Error", `Could not find ${args} in user database.`, msg.channel);
		}
	}
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
		messageDesc += `${topTenEmoji[rank]} - **${client.users.get(data.user).tag}** - ${data[commandArgs[0]]} \r\n`;
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
		.addField("Server Join Time", msg.guild.joinedAt.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}), true);
			
	msg.channel.send(infoEmbed);
}


// -- IMPORTANT LOGIN --

// Log in
client.login(auth.token);