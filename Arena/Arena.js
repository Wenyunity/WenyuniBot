// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
//const Battle = require('./Arena/Battle.js');

// -- CONSTANTS --
const newMove = JSON.parse(fs.readFileSync('./Arena/movelist.json', 'utf8'));
const moduleColor = "#ED9105"

// -- CHARACTER CREATION --

// Creates a character
function create(msg, arguments, client) {
	team = {};
	try { // If a team is loaded, you already have one
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
		client.basicEmbed("You already have a team!", "Use `wy!arena delete` to delete your team.", msg.channel, moduleColor);
		return;
	}
	catch (err) { // No team, time to make one.
		team = {};
	}

	team.character = {};
	if(arguments.length < 2) {
		client.basicEmbed("Create Error", "Please send two numbers indicating the number of magic attack moves! (Between 0 and 5)", msg.channel, moduleColor);
		return;
	}
	
	if (isNaN(parseInt(arguments[0])) || isNaN(parseInt(arguments[0]))) {
		client.basicEmbed("Create Error", "These are not numbers!", msg.channel, moduleColor);
		return;
	}
	
	// Team type
	team.type = "player";
	if(arguments[0] > 5 || arguments[1] > 5) {
		client.basicEmbed("Create Error", "Only up to five magic moves allowed!", msg.channel, moduleColor);
		return;
	}
	else {
		for (m = 0; m < 2; m++) {
			// Create character
			team.character[m] = {};
			// Name
			team.character[m].name = arguments[m+4] || "Char" + m;
			// Defense
			if (arguments[m+2]) {
				if (["0", "1", "2", "3"].includes(arguments[m+2])) {
					team.character[m].DEF = parseInt(arguments[m+2]);
				}
				else {
					client.basicEmbed("Create Error", "Defense must be between 0 and 3.", msg.channel, moduleColor);
					return;
				}
			}
			else {
				team.character[m].DEF = Math.floor(Math.random() * 4)
			}
			team.character[m].HP = 40 - 5 * team.character[m].DEF;
			team.character[m].MaxHP = team.character[m].HP;
			team.character[m].HPGain = 6 - team.character[m].DEF;
			team.character[m].MP = 20;
			team.character[m].MaxMP = team.character[m].MP;
			team.character[m].MPGain = 4;
			team.character[m].slots = 2;
			// Create thing to hold moves
			team.character[m].move = {};
			team.character[m].move.B = createAttackMove(true);
			for (i = 0; i < Math.floor(arguments[m]); i++) {
				team.character[m].move[i] = createAttackMove(false)
			};
			for (i = Math.floor(arguments[m]); i < 5; i++) {
				team.character[m].move[i] = createSupportMove()
			}	
		}
	}
	
	fs.writeFile(`./Arena/Fighter/${msg.author.id}.json`, JSON.stringify(team, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena');
	})
	
	displayPlayerTeam(msg, team);
}

// Creates an attack/basic move
function createAttackMove(isBasic) {
	let nameObject = {name: "", MP: 0, team: "enemy"}
	
	// Name
	nameObject["name"] = newMove["name"]["adjective"][Math.floor(Math.random() * (newMove["name"]["adjective"].length))] +
		" " + newMove["name"]["noun"][Math.floor(Math.random() * (newMove["name"]["noun"].length))];
	
	// Base power
	nameObject["power"] = newMove["base"];
	
	let moveType = "attack"
	if (isBasic) {
		moveType = "basic"
	}
	
	// Target selection
	let targetType = newMove[moveType]["target"][Math.floor(Math.random() * newMove[moveType]["target"].length)]
	nameObject["target"] = targetType[0];
	nameObject["power"] = nameObject["power"] + targetType[1];
	
	// Effect selection
	if (Math.random() > 0.5) {
		// Get effect and length
		let effectType = newMove[moveType]["effect"][Math.floor(Math.random() * newMove[moveType]["effect"].length)]
		let lengthType = newMove[moveType]["length"][Math.floor(Math.random() * newMove[moveType]["length"].length)]
		
		// Set effect and length and calculate power difference
		nameObject["effect"] = effectType[0];		
		nameObject["length"] = lengthType[0];
		nameObject["power"] = nameObject["power"] + Math.ceil(lengthType[1] * effectType[1]);
	}
	else { // No effect (50% chance)
		nameObject["effect"] = "None";
		nameObject["length"] = 0;
	}
	
	// MP adjust
	if (nameObject["power"] < 0) {
		nameObject["MP"] = -1 * nameObject["power"];
		nameObject["power"] = 0;
	}
	
	// Add more power
	if (!isBasic) {
		let powerAdd = Math.floor(Math.random() * 9) + 1
		nameObject["MP"] = powerAdd + nameObject["MP"];
		nameObject["power"] = nameObject["power"] + powerAdd;
	}
	
	return nameObject;
}

