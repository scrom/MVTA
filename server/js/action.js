"use strict";
//action object - manager user actions and pack/unpack JSON equivalents
exports.Action = function Action(player, map, fileManager) {
    try{
        var tools = require('./tools.js');
        var customAction = require('./customaction.js');
	    var self = this; //closure so we don't lose this reference in callbacks
        var _resultString = '';
        var _resultJson = '';
        var _player = player; //sometimes actions impact the player
        var _map = map;
        var _fm = fileManager;

        //action string components
        var _actionString = '';
        var _lastActionString = '';
        var _verb = '';
        var _direction = '';
        var _splitWord = '';
        var _adverb = '';
        var _objects = []; //objects and creatures
        var _object0 = '';
        var _object1 = '';
        var _baseTickSize = tools.baseTickSize; //default base measure of time
        var _ticks = _baseTickSize; //assume a move passes time. Some won't - for these, ticks will be 0.
        var _skipPlayerTick = false; //use for handling cases where player action has caused ticks already.
        var _failCount = 0; //count the number of consecutive user errors
        var _awaitingPlayerAnswer = false; //initial support for asking the player questions.
        var _inConversationWith; //who is the player talking to?

	    var objectName = "Action";
        var _adverbs = [
            'angrily', 'awkwardly', 'boldly', 'bravely', 'brightly', 'briefly', 'carefully', 'cautiously',
            'closely', 'confidently', 'gently', 'gracefully', 'happily', 'honorably', 'loudly', 'losely',
            'meticulously', 'noisily', 'precisely', 'quietly', 'quietly', 'sadly', 'searchingly', 'silently',
            'silently', 'slowly', 'softly', 'strategically', 'thoroughly', 'tightly', 'quickly'
        ]; //not split words but we need to trim these out and occasionally handle them.
        var numerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        //private functions


        //private - store results in class variables
        var buildResult = function(resultDescription, imageName) {
            _resultString = resultDescription;
            _resultJson = '{"verb":"'+_verb+
                              '","object0":"'+_object0+
                              '","object1":"'+_object1+
                              '","description":"'+resultDescription+
                              '","attributes":'+_player.getClientAttributesString();
            if (imageName) {
                if (_fm){
                    //check image exists and only add to response if it does
                    if (_fm.imageExists(imageName)) {
                        _resultJson += ',"image":"'+imageName+'"';
                    };
                };
            };
            _resultJson += '}';
        };

        //- build and return result
        var returnResultAsJson = function(resultDescription, imageName) {
            buildResult(resultDescription, imageName);
            return _resultJson;
        };

        //ready for bad words to be added
        var swearCheck = function(aWord) {
            var badWords = ["fuck"]; //put any bad language you want to filter in here
            var checkWord = aWord.substring(0,4);
            if (badWords.indexOf(checkWord)>-1) { 
                 return "'"+tools.initCap(aWord)+"' to you too.<br>It's not so nice to be on the receiving end, is it.<br>Save that language for the office.";
            } else {return null;};
        };

        /*
        for a passed in string, gather the first adverb used if possible.
        there are a few cases where we need to use them but for the most part we just want to strip them out
        */
        var extractAdverb = function(aString) {
            var stringAsWords = aString.split(" ");
            for (var i=0;i<stringAsWords.length;i++) {
                var index = _adverbs.indexOf(stringAsWords[i]);
                if (index > -1) {
                    _adverb = _adverbs[index];
                    break;
                };
            };
        };

        /*
        for a passed in string, split it and return an array containing 0, 1 or 2 elements.
        each element will be either an object or creature - we'll figure out which later.
        we're using "split" and exiting on the first successful split so we'll only ever get a maximum of 2 objects
        we'll also only support one instance of each of these words - need to be cautious here
        */
        var splitRemainderString = function(aString){
            //note, any split words with spaces must be earlier than their component words!
            var splitWordArray = ['in with', 'with my', 'with', 'into my', 'into', 'in to my', 'in my', 'in to', 'onto my', 'onto', 'on to my', 'on to', 'on top of my', 'on top of', 'to my', 'to', 'from my', 'from', 'frmo', 'fomr', 'for', 'at', 'off and on', 'on and off', 'on', 'off', 'off of', 'as', 'in', 'out', 'is', 'are', 'my', 'through', 'about', 'around', 'under', 'below', 'behind', 'above', 'over',]; //the words we'll try to split on.
            for (var i=0; i<=splitWordArray.length; i++) {
                var objectPair = aString.split(' '+splitWordArray[i]+' '); //note we must pad each side with spaces to avoid substring oddities
                if (objectPair != aString) { //split successful
                    //console.debug('split using "'+splitWordArray[i]+'".');
                    _splitWord = splitWordArray[i];                  
                    return objectPair; //exit the loop early
                }; //end if

                //support case where first word of string is a "split" word
                if (aString.indexOf(splitWordArray[i]+' ') == 0) {
                    //console.debug('first word is split');
                    _splitWord = splitWordArray[i];
                    return ["",aString.substr(splitWordArray[i].length).trim()];
                };

                //support case where last word of string is a "split" word
                var endSplit = ' '+splitWordArray[i];
                if (aString.indexOf(endSplit, aString.length - endSplit.length) !== -1) {
                    //console.debug('last word is split');
                    _splitWord = splitWordArray[i];
                    return [aString.substr(0,aString.indexOf(' '+splitWordArray[i])).trim(),""];
                };

            };
            //no match, return what we started with
            //console.debug('no split');
            _splitWord = "";
            return [aString,'']; //we add in a dummy second element for now
        };
       
        //after player has performed an action, each creature in the room has an opportunuty to react
        var processCreatureTicks = function(time, map, player) {
            var resultString = "";
            if (time>0) {
                var creatures = _map.getAllCreatures();
                if (typeof(creatures) == "string") {return "";}; //mainly for stub testability - prevents crashing
                for(var i=0; i < creatures.length; i++) {
                    resultString += creatures[i].tick(time, map, player);

                    var lastCreatureSpokenTo = player.getLastCreatureSpokenTo();

                    if (lastCreatureSpokenTo && lastCreatureSpokenTo != _inConversationWith) {
                        _inConversationWith = lastCreatureSpokenTo;
                        var questionIndex = resultString.indexOf("?");
                        if (questionIndex >-1) {
                            _awaitingPlayerAnswer = true;
                        };
                    };
                };
            };
            return resultString;
        };

        var processLocationTicks = function(time, map, player) {
            var resultString = "";
            if (time>0) {
                var locations = _map.getLocations();
                if (typeof(locations) == "string") {return "";}; //mainly for stub testability - prevents crashing
                for(var i=0; i < locations.length; i++) {
                    resultString += locations[i].tick(time, map, player);
                };
            };
            return resultString;
        };

        //end private functions

        //public member functions
        self.setActionString = function(stringToSet) {
            _actionString = stringToSet;
        };

        /* an action consists of either 2 or 4 elements in the form
        [verb] [object]  or [verb] [object] with/to/from/for [object]
        a verb will always be a single word, an object may be multiple words
        if the first object is not defined, we'll try to use the last referenced object later
        e.g. "eat with fork" vs "eat bacon with fork" and "eat bacon" vs "eat"*/
        self.convertActionToElements = function(aString){

            //collect verb (first word in string)
            _verb = aString.trim().split(' ')[0].toLowerCase();

            //replace first instance of verb with '' then trim spaces
            var remainder = aString.replace(_verb,'').trim().toLowerCase();  

            //extract any adverbs and clean up afterward.
            extractAdverb(remainder);
            remainder = remainder.replace(_adverb, ""); 
            remainder = remainder.replace("  ", " ");

            //figure out split word we're looking for - with, to, from, for, at, on
            _objects = splitRemainderString(remainder);

            //only overwrite object0 if it's an object. If it's "it", we use the last object string instead.
            if (_objects[0] != 'it' && _objects[0] != 'them') {
                _object0 = " "+_objects[0]; 
            }
            _object1 = " "+_objects[1]; 

            //remove some junk words
            var stopWords = ["the", "some", "a", "an", "again"];
            for (var i=0; i<stopWords.length; i++) {
                if (_object0) {
                _object0 = _object0.replace(" "+stopWords[i]+" ", " ");
                };
                if (_object1) {
                    _object1 = _object1.replace(" "+stopWords[i]+" ", " ");
                };
            };

            _object0 = _object0.trim();
            _object1 = _object1.trim();

        };

        self.performPlayerAction = function () {
            _skipPlayerTick = false;  //assume player will tick unless set otherwise.
            var description = "";
            var actionWords = _actionString.split(" ");

            var defaultCaseAction = function() {
                //check for a custom verb and response here.
                _ticks = 0;
                if (_object0) {
                    description = _player.customAction(_verb, _object0);
                } else {
                    description = _player.customAction(_verb, _object1);
                };

                if (description) {_ticks = _baseTickSize*1;};
                //console.debug("Custom result:"+description);
                //console.debug('verb: '+_verb+' default response');
            };

            var lastVerbUsed = _player.getLastVerbUsed();
            if (lastVerbUsed == "say"||lastVerbUsed == "ask"||lastVerbUsed == "talk" || lastVerbUsed == "chat" || lastVerbUsed == "speak") {
                _inConversationWith = _player.getLastCreatureSpokenTo();
            } else {
                _inConversationWith = null;
                _player.setLastCreatureSpokenTo();
            };
            _player.setLastVerbUsed(_verb);

            //if _awaitingPlayerAnswer is true, and answer is not yes or no, restate the question.

            //attempt action (note this catches errors from bugs)
            try {
                //user commands
                switch (_verb) {
                    case '':
                        _ticks = 0;
                        description = "Sorry, I didn't hear you there. ";
                        var randomReplies = ["Can you try again?", "It's probably my fault for not listening to you properly.", "Can you try something else?", "I'm sensing that we have a communication problem here.", "Is everything ok?"];
                        var randomIndex = Math.floor(Math.random() * randomReplies.length);
                        return description + randomReplies[randomIndex];
                        break;
                    case 'try':
                    case 'attempt':
                        if (actionWords.length == 1) {description = tools.initCap(_Verb)+" what?"};
                        
                        if (actionWords.length > 1 && actionWords[0] == _verb) {
                            if (actionWords[1] == "to" || actionWords[1] == "and") {
                                //shift an extra word
                                actionWords.shift();
                            };
                            actionWords.shift();
                        };

                        //now we should be starting with a new verb...
                        if (actionWords[0].endsWith("ing")) {
                            //all present participle verbs in English end with "-ing"
                            actionWords[0] = actionWords[0].substring(-3);
                        };

                        _actionString = actionWords.join(" ");
                        description = self.processAction(_actionString);
                        break;
                    case 'i':
                        //need to ensure navigation still works with this one so only respond if there's words other than "i".
                        if (_object0 || _object1) {
                            if (_inConversationWith) {
                                _ticks = 1;
                                description = _player.say('say', _actionString, _inConversationWith, _map);
                                _player.setLastVerbUsed('say');
                            } else {
                                _ticks = 0;
                                description = "I can see you're getting frustrated but <b>I</b> know what's best for you.";
                            };
                        };
                        break;
                    case 'ok':
                        if (_inConversationWith) {
                            _ticks = 1;
                            if (_awaitingPlayerAnswer) {
                                description = _player.confirmOrDecline(true, _map);
                            } else {
                                description = _player.say('say', _actionString, _inConversationWith, _map);
                                _player.setLastVerbUsed('say');
                            };
                        } else {
                            _ticks = 0;
                            description = "OK!";
                        };
                        break;
                    case 'oh':
                        if (_inConversationWith) {
                            _ticks = 1;
                            description = _player.say('say', _actionString, _inConversationWith, _map);
                            _player.setLastVerbUsed('say');
                        } else {
                            _ticks = 0;
                            description = "Getting frustrated?";
                        };
                        break;
                    case 'thankyou':
                    case 'thanks':
                        if (_inConversationWith) {
                            _ticks = 1;
                            description = _player.say('say', _actionString, _inConversationWith, _map);
                            _player.setLastVerbUsed('say');
                        } else {
                            _ticks = 0;
                            description = "My pleasure :)";
                        };
                        break;
                    case 'n':
                        if (_inConversationWith && _awaitingPlayerAnswer) {
                            _ticks = 1;
                            description = _player.confirmOrDecline(false, _map);
                            if (tools.stringIsEmpty(description)) {
                                description = _player.say('say', _actionString, _inConversationWith, _map);
                                _player.setLastVerbUsed('say');
                            };
                        };
                        //if not in conversation and expecting a reply, they're navigating.
                        break;
                    case 'because':
                    case 'cause':
                    case 'coz':
                    case 'cuz':
                        if (_inConversationWith) {
                            _ticks = 1;
                            description = _player.say('say', _actionString, _inConversationWith, _map);
                            _player.setLastVerbUsed('say');
                        } else {
                            _ticks = 0;
                            if (_awaitingPlayerAnswer == true) {
                                description = "Whatever.";
                                _awaitingPlayerAnswer = false;
                            } else {
                                description = "Let's move on shall we?";
                                _awaitingPlayerAnswer = true;
                            };
                        };
                        break;
                    case 'no':
                        if (_inConversationWith) {
                            _ticks = 1;
                            if (_awaitingPlayerAnswer) {
                                description = _player.confirmOrDecline(false, _map);
                                if (tools.stringIsEmpty(description)) {
                                    description = _player.say('say', _actionString, _inConversationWith, _map);
                                    _player.setLastVerbUsed('say');
                                };
                            } else {
                                description = _player.say('say', _actionString, _inConversationWith, _map);
                                _player.setLastVerbUsed('say');
                            };
                        } else {
                            _ticks = 0;
                            if (_awaitingPlayerAnswer == true) {
                                description = "Meh. OK.";
                                _awaitingPlayerAnswer = false;
                            } else {
                                description = "Are you arguing with me?";
                                _awaitingPlayerAnswer = true;
                            };
                        };
                        break;
                    case 'y':
                    case 'sure':
                        _verb = "yes";
                        _actionString = _verb + _actionString.substr(1);
                    case 'yes':
                        if (_inConversationWith) {
                            _ticks = 1;
                            if (_awaitingPlayerAnswer) {
                                description = _player.confirmOrDecline(true, _map);
                            } else {
                                description = _player.say('say', _actionString, _inConversationWith, _map);
                                _player.setLastVerbUsed('say');
                            };
                        } else {
                            _ticks = 0;
                            if (_awaitingPlayerAnswer == true) {
                                var randomReplies = ["Are you sure about that?", "Let's do this!", "OK.", "Really?", "Good for you!", "I'm not sure what else I can do for you right now. Let's just move on."];
                                var randomIndex = Math.floor(Math.random() * randomReplies.length);
                                description = randomReplies[randomIndex];
                                _awaitingPlayerAnswer = false;
                            } else {
                                description = "I'm sorry, I hadn't realised I asked you a question. Let's just get on with things shall we?";
                                _awaitingPlayerAnswer = false;
                            };
                        };
                        break;
                    case 'please':
                        if (actionWords.length > 1 && actionWords[0] == _verb) {
                            actionWords.shift();
                            _actionString = actionWords.join(" ");
                            description = self.processAction(_actionString);
                            break;
                        };

                        description = "I like it when you beg.";
                         break;
                    case 'cheat':
                        description = "Hmmm. I'm sure I heard about some cheat codes somewhere...<br><br>...Nope, I must have imagined it.<br>Looks like it's just you and your brain for now.";
                        break;
                    case 'help':
                        _ticks = 0;
                        if (_failCount >= 3) {
                            _failCount = 0;
                            description = "It looks like you're still struggling to be understood. Here's some help for you...<br>";
                        } else {
                            description = "Stuck already? Ok...";
                        };
                        description += "<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i> etc.<br>" +
                            "You can interact with objects and creatures by supplying a <i>verb</i> and the <i>name</i> of the object or creature. e.g. <i>'get sword'</i> or <i>'eat apple'</i>.<br>" +
                            "You can also <i>'use'</i> objects on others (and creatures) e.g. <i>'give sword to farmer'</i>, <i>'hit door with sword'</i> or <i>'put key in box'</i>.<br>" +
                            "<br>Two of the most useful verbs to remember are <i>'look'</i> and <i>'examine'</i>.<br>" +
                            "In general I understand a fairly limited set of interactions (and I won't tell you them all, that'd spoil the fun) but hopefully they'll be enough for you to enjoy something more than a minimum viable adventure.<br>" +
                            "<br>To find out more about how you're doing, try <i>'stats'</i> or <i>'status'</i><br>" +
                            "In many cases, your positive or negative interactions within the game may impact how others respond to you, use this knowledge wisely.<br>" +
                            "<br>You can save your progress by entering <i>'save'</i>.<br>You can return to a previously saved point from <i>this</i> session by simply typing <i>restore</i><br>You can load a previously saved game by entering '<i>load filename-x</i>' (where <i>filename-x</i> is the name of your previously saved game file.)<br>" +
                            "If you've really had enough of playing, you can enter <i>quit</i> to exit the game (without saving).<br>";
                        break;
                    case 'map':
                        _ticks = 0;
                        description = "Oh dear, are you lost? This is a text adventure you know.<br>Time to get some graph paper, a pencil and start drawing!";
                        break;
                    case 'triage':
                    case 'health':
                        if (_object0) {
                            description = _player.checkCreatureHealth(_object0);
                        } else {
                            _ticks = 0;
                            description = _player.health();
                        };
                        break;
                    case 'heal':
                        _ticks = 1;
                        description = _player.healCharacter(_object0);
                        break;
                    case 'stats':
                    case 'statistics':
                    case 'score':
                    case 'points':
                        _ticks = 0;
                        description = _player.stats(_map);
                        break;
                    case 'status':
                    case 'tasks':
                    case 'missions':
                    case 'quests':
                        _ticks = 0;
                        description = _player.status(_map.getMaxScore());
                        break;
                    case 'visits':
                        _ticks = 0;
                        description = _player.getVisits();
                        break;
                    case 'inv':
                    case 'inventory':
                        _ticks = 0;
                        description = _player.describeInventory();
                        break;
                    case 'l':
                        _direction = "l";
                        break;
                    case 'show':
                    case 'look':
                    case 'stare':
                    case 'check':
                    case 'peer':
                        //trap a few junk words - will return "look" with no object. 
                        var junkWords = ["exits", "objects", "artefacts", "creatures", "artifacts"]
                        if (junkWords.indexOf(_object0) > -1) { _object0 = null; };
                        if (!_object0 && !_object1) {
                            //if just looking around, use a little less time.
                            _ticks = 1;
                        };
                        if (_object0 == "inventory") {
                            _ticks = 0;
                            description = _player.describeInventory();
                        } else if (_object0 && _object1) {
                            //e.g. "examine sugar in cup"
                            description = _player.examine(_verb, _object0, _object1, _map);
                        } else if (_object1) {
                            //if player enters "look at x", we'll have an object 1 (but no object 0). in this case we'll "examine" instead.

                            var positionIndex = tools.positions.indexOf(_splitWord);
                            if ((positionIndex > -1) ||(_adverb == "closely" || _adverb == "carefully" || _adverb == "thoroughly" || _adverb == "meticulously")) {
                                //support "look under", "look behind" and "look in" etc.
                                if (_adverb) {_verb = _verb+" "+_adverb;};
                                if (positionIndex == -1) { _ticks = _baseTickSize*3; }; //full search takes longer
                                
                                if ((_verb == "stare" ||_verb == "look" || _verb == "peer") && _splitWord == "over") {
                                    description = _player.examine(_verb + " " + _splitWord, _object1, null, _map);
                                } else {
                                    description = _player.search(_verb, _object1, _adverb, _splitWord);
                                };
                            } else {
                                description = _player.examine(_verb+" "+_splitWord, _object1, null, _map);
                            };
                        } else {
                            description = _player.examine(_verb, _object0, null, _map);
                        };
                        break;  
                    case 'inspect': 
                    case 'investigate':
                    case 'search':  
                        _ticks = _baseTickSize*3; //random searching takes a while! - look under/behind x is faster
                        //would like to add "search for x" support here in future.  
                        if (!_object0) {
                            description = _player.search(_verb, _object1, _adverb, _splitWord);
                        } else {            
                            description = _player.search(_verb, _object0);
                        };
                        break;
                    case 'ex':
                    case 'x':
                    case 'examine':
                    case 'exam':
                    case 'examin':
                    case 'examien':
                    case 'browse':
                    case 'lookat':
                        if (_verb != "browse") { _verb = "examine";};
                        _player.setLastVerbUsed('examine');
                        if (_object0 && _object1) {
                            //e.g. "examine sugar in cup"
                            description = _player.examine(_verb, _object0, _object1, _map);
                        } else if (tools.positions.indexOf(_splitWord) > -1) {
                            //support "examine under", "examine behind" and "examine in" etc.
                            description = _player.search(_verb, _object1, _adverb, _splitWord);
                        } else if (_adverb == "closely" || _adverb == "carefully" || _adverb == "thoroughly" || _adverb == "meticulously") {
                            _ticks = _baseTickSize * 3; //full search takes longer
                            description = _player.search(_verb, _object0,  _adverb, _splitWord);
                        } else if (_splitWord == "my") {
                            if (!_object0) {
                                _object0 = _object1;
                            };
                            description = _player.examine(_verb, _object0, _splitWord, _map);
                        } else {
                            description = _player.examine(_verb, _object0, null, _map);
                        };
                        break;  
                    case 'where':    
                    case 'hunt':                               
                    case 'find': 
                        if (_inConversationWith) {
                            _ticks = 1;
                            var objectToFind = _object0 + _object1;
                            _player.setLastVerbUsed('say');    
                            return player.say("say", "find " + objectToFind, _inConversationWith, _map);
                        } else { 
                            _ticks = _baseTickSize * 2;
                            //if player enters "search for x", we'll have an object 1 (but no object 0).
                            if (!(_object0)) {_object0 = _object1};                                     
                            description = _player.hunt(_verb, _object0, map);                            
                        };
                        break;
                    case 'follow':
                    case 'chase':
                    case 'pursue':
                    case 'track':
                    case 'tail':
                        if (!(_object0)) { _object0 = _object1 };
                        description = _player.follow(_verb, _object0, map);
                        break;
                    case 'rest':
                    case 'sit':
                    case 'zz':
                        _ticks = 7; //player ticks are handled within rest routine but full game ticks are also needed.
                        _skipPlayerTick = true;
                        description = _player.rest("rest", 7, _map);
                        break;
                    case 'sleep':
                    case 'nap':
                    case 'zzz':
                        _skipPlayerTick = true;
                        _ticks = 25; //player ticks are handled within rest routine but full game ticks are also needed.
                        description = _player.rest("sleep", 25, _map);
                        break;
                    case 'wait':
                    case 'z':
                        description = _player.wait(1, map); //wait count, not ticks
                        break;
                    case 'have':
                        if (_object0 == "break" || _object0 == "rest") {
                            _ticks = 7; //most ticks are handled within rest routine but last one should cause a full game tick
                            description = _player.rest("rest", 7, _map);
                            break;
                        } else if (_object0 == "nap" || _object0 == "power nap" || _object0 == "sleep") {
                            _ticks = 25; //most ticks are handled within rest routine but last one should cause a full game tick
                            description = _player.rest("sleep", 25, _map);
                            break;
                        };
                        break; //don't handle any other "have" actions for now.
                    case 'put':
                        //special case for "put down"
                        var originalObject0 = _object0;
                        _object0 = _object0.replace("down ","");       
                        _object0 = _object0.replace(" down","");

                        if (originalObject0 != _object0) {
                            _ticks = 1;
                            _verb = 'put down';
                            description = _player.drop(_verb, _object0, _map);
                            break;
                        };

                        //next special case for put out
                        if (_splitWord == "out") {
                            if (!_object0) {
                                _object0 = _object1;
                            };
                            _ticks = 1;
                            description = _player.turn(_verb, _object0, 'out');
                            break;
                        };

                        //or fall through to normal "put"
                    case 'hide':
                    case 'balance':
                    case 'place':
                        if (tools.positions.indexOf(_splitWord) > -1) {
                            //put or hide an item on/under/behind x
                            _ticks = 3;
                            description = _player.put(_verb, _object0, _splitWord, _object1);
                            break;
                        };
                    case 'attach':
                    case 'hang':
                    case 'hook':
                    case 'stick':
                        //I'd like to do something smarter with sticking items to others - they're on the surface, not in them.
                    case 'combine':
                    case 'install':
                    case 'insert':
                    case 'join':
                    case 'add':
                    case 'mix':
                    case 'pour':
                        description = _player.put(_verb, _object0, _splitWord, _object1);
                        break;
                    case 'fill':
                        description = _player.put(_verb, _object1, _splitWord, _object0);
                        break;
                    case 'empty':
                        _ticks = 1;
                        description = _player.empty(_verb, _object0, _splitWord, _object1);
                        break;
                    case 'water':
                        //either "water plant" or "water plant with milk"
                        //in future, "water horse" would translate to feed water to horse"
                        _verb = "pour";
                        if (!(_object1)) { _object1 = "water";};

                        var tempObject = _object0;
                        _object0 = _object1; //water or other fluid
                        _object1 = tempObject; //actual object to be watered
                        description = _player.put(_verb, _object0, "over", _object1);
                        break;
                    case 'offer':
                    case 'give':
                    case 'present':                   
                    case 'hand':
                    case 'feed': //give food or drink to creature (if specific food not specified, use lowest value)
                            description = _player.give(_verb, _object0, _splitWord, _object1);
                        break;
                    case 'throw':
                    case 'chuck':
                    case 'hurl':
                    case 'yeet':
                    case 'lob':
                        if (tools.directions.indexOf(_object0) > -1) {
                            _ticks = 0;
                            description = "I'm sorry, "+_verb+" what now?";
                            break;
                        }

                        if (_object0 && _splitWord == "at" && _object1) {
                            //throw x at y
                            _ticks = 1;
                             description = _player.hit (_verb, _object1, _object0);
                             break;
                        };
                        //fall through...
                    case 'drpo': //common user typo
                    case 'drop'://add support for "all" later
                    case 'discard':
                    case 'dump':
                        if (_verb == "drpo") { _verb = "drop";};
                        if (_object0 && _splitWord && _object1) {
                            if (_splitWord == "in"||_splitWord == "into"||_splitWord == "in to") {
                                description = _player.put(_verb, _object0, "into", _object1);
                                break;
                            } else { _object0 = _object0+" "+_splitWord+" "+_object1;};
                        };
                        _ticks = 1;
                        description = _player.drop(_verb, _object0, _map);
                        //we're throwing the object *at* something. Use it as a weapon.
                        //this needs work
                        //if ((_verb == 'throw') && _object1) {
                        //    description += _player.hit(_verb,_object1,_object0);
                        //};
                        break;
                    case 'move':
                        //"move" may be either navigation or moving an item...

                        //translate to "move north" etc. Overwrite the verb with direction. 
                        //this will fall through to navigation later.
                        if (tools.directions.indexOf(_object0) > -1) {
                            _direction = _object0;
                            break;
                        };

                        //if player enters "move to x", we'll have an object 1 (but no object 0).
                        if (!_object0) {
                            if (_object1) {
                                if (tools.directions.indexOf(_object1) > -1) {
                                    _direction = _object1;
                                    break;
                                };
                            };
                        };

                        //is the player moving something to somewhere?
                        //rewrite the action as "put"
                        if (_object1) {
                            description = "$action put "+_object0+" "+_splitWord+" "+_object1;     
                            break;                       
                        };

                        //if we've got to here the player isn't navigating somewhere
                        //fall through to "shove"
                    case 'shove':
                    case 'press':
                    case 'tap':
                    case 'push':
                    case 'nudge':
                    case 'prod':
                    case 'poke':
                    case 'jostle':
                        _ticks = 1;              
                        description = _player.shove(_verb, _object0);
                        break;

                    case 'pull':
                    case 'drag':
                    case 'tow':
                    case 'hoist':
                    case 'lift':
                    case 'heave':
                    case 'haul':
                    case 'yank':
                    case 'unfurl':
                    case 'open':
                        _ticks = 1;
                        description = _player.open(_verb, _object0);
                        //don't consume time if already open
                        if (description.indexOf("already") > -1) {
                            _ticks = 0;
                        };
                        break;
                    case 'shut':
                    case 'close':
                    case 'furl':
                    case 'lower':
                    case 'fold':
                    case 'roll':
                    case 'seal':                   
                        _ticks = 1;
                        description = _player.close(_verb, _object0);
                        break;
                    case 'drink':
                    case 'quaff':
                    case 'neck':
                    case 'gulp':
                        _ticks = 1;
                        description = _player.drink(_verb, _object0);
                        break;
                    case 'bite':
                    case 'chew':
                    case 'feast':
                    case 'nibble':
                    case 'eat':
                    case 'lick':
                    case 'taste':
                    case 'swallow':
                    case 'gobble':
                    case 'devour':
                    case 'consume':
                    case 'munch':
                    case 'snack':
                    case 'chomp':
                    case 'gorge':
                    case 'wolf':
                    case 'snarf':                        
                        _ticks = 1;
                        if (_object1) {description = _player.eat(_verb+" "+_splitWord,_object1);}
                        else {description = _player.eat(_verb, _object0);};
                        break;
                    case 'shake':
                    case 'rattle':
                        _ticks = 1;
                        description = _player.shake(_verb, _object0);
                        break;
//////Conversion to new engine reached here
                    case 'nerf':
                    case 'shoot':
                    case 'fire':
                    case 'blast':
                    case 'zap':
                    case 'attack':
                    case 'smash':
                    case 'bash':
                    case 'beat':
                    case 'stab':
                    case 'slice':
                    case 'slash':
                    case 'whack':
                    case 'whip':
                    case 'cut':
                    case 'hurt':
                    case 'hit':
                    case 'slap':
                    case 'smack':
                    case 'punch':
                    case 'kick':
                    case 'swing':
                    case 'whack':
                    case 'thump':
                    case 'thwack':
                    case 'thwok':
                    case 'thwomp':
                    case 'strangle':
                    case 'choke':
                    case 'throttle':
                    case 'garrotte':
                    case 'garotte':
                        _ticks = 1;
                        if (_object0 && _splitWord == "on" && _object1) {
                            //smash bottle on floor
                            description = _player.hit(_verb, _object1, _object0);
                            break;
                        };
                        description = _player.hit(_verb, _object0, _object1);
                        break;
                    case 'pay':
                        description = _player.pay(_verb, _object0, _object1, _map);
                        break;
                    case 'buy':
                        description = _player.buy(_verb, _object0, _object1);
                        break;
                    case 'sell':
                        description = _player.sell(_verb, _object0, _object1);
                        break;
                    case 'pick':
                        //special case for "pick up"
                        var originalObject0 = _object0;
                        _object0 = _object0.replace("up ","");       
                        _object0 = _object0.replace(" up","");

                        if (originalObject0 != _object0) {
                            _ticks = 1;
                            _verb = 'pick up';
                            description = _player.take(_verb, _object0, _splitWord, _object1);
                            break;
                        }

                        //pick locked item...
                        description = _player.unlock(_verb, _object0);
                        break;
                        
                    case 'get':
                        _ticks = 1;
                        if (_splitWord == "off") {
                            if (!(_object0)) {
                                if (_object1.indexOf("of ") ==0) {
                                    _object1 = _object1.substr(3);
                                };
                                return self.processAction("dismount "+_object1);
                            };
                        };
                        if (_splitWord == "in"||_splitWord == "into"||_splitWord == "in to") {
                            if (!(_object0)) {
                                return self.processAction("enter "+_object1);
                            };
                        };
                        if (_splitWord == "on" || _splitWord == "onto" || _splitWord == "on to") {
                            if (!(_object0)) {
                                return self.processAction("climb "+_splitWord+" "+_object1);
                            };
                        };
                        if (_object0 == "in" && (!_object1)) {
                            _direction = 'in';
                            break;
                        };
                        if ((_splitWord == "out" && (!_object0) && _object1.indexOf("of ") >-1) ||(_object0 == "out" && (!_object1))) {
                            _direction = 'out';
                            //console.debug( _object0.indexOf("of "))
                            //note, if person types "get out of x"
                            break;
                        };
                    case 'take':
                        if (_object0.substr(0, 6) == "apart ") {
                            description = _player.dismantle(_verb + " apart", _object0.replace("apart ", ""));
                            break;
                        } else if (_object0 == "break" || _object0 == "rest") {
                            _ticks = 7; //most ticks are handled within rest routine but last one should cause a full game tick
                            description = _player.rest("rest", 7, _map);
                            break;                            
                        } else if (_object0 == "nap" || _object0 == "power nap" || _object0 == "sleep") {
                            _ticks = 25; //most ticks are handled within rest routine but last one should cause a full game tick
                            description = _player.rest("sleep", 25, _map);
                            break;                              
                        };
                        //fall through to other "take" actions
                    case 'grab':
                    case 'collect':
                    case 'remove':
                    case 'make':
                        _ticks = 1;
                        description = _player.take(_verb, _object0, _splitWord, _object1); 
                        break;
                    case 'dismantle':
                    case 'disarm':
                        description = _player.dismantle(_verb, _object0);
                        break;
                    case 'mug':
                        _ticks = 1;
                        if ((!(_object1)) || (_object1 == "")) {
                            _object1 = _object0;
                            _object0 = "";
                        };
                    case 'steal':
                        _ticks = 1;
                        description = _player.steal(_verb, _object0, _object1);            
                        break;
                    case 'borrow':
                        _ticks = 1;
                        //like ask but borrow object from person rather than ask person for object...
                        description = _player.ask(_verb, _object1, _object0);            
                        break;
                    case 'tell':
                        _ticks = 0;
                        description = "We <i>ask</i> people things here, we don't <i>tell</i>.";
                        break;
                    case 'ask':
                    //case 'request':
                    //case 'beg':
                        _ticks = 1;
                        //console.debug("split: "+_splitWord);
                        if (_splitWord == "is"||_splitWord == "to"|| _splitWord == "are") {
                            //check for "ask x to find y" or "ask x where y is" or "ask x where is y";
                            if (_actionString.indexOf(" find ") >-1) {
                                _object1 = _object1.replace("find ","")
                                _object1 = _object1.replace(" a ", " ");
                                _object1 = _object1.replace(" the ", " ");
                                _object1 = _object1.replace(" some ", " ");
                                _object1 = _object1.trim();
                                description = _player.ask("find", _object0, _object1.trim(), _map); 
                                break;   
                            };
                            if (_actionString.indexOf(" where ") >-1) {
                                var objectPair = _actionString.split(" where ");
                                _object0 = objectPair[0].replace("ask ","");
                                _object0 = _object0.trim();
                                _object1 = objectPair[1];
                                _object1 = " "+_object1+" ";
                                _object1 = _object1.replace(" is ", "");
                                _object1 = _object1.replace(" are ", "");
                                _object1 = _object1.replace(" to ", "");
                                _object1 = _object1.replace(" a ", " ");
                                _object1 = _object1.replace(" the ", " ");
                                _object1 = _object1.replace(" some ", " ");
                                _object1 = _object1.trim();
                                //console.debug("O0: "+_object0+"O1:"+_object1);
                                description = _player.ask("find", _object0.trim(), _object1.trim(), _map);
                                break;
                            };
                            if (_actionString.indexOf(" repair ") >-1 || _actionString.indexOf(" fix ") >-1) {
                                _object1 = _object1.replace("repair ","");
                                _object1 = _object1.replace("fix ","");
                                _object1 = _object1.replace(" a ", " ");
                                _object1 = _object1.replace(" the ", " ");
                                _object1 = _object1.replace(" some ", " ");
                                _object1 = _object1.trim();
                                _object1 = _object1.trim();
                                //console.debug("O0: "+_object0+"O1:"+_object1);
                                description = _player.ask("repair", _object0.trim(), _object1.trim(), _map);
                                break;
                            };
                            //check for "ask x to go y" or "ask x to go to y"
                            if (_actionString.indexOf(" go ") >-1) {
                                var objectPair = _actionString.split(" to go ");
                                _object0 = objectPair[0].replace("ask ","");
                                _object0 = _object0.trim();
                                _object1 = objectPair[1];
                                _object1 = " "+_object1+" ";
                                _object1 = _object1.replace(" to ", "");
                                _object1 = _object1.trim();
                                //console.debug("O0: "+_object0+"O1:"+_object1);
                                description = _player.ask("go", _object0.trim(), _object1.trim(), _map);
                                break;
                            };
                            //check for "ask x to wait"
                            _actionString += " ";
                            if (_actionString.indexOf(" wait ") >-1) {
                                var objectPair = _actionString.split(" to wait ");
                                _object0 = objectPair[0].replace("ask ","");
                                _object0 = _object0.trim();
                                _object1 = objectPair[1];
                                _object1 = " "+_object1+" ";
                                _object1 = _object1.replace(" to ", "");
                                _object1 = _object1.trim();
                                //console.debug("O0: "+_object0+"O1:"+_object1);
                                description = _player.ask("wait", _object0.trim(), _object1.trim(), _map);
                                break;
                            };

                        } else if (_splitWord == "" && _actionString.indexOf(" where ") >-1) {
                            var objectPair = _actionString.split(" where ");
                            _object0 = objectPair[0].replace("ask ","");
                            _object0 = _object0.trim();
                            _object1 = objectPair[1];
                            _object1 = " "+_object1+" ";
                            _object1 = _object1.replace(" the ", " ");
                            _object1 = _object1.replace(" some ", " ");
                            _object1 = _object1.replace(" can i find ", " ");
                            _object1 = _object1.replace(" find ", " ");
                            _object1 = _object1.replace(" can i put ", " ");
                            _object1 = _object1.replace(" put ", " ");
                            _object1 = _object1.replace(" can i get ", " ");
                            _object1 = _object1.replace(" get ", " ");
                            _object1 = _object1.replace(" can i ", " ");
                            _object1 = _object1.replace(" does ", " ");
                            _object1 = _object1.replace(" should i ", " ");
                            _object1 = _object1.replace(" should ", " ");
                            _object1 = _object1.replace(" sit ", " ");
                            _object1 = _object1.replace(" live ", " ");
                            _object1 = _object1.replace(" lives ", " ");
                            _object1 = _object1.replace(" belong ", " ");
                            _object1 = _object1.replace(" reside ", " ");
                            _object1 = _object1.replace(" i ", " ");
                            _object1 = _object1.trim();
                            description = _player.ask("find", _object0.trim(), _object1.trim(), _map);
                            break;
                        };

                        description = _player.ask(_verb, _object0, _object1, _map);            
                        break;
                    case 'wave':
                        _ticks = 1;
                        description = _player.wave(_verb, _object0, _object1);
                        break;
                    /*
                    case 'squeeze':
                    case 'grasp':
                    case 'clutch':
                    case 'clasp':
                    case 'hold':
                    */
                    /*
                    case 'smoosh':
                    case 'smear':
                    case 'squish':
                    */
                    case 'touch':
                    case 'feel':                        
                    case 'pat':                        
                    case 'stroke':
                    case 'caress':                 
                    case 'pet':
                    case 'hug':
                    case 'embrace':
                    case 'cuddle':
                    case 'snuggle':
                    case 'nuzzle':
                        //see #270 - either activate something (like press) - or return a texture description in some cases.
                        description = _player.touch(_verb, _object0);
                        break;
                    case 'rub':
                    case 'polish':
                    case 'buff':
                    case 'sharpen':
                    case 'sharp':
                    case 'smooth':
                        description = _player.rub(_verb, _splitWord, _object0, _object1);
                        break;
                    case 'think':
                    case 'imagine':
                    case 'dream':
                    case 'visualise':
                    case 'visualize':
                    case 'conceptualise':
                    case 'conceptualize':
                    case 'envision':
                    case 'envisage':          
                    case 'picture':
                        description = _player.think(_verb, _splitWord, _object0, _object1, _actionString);
                        break;
                    case 'talk':
                    case 'tal':
                    case 'tak':
                    case 'takl':
                    case 'tslk':
                    case 'chat':
                    case 'speak':

                        if (_verb != "chat") { _verb = "talk";};
                        _ticks = 1;
                        //we assume "talk to x" - if "to" is missing, handle speech anyway.
                        if (tools.stringIsEmpty(_object1) && (!(tools.stringIsEmpty(_object0)))) {
                            _object1 = _object0;
                            _object0 = null;
                        };
                        //fall through to "say"
                    case 'say':
                    case 'reply':
                    case 'sing':
                    case 'shout':
                    case 'scream':
                    case 'howl':
                    case 'yell':
                    case 'squeal':
                    case 'squeak':
                        _ticks = 1;
                        if (!_object0 && _splitWord == "for") {
                            //e.g. "shout for help"
                            _object0 = _object1;
                            _object1 = null;
                        };
                        description = _player.say(_verb, _object0,_object1, _map);
                        _player.setLastVerbUsed('say');
                        break;
                    case 'greet':
                    case 'hello':
                        _ticks = 1;
                        if (_inConversationWith && !_object0) {
                            _object0 = _inConversationWith;
                        };
                        description = _player.say('greet', "Hello",_object0, _map);
                        _player.setLastVerbUsed('say');    
                        break;
                    case 'hi':
                    case 'hey':
                        _ticks = 1;
                        if (_inConversationWith && !_object0) {
                            _object0 = _inConversationWith;
                        };
                        description = _player.say('greet', "Hi",_object0, _map); 
                        _player.setLastVerbUsed('say');   
                        break;
                    case 'bye':
                        _ticks = 0;
                        if (_inConversationWith && !_object0) {
                            _object0 = _inConversationWith;
                        };
                        description = _player.say('say', "Bye",_object0, _map);    
                        break;
                    case 'good':
                        _ticks = 0;
                        description = _player.say('say', _actionString,_inConversationWith, _map);
                        _player.setLastVerbUsed('say');    
                        break;
                    case 'goodbye':
                        _ticks = 0;
                        description = _player.say('say', "Goodbye",_object0, _map);   
                        break;
                    case 'straight':
                    case 'straight-on':
                    case 'forward':
                    case 'f':
                    case 'onward':
                        _direction = "c";
                        break;
                    case 'run': //enhance run to move faster but to burn through energy faster too. //1 tick?
                    case 'walk': //use baseticksize
                    case 'jog':
                    case 'hike':  //use baseticksizex2
                    case 'sneak': //do something smart with sneak use baseticksizex2
                    case 'dash':  //as run
                    case 'sprint': //enhance sprint to move faster Still but to burn through energy faster too. //0 ticks but use energy
                    case 'crawl': //use baseticksizex2
                    case 'slink': //use baseticksizex2
                    case 'climb': //use baseticksizex2
                    case 'clamber':
                    case 'head':
                    case 'go':
                        _ticks = 1;
                        //translate to "go north" etc. Overwrite the verb with direction. 
                        //this will fall through to navigation later.
                        //if player enters "go to x" or "climb on x", we'll have an object 1 (but no object 0).
                        if (_object1) {
                            if (tools.directions.indexOf(_object1) > -1) {
                                _direction = _object1;
                            } else {
                                if (_splitWord == "out" && _object1.indexOf("of ") == 0) {
                                    _object1 = _object1.replace("of ", "");
                                };
                                description = _player.goObject(_verb, _splitWord, _object1, _map);
                            };
                        } else if (_object0) {
                            if (tools.directions.indexOf(_object0) > -1) {
                                _direction = _object0;
                            } else {
                                description = _player.goObject(_verb, _splitWord, _object0, _map);
                            };
                        } else {
                            description = tools.initCap(_verb)+" where?";
                        };
                        break;
                    case 'explore':
                        description = "Which direction do you want to go?"
                        break;
                    case 'exit':
                    case 'leave':
                    case 'depart':
                        //overwrite the verb with direction. 
                        //this will fall through to navigation later.                                        
                        _direction = 'out';
                        break;
                    case 'enter':
                        //overwrite the verb with direction. 
                        //this will fall through to navigation later.                                        
                        _direction = 'in';
                        break;
                    case 'unlock':
                        description = _player.unlock(_verb, _object0);
                        break;
                    case 'lock':
                        description = _player.lock(_verb, _object0);
                        break;
                    case 'destry': //common user typo
                    case 'destroy':
                    case 'break':
                    case 'force':
                    case 'pry':
                    case 'crack':
                    case 'damage':
                        if (_verb == "destry") { _verb = "destroy";};
                        _object0 = " "+_object0+" ";
                        _object0 = _object0.replace(" open ", "").trim();
                        _object0 = _object0.replace(" into ", "").trim();
                        if (tools.stringIsEmpty(_object0)) {
                            _object0 = _object1;
                        };
                        description = _player.breakOrDestroy(_verb, _object0);
                        break;
                    case 'kill':
                        description = "Much as you may like to believe in instant karma. If you <b>have</b> to kill, you'll need to fight it out yourself."
                        break;
                    case 'on':
                    case 'off':
                        _ticks = 1;
                        return self.processAction("turn "+_actionString);
                        break;
                    case 'turn': //turn on/off or rotate
                    case 'flip':
                    case 'rotate':
                    case 'switch': //(this is a special one) - could be switch off light or switch light on.
                        //if player enters "switch on x", we'll have an object 1 (but no object 0).
                        _ticks = 1;
                        if ((!_object0) && (_object1)) {
                            description = _player.turn(_verb,_object1,_splitWord);
                        } else if (_object0 && _object1) {
                            description = _player.turn(_verb,_object0,_object1);
                        } else {
                            description = _player.turn(_verb, _object0,_splitWord);
                        };                    
                        break;
                    case 'ignite':
                    case 'burn'://see #299 - relies on having either an ignition source or something else already burning.
                        //@todo implement proper burn support
                        //description = _player.burn(_verb, _object0);
                        //break;
                    case 'light':
                        _ticks = 1;
                        description = _player.turn('light', _object0, 'on');
                        break;
                    case 'extinguish':
                    case 'unlight':
                        _ticks = 1;
                        description = _player.turn('extinguish', _object0,'out');
                        break;
                    case 'blow':
                        //special case for "blow out"
                        if (_splitWord == "out") {
                            if (!_object0) {
                                _object0 = _object1;
                            };
                            _ticks = 1;
                            description = _player.turn(_verb, _object0, 'out');
                        };
                        //@todo - handle blow up, on, over
                        break;
                    case 'reda':
                    case 'read':
                    case 'study':
                        if (_verb == "reda") { _verb = "read"};
                        _ticks = _baseTickSize*7; //studying takes time!
                        description = _player.read(_verb, _object0, _map);
                        break;
                    case 'repair':
                    case 'mend':
                    case 'fix':
                        _ticks = _baseTickSize * 3;
                        description = _player.repair(_verb, _object0);
                        break;
                    case 'use':
                        var newVerb = _player.use(_verb, _object0);
                        if (newVerb) {
                            newVerb = newVerb.trim();
                        }
                        else {
                            //just in case it comes back undefined.
                            newVerb = "";
                        };
                        if (newVerb.indexOf("$result$") > -1) {
                            //we got a custom result back
                            description = newVerb.replace("$result$","");
                        } else {
                            if (newVerb.indexOf("$action") > -1) {
                                //strip out any instances of $action
                                //we already don't have $result$ so has to be an action already
                                newVerb = newVerb.replace("$action","").trim();
                            };

                            if (newVerb == 'use') {newVerb = 'examine'}; //avoid infinite loop
                        
                            //replace verb but keep original object
                            self.setActionString(_actionString.replace('use',newVerb));

                            //if default action is more than just a single word verb, overwrite the entire original action.
                            if (newVerb.indexOf(' ') >-1) {
                                self.setActionString(newVerb);  
                            };                     
                        
                            return self.processAction(_actionString);
                        };
                        break;
                    case 'kiss':
                    case 'smooch':
                    case 'snog':
                    case 'suck':
                    case 'hug': // enhance to handle consensual hugs?
                    case 'squeeze':
                    case 'wink':
                        _ticks = 0;
                        description = "That's a slightly over-friendly thing to do don't you think?<br>It won't actually make you any more popular either.";
                        break;
                    case 'jump':
                        _ticks = 1;
                        var index = tools.positions.indexOf(_splitWord);
                        if (!_object0 && _object1 && ((0 <= index && index < tools.onIndex) || _splitWord == "off" || _splitWord == "off of" )) {
                            //player is trying "jump on, over or off of"
                            description = _player.goObject(_verb, _splitWord, _object1, _map);
                        } else if (_object0) {
                            description = _player.goObject(_verb, "over", _object0, _map);
                        } else {
                            description = "You jump up and down repeatedly on the spot.<br>Other than making you feel slightly foolish and out of breath, nothing happens.";
                        };
                        break;
                    case 'who':
                        //if we have met the character, return what their job/role is.
                        //if we are in conversation and the character likes or dislikes the one we mention, return an appropriate response (along with their job/role)
                    case 'what':
                    case 'whats':
                        // handle "what's wrong with x" "or what is up with X" etc. - identify if broken, missing something, switched off
                        // handle "what does character do", "what is their job" -  return what their job/role is
                        // handle "what is X doing" - return their destination and whether or not they are waiting for you do do anything for them.
                    case 'why':
                    case 'whys':
                        //handle "why is the coffee machine broken/not working" - identify if broken, missing something, switched off
                    case 'when':
                        //if there's something with an active timer that player is "aware" of, return a time.
                    case 'how':
                        if (_verb.substr(_verb.length - 1) == "s") {
                            _verb = _verb.substr(0, _verb.length - 1);
                        };
                        if (!_inConversationWith) {
                            _ticks = 0;
                            description = tools.initCap(_verb)+" indeed...<br><br>Only <i>you</i> have the power to find out all there is to know here.";
                            break;
                        };
                    case 'good':
                    case 'pardon':
                    case 'sorry':
                        _ticks = 1;
                        if (_inConversationWith) {
                            description = _player.say('say', _actionString,_inConversationWith, _map);
                            _player.setLastVerbUsed('say');
                        };
                        break;
                    case 'draw':
                    case 'sketch':
                    case 'write':
                    case 'scribble':
                    case 'doodle':
                    case 'scrawl':
                        description = _player.writeOrDraw(_verb, _object0, _object1);
                        break;
                    case 'sign':
                    case 'autograph':
                    case 'signature':
                    case 'tag':
                        if (_object1) {
                            if (_splitWord != "as") {
                                //handle "sign x in y" - note, sign, tag and autograph will always overwrite with username
                                _object0 = _object1;
                            };
                        };
                        description = _player.writeOrDraw('sign', "$player", _object0);
                        break;
                    case 'clear':
                    case 'wipe':
                    case 'scrub':
                    case 'clean':
                        if (_object1) {
                            //clean x from y
                            description = _player.clean(_verb, _object1, _object0);
                        } else {
                            description = _player.clean(_verb, _object0);
                        };
                        break;
                    case 'sniff': //see also smell - by default, not much but would want to add smell attributes to creatures and artefacts
                    case 'smell':
                        _ticks = 1;
                        description = _player.smell(_verb, _object0);
                        break;
                    case 'listen':
                        if (!_object0) {_object0 = _object1};
                        description = _player.listen(_verb, _object0, _splitWord,  _map);
                        break;
                    case 'repeat':
                    case 'again':
                    case 'g':
                        if (_lastActionString != "" && _lastActionString != "g" && _lastActionString != "again" && _lastActionString != "repeat") {
                            description = "Last action: <i>'"+_lastActionString+"'</i><br>"+self.processAction(_lastActionString);
                        } else {
                            description = "Sorry, try something else.";
                        };
                        break;
                    case 'print':
                        description = "$action use printer";
                        break;
                    case 'copy':
                        description = "$action use copier";
                        break;
                    case 'hum':
                    case 'whistle':
                    case 'sing':
                    case 'toot':
                    //case 'chirp':
                    //case 'tweet':
                    //case 'bark':
                    //case 'meow':
                    //case 'moo':
                    //case 'growl':
                        _ticks = 1;
                        description = "You attempt to "+_verb+" and manage to emit a tuneless, annoying noise.<br>Thanks for that then."
                        break;
                    case 'knock':
                        _ticks = 1;
                        if (_object0 == "knock") {description = "Who's there?";};
                        break;  
                    case 'sail': //boat.
                    case 'fly': //plane.
                    case 'drive': //cattle, cat etc out/to a location or car/bus but not so much bike. Tricky.
                    case 'ride': //bike, horse but not car - some types vehicle or animal - animal should be larger than player.
                    case 'board': //train, plane, boat?
                    case 'mount': //disk drive or animal?
                        //use whole word direction.
                        if (_object0.length == 1) {
                            var index = tools.directions.indexOf(_object0);
                            if (index > -1) {
                                _object0 = tools.directions[index+1]; 
                            };
                        };
                        description = _player.ride(_verb, _object0, _map);
                        break;                        
                    case 'dismount': //disk drive or animal?
                    case 'unmount': //don't think this is a real verb but still...
                        description = _player.unRide(_verb, _object0);
                        break;
                    case 'start':
                        _ticks = 1;
                        description = _player.turn(_verb, _object0);
                        break;
                    case 'stop':
                        _ticks = 1;
                        description = _player.turn(_verb, _object0);
                        break;      
                    case 'curse':
                        _ticks = 0;
                        description = "Damn you "+_object0+"!<br>I'm guessing that's not what you planned."
                        break;
                    case 'type':
                    case 'input':
                        description = _player.type(_verb, _object0, _object1);
                        break;
                    case 'inject':
                        description = _player.inject(_object0, _object1);
                        break;
                    case 'play':
                        if (!_object0) {
                            description = _player.play(_verb, _object1);
                        } else {
                            description = _player.play(_verb, _object0, _object1);
                        };
                        break;
                    //verbs below this line are ones I'd like to support eventually
                    case 'delete': //similar to "clean" or "clear" but specifically tech/data related.                                                
                    case 'call':  //see #243
                    case 'phone': //see #243
                    case 'mail':  //see #243
                    case 'email': //see #243
                    case 'log': //in/out //see #243
                    case 'send': //see #243
                    case 'tie':
                    case 'untie':
                    case 'undo':
                    case 'unpick':
                    case 'tighten': //may also need to support "do up"? 
                    case 'cast': //see #18
                    case 'summon': //see #18
                    case 'test':
                    default:
                        defaultCaseAction();
                        //allow fall-through
                };
            }
            catch(err) {
                description = "Something bad happened on the server. If this happens again, you've probably found a bug. (Thanks for finding it!)";
	            console.error('Error: userAction: "'+_actionString+'". Error message/stack: '+err.stack);
            };	

            if (description) {
                //if result of player action is a custom action...
                if (!tools.stringIsEmpty(description)) {
                    if (typeof (description) == 'object') {
                        //normal type is "string" so this is something else.
                        description = customAction.processCustomAction(_map, description, _player);
                    };
                };

                //clean up fails
                if (description.indexOf("$fail$") > -1) {
                    description = description.replace("$fail$", "");
                };
                //if customAction redirects to another action...
                if (description.indexOf("$action") > -1) {
                    var newVerb = description.replace("$action","").trim();
                    //replace verb but keep original object
                    self.setActionString(_actionString.replace(_verb,newVerb));

                    //if default action is more than just a single word verb, overwrite the entire original action.
                    if (newVerb.indexOf(' ') > -1) {
                        self.setActionString(newVerb);  
                    };                     
                    
                    
                    return self.processAction(_actionString);

                } else { 
                    description = description.replace("$result$", ""); 
                };
            };

            return description;
        };

        self.performPlayerNavigation = function () {
            try {

                //if direction not yet set...
                var index = tools.directions.indexOf(_verb);
                if ((!_direction || _direction == "") && tools.directions.indexOf(_verb)>-1) {
                    _direction = _verb;
                    _verb = "go";
                }; 
            
                //if still no direction, player s doing something else.
                if (!_direction) {
                  return "";  
                };

                if (!(_direction == 'i' && _object0.length>1)){// trap sentences starting with "i" e.g. i need help

                    //use whole word direction.
                    if (_direction.length == 1) {
                        var index = tools.directions.indexOf(_direction);
                        if (index > -1) {
                            _direction = tools.directions[index+1]; 
                        };
                    };

                    _ticks = 1;
                    if (_verb == "crawl" || _verb == "climb") {_ticks = _baseTickSize*2};
                    return _player.go(_verb, _direction, _map);
                };

                //catch-all
                return "";
            } catch (err) {
                console.error('Error: During Player Navigation: "' + _actionString + '". Error message/stack: ' + err.stack);
                return "Something bad happened on the server. If this happens again, you've probably found a bug. (Thanks for finding it!)";
            };	
        };

        self.performPlayerCheatAction = function () {
            try {
                //Cheating!
                _player.incrementCheatCount();
               
                if (_verb == '+aggression') {
                    return "Player Aggression set: "+_player.setAggression(parseInt(_object0));
                };

                if (_verb == '+stealth') {
                    return "Player Stealth set: "+_player.setStealth(parseInt(_object0));
                };

                if (_verb == '+heal' || _verb == '+health') {
                    _player.updateHitPoints(parseInt(_object0));
                    return "Player Health set to: "+_player.getHitPoints();
                };
                
                if (_verb == '+dead') {
                    return "Obituaries: " + _map.listDead();
                };
                
                if (_verb == '+contagion' || _verb == '+infected') {
                    return "Infected: " + _map.listInfected();
                };
                
                if (_verb == '+immunity' || _verb == '+immune') {
                    return "Immune: " + _map.listImmune();
                };

                if (_verb == '+kill') {
                    var creature = _map.getObject(_object0);
                    if (creature) {
                        if (creature.getType() == "creature") {
                            return "Killing "+creature.getName()+":<br>"+creature.kill();
                        };
                        return "cannot kill " + _object0;
                    };
                    return "cannot find "+_object0+" to kill";               
                };
                
                if (_verb == '+hurt') {
                    var creature = _map.getObject(_object0);
                    if (creature) {
                        if (creature.getType() == "creature") {
                            return "Hurting " + creature.getName() + ":<br>" + creature.hurt(_object1);
                        };
                        return "cannot hurt " + _object0;
                    };
                    return "cannot find " + _object0 + " to hurt";
                };
                
                if (_verb == '+die') {
                    return _player.kill();
                };

                if (_verb == '+attrib') {
                    var item;
                    if (!_object0) {
                        item = _player.getCurrentLocation();
                    };
                    if (_object0 == "player" || _object0 == "self" || _object0 == "me") {
                        item = _player;
                    };
                    if (!(item)) {
                        item = _player.getObject(_object0);
                    };
                    if (!(item)) {
                        var loc = _player.getCurrentLocation();
                        if (loc) {
                            item = loc.getObject(_object0);
                        };
                    };
                    if (!(item)) {
                        item = _map.getObject(_object0);
                    };
                    if (!(item)) {
                        item = _map.getNamedMission(_object0, player);
                    };
                    if (item) {
                        var itemString = item.toString();
                        itemString = itemString.replace(/<br>/g, '&lt;br>');
                        itemString = itemString.replace(/\\/g, '\\\\');
                        return itemString.replace(/"/g, '\\"');
                    };
                    return "cannot find " + _object0;
                };
                               
                if (_verb == '+time') {
                    return _player.time(9, 0); //starting from 9am
                };

                if (_verb == '+wait') {
                    _ticks = parseInt(_object0);
                    _player.incrementWaitCount(_ticks);
                    return "Waiting " + _object0 + " ticks...";       
                };

                if (_verb == '+go') {
                    var location = _map.getLocation(_object0);
                    if (location) {
                        return "Player teleported:<br> "+_player.setLocation(location);
                    } else {
                        return "location '"+_object0+"' not found.";
                    };
                };

                if (_verb == '+find'||_verb == '+where') {
                    if(_object1) { return _map.find(_object1, true, true);}
                    else { return _map.find(_object0, true, true); };
                };

                if (_verb == '+get') {
                    let inventory = _player.getInventoryObject();
                    if(_object1) { return inventory.add(_map.getObject(_object1, true, true));}
                    else { return inventory.add(_map.getObject(_object0, true, true)); };
                };

                if (_verb == '+fix') {
                    var item = _map.getObject(_object0);
                    if (item) {
                        return item.forceRepair();
                    };
                    return "cannot find " + _object0 + " to fix";
                };

                if (_verb == '+missions') {
                    return _map.listAllMissions(_player);
                };
            
                if (_verb == '+activate' || _verb == '+start') {
                    return _map.activateNamedMission(_object0, _player);
                };

                if (_verb == '+complete') {
                    return _map.completeNamedMission(_object0, _player);
                };
                
                if (_verb == '+fail') {
                    return _map.failNamedMission(_object0, _player);
                };

                if (_verb == '+destination') {
                    var creatures = _map.getAllCreatures();
                    var resultString = "";
                    for (var c=0;c<creatures.length;c++) {
                        creatures[c].clearPath();
                        resultString+=creatures[c].goTo(_object0, 0, _map)+"<br>";
                    };
                    return resultString;
                };

                if (_verb == '+affinity') {
                    var creatures = _map.getAllCreatures();
                    for (var c=0;c<creatures.length;c++) {
                        creatures[c].increaseAffinity(parseInt(_object0))+"<br>";
                    };
                    return "Global creature affinity increased by "+_object0;
                };

                if (_verb == '+cash' || _verb == '+money') {
                    _player.updateCash(_object0);
                    return "Player cash balance changed by "+_object0;
                };
            } catch (err) {
                description = "Something bad happened on the server. If this happens again, you've probably found a bug. (Thanks for finding it!)";
                console.error('Error: During Player Cheat Action: "' + _actionString + '". Error message/stack: ' + err.stack);
            };	
        };

        self.catchPlayerNotUnderstood = function () {
            try {
                if (_inConversationWith) {
                    _ticks = 1;
                    _player.setLastVerbUsed('say');
                    return _player.say('say', _actionString,_inConversationWith, _map);
                };

                if (!_object0 && !_object1) {
                    _object0 = _verb;
                };         
                if (map.checkExists(_object0)) {
                    return "What do you want to do with '"+ _object0+ "'?<br>You'll need to be a little clearer."
                };

                _ticks = 0;
                _failCount ++;
                //console.debug("fail count: "+_failCount);
                if (_failCount >3) {
                    _verb = "help";
                    return self.performPlayerAction();
                };
                if (_failCount >1) {
                    return "It looks like you're struggling to be understood.<br>If you need some assistance, try typing <i>help</i>.";
                };

                var randomReplies = ["Sorry, I didn't understand you. Can you try rephrasing that?", "Can you try rephrasing that?", "I'm struggling to understand you. Can you try something else?", "I'm only a simple game. I'm afraid you'll need to try a different verb to get through to me."];
                var randomIndex = Math.floor(Math.random() * randomReplies.length);
                return randomReplies[randomIndex];
            } catch (err) {
                description = "Something bad happened on the server. If this happens again, you've probably found a bug. (Thanks for finding it!)";
                console.error('Error: During PlayerNotUnderstood: "' + _actionString + '". Error message/stack: ' + err.stack);
            };	

        };

        self.processAction = function(anActionString) {
            _ticks = _baseTickSize; //reset ticks.
            _direction = ""; //reset direction
            var description = "";

            self.setActionString(anActionString); //preserve the original string - we'll likely need it for special cases.
            //unpack action results JSON
            self.convertActionToElements(_actionString); //extract object, description, json

            //trap selfreferencing objects early...
            if ((_object0 == _object1) && (_object0!="")) {
                description = 'Are you a tester?<br> You try to make the '+_object0+' interact with itself but you grow tired and bored quite quickly.';
                return description;
            };
            
            if (_object0) {
                var firstWord = _object0.split(" ")[0].trim();
                if (numerals.indexOf(firstWord) > -1) {
                    description = "Sorry. Although I'm reasonably smart I'm not able to deal with multiples of objects yet.";
                    return description;
                };

                //@todo - would be good to enhance this to handle/strip out verbs with "ing"/adverbs/adjectives etc to get down to the intended objects. 

                //handle cash actions crudely (for now)
                if ((_object0 == "cash" || _object0 == "money") && _verb != "give" && _verb != "offer" && _verb != "hand") {
                    _ticks = 0;
                    description = "You should probably look after your "+_object0 +" for now.";
                    return description;
                }
            };
            if (_object1) {
                var firstWord = _object1.split(" ")[0].trim();
                if (numerals.indexOf(firstWord) > -1) {
                    description = "Sorry. Although I'm reasonably smart I'm not able to deal with multiples of objects yet.";
                    return description;
                };
            };

            //try to perform the player action
            if (tools.stringIsEmpty(description)) {
                description = self.performPlayerAction();
            };           
            
            //navigation
            if (tools.stringIsEmpty(description)) {
                description = self.performPlayerNavigation();
            };

            //admin "cheat" commands start with +
            if (_verb.charAt(0) == "+") {
                description = self.performPlayerCheatAction();
            };

            //fall-through checks...
            var swearing = swearCheck(_verb);
            if (swearing) {
                description = swearing;
                description += "<br>Sorry, I take a hard line on verbal abuse and bad language...<br>"+_player.kill();
            };

            //final fall-through
            if (tools.stringIsEmpty(description)){
                description = self.catchPlayerNotUnderstood();
            } else {
                //reset consecutive user errors
                _failCount = 0; 
            };

            return description;
        };
  
        self.act = function(anActionString) {
            var description = "";
            var imageName;
            if (anActionString != "stats" && anActionString != "score") {
                //explicitly test for false - supports stub testability          
                if (_player.gameIsActive() == false) {
                    description = "Thanks for playing.<br>There's nothing more you can do here for now.<br><br>You can either <i>quit</i> and start a fresh game or <i>load</i> a previously saved game.";
                    //we're done processing, build the results...
                    return returnResultAsJson(description, imageName);
                };
                
                //explicitly test for true - supports stub testability          
                if (_player.isDead() == true) {
                    description = "You're dead. Game over.<br>There's nothing more you can do here.<br><br>You either need to <i>quit</i> and restart a game or <i>load</i> a previously saved game.";
                    //we're done processing, build the results...
                    return returnResultAsJson(description, imageName);
                };
            };   

            //attempt to perform/translate requested action
            description = self.processAction(anActionString);
            try {
                //work out how many ticks will actually occur against rest of game...
                var actualTicks = _player.calculateTicks(_ticks, _verb);
                player.increaseTotalTimeTaken(actualTicks); //track total time

                //perform creature actions.
                description += processCreatureTicks(actualTicks, _map, _player);

                //if anything is happening in locations (includes ticks on inventory)
                description += processLocationTicks(actualTicks, _map, _player);
            
                //tick missions
                description  += map.updateMissions(actualTicks, _player);

                //if time is passing, what additional things happen to a player?
                //note - player ticks happen last so that we can adjust responses based on current state
                //we also only use "original" ticks here as any extras (wait/sleep) are explicitly covered elsewhere
                if (!_skipPlayerTick) {
                    description += _player.tick(_ticks, _map);
                };
            
            } catch (err) {
                description = "Something bad happened on the server. If this happens again, you've probably found a bug. (Thanks for finding it!)";
                console.error('Error: During game tick. (Useraction: "' + _actionString + '"). Error message/stack: ' + err.stack);
            };	

            //replace any player substitution variables
            while (description.indexOf("$player") > -1) {
                var username = tools.initCap(_player.getUsername());
                while (username.indexOf("%20") > -1) {
                     username = username.replace("%20"," ");
                };
                description = description.replace("$player",username);
            };

            //extract image link from response if set
            var imageIndex = 0;
            while (imageIndex>-1) {
                var imageIndex = description.indexOf("$image");
                if (imageIndex>-1) {
                    var endIndex = description.indexOf("/$image"),
                    imageName = description.substring(imageIndex+6, endIndex);
                    //console.debug("imageName:"+imageName);
                };
                if (imageName) {
                    //description = description.substring(0,imageIndex)+description.substring(endIndex+7);
                    description = description.replace("$image","");
                    description = description.replace(imageName,"");
                    description = description.replace("/$image","");
                    //console.debug("description:"+description);
                };  
            };   
            
            //after stripping out all substitution variables, does the description end with a question?
            if (description) {
                var tempDescription = description.replace(/<br>/g,"");
                tempDescription = tempDescription.replace(/'/g,""); 
                if (tempDescription.trim().slice(-1) == "?" ||tempDescription.trim().slice(-2) == "?\"") {
                    _awaitingPlayerAnswer = true;
                } else {
                    _awaitingPlayerAnswer = false;
                };
            };      

            //get an image path if not already set
            if (!(imageName)) {
                var location = _player.getCurrentLocation();
                if (location) {
                    try {
                        //if this fails, it's not the end of the world. Log it but continue
                        //check getImageNameFunction exists (test stub support)
                        if (location.getImageName) {
                            imageName = location.getImageName();
                        };
                    } catch (err) {console.error(err.stack);};
                };
            };


            //store this action as "last" action
            _lastActionString = _actionString;

            //we're done processing, build the results...
            return returnResultAsJson(description, imageName);
        };

        self.getResultString = function() {
            return _resultString;
        };

        //end public member functions

        //finish construction
        console.info(objectName + ' created');
    }
    catch(err) {
	    console.error('Unable to create Action object: '+err);
        throw err;
    };	    
};

