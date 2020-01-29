const fs = require('fs');
const wenyBase = JSON.parse(fs.readFileSync('./Ten/tenBase.json', 'utf8'));
const wenyStart = JSON.parse(fs.readFileSync('./Ten/start.json', 'utf8'));
const basesIndex = JSON.parse(fs.readFileSync('./Ten/index.json', 'utf8'));

// Create a ten sentence chain
function getChain(chainBase, start) {
	let wordCount = 0;
	let sentence = "";
	let newSentence = true;
	let capitalNext = true;
	let currentWord = "";
	let wordsInSentence = 0;
	
	while (wordCount < 10) {
		// Starting a sentence.
		if (newSentence) {
			// Special sequence for wordCount = 9
			if (wordCount === 9) {
				// Grab a "one word sentence"
				currentWord = getEnd(start, chainBase);
				// Place it at the beginning of the sentence.
				sentence = capitalize(currentWord) + ". " + sentence.slice(0, -2);
				wordCount += 1;
			}
			// Otherwise...
			else {	
				currentWord = getStart(start);
				if (capitalNext) {
					sentence += capitalize(currentWord);
				}
				else {
					if (currentWord === "i") {
						sentence += "I";
					}
					else {
						sentence += currentWord;
					}
				}
				wordCount += 1
				newSentence = false;
				capitalNext = false;
				wordsInSentence = 1;
			}
		}
		// Continuing a sentence.
		else {
			// Try to end the sentence on the next word.
			if (wordCount === 9) {
				try {
					currentWord = tryEnd(currentWord, chainBase);
				}
				catch {
					console.log(currentWord);
					console.log("End");
					return "Uh... something went wrong.";
				}
			}
			// More words.
			else {
				try {
					currentWord = getNext(currentWord, chainBase);
				}
				catch {
					console.log(currentWord);
					return "Uh... something went wrong.";
				}	
			}
			// End of sentence.
			if (currentWord === ". ") {
				// Randomly replace with comma, or if one word, replace with comma always
				if ((wordCount < 8 && Math.random() < 0.5) || wordsInSentence === 1) {
					currentWord = ", ";
				}
				else {
					capitalNext = true;
				}
				newSentence = true;
			}
			// Add a space.
			else {
				wordCount += 1;
				sentence += " ";
			}
			// Add to this count
			wordsInSentence += 1;
			
			// Add the word to the sentence
			if (currentWord === "i") {
				sentence += "I";
			}
			else {
				sentence += currentWord;
			}
		}
	}
	// Add exclamation point
	if (Math.random() < 0.75) {
		sentence += "!";
	}
	else if (Math.random() > 0.995) {
		sentence += "?";
	}
	else if (Math.random() > 0.95) {
		sentence += "...";
	}
	else {
		sentence += ".";
	}
	// Return sentence
	return sentence;
}

// Get the next word in the chain
function getNext(word, chainBase) {
	// Pick a random word.
	base = chainBase[word][Math.floor(Math.random() * chainBase[word].length)];
	// Lower the chances of ending the sentence.
	if (base === ". ") {
		base = chainBase[word][Math.floor(Math.random() * chainBase[word].length)];
	}
	return base;
}

// Get the first word in the chain
function getStart(start) {
	return start[Math.floor(Math.random() * start.length)];
}

// Capitalize a word.
function capitalize(word) {
	return word.charAt(0).toUpperCase() + word.substring(1); 
}

// Get the next word to be the end of a sentence if possible.
function getEnd(list, chainBase) {
	let allowed = [];
	// Find words that can end sentences if possible.
	for (let z = 0; z < list.length; z++) {
		if (list[z] !== ". ") {
			if (chainBase[list[z]].includes(". ")) {
				allowed.push(list[z]);
			}
		}
	}
	// Choose one randomly from those that can end sentences, if possible.
	if (allowed.length > 0) {
		return allowed[Math.floor(Math.random() * allowed.length)]
	}
	// Otherwise get a random one.
	else {
		return list[Math.floor(Math.random() * list.length)]
	}
}

