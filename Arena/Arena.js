// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');
const Battle = require('./Battle.js');
const Data = require('./ArenaData.js');

// -- CONSTANTS --
const newMove = JSON.parse(fs.readFileSync('./Arena/movelist.json', 'utf8'));
const moduleColor = "#ED9105"
const nameLimit = 40;

// -- CHARACTER CREATION --

// Sanitizes names. For now, replaces them all with "+".
function sanitize(name) {
	return name.replace(/(@|\\|\*)/g, "+").substring(0, nameLimit);
}

// Creates a character
function create(msg, client, arguments) {
	team = {};
	try { // If a team is loaded, you already have one
		team = JSON.parse(fs.readFileSync(`./Arena/Fighter/${msg.author.id}.json`, 'utf8'));
		client.basicEmbed("You already have a team!", "Use `wy!arena delete` to delete your team.", msg.channel, moduleColor);
		return;
	}
	catch (err) { // No team, time to make one.
		team = {};
	}

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
	team.teamName = `${msg.author.tag}'s Team ` + Math.floor(Math.random() * 100);
	team.ownerID = `${msg.author.id}`;
	team.arenaRank = false;
	if(arguments[0] > 5 || arguments[1] > 5) {
		client.basicEmbed("Create Error", "Only up to five magic moves allowed!", msg.channel, moduleColor);
		return;
	}
	else {
		team.characterList = [];
		for (m = 0; m < 2; m++) {
			// Create character
			character = {};
			// Name
			if (arguments.length > m+3) {
				character.name = sanitize(arguments[m+4]);
			}
			else {
				character.name = "Character " + m
			}
			// Defense
			if (arguments[m+2]) {
				if (["0", "1", "2", "3"].includes(arguments[m+2])) {
					character.DEF = parseInt(arguments[m+2]);
				}
				else {
					client.basicEmbed("Create Error", "Defense must be between 0 and 3.", msg.channel, moduleColor);
					return;
				}
			}
			else {
				character.DEF = Math.floor(Math.random() * 4)
			}
			character.HP = 40 - 5 * character.DEF;
			character.MaxHP = character.HP;
			character.HPGain = 6 - character.DEF;
			character.MP = 20;
			character.MaxMP = character.MP;
			character.MPGain = 4;
			character.slots = 2;
			// Statuses
			character.statusList = [];
			// Create thing to hold moves
			character.move = [];
			character.move.push(createAttackMove(true));
			for (i = 0; i < Math.floor(arguments[m]); i++) {
				character.move.push(createAttackMove(false))
			};
			for (i = Math.floor(arguments[m]); i < 5; i++) {
				character.move.push(createSupportMove())
			}
			team.characterList.push(character);
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

// Displays a character.
function displayPlayerTeam(msg, team) {
	const teamEmbed = new Discord.RichEmbed()
			.setColor(moduleColor)
			.setTitle('Team Name')
			.setAuthor('Wenyunibot')
			.setDescription(`Team Owner: ${msg.author.tag}`)
			.addField("Summary Statistics", displayTeamStats(team.characterList));
	for (z = 0; z < 2; z++) {
		teamEmbed.addField(team.characterList[z].name +"'s Moves", displayMoves(team.characterList[z].move));
	}
	teamEmbed.addField("Growth Statistics", displayGrowthStats(team.characterList));
	
	msg.channel.send(teamEmbed);
}

// Displays stats for team
function displayTeamStats(characterList) {
	
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += "`[" + c + "]` - " + displayPlayerStats(characterList[c]) + "\r\n";
	}
	return message;
}

// Displays a player's stats
function displayPlayerStats(player) {
	let cross = "";
	let statusText = "";
	if (player.HP <= 0) {
		cross = "~~";
	}
	if (player.statusList.length > 0) {
		statusText = getStatusText(player.statusList);
	}
	return cross + `**${player.name}** - ${player.HP}/${player.MaxHP} HP, ${player.MP}/${player.MaxMP} MP, ${player.DEF} DEF ${statusText}` + cross;
}

// Displays a player's growth
function displayGrowthStats(characterList) {
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += `\r\n**${characterList[c].name}** - +${characterList[c].HPGain} HP/level, +${characterList[c].MPGain} MP/level`;
	}
	return message;
}

// Displays character moves
function displayMoves(moveset) {
	// Basic move
	message = "";
	for (i = 0; i < moveset.length; i++) {
		message += "\r\n`[" + i + "]` " + readMove(moveset[i]);
	}
	return message;
}

// Turns object move into readable text
function readMove(move) {
	message = "";
	
	// Move Name
	message = message + "- **" + move["name"] + " (" + move["MP"] + " MP)**: ";
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

// Views a team.
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

// -- ENEMY TEAM --

// Displays enemy stats
function displayEnemyTeamStats(characterList) {
	message = "";
	for (c = 0; c < characterList.length; c++) {
		message += "`[" + c + "]` - " + displayEnemyStats(characterList[c]) + "\r\n";
	}
	return message;
}

// Helper function
function displayEnemyStats(enemy) {
	let cross = "";
	let statusText = "";
	if (enemy.HP <= 0) {
		cross = "~~";
	};
	if (enemy.statusList.length > 0) {
		statusText = getStatusText(enemy.statusList);
	}
	message = cross + `**${enemy.name}** - ${enemy.HP}/${enemy.MaxHP} HP, ${enemy.ATK} ATK, ${enemy.DEF} DEF ` + statusText + cross;
	return message;
}

// -- DISPLAY --

// Display status text
function getStatusText(statusList) {
	let statusText = "*( - ";
	
	// Add status names
	for (x = 0; x < statusList.length; x++) {
		statusText += `${(statusList[x].name.charAt(0).toUpperCase() + statusList[x].name.substring(1))}! [${statusList[x].length}] - `;
	}
	
	// Add status text
	statusText += " )*";
	return statusText;
}

// Display current battle state.
function displayBattle(msg, client, battle, moveList) {
	// Setup Embed
	const battleEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle('Battle!')
		.setAuthor('Wenyunibot')
		.setDescription(`${msg.author.tag}'s current battle.`)
	
	// Add moves
	if (moveList) {
		moveList.forEach(item => addMoveField(item, battleEmbed));
	}
	
	// Front team
	if (battle.front.type === "player") {
		battleEmbed.addField(`${battle.front.teamName}` || "Front Team", displayTeamStats(battle.front.characterList));
	}
	else {
		battleEmbed.addField(`${battle.front.teamName}` || "Front Team", displayEnemyTeamStats(battle.front.characterList));
	}
	
	// Back Team
	if (battle.back.type === "player") {
		battleEmbed.addField(`${battle.back.teamName}` || "Back Team", displayTeamStats(battle.back.characterList));
	}
	else {
		battleEmbed.addField(`${battle.back.teamName}` || "Back Team", displayEnemyTeamStats(battle.back.characterList));
	}
	
	return battleEmbed;
}

// For view function.
function viewBattle(msg, client, battle) {
	// Check if battle exists.
	battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No battle found!", `Could not find a battle for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Send battle text.
	msg.channel.send(displayBattle(msg, client, battle));
}

// Adding fields
function addMoveField(move, battleEmbed) {
	var titleText = `**${move.moveUser}** used **${move.moveName}**!`;
	var descriptionText = "";
	
	var descriptionTextArray = move.effectArray.filter(item => item.name).map(item => getArrayText(item));
	descriptionText = descriptionTextArray.join("\r\n");
	
	if (descriptionText === "") {
		descriptionText = "It didn't do anything...";
	}
	if (move.statusDamage) {
		descriptionText += `\r\n${move.moveUser}'s HP changed by ${move.statusDamage} due to statuses.`;
	}
	
	battleEmbed.addField(titleText, descriptionText);
}

// Gets text for a move
function getArrayText(effectItem) {
	// Name
	var effectText = `${effectItem.name} `;
	// Damage
	if (effectItem.damage) {
		// Miss
		if (effectItem.damage === "miss") {
			return `It missed ${effectItem.name}!`;
		}
		else { // Hit
			effectText += `took ${effectItem.damage} damage`
			// Status
			if (effectItem.statusText) {
				effectText += ` and now has the ${effectItem.statusText} effect for ${effectItem.statusLength} turn`
				if (effectItem.statusLength !== 1) {
					effectText += "s";
				}
			}
		}
	}
	// Else (Just Status)
	else if (effectItem.statusLength) {
		effectText += `got the ${effectItem.statusText} effect for ${effectItem.statusLength} turn`;
		if (effectItem.statusLength !== 1) {
			effectText += "s";
		}
	}
	else {
		effectText += "wasn't affected by the move?";
	}
	effectText += "!"
	return effectText;
}

// -- FIGHTING --

// Start a fight
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
	Battle.switchTurn(battle);
	msg.channel.send(displayBattle(msg, client, battle));
	
	fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena battle');
	})
}

