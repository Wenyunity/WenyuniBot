// -- REQUIRES --
const fs = require('fs');

// -- JSON --
const statDict = JSON.parse(fs.readFileSync('./Arena/status.json', 'utf8'));

// Implement all statuses here

// Find a status
function findStatus (statusEffect, item) {
	return statusEffect.name === item;
}

// Find types of statuses
function findTypeStatus (statusEffect, item) {
	return statDict[statusEffect.name].type === item;
}

// Add status, if possible.
function addStatus(statusEffect, lengthEffect, target) {
	let statusIndex = target.statusList.findIndex(statusNo => findStatus(statusNo, statusEffect));

	// Effect is already on
	if (statusIndex != -1) {
		// Extend it if available and the new value is higher
		if (statDict[statusEffect].extendable && lengthEffect > target.statusList[statusIndex].length) {
			target.statusList[statusIndex].length = lengthEffect;
		}
		else { // Don't extend it
			return false;
		}
	}
	else { // Add status
		target.statusList.push({name: statusEffect, length: lengthEffect})
	}
	return true;
}

// Decrement pre-turn statuses
function preTurnStatus(user) {
	
	for (x = 0; x < user.statusList.length; x++) {
		if (statDict[user.statusList[x].name].counts == "before") {
			user.statusList[x].length--;
		}
	}
	
	user.statusList = user.statusList.filter(statusEffect => statusEffect.length > 0);
}

// Decrement post-turn statuses
function postTurnStatus(user) {

	for (x = 0; x < user.statusList.length; x++) {
		if (statDict[user.statusList[x].name].counts == "after") {
			user.statusList[x].length--;
		}
	}

	user.statusList = user.statusList.filter(statusEffect => statusEffect.length > 0);
}

// Check for hitrate
function hitCheck(user, enemy) {
	// Base hit rate
	let hitRate = 1;
	
	// Accuracy check
	for (x = 0; x < user.statusList.length; x++) {
		if (findTypeStatus(user.statusList[x], "accuracy")) {
			hitRate *= statDict[user.statusList[x].name].effect;
		}
	}
	
	// Enemy dodge check
	if (enemy) {
		for (x = 0; x < enemy.statusList.length; x++) {
			if (findTypeStatus(enemy.statusList[x], "dodge")) {
				hitRate *= statDict[enemy.statusList[x].name].effect;
			}
		}
	}
	
	// Hit check
	return Math.random() <= hitRate;
}

// Power
function power(user) {
	// Base power is 0
	basePower = 0;
	
	// Find stuff that changes power
	for (x = 0; x < user.statusList.length; x++) {
		if (findTypeStatus(user.statusList[x], "power")) {
			basePower += statDict[user.statusList[x].name].effect;
		}
	}
	
	// Return base power
	return basePower;
}

// Defense
function defense(user) {
	// Base defense is 0
	baseDefense = 0;

	// Find stuff that changes defense.
	for (x = 0; x < user.statusList.length; x++) {
		if (findTypeStatus(user.statusList[x], "defense")) {
			baseDefense += statDict[user.statusList[x].name].effect;
		}
	}

	return baseDefense;
}

// Poison/Regen
function healthStatus(user) {
	// Find stuff that changes HP
	let damage = 0;
	for (x = 0; x < user.statusList.length; x++) {
		if (findTypeStatus(user.statusList[x], "health")) {
			damage += statDict[user.statusList[x].name].effect;
		}
	}
	user.HP += damage;
	return damage;
}

module.exports = {
	addStatus: addStatus,
	preTurnStatus: preTurnStatus,
	postTurnStatus: postTurnStatus,
	hitCheck: hitCheck,
	power: power,
	defense: defense,
	healthStatus: healthStatus
}