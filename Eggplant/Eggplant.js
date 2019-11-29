// -- REQUIRES --
const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const fs = require('fs');

// -- NUMBERS --
const expireTime = 1000 * 60 * 60 * 24 * 7; // 7 days
const rerollTime = 1000 * 60 * 60 * 6; // 6 hours
const day = 1000 * 60 * 60 * 24
const hour = 1000 * 60 * 60
const maxRandom = 30 // Max price is 100 + maxRandom squared
const minRandom = 7 // Min price is 100 + minRandom squared
const countMultiplier = 5; // How much each count allows more eggplants to be bought
const baseSafe = 50; // How many eggplants can a user with zero eggplants buy without penalty
const punishMultiplier = 30; // Multiplier for square penalty

// -- CONSTANTS --
const defaultEmoji = ":eggplant:";
const moduleColor = "#80CCAA"
const descEggplant = JSON.parse(fs.readFileSync('./Eggplant/eggplantDesc.json', 'utf8'));

// -- BUY, SELL, AND THROW -- 

// Buy eggplants
function buy(client, msg, amount) {
	// Get client data
	let data = client.loadData(msg.author);
	let emoji = data.marketEmoji || defaultEmoji;
	
	// Yeah...
	if (!amount) {
		client.basicEmbed("Buy Error", `You must determine how much ${emoji} to buy!`, msg.channel);
		return;
	}
	
	// Buy maximum without penalty
	if (amount === "max") {
		buy(client, msg, Math.min(data.countTime * countMultiplier + baseSafe, Math.floor(data.points / 100)));
		return;
	}
	
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
	

	
	// Cannot buy 0 or negative eggplants
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Buy Error", `You must buy a positive amount of ${emoji}!`, msg.channel);
		return;
	}
	
	// Amount check
	if (amount > 10000) {
		client.basicEmbed("Check Error", `You cannot buy more than 10000 ${emoji} at a time!`, msg.channel);
		return;
	}
	
	// Price
	let price = getBuyPrice(data, amount);
	
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
	let emoji = data.marketEmoji || defaultEmoji;
	

	// Eggplants are expired
	if (Date.now() > data.eggplantExpire && data.eggplant) {
		client.basicEmbed("Sell Error", `Your ${emoji} have expired! Please throw them out!`, msg.channel);
		return;
	}
	
	// No amount specified.
	if (!amount) {
		client.basicEmbed("Sell Error", `You must determine how much ${emoji} to sell!`, msg.channel);
		return;
	}
	
	// No eggplants.
	if (!data.eggplant) {
		client.basicEmbed("Sell Error", `You do not have any ${emoji} right now.`, msg.channel);
		return;
	}
	
	// Sell all
	if (amount === "all") {
		sell(client, msg, data.eggplant);
		return;
	}
	
	// isNaN
	if (isNaN(parseInt(amount))) {
		client.basicEmbed("Sell Error", `You cannot sell ${emoji} if you don't use a number.`, msg.channel);
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
	
	// Update
	data.eggplant -= Math.floor(amount);
	data.points += pointGain;
	
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle("Sale Complete!")
		.setAuthor('Wenyunibot')
		.setDescription(`${msg.author.tag} sold ${Math.floor(amount)} ${emoji} for **${pointGain} points.**`)
		.addField("Current Points", data.points)
		.addField(`Current ${emoji}`, data.eggplant);
		
	// Check if best sale
	if (pointGain > data.bestEggplant) {
		eggplantEmbed.addField("New best sale!", `Previous best was ${data.bestEggplant} points.`);
		data.bestEggplant = pointGain;
	}
	
	// Save
	client.setScore.run(data);
	
	// Send embed
	msg.channel.send(eggplantEmbed);
	
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
	let emoji = data.marketEmoji || defaultEmoji;
	
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

// Views buying price
function getBuyPrice(data, amount) {
	let price = 0;
	if (data.countTime * countMultiplier + baseSafe >= amount) {
		return 100 * amount;
	}
	else {
		return Math.ceil(100 * amount + (amount - (data.countTime * countMultiplier + baseSafe))**2 * punishMultiplier);
	}
}

// Views price for buying eggplants
function checkPrice(client, msg, amount) {
	// Get client data
	let data = client.loadData(msg.author);
	
	let emoji = data.marketEmoji || defaultEmoji;
	
	// Yeah...
	if (!amount || isNaN(parseInt(amount))) {
		client.basicEmbed("Check Error", `You must determine how much ${emoji} you want to check!`, msg.channel);
		return;
	}
	
	// Cannot buy 0 or negative eggplants
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Check Error", `You can't check the price of a negative (or zero) amount of ${emoji}!`, msg.channel);
		return;
	}
	
	if (amount > 10000) {
		client.basicEmbed("Check Error", `You cannot buy more than 10000 ${emoji} at a time!`, msg.channel);
		return;
	}
	

	let price = getBuyPrice(data, amount)
		// Embed
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle("Buying Price")
		.setAuthor('Wenyunibot')
		.setDescription(`You will need **${price} points** to buy ${amount} ${emoji}!`)
		.addField("Price per Unit", `${Math.ceil(100 * price/amount)/100}`, true)
		.addField("Max Units Without Penalty", `${(data.countTime * countMultiplier + baseSafe)}`, true)
		
	if (price - (100 * amount) > 0) {
		eggplantEmbed.addField("Penalty", `${price - (100 * amount)} points`)
	}
	
	msg.channel.send(eggplantEmbed);
}

