// Implement all statuses here

// Add status, if possible.
function addStatus(statusEffect, target) {
	
}

// Decrement pre-turn statuses
function preTurnStatus(user) {
	
}

// Decrement post-turn statuses
function postTurnStatus(user) {
	
}

// Check for hitrate
function hitCheck(user, enemy) {
	return true;
}

// Power
function power(user) {
	return 0;
}

// Defense
function defense(user) {
	return 0;
}

module.exports = {
	addStatus: addStatus,
	preTurnStatus: preTurnStatus,
	postTurnStatus: postTurnStatus,
	hitCheck: hitCheck,
	power: power,
	defense: defense
}