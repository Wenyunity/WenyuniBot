// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- NUMBERS --
const expireTime = 1000 * 60 * 60 * 24 * 7; // 7 days
const rerollTime = 1000 * 60 * 60 * 6; // 6 hours
const day = 1000 * 60 * 60 * 24
const hour = 1000 * 60 * 60
const maxRandom = 8 // Max price is 100 + maxRandom cubed

// -- CONSTANTS --
const emoji = ":eggplant:";
const moduleColor = "#AA10AA"
const descEggplant = JSON.parse(fs.readFileSync('./Eggplant/eggplantDesc.json', 'utf8'));

// -- BUY, SELL, AND THROW -- 

// Buy eggplants
function buy(client, msg, amount) {
	// Get client data
	let data = client.loadData(msg.author);
	
	// isNaN
	if (isNaN(parseInt(amount))) {
		client.basicEmbed("Buy Error", `You cannot buy ${emoji} if you don't use a number.`, msg.channel);
		return;
	}
	
	// If you have eggplants, cannot buy more
	if (data.eggplant) {
		client.basicEmbed("Buy Error", `You cannot buy ${emoji} if you already have some!`, msg.channel);
		return;
	}
	
	// Yeah...
	if (!amount) {
		client.basicEmbed("Buy Error", `You must determine how much ${emoji} to buy!`, msg.channel);
		return;
	}
	
	// Cannot buy 0 or negative eggplants
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Buy Error", `You must buy a positive amount of ${emoji}!`, msg.channel);
		return;
	}
	
	// Price
	let price = Math.floor(amount) * 100;
	
	// If you don't have enough points, cannot buy
	if (data.points < price) {
		client.basicEmbed("Buy Error", `You do not have enough points to buy this many ${emoji}!`, msg.channel);
		return;
	}
	
	// Otherwise, add eggplants
	data.eggplant = Math.floor(amount);
	// Lower points
	data.points = data.points - price;
	// Starting sell price is random between 75 and 95
	data.eggplantSellPrice = 75 + Math.floor(Math.random() * 20);
	// Expire time
	data.eggplantExpire = Date.now() + expireTime;
	// Reroll time
	data.eggplantReroll = Date.now() + rerollTime;
	
	sendEmbed(`You bought ${Math.floor(amount)} ${emoji} for **${price} points**!`, msg, data, client);
	
	// Save
	client.setScore.run(data);
}

// Sell eggplants
function sell(client, msg, amount) {
	let data = client.loadData(msg.author);	
	
	// isNaN
	if (isNaN(parseInt(amount))) {
		client.basicEmbed("Sell Error", `You cannot sell ${emoji} if you don't use a number.`, msg.channel);
		return;
	}
	
	// Eggplants are expired
	if (Date.now() > data.eggplantExpire && data.eggplant) {
		client.basicEmbed("Sell Error", `Your ${emoji} have expired! Please throw them out!`, msg.channel);
		return;
	}
	
	if (!amount) {
		client.basicEmbed("Sell Error", `You must determine how much ${emoji} to sell!`, msg.channel);
		return;
	}
	
	// No eggplants, just give the forecast.
	if (!data.eggplant) {
		client.basicEmbed("Sell Error", `You do not have any ${emoji} right now.`, msg.channel);
		return;
	}
	
	// Must sell a positive amount
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Sell Error", `You must sell a positive amount of ${emoji}!`, msg.channel);
		return;
	}
	
	// Sell protection
	if (Math.floor(amount) > data.eggplant) {
		client.basicEmbed("Sell Error", `You cannot sell more ${emoji} than you have!`, msg.channel);
		return;
	}
	
	// Sold.
	let pointGain = Math.floor(amount) * data.eggplantSellPrice;
	
	client.basicEmbed("Sale Complete!", `${msg.author.tag} sold ${Math.floor(amount)} ${emoji} for **${pointGain} points.**`, msg.channel, moduleColor);
	
	// Check if best sale
	if (pointGain > data.bestEggplant) {
		data.bestEggplant = pointGain;
	}
	
	// Update
	data.eggplant -= Math.floor(amount);
	data.points += pointGain;
	
	// Save
	client.setScore.run(data);
	
	// Reroll if no more eggplants and time is far enough
	if (!data.eggplant) {
		if (data.eggplantExpire - Date.now() < expireTime - rerollTime) {
			randomizeRandom(client, msg);
		}
	}
}

