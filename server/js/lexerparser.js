"use strict";
//action object - manager user actions and pack/unpack JSON equivalents
module.exports.LexerParser = function LexerParser() {
    try{
        const tools = require('./tools.js');
        const customAction = require('./customaction.js');
        const fileManagerModule = require('./filemanager.js');
	    const self = this; //closure so we don't lose this reference in callbacks
        var dataFolder = '../../data/'; 
        const fm = new fileManagerModule.FileManager(true, dataFolder);

        //grammar dictionary:
        const unhandledWordsAndConjunctions = ['and', 'then', 'than', 'or', 'but', 'because', 'coz','cause','cuz', 'therefore', 'while', 'whilst', 'thing','oh'];
        const yesWords = ['y','yes','yup','yeh','yep','aye','yeah', 'yarp','ok','okay','okey','kay','sure','absolutely', 'certainly', 'definitely','exactly', 'indeed', 'right','totally', 'totes', 'true','truth','great','excellent','marvelous','fantastic','affirmed', 'confirmed','confirmation','affirmative'];
        const politeWords = ['please', 'thankyou', "thanks", 'tx', 'thx','thanx','fanks','fanx',"cheers", "sorry", "apologies"];
        const salutations = ["hello", "hi", "hey", "hiya", "ahoy", "good morning", "good afternoon", "good evening"];
        const goodbyes  =["bye", "good bye", "goodbye","seeya", "later","laters", "goodnight", "good night"]
        const noWords = ['n','no', 'nay', 'nope', 'narp', 'reject','rejected', 'rejection','deny','denied','refuse','refused', 'refusal','negative', 'negatory']
        const stopWords = ["the", "some", "a", "an", "again", "are", "any", "there", "to", "of", "is", "are"];
        const commonTypos = ["fomr", "drpo", "destry", "definately"]
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
        const questions = ['who','what','why','where','when','how','which','whose'];
        const moreQuestions = ['do you', 'have you', 'do', 'have', "pardon", "sorry"];
        const modalVerbs = ['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'];
        const verbs = fm.readFile("verb-lexicon.json");  //add  'ignore','blank','squeeze','grasp','clutch','clasp','hold','smoosh', 'smear','squish', 'chirp', 'tweet', 'bark', 'meow', 'moo','growl'
        const locationPrepositions = [
            'in', 'into', 'inside', //container or not has different context
            'onto', 'on to', 'on top of', 'on', // hook verb or object optional
            'off of', 'off', // hook verb or object optional
            'above', 'over', // not the same as on top of - need to hang on a "hook"
            'under', 'underneath',
            'below', 'beneath', // same as under unless hanging
            'behind', // if both object and subject are movable
            'between', 'beside', 'near',
            'across', 'in front of', 'through'
        ];

        const givingPrepositions = ['to', 'for', 'with', 'onto', 'on', 'on to', 'toward', 'towards'];
        const receivingPrepositions = ['from', 'by', 'at', 'in', 'out', 'out of', 'with',];
        var sharedPrepositions = ['by', 'at', 'in', 'into', 'in to'];

        //action string components
        var _inputString = "";
        var _verb = "";
        var _direction = "";
        var _splitWord = "";
        var _adverb = "";
        var _preposition = ""
        var _nouns = []; //objects and creatures (include their pronouns and adjectives for the purpose of this lexer)
        var _subject = ""; //Subject: - noun that performs the verb's action. For example, in the sentence "The dog barked," "dog" is the subject. 
        var _object = ""; //Object: - noun that receives the action of the verb. In the sentence "The dog chased the ball," "ball" is the object because it is being acted upon by the verb "chased". 

        //saved state:
        var _lastInputString = "";

        const sanitiseString = function(aString) {
            return aString.toLowerCase().substring(0,255).replace(/[^a-z0-9 +-/%]+/g,""); //same as used for client but includes "/" and "%" as well
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

        self.extractObjectsAndPrepositions = function(input) {
            let tokens = input.split(/\s+/)

            //remove firstPersonPronouns
            tokens = tokens.filter(function (value, index, array) {
                return (!(firstPersonPronouns.includes(value)))
            });

            const rest = tokens.join(' ');

            //extract and *split* on prepositions...
            //sharedPrepositions
            let sharedPreposition = tokens.filter(function (value, index, array) {
                return (sharedPrepositions.includes(value))
            });
            //receivingPrepositions
            let receivingPreposition = tokens.filter(function (value, index, array) {
                return (receivingPrepositions.includes(value))
            });
            //givingPrepositions 
            let givingPreposition = tokens.filter(function (value, index, array) {
                return (givingPrepositions.includes(value))
            });
            //locationPrepositions
            let locationPreposition = tokens.filter(function (value, index, array) {
                return (locationPrepositions.includes(value))
            });

            const allFoundPrepositions = sharedPreposition.concat(receivingPreposition.concat(givingPreposition.concat(locationPreposition)));
            //attempt to split "rest" using prepositions in order.
            let objects = [rest];
            let preposition = null;
            for (p=0; p<allFoundPrepositions.length;p++) {
                objects = rest.split(allFoundPrepositions[p]);
                if (objects.length > 1) {
                    preposition = allFoundPrepositions[p];
                    break;
                }
            };
            
            for (let o=objects.length-1; o >=0 ;o--) {
                //work backwards as we may splice if anything is null.
                objects[o] = objects[o].trim();  
                if (!objects[o]) {objects.splice(o,1);};
            };
            return {objects, preposition, rest}
   
        };

        self.removeStopWords = function(input) {
            let tokens = input.split(/\s+/)
            //remove stopWords
            tokens = tokens.filter(function (value, index, array) {
                return (!(stopWords.includes(value)))
            });  

            return tokens.join(' ');
        };

        self.parseInput = function(input) {
            input = sanitiseString(input);
            if (_inputString) {
                //remember last input
                _lastInputString = _inputString;
            };
            _inputString = input; //store for later

            const tokens = input.split(/\s+/)
            const verb = self.normaliseVerb(tokens[0]);
            if (!verb) {
                //@todo - if we don't have a recognised verb here, there's a chance we need to switch to dialogue, yes/no, please/thankyou, salutations, questions etc
                return { error: `Unknown verb: "${tokens[0]}"` };
            } else {
                _verb = verb;
            };

            let rest = tokens.slice(1).join(' ');
            rest = self.removeStopWords(rest);

            const extractedAdverbObject = self.extractAdverb(rest)
            const { adverb, remainder } = extractedAdverbObject;
            rest = remainder;

            const extractedObjectsAndPrepositions = self.extractObjectsAndPrepositions(rest);
            const { objects, preposition, rem } = extractedObjectsAndPrepositions;
            rest = rem;

            return {
                category: verbs[verb].category,
                originalVerb: tokens[0],
                originalInput: input,
                action: verb,
                adverb: adverb,
                subject: objects[0] || null,
                object: objects[1] || null,
                preposition: preposition || null,
                target: rest || null
            };

        };


    }
    catch(err) {
	    console.error('Unable to create Lexer object: '+err);
        throw err;
    };	    
};