//const statusEffect = require('./Arena/Status.js');


// This should be able to handle battle flow
// I think

// Does status effects in order
function doStatuses(character) {
	for (x in character.statuses) {
		statusEffect[x](character)
	}
}

// Damages opponents
// Returns the amount of damage given
function damage(opponent, power) {
	// Damage is power - defense
	let damage = power - opponent.defense;
	// Deal no damage
	if (damage < 1) {
		return 0;
	}
	// Deal damage
	opponent.currentHP = opponent.currentHP - damage;
	if (opponent.currentHP < 0) {
		opponent.alive = false;
		return damage;
	}
}

// AoE attacks (all opponents)
function damageAll(damage) {
	message = "";
	for (opponent in opponentTeam) { // This is definitely not proper
		numDamage = damage(opponent, damage);
	}
	return message;
}

// Adds statuses (which will be in a list)
function addStatus(opponent, statEffect, length) {
	opponent.statuses.append([statEffect, length]);
	return;
}

module.exports = {
	
}