const Discord = require('discord.js');
const auth = require('./auth.json');
const helpText = require('./help.json');
const fs = require('fs');
const easterEgg = JSON.parse(fs.readFileSync('./easterEgg.json', 'utf8'));
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
const arena = require('./Arena/Arena.js');
const chess = require('./Chess/Chess.js');
const eggplant = require('./Eggplant/Eggplant.js');
const sortRows = ["points", "bestWork", "eggplant", "bestEggplant"];
const topTenEmoji = [":trophy:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"]
const inviteLink = "https://discordapp.com/api/oauth2/authorize?client_id=599476939194892298&permissions=0&scope=bot"

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
		sql.prepare("CREATE TABLE scores (user TEXT PRIMARY KEY, tag TEXT, points INTEGER, work INTEGER, bestWork INTEGER, eggplant INTEGER, eggplantExpire INTEGER, eggplantRandom INTEGER, eggplantSellPrice INTEGER, eggplantMaxSellPrice INTEGER, eggplantReroll INTEGER, bestEggplant INTEGER);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (user);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}

    // And then we have two prepared statements to get and set the score data.
    client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ?");
    client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (user, tag, points, work, bestWork, eggplant, eggplantExpire, eggplantRandom, eggplantSellPrice, eggplantMaxSellPrice, eggplantReroll, bestEggplant) VALUES (@user, @tag, @points, @work, @bestWork, @eggplant, @eggplantExpire, @eggplantRandom, @eggplantSellPrice, @eggplantMaxSellPrice, @eggplantReroll, @bestEggplant);");
	//client.addColumn = sql.prepare("ALTER TABLE scores ADD name = ? type = ? NOT NULL DEFAULT default = ?")
	
	// Send basic embed
	client.basicEmbed = baseEmbed;
	client.footer = textWenyuniFooter;
	client.loadData = getData;
	
	// Tag
	client.user.setActivity('for wy!help', {type: 'WATCHING'})
});

// ADMIN command
// Syncs all user ids to current tag
function sync(msg) {
	const sync = sql.prepare(`SELECT user, tag FROM scores`).all();
		
		for(const data of sync) {
			let save = sql.prepare(`UPDATE scores SET tag = '${client.users.get(data.user).tag}' WHERE user = ${data.user};`);
			save.run(data);
		}
		baseEmbed("Sync", "Complete!", msg.channel)
}


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
				case 'arena': // Arena module
					arena.arenaCommand(sql, msg, client);
					break;
				case 'eggplant': // Eggplant module
					eggplant.eggplantCommand(sql, msg, client);
					break;
				case 'chess': // Chess module
					chess.chessCommand(msg, client);
					break;
				// Waluigi is not an easter egg.
				case 'waluigi':
				case 'Waluigi':
				case 'WALUIGI':
					waluigiCommand(msg);
					break;
				// Main commands
				case 'help':
					helpCommand(commandArgs, msg)
					break;
				case 'choose':
					chooseCommand(commandArgs, msg)
					break;
				case 'invite':
					inviteCommand(msg)
					break;
				case 'random':
					randomCommand(commandArgs, msg)
					break;
				case 'easteregg':
					easterEggCommand(commandArgs, msg)
					break;
				case 'work':
					workCommand(commandArgs, msg)
					break;
				case 'leaderboard':
					leaderBoardCommand(commandArgs, msg)
					break;
				case 'profile':
					profileCommand(msg, commandArgs[0])
					break;
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
				// Not found
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
			.addField("Total Points", data.points)
			.addField("Best Work", data.bestWork)
			.addField("Eggplants", data.eggplant);
		
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
				.addField("Eggplants", data.eggplant);
				
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

// Gets user data
function getData(user) {
	let data = client.getScore.get(user.id);
	
	if (!data) {
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
			bestEggplant: 0
		}
	}
	return data;
}

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

// Invite Wenyunibot
function inviteCommand(msg) {
	baseEmbed("Invite Wenyunibot to your server!", inviteLink, msg.channel, "#FACADE");
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

// Footer
function textWenyuniFooter() {
	let currentDate = new Date()
	return 'Wenyunibot thinks today is ' + currentDate.getFullYear() + '/' + (currentDate.getMonth()+1)
		+ '/' + currentDate.getDate()
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
			//.setThumbnail('https://i.imgur.com/wSTFkRM.png')

			//.addBlankField()
			//.addField('Inline field title', 'Some value here', true)
			//.addField('Inline field title', 'Some value here', true)
			//.addField('Inline field title', 'Some value here', true)
			//.setImage('https://i.imgur.com/wSTFkRM.png')
			//.setTimestamp()
		msg.channel.send(helpEmbed);
	}
}

// Chooses between choices
function chooseCommand(commandArgs, msg) {
	let chooseText = "";
	for (i = 0; i < commandArgs.length; i++) {
			chooseText += commandArgs[i] + " ";
	}
	let chooseArgs = chooseText.split(', ');
	
	if (chooseArgs.length == 0) {
		baseEmbed("Wenyubibot (doesn't) choose", "What is there for me to choose?", msg.channel, "#992299")
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

// Log in
client.login(auth.token);