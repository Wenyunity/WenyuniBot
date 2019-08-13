/**
	This section of code is mainly written by someone else, with Wenyunity's guidance.
*/

// -- REQUIRE -- 
const Discord = require('discord.js');

// -- CONSTANTS --
const moduleColor = "#123456";

// -- LISTS --
const bossNames = ["Stomper", "Walushell", "Waludisk", "WaluKaratebot", "WaluSpinner", "Bigfist"]
const moveNames = ["Stomp", "Spin-kick", "Cut", "Combo", "Punch-kick", "Punching Spin"]
const attackNames = ["Tackle", "Quick Attack", "Triplepunch-Jump", "Dig-Attack", "Blitzkrieg (german)", "Pu-pu-pu-PUNCH!!"]
let currentBoss = {};

// Generates a boss
function newBossCommand(msg, client) {
	let boss = {};
	// Name
	let nameSelect = Math.floor(Math.random() * (bossNames.length))
	boss.name = bossNames[nameSelect];
	// Moves
	let moveSelect = Math.floor(Math.random() * (moveNames.length))
	boss.move = moveNames[moveSelect];
	// HP (50 and 500)
	boss.hp = Math.floor(Math.random() * 10 + 1) * 50;
	
	client.basicEmbed("Not very serious boss", `Your boss is named ${boss.name}, has the move ${boss.move}, and has ${boss.hp} HP.`, msg.channel, "#123456");
	
	currentBoss = boss;
}

// Attacks the boss
function attackBossCommand(msg, client) {
	let defeat = false;
	if (!currentBoss.hp) {
		client.basicEmbed("Boss Error", "There is no boss to attack!", msg.channel, moduleColor);
		return;
	}
	var attack = {};
	// Name
	let attacknameSelect = Math.floor(Math.random() * (attackNames.length))
	attack.name = attackNames[attacknameSelect]
	// Effectiveness
	attack.effective = Math.floor(Math.random() * 10 + 1) * 50;
	currentBoss.hp = currentBoss.hp - attack.effective
	client.basicEmbed("Attack the boss", `You attacked the boss with the move ${attack.name}. It dealt **${attack.effective} Damage!**\r\nThe boss now has **${currentBoss.hp} HP**.`, msg.channel, moduleColor);
	if (currentBoss.hp <= 0) {
		defeat = true;
		client.basicEmbed("VICTORY!", `You defeated the boss! Reward: lotsa spaghet`, msg.channel, moduleColor);
	}
}

module.exports = {
    bossCommand: function(msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!chess mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
			case 'new':
				newBossCommand(msg, client);
				break;
			
			case 'attack':
				attackBossCommand(msg, client);
				break;
				
			default:
				client.basicEmbed("Atc h os", `tak tebs`, msg.channel, moduleColor);
		}
	}
}