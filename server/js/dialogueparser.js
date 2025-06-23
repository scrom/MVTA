"use strict";
//action object - manager user actions and pack/unpack JSON equivalents
module.exports.DialogueParser = function DialogueParser(lexerParser) {
    try{
	    const self = this; //closure so we don't lose this reference in callbacks

        //grammar dictionary:
        const yesWords = ['y','yes','yup','yeh','yep','aye','yeah', 'yarp','ok','okay','okey','kay','sure','absolutely', 'certainly', 'definitely','exactly', 'indeed', 'right','totally', 'totes', 'true','truth','great','excellent','marvelous','fantastic','affirmed', 'confirmed','confirmation','affirmative'];
        const politeWords = ['please', 'thankyou', "thanks", 'tx', 'thx','thanx','fanks','fanx',"cheers", "sorry", "apologies"];
        const salutations = ["hello", "hi", "hey", "hiya", "ahoy", "good morning", "good afternoon", "good evening"];
        const goodbyes  =["bye", "good bye", "goodbye","seeya", "later","laters", "goodnight", "good night"]
        const noWords = ['n','no', 'nay', 'nope', 'narp', 'reject','rejected', 'rejection','deny','denied','refuse','refused', 'refusal','negative', 'negatory']
        //original action.js stopWords = ["the", "some", "a", "an", "again"];
        const stopWords = ["the", "some", "a", "an", "again", "are", "any", "there", "is", "are"];
        const commonTypos = ["fomr", "drpo", "destry", "definately"]
        const numerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const firstPersonPronouns = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'];
        const secondPersonPronouns = ['your', 'yours', 'yourself', 'yourselves'];
        const thirdPersonPronouns = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'];
        const reflexivePronouns = ['myself', 'yourself', 'himself', 'herself', 'itself', 'themself', 'themselves'];
        const indefinitePronouns = ['someone', 'anyone', 'everybody', 'everyone', 'nobody','noone', 'no one'];
        const questions = ['who','what','why','where','when','how','which','whose'];
        const moreQuestions = ['do you', 'have you', 'do', 'have', "pardon", "sorry"];
        const modalVerbs = ['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'];

        //action string components
        var _inputString = "";

        //saved state:
        var _lastInputString = "";

        const sanitiseString = function(aString) {
            return aString.toLowerCase().substring(0,255).replace(/[^a-z0-9 +-/%]+/g,""); //same as used for client but includes "/" and "%" as well
        };

        self.parseDialogue = function(action, player, map, parsedObject) {
            input = sanitiseString(parsedObject.originalInput);
            let rest = input;
            if (_inputString) {
                //remember last input
                _lastInputString = _inputString;
            };
            _inputString = input; //store for later
            const tokens = rest.split(/\s+/)
            if (tokens[0] == parsedObject.verb) {
                tokens.splice(0,1);
            };

            //if verb was passed in then we had a recognised dialogue action from the initial input
            //otherwise we need to know what we're saying to whom.
            const objects = ["",""];
            const preposition = "";

            //extract salutations
            //extract Questions
            //extract goodbyes
            //extract platitudes
            //extract requests - which would convert to another action

        };

    }
    catch(err) {
	    console.error('Unable to create Dialogue Parser object: '+err);
        throw err;
    };	    
};