// Throws away expired eggplants.
function eggplantThrow(client, msg) {
	// Get client data
	let data = client.loadData(msg.author);
	
	// No eggplants.
	if (!data.eggplant) {
		client.basicEmbed("Throw Denied", `You do not have any ${emoji} to throw away.`, msg.channel);
		return;
	}
	
	// Eggplants are not expired
	if (Date.now() < data.eggplantExpire) {
		client.basicEmbed("Throw Denied", `Your ${emoji} are not expired! Don't throw them out!`, msg.channel);
		return;
	}
	
	// Throw away eggplants
	client.basicEmbed("Throw Accepted", `${msg.author.tag} threw away ${data.eggplant} ${emoji}.`, msg.channel, moduleColor);
	
	data.eggplant = 0;
	
	// Save
	client.setScore.run(data);
	
	// Randomize 
	randomizeRandom(client, msg);
}

// -- VIEW MARKET --

// View the current market.
function view(client, msg) {
	// Get client data
	let data = client.loadData(msg.author);
	
	// No eggplants, show forecast.
	if (!data.eggplant) {
		// Write Text
		viewForecast(client, msg, data.eggplantRandom, data.eggplantMaxSellPrice);
		return;
	}
	
	// Eggplants are expired
	if (Date.now() > data.eggplantExpire) {
		client.basicEmbed("View Denied", `Your ${emoji} have expired! Please throw them out!`, msg.channel);
		return;
	}
	
	// Send the embed
	sendEmbed(`You have ${data.eggplant} ${emoji}!`, msg, data, client);
}

// Sends embed with given description and data
function sendEmbed(description, msg, data, client) {
	// Gets date objects for exact times
	let rerollDateTime = new Date(data.eggplantReroll);
	let expireDateTime = new Date(data.eggplantExpire);
	
	rerollText = "";
	if (Date.now() > data.eggplantReroll) {
		rerollText = "Now!"
	}
	else {
		rerollText = `${(Math.floor(((data.eggplantReroll - Date.now())/hour)*100)/100)} hours`
	}
	
	// Embed
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle("Eggplant Status for " + msg.author.tag)
		.setAuthor('Wenyunibot')
		.setDescription(description)
		.addField("Sell Price", data.eggplantSellPrice, true)
		.addField("Stability", getStabilityDescription(data.eggplantRandom), true)
		.addField("Demand", getMaxDescription(data.eggplantMaxSellPrice), true)
		.addField("Reroll Time", rerollText, true)
		.addField("Reroll Exact Time", rerollDateTime.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}), true)
		.addBlankField(true)
		.addField("Expire Time", `${(Math.floor(((data.eggplantExpire - Date.now())/day)*100)/100)} days // ${(Math.floor(((data.eggplantExpire - Date.now())/hour)*100)/100)} hours`, true)
		.addField("Expire Exact Time", expireDateTime.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}), true)
		.setFooter(client.footer());
		
	msg.channel.send(eggplantEmbed);
}

// Displays text for current stability and demand.
function viewForecast(client, msg, stability, maxPrice) {
	client.basicEmbed("Market Forecast for "  + msg.author.tag, `The market is **${getStabilityDescription(stability)}** and the demand is **${getMaxDescription(maxPrice)}**.`, msg.channel, moduleColor);
}

// Gets description for stability
function getStabilityDescription(stability) {
	for (const [key, number] of Object.entries(descEggplant.Stability)) {
		if (stability > number) {
			return key;
		}
	}
}

// Gets description for maximum price
function getMaxDescription(price) {
	for (const [key, number] of Object.entries(descEggplant.Price)) {
		if (price > number) {
			return key;
		}
	}
}

// -- RANDOMIZE --

