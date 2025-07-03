"use strict";
//map builder object
exports.MapBuilder = function MapBuilder(mapDataPath, mapDataFile) {
    try{
        //module deps
        const tools = require('./tools');
        const validatorModule = require('./validator');        
        const fileManagerModule = require('./filemanager');
        const mapObjectModule = require('./map');
        const locationObjectModule = require('./location'); 
        const exitObjectModule = require('./exit'); 
        const artefactObjectModule = require('./artefact');
        const creatureObjectModule = require('./creature.js');
        const missionObjectModule = require('./mission.js');

        var missionsList = [];

        //source data: 
        //validate data first...
        const validator = new validatorModule.Validator(mapDataPath);
        validator.parseJSON();

        //console.debug(Object.keys(_data));
        const fm = new fileManagerModule.FileManager(true); //force use file-based mode for what we're wanting to do here
        var _data = fm.readAllJsonFiles(mapDataPath);
        var _rootLocationsJSON = _data[mapDataFile];
 

	    var self = this; //closure so we don't lose this reference in callbacks
        var _map = new mapObjectModule.Map();

        //consider storing all creatures and artefacts on map object (rather than in location, creature or player) 
        //this will need some major rework and tracking/linking who owns what
        //but might make all kinds of other work easier.

	    var _objectName = "MapBuilder";

        console.info(_objectName + ' created');
        
        //self.addDataFromDirectory = function (directory) {
        //    var newData = _requireDirectory(module, directory, { recurse: false });
        //    _data = newData.splice(_data)                
        //};

        self.buildFromFile = function (file, objectData) {
            if (objectData == undefined) {
                objectData = {};  
            };

            for (var property in file) {
                if (file.hasOwnProperty(property)) {
                    //copy in properties from file if not overridden on artefact
                    if (!objectData.hasOwnProperty(property)) {
                        //copy entire property
                        objectData[property] = file[property];
                    } else {
                        if (typeof objectData[property] == "object") {
                            //includes arrays - this can mean template arrays may be only *partially* overwritten - use caution
                            //recursively copy sub-properties
                            objectData[property] = self.buildFromFile(file[property], objectData[property]);
                        };
                    };
                };
            };
            
            return objectData;
        };
        
        
        self.buildFromTemplate = function (template, objectData) {
            for (var property in template) {
                if (template.hasOwnProperty(property)) {
                    //copy in properties from template if not overridden on artefact
                    if (!objectData.hasOwnProperty(property)) {
                        //copy entire property
                        objectData[property] = template[property];
                    } else {
                        if (typeof objectData[property] == "object") {
                            //includes arrays - this can mean template arrays may be only *partially* overwritten - use caution
                            //recursively copy sub-properties
                            objectData[property] = self.buildFromTemplate(template[property], objectData[property]);
                        };
                    };
                };
            };

            return objectData;
        };
        
        //public member functions
        self.buildArtefact = function(artefactData) {
            //console.debug('Building: '+artefactData.name);
            var usingTemplate = false;
            if (artefactData) {
                //construct from file first if needed
                //build from file before template
                if (artefactData.file) {
                    artefactData = self.buildFromFile(_data[artefactData.file]);
                };
                //start with template if defined
                if (artefactData.template) {
                    usingTemplate = true;
                    var template = _data[artefactData.template];
                    artefactData = self.buildFromTemplate(template, artefactData);
                };
            };

            if (artefactData.attributes) {
                //fill in attribute template if defined
                if (artefactData.attributes.template) {
                    var template = _data[artefactData.attributes.template];
                    artefactData.attributes = self.buildFromTemplate(template, artefactData.attributes);
                };
                if (artefactData.attributes.defaultResult) {
                    if (typeof (artefactData.attributes.defaultResult) == 'object') {
                        //we have a custom action that uses the same process as mission reward mechanism
                        artefactData.attributes.defaultResult = self.unpackReward(artefactData.attributes.defaultResult);
                    };
                };
                if (artefactData.attributes.type) {
                    if (artefactData.attributes.type == "creature") {
                        console.error("Cannot build Artefact '"+artefactData.name+"' type is 'creature'");
                    };
                };
            };

            try {
                
                var artefact;
                var inventory;
                var linkedExits = [];
                var delivers = [];

                if (artefactData.linkedexits) {
                    for (var j=0; j<artefactData.linkedexits.length; j++) {
                       linkedExits.push(_map.getExit(artefactData.linkedexits[j].source, artefactData.linkedexits[j].direction, artefactData.linkedexits[j].destination));
                    };
                };

                if (artefactData.delivers) {
                    for (var i = 0; i < artefactData.delivers.length; i++) {
                        delivers.push(self.buildArtefact(artefactData.delivers[i]));
                    };
                };
                
                artefact = new artefactObjectModule.Artefact(artefactData.name, artefactData.description, artefactData.detailedDescription, artefactData.attributes, linkedExits, delivers);
                if (!artefact) {
                    console.error("Error: Artefact data. Failed to create aretefact object" + artefactData + ".");
                };
                if (artefact.getType() == "food") {
                    if (!artefactData.attributes) {
                        console.warn("DATA QUALITY WARNING: food item " + artefactData.name + " has no attributes.");
                    } else {
                        if (!artefactData.attributes.smell) {
                            console.warn("DATA QUALITY WARNING: food item " + artefactData.name + " has no 'smell' attribute.");
                        };
                        if (!artefactData.attributes.taste) {
                            console.warn("DATA QUALITY WARNING: food item " + artefactData.name + " has no 'taste' attribute.");
                        };
                    };
                };
                if (artefactData.synonyms) {artefact.addSyns(artefactData.synonyms);};
                if (artefactData.inventory) {
                    //add items directly to inventory
                    inventory = artefact.getInventoryObject();
                    for (var i = 0; i < artefactData.inventory.length; i++) {
                        //construct from file first if needed
                        if (artefactData.inventory[i].file) {
                            artefactData.inventory[i] = self.buildFromFile(_data[artefactData.inventory[i].file]);
                        };
                        if (artefactData.inventory[i].object == "artefact") {
                            var position;
                            if (artefactData.inventory[i].attributes) {
                                position = artefactData.inventory[i].attributes.position;
                            }

                            var childArtefact = self.buildArtefact(artefactData.inventory[i]);

                            if (position) {
                                inventory.position(childArtefact, position);
                            } else {

                                if (inventory.canCarry(childArtefact)) {
                                    inventory.add(childArtefact);
                                } else {
                                    console.error("Error: Artefact data : " + childArtefact.getName() + " will not fit in " + artefact.getName() + ".");
                                };
                            };
                        };
                        //else if (artefactData.inventory[i].object == "creature") {inventory.add(self.buildCreature(artefactData.inventory[i]));};  //won't work - creatures need to "go" to a locaion at the moment
                    };
                };

                if (artefactData.missions) {
                    for (var j = 0; j < artefactData.missions.length; j++) {
                        //construct from file first if needed
                        if (artefactData.missions[j].file) {
                            artefactData.missions[j] = self.buildFromFile(_data[artefactData.missions[j].file]);
                        };
                        //console.debug("Building Mission for "+artefactData.name);
                        artefact.addMission(self.buildMission(artefactData.missions[j]));
                    };
                };

                if (artefact.getType() == "book") {
                    _map.incrementBookCount();
                };

                //check artefact has syns
                if (artefact.getSyns().length ==0) {console.warn("Usability check: artefact '"+artefact.getName()+"' has no synonyms defined.");};
                _map.addDictionaryEntry(artefact.getName(), artefact.getType(), artefact.getSyns());
                return artefact;
            } catch(err) {
	            console.error("MAP ERROR: Failed to build artefact: "+artefactData.name+": "+err.stack);
            };
        };

        self.buildCreature = function(creatureData) {
            //name, description, detailedDescription, attributes, carrying
            //console.debug('Building Creature: '+creatureData.name);
            var usingTemplate = false;
            if (creatureData) {
                //construct from file first if needed
                //build from file before template
                if (creatureData.file) {
                    creatureData = self.buildFromFile(_data[creatureData.file]);
                };
                //start with template if defined
                if (creatureData.template) {
                    usingTemplate = true;
                    var template = _data[creatureData.template];
                    creatureData = self.buildFromTemplate(template, creatureData);
                };
            };
            
            if (creatureData.attributes) {
                //fill in attribute template if defined
                if (creatureData.attributes.template) {
                    var template = _data[creatureData.attributes.template];
                    creatureData.attributes = self.buildFromTemplate(template, creatureData.attributes);
                };
                if (creatureData.attributes.defaultResult) {
                    if (typeof (creatureData.attributes.defaultResult) == 'object') {
                        //we have a custom action that uses the same process as mission reward mechanism
                        creatureData.attributes.defaultResult = self.unpackReward(creatureData.attributes.defaultResult);
                    };
                };
            };                       

            try {
                if (_map.checkExists(creatureData.name)) {
                    var templated = "";
                    if (usingTemplate) {
                        templated = " (templated)"
                    };
                    //console.debug("usability check: duplicate creature name/synonym '" + creatureData.name + "'" + templated + ".");
                };
                
                var creature;
                var inventory;
                var salesInventory;
                var missions;

                //determine name (proper noun or just noun)
                var creatureName = creatureData.name;

                //is their name a proper noun?
                if (tools.isProperNoun(creatureData.displayName)) {
                    if (creatureName.toLowerCase() != creatureData.displayName.toLowerCase()) {
                        console.warn("DATA QUALITY WARNING: proper noun for displayName '"+creatureData.displayName+"' doesn't match original creature name'"+creatureName+"'.");
                    };
                    creatureName = creatureData.displayName;
                }; //creature name is a proper noun

                creature = new creatureObjectModule.Creature(creatureName, creatureData.description, creatureData.detailedDescription, creatureData.attributes, null); //we add inventory later
                if (!creature) {
                    console.error("Error: Creature data. Failed to create creature object" + creatureData + ".");
                };                
                if (creatureData.synonyms) { creature.addSyns(creatureData.synonyms); };
                if (creatureData.dislikes) {creature.addDislikes(creatureData.dislikes);};
                if (creatureData.inventory) {
                    //add items directly to inventory
                    inventory = creature.getInventoryObject();
                    for (var i = 0; i < creatureData.inventory.length; i++) {
                        //construct from file first if needed
                        if (creatureData.inventory[i].file) {
                            creatureData.inventory[i] = self.buildFromFile(_data[creatureData.inventory[i].file]);
                        };
                        if (creatureData.inventory[i].object == "artefact") {
                            var position;
                            if (creatureData.inventory[i].attributes) {
                                position = creatureData.inventory[i].attributes.position;
                            }
                            if (position) {
                                inventory.position(self.buildArtefact(creatureData.inventory[i]), position); 
                            } else {
                                inventory.add(self.buildArtefact(creatureData.inventory[i]));
                            };

                        };
                        //else if (creatureData.inventory[i].object == "creature") {inventory.add(self.buildCreature(creatureData.inventory[i]));}; //won't work - creatures need to "go" to a locaion at the moment
                    };
                };
                if (creatureData.sells) {
                    //add items directly to inventory
                    salesInventory = creature.getSalesInventoryObject();
                    for (var i = 0; i < creatureData.sells.length; i++) {
                        //construct from file first if needed
                        if (creatureData.sells[i].file) {
                            creatureData.sells[i] = self.buildFromFile(_data[creatureData.sells[i].file]);
                        };
                        if (creatureData.sells[i].object == "artefact") { salesInventory.add(self.buildArtefact(creatureData.sells[i])); };
                        //else if (creatureData.sells[i].object == "creature") {salesInventory.add(self.buildCreature(creatureData.sells[i]));}; //won't work - creatures need to "go" to a locaion at the moment
                    };
                };
                if (creatureData.missions) {
                    for (var j = 0; j < creatureData.missions.length; j++) {
                        //construct from file first if needed
                        if (creatureData.missions[j].file) {
                            creatureData.missions[j] = self.buildFromFile(_data[creatureData.missions[j].file]);
                        };
                        //console.debug("Building Mission for "+creatureData.name);
                        creature.addMission(self.buildMission(creatureData.missions[j]));
                    };
                };

                _map.incrementCreatureCount();

                if (creature.getSyns().length ==0) {console.warn("Usability check: creature '"+creature.getName()+"' has no synonyms defined.");};
                _map.addDictionaryEntry(creature.getName(), creature.getType(), creature.getSyns());
                return creature;
            } catch(err) {
	            console.error("MAP ERROR: Failed to build creature: "+creatureData.name+": "+err.stack);
            };
        };

        self.unpackConditionAttributes = function(attributes) {
            //console.debug("Unpacking condition attributes: "+attributes);
            if (!(attributes)) {return null;};
            if (attributes.length == 0) {return null;};
            var returnObject = {};
            for (var attr in attributes) {
                if (attributes.hasOwnProperty(attr)) {returnObject[attr] = attributes[attr];};
            };
            //fix strings to booleans
            for (var attr in returnObject) {
                if (returnObject[attr] == 'true') {returnObject[attr] = true;};
                if (returnObject[attr] == 'false') {returnObject[attr] = false;};
            };
            //console.debug("Unpacked condition attributes");
            return returnObject;
        };
        
        self.unpackModifyObject = function (modification) {
            var resultObject = {};
            if (modification.name) { resultObject.name = modification.name };
            if (modification.description) { resultObject.description = modification.description };
            if (modification.attributes) { resultObject.attributes = modification.attributes };
            if (modification.inventory && modification.name) {
                resultObject.inventory = [];
                for (var i = 0; i < modification.inventory.length; i++) {
                    var inventoryData = modification.inventory[i];
                    //construct from file first if needed
                    if (inventoryData.file) {
                        inventoryData = self.buildFromFile(_data[inventoryData.file]);
                    };
                    if (inventoryData.object == "artefact") {
                        resultObject.inventory.push(self.buildArtefact(inventoryData));
                    } else if (inventoryData.object == "creature") {
                        var creature = self.buildCreature(inventoryData)
                        if (inventoryData.attributes) {
                            if (inventoryData.attributes.homeLocationName) {
                                var homeLocation = _map.getLocation(inventoryData.attributes.homeLocationName);
                                creature.setHomeLocation(homeLocation);
                            };
                        };
                        resultObject.inventory.push(creature);
                    };
                };
            };
            
            //add other attributes back in if we missed them
            for (var attr in modification) {
                if (modification.hasOwnProperty(attr)) {
                    if (!(resultObject.hasOwnProperty(attr))) {
                        resultObject[attr] = modification[attr];
                    };
                };
            };

            return resultObject;
        };
        
        var buildModifyLocationObject = function (modifyLocationData) {
            var modifyLocation = {};
            if (modifyLocationData.name) { modifyLocation.name = modifyLocationData.name };
            if (modifyLocationData.description) { modifyLocation.description = modifyLocationData.description };
            if (modifyLocationData.remove) { modifyLocation.remove = modifyLocationData.remove };
            
            if (modifyLocationData.inventory && modifyLocationData.name) {
                modifyLocation.inventory = [];
                for (var i = 0; i < modifyLocationData.inventory.length; i++) {
                    var inventoryData = modifyLocationData.inventory[i];
                    //construct from file first if needed
                    if (inventoryData.file) {
                        inventoryData = self.buildFromFile(_data[inventoryData.file]);
                    };
                    if (inventoryData.object == "artefact") {
                        modifyLocation.inventory.push(self.buildArtefact(inventoryData));
                    } else if (inventoryData.object == "creature") {
                        var creature = self.buildCreature(inventoryData)
                        if (inventoryData.attributes) {
                            if (inventoryData.attributes.homeLocationName) {
                                var homeLocation = _map.getLocation(inventoryData.attributes.homeLocationName);
                                creature.setHomeLocation(homeLocation);
                            };
                        };
                        modifyLocation.inventory.push(creature);
                    };
                };
            };

            if (modifyLocationData.missions && modifyLocationData.name) {
                modifyLocation.missions = [];
                for (var m = 0; m < modifyLocationData.missions.length; m++) {
                    //console.debug("Building Mission for "+modifyLocation.name);
                    modifyLocation.missions.push(self.buildMission(modifyLocationData.missions[m]));
                };
            }

            return modifyLocation;
        };

        self.unpackReward = function (reward) {
            //construct from file first if needed
            if (reward.file) {
                reward = self.buildFromFile(_data[reward.file]);
            };
            //console.debug("Unpacking reward: "+reward);
            var returnObject = {};
            //set maximum possible game score...
            if (reward.score) {
                //note some missions reduce score so we only add  those > 0
                if (reward.score>0) {_map.increaseMaxScore(reward.score);};
            };
            if (reward.delivers) {
                returnObject.delivers = null;
                var deliveryObject = self.buildArtefact(reward.delivers);
                returnObject.delivers = deliveryObject;
                //console.debug("Built delivery object");
                //returnObject.delivers = self.buildArtefact(returnObject.delivers);
            };
            if (reward.locations) {
                returnObject.locations = [];
                for (var l = 0; l < reward.locations.length; l++) {
                    //construct from file first if needed
                    if (reward.locations[l].file) {
                        reward.locations[l] = self.buildFromFile(_data[reward.locations[l].file]);
                    };
                    var rewardLocation = self.buildLocation(reward.locations[l]);
                    for (var j=0; j<reward.locations[l].exits.length;j++) {
                        var exitData = reward.locations[l].exits[j];
                        //manually add exits from each location (linking not needed)
                        rewardLocation.addExit(exitData.direction, exitData.source, exitData.destination, exitData.description, exitData.hidden, exitData.requiredAction);
                    }; 
                    if (reward.locations[l].inventory) {
                        for (var i=0; i<reward.locations[l].inventory.length;i++) {
                            var inventoryData = reward.locations[l].inventory[i];
                            //construct from file first if needed
                            if (inventoryData.file) {
                                inventoryData = self.buildFromFile(_data[inventoryData.file]);
                            };
                            //manually add exits from each location (linking not needed)
                            if (inventoryData.object == "artefact") {
                                rewardLocation.addObject(self.buildArtefact(inventoryData));
                            } else if (inventoryData.object == "creature") {
                                var creature = self.buildCreature(inventoryData)
                                if (inventoryData.attributes) {
                                    if (inventoryData.attributes.homeLocationName) {
                                        var homeLocation = _map.getLocation(inventoryData.attributes.homeLocationName);
                                        creature.setHomeLocation(homeLocation);
                                    };
                                };
                                creature.go(null, rewardLocation);                           
                            };                        
                        }; 
                    };
                    if (reward.locations[l].missions) {
                        for (var m = 0; m < reward.locations[l].missions.length; m++) {
                            //console.debug("Building Mission for "+rewardLocation.name);
                            rewardLocation.addMission(self.buildMission(reward.locations[l].missions[m]));
                        };
                    };
                    returnObject.locations.push(rewardLocation);
                }; 
            };

            if (reward.modifyLocation) {
                returnObject.modifyLocation = buildModifyLocationObject(reward.modifyLocation)
            };

            if (reward.modifyLocations) {
                returnObject.modifyLocations = [];
                for (var l = 0; l < reward.modifyLocations.length; l++) {
                    returnObject.modifyLocations.push(buildModifyLocationObject(reward.modifyLocations[l]));
                };
            };

            if (reward.exits) {
               returnObject.exits = []; 
               for (var e=0; e<reward.exits.length;e++) {
                    var exitData = reward.exits[e];
                    returnObject.exits.push(new exitObjectModule.Exit (exitData.direction, exitData.source, exitData.destination, exitData.description, exitData.hidden, exitData.requiredAction));
                }; 
            };

            if (reward.modifyObject) {
                returnObject.modifyObject = self.unpackModifyObject(reward.modifyObject);
            };

            if (reward.modifyObjects) {
                returnObject.modifyObjects = [];
                for (var m = 0; m < reward.modifyObjects.length; m++) {
                    returnObject.modifyObjects.push(self.unpackModifyObject(reward.modifyObjects[m]));
                };
            };

            //add other attributes back in
            //this should cover removeObject, removeLocation, removeLocations
            for (var attr in reward) {
                if (reward.hasOwnProperty(attr)) {
                    if (!(returnObject.hasOwnProperty(attr))) {
                        returnObject[attr] = reward[attr];                    
                    };
                };
            };

            //console.debug("Unpacked Reward");
            return returnObject;
        };

        self.buildMission = function(missionData) {
            //console.debug("Building mission: "+missionData.name);
            missionsList.push(missionData.name);
            //name, description, dialogue, parent, missionObject, isStatic, condition, destination, reward, fail
            if (missionData.file) {
                missionData = self.buildFromFile(_data[missionData.file]);
            };
            try {
                var conditionAttr;
                var initialAttr;
                var failAttr;
                if (missionData.conditionAttributes) {
                    conditionAttr = self.unpackConditionAttributes(missionData.conditionAttributes);
                };
                if (missionData.initialAttributes) {
                    initialAttr = self.unpackConditionAttributes(missionData.initialAttributes);
                };
                if (missionData.failAttributes) {
                    failAttr = self.unpackConditionAttributes(missionData.failAttributes);
                };
                
                var rewardData;
                if (missionData.reward) {
                    rewardData = self.unpackReward(missionData.reward);
                } else {
                    //reward is generally mandatory - even if it's just an empty object.
                    //this section is here just to keep logs clear on what's wrong without blowing up.
                    console.error("Error: No reward object found for mission: " + missionData.name);
                    rewardData = {}; 
                };              

                var failData;
                if (missionData.fail) { 
                    failData = self.unpackReward(missionData.fail); 
                };

                if (missionData.attributes) {
                    //@todo - unpack/build mission parent object
                    if (missionData.attributes.missionObject) {
                        if (missionData.attributes.missionObject.toLowerCase() != missionData.attributes.missionObject) {
                            console.warn("MISSION DATA WARNING: missionObject contains mixed case; may not be true objectName'"+missionData.attributes.missionObject+"'.");
                        };
                    };
                    if (missionData.attributes.destination) {
                        if (missionData.attributes.destination.toLowerCase() != missionData.attributes.destination) {
                            console.warn("MISSION DATA WARNING: mission destination contains mixed case; may not be true objectName'"+missionData.attributes.destination+"'.");
                        };
                    };
                    if (missionData.attributes.parents) {
                        missionData.attributes.parents = self.unpackConditionAttributes(missionData.attributes.parents);
                    };
                    if (missionData.attributes.type == "event") {
                        _map.incrementEventCount();
                    } else {
                        _map.incrementMissionCount();
                    };
                } else {
                    _map.incrementMissionCount();
                };
                

                var newMission = new missionObjectModule.Mission(missionData.name, missionData.displayName, missionData.description, missionData.attributes, initialAttr, conditionAttr, failAttr, rewardData, failData);
                return newMission;
            } catch(err) {
	            console.error("MAP ERROR: Failed to build mission: "+missionData.name+": "+err.stack);
            };
        };

        self.buildLocation = function (locationData) {
            if (locationData.file) {
                locationData = self.buildFromFile(_data[locationData.file]);
            };
            try {
                if (_map.getLocation(locationData.name)) {console.warn("DATA QUALITY WARNING: duplicate location name '"+locationData.name+"'.");};
                if (locationData.attributes) {
                    if (locationData.attributes.dark == "true" || locationData.attributes.dark == true) {locationData.attributes.dark = true;}
                    else {locationData.attributes.dark=false;};
                    if (locationData.attributes.start == "true" || locationData.attributes.start == true) {locationData.attributes.start = true;}
                    else {locationData.attributes.start=false;};
                } else {
                    locationData.attributes = {};
                };
                if (locationData.synonyms) {locationData.attributes.synonyms = locationData.synonyms;};
                    //locationData.synonyms.forEach(function(synonym) {
                    //    _map.addLocationSynonym(locationData.name, synonym);
                    //});
                var newLocation = new locationObjectModule.Location(locationData.name,locationData.displayName,locationData.description,locationData.attributes);
                _map.addDictionaryEntry(newLocation.getName(), "location", newLocation.getSyns());
                return newLocation;
            }  catch(err) {
	            console.error("MAP ERROR: Failed to build location: "+locationData.name+": "+err.stack);
            };
        };
        
        self.addLocation = function(location){
                var newIndex = _map.addLocation(location);
        };

        self.buildGameObjects = function(gameDataAsJSON) {
            //build from files
            console.info("Building main data...");
            for (var i = 0; i < gameDataAsJSON.length; i++) {
                if (gameDataAsJSON[i].file) {
                    //overwrite game data element with named file
                    var builtFile = self.buildFromFile(_data[gameDataAsJSON[i].file]);
                    gameDataAsJSON[i] = builtFile;                    
                };
            };
            console.info("Main data built.");
            
            ///////////////
            //locations and links
            console.info("Building locations...");
            for (var i=0; i<gameDataAsJSON.length;i++) {
                if (gameDataAsJSON[i].object == "location") {
                    var locationData = gameDataAsJSON[i]
                    var builtLocation = self.buildLocation(gameDataAsJSON[i]);
                    self.addLocation(builtLocation);
                    var newLocation = _map.getLocation(locationData.name);

                    if (locationData.exits) {
                        for (var j=0; j<locationData.exits.length;j++) {
                            var exitData = locationData.exits[j];
                            //manually add exits from each location (linking not needed)
                            if (!exitData.source) {
                                exitData.source = locationData.name;
                            };
                            newLocation.addExit(exitData.direction, exitData.source, exitData.destination, exitData.description, exitData.hidden, exitData.requiredAction);
                        };
                    };
                }; 
            };
            console.info("Locations built.");
            
            console.info("Building objects, creatures and missions...");
            //once all locations are built, add objects, creatures and missions.
            for (var i=0; i<gameDataAsJSON.length;i++) {
                if (gameDataAsJSON[i].object == "location") {
                    var locationData = gameDataAsJSON[i]
                    //get matching location object
                    var location = _map.getLocation(locationData.name);
                
                    //add objects and creatures to locations (this includes their child, deliver and mission objects!)
                    if (locationData.inventory) {
                        for (var k = 0; k < locationData.inventory.length; k++) {
                            //construct from file first if needed
                            if (locationData.inventory[k].file) {
                                locationData.inventory[k] = self.buildFromFile(_data[locationData.inventory[k].file]);
                            };
                            //build artefacts or creatures
                            if (locationData.inventory[k].object == "artefact") {location.addObject(self.buildArtefact(locationData.inventory[k]));}
                            else if (locationData.inventory[k].object == "creature") {
                                var creature = self.buildCreature(locationData.inventory[k])
                                if (locationData.inventory[k].attributes) {
                                    if (locationData.inventory[k].attributes.homeLocationName) {
                                        var homeLocation = _map.getLocation(locationData.inventory[k].attributes.homeLocationName);
                                        creature.setHomeLocation(homeLocation);
                                    };
                                };

                                creature.go(null, location);                           
                            };
                        };
                    };

                    //add missions to locations
                    if (locationData.missions) {
                        for (var l = 0; l < locationData.missions.length; l++) {
                            //construct from file first if needed
                            if (locationData.missions[l].file) {
                                locationData.missions[l] = self.buildFromFile(_data[locationData.missions[l].file]);
                            };
                            //add mission
                            //console.debug("Building Mission for "+locationData.name);
                            location.addMission(self.buildMission(locationData.missions[l]));
                        };
                    };

                    //@todo - validate all exits have valid destinations and warn if not
                    //@todo - validate all mission objects and destinations have objects in map and warn if not
                };                       
            };
            console.info("Objects, creatures and missions built.");
            //console.debug("Missions..."+missionsList);

            //build spawn data
            for (var i=0; i<gameDataAsJSON.length;i++) {
                if (gameDataAsJSON[i].object == "spawn") {
                    null;
                };
            };

            console.info("Finished building game data.");

        };

        //note, "fromDirection" should be the lowercase short version (e.g. "u" or "n")
        self.link = function(fromDirection, fromLocationName, toLocationName, fromDescription, toDescription, toIsHidden, fromIsHidden, toRequiredAction, fromRequiredAction) {
             var toDirection = tools.oppositeOf(fromDirection);
             //console.debug('from:'+fromDirection+' to:'+toDirection);
             var fromLocation = _map.getLocation(fromLocationName);
             var toLocation = _map.getLocation(toLocationName);
             var temp = fromLocation.addExit(fromDirection,fromLocation.getName(),toLocation.getName(), toDescription, toIsHidden, toRequiredAction);
             var temp2 = toLocation.addExit(toDirection,toLocation.getName(),fromLocation.getName(), fromDescription, fromIsHidden, fromRequiredAction);
             //console.debug('locations linked');
             //console.debug ("Exit 1:"+temp.toString());
             //console.debug ("Exit 2:"+temp2.toString());
             return fromLocation.getName()+' linked '+fromDirection+'/'+toDirection+' to '+toLocation.getName();
        };

        self.buildMap = function(mapData){
            if (!(mapData)) {mapData = _rootLocationsJSON;};
            _map = new mapObjectModule.Map();
            if (mapData[0].object == "player") {mapData.splice(0, 1);};
            self.buildGameObjects(mapData);   
            return _map;    
                     
            //end of "init"
            //self.addLocation("bike-ambulance", "You're standing in the west car park by the bike ambulance.", false);
            //self.link("e", "bike-ambulance", "west-bike-racks",false, false);
        };


    //end public member functions        
    }

    catch(err) {
	    console.error('Unable to create MapBuilder object: '+err.stack);
        throw err;
    };
};	
