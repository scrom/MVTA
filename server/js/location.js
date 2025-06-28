"use strict";
//location object - manage location details
exports.Location = function Location(name, displayName, description, attributes) { 
    //name, description, detailedDescription, attributes,
    try{
        //module deps
        var tools = require('./tools.js');
        var artefactObjectModule = require('./artefact');
        var exitObjectModule = require('./exit');
        var inventoryObjectModule = require('./inventory');
        var missionObjectModule = require('./mission.js');
              
	    var self = this; //closure so we don't lose this reference in callbacks
        //self.location = {}; //JSON representation of location {description, objects, exits, creatures}
        var _name = name.toLowerCase();
        var _displayName = displayName || name.replace(/-/g," ");
        var _synonyms = [];
        var _visits = 0;
        var _vehiclesAllowed = [];
        var _dark = false;
        var _echo = false;
        var _type = "indoor";
        var _subType;
        var _start = false;
        var _blood = 0;
        var _playerTrace = 0;
        var _creatureTraces = {};
        var _description = description;
        var _inventory =  new inventoryObjectModule.Inventory(99999, 0.00, _name);//unlimited //[]; //and creatures
        var _exits = [];
        var _missions = [];
        var _imageName;

        var _defaultScenery = ["floor", "ground", "air", "blood"]
        var _defaultIndoorScenery = ["wall", "ceiling", "plant", "picture", "art", "artwork", "pic"];
        var _defaultOutdoorScenery = ["sky"];

	    var _objectName = "location";
        
        _displayName = tools.initCap(_displayName);

        var processAttributes = function(locationAttributes) {
            if (!locationAttributes) {return null;}; //leave defaults preset
            if (locationAttributes.synonyms != undefined) { _synonyms = locationAttributes.synonyms;};
            if (locationAttributes.dark) {_dark = locationAttributes.dark;};
            if (locationAttributes.echo) {_echo = locationAttributes.echo;};
            if (locationAttributes.type) {_type = locationAttributes.type;};            
            if (locationAttributes.subType) {_subType = locationAttributes.subType;};
            if (locationAttributes.start) {_start = locationAttributes.start;};
            if (locationAttributes.vehiclesAllowed) {_vehiclesAllowed = locationAttributes.vehiclesAllowed;};
            if (locationAttributes.blood) {_blood = locationAttributes.blood;};
            if (locationAttributes.playerTrace) {_playerTrace = locationAttributes.playerTrace;};
            if (locationAttributes.creatureTraces) {_creatureTraces = locationAttributes.creatureTraces;};
            ////
            if (locationAttributes.visits >0) {_visits = locationAttributes.visits;};
            if (locationAttributes.imageName != undefined) {_imageName = locationAttributes.imageName;};                
        };

        processAttributes(attributes);

        self.addSyns = function (synonyms) {
            _synonyms = _synonyms.concat(synonyms)
            //deduplicate
            let s = new Set(_synonyms);
            _synonyms = Array.from(s);
        };

        self.getSyns = function () {
            return _synonyms;
        };
        
        var validateType = function(type, subType) {
            var validobjectTypes = ["indoor", "outdoor"];
            if (validobjectTypes.indexOf(type) == -1) { throw type+" is not a valid location type."};
            //console.debug(_name+' type validated: '+type);
        };

        validateType(_type, _subType);

        //public member functions
        self.toString = function() {
            //var _missions = [];
            var resultString = '{"object":"'+_objectName+'","name":"'+_name+'","displayName":"'+_displayName+'","description":"'+_description+'"';
            var attributes = JSON.stringify(self.getAttributesToSave());
            if (attributes != "{}") {
                resultString += ',"attributes":'+attributes;
            };
            if (_synonyms.length >0) {
                resultString+= ',"synonyms":[';
                for(var i=0; i<_synonyms.length;i++) {
                    if (i>0) {resultString+= ',';};
                    resultString+= '"'+_synonyms[i]+'"';
                };
                resultString+= ']';
            };
            resultString += ',"exits":[';

            for(var i=0; i<_exits.length;i++) {
                if (i>0) {resultString+= ',';};
                resultString+= _exits[i].toString();
            };
            resultString += ']';
            if (_inventory.size(true) >0) {resultString+= ',"inventory":'+_inventory.toString();};
            if (_missions.length >0) {
                resultString+= ', "missions":[';
                for(var i=0; i<_missions.length;i++) {
                    if (i>0) {resultString+= ', ';};
                    resultString+= _missions[i].toString();
                };
                resultString+= ']';
            };
            resultString += '}';
            return resultString;
        };

        self.getCurrentAttributes = function() {
            var currentAttributes = {};

            currentAttributes.friendlyCreatureCount = self.countCreatures("friendly");
            currentAttributes.totalCreatureCount = self.countCreatures();
            currentAttributes.creatureCount = self.countCreatures("creature");
            currentAttributes.animalCount = self.countCreatures("animal");
            currentAttributes.itemCount = _inventory.size(true);
            currentAttributes.dark = _dark;
            currentAttributes.echo = _echo;
            currentAttributes.blood = _blood;
            currentAttributes.playerTrace = _playerTrace;
            currentAttributes.creatureTraces = _creatureTraces;
            currentAttributes.type = _type;
            currentAttributes.subType = _subType;
            currentAttributes.vehiclesAllowed = _vehiclesAllowed;
            currentAttributes.visits = _visits;
            currentAttributes.start = _start;
            currentAttributes.imageName = _imageName;  
            currentAttributes.inventoryValue = _inventory.getInventoryValue();
            currentAttributes.foodPortionCount = _inventory.foodPortionCount();

            return currentAttributes;
        };

        self.getAttributesToSave = function() {
            var saveAttributes = {};
            var locationAttributes = self.getCurrentAttributes();
         
            if (locationAttributes.dark) {saveAttributes.dark = locationAttributes.dark;};
            if (locationAttributes.echo) {saveAttributes.echo = locationAttributes.echo;};
            if (locationAttributes.type != "indoor") {saveAttributes.type = locationAttributes.type;};
            if (locationAttributes.subType) {saveAttributes.subType = locationAttributes.subType;};
            if (locationAttributes.visits >0) {saveAttributes.visits = locationAttributes.visits;};
            if (locationAttributes.blood >0) {saveAttributes.blood = locationAttributes.blood;};
            if (locationAttributes.playerTrace >0) {saveAttributes.playerTrace = locationAttributes.playerTrace;};
            if (Object.keys(locationAttributes.creatureTraces).length >0) {saveAttributes.creatureTraces = locationAttributes.creatureTraces;};
            if (locationAttributes.start) {saveAttributes.start = locationAttributes.start;};
            if (locationAttributes.vehiclesAllowed.length >0) {saveAttributes.vehiclesAllowed = locationAttributes.vehiclesAllowed;};
            if (locationAttributes.imageName != undefined) {saveAttributes.imageName = locationAttributes.imageName;};

            return saveAttributes;
        };

        self.syn = function (synonym) {
            if (!synonym) {
                return false;
            };
            //match by name first
            if (synonym == _name) {
                return true; 
            }; 

            //match by displayName 
            if (synonym == self.getDisplayName()) { 
                return true; 
            }; 

            //ensure we have syns array
            if (!(_synonyms)) {
                _synonyms = [];
            };
            if (_synonyms.indexOf(synonym) > -1) { 
                return true; 
            };

            //description - complete match
            if (synonym == self.getDescription()) { 
                return true; 
            };
            
            if (synonym.substr(synonym.length-1) == "s") {
                return self.syn(synonym.substr(0, synonym.length - 1));
            };

            return false;
        };

        self.defaultScenery = function() {
            return _defaultIndoorScenery.concat(_defaultOutdoorScenery).concat(_defaultScenery);
        };

        self.isDestroyed = function() {
            return false;
        };
        
        self.isDead = function() {
            return false;
        };

        self.getName = function() {
            return _name;
        };

        self.getDisplayName = function() {
            return _displayName;
        };

        self.setDisplayName = function(displayName) {
            _displayName = displayName;
        };

        self.getImageName = function() {
            return _imageName;
        };

        self.setImageName = function(imageName) {
            _imageName = imageName;
        };

        self.setDescription = function(description) {
            _description=description;
        };

        self.addLiquid = function(liquidName) {
            if (liquidName == "blood") {
                _blood = 10;
            };

            //if we have a floor object...
            var floor = self.getObject("floor", true, false, false);
            if (floor) {
                floor.addLiquid(liquidName);
            };
        };

        self.slipLevel = function() {
            var slipCount = 0;
            if (_blood >7) {slipCount++;};
            var floor = _inventory.getObject("floor", true, false, false);
            
            if (floor) {slipCount += floor.countLiquid();};

            return slipCount;
        };

        self.reduceBlood = function(reduceBy) {
            if (!reduceBy) {reduceBy = 1};
            if (_blood >0) {
                _blood = _blood - reduceBy;
                if (_blood < 8) {
                    //if we have a floor object...
                    var floor = _inventory.getObject("floor", true, false, false);
                    if (floor) {
                        floor.removeLiquid("blood");
                    };
                };
                if (_blood <= 0) {
                    _inventory.remove("blood");
                };
            };

            if (_blood <0) {_blood=0;};

        };

        self.setPlayerTrace = function(value) {
            _playerTrace = value;
        };

        self.getPlayerTrace = function() {
            return _playerTrace;
        };

        self.setCreatureTrace = function(creatureName, value) {
            _creatureTraces[creatureName] = value;
        };

        self.getCreatureTrace = function(creatureName) {
            if (creatureName == "player") {return self.getPlayerTrace();};
            return _creatureTraces[creatureName];
        };

        self.addExit = function(anExitDirection, aSource, aDestination, aDescription, isHidden, requiredAction) {
            self = this;
            if (self.getExit(anExitDirection)) {console.warn("DATA QUALITY WARNING: duplicate exit direction '"+anExitDirection+"' from "+aSource+".");};
            var newExit = new exitObjectModule.Exit(anExitDirection, aSource, aDestination, aDescription, isHidden, requiredAction);
            _exits.push(newExit); 
            var storedExit = _exits[_exits.length-1];   
            //console.debug('Exit from '+self.getName()+', '+storedExit.getDirection()+' to '+storedExit.getDestinationName()+' added.');   
            return 'Exit from '+self.getName()+', '+newExit.getDirection()+' to '+newExit.getDestinationName()+' added.';
        };

        self.getExitDestination = function(aDirection) {
            var exit = self.getExit(aDirection);
            if (exit) {return exit.getDestinationName();};
            return self.getName(); //
        };

        self.getExitInOrOutByDestinationName = function(keyword) {
            var destinationName = "";
            var exit = self.getExit("i");
            if (exit) {
                destinationName = exit.getDestinationName();
                if (destinationName.indexOf(keyword) >-1) {
                    return "go in";
                };
            };

            exit = self.getExit("o");
            if (exit) {
                destinationName = exit.getDestinationName();
                if (destinationName.indexOf(keyword) >-1) {
                    return "go out";
                };
            };

            return null;
        };

        self.getExit = function(aDirection) {
            for(var i = 0; i < _exits.length; i++) {
                if (typeof _exits[i] == "object") {
                    if(_exits[i].getDirection().toLowerCase() == aDirection.toLowerCase()) {
                        //console.debug('found: '+aDirection+' destination: '+_exits[i].getDestinationName());
                        return _exits[i];
                    };
                    if(_exits[i].getLongName().toLowerCase() == aDirection.toLowerCase()) {
                        return _exits[i];
                    };
                };
            };       
            return null;
        };

        self.removeExit = function(destinationName) {
            for(var i = 0; i < _exits.length; i++) {
                if (typeof _exits[i] == "object") {
                    if(_exits[i].getDestinationName().toLowerCase() == destinationName.toLowerCase()) {
                        _exits.splice(i, 1);
                        break;
                    };
                };
            };  
        };

        self.getDoorForExit = function (direction, includeLockedDoors) {
            if (direction.length > 1) {
                direction = direction.substr(0, 1);
            };
            var doors = self.getAllObjectsOfType("door");
            for (var d=0;d<doors.length;d++) {
                if ((!(doors[d].isLocked())) || includeLockedDoors) {
                    var linkedExits = doors[d].getLinkedExits();
                    for (var l=0;l<linkedExits.length;l++) {
                        if (linkedExits[l].getSourceName() == self.getName()) {
                            //console.debug("getDoorForExit: direction - " + direction + " : " + linkedExits[l].toString());
                            if (linkedExits[l].getDirection() == direction) {                                
                                //we have a matching exit with a door
                                return doors[d];
                            };
                        };
                    };
                };
            };
        };


        self.getAvailableExits = function (includeUsableDoors, callerInventory, useEmergencyDoors) {
            var exitArray = [];
            for (var i = 0; i < _exits.length; i++) {
                if (typeof _exits[i] != "object") {
                    //no, not usable - probably bad data
                    continue;
                };
                if (_exits[i].isVisible()) {
                    //yes, this one's usable
                    exitArray.push(_exits[i]);
                    continue;
                }
                //exit is not visible
                if (!includeUsableDoors) {
                    //no, this one's not usable
                    continue;
                };
                
                //find maching door
                var door = self.getDoorForExit(_exits[i].getDirection(), true);
                if (!door) {
                    //no door available
                    continue;
                };
                if (door.getSubType() == "emergency" && !useEmergencyDoors) {
                    //no, caller has asked not to use an emergency door
                    continue;
                };

                if (!door.isLocked()) {
                    //yes, this one's usable - it's not locked
                    exitArray.push(_exits[i]);
                    continue;
                };
                
                var key = door.getMatchingKey("unlock", callerInventory);
                if (key) {
                    //yes, we have a key that'll work
                    exitArray.push(_exits[i]);
                    continue;
                };

            };
            exitArray.sort(tools.compassSort);
            return exitArray;
        };

        self.getRandomExit = function(includeUsableDoors, avoidLocations, callerInventory, lastDirection, useEmergencyDoors, useExitActions) {
            if (!(avoidLocations)) {avoidLocations = [];};
            var allAvailableExits = self.getAvailableExits(includeUsableDoors, callerInventory, useEmergencyDoors);
            var availableExits = [];

            //filter out locations to try and avoid...
            for (var e = 0; e < allAvailableExits.length; e++) {
                if (lastDirection) {
                    if (allAvailableExits[e].getDirection() == tools.oppositeOf(lastDirection)) {
                        //doubling back - don't use this exit
                        continue;
                    };
                };
                if (avoidLocations.indexOf(allAvailableExits[e].getDestinationName()) > -1) {
                    //avoid - don't use this exit
                    continue;
                };
                
                var exitAction = allAvailableExits[e].getRequiredAction();
                if (exitAction == "drive" || exitAction == "fly" || exitAction == "sail" || exitAction == "ride") {
                    //can't do these things at the moment
                    continue;
                };
                if (exitAction) {
                    if (!(useExitActions || exitAction != "")) {
                        //can't use if not using exit actions and exit action is set to a real value
                        continue;
                    };
                };
                                              
                //use this one
                availableExits.push(allAvailableExits[e]);

            };

            var randomInt = Math.floor(Math.random() * (availableExits.length));
            //console.debug('Random exit selected: '+availableExits[randomInt].getDirection());
            return availableExits[randomInt];
        };
        
        
        self.getExitWithNamedCreature = function (creatureName, map, callerInventory) {
            var exits = self.getAvailableExits(true, callerInventory);
            for (var e = 0; e < exits.length; e++) {
                var destinationName = exits[e].getDestinationName();
                var loc = map.getLocation(destinationName);
                var creature = loc.getObject(creatureName);
                if (creature) {
                    if (creature.getType() != "creature") {
                        creature = null;
                    };
                };
                var returnExit;
                if (creature) {
                    if (creature.getLastDirection() == exits[e].getDirection()) {
                        //they most likely came from here - but how long ago?
                        var newTrace = loc.getCreatureTrace(creature.getName());
                        var compare = Math.floor(map.getLocationCount() / 5)
                        if (newTrace == compare - 1) {
                            if (returnExit) {
                                //we already found one creature with the same name who went somewhere at the same time
                                //so we don't know which way to go 
                                return null;
                            };
                            returnExit = exits[e];
                        };
                    };

                };
            };
            
            //we either found 1 or no creatures.
            return returnExit;
        };
        
        self.getExitWithBestTrace = function (creatureName, map, callerInventory) {
            var exits = self.getAvailableExits(true, callerInventory);
            var bestTraceStrength = 0;
            var bestTraceExit;
            for (var e = 0; e < exits.length; e++) {
                var destinationName = exits[e].getDestinationName();
                var loc = map.getLocation(destinationName);
                var newTrace = loc.getCreatureTrace(creatureName);
                if (newTrace > bestTraceStrength) {
                    bestTraceExit = exits[e];
                    bestTraceStrength = newTrace;
                };
            };
            
            return bestTraceExit;
        };


        self.allowsVehicle = function(vehicle) {
            if (!vehicle) {return true;};
            if (!_vehiclesAllowed) {return false;};
            if (_vehiclesAllowed.length == 0) {return false;};
            if (_vehiclesAllowed.indexOf("all") > -1) {return true;};

            var vehicleType = vehicle.getSubType();
            if (_vehiclesAllowed.indexOf(vehicleType) > -1) {return true;};

            return false;
        };

        //nasty - expose our internals - needed to support inventory containers
        self.getInventoryObject = function() {
            return _inventory;
        };

        self.getSuitableContainer = function(anObject) {
            return _inventory.getSuitableContainer(anObject);
        };

        self.addObject = function(anObject) {
            _inventory.add(anObject);
            return "location now contains "+anObject.getDescription()+".";
        };

        self.removeObject = function(anObjectName, searchCreatures) {
            //console.debug('removing '+anObjectName+' from '+self.getName());
            return _inventory.remove(anObjectName, searchCreatures);
        };

        self.objectExists = function(anObjectName, ignoreSynonyms, searchCreatures, ignoreScenery) {
            //check if passed in object is in location
            return _inventory.check(anObjectName, ignoreSynonyms, searchCreatures, ignoreScenery);
        };

        self.spilledLiquidExists = function(liquidName) {
            //check if passed in liquid is on any location object.
            return _inventory.hasLiquid(liquidName);
        };

        self.getType = function() {
            return _type;
        };

        self.createBloodObject = function() {
            if (_blood >0) {
                var bloodAttributes = {
                    "type": "food", 
                    "weight": 0.1, 
                    "defaultAction": "drink", 
                    "nutrition": -5, 
                    "requiresContainer": true, 
                    "isLiquid": true,
                    "canCollect": true,
                    "plural": true,
                    "charges": 1,
                    "chargesDescription": " ",
                    "customAction": null,
                    "defaultResult": "",
                    "synonyms": ["blood", "bloody", "bloods", "mess", "splatter", "stains", "drops", "drips"],
                    "smell": "It smells metallic and fresh. You fight your gag-reflex at the thought of recent death here.",
                    "taste": "It's tangy with a burned metallic aftertaste.<br>Hey, hang on. I'm worried about Why you're tasting blood!",
                    "texture": "It's slightly sticky. Fairly fresh I'd say.",
                    "sound": "Errrm. It's blood. It's no longer whooshing through anybody's veins."
                };

                if (_blood <8) {
                    //must be freshly spilled only to be able to collect.
                    bloodAttributes.type = "scenery";
                    bloodAttributes.canCollect = false;
                    bloodAttributes.defaultAction = "examine";
                    bloodAttributes.nutrition = 0;
                    bloodAttributes.charges = -1;
                    bloodAttributes.chargesDescription = "";
                    bloodAttributes.customAction = ["get"];
                    bloodAttributes.defaultResult = "There's not enough here to do anything useful with.";
                    bloodAttributes.smell = "It smells somewhat disturbing but not quite fresh.";
                    bloodAttributes.taste = "Tastes like scabs. Nice (not)."
                    bloodAttributes.texture = "It's drying up rapidly. Looks like it's been here a little while."

                };

                if (_blood <=1) {
                    bloodAttributes.smell = "There's just a tang of iron and salt in the air, nothing more."
                    bloodAttributes.taste = "You barely taste anything."
                    bloodAttributes.texture = "There's only a trace left."
                    bloodAttributes.sound = "The silence of mortality."
                };

                return new artefactObjectModule.Artefact("blood", "blood", "It's hard to tell where or who it came from.", bloodAttributes, null, null);
            };
            return null;
        };

        self.getObject = function(anObjectName, ignoreSynonyms, searchCreatures, verb) {
            var returnObject = _inventory.getObject(anObjectName, ignoreSynonyms, searchCreatures, verb);
            if (returnObject) { 
                if (anObjectName == "blood") {
                    if (_blood >0) {
                        //there's fresh blood to re-generate so let's remove what's there.
                        //@todo - possible bug here.
                        //if blood is also in a *container* in this location, we'd still get it returned at this point.
                        _inventory.remove(anObjectName);
                    } else {
                        return returnObject; 
                    };
                } else {
                    return returnObject;
                };
            };

            if (anObjectName.substr(-1) == "s") {
                anObjectName = anObjectName.substr(0,anObjectName.length-1);
            };

            //autogenerate missing default scenery
            if  (_defaultScenery.includes(anObjectName) || ((self.getType() == "indoor") && _defaultIndoorScenery.includes(anObjectName)) || ((self.getType() != "indoor") && _defaultOutdoorScenery.includes(anObjectName))) {

                var description = "Just scenery. At least from where you are right now."
                var sceneryAttributes = {"type": "scenery", "subType": "intangible", "canDrawOn": false, "synonyms": []};

                switch (anObjectName) {
                    case "blood":
                    case "stains":
                    case "splatter":
                        var sceneryBlood = self.createBloodObject();
                        if (sceneryBlood) {
                            _inventory.add(sceneryBlood);
                        };
                        return sceneryBlood; // even if none.
                        break;
                    case "air":
                    case "sky":
                    case "airs":
                    case "skies":
                        anObjectName = "air"
                        sceneryAttributes.subType = "intangible";
                        sceneryAttributes.synonyms = ["air", "sky", "airs", "skies"];
                        description = "Ahhh. The air. Sigh."
                        break;
                    case "floor":
                    case "floors":
                    case "ground":
                    case "grounds":
                        anObjectName = "floor"
                        sceneryAttributes.subType = "floor";
                        sceneryAttributes.synonyms = ["floor", "ground", "floors", "grounds", "feet"];
                        sceneryAttributes.weight = 999;
                        description = "You look down. Yep, that's the ground beneath your feet."
                        sceneryAttributes.canDrawOn = true;
                        break;
                    case "wall":
                    case "walls":
                        anObjectName = "wall"
                        sceneryAttributes.subType = "wall";
                        sceneryAttributes.synonyms = ["wall", "walls"];
                        sceneryAttributes.weight = 999;
                        description = "Hmm. Walls. Interesting."
                        sceneryAttributes.canDrawOn = true;
                        break;
                    case "picture":
                    case "pictures":
                    case "pic":
                    case "pics":
                    case "art":
                    case "arts":
                    case "artwork":
                    case "artworks":
                        anObjectName = "picture"
                        sceneryAttributes.subType = "art";
                        sceneryAttributes.synonyms = ["picture", "pictures", "art", "arts", "pic", "pics", "artwork", "artworks"];
                        sceneryAttributes.weight = 2;
                        description = "Very generic artwork. Just think, somebody somewhere might actually make a living producing stuff like this."
                        sceneryAttributes.canDrawOn = true;
                        break;
                                        case "picture":
                    case "plant":
                    case "plants":
                        anObjectName = "plant"
                        sceneryAttributes.subType = "plant";
                        sceneryAttributes.synonyms = ["plant", "plants", "vegetation", "tree", "trees"];
                        sceneryAttributes.weight = 50;
                        if (self.getType() == "indoor") {
                            description = "A few plants always brighten up the space. Fairly generic, but pleasant enough.";
                            sceneryAttributes.synonyms = sceneryAttributes.synonyms.concat(["indoor plant", "potted plant", "pot plant", "leaves", "greenery"]);
                        } else {
                            description = "We realy should make more of our outdoor spaces and add a little greenery where we can.";
                            sceneryAttributes.synonyms = sceneryAttributes.synonyms.concat(["hedge", "border", "flower bed", "garden", "shrubs", "shrubbery", "greenery"]);
                        };
                        sceneryAttributes.canDrawOn = true;
                        break;

                    default:
                        sceneryAttributes.subType = "intangible";
                };

                var sceneryObject = new artefactObjectModule.Artefact(anObjectName, anObjectName, description, sceneryAttributes, null, null);
                _inventory.add(sceneryObject);
                return sceneryObject;
            };

            return false; //return nothing
        };

        self.getObjectByType = function(anObjectType) {
            return _inventory.getObjectByType(anObjectType);
        };

        self.getAllObjects = function(includeHiddenObjects, includeScenery) {
            return _inventory.getAllObjects(includeHiddenObjects, includeScenery);
        };

        self.getAllObjectsAndChildren = function(includeInaccessible) {
            return _inventory.getAllObjectsAndChildren(includeInaccessible);
        };

        self.getAllObjectsOfType = function(anObjectType) {
            return _inventory.getAllObjectsOfType(anObjectType);
        };

        self.getAllObjectsWithViewLocation = function() {
            return _inventory.getAllObjectsWithViewLocation();
        };

        self.getAllObjectsWithSyn = function(synonym) {
            return _inventory.getAllObjectsWithSyn(synonym);
        };

        self.checkWritingOrDrawing = function(content) {
            return _inventory.checkWritingOrDrawing(content);
        };

        self.countCreatures = function(subType, includeDeadCreatures) {
            return _inventory.creatureCount(subType, includeDeadCreatures);
        };

        self.getDescription = function() {
            return _description;
        };
        
        self.describeBlood = function () {
            if (_blood <=0) {
                return "";
            } 
            else if (_blood >= 8) {
                return "<br>There's a lot of blood around here. It looks like someone or something's been injured very recently.";
            } else if (_blood > 5) {
                return "<br>You notice splatters of blood in the area. It looks like someone or something's been bleeding here.";
            } else if (_blood > 1) {
                return "<br>There are fading signs of blood or violence here.";
            } else if (_blood > 0) {
                return "<br>You notice an oddly familiar metallic tang in the air.";
            };
            
        };
        
        self.describeExits = function () {
            var exitCount = self.getAvailableExits().length;
            if (exitCount == 0) {
                return "<br>There are no visible exits."; 
            } else if (exitCount == 1) {
                var exitDescription = self.listExits();
                if (exitDescription == "continue") {
                    return "<br>Your only way onward from here is forward.";
                };
                return "<br>There is a single exit " + exitDescription + ".";
            } else {
                var exitDescription = self.listExits();
                if (exitCount == 2 && exitDescription.indexOf("continue") >-1) {
                    return "<br>There's an exit " + exitDescription + ".";
                };
                return "<br>There are exits " + exitDescription + ".";
            };            
        };

        self.describe = function(shortenIfVisited) {
            var resultString = _description;
            if (shortenIfVisited) {
                if (self.getVisits() > 1) {
                    let breakString = ".";
                    if (_description) {
                        if (_description.includes("<br>")) {
                            breakString = "<br>"
                        };
                        let stringIndex = _description.indexOf(breakString);
                        if (stringIndex >0) {
                            resultString = _description.substring(0, stringIndex);
                        };
                    };
                };
            };

            if (_inventory.size(false, true) > 0) {
                //clean up grammar here (there is/there are)
                resultString+="<br><br>You can see "+self.listObjects()+".";
            };
                        
            resultString += self.describeBlood();
            resultString += self.describeExits();
            
            return resultString + "<br>";
        };

        self.addVisit = function() {
            _visits++;
            return (self.fireEntryTrigger());
        };

        self.fireEntryTrigger = function() {
            //console.debug('Firing entry trigger from '+self.getName());   
            return "";
        };

        self.fireExitTrigger = function() {
            //console.debug('Exit trigger fired from '+self.getName());
            return "";                 
        }; 

        self.getVisits = function() {
            return _visits;
        };

        self.addMission = function(aMission) {
            _missions.push(aMission);
        };

        self.removeMission = function(aMissionName) {
            for(var index = 0; index < _missions.length; index++) {
                if (_missions[index].getName()==aMissionName) {
                    _missions.splice(index,1);
                    //console.debug(aMissionName+" removed from "+self.getName());
                    break;
                };
            };
        };

        self.getMissions = function(includeChildren) {
            var missions = [];
            for (var i=0; i < _missions.length; i++) {
                if ((!(_missions[i].hasParents()))||includeChildren == true) {
                    missions.push(_missions[i]);
                };
            };
            return missions;
        };

        self.listExits = function () {
            var resultString = "";
            var exits = self.getAvailableExits();
            var compassExits = ["North","South","East","West", "left", "right"]; //not *quite* compass but still...
            for (var i = 0; i < exits.length; i++) {
                if ((i==0) && (compassExits.indexOf(exits[i].getLongName()) >-1)) {resultString += "to the ";};
                resultString += tools.listSeparator(i, exits.length);
                resultString += exits[i].getLongName();
            };

            resultString = resultString.replace("and continue", "or you can continue straight-on");

            return resultString;
        };

        self.isDark = function () {
            //console.debug("location is dark? "+_dark);
            if (_dark) {return true;};
            return false;
        };

        self.setDark = function (isDark) {
            _dark = isDark;
            return _dark;
        };

        self.hasEcho = function () {
            if (_echo) {return true;};
            return false;
        };

        self.isStart = function () {
            if (_start) {return true;};
            return false;
        };

        self.listObjects = function(minSize) {
            return _inventory.listObjects(minSize);
        };

        self.liveCreaturesExist = function(count) {
            let quantity = 0;
            var creatures = self.getCreatures();
            if (creatures.length > 0) {
                for (var i=0;i<creatures.length;i++) {
                    if (!(creatures[i].isDead())) { 
                        if (count) {
                            quantity++;
                        } else {
                            return true;
                        };
                    };
                };
            };
            if (quantity > 0) {return quantity};
            return false;
        };

        self.getCreature = function(aCreatureName) {
            if (!aCreatureName) {return null;}
            let creature = self.getObject(aCreatureName);
                if (creature) { //we have a name match - is it a creature?
                    if (creature.getType() == 'creature') {return creature;};
                };
            return null;
        };

        self.getCreatures = function() {
            return _inventory.getAllObjectsOfType('creature');
        };

        self.reduceLocalFriendlyCreatureAffinity = function(changeValue, excludedCreature) {
            //unless they really like the player, friendly creatures in the same location don't appreciate aggression.
            //console.debug("attempting to reduce local creature affinity by "+changeValue+" except for "+excludedCreature);
            var creatures = self.getCreatures();
            for (var i=0; i<creatures.length;i++) {
                if (creatures[i].getSubType() == "friendly" && (creatures[i].getAffinity() <= 5)) {
                    if (creatures[i].getName() != excludedCreature) {
                        //console.debug("reducing affinity for "+creatures[i].getName());
                        creatures[i].decreaseAffinity(changeValue);
                    };
                };
            };
        };

        self.tick = function(time, map, player) {
            //note, we don't tell the player about this...
            if (_playerTrace >0) {
                _playerTrace--;
            };

            for (var key in _creatureTraces) {
                if (_creatureTraces[key] > 0) {
                    _creatureTraces[key] --;
                };
                if (_creatureTraces[key] == 0) {
                    delete _creatureTraces[key];
                };
            };
            
            var resultString = "";
            if (time > 0) {
                var reduceBloodByQuantity = Math.max(time / (tools.baseTickSize * 2), 1)
                self.reduceBlood(reduceBloodByQuantity);
            };
            for (var t = 0; t < time; t++) {
                //decrease blood in location (if any there)
                
                //tick inventory items
                resultString += _inventory.tick(self);
            };
            
            if (player && resultString.length > 0) {
                var playerLocation = player.getCurrentLocation();
                var playerLocationName = playerLocation.getName();
                if (self.getName() == playerLocationName) {
                    return resultString;
                };
            };

            return "";
        };

        //end public member functions

        //console.debug(_objectName +' created: '+self.getName());

    }
    catch(err) {
	    console.error('Unable to create Location object: '+err);
        throw err;
    };	
};