// Reroll.
function reroll(client, msg) {
	let data = client.loadData(msg.author);
	
	// Eggplants are expired
	if (Date.now() > data.eggplantExpire && data.eggplant) {
		client.basicEmbed("Reroll Denied", `Your ${emoji} have expired! Please throw them out!`, msg.channel);
		return;
	}
	
	// Reroll too long
	if (Date.now() < data.eggplantReroll) {
		client.basicEmbed("Reroll Denied", `You must wait **${(Math.floor(((data.eggplantReroll - Date.now())/hour)*100)/100)} hours** to reroll!`, msg.channel);
		return;
	}
	
	// Find which reroll to do.
	if (!data.eggplant) {
		randomizeRandom(client, msg)
	}
	else {
		randomizePrice(client, msg)
	}
}

// Randomizes stability and max price.
function randomizeRandom(client, msg) {
	let data = client.loadData(msg.author);
	
	// New random factor
	data.eggplantRandom = Math.floor(Math.random()*90 + 5)
	// New max price
	data.eggplantMaxSellPrice = Math.ceil((Math.random()*(maxRandom-1)+1)**3 + 100)
	// New reroll time
	data.eggplantReroll = Date.now() + rerollTime;
	
	// Save
	client.setScore.run(data);
	
	// Write Text
	viewForecast(client, msg, data.eggplantRandom, data.eggplantMaxSellPrice);
}

// Randomizes sell price.
function randomizePrice(client, msg) {
	let data = client.loadData(msg.author);
	
	// New price
	let newPrice = Math.ceil(data.eggplantSellPrice * (data.eggplantRandom/100) + Math.random() * data.eggplantMaxSellPrice * (((100-data.eggplantRandom)/100)));
	
	// New reroll time
	data.eggplantReroll = Date.now() + rerollTime;
	
	// Write Text
	client.basicEmbed("Eggplant Random Factor", `The new ${emoji} sell price is **${newPrice} points.** The old price was ${data.eggplantSellPrice} points.`, msg.channel, moduleColor);
	
	// Write new price
	data.eggplantSellPrice = newPrice;
	
	// Save
	client.setScore.run(data);
}

// -- HELP --

// Help.
function helpCommand(client, msg, error) {
	let title = "Eggplant Help"
	if (error) {
		title += " (Due to Invalid Command)"
	}
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(title)
		.setAuthor('Wenyunibot')
		.setDescription("Eggplants are used to get a lot of points. The eggplant market can be very variable. Buy eggplants for 100 points, and then sell them later for a profit!\r\n Be careful, as eggplants only last a week!")
		.addField("Stability", "Stability determines how much the price of eggplants can change in one roll. The more unstable, the more the price can change.")
		.addField("Demand", "Demand determines the maximum possible price of eggplants. The higher the demand, the more points they can sell for.")
		.addField("Reroll", "Rerolling is an important part of maximizing return. If you hold eggplants, rerolling will change the price. If you don't hold eggplants, rerolling will change the market.")
		.addField("Expiration", "If your eggplants expire, you will have to throw them out (for 0 points). They last for exactly 7 days from purchase.")
		.addField("Commands", "**buy** - Buys eggplants if you don't have any.\r\n**sell** - Sells eggplants.\r\n**view** - Views your current market.\r\n**reroll** - Rerolls price or market.\r\n**throw** - Throws away eggplants.")
		.setFooter(client.footer());
		
		msg.channel.send(eggplantEmbed);
}

module.exports = {
    eggplantCommand: function(sql, msg, client) {
		// Here are the arguments
		let args = msg.content.substring(3).split(/ +/);
		// We have the form WY!eggplant mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
            case 'help':
                helpCommand(client, msg, false);
                break;

            case 'sell':
                sell(client, msg, arguments[0]);
                break;
				
			case 'buy':
				buy(client, msg, arguments[0]);
				break;
				
			case 'view':
				view(client, msg);
				break;
				
			case 'reroll':
				reroll(client, msg);
				break;
			
			case 'throw':
				eggplantThrow(client, msg);
				break;
				
			default:
				helpCommand(client, msg, true);
				break;
        }
	}
}