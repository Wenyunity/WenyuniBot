const Discord = require('discord.js');
const SQLite = require("better-sqlite3");
const emoji = ":eggplant:";
const expireTime = 1000 * 60 * 60 * 24 * 7; // 7 days
const rerollTime = 1000 * 60 * 60 * 6; // 6 hours
const day = 1000 * 60 * 60 * 24
const hour = 1000 * 60 * 60
const moduleColor = "#AA10AA"

// Gets user data
// Hopefully I can figure out soon how to export this straight from Yuni.js
function getData(client, msg) {
	let data = client.getScore.get(msg.author.id);
	
	if (!data) {
		data = {
			user: msg.author.id,
			points: 0,
			work: 0,
			bestWork: 0,
			eggplant: 0,
			eggplantExpire: 0,
			eggplantRandom: 0,
			eggplantSellPrice: 0,
			eggplantReroll: 0,
			bestEggplant: 0
		}
	}
	return data;
}

// Buy eggplants
function buy(client, msg, amount) {
	// Get client data
	data = getData(client, msg);
	
	// If you have eggplants, cannot buy more
	if (data.eggplant) {
		client.basicEmbed("Buy Error", `You cannot buy ${emoji} if you already have some!`, msg);
		return;
	}
	
	// Yeah...
	if (!amount) {
		client.basicEmbed("Buy Error", `You must determine how much ${emoji} to buy!`, msg);
		return;
	}
	
	// Cannot buy 0 or negative eggplants
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Buy Error", `You must buy a positive amount of ${emoji}!`, msg);
		return;
	}
	
	// Price
	let price = Math.floor(amount) * 100;
	
	// If you don't have enough points, cannot buy
	if (data.points < price) {
		client.basicEmbed("Buy Error", `You do not have enough points to buy this many ${emoji}!`, msg)
		return;
	}
	
	// Otherwise, add eggplants
	data.eggplant = Math.floor(amount);
	// Lower points
	data.points = data.points - price;
	// Starting sell price is random between 75 and 90
	data.eggplantSellPrice = 75 + Math.floor(Math.random() * 15);
	// Expire time
	data.eggplantExpire = Date.now() + expireTime;
	// Reroll time
	data.eggplantReroll = Date.now() + rerollTime;
	
	sendEmbed(`You bought ${Math.floor(amount)} ${emoji} for ${price} points!`, msg, data);
	
	// Save
	client.setScore.run(data);
}

// View the amount of eggplants
function view(client, msg) {
	// Get client data
	data = getData(client, msg);
	
	// No eggplants, just give the forecast.
	if (!data.eggplant) {
		client.basicEmbed("View Denied", `You do not have any ${emoji} right now.`, msg);
		return;
	}
	
	// Eggplants are expired
	if (Date.now() > data.eggplantExpire) {
		client.basicEmbed("View Denied", `Your ${emoji} have expired! Please throw them out!`, msg);
		return;
	}
	
	// Send the embed
	sendEmbed(`You have ${data.eggplant} ${emoji}!`, msg, data);
}

// Sends embed with given description and data
function sendEmbed(description, msg, data) {
	// Gets date objects for exact times
	let rerollDateTime = new Date(data.eggplantReroll);
	let expireDateTime = new Date(data.eggplantExpire);
	
	// Embed
	let eggplantEmbed = new Discord.RichEmbed()
		.setColor(moduleColor)
		.setTitle("Eggplant Status for " + msg.author.tag)
		.setAuthor('Wenyunibot')
		.setDescription(description)
		.addField("Stability", data.eggplantRandom, true)
		.addField("Sell Price", data.eggplantSellPrice, true)
		.addField("Reroll Time", `${(Math.floor(((data.eggplantReroll - Date.now())/hour)*100)/100)} hours`)
		.addField("Reroll Exact", rerollDateTime.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}))
		.addField("Expire Time", `${(Math.floor(((data.eggplantExpire - Date.now())/day)*100)/100)} days // ${(Math.floor(((data.eggplantExpire - Date.now())/hour)*100)/100)} hours`)
		.addField("Expire Exact Time", expireDateTime.toLocaleString("default", {timeZone: "UTC", timeZoneName: "short"}));
		
	msg.channel.send(eggplantEmbed);
}