// -- VIEW MARKET --

// View the current market.
function view(client, msg) {
	// Get client data
	let data = client.loadData(msg.author);
	let emoji = data.marketEmoji || defaultEmoji;
	
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
		.setTitle("Market Status for " + msg.author.tag)
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
	let emoji = data.marketEmoji || defaultEmoji;
	
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
	let emoji = data.marketEmoji || defaultEmoji;
	
	// New random factor
	data.eggplantRandom = Math.floor(Math.random()*90 + 5)
	// New max price
	data.eggplantMaxSellPrice = Math.ceil((Math.random()*(maxRandom-minRandom)+minRandom)**2 + 100)
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
	let emoji = data.marketEmoji || defaultEmoji;
	
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

// -- CHANGE EMOJI --
function emojiChange(client, msg, emoji) {
		
	if (!emoji) {
		client.basicEmbed("No emoji given", `No emoji has been given.`, msg.channel);
		return;
	}
	
	let data = client.loadData(msg.author);
	data.marketEmoji = sanitize(emoji);
	client.setScore.run(data);
	
	client.basicEmbed("Emoji Changed!", `Successfully changed to ${data.marketEmoji}!`, msg.channel, moduleColor);
}

// Sanitizes names. For now, replaces them all with "+".
function sanitize(name) {
	return name.replace(/(@|\\|\*)/g, "+").substring(0, 60);
}

// -- HELP --

// Help.
function helpCommand(client, msg, error) {
	let title = "Market Help"
	if (error) {
		title += " (Due to Invalid Command)"
	}
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle(title)
		.setAuthor('Wenyunibot')
		.setDescription("The market is used to get a lot of points. The market can be very variable. Buy items for 100 points, and then sell them later for a profit!\r\n Be careful, as items only last a week!")
		.addField("Price", "Items have a base cost of 100 points each. A penalty is applied if too many items are bought at once. Using count will increase how many items can be bought without penalty. Use the check command to see your limit.")
		.addField("Stability", "Stability determines how much the price of items can change in one roll. The more unstable, the more the price can change.")
		.addField("Demand", "Demand determines the maximum possible price of items. The higher the demand, the more points they can sell for.")
		.addField("Reroll", "Rerolling is an important part of maximizing return. If you hold items, rerolling will change the price. If you don't hold items, rerolling will change the market.")
		.addField("Expiration", "If your items expire, you will have to throw them out (for 0 points). They last for exactly 7 days from purchase.")
		.addField("Commands", "**buy** - Buys items if you don't have any.\r\n**check** - Checks the price of items.\r\n**sell** - Sells items.\r\n**view** - Views your current market.\r\n**reroll** - Rerolls price or market.\r\n**throw** - Throws away items.\r\n**emoji** - Changes the item used in text.")
		.setFooter(client.footer());
		
		msg.channel.send(eggplantEmbed);
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
		
		if (["eggplant", "fruit", "market"].includes(mainCommand) && args[2]) {
			mainCommand = args[2].toLowerCase();
			arguments = args.slice(3);
		}
		
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
				
			case 'check':
				checkPrice(client, msg, arguments[0]);
				break;
				
			case 'reroll':
				reroll(client, msg);
				break;
			
			case 'throw':
				eggplantThrow(client, msg);
				break;
			
			case 'emoji':
				emojiChange(client, msg, arguments[0]);
				break;
				
			default:
				helpCommand(client, msg, true);
				break;
        }
	}
}