// Creates a support move
function createSupportMove() {
	let nameObject = {name: "", MP: 0, team: "ally", target: "", effect: "", length: 0};
	
	// Name
	nameObject.name = newMove["name"]["adjective"][Math.floor(Math.random() * (newMove["name"]["adjective"].length))] +
		" " + newMove["name"]["noun"][Math.floor(Math.random() * (newMove["name"]["noun"].length))];
	
	// Move type
	let moveType = "support"
	
	// Target selection
	let targetType = newMove[moveType]["target"][Math.floor(Math.random() * newMove[moveType]["target"].length)]
	nameObject.target = targetType[0];
	nameObject.MP = nameObject.MP + targetType[1];
	
	// Effect selection
	// Get effect and length
	let effectType = newMove[moveType]["effect"][Math.floor(Math.random() * newMove[moveType]["effect"].length)]
	let lengthType = newMove[moveType]["length"][Math.floor(Math.random() * newMove[moveType]["length"].length)]
	
	// Set effect and length and calculate power difference
	nameObject.effect = effectType[0];		
	nameObject.length = lengthType[0];
	nameObject.MP = nameObject.MP + Math.ceil(lengthType[1] * effectType[1]);
	
	return nameObject;
}

// -- CHARACTER DISPLAY --

// Creates a character
function displayPlayerTeam(msg, team) {
	const teamEmbed = new Discord.RichEmbed()
			.setColor(moduleColor)
			.setTitle('Team Name')
			.setAuthor('Wenyunibot')
			.setDescription(`Team Owner: ${msg.author.tag}`)
			.addField("Summary Statistics", displayTeamStats(team.character));
	for (z = 0; z < 2; z++) {
		teamEmbed.addField(team.character[z].name +"'s Moves", displayMoves(team.character[z].move));
	}
	teamEmbed.addField("Growth Statistics", displayGrowthStats(team.character));
	
	msg.channel.send(teamEmbed);
}

// Displays stats for team
function displayTeamStats(character) {
	
	message = "";
	for (c = 0; c < 2; c++) {
		message += displayPlayerStats(character[c]) + "\r\n";
	}
	
	return message;
}

function displayPlayerStats(player) {
	return `**${player.name}** -|- ${player.HP}/${player.MaxHP} HP, ${player.MP}/${player.MaxMP} MP, ${player.DEF} DEF`;
}

function displayGrowthStats(character) {
	message = "";
	for (c = 0; c < 2; c++) {
		message += `\r\n**${character[c].name}** -|- +${character[c].HPGain} HP/level, +${character[c].MPGain} MP/level`;
	}
	
	return message;
}

// Displays character moves
function displayMoves(moveset) {
	// Basic move
	message = "";
	message += "**B** -|- " + readMove(moveset.B)
	for (i = 0; i < 5; i++) {
		message += `\r\n**${i}** -|- ` + readMove(moveset[i]);
	}
	return message;
}

// Turns object move into readable text
function readMove(move) {
	message = "";
	
	// Move Name
	message = message + "*" + move["name"] + "* - **(" + move["MP"] + " MP)**: ";
	// Attack Move
	if (move["team"] == "enemy") {
		// Power
		message = message + "Deals " + move["power"] + " damage to ";
		// All
		if (move["target"] == "all") {
			message += "all enemies."
		} // Any
		else if (move["target"] == "any") {
			message += "any enemy."
		} // Front
		else {
			message += "the front enemy."
		}
		// Effect
		if (move["length"]) {
			message += " Gives the " + move["effect"] + " status for ";
			if (move["length"] == 1) {
				message += "1 turn.";
			}
			else {
				message += move["length"] + " turns."
			}
		}
	}
	else {
		message += " Gives " 
		if (move["target"] == "all") {
			message += "all allies"
		} // Any
		else if (move["target"] == "any") {
			message += "any ally"
		} // Front
		else {
			message += "self"
		}
		message += " the " + move["effect"] + " status for ";
		if (move["length"] == 1) {
			message += "1 turn.";
		}
		else {
			message += move["length"] + " turns.";
		}
	}
	
	return message;
}

// -- VIEW TEAM --
function viewTeam(msg, client) {
	// Try to load team
	team = {};
	try {
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	displayPlayerTeam(msg, team);
}

// -- START A FIGHT --

function startFight(msg, client, arguments) {
	// So how do we do this...
	// Try to load team
	team = {};
	try {
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a team for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	enemy = JSON.parse(fs.readFileSync(`./Arena/Enemy/20.json`, 'utf8'));
	
	battle = {front: team, back: enemy, turn: "back", moves: [0, 0, 0, 0, 0]};
	
	fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena battle');
	})
}

function displayBattle(msg, client) {
	// So how do we do this...
	// Try to load battle
	battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No team found!", `Could not find a battle for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
}

function fight() {
    console.log('in admin 2 command');
    // your command code here
}

module.exports = {
    arenaCommand: function(sql, msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!arena mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
            case 'help':
                msg.channel.send("WALUIGI")
                break;

            case 'create':
                create(msg, arguments, client);
                break;
				
			case 'view':
				viewTeam(msg, client);
				break;
				
			case 'startFight':
				startFight(msg, client, arguments);
				break;
			
			default:
				client.basicEmbed("Not Done", "Not Done Yet", msg.channel, moduleColor);
				break;
        }
	}
}