function eggplantThrow(client, msg) {
	// Get client data
	data = getData(client, msg);
	
	// No eggplants, just give the forecast.
	if (!data.eggplant) {
		client.basicEmbed("Throw Denied", `You do not have any ${emoji} to throw away.`, msg);
		return;
	}
	
	// Eggplants are not expired
	if (Date.now() < data.eggplantExpire) {
		client.basicEmbed("Throw Denied", `Your ${emoji} are not expired! Don't throw them out!`, msg);
		return;
	}
	
	// Throw away eggplants
	client.basicEmbed("Throw Accepted", `You threw away ${data.eggplant} ${emoji}.`, msg, moduleColor);
	
	data.eggplant = 0;
	
	// Save
	client.setScore.run(data);
	
	// Randomize 
	randomizeRandom(client, msg);
}

function randomizeRandom(client, msg) {
	data = getData(client, msg);
	
	data.eggplantRandom = Math.floor(Math.random()*90 + 10)
	data.eggplantReroll = Date.now() + rerollTime;
	
	// Save
	client.setScore.run(data);
	
	// Write Text
	client.basicEmbed("Eggplant Random Factor", `Your new random factor is ${data.eggplantRandom}`, msg, moduleColor);
}

function randomizePrice(client, msg) {
	data = getData(client, msg);
	
	// Write Data
	data.eggplantSellPrice = Math.ceil(data.eggplantSellPrice * (data.eggplantRandom/100) + Math.random() * 200 * (((100-data.eggplantRandom)/100)));
	data.eggplantReroll = Date.now() + rerollTime;
	
	// Write Text
	client.basicEmbed("Eggplant Random Factor", `Your new sell price is ${data.eggplantSellPrice}`, msg, moduleColor);
	
	// Save
	client.setScore.run(data);
}

// Sell eggplants
function sell(client, msg, amount) {
	data = getData(client, msg);
	
	if (!amount) {
		client.basicEmbed("Sell Error", `You must determine how much ${emoji} to sell!`, msg);
		return;
	}
	
	// No eggplants, just give the forecast.
	if (!data.eggplant) {
		client.basicEmbed("Sell Error", `You do not have any ${emoji} right now.`, msg);
		return;
	}
	
	// Eggplants are expired
	if (Date.now() > data.eggplantExpire) {
		client.basicEmbed("Sell Error", `Your ${emoji} have expired! Please throw them out!`, msg);
		return;
	}
	
	// Must sell a positive amount
	if (Math.floor(amount) < 1) {
		client.basicEmbed("Sell Error", `You must sell a positive amount of ${emoji}!`, msg);
		return;
	}
	
	// Sell protection
	if (Math.floor(amount) > data.eggplant) {
		client.basicEmbed("Sell Error", `You cannot sell more ${emoji} than you have!`, msg);
		return;
	}
	
	// Sold.
	let pointGain = Math.floor(amount) * data.eggplantSellPrice;
	
	client.basicEmbed("Sale Complete!", `You sold ${Math.floor(amount)} ${emoji} for ${pointGain} points.`, msg, moduleColor);
	
	// Update
	data.eggplant -= Math.floor(amount);
	data.points += pointGain;
	
	// Save
	client.setScore.run(data);
	
	// Reroll if no more eggplants
	if (!data.eggplant) {
		randomizeRandom(client, msg);
	}
}

function reroll(client, msg) {
	data = getData(client, msg);
	
	if (Date.now() < data.eggplantReroll) {
		client.basicEmbed("Reroll Denied", `You must wait ${(Math.floor(((data.eggplantReroll - Date.now())/hour)*100)/100)} hours to reroll!`, msg);
		return;
	}
	
	if (!data.eggplant) {
		randomizeRandom(client, msg)
	}
	else {
		randomizePrice(client, msg)
	}
	
	data = getData(client, msg);
	data.eggplantReroll = Date.now() + rerollTime;	
	
	// Save
	client.setScore.run(data);
	
}

module.exports = {
    eggplantCommand: function(sql, client, msg) {
		// Here are the arguments
		let args = msg.content.substring(3).split(' ');
		// We have the form WY!eggplant mainCommand [arguments]
		let mainCommand = args[1];
		let arguments = args.slice(2);
		
        switch(mainCommand) {
            case 'help':
                msg.channel.send("Unfinished! Ask Wenyunity.")
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
				msg.channel.send("Could not find the command!")
				break;
        }
	}
}