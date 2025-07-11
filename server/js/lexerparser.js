"use strict";
//action object - manager user actions and pack/unpack JSON equivalents
module.exports.LexerParser = function LexerParser(dictionary) {
    try{
        const tools = require('./tools.js');
        const customAction = require('./customaction.js');
        const fileManagerModule = require('./filemanager.js');
        const dictionaryModule = require('./dictionary');  
	    const self = this; //closure so we don't lose this reference in callbacks
        var dataFolder = '../../data/'; 
        const fm = new fileManagerModule.FileManager(true, dataFolder);

        //grammar dictionary:
        const salutations = ["hello", "yo", "hi", "hey", "heys", "hiya", "ahoy", "good morning", "good afternoon", "good evening"];
        const yesWords = ['y','yes','yup','yeh','yep','aye','yeah', 'yarp','ok','okay','okey','kay','sure','absolutely', 'certainly', 'definitely','exactly', 'indeed', 'right','totally', 'totes', 'true','truth','great','excellent','marvelous','fantastic','affirmed', 'confirmed','confirmation','affirmative'];
        const politeWords = ['please', 'thankyou', "thanks", 'tx', 'thx','thanx','fanks','fanx',"cheers", "sorry", "apologies"];
        const goodbyes  =["bye", "good bye", "goodbye","seeya", "later","laters", "goodnight", "good night"]
        const noWords = ['n','no', 'nay', 'nope', 'narp', 'reject','rejected', 'rejection','deny','denied','refuse','refused', 'refusal','negative', 'negatory']

        const questions = ['who','what','why','where','when','how','which','whose', 'is']; //is may need some special handling ()
        const moreQuestions = ['do you', 'have you', 'do', 'have', "pardon", "sorry"];
        const modalVerbs = ['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'];

        const unhandledWordsAndConjunctions = ['and', 'then', 'than', 'or', 'but', 'because', 'coz','cause','cuz', 'therefore', 'while', 'whilst', 'thing','oh'];
        const stopWords = ["the", "some", "a", "an", "again", "is", "this", "these"];
        const numerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const firstPersonPronouns = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'];
        const secondPersonPronouns = ['your', 'yours', 'yourself', 'yourselves'];
        const thirdPersonPronouns = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'];
        const reflexivePronouns = ['myself', 'yourself', 'himself', 'herself', 'itself', 'themself', 'themselves'];
        const indefinitePronouns = ['someone', 'anyone', 'everybody', 'everyone', 'nobody','noone', 'no one'];
        const adverbs = [
            'angrily', 'awkwardly', 'boldly', 'bravely', 'brightly', 'briefly', 'carefully', 'carefuly', 'cautiously',
            'closely', 'confidently', 'gently', 'gracefully', 'happily', 'honorably', 'loudly', 'losely',
            'meticulously', 'noisily', 'precisely', 'quietly', 'quietly', 'sadly', 'searchingly', 'silently',
            'silently', 'slowly', 'softly', 'strategically', 'tactically', 'thoroughly', 'tightly', 'quickly'
        ]; //not split words but we need to trim these out and *occasionally* handle them.

        const locationPrepositions = [
            'up', 'down', //pick up put down
            'in', 'into', 'in to', 'inside', //container or not has different context
            'onto', 'on to', 'on top of', 'on', // hook verb or object optional
            'off of', 'off', // hook verb or object optional
            'above', 'over', // not the same as on top of - need to hang on a "hook"
            'under', 'underneath',
            'below', 'beneath', // same as under unless hanging
            'behind', // if both object and subject are movable
            'between', 'beside', 'near',
            'across', 'in front of', 'through',
            'apart'
        ];

        const givingPrepositions = ['to', 'for', 'onto', 'on', 'on to', 'toward', 'towards'];
        const receivingPrepositions = ['from', 'by', 'at', 'out', 'out of'];
        const sharedPrepositions = ['by', 'at', 'in', 'into', 'in to', 'with'];

        //collate prepositions and sort by number of words - important for when we try to split later.
        let allPrepositions = sharedPrepositions.concat(receivingPrepositions.concat(givingPrepositions.concat(locationPrepositions)));
        allPrepositions = Array.from(new Set(allPrepositions)); //remove duplicates.
        allPrepositions.sort((p1, p2) => p2.split(/\s+/).length - p1.split(/\s+/).length); //sort by number of words greatest first

        //verb dictionary       
        const verbs = fm.readFile("verb-lexicon.json");  //add  'ignore','blank','squeeze','grasp','clutch','clasp','hold','smoosh', 'smear','squish', 'chirp', 'tweet', 'bark', 'meow', 'moo','growl'
        self.lexicon = verbs;
        self.topLevelVerbs = Object.keys(verbs);
        const allAliases = [];
        for (const key of self.topLevelVerbs) {
            const aliases = verbs[key].aliases || [];
            if (aliases.length > 0) {
                allAliases.push(...aliases);
            };
        };

        self.allVerbs = self.topLevelVerbs.concat(allAliases); //~400 verbs!
            const emptyValueIndex = self.allVerbs.indexOf("");
            if (emptyValueIndex >-1) {
                self.allVerbs.splice(emptyValueIndex,1);
            };

        //game object dictionary
        self.dictionary = dictionary;
        //handle not being passed in (e.g. testing)
        if (!(self.dictionary)) {self.dictionary = new dictionaryModule.Dictionary();};

        //action string components
        var _inputString = "";
        var _direction = "";
        var _splitWord = "";
        var _adverb = "";
        var _preposition = ""
        var _nouns = []; //objects and creatures (include their pronouns and adjectives for the purpose of this lexer)
        var _subject = ""; //Subject: - noun that performs the verb's action. For example, in the sentence "The dog barked," "dog" is the subject. 
        var _object = ""; //Object: - noun that receives the action of the verb. In the sentence "The dog chased the ball," "ball" is the object because it is being acted upon by the verb "chased". 

        //saved state:
        var _lastInputString = null;
        var _inConversation = null;
        var _awaitingPlayerAnswer = false;

        const sanitiseString = function(aString) {
            return aString.toLowerCase().substring(0,255).replace(/[^a-z0-9 +]+/g,""); //letters, numbers, and plus sign.
        };

        self.setAwaitingPlayerAnswer = function(bool) {
            _awaitingPlayerAnswer = bool;
        }; 

        self.normaliseVerb = function (word) {
            word = sanitiseString(word);
            for (const [canonical, { aliases }] of Object.entries(verbs)) {
                if (word === canonical || aliases.includes(word)) {
                    return canonical;
                };
            };
            return null;
        };

        self.extractAdverb = function(input) {
            let tokens = input.split(/\s+/)
            let rest = input;
            //strip out pleasantries

            for (let i=tokens.length-1; i >=0 ;i--) {
                //work backwards as we may splice if anything is null.
                if (adverbs.includes(tokens[i])) {
                    let adverb = tokens[i];
                    _adverb = adverb;
                    tokens.splice(i,1);
                    rest = tokens.join(' ');
                    return {"adverb": adverb, "remainder": rest ||null}
                    break;
                };
            };
            return {"adverb": null, "remainder": rest}
        };

        self.extractObjectsAndPrepositions = function(input, verb) {
            let tokens = input.split(/\s+/);

            //remove firstPersonPronouns
            if (verbs[verb].category != "writing") { //we don't modify these for writing
                tokens = tokens.filter(function (value, index, array) {
                    return (!(firstPersonPronouns.includes(value)))
                });
            };

            const rest = tokens.join(' ');
            let objects = [rest];

            let preposition = null;
            for (var i=0; i<=allPrepositions.length; i++) {              
                //support case where first word of string is a preposition
                if (rest.startsWith(allPrepositions[i]+" ")) {
                    //console.debug('first word is preposition');
                    preposition = allPrepositions[i];
                    objects = [rest.substring(allPrepositions[i].length).trim()];
                    break;
                };

                //support case where last word of string is a preposition
                if (rest.endsWith(" "+allPrepositions[i])) {
                    //console.debug('last word is preposition');
                    preposition = allPrepositions[i];
                    objects = [rest.substring(0, rest.indexOf(' '+allPrepositions[i])).trim()];
                    break;
                };

                objects = rest.split(' '+allPrepositions[i]+' '); //pad each side with spaces to avoid substring oddities - easier to understand than a regex
                if (objects[0] != rest) { //split successful
                    //console.debug('split using "'+allPrepositions[i]+'".');
                    preposition = allPrepositions[i];                  
                    break; //exit the loop early
                }; //end if
            };

            if (objects.length == 1 && !preposition) {
                //check if we start or end with a number and split that out as subject
                tokens = rest.split(/\s+/);
                if (Number.isInteger(Number(tokens[0]))) {
                    preposition = tokens.shift();
                    objects[0] = tokens.join(" ");
                } else if (Number.isInteger(Number(tokens[tokens.length-1]))) {
                    preposition = tokens.pop();
                    objects[0] = tokens.join(" ");
                };
            };

            //now try splitting on conversation chunks...
            if (objects.length == 1 && !preposition) {
                //check if we start or end with a number and split that out as subject
                tokens = rest.split(/\s+/);
                if (Number.isInteger(Number(tokens[0]))) {
                    preposition = tokens.shift();
                    objects[0] = tokens.join(" ");
                } else if (Number.isInteger(Number(tokens[tokens.length-1]))) {
                    preposition = tokens.pop();
                    objects[0] = tokens.join(" ");
                };
            };

            //If current input object is "it", we use the last object instead.
            //work out where last noun will belong 
            for (let n=0;n<objects.length; n++) {
                if (objects[n] === "it" || objects[n] === "them") {
                    if (_nouns.length == 1) {
                        // - get bottle, put it in box - vs - get box, put bottle in it 
                        objects[n] = _nouns[0];
                    } if (_nouns.length == 2); {
                        // - get bottle from box - put it in car // put bottle in box, put it in car
                        //we need to interpret verb *and* preposition
                        console.warn("Complex preposition handling not yet implemented: _nouns:"+_nouns+" objects: "+objects+" input: "+input);
                    };
                };
            };

            //save values for next call
            //update stored nouns
            _nouns = objects;
            _preposition = preposition;
            return {objects, preposition};
   
        };

        self.extractObjectsByRequestStems = function(input) {
            let objects = [input];
            let preposition = null;
            /*
                \bif\b: matches the word "if" as a whole word (not part of another word)
                \s+: one or more spaces
                \w+: one word (the word between "if" and the modal verb)
                another \s+
                \b(...): matches one of the modal verbs as a whole word
                i flag: makes the match case-insensitive
            */
            let words = modalVerbs.join("|");
            let regex = new RegExp(`\\bif\\b\\s+\\w+\\s+\\b(${words})\\b`, "i"); 
            let match = input.match(regex);

            if (!match) {
                words = "for an|for a";
                regex = new RegExp(`\\b(${words})\\b`, "i");
                match = input.match(regex);
            }

            if (match) {
            const matchText = match[0];
            const start = match.index;
            const end = start + matchText.length;

            const before = input.slice(0, start).trim();
            const matched = matchText.trim();
            const after = input.slice(end).trim();

            objects[0] = before;
            objects[1] = after;
            preposition = matched;
            };

            //save values for next call
            //update stored nouns
            _nouns = objects;
            _preposition = preposition;
            return {objects, preposition};
        };

        self.extractObjectsByQuestions = function(input) {
            let objects = [input];
            let preposition = null;
            /*
                \b(...): matches one of the questions as a whole word
                i flag: makes the match case-insensitive
            */
            const allQuestions = questions.concat(moreQuestions);
            const words = allQuestions.join("|");
            const regex = new RegExp(`\\b(${words})\\b`, "i");
            const match = input.match(regex);

            if (match) {
            const matchText = match[0];
            const start = match.index;
            const end = start + matchText.length;

            const before = input.slice(0, start).trim();
            const matched = matchText.trim();
            const after = input.slice(end).trim();

            objects[0] = before;
            objects[1] = after;
            preposition = matched;
            };

            //save values for next call
            //update stored nouns
            _nouns = objects;
            _preposition = preposition;
            return {objects, preposition};
        };

        self.removeStopWords = function(input) {
            let tokens = input.split(/\s+/)
            //remove stopWords
            tokens = tokens.filter(function (value, index, array) {
                return (!(stopWords.includes(value)))
            });  

            return tokens.join(' ');
        };

        self.locateMostRelevantVerb = function(tokens) {
            
            //find verbs... allVerbs
            const inputVerbs = tokens.filter(function (value, index, array) {
                return ((self.allVerbs.includes(value)))
            });

            let verbIndex = -1

            //we have no recognised verbs...
            if (inputVerbs.length == 0) {
                return {inputVerbs, verbIndex}; 
            };

            //find position of each verb in token array and strip to left of them.
            //special case - handle "get into/in/out/out of" - nothing too clever - only it it's the very first verb.
            if (inputVerbs[0] == "get") {
                verbIndex = tokens.indexOf("get");
                if (tools.directions.includes(tokens[verbIndex+1]) || locationPrepositions.includes(tokens[verbIndex+1]))  {
                    tokens.splice(verbIndex, 1, "go");
                };

                //if we start with "get" (and/or now "go"), we'll return here - no point doing extra procesing
                return {inputVerbs, verbIndex};
            };

            //handle "try" - second verb *might* end with "ing"             
            if (["try", "attempt"].includes(inputVerbs[0])) {
                //take the next verb whatever that may be
                if (inputVerbs.length > 1) {
                    verbIndex = tokens.indexOf(inputVerbs[1]); 
                    inputVerbs.shift();
                    return {inputVerbs, verbIndex};  
                } else {
                    for (let t=0; t<tokens.length; t++) {
                        //if we're here then verbs like "sing" will have already been captured so this is safe to attempt.
                        if (tokens[t].endsWith("ing")) {
                            let newVerb = tokens[t].replace("ing", "");
                            if (self.allVerbs.includes(newVerb)) {
                                tokens[t] = newVerb; //hopefully this *does* modify the original token
                                inputVerbs.shift(); //ditch "try" or "attempt" and replace with gerund
                                inputVerbs.push(newVerb);
                                verbIndex = t;
                                return {inputVerbs, verbIndex};
                            };
                        };
                    };

                    //we don't have an alternate verb. 
                };            
            }; 
   
            if (inputVerbs.length == 1) {
                verbIndex = tokens.indexOf(inputVerbs[0]);
                return {inputVerbs, verbIndex};
            };

            //another special case. have/take a break/rest
            if (["have", "take"].includes(inputVerbs[0])) {
                if (inputVerbs[1] == "break") {
                    inputVerbs.splice(1, 1, "rest");

                    verbIndex = tokens.indexOf("break");
                    tokens.splice(verbIndex, 1, "rest");
                    return {inputVerbs, verbIndex};
                };
                let testVerb = self.normaliseVerb(inputVerbs[1]);
                if (verbs[testVerb].category == "resting") {
                    verbIndex = tokens.indexOf(inputVerbs[1]); 
                    return {inputVerbs, verbIndex};
                };
            };

            //if we're writing something, then we go with that.
            let testVerb = self.normaliseVerb(inputVerbs[0]);
            if (verbs[testVerb].category) {
                if (verbs[testVerb].category == "writing") {
                    verbIndex = tokens.indexOf(inputVerbs[0]);
                    return {inputVerbs, verbIndex};
                };
            };

            //we have more than one potential verb...
            //try all the verbs in reverse order, ditch any we don't know - if any left are dialogue, we'll use the *earliest* of those.
            let dialogueVerb = "";
            for (let v=inputVerbs.length -1 ; v>=0; v--) {
                let testVerb = self.normaliseVerb(inputVerbs[v]);
                if (testVerb) {
                    if (verbs[testVerb].category == "dialogue") {
                        dialogueVerb = testVerb;
                        verbIndex = tokens.indexOf(dialogueVerb);
                    };
                }  else {
                    inputVerbs.splice(v,1); //remove unhandled verbs
                };
            };

            //we have a dialogue verb..
            if (verbIndex > -1) {
                return {inputVerbs, verbIndex};
            };

            //basic directions...
            if (inputVerbs.includes("go")) {
                verbIndex = tokens.indexOf("go");
                return {inputVerbs, verbIndex};
            };

            //some prepositions and even nouns (in/out/up/down/water) are also verbs. We have multiple verbs here so remove them from the list of input verbs - leave them in original tokens though.
            let ignoreVerbs = ["i", "in", "into", "inside", "out", "outside", "up", "down", "water", "on", "onto", "off", "offof", "fire", "ice", "present", "mug"];
            if (ignoreVerbs.some((e) => inputVerbs.includes(e))) {
                for (let i = 0; i < ignoreVerbs.length; i++) {
                    let inputVerbIndex = inputVerbs.indexOf(ignoreVerbs[i]);
                    if (inputVerbIndex >-1) {
                        inputVerbs.splice(inputVerbIndex,1);
                    };
                };
            };
 
            //check for "is" as a standalone verb vs part of another...
            if (inputVerbs.includes("is") && inputVerbs[0] != "is") {
                let isIndex = tokens.indexOf("is");
                if (inputVerbs.includes(tokens[isIndex-1])) {
                    //the word before "is" is probably the preferred verb. - ditch "is"
                    inputVerbs.splice(isIndex,1);
                };
                if (isIndex == tokens.length-1) {
                    //it's at the end of the sentence - we can drop that too.
                    inputVerbs.splice(isIndex,1);
                };
            };
             
            //check for "do" as a standalone verb vs part of another...
            if (inputVerbs.includes("do") && inputVerbs[0] != "do") {
                let isIndex = tokens.indexOf("do");
                if (inputVerbs.includes(tokens[isIndex-1])) {
                    //the word before "do" is probably the preferred verb. - ditch "do"
                    inputVerbs.splice(isIndex,1);
                };
                if (isIndex == tokens.length-1) {
                    //it's at the end of the sentence - we can drop that too.
                    inputVerbs.splice(isIndex,1);
                };
            };
                    
            //we may be back down to 1 verb now...
            if (inputVerbs.length == 1) {
                verbIndex = tokens.indexOf(inputVerbs[0]);
                return {inputVerbs, verbIndex};
            };

            //don't try to handle more than 3 inputVerbs, just take the last one...
            console.warn("Potential multiple verb parsing issue, taking last verb as action." );
            if (verbIndex == -1) {
                verbIndex = tokens.indexOf(inputVerbs[inputVerbs.length-1]);
            };

            return {inputVerbs, verbIndex};
        };

        self.parseInput = function(input, player, map) {
            try {
                let playerLocation;
                let lastCreature;
                //we take in player and map as we may need additional context and want to store state
                input = sanitiseString(input);
                let rest = input;
                if (_inputString) {
                    //remember last input
                    _lastInputString = _inputString;
                };
                _inputString = input; //store for later

                //extract adverb
                const extractedAdverbObject = self.extractAdverb(rest)
                const { adverb, remainder } = extractedAdverbObject;
                rest = remainder;

                //find the position of the most relevant verb. 
                const tokens = rest.split(/\s+/)
                const {inputVerbs, verbIndex} = self.locateMostRelevantVerb(tokens);
                let verb = "";
                let verbInd = verbIndex;

                if (player) {
                    _inConversation = player.getLastCreatureSpokenTo();
                    playerLocation = player.getCurrentLocation();
                    if (_inConversation) {
                        lastCreature = playerLocation.getCreature(_inConversation);
                    }
                };

                if (tokens.includes("everyone")) {
                    for (i = 0; i < inputVerbs.length; i++) {
                        //if (verbs[inputVerbs[i]].category == "dialogue") {
                            verb = "say"
                            _inConversation = "everyone";
                            verbInd = -1;
                            break;
                        //};
                    };
        
                };

                if (salutations.some((e) => input.split(/\s+/)[0] == e)) { //will only match single words
                    verb = "greet";
                    verbInd = -1; //don't trim input
                };

                if (_inConversation && _inConversation != "everyone") {
                    //handling for follow on questions/bye/Y/N and modal verbs if _inConverastion *before* we extract more verbs - mainly questions and modals
                    if (
                        (questions.some((e) =>  input.split(/\s+/)[0] == e)) ||
                        (input.endsWith("?")) ||
                        (moreQuestions.some((e) =>  input.split(/\s+/)[0] == e)) ||
                        (modalVerbs.some((e) =>  input.split(/\s+/)[0] == e))
                    ) {
                        verbInd = -1; //keep talking, don't trim input
                        verb = "question"; //would prefer "ask" but that forces a re-parse from action               
                    } else if (
                        (yesWords.some((e) =>  input.split(/\s+/)[0] == e)) ||
                        (politeWords.some((e) =>  input.split(/\s+/)[0] == e)) ||
                        (goodbyes.some((e) =>  input.split(/\s+/)[0] == e)) ||
                        (noWords.some((e) =>  input.split(/\s+/)[0] == e))  ||
                        //pronouns...
                        (firstPersonPronouns.some(e => new RegExp(`\\b${e}\\b`, 'i').test(input)))  ||
                        (secondPersonPronouns.some(e => new RegExp(`\\b${e}\\b`, 'i').test(input)))
                    ) { 
                        verbInd = -1; //keep talking, don't trim input
                        verb = "say";
                    };

                    //did we explicitly mention them in this new sentence?
                    if (!verb || verbs[verb].category != "dialogue") {
                        for (let t=0; t<tokens.length; t++) {
                            if (lastCreature.syn(tokens[t])) {
                                verbInd = -1; //keep talking, don't trim input
                                verb = "say"; 
                                break;                           
                            };
                        };
                    };
                };

                
                if (verbInd > 0 && playerLocation && _inConversation != "everyone") {
                    //found verb is not first word - is it a creature? // we only need to know if it exists here at this moment...
                    let matches;
                    for (let t=0; t<tokens.length; t++) {
                        matches = self.dictionary.lookup(tokens[t]+" "+tokens[t+1], "creature");
                        if (matches) {break;}
                        //we only need to parse as far as first verb
                        if (t >= verbInd) {break;};
                    };
                    //and again with just a single token if no match
                    if (!matches) {
                        for (let t=0; t<tokens.length; t++) {
                            matches = self.dictionary.lookup(tokens[t], "creature");
                            if (matches) {break;}
                            //we only need to parse as far as first verb
                            if (t >= verbInd) {break;};
                        };
                    };

                    if (matches) {
                        let keys = Object.keys(matches);
                        for (const key of keys) {
                            if (playerLocation.getCreature(key)) {
                                verb = "say";
                                verbInd = -1;
                                break;
                            };
                        };
                    };

                    //not a creature name but... is it a question?
                    if (
                        (questions.some((e) =>  tokens[0] == e)) ||
                        (moreQuestions.some((e) => tokens[0] == e)) ||
                        (modalVerbs.some((e) =>  tokens[0] == e)) ||
                        (tokens[tokens.length-1].endsWith("?"))
                    ) {
                        if (playerLocation.liveCreaturesExist()) {
                            let creatures = playerLocation.getCreatures(); 
                            //work backwards as we may splice...
                            for (let c=creatures.length-1; c >=0 ;c--) {
                                if (creatures[c].isDead()) {creatures[c].splice(c,1)};
                            };
                            if (creatures.length == 1) {
                                verb = "question";//would prefer "ask" but that forces a re-parse from action
                                verbInd = -1;
                            };
                        };
                    };
                };

                //splice tokens to the verb we are using. (dump everything to the left of selected verb)
                if (verbInd > -1) {
                    tokens.splice(0,verbInd)   
                    //verb will now be first token
                    verb = self.normaliseVerb(tokens[0]);

                    //drop out of conversation
                    if (verb && verbs[verb].category != "dialogue") {
                        _inConversation = null;
                        if (player) {
                            player.setLastCreatureSpokenTo();
                        };
                    };
                };

                if (!verb) {
                    //if we don't have a recognised verb here, there's a chance we are dealing with yes/no, please/thankyou, salutations, questions etc
                    //use last verb if in active conversation
                    let lastVerbUsed = "";
                    if (player) {
                        lastVerbUsed = player.getLastVerbUsed(); 
                        if (lastVerbUsed) {            
                            if (verbs[lastVerbUsed].category == "dialogue") {
                                verb = lastVerbUsed;
                            } else {
                                _inConversation = null;
                                player.setLastCreatureSpokenTo();
                            };
                        };
                    };
                    
                };

                //not in a conversation and no verb match
                if (!verb) {
                    //could be a custom action!
                    verb = "customaction"
                };

                if (verbInd > -1) {
                    //only do this if we had an original verb match, otherwise it's all dialogue
                    rest = tokens.slice(1).join(' ');
                };
                
                //split what's left by preposition to get objects   
                let { objects, preposition} = self.extractObjectsAndPrepositions(rest, verb);

                //remove stopwords 
                if (verbInd > -1) {
                    if (verbs[verb].category != "writing") { //we don't modify these for writing
                        objects[0] = self.removeStopWords(objects[0]);
                    };
                    if (objects[1]) {
                        objects[1] = self.removeStopWords(objects[1]);
                    };
                };

                //split by modal verbs
                if (verb && verbs[verb].category == "dialogue" && objects.length == 1 && !preposition)  {
                    rest = objects[0];
                    //attempt dialogue splitting
                    ({ objects, preposition} =  self.extractObjectsByRequestStems(rest));
                };

                if (_inConversation) {
                    objects[0] = input;
                    objects[1] = _inConversation;
                };

                //convert directions.
                var directionIndex = tools.directions.indexOf(verb);
                if (directionIndex > -1) {
                    preposition = verb;
                    verb = "go";

                    //use whole word direction.
                    if (preposition.length == 1) {
                        var index = tools.directions.indexOf(_direction);
                        if (index > -1) {
                            preposition = tools.directions[index+1]; 
                        };
                    };
                }; 

                //if action is a movement, set preposition to be direction (where reelvant).
                if (verbs[verb].category == "movement"){
                    if (tools.directions.includes(objects[0])) {
                        preposition = objects[0];
                        objects[0] = null;
                    };
                };
           
                //are we *switching* creature whilst talking to another?
                if (objects.length == 2 && player && (!verb || (verbs[verb].category== "dialogue" && verb != "greet") && _inConversation && _inConversation != "everyone")) { 
                    //do we swap out objects[1] (inConversation) with new creature?
                    let possibleMatches = []
                    let matched = false;
                    let switching = false;
                    let matchedIndex = -1
                    let tokens = objects[0].split(/\s+/);
                    for (let t=0; t<tokens.length;t++) {
                        if(!tokens[t]) {continue;};//handle null
                        if (["he", "him", "her", "them", "they", "their", "it", "you"].includes(tokens[t].replace("s","")) || tokens[t] == "his") {
                            //talking to same character again.
                            matched = true;
                            matchedIndex = t;                            
                            switching = false;
                            break;
                        };
                        
                        let matches = self.dictionary.lookup(tokens[t], "creature");
                        let keys = Object.keys(matches);
                        for (const key of keys) {
                            let name = key;
                            let {type, synonyms} = matches[key];
                            if (objects[0].includes(name) ) {
                                if (_inConversation != name) {
                                    console.debug ("dictionary hit - full name match: "+tokens[t]+" : "+name+" : "+ type + ":"+ synonyms);
                                    objects[0] = objects[0].replace(name,"").trim();
                                    objects[1] = name;
                                };
                                verb = "greet";
                                matched = true;
                                matchedIndex = t;
                                switching = true;
                                break;
                            } else { //we have a synonym match. Store if they're in the same location as player.
                                if (lastCreature) {
                                    if (lastCreature.syn(tokens[t])) {
                                        matched = true;
                                        matchedIndex = t;
                                        switching = false;                                      
                                        break;
                                    };
                                };
                                let possibleCreature = playerLocation.getCreature(name);
                                if (possibleCreature) {
                                    possibleMatches[key] = matches[key];
                                };
                            };
                        };

                    if (matched) {break;}
                    };

                    //if we have more than 1 match, we have multiple creatures with the same synonym 
                    if (!matched && Object.keys(possibleMatches).length == 1 ) {
                        //we have a single creature with a matching synonym but could be further on in the sentence than the first word!.
                        //if we're have a question *before* a creature name we don't want to switch
                        //this is where we can use "inputVerbs" to help us.
                        for (t=0; t<tokens.length;t++) {
                            if (inputVerbs.includes(tokens[t])) {
                                //we've hit a verb before a matching name...
                                break;
                            };
                            let key = Object.keys(possibleMatches)[0];
                            if (possibleMatches[key].synonyms.includes(tokens[t])) {
                                objects[0] = objects[0].replace(tokens[t],"").trim();
                                objects[1] = tokens[t];
                                verb = "greet";
                                matched = true;
                                break;
                            };
                        };
                    };
                };


                if (player) { player.setLastVerbUsed(verb); };
                _lastInputString = input;

                if (_inConversation) {
                    //last check are we asking them to go somewhere
                    if (inputVerbs) {
                        if (inputVerbs[0] == "go") {
                            let t = tokens.indexOf(inputVerbs[0]);
                            for (t; t < tokens.length; t++) {
                                if (tools.directions.includes(tokens[t])) {
                                    preposition = tokens[t];
                                    break;
                                };
                            };
                        };
                    };
                };
                if (_inConversation == "everyone") {
                    //don't carry this forward for next call.
                    _inConversation = null;
                };

                return {
                    category: verbs[verb].category,
                    originalVerb: inputVerbs[0] || null,
                    originalInput: input,
                    action: verb,
                    adverb: adverb,
                    subject: objects[0] || null,
                    object: objects[1] || null,
                    preposition: preposition || null
                };
            } catch (err) {
                console.error('Parser error. Input: '+input+'. Error: '+err);
                throw err;              
            };
        };


    }
    catch(err) {
	    console.error('Unable to create Lexer object: '+err);
        throw err;
    };	    
};