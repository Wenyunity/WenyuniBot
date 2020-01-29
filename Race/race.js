// If true, a race is currently active.
let raceActive = false;
let nameLimit = 50;

// Adds a racer.
function addRacer(client, msg, arguments) {
	
}

// Sanitizes names. For now, replaces them all with "+".
function sanitize(name) {
	return name.replace(/(@|\\|\*)/g, "+").substring(0, nameLimit);
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

// Switches contestants at random
function swapTeam(client, channel) {
	client.basicEmbed("Half Hour Notice", "It has been half an hour since the last message. Use **wy!halfhour** to stop messages.", channel, "#1B7740");
}

module.exports = {
    eggplantCommand: function(sql, msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(/ +/);
		// We have the form WY!eggplant mainCommand [arguments]
		if (!args[1]) {
			return helpCommand(client, msg, true);
		}
		let mainCommand = args[1].toLowerCase();
		let arguments = args.slice(2);
		
		if (["race"].includes(mainCommand) && args[2]) {
			mainCommand = args[2].toLowerCase();
			arguments = args.slice(3);
		}
				
        switch(mainCommand) {
            case 'help':
                helpCommand(client, msg, false);
                break;

			default:
				helpCommand(client, msg, true);
				break;
        }
	}
}