"use strict";
//main map object
exports.Map = function Map() {
    try{
        //module deps
        var tools = require('./tools.js');
        var missionControllerModule = require('./missioncontroller');                

        var self = this; //closure so we don't lose this reference in callbacks
        var _missionController = new missionControllerModule.MissionController(self);
        var _locationIndexMap = [];
        var _locationNamesToSyns = [];
        var _locations = [];
        var _spawnDefinitions = [];
        var _startLocationIndex = 0;
        var _maxScore = 0; //missions add score
        var _missionCount = 0; //how many missions are there?
        var _eventCount = 0; //how many "events" are there?
        var _bookCount = 0; //how many books are there?
        var _creatureCount = 0; //how many creatures are there?
        var _removedCreatures = []; //which creatures have been removed from the map?
        var _dictionary = {};
        var _reverseDictionary = {};

        //consider storing all creatures and artefacts on map object (rather than in location, creature or player) 
        //this will need some major rework and tracking/linking who owns what
        //but might make all kinds of other work easier.

	    var _objectName = "Map";

        console.info(_objectName + ' created');

        self.getDictionary = function () {
            return _dictionary;
        };

        self.getReverseDictionary = function () {
            return _reverseDictionary;
        };

        self.dictionaryLookup = function (string, type = null) {
            const key = string.toLowerCase();
            const entries = _reverseDictionary[key];
            if (!entries) return false;

            const result = {};
            for (const { name, type: entryType } of entries) {
                if (!type || entryType === type) {
                    result[name] = _dictionary[name];
                }
            }

            return result;
        };

        self.getDictionaryEntry = function(name) {
            return _dictionary[name] || false;
        };

        self.addDictionaryEntry = function(name, type, syns) {
            if (!name) {return false;}

            //save to main dictionary
            _dictionary[name] = {type: type, synonyms: syns};
        
            // Combine name and synonyms as keys
            const allTerms = [name, ...(syns || [])];
            for (const term of allTerms) {
                const key = term.toLowerCase(); // normalize for consistency
                if (!_reverseDictionary[key]) {
                    _reverseDictionary[key] = [];
                }

                // Optional: check for duplicates before pushing
                const alreadyExists = _reverseDictionary[key].some(entry => entry.name === name);
                if (!alreadyExists) {
                    _reverseDictionary[key].push({ name, type });
                }
            }           
            return true;
        };

        self.removeDictionaryEntry = function(name) {
            if (!name || !_dictionary[name]) return false;

            const { type, synonyms = [] } = _dictionary[name];
            const allTerms = [name, ...synonyms];

            for (const term of allTerms) {
                const key = term.toLowerCase(); // use same normalization as add
                const entries = _reverseDictionary[key];

                if (entries) {
                    // Remove all matches for this name
                    _reverseDictionary[key] = entries.filter(entry => entry.name !== name);

                    // Clean up if empty
                    if (_reverseDictionary[key].length === 0) {
                        delete _reverseDictionary[key];
                    }
                }
            }

            // Finally remove from the main dictionary
            delete _dictionary[name];
            return true;
        };

        self.modifyDictionaryEntry = function(name, type, syns) {
            if (!name) return false;

            const entry = _dictionary[name];

            // If entry doesn't exist, add it instead
            if (!entry) {
                return self.addDictionaryEntry(name, type, syns);
            }

            // Remove old synonyms from reverse dictionary
            const oldSynonyms = [name, ...(entry.synonyms || [])];
            for (const term of oldSynonyms) {
                const key = term.toLowerCase();
                if (reverseDictionary[key]) {
                    reverseDictionary[key] = reverseDictionary[key].filter(e => e.name !== name);
                    if (reverseDictionary[key].length === 0) {
                        delete reverseDictionary[key];
                    }
                }
            }

            // Modify type if given
            if (type) {
                entry.type = type;
            }

            // Modify synonyms
            if (syns) {
                if (Array.isArray(syns)) {
                    entry.synonyms = syns;
                } else {
                    // Add single synonym to existing array
                    if (!entry.synonyms) {
                        entry.synonyms = [];
                    }
                    entry.synonyms.push(syns);
                }
            }

            // Re-add new synonyms to reverse dictionary
            const newSynonyms = [name, ...(entry.synonyms || [])];
            for (const term of newSynonyms) {
                const key = term.toLowerCase();
                if (!reverseDictionary[key]) {
                    reverseDictionary[key] = [];
                }

                const alreadyExists = reverseDictionary[key].some(e => e.name === name);
                if (!alreadyExists) {
                    reverseDictionary[key].push({ name, type: entry.type });
                }
            }

            return true;
        };

        self.getCurrentAttributes = function() {
            var currentAttributes = {};
            var creatures = self.getAllCreatures();
            creatures = creatures.concat(_removedCreatures);
            currentAttributes.contagion = self.gatherContagionStats(creatures);
            currentAttributes.antibodies = self.gatherAntibodyStats(creatures);
            currentAttributes.contagionDeathToll = self.gatherContagionDeathTollStats(creatures);
            currentAttributes.deathToll = self.gatherDeathTollStats(creatures);
            currentAttributes.bleedingCreatures = self.gatherBleedingStats(creatures);
            return currentAttributes;
        };

        self.isDestroyed = function() {
            return false;
        };

        self.getName = function() {
            return "$map";
        };

        self.increaseMaxScore = function(increaseBy) {
            _maxScore += increaseBy;
            return _maxScore;
        };

        self.getMaxScore = function() {
            return _maxScore;
        };

        self.incrementEventCount = function() {
            _eventCount++;
            return _eventCount;
        };

        self.getEventCount = function() {
            return _eventCount;
        };

        self.incrementMissionCount = function() {
            _missionCount++;
            return _missionCount;
        };

        self.getMissionCount = function() {
            return _missionCount;
        };

        self.incrementBookCount = function() {
            _bookCount++;
            return _bookCount;
        };

        self.getBookCount = function() {
            return _bookCount;
        };

        self.incrementCreatureCount = function() {
            _creatureCount++;
            return _creatureCount;
        };

        self.getCreatureCount = function() {
            return _creatureCount;
        };

        self.getLocationCount = function() {
            return _locations.length;
        };
              
        self.addLocation = function(location){
            _locations.push(location);
            _locationIndexMap.push(location.getName());
            _locationNamesToSyns[location.getName()] = location.getSyns();
            var newIndex = _locations.length-1;
            if (location.isStart()) {_startLocationIndex = newIndex;};
            return newIndex;
        };

        self.modifyLocation = function(modification){
            var locationName = "";
            var newDisplayName;
            var newDescription;
            var inventory = [];
            var removals = [];
            var missions = [];
            if (modification) {
                if (modification.name) {
                    locationName = modification.name;
                };
                if (modification.displayName) {
                    newDisplayName = modification.displayName;
                };
                if (modification.description) {
                    newDescription = modification.description;
                };
                if (modification.inventory) {
                    for (var i = 0; i <modification.inventory.length; i++) {
                        inventory.push(modification.inventory[i]);
                    };
                };
                if (modification.remove) {
                    for (var i = 0; i < modification.remove.length; i++) {
                        removals.push(modification.remove[i]);
                    };
                };
                if (modification.missions) {
                    for (var i = 0; i < modification.missions.length; i++) {
                        missions.push(modification.missions[i]);
                    };
                };
            };
            if (locationName.length >0) {
                for (var i=0; i<_locations.length;i++) {
                    if (_locations[i].getName() == locationName) {
                        if (newDisplayName) {
                            if (newDisplayName.length > 0) { _locations[i].setDisplayName(newDisplayName); }                            ;
                        };
                        if (newDescription) {
                            if (newDescription.length > 0) { _locations[i].setDescription(newDescription); }                            ;
                        };
                        for (var v = 0; v < inventory.length; v++) {
                            //@todo - add check for a "remove" attribute here? -- may need to support in underlying objects
                            if (inventory[v].getType() == "creature") {
                                inventory[v].go(null, _locations[i]); 
                            } else {
                                _locations[i].addObject(inventory[v]);  
                            };  
                        };
                        
                        for (var r = 0; r < removals.length; r++) {
                            if (_locations[i].objectExists(removals[r], true, false, false)) {
                                _locations[i].removeObject(removals[r], false);
                            };
                        };

                        for (var m = 0; m < missions.length; m++) {
                            _locations[i].addMission(missions[m]);
                        };
                        break;
                    };
                };
            };
        };

        self.removeLocation = function(removeLocationData){
            //console.debug("removing location: "+locationName);
            if (!removeLocationData) {
                console.debug("Map.removeLocation: no location data received for removal");   
                return true;
            };
            var locationName = removeLocationData.name;
            var removeCreatures = removeLocationData.removeCreatures;
            var locationToRemove;
            var locationToRemoveIndex = _locationIndexMap.indexOf(locationName);
            locationToRemove = _locations[locationToRemoveIndex];
            if (locationToRemove.getName() == locationName) {
                _locations.splice(locationToRemoveIndex,1); 
                _locationIndexMap.splice(locationToRemoveIndex,1); 
                delete _locationNamesToSyns[locationToRemove.getName()];
            } else {
                //we have a corrupted location map, find manually instead.
                for (var i=0; i<_locations.length;i++) {
                    if (_locations[i].getName() == locationName) {
                        //console.debug("location removed");
                        locationToRemove = _locations[i];
                        //I considered rather than removing the location entirely, leave it in but remove entrances to it
                        //decided to remove it but evacuate creatures first.
                        _locations.splice(i,1); 
                        var locName = _locationIndexMap[i];
                        if (locName == locationToRemove.getName()) {
                            _locationIndexMap.splice(i,1); 
                            delete _locationNamesToSyns[locName];
                        } else {
                            console.warn("Map.removeLocation: location index map corrupted, working manually for now but performance will be impacted");   
                        };
                        break;
                    };
                };
            };

            if (locationToRemove) {
                var locationName = locationToRemove.getName();
                var creatures = locationToRemove.getCreatures();
                if (removeCreatures) {
                    //kill and track removed creatures.
                    for (var c = 0; c < creatures.length; c++) {
                        creatures[c].kill();
                        _removedCreatures.push(creatures[c]);
                    };
                } else {
                    //all creatures take the first available exit...
                    for (var c = 0; c < creatures.length; c++) {
                        var exit = locationToRemove.getRandomExit(true);
                        if (!(exit)) {
                            var exits = locationToRemove.getAvailableExits(true);
                            if (exits.length > 0) {
                                exit = exits[0];
                            };
                        };
                        if (exit) {
                            //if there's truly no exit, the creature is lost!
                            creatures[c].go(exit.getDirection(), self.getLocation(exit.getDestinationName()));
                        };
                    };
                };
                //remove exits linking to this location
                for (var l=0; l<_locations.length;l++) {
                    _locations[l].removeExit(locationName);
                    //console.debug("exit removed from "+_locations[l].getName());
                };

                //remove *all* stored creature destinations referencing this location so they don't get stuck!
                var allCreatures = self.getAllCreatures();
                for (var c = 0; c < allCreatures.length; c++) {
                    allCreatures[c].removeDestination(locationName);
                };
            };
        };
        
        self.modifyLocationCreatures = function (modification) {
            //want to add affinity modification into this list
            var location;
            if (modification) {
                if (modification.name) {
                    if (modification.name == "all") {
                        location = self;
                    } else {
                        location = self.getLocation(modification.name);
                    };
                };
            };

            if (!location) {
                return true;
            };
            
            var creatures = location.getCreatures();
            if (creatures.length == 0) {
                return true;
            };
            
            var healthChange;
            var healthMultiplier;
            if (modification.health) {
                if (Math.floor(modification.health) < modification.health) {
                    healthMultiplier = modification.health;
                } else {
                    healthChange = modification.health;
                };
            };

            var newLocation;
            if (modification.teleport) {
                var newLocation = self.getLocation(modification.teleport);
            };

            for (var c = 0; c < creatures.length; c++) {
                if (healthChange) {
                    creatures[c].updateHitPoints(healthChange);
                };
                if (healthMultiplier) {
                    creatures[c].updateHitPointsByPercent(healthMultiplier);
                };
                if (newLocation) {
                    creatures[c].go(null, newLocation);
                };
                if (modification.destination) {
                    creatures[c].setDestination(modification.destination, "true"); //the "true" here sets this to their next immediate destination
                };
                if (modification.destinationDelay) {
                    creatures[c].setDestinationDelay(modification.destinationDelay, false);
                };
                if (modification.wait || modification.waitDelay) {
                    var delay = modification.wait;
                    if (!delay) { delay = modification.waitDelay;}
                    creatures[c].wait(null, delay); //sets an immediate wait
                };
                if (modification.maxHealth) {
                    creatures[c].updateMaxHitPoints(modification.maxHealth);
                };
                if (modification.carryWeight) {
                    creatures[c].updateCarryWeight(modification.carryWeight);
                };
                if (modification.money) {
                    creatures[c].updateCash(modification.money);
                };
                if (modification.repairSkills) {
                    if (Array.isArray(modification.repairSkills)) {
                        for (var r = 0; r < modification.repairSkills.length; r++) {
                            creatures[c].addSkill(modification.repairSkills[r]);
                        };
                    } else {
                        creatures[c].addSkill(modification.repairSkills);
                    };
                };
                if (modification.repairSkill) {
                    creatures[c].addSkill(modification.repairSkill);
                };
                if (modification.inventory) {
                    var inventory = creatures[c].getInventoryObject();
                    if (inventory) {
                        for (var i = 0; i < modification.inventory.length; i++) {
                            inventory.push(modification.inventory[i]);
                        };
                    };
                };
                if (modification.contagion) {
                    if (Array.isArray(modification.contagion)) {
                        for (var co = 0; co < modification.contagion.length; co++) {
                            creatures[c].setContagion(modification.contagion[co]);
                        };
                    } else {
                        creatures[c].setContagion(modification.contagion);
                    };                   
                };

            };

        };

        self.modifyObject = function(modification, player){
            var objectName = "";
            var newDisplayName;
            var newAttribs;
            //var newDescription;
            var inventory = [];
            if (modification) {

                if (modification.name) {
                    //only set name to value if set in modification (otherwise could be undefined)
                    objectName = modification.name;
                    //console.debug("modify object: "+ objectName);
                };                       
                newAttribs = modification.attributes;

                if (modification.inventory) {
                    for (var i = 0; i < modification.inventory.length; i++) {
                        //console.debug("adding " + modification.inventory[i].getName() + " to queue for " + objectName);
                        inventory.push(modification.inventory[i]);
                    };
                };

            };
            if (objectName.length >0) {
                var objectToModify = player.getObject(objectName);
                if (!(objectToModify)) {
                    objectToModify = self.getObject(objectName);
                };
                
                //alter attribs - note we only need to pass "new" attributes, existing ones should not be altered.               
                if (newAttribs) {
                    objectToModify.updateAttributes(newAttribs);
                };               

                if (inventory.length > 0) {
                    //add items to inventory
                    var objectInventory = objectToModify.getInventoryObject();
                    for (var v = 0; v < inventory.length; v++) {
                        //console.debug("adding " + modification.inventory[v].getName() + " to " + objectName);
                        objectInventory.forceAdd(inventory[v]);
                        //console.debug("Object added? " + objectInventory.check(inventory[v].getName()));
                    };
                };
            };
        };

        self.removeObject = function(objectName, sourceName, player) {
            var sourceObject;

            if (sourceName) {
                if (sourceName == "player") {
                    sourceObject = player;
                } else {
                    sourceObject = self.getObject(sourceName);
                };

                if (!(sourceObject)) {
                    sourceObject = self.getLocation(sourceName);
                };

                var inv = sourceObject.getInventoryObject();
                var removedObject = inv.remove(objectName, true);

                //success?
                if (removedObject) {return true;};
            };

            //if we didn't have a specific destination and owner passed in.
            //remove all objects matching given name!
            //loop through each location and location inventory. 
            //Get object (by name only, not synonym)
            //remove object.
            var objectsRemoved = false;
            for (var i=0;i<_locations.length;i++) {
                if (_locations[i].objectExists(objectName, true, true)) {
                    _locations[i].removeObject(objectName, true);
                    objectsRemoved = true;
                };
            };
            return objectsRemoved;
        };

        self.getLocations = function(){
            return _locations;
        };

        self.getLocationsJSON = function() {
            var locationsAsJSON = [];
            for (var i=0; i<_locations.length;i++) {
                try {
                locationsAsJSON.push(JSON.parse(_locations[i].toString()));
                } catch (e) {console.error("Error parsing JSON for location: error = "+e+": "+_locations[i].toString());};
            };
            locationsAsJSON.sort(tools.sortByProperty("name"));
            return locationsAsJSON;
        };

        self.getLocationsAsString = function() {
            var locationsAsString = [];
            for (var i=0; i<_locations.length;i++) {
                locationsAsString.push(_locations[i].toString());
            };
            locationsAsString.sort(tools.sortByProperty("name"));
            return locationsAsString;
        };

        self.getLocationsBySyn = function(synonym) {
            var locations = [];
            for (var locName in _locationNamesToSyns) {
                if (_locationNamesToSyns[locName].includes(synonym)) {
                    locations.push(self.getLocation(locName));
                };
            };
            return locations;
        };

        self.getSynonymsForLocation = function(locationName) {
            //returns an array of synonyms for a location
            if (_locationNamesToSyns.hasOwnProperty(locationName)) {
                return _locationNamesToSyns[locationName];
            }
            return [];
        };

        self.getClosestMatchingLocation = function(synonym, referenceLocation, inventory) {
            var closestLocation = null;
            var closestDistance = Infinity;

            var locations = self.getLocationsBySyn(synonym);
            for (var i = 0; i < locations.length; i++) {
                const directions = self.findBestPath(locations[i].getName(), 5, referenceLocation, inventory);
                if (!directions || directions.length == 0) {
                    continue; //no path found, skip this location
                };
                var distance = directions.length;
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestLocation = locations[i];
                }
            }
            return closestLocation;
        };

        self.getDistanceToLocation = function(locationName, referenceLocation, inventory) {
            //returns the distance to a location from a reference location
            //if no path is found, returns -1
            var directions = self.findBestPath(locationName, 5, referenceLocation, inventory);
            if (!directions || directions.length == 0) {
                return -1; //no path found
            };
            return directions.length;
        };

        self.getLocation = function(aName, useDisplayName){
            var index = _locationIndexMap.indexOf(aName);
            var returnLocation = _locations[index];
            if (returnLocation) {
                if (returnLocation.getName() == aName) {
                    //index map is working fine :)
                    return returnLocation;
                };
            };
            //we don't have name exposed any more...
            for(var index = 0; index < _locations.length; index++) {
                if(_locations[index].getName() == aName) {
                    //console.debug('location found: '+aName+' index: '+index);
                    //the index map is damaged if we got this far.
                    console.warn("Map.getLocation: location index map corrupted, working manually for now but performance will be impacted");   
                    return _locations[index];
                };
            };

            //try one more time with displayName instead...
            if (useDisplayName) {
                for (var index = 0; index < _locations.length; index++) {
                    if (_locations[index].getDisplayName().toLowerCase() == aName) {
                        //console.debug('location found using displayName: '+aName+' index: '+index);
                        return _locations[index];
                    };
                };
            };
            //console.debug('location not found: '+aName);
        };

        self.getStartLocation = function() {
            return _locations[_startLocationIndex]; //we just use the first location from the data.
        };

        self.getExit = function(aSource, aDirection, aDestination){
            var exit;
            for(var index = 0; index < _locations.length; index++) {
                if(_locations[index].getName() == aSource) {
                    //console.debug('exit source location found: '+aSource+' index: '+index);
                    exit = _locations[index].getExit(aDirection);
                    if (exit.getDestinationName() == aDestination) {return exit;}; 
                };
           };
           //console.debug('exit not found from '+aSource+', '+aDirection+' to '+aDestination);
        };

        self.getDoorFor = function(aSource, aDestination) {
            var location = self.getLocation(aSource);
            var doors = location.getAllObjectsOfType("door");
            for (var d=0;d<doors.length;d++) {
                var linkedExits = doors[d].getLinkedExits();
                for (var e=0;e<linkedExits.length;e++) {
                    if (linkedExits[e].getDestinationName() == aDestination) {return doors[d];};
                };
            };

            //no matching door found
            return null;
        };

        self.where = function(objectName, action, caller) {
            var currentLocation = caller.getCurrentLocation();
            var inventory = caller.getInventoryObject();
            var aggression = caller.getAggression();
            
                //is a location or distant object mentioned in the description?
                //can player see artefact/location from where they're standing?
                //try object first, then plain location name, then location display name, then syns            
                var desiredLocationName = self.getObjectLocationName(objectName, false, 2.5, false, currentLocation, inventory); //min visible size is "2.5" to be slightly more realistic.
                var desiredLocation;
                if (desiredLocationName) { 
                    desiredLocation = self.getLocation(desiredLocationName, true);
                };
                if (!desiredLocationName) {
                    desiredLocation = self.getLocation(objectName, true);
                    if (desiredLocation) { 
                        desiredLocationName = desiredLocation.getName(); 
                    };
                };
                if (!desiredLocationName) {
                    desiredLocation = self.getClosestMatchingLocation(objectName, currentLocation, inventory)
                    if (desiredLocation) { 
                        desiredLocationName = desiredLocation.getName(); 
                    };
                };
                if (desiredLocationName) {
                    let darkMessage = "";
                    let desiredObject = desiredLocation.getObject(objectName); //will fail if requested item is a location

                    let path = self.lineOfSightPathToDestination(desiredLocationName, currentLocation, currentLocation);
                    if (path) {
                        //we have direct line of sight...  if it's dark in the location and we are looking for an object...
                        if (desiredObject) {
                            if (desiredLocation.isDark()) {
                                //get the actual object so we can use prefixes/suffixes and check its size
                                if (desiredObject.getWeight() < 10) {
                                    return "Sorry, it's pretty dark out that way. You'll need to track "+desiredObject.getSuffix+" down yourself for now."
                                } else {
                                    //do we still get it if we can only see larger objects?
                                    darkMessage = "It's pretty dark out that way but... " 
                                };
                            };
                        };
                    };
                    if (!path) {
                        let LocationIsMentioned = currentLocation.getDescription().includes(desiredLocationName);
                        let ObjectIsMentioned = currentLocation.getDescription().includes(objectName);
                        //only do this if the location name whatever the player is looking for is mentioned in the current location description;
                        if (LocationIsMentioned || ObjectIsMentioned) {
                            //note, this comes out with the first direction to take being the last on the list! (as it's used as a navigation stack)
                            path = self.findBestPath(desiredLocationName, 5, currentLocation, inventory);
                            path.reverse(); //reverse the path so that the first direction is the first in the list.
                        };
                    };
                    if (path) {
                        //path found - we can see it.
                        var direction = tools.directions[tools.directions.indexOf(path[0]) + 1];
                        var toThe = "";
                        if (tools.directions.indexOf(direction) < 12) { toThe = "to the "; };
                        if (tools.directions.indexOf(direction) < 8) { direction = tools.initCap(direction); };
                        if (action == "go") {
                            return darkMessage+"From a quick peer around it looks like you'll need to head "+toThe+"<i>"+direction+"</i> from here."
                        };

                        //tweak wording depending on what we're looking for...
                        if (desiredObject) {
                            if (desiredObject.getType() == "creature") {
                                return darkMessage+"It looks like "+desiredObject.getDescriptivePrefix()+" in the "+desiredLocation.getDisplayName().toLowerCase()+". Head <i>"+direction+"</i> if you want to catch up with "+desiredObject.getSuffix()+"."
                            };
                            if (desiredObject.getWeight() >= 200 && caller.getType() == "player") { //200 is a good size threshold for large items from a distance
                                return desiredObject.getDetailedDescription(aggression, self, 200);
                            };
                        };
                        return darkMessage+"You peer toward the "+desiredLocation.getDisplayName().toLowerCase()+" but can't quite make any clear details out.<br>You'll need to find your way there to take a proper look. Start by heading "+toThe+"<i>"+direction+"</i>."
                    };
                };
            
            if (action == "go") {
                return "You'll need to explore and find your way there yourself I'm afraid.";
            };
                
            //return empty string if not found.
            return "";
        };

        self.notFoundFallback = function(objectName, container, caller) {
            var currentLocation = caller.getCurrentLocation();
            var inventory = caller.getInventoryObject();
            var you = "I";
            if (caller.getType() == "player") {
                you = "You";
            };

            //last few checks - is there a spilled liquid we're trying to get?
            if (currentLocation.spilledLiquidExists(objectName) || inventory.hasLiquid(objectName)) {
                return "There's not enough left to do anything useful with.";
            };

            // - are they looking thru a window or similar?
            var viewObjects = currentLocation.getAllObjectsWithViewLocation();
            if (viewObjects.length > 0) {
                for (var i=0;i<viewObjects.length;i++) {
                    var destination = self.getLocation(viewObjects[i].getViewLocation());
                    if (destination) {
                        var artefact = destination.getObject(objectName);
                        if (artefact) {
                            if (artefact.getWeight() >= tools.minimumSizeForDistanceViewing) {
                                return you+" can't reach "+artefact.getSuffix()+" from here.";
                            };
                        };
                    };
                };
            };

            //is it a drawing?
            var isPlayerArt = currentLocation.checkWritingOrDrawing(objectName);
            if (!isPlayerArt) {
                isPlayerArt = inventory.checkWritingOrDrawing(objectName);
            };

            if (isPlayerArt) {
                return "It's just some idle scrawl. Nothing anyone can do much with.";
            };

            if (objectName == currentLocation.getName().toLowerCase() || objectName == currentLocation.getDisplayName().toLowerCase()) {
                //trying to search whole location...
                let maybe = "";
                if (caller.getType() == "player") {
                    maybe = " <i>(Or maybe you do.)</i>"
                };
                return you+" don't have all day to root around everywhere."+maybe+"<br>Either way, you'll need to be more specific.";
            };
          
            //#566 is a creature carrying it?
                    let creatures = currentLocation.getCreatures()
                    for (var c=0; c< creatures.length;c++) {
                        var creaturesObject = creatures[c].getObject(objectName); //this will also handle synonyms

                        if (creaturesObject) {
                            return "It looks like "+creaturesObject.getSuffix()+" belongs to "+creatures[c].getFirstName()+".";
                        };

                        //do they sell it?
                        if (creatures[c].sells(objectName)) {
                            return "I think "+creatures[c].getFirstName()+" may have some for sale.";
                        };

                        //see if any of their active (or inactive without parent) missions deliver it...
                        let creatureMissions = creatures[c].getMissions();
                        for (var m=0; m < creatureMissions.length; m++) {
                            if (creatureMissions[m].isActive() || (!creatureMissions[m].hasParents())) {
                                let reward = creatureMissions[m].getRewardObject();
                                if (reward) {
                                    if (reward.syn(objectName)) {
                                        return tools.initCap(creatures[c].getFirstName())+" <i>might</i> have what you're looking for.";
                                    };
                                };
                            };
                        };
                    };

                    //#566 add handling in here for delivered items from artefacts. (creatures can't deliver items but their missions might - see just above)
                    //there are more efficient ways of handling this but we want to try normal routes first.
                    //get all artefacts from inventory, then location, then creatures.
                    //find out if any "deliver" what we're looking for.
                    let allArtefacts = inventory.getAllObjectsAndChildren(false); //not inaccessible things
                    allArtefacts = allArtefacts.concat(currentLocation.getAllObjectsAndChildren(false));
                    //console.debug(allArtefacts);
                    let deliveryItems = [];
                    for (var a=0; a<allArtefacts.length;a++) {
                        if (allArtefacts[a].getType() != 'creature') {
                            //do they sell it?
                            if (allArtefacts[a].sells(objectName)) {"I think "+allArtefacts[a].getName()+" may have some for sale."};

                            deliveryItems = allArtefacts[a].getDeliveryItems();
                            //if (deliveryItems.length > 0) {console.debug(deliveryItems)};
                            for (var d=0; d<deliveryItems.length;d++) {
                                if (deliveryItems[d].syn(objectName))  {
                                    return "There's "+allArtefacts[a].descriptionWithCorrectPrefix()+" nearby that might have what you're looking for.";
                                };
                            };
                        };                       
                    };

            //is is a location or distant object mentioned in the description?
            let whereIsIt = self.where(objectName, "action", caller);
            if (whereIsIt.length >0) {
                if (caller.getType() != "player")
                {
                    //reword one of the responses.
                    if (whereIsIt.includes("You peer toward")) {
                        whereIsIt = whereIsIt.slice(whereIsIt.indexOf("<br>")+4);
                    };
                }
                return whereIsIt;
            };
            
            var randomReplies;
            if (caller.getType() == "player") {
                if (container) {
                    if (container == "inventory") {
                        randomReplies = ["You're not carrying any " + objectName + ".", "You'll need to try somewhere (or someone) else for that.", "You don't have any " + objectName + " to hand right now."];
                    } else if (container == "location") {
                        randomReplies = ["You can't see any " + objectName + " around here.", "There's no sign of any " + objectName + " nearby. You'll probably need to look elsewhere.", "You'll need to try somewhere (or someone) else for that."];
                    } else if (typeof container == "object"){
                        randomReplies = ["There's no " + objectName + " in " + container.getDisplayName() + ".", "You can't see any " + objectName + " in " + container.getDisplayName() + ".", "There's no sign of any " + objectName + " in " + container.getDisplayName() + ". You'll probably need to look elsewhere.", "There's no " + objectName + " in " + container.getDisplayName() + " at the moment."];
                    };
                };
                
                if (!randomReplies) {
                    randomReplies = ["You can't see any " + objectName + " around here.", "There's no sign of any " + objectName + " nearby. You'll probably need to look elsewhere.", "You'll need to try somewhere (or someone) else for that.", "There's no " + objectName + " available here at the moment."];
                };
            } else {
                randomReplies = ["Sorry $player, I can't help you there.", "I've not seen any "+objectName+" around recently, sorry $player.", "I'm afraid you'll need to hunt that down yourself.", "Nope, sorry."];
            }
            
            var randomIndex = Math.floor(Math.random() * randomReplies.length);
            return randomReplies[randomIndex];
        };

        self.find = function(objectName, includeArtefacts,returnInternalLocationName, caller) {
            //note, this *won't* find objects delivered by a mission or delivered by another object.
            //it also deliberately does not find intangibles/scenery - unless caller is passed in as we move to fallback finding

            //loop through each location and location inventory. 
            //Get object (by synonym)
            //return location name when found
            for (var i=0;i<_locations.length;i++) {
                if (_locations[i].objectExists(objectName, false, false, true)) {
                    var foundLocationName;
                    if (returnInternalLocationName) {
                        foundLocationName = _locations[i].getName();
                    } else {
                        foundLocationName = _locations[i].getDisplayName().toLowerCase();
                    };
                    var foundObject = _locations[i].getObject(objectName);
                    if (foundObject.getType() == "creature") {
                        let s = "s";
                        let prefix = foundObject.getPrefix();
                        if (prefix == "They") {
                            s = "re"
                        };
                        return foundObject.getPrefix()+"'"+s+" somewhere around the "+foundLocationName+" area at the moment.";
                    };
                    if (includeArtefacts) {
                        return "I believe you'll find something like that around the "+foundLocationName+" area.";
                    };
                };
            };

            if (caller) {
                return self.notFoundFallback(objectName, null, caller);
            };

            //notfound replies
            var randomReplies = ["Sorry $player, I can't help you there."];
            var randomIndex = Math.floor(Math.random() * randomReplies.length);
            return randomReplies[randomIndex];
            
        };

        self.checkExists = function(objectName) {
            //note, this *won't* find objects delivered by a mission or delivered by another object.
            //it *will* find creatures

            //loop through each location and location inventory. 
            //Get object (by synonym)
            //return when found
            for (var i=0;i<_locations.length;i++) {
                if (_locations[i].objectExists(objectName)) {return true};
            };
            return false;
        };
        
        self.getInternalLocationName = function (locationName) {            
            //loop through each location
            //return when found
            for (var i = 0; i < _locations.length; i++) {
                if (_locations[i].getDisplayName().toLowerCase() == locationName.toLowerCase()) { return _locations[i].getName()};
            };
            return false;
        };

        self.getObject = function(objectName) {
            //note, this *won't* find objects delivered by a mission or delivered by another object.
            //it *will* retrieve creatures but not what they are carrying

            //loop through each location and location inventory. 
            //Get object (by synonym)
            //return when found
            for (var i=0;i<_locations.length;i++) {
                var object = _locations[i].getObject(objectName);
                if (object) {return object};
            };
            return null;
        };
        
        self.lineOfSightPathToDestination = function (destinationName, homeLocation, currentLocation, lastDirection, visitedLocations) {
            if (!(currentLocation)) { currentLocation = homeLocation; };
                
            if (!(visitedLocations)) { visitedLocations = [currentLocation.getName()]; }
            else { visitedLocations.push(currentLocation.getName()) };
            if (visitedLocations.length >= _locations.length) {
                return []; //@todo this prevents an infinite loop but may not work correctly
            };
                
            //console.debug("finding path from "+currentLocation.getName()+" to "+destinationName);
                
            if (currentLocation.getName() == destinationName) {
                //pathfinder destination found;
                return [];
            };
                
            var exits = currentLocation.getAvailableExits(false, null, false); //use only open exits
            if (exits.length == 1 && currentLocation.getName() != homeLocation.getName()) { return null; };
                
            for (var e = 0; e < exits.length; e++) {
                
                var direction = exits[e].getDirection();
                //only work in a straight line from home location
                if (direction != lastDirection && currentLocation.getName() != homeLocation.getName()) {
                    continue;
                };
                    
                if (exits[e].getDestinationName() == homeLocation.getName()) {
                    continue;
                };
                    
                if (visitedLocations.indexOf(exits[e].getDestinationName()) > -1) {
                    continue;
                };
                    
                var newPath = self.lineOfSightPathToDestination(destinationName, homeLocation, self.getLocation(exits[e].getDestinationName()), direction, visitedLocations);
                    
                if (newPath) {
                    newPath.push(exits[e].getDirection());
                    return newPath;
                };
            };
        };
        
        self.findBestPath = function(destinationName, attempts, currentLocation, inventory, avoiding) {
            if (!(attempts)) { attempts = 25 };
            if (isNaN(attempts)) { attempts = 25 };
            var bestPathLength = 1/0; //infinity
            var path;
            var duplicateCount = 0;
            for (var i=0;i<attempts;i++) {
                var tempPath = self.findPath(true, destinationName, currentLocation, currentLocation, inventory, avoiding);

                //if we can't find a path at the moment.
                if (!(tempPath)) {return [];};

                if (tempPath.length <= 2) {
                    //we've found the shortest possible path already, stop here.
                    return tempPath;
                };
                if (tempPath.length == bestPathLength) {
                   duplicateCount ++;
                }; 
                if (duplicateCount > 2  && attempts <=25) {
                    return tempPath;
                };
                if (tempPath.length < bestPathLength) {
                    path = tempPath;
                    bestPathLength = path.length;
                };
            };
            return path;
        };

        self.findPath = function(randomiseSearch, destinationName, homeLocation, currentLocation, inventory, avoiding, lastDirection, visitedLocations) {
            if (!(currentLocation)) {currentLocation = homeLocation;};

            if (!(visitedLocations)) {visitedLocations = [currentLocation.getName()];}
            else {visitedLocations.push(currentLocation.getName())};

            //console.debug("finding path from "+currentLocation.getName()+" to "+destinationName);

            if (currentLocation.getName() == destinationName) {
                //pathfinder destination found;
                return [];
             };       

            var exits = currentLocation.getAvailableExits(true, inventory, false); //don't use emergency exits!
            if (exits.length == 1 && currentLocation.getName() != homeLocation.getName()) {return null;};

            if (randomiseSearch) {
                exits = tools.shuffle(exits);
            };

            for (var e=0;e<exits.length;e++) {
                var direction = exits[e].getDirection();
                if (direction == tools.oppositeOf(lastDirection)) {
                    continue;
                };

                if (exits[e].getDestinationName() == homeLocation.getName()) {
                    continue;
                };

                if (visitedLocations) {
                    if (visitedLocations.indexOf(exits[e].getDestinationName()) >-1) {
                        continue;
                    };
                };
                if (avoiding) {
                    if (avoiding.indexOf(exits[e].getDestinationName()) >-1) {
                        continue;
                    };
                }

                var newPath = self.findPath(randomiseSearch, destinationName, homeLocation, self.getLocation(exits[e].getDestinationName()), inventory, avoiding, direction, visitedLocations);

                if (newPath) {
                    newPath.push(exits[e].getDirection());
                    return newPath;
                };
            };
        };

        self.getObjectLocationName = function (objectName, includeHiddenObjects, minObjectSize, searchCreatures, currentLocation, inventory) {
            //note, this *won't* find objects delivered by a mission or delivered by another object.
            //it *will* retrieve creatures
            
            if (!minObjectSize) {
                minObjectSize = 0;
            };
            
            //loop through each location and location inventory. 
            //Get object (by synonym)
            //we may get duplicates so find the *closest*
            var matchingLocationNames = [];
            for (var i = 0; i < _locations.length; i++) {
                var object = _locations[i].getObject(objectName, false, searchCreatures);
                if (object) {
                    if ((!object.isHidden()) || includeHiddenObjects || object.getType() == "scenery") {
                        if (object.getWeight() >= minObjectSize) {
                            matchingLocationNames.push(_locations[i].getName());
                        };
                    };
                };
            };

            if (matchingLocationNames.length == 0 ) {
                //notfound
                return null;
            } else if (matchingLocationNames.length == 1 ) {
                //only one match
                return matchingLocationNames[0]; 
            };

            var closestLocation = {name:"", distance: 99999};
            for (var l=0; l < matchingLocationNames.length; l++) {
                let distance = self.getDistanceToLocation(matchingLocationNames[l], currentLocation, inventory);
                if (distance < closestLocation.distance) {
                    closestLocation.name = matchingLocationNames[l];
                    closestLocation.distance = distance;
                };
            };

            return closestLocation.name;
        };

        self.globalAffinityChange = function() {
            null;
        };
        
        self.getAllLocations = function () {
            var locations = [];
            locations = locations.concat(_locations);
            return locations;
        };

        self.getAllCreatures = function() {
            //note, this *won't* find objects delivered by a mission or delivered by another object.

            //loop through each location and location inventory. 
            //Get all objects by type: creature
            var creatures = [];
            for (var i=0;i<_locations.length;i++) {
                creatures = creatures.concat(_locations[i].getAllObjectsOfType('creature'));
            };
            return creatures;
        };
           
        self.getCreatures = function () {
            return self.getAllCreatures();
        };
        
        self.getSkilledCreature = function (artefact) {
            var creatures = self.getAllCreatures();
            for (var c = 0; c < creatures.length; c++) {
                if (creatures[c].isDead()) { continue; };
                if (creatures[c].canRepair(artefact)) {
                    return creatures[c];
                }
            };
        };

        self.gatherAntibodyStats = function(creatures) {
            var antibodyData = {};
            for (var c=0;c<creatures.length;c++) { 
                var creatureAntibodies = creatures[c].getAntibodies();
                if (creatureAntibodies.length>0) {
                    for (var ca=0;ca<creatureAntibodies.length;ca++) {
                        //get list of all antibodies active
                        if (!(antibodyData.hasOwnProperty(creatureAntibodies[ca]))) {
                            //new antibody
                            antibodyData[creatureAntibodies[ca]] = 1;
                        } else {
                            //we've seen it before
                            antibodyData[creatureAntibodies[ca]] = antibodyData[creatureAntibodies[ca]]+1;
                        };
                    };
                };
            };
            return antibodyData;
        };

        self.gatherContagionStats = function(creatures) {
            var contagionData = {};
            for (var c=0;c<creatures.length;c++) {                
                var creatureContagion = creatures[c].getContagion();
                if (creatureContagion.length>0) {
                    for (var i=0;i<creatureContagion.length;i++) {
                        //get list of all contagions active
                        if (!(contagionData.hasOwnProperty(creatureContagion[i].getName()))) {
                            //new contagion
                            contagionData[creatureContagion[i].getName()] = 1;
                        } else {
                            //we've seen it before
                            contagionData[creatureContagion[i].getName()] = contagionData[creatureContagion[i].getName()]+1;
                        };
                    }
                };

            };

            return contagionData;
        };
        
        self.listDead = function () {
            var creatures = self.getAllCreatures();
            var deadList = [];
            for (var c = 0; c < creatures.length; c++) {
                if (creatures[c].isDead()) {
                    deadList.push(creatures[c].getName());
                };
            };

            return deadList.toString();
        };
        
        self.listInfected = function () {
            var creatures = self.getAllCreatures();
            var infectedList = [];
            for (var c = 0; c < creatures.length; c++) {
                var creatureContagion = creatures[c].getContagion();
                if (creatureContagion.length > 0) {
                    var name = creatures[c].getName();
                    if (creatures[c].isDead()) {
                        name += " (dead)";
                    } else {
                        name += " (health: "+creatures[c].healthPercent()+")";
                    };
                    infectedList.push(name);
                };
            };
            
            return infectedList.toString();
        };       
        
        self.listImmune = function () {
            var creatures = self.getAllCreatures();
            var immuneList = [];
            for (var c = 0; c < creatures.length; c++) {
                var creatureImmunity = creatures[c].getAntibodies();
                if (creatureImmunity.length > 0) {
                    immuneList.push(creatures[c].getName());
                };
            };
            
            return immuneList.toString();
        };               

        self.gatherContagionDeathTollStats = function(creatures) {
            var deathTollData = {"friendly":0, "hostile":0};
            for (var c=0;c<creatures.length;c++) { 
                if (creatures[c].isDead()) {
                    var creatureContagion = creatures[c].getContagion();
                    if (creatureContagion.length>0) {
                        if (creatures[c].getSubType() == "friendly") {
                            deathTollData.friendly++;
                        } else {
                            deathTollData.hostile++;
                        };
                    };
                };
            };

            return deathTollData;
        };
        
        self.getDeathTollReport = function () {
            var creatures = self.getAllCreatures();
            creatures = creatures.concat(_removedCreatures);
            var deathTollData = self.gatherDeathTollStats(creatures);
            
            var deathTollReport = "";
            
            if (deathTollData.friendly > 0) { deathTollReport += "Friendly death toll: " + deathTollData.friendly + "<br>"; }            ;
            if (deathTollData.hostile > 0) { deathTollReport += "Hostile death toll: " + deathTollData.hostile + "<br>"; }            ;
            
            //console.debug(deathTollReport);
            return deathTollReport;
        };

        self.getContagionReport = function(player) {
            var creatures = self.getAllCreatures();
            creatures.push(player); //add player to end of creatures array. They honor the same methods!

            var contagionData = self.gatherContagionStats(creatures);
            var antibodyData = self.gatherAntibodyStats(creatures);
            var deathTollData = self.gatherContagionDeathTollStats(creatures);
           

            //console.debug(contagionData);
            //console.debug(antibodyData);

            var contagionReport = "";

            for (var attr in contagionData) {
                contagionReport+= tools.initCap(attr)+ " infection level: "+Math.round((contagionData[attr]/creatures.length)*100)+"%<br>";
            };
            for (var attr in antibodyData) {
                contagionReport+= tools.initCap(attr)+ " immunity level: "+Math.round((antibodyData[attr]/creatures.length)*100)+"%<br>";
            };

            if (deathTollData.friendly >0) {contagionReport+="Friendly death toll: "+deathTollData.friendly+"<br>";};
            if (deathTollData.hostile >0) {contagionReport+="Hostile death toll: "+deathTollData.hostile+"<br>";};

            //console.debug(contagionReport);
            return contagionReport;
        //{"contagion":contagionData, "antibodies":antibodyData, "total":creatures.length}

        };
        
        self.gatherDeathTollStats = function (creatures) {
            var deathTollData = { "friendly": 0, "hostile": 0 };
            for (var c = 0; c < creatures.length; c++) {
                if (creatures[c].isDead()) {
                    if (creatures[c].getSubType() == "friendly") {
                        deathTollData.friendly++;
                    } else {
                        deathTollData.hostile++;
                    };
                };
            };
            
            return deathTollData;
        };
        
        self.gatherBleedingStats = function (creatures) {
            var bleedingData = { "friendly": 0, "hostile": 0 };
            for (var c = 0; c < creatures.length; c++) {
                if (creatures[c].isBleeding()) {
                    if (creatures[c].getSubType() == "friendly") {
                        bleedingData.friendly++;
                    } else {
                        bleedingData.hostile++;
                    };
                };
            };
            
            return bleedingData;
        };
        
        self.listAllActiveMissions = function(player) {
            return _missionController.listAllActiveMissions(player, _locations);
        };

        self.getAllMissions = function () {
            return _missionController.getAllMissions(_locations);
        };
        
        self.getNamedMission = function (missionName, player) {
            return _missionController.getNamedMission(missionName, _locations, player);
        };
        
        self.activateNamedMission = function (missionName, player) {
            var mission = self.getNamedMission(missionName, player);
            if (mission) {
                return _missionController.activateNamedMission(missionName, _locations, player);
            };
            return "Mission '" + missionName + "' not found.";
        };
        
        self.completeNamedMission = function (missionName, player) {
            var mission = self.getNamedMission(missionName, player);
            if (mission) {
                mission.clearParent();
                mission.setInitialAttributes(null);
                mission.startTimer();
                mission.setConditionAttributes({ "time": 1 });
                return "Mission '" + missionName + "' set to complete in 1 tick.";
            };
            return "Mission '" + missionName + "' not found.";
        };
        
        self.failNamedMission = function (missionName, player) {
            var mission = self.getNamedMission(missionName, player);
            if (mission) {
                mission.setInitialAttributes(null);
                mission.setFailAttributes({ "time": 1 });
                return "Mission '" + missionName + "' set to fail in 1 tick.";
            };
            return "Mission '" + missionName + "' not found.";
        };
        
        self.removeNamedMission = function (missionName, player) {
            var removed = _missionController.removeNamedMission(missionName, _locations, player);
            if (removed) {
                //@todo - should probably re-parse remaining missions and clear parents of any that were dependent or remove those too as they won't be completable if left alone
                _missionCount--;
            };
        };       
        
        self.listAllMissions = function (player) {
            return _missionController.listAllMissions(player, _locations);
        };
        
        self.getMissionOwner = function (missionName) {
            return _missionController.getMissionOwner(missionName, _locations);
        };
        
        self.updateMissions = function (time, player) {
            return _missionController.updateMissions(time, player, self);
        };

        self.getCreature = function(aCreatureName) {
            //get the first creature whose name matches the name passed in
            //loop through each location and location inventory. 
            //Get all objects by type: creature
            var creature;
            for (var i=0;i<_locations.length;i++) {
                creature = _locations[i].getObject(aCreatureName);
                if (creature) { //we have a name match - is it a creature?
                    if (creature.getType() == 'creature') {return creature;};
                };
            };
        };

    //end public member functions        
    }

    catch(err) {
	    console.error('Unable to create Map object: '+err.stack);
        throw err;
    };
};	