// Try to get the next word to be the end of a sentence.
function tryEnd(word, chainBase) {
	return getEnd(chainBase[word], chainBase);
}

// Add a chain to Wenyunibot's dictionary.
function addToChain(sentence, chainBase, start) {
	//For each word in the sentence
	let sentenceBegin = true;
	for (let i = 0; i < sentence.length; i++) {
		// Get the word
		let word = sentence[i].toLowerCase().replace(/(^[`"'-]+|[^'`-\w]|-"+$)+/g, "")
		if (sentenceBegin) {
			start.push(word);
			sentenceBegin = false;
		}
		// If not in the chainbase
		if (!chainBase[word]) {
			chainBase[word] = []
		}
		// If there's a next word and our current word does not end a phrase
		if (sentence[i].toLowerCase().endsWith(word) && i < (sentence.length - 1)) {
			chainBase[word].push(sentence[i + 1].toLowerCase().replace(/(^[`"'-]+|[^'`-\w]|-"+$)+/g, ""));
		}
		// Add period
		else {
			chainBase[word].push(". ");
			sentenceBegin = true;
		}
	}
}

// Save chain
function saveChain(chainBase, start, save, startSave) {
	fs.writeFile (`./Ten/${save}.json`, JSON.stringify(chainBase, null, 4), function(err) {
		if (err) throw err;
	});
	
	fs.writeFile (`./Ten/${startSave}.json`, JSON.stringify(start, null, 4), function(err) {
		if (err) throw err;
		console.log('completed writing to tenBase + start json');
	});
}

function checkBase(setName) {
	if (basesIndex[setName]) {
		return true;
	}
	else {
		return false;
	}
}

function getCustomChain(setName) {
	let base = JSON.parse(fs.readFileSync(`./Ten/${basesIndex[setName].base}.json`, 'utf8'));
	let start = JSON.parse(fs.readFileSync(`./Ten/${basesIndex[setName].start}.json`, 'utf8'));
	return getChain(base, start);
}

function getScreen(base, start) {
	let response = "";
	for (let i = 0; i < 10; i++) {
		response += "`(" + String.fromCharCode(65+i) + "): ` ";
		response += getChain(base, start) + "\r\n";
	}
	return response;
}

function getCustomScreen(setName) {
	let base = JSON.parse(fs.readFileSync(`./Ten/${basesIndex[setName].base}.json`, 'utf8'));
	let start = JSON.parse(fs.readFileSync(`./Ten/${basesIndex[setName].start}.json`, 'utf8'));
	return getScreen(base, start);
}

module.exports = {
	screenCommand: function(msg, client, setName) {
		if (checkBase(setName)) {
			client.basicEmbed(`TWOW Screen Generated Using ${basesIndex[setName].name}`, getCustomScreen(setName), msg.channel, "#101010"); 
		}
		else {
			client.basicEmbed("TWOW Screen [Using Weny base]", getScreen(wenyBase, wenyStart), msg.channel, "#101010");
		}
	},
    tenCommand: function(msg, client, setName) {
		if (checkBase(setName)) {
			client.basicEmbed(`TWOW Response Generated Using ${basesIndex[setName].name}`, getCustomChain(setName), msg.channel, "#101010"); 
		}
		else {
			client.basicEmbed("TWOW Response [Using Weny base]", getChain(wenyBase, wenyStart), msg.channel, "#101010");
		}
	},
	massAdd: function() {
		const purpleText = JSON.parse(fs.readFileSync('./Ten/purpleText.json', 'utf8'));
		let purpleBase = {};
		let purpleStart = []
		for (let x = 0; x < purpleText.length; x++) {
			addToChain(purpleText[x].split(" "), purpleBase, purpleStart);
		}
		saveChain(purpleBase, purpleStart, "leagueBase", "leagueStart");
	},
	addDictionary: function(sentence) {
		addToChain(sentence, wenyBase, wenyStart);
		saveChain(wenyBase, wenyStart, "tenBase", "start");
	}
}