// Attacks
function attackMenu(msg, client, arguments) {
	// For now we'll leave it like this
    let battle = {};
	try {
		battle = JSON.parse(fs.readFileSync(`./Arena/Battle/BA${msg.author.id}.json`, 'utf8'));
	}
	catch (err) {
		client.basicEmbed("No battle found!", `Could not find a battle for ${msg.author.tag}`, msg.channel, moduleColor);
		return;
	}
	
	// Arguments
	if (!arguments || arguments.length < 2) {
		client.basicEmbed("Not Enough Arguments", "Could not find arguments", msg.channel, moduleColor);
		return;
	}
	
	if (isNaN(...arguments)) {
		client.basicEmbed("Arguments are not numbers", "Cannot input numbers", msg.channel, moduleColor);
	}
	
	let returnValue = [];
	try {
		returnValue.push(Battle.useMove(battle, arguments[0], arguments[1], arguments[2]));
	}
	catch (err) {
		client.basicEmbed("Move Error", err, msg.channel, moduleColor);
		return;
	}
	console.log(returnValue);
	console.log(returnValue[0].effectArray);
	
	// Send
	msg.channel.send(displayBattle(msg, client, battle, returnValue));
	
	// Winner found, end battle.
	if (returnValue[0].winner) {
		battleEnd(msg, client, battle, returnValue[0].winner);
	}
	// Player turn over, do enemy turn.
	else if (battle[battle.turn].type === "enemy") {
		enemyPhase(msg, client, battle);
	}
	else { // Save battle.
		fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
			if (err) throw err;
			console.log('completed writing to arena battle');
		});
	}

}

