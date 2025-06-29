"use strict";
//tools.js - common tools used in all other MVTA classes - improve code reuse a little...
var self = module.exports= {

    //common data
    directions: ['n','north','s','south','e','east','w','west', 'l','left', 'r', 'right', 'i', 'in', 'o', 'out', 'u', 'up', 'd', 'down', 'c', 'continue', 'b','back', 'f', 'forward'],
    positions:  ['onto', 'on to', 'on top of', 'on', 'over', 'above', 'under', 'underneath', 'below', 'beneath', 'behind'], //split words that are also "put" positions. first 0-3 are "on", next 4-5 are above, 6-10 are below/behind, 

    projectileAttackVerbs: ['nerf','shoot','fire','blast','zap'],
    unarmedAttackVerbs: ['slap','punch','kick','thump',],
    sharpAttackVerbs: ['stab','slice','slash', 'cut'],
    bluntAttackVerbs: ['smash','bash','beat','whack','whip','hit','smack','swing', 'thwack','thwok','thwomp'],
    genericAttackVerbs: ['attack','hurt'],
    throwVerbs: ['throw','yeet', 'hurl', 'chuck', 'lob'],
    chokeAttackVerbs: ['choke','strangle', 'garrotte', 'garotte', 'throttle'],
    damageVerbs: ['destry','destroy','break','force','pry','crack','damage'],

    onIndex: 6,
    minimumSizeForDistanceViewing : 2,
    baseTickSize: 2,
    hourMultiplier: 100,
    
    /* --- Time handling --- */
    hoursAsTicks: function (hours) {
        if (hours) {
            return Math.floor(hours * (self.hourMultiplier * self.baseTickSize));
        };
        return 0;
    },
    
    minutesAsTicks: function (minutes) {
        if (minutes) {
            return Math.floor(minutes * ((self.hourMultiplier * self.baseTickSize)/60));
        };
        return 0
    },
    
    time: function (startHours, startMinutes, ticks) {
        //convert ticks to clocktime. 100 ticks = 1 hour)
        if (!ticks) { ticks = 0; };
        if (!startHours) { startHours = 0; };
        if (!startMinutes) { startMinutes = 0; };

        var hours = Math.floor(ticks / (self.hourMultiplier * self.baseTickSize)) + startHours;
        if (hours < 10) { hours = "0" + hours.toString() };
        var percentMinutes = ticks % (self.hourMultiplier * self.baseTickSize);
        var minutes = Math.floor(60 * percentMinutes / (self.hourMultiplier * self.baseTickSize)) + startMinutes;
        if (minutes < 10) { minutes = "0" + minutes.toString() };
        return hours + ":" + minutes;

    },


    /* --- String handling ---*/
    //check if a string is null, undefined or "" 
    stringIsEmpty: function(aString){
        if ((aString == "")||(aString == undefined)||(aString == null)|| aString == "undefined") {return true;};
        return false;
    },

    //test if a string is a proper noun
    isProperNoun: function (aString) {
        if (!aString) { return false;};
        var initial = aString.charAt(0);
        var regexUpperCase = /^[A-Z]$/;
        if (regexUpperCase.test(initial)) { return true; };
        return false;
    },

    //captialise first letter of string.
    initCap: function(aString){
        if (self.stringIsEmpty(aString)) {return "";};
        return aString.charAt(0).toUpperCase() + aString.slice(1);
    },

    //if object has an associated image name, return a "$image" delimeted tag with the name.
    imgTag: function(anObject) {
        // does the passed in object support the getImageName function?
        if(!anObject.getImageName) {return ""};
        let imageName = anObject.getImageName();
        if (imageName) {return "$image"+imageName+"/$image";};
        return "";
    },
    
    //convert an object "literal" (my bad terminology) to a string
    literalToString: function (literal) {
        if (typeof (literal) != 'object') {
            return literal;
        };
        var resultString = '{';
        var counter = 0;
        for (var key in literal) {
            if (counter > 0) { resultString += ', '; };
            counter++;
        
            resultString += '"' + key + '":';
            var obj = literal[key];
            //console.debug("LiteralConversion for "+key+": "+typeof(obj)+":"+obj.toString());
        
            if (typeof (obj) == 'object') {
                if (Array.isArray(obj)) {
                    //console.debug("Extracting Array...");
                    resultString += '[';
                    for (var j = 0; j < obj.length; j++) {
                        if (j > 0) { resultString += ","; };
                        if (typeof (obj[j]) == 'object') {
                            if (obj[j].toString() === '[object Object]') {
                                //we have a simple literal object
                                resultString += self.literalToString(obj[j]);
                            } else {
                                resultString += obj[j].toString();
                            };
                        } else {
                            resultString += '"' + obj[j] + '"';
                        };
                    };
                    resultString += ']';
                } else if (obj.toString() === '[object Object]') {
                    //we have a simple literal object
                    resultString += self.literalToString(obj);
                } else {
                    resultString += obj.toString();
                };
            }
            else if (typeof (obj) == 'string') { resultString += '"' + obj + '"'; }
            else if (typeof (obj) == 'boolean') { resultString += obj; }
            else { resultString += obj; };
        };
        resultString += '}';
        //console.debug(resultString);
        return resultString;
    },

    anOrA: function(anItemDescription, state) {
            if (!state) {state = " "};
            switch (anItemDescription.charAt(0).toLowerCase()) {
                case "u":
                    if (anItemDescription.length == 1) {return "a"+state+"'"+anItemDescription+"'";};
                    //note no break - fall through case
                case "a":
                case "e":
                case "i":
                case "o":
                case "h":
                case "8": //e.g. "an 8 gallon container"
                    return "an"+state+anItemDescription;
                    break;
                case "f":
                case "l":
                case "m":
                case "n":
                case "r":
                case "s":
                case "x":
                    if (anItemDescription.length == 1) {return "an"+state+"'"+anItemDescription+"'";};
                    //note no break - fall through case
                default:
                    return "a"+state+anItemDescription;
                    break;
            };
    },

    pluraliseDescription: function (aDescription, aCount) {
        //pluralise a description based on the count provided.
        if (self.stringIsEmpty(aDescription)) { return ""; };    
        if (aCount == 1 || self.stringIsEmpty(aCount)) { return aDescription; };
        var wordToReplace = aDescription;
        var replacement = wordToReplace;

        var descriptionAsWords = aDescription.split(" ");
        if (descriptionAsWords.length > 2) {
            //"x of y" ?
            if (descriptionAsWords[1] == "of") {
                wordToReplace = descriptionAsWords[0];
            };
        };

        if (wordToReplace == "child") {
            replacement = "children";
        } else if (wordToReplace == "foot") {
            replacement = "feet";
        } else if (wordToReplace == "tooth") {
            replacement = "teeth";
        } else if (wordToReplace == "mouse") {
            replacement = "mice";
        } else if (wordToReplace == "person") {
            replacement = "people";
        } else if (
            wordToReplace == "cactus" ||
            wordToReplace == "fungus" ||
            wordToReplace == "nucleus" ||
            wordToReplace == "focus" ||
            wordToReplace == "radius" ||
            wordToReplace == "stimulus" ||
            wordToReplace == "virus"
        ) {
            // Words ending with 'us' that become 'i' in plural
            replacement = wordToReplace.replace(/us$/, "i");
        } else if (
            wordToReplace == "sheep" ||
            wordToReplace == "deer" ||
            wordToReplace == "fish" ||
            wordToReplace == "species"
        ) {
            // Irregular nouns that do not change in plural
            replacement = wordToReplace;
        } else if (wordToReplace.substr(-2) == "sh" ||
               wordToReplace.substr(-2) == "ch" ||
               wordToReplace.substr(-2) == "us") {
            replacement = wordToReplace + "es";
        } else if (wordToReplace.substr(-1) == "x" ||
               wordToReplace.substr(-1) == "s") {
            replacement = wordToReplace + "es";
        } else if (wordToReplace.substr(-1) == "f") {
            replacement = wordToReplace.slice(0, -1) + "ves";
        } else if (wordToReplace.substr(-3) == "ife") { //interesting case
            replacement = wordToReplace.slice(0, -2) + "ves";
        } else if (wordToReplace.substr(-1) == "y") {
            replacement = wordToReplace.slice(0, -1) + "ies";
        } else {
            replacement = wordToReplace + "s";
        }
        var resultString = aDescription.replace(wordToReplace, replacement);
        if (aCount) { resultString = aCount + " " + resultString;};

        return resultString;
    },

    unpluraliseDescription: function (aDescription) {
        // Attempt to convert a pluralised description back to singular.
        if (self.stringIsEmpty(aDescription)) { return ""; }

        var wordToReplace = aDescription;
        var replacement = wordToReplace;

        var descriptionAsWords = aDescription.split(" ");
        if (descriptionAsWords.length > 2) {
            // "x of y" ?
            if (descriptionAsWords[1] == "of") {
                wordToReplace = descriptionAsWords[0];
            }
        }

        // Irregular plurals
        if (wordToReplace === "children") {
            replacement = "child";
        } else if (wordToReplace === "feet") {
            replacement = "foot";
        } else if (wordToReplace === "teeth") {
            replacement = "tooth";
        } else if (wordToReplace === "mice") {
            replacement = "mouse";
        } else if (wordToReplace === "people") {
            replacement = "person";
        } else if (
            wordToReplace.match(/(cacti|fungi|nuclei|foci|radii|stimuli|viri)$/)
        ) {
            // Words ending with 'i' that become 'us' in singular
            replacement = wordToReplace.replace(/i$/, "us");
        } else if (
            wordToReplace === "sheep" ||
            wordToReplace === "deer" ||
            wordToReplace === "fish" ||
            wordToReplace === "species"
        ) {
            // Irregular nouns that do not change in plural
            replacement = wordToReplace;
        } else if (wordToReplace.match(/(ches|shes|xes|ses|fes|zes)$/)) {
            // Remove 'es' for regular plurals
            replacement = wordToReplace.replace(/es$/, "");
        } else if (wordToReplace.match(/ives$/)) {
            // 'ives' -> 'fe'
            replacement = wordToReplace.replace(/ves$/, "fe");
        } else if (wordToReplace.match(/ves$/)) {
            // 'ives' -> 'fe'
            replacement = wordToReplace.replace(/ves$/, "f");
        } else if (wordToReplace.match(/ies$/)) {
            // 'ies' -> 'y'
            replacement = wordToReplace.replace(/ies$/, "y");
        } else if (wordToReplace.match(/s$/) && !wordToReplace.match(/ss$/)) {
            // Remove trailing 's' for regular plurals (but not for 'ss')
            replacement = wordToReplace.replace(/s$/, "");
        }

        var resultString = aDescription.replace(wordToReplace, replacement);
        return resultString;
    },

    /* --- custom array handling ---*/

    listSeparator: function(listPosition, listLength) {
        if (listPosition > 0 && listPosition < listLength - 1) { return ", "; };
        if (listPosition > 0 && listPosition == listLength - 1) {
            if (listLength > 2) {
                return ", and "; //oxford comma
            } else {
                return " and "; 
            };          
        }; 
        return "";
    },
        
    //custom sort algorithm that sorts by specified property
    sortByProperty: function(property) {
        return function (a, b) {
            if( a[property] > b[property]){
                return 1;
            }else if( a[property] < b[property] ){
                return -1;
            };
            return 0;
        };
    },

    //shuffle (randomise) arrays
    shuffle: function(array) {
        var currentIndex = array.length;
        var temporaryValue;
        var randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
        };

        return array;
    },

    
    randomIntInRange: function(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    /* --- Direction tools --- */

    //sort an array of directions by compass/priority order.
    compassSort: function(a,b) {
        var orderedDirections = ['n','s','e','w','u','d','i','o','l','r','c'];
        if (orderedDirections.indexOf(a.getDirection()) < orderedDirections.indexOf(b.getDirection())) {return -1;};
        if (orderedDirections.indexOf(a.getDirection()) > orderedDirections.indexOf(b.getDirection())) {return 1;};
        return 0;
    },

    //return the opposide compass/direction to provided value
    oppositeOf: function(direction){
        switch(direction)
        {
            case 'n':
                return 's';
                break; 
            case 's':
                return 'n';
                break;
            case 'e':
                return 'w';
                break;
            case 'w':
                return 'e';
                break;
            case 'u':
                return 'd';
                break;
            case 'd':
                return 'u';
                break;
            case 'i':
                return 'o';
                break;
            case 'o':
                return 'i';
                break;
            case 'l':
                return 'r';
                break;
            case 'r':
                return 'l';
                break;
            case 'c':
                return 'c'; 
                break;  
        }; 
        return '';       
    }

};