// Enemy phase
function enemyPhase(msg, client, battle) {
	// This turn
	var currentTurn = battle.turn;
	// Number of allies
	var numAlly = battle[battle.turn].characterList.length;
	var numEnemies = 0;
	// Number of enemies
	if (currentTurn === "back") {
		numEnemies = battle.front.characterList.length;
	}
	else {
		numEnemies = battle.back.characterList.length;
	}
	var moveText = [];
	var isWinner = false;
	// While this is true
	while (currentTurn === battle.turn && isWinner == false) {
		
		// Grab character who can move
		var nextChar = battle.moves.findIndex(x => x > 0);
		// Grab a random move
		var nextMove = Math.floor(Math.random() * battle[battle.turn].characterList[nextChar].move.length);
		
		// Grab target
		var target = 0;
		if (battle[battle.turn].characterList[nextChar].move.team === "ally") {
			var target = Math.floor(Math.random() * numAlly);
		}
		else {
			var target = Math.floor(Math.random() * numEnemies);
		}
		
		// Attack!
		try {
			moveText.push(Battle.useMove(battle, nextChar, nextMove, target));
			isWinner = moveText[moveText.length - 1].winner;
		}
		catch (error) {
			console.log(error);
		}
	}
	
	// Switched turn, save
	console.log(moveText);

	// Save
	fs.writeFile(`./Arena/Battle/BA${msg.author.id}.json`, JSON.stringify(battle, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to arena battle');
	})
	
	// Send
	msg.channel.send(displayBattle(msg, client, battle, moveText));
	
	// End battle, have winner.
	if (moveText[moveText.length-1].winner) {
		battleEnd(msg, client, battle, moveText[moveText.length-1].winner);
	}
}

// End battle
function battleEnd(msg, client, battle, winner) {
	Data.matchEnd(battle, winner);
	msg.channel.send("The battle is over!");
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
                create(msg, client, arguments);
                break;
				
			case 'team':
				viewTeam(msg, client);
				break;
			
			case 'view':
				viewBattle(msg, client);
				break;
			
			case 'battle':
				startFight(msg, client, arguments);
				break;
				
			case 'move':
				attackMenu(msg, client, arguments);
				break;
			
			default:
				client.basicEmbed("Not Done", "Not Done Yet", msg.channel, moduleColor);
				break;
        }
	}
}