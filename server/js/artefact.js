"use strict";
//artefact object 
                                    
module.exports.Artefact = function Artefact(name, description, detailedDescription, attributes, linkedExits, delivers) { 
    try{  
        //module deps
        const tools = require('./tools.js');
        const inventoryObjectModule = require('./inventory');    
        const missionObjectModule = require('./mission.js');
        const contagionObjectModule = require('./contagion.js');
        const customAction = require('./customaction.js');

        //attributes
	    var self = this; //closure so we don't lose this reference in callbacks
        var _sourceAttributes = attributes; //so we can clone.
        var _name = name.toLowerCase();
        var _synonyms = [];
        var _defaultAction = "examine";
        var _defaultResult = null;
        var _customAction = null;
        var _initialDescription = description; //save this for repairing later
        var _description = description;
        var _initialDetailedDescription = detailedDescription; //save this for repairing later
        var _extendedInventoryDescription = "";
        var _detailedDescription = detailedDescription;
        var _weight = 0;
        var _nutrition = 0;
        var _plural = false; //if we have -1 here, it's an unlimited plural.
        var _price = 0; //all items have a price (value). If it's positive, it can be bought and sold.
        var _attackStrength = 0;
        var _affinityModifier = 1;
        var _inventory =  new inventoryObjectModule.Inventory(0, 0, _name);
        var _type = "junk";
        var _subType = "";
        var _linkedExits = [];
        var _collectable = false; //if not collectable, it also can't be completely removed from the game. Leave wreckage
        var _missions = [];
        var _read = false;
        var _sharpened = 0;
        var _polished = 0;
        var _opens = false;
        var _open = false;
        var _charges =-1; //-1 means unlimited
        var _saleUnit =-1; //-1 means sell all
        var _burnRate = 0; //doesn't used up charges by default
        var _chargeUnit = "";
        var _chargesDescription = "";
        var _switched = false;
        var _flammable = false;
        var _explosive = false;
        var _on = false;
        var _edible = false;
        var _chewed = false;
        var _damaged = false;
        var _breakable = false;
        var _broken = false;
        var _destroyed = false; //broken beyond repair
        var _locked = false;
        var _lockable = false;
        var _autoLock = -1;
        var _lockInMoves = -1;
        var _unlocks = ""; //unique name of the object that it unlocks. 
        var _componentOf = []; //unique names of the object this is a component of.
        var _combinesWith = ""; //unique name of the object this can combine with.
        var _requiredComponentCount = 0; //in conjunction with above will allow us to know if an object has all its components.
        var _delivers = delivers || []; //what does this deliver when all components are in place? (it uses a charge of each component to do so)--
        var _hideDeliveryDescription = false;
        var _combinesDescription = "";
        var _requiresContainer = false;
        var _requiredContainer = null;
        var _liquid = false;
        var _powder = false;
        var _holdsLiquid = false;
        var _hidden = false; 
        var _position; 
        var _hasLinkedDoor = false;
        var _imageName;
        var _smell;
        var _sound;
        var _taste;
        var _texture;
        var _contagion = [];
        var _antibodies = [];
        var _canDrawOn = false;
        var _drawings = [];
        var _writings = [];
        var _typings = [];
        var _wetted = [];
        var _viewDestination;

        //grammar support...
        var _prefix = "It";
        var _suffix = "it";
        var _possessiveSuffix = "its";
        var _descriptivePrefix = "It's";

        /*
        self.mendable = mendable;
        self.uses = uses;
        self.rechargable = rechargable;
        */

	    var _objectName = "artefact";

        //add linked exits
        if (linkedExits) { _linkedExits = linkedExits;};

        self.setPluralGrammar = function(isPlural, itemDescription) {           
            _plural = isPlural;
            if (itemDescription.substring(0,8) == "pair of ") {
                _plural = true;
            };

            //set plural grammar for more sensible responses
            if (_plural) {
                if (_liquid) {
                    _prefix = "It";
                    _suffix = "it";
                    _possessiveSuffix = "its";
                    _descriptivePrefix = "it's";
                } else {
                    _prefix = "They";
                    _suffix = "them";
                    _possessiveSuffix = "their";
                    _descriptivePrefix = "they're";
                };
            }
            else {               
                _prefix = "It";
                _suffix = "it";
                _possessiveSuffix = "its";
                _descriptivePrefix = "it's";
            };
        };

        var doesPlural = function() {
            if (_plural) {
                return "don't";
             };
            return "doesn't";
        };
        
        self.healthPercent = function () {
            return 100;
        };
        
        self.isPlural = function () {
            return _plural;
        };

        self.hasPlural = function() {
            if (_plural) {
                return "have";
             };
            return "has";
        };

        self.showsPlural = function() {
            if (_plural) {
                return "show";
             };
            return "shows";
        };
        
        self.updateAttributes = function (newAttributes) {
            processAttributes(newAttributes);
        };

        var processAttributes = function (artefactAttributes) {
            if (_initialDetailedDescription == "") {
                _initialDetailedDescription ="There's nothing of interest here.";
                _detailedDescription = _initialDetailedDescription;
            };
            if (!artefactAttributes) { return null; };
            if (artefactAttributes.initialDetailedDescription != undefined) { _initialDetailedDescription = artefactAttributes.initialDetailedDescription; };
            if (artefactAttributes.initialDescription != undefined) { _initialDescription = artefactAttributes.initialDescription; };
            if (artefactAttributes.description != undefined) { _description = artefactAttributes.description; };
            if (artefactAttributes.detailedDescription != undefined) { _detailedDescription = artefactAttributes.detailedDescription; };
            if (artefactAttributes.synonyms != undefined) { _synonyms = artefactAttributes.synonyms;};
            if (artefactAttributes.defaultAction != undefined) { _defaultAction = artefactAttributes.defaultAction;};
            if (artefactAttributes.defaultResult != undefined) { _defaultResult = artefactAttributes.defaultResult;};
            if (artefactAttributes.customAction != undefined) { _customAction = artefactAttributes.customAction;};
            if (artefactAttributes.requiresContainer != undefined) {
                if (artefactAttributes.requiresContainer== true || artefactAttributes.requiresContainer == "true") { _requiresContainer = true;};
            };
            if (artefactAttributes.isLiquid != undefined) {
                if (artefactAttributes.isLiquid== true || artefactAttributes.isLiquid == "true") { 
                    _liquid = true;
                    _requiresContainer = true; //override requires container if liquid.
                    artefactAttributes.plural = true; //override plural
                };              
            };
            if (artefactAttributes.isPowder != undefined) {
                if (artefactAttributes.isPowder== true || artefactAttributes.isPowder == "true") { 
                    _powder = true;
                    _requiresContainer = true; //override requires container if powder.
                    artefactAttributes.plural = true; //override plural
                };              
            };
            if ((artefactAttributes.plural != undefined) || _description.substring(0,8) == "pair of ") {self.setPluralGrammar(artefactAttributes.plural, _description);};
            if (artefactAttributes.extendedInventoryDescription != undefined) {
                _extendedInventoryDescription = artefactAttributes.extendedInventoryDescription;
            } else {
                if (_prefix == "It") {
                    _extendedInventoryDescription = _prefix+" contains $inventory."
                } else {
                    _extendedInventoryDescription = _prefix+" contain $inventory."
                };
            };
            if (artefactAttributes.carryWeight != undefined) {_inventory.setCarryWeight(attributes.carryWeight);};
            if (artefactAttributes.lockable != undefined) {
                if (artefactAttributes.lockable== true || artefactAttributes.lockable == "true") { _lockable = true;};
            };
            
            //note, if autolock is set but object isn't "Lockable", it'll just auto-close
            if (artefactAttributes.lockInMoves != undefined) {
                if (artefactAttributes.lockInMoves >= 0) { _lockInMoves = artefactAttributes.lockInMoves; };
            };               
            if (artefactAttributes.autoLock != undefined) {
                if (artefactAttributes.autoLock >= 0) {
                    _autoLock = artefactAttributes.autoLock;
                    if (_lockInMoves < 0) {_lockInMoves = _autoLock };
                };
            };
     

            if (artefactAttributes.locked != undefined) {
                if (artefactAttributes.locked== true || artefactAttributes.locked == "true") { _locked = true;};
            };
            if (artefactAttributes.canCollect != undefined) {
                if (artefactAttributes.canCollect== true || artefactAttributes.canCollect == "true") { _collectable = true;};
            };
            if (artefactAttributes.read != undefined) {
                if (artefactAttributes.read== true || artefactAttributes.read == "true") { _read = true;};
            };
            if (artefactAttributes.canOpen != undefined) {
                //lockable items are openable so ignore "canOpen" attribute.
                if (_lockable) {_opens = true;}
                else {
                    if (artefactAttributes.canOpen== true || artefactAttributes.canOpen == "true") { _opens = true;};                    
                };
            };
            if (artefactAttributes.isOpen != undefined) {
                if (artefactAttributes.isOpen== true || artefactAttributes.isOpen == "true") { _open = true;};
            };
            if (artefactAttributes.charges != undefined) {_charges = artefactAttributes.charges;};
            if (artefactAttributes.burnRate != undefined) {_burnRate = parseFloat(artefactAttributes.burnRate);};
            if (artefactAttributes.chargeUnit != undefined) {_chargeUnit = artefactAttributes.chargeUnit;};
            if (artefactAttributes.chargesDescription != undefined) {_chargesDescription = artefactAttributes.chargesDescription;};
            if (artefactAttributes.saleUnit != undefined) { _saleUnit = artefactAttributes.saleUnit; };           
            if (artefactAttributes.hideDeliveryDescription != undefined) { _hideDeliveryDescription = artefactAttributes.hideDeliveryDescription; };
            if (artefactAttributes.combinesDescription != undefined) {_combinesDescription = artefactAttributes.combinesDescription;};


            if (artefactAttributes.switched != undefined) {
                if (artefactAttributes.switched== true || artefactAttributes.switched == "true") { _switched = true;};
            };
            if (artefactAttributes.flammable != undefined) {
                if (artefactAttributes.flammable == true || artefactAttributes.flammable == "true") { _flammable = true; };
            };
            if (artefactAttributes.explosive != undefined) {
                if (artefactAttributes.explosive == true || artefactAttributes.explosive == "true") { _explosive = true; };
            };
            if (artefactAttributes.isOn != undefined) {
                if (artefactAttributes.isOn== true || artefactAttributes.isOn == "true") { _on = true;};
            };
            if (artefactAttributes.isEdible != undefined) {
                if (artefactAttributes.isEdible== true || artefactAttributes.isEdible == "true") { _edible = true;};
            };
            if (artefactAttributes.nutrition != undefined) { _nutrition = artefactAttributes.nutrition; };
            if (artefactAttributes.sharpened != undefined) { 
                if (artefactAttributes.sharpened== true || artefactAttributes.sharpened == "true") { _sharpened = true;};
            };
            if (artefactAttributes.polished != undefined) { 
                if (artefactAttributes.polished== true || artefactAttributes.polished == "true") { _polished = true;};
            };
            if (artefactAttributes.price != undefined) { _price = artefactAttributes.price; };
            if (artefactAttributes.chewed != undefined) {
                if (artefactAttributes.chewed== true || artefactAttributes.chewed == "true") { _chewed = true;};
            };
            if (artefactAttributes.weight != undefined) {_weight = parseFloat(artefactAttributes.weight);};
            if (artefactAttributes.attackStrength != undefined) {_attackStrength = artefactAttributes.attackStrength;};
            if (artefactAttributes.affinityModifier != undefined) {_affinityModifier = artefactAttributes.affinityModifier;};
            if (artefactAttributes.type != undefined) {_type = artefactAttributes.type;};
            if (artefactAttributes.subType != undefined) {_subType = artefactAttributes.subType;};
            if (artefactAttributes.isBreakable != undefined) {
                if (artefactAttributes.isBreakable== true || artefactAttributes.isBreakable == "true") { _breakable = true;};
            };
            //catch bad data
            if (artefactAttributes.breakable != undefined) {
                if (artefactAttributes.breakable== true || artefactAttributes.breakable == "true") { _breakable = true;};
            };
            if (artefactAttributes.isBroken != undefined) {
                if (artefactAttributes.isBroken== true || artefactAttributes.isBroken == "true") { _broken = true;};
            };
            if (artefactAttributes.isDamaged != undefined) {
                if (artefactAttributes.isDamaged== true || artefactAttributes.isDamaged == "true") { _damaged = true;};
            };
            if (artefactAttributes.isDestroyed != undefined) {
                if (artefactAttributes.isDestroyed== true || artefactAttributes.isDestroyed == "true") { _destroyed = true;};
            };
            if (artefactAttributes.unlocks != undefined) {_unlocks = artefactAttributes.unlocks;};

            if (artefactAttributes.componentOf != undefined) { _componentOf = _componentOf.concat(artefactAttributes.componentOf); };
            if (artefactAttributes.combinesWith != undefined) { _combinesWith = artefactAttributes.combinesWith; };
            
            if (artefactAttributes.requiredComponentCount != undefined) {_requiredComponentCount = artefactAttributes.requiredComponentCount;};
            if (artefactAttributes.holdsLiquid != undefined) {
                if (artefactAttributes.holdsLiquid== true || artefactAttributes.holdsLiquid == "true") { _holdsLiquid = true;};
            };
            if (artefactAttributes.requiredContainer != undefined) {
                _requiredContainer = artefactAttributes.requiredContainer;
                _requiresContainer = true; //override requires container if required container is specified.
            };
            if (artefactAttributes.hidden != undefined) {
                if (artefactAttributes.hidden== true || artefactAttributes.hidden == "true") { _hidden = true;};
            };
            if (artefactAttributes.position != undefined) { _position = artefactAttributes.position; };
            if (artefactAttributes.hasLinkedDoor != undefined) {
                if (artefactAttributes.hasLinkedDoor == true || artefactAttributes.hasLinkedDoor == "true") {_hasLinkedDoor = true;};
            };
            if (artefactAttributes.imageName != undefined) {_imageName = artefactAttributes.imageName;};
            if (artefactAttributes.smell != undefined) {_smell = artefactAttributes.smell;};     
            if (artefactAttributes.sound != undefined) { _sound = artefactAttributes.sound; };
            if (artefactAttributes.taste != undefined) { _taste = artefactAttributes.taste; };  
            if (artefactAttributes.texture != undefined) { _texture = artefactAttributes.texture; };  
            if (artefactAttributes.wetted != undefined) {_wetted = artefactAttributes.wetted;};     
            if (artefactAttributes.viewDestination != undefined) {_viewDestination = artefactAttributes.viewDestination;};     
            
            
            if (artefactAttributes.contagion != undefined) {
                for (var i=0;i<artefactAttributes.contagion.length;i++) {
                    _contagion.push(new contagionObjectModule.Contagion(artefactAttributes.contagion[i].name, artefactAttributes.contagion[i].displayName, artefactAttributes.contagion[i].attributes));
                };
            };                                        
            if (artefactAttributes.antibodies != undefined) {_antibodies = artefactAttributes.antibodies;}; 
            if (artefactAttributes.canDrawOn != undefined) {
                if (artefactAttributes.canDrawOn== true || artefactAttributes.canDrawOn == "true") { _canDrawOn = true;};
            };     
            if (artefactAttributes.drawings != undefined) {_drawings = artefactAttributes.drawings;};    
            if (artefactAttributes.writings != undefined) { _writings = artefactAttributes.writings; };
            if (artefactAttributes.typings != undefined) { _typings = artefactAttributes.typings; };

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
    
        self.getType = function() {
            return _type;
        };
        
        self.isLiquid = function() {
                return _liquid;
        };

        self.isPowder = function () {
            return _powder;
        };
   
        self.willDivide = function (charges) {
            if (!charges) {charges = _charges}
            if (_charges > 1 && (self.getType() == "food" || self.isLiquid() || self.isPowder())) {
                return true;
            };
            return false;
        };   

        var validate = function(type, subType) {
            var validobjectTypes = ["weapon","property","medical", "cure","book","junk","treasure","food","tool","door","container", "key", "bed", "light", "scenery", "writing", "vehicle", "computer"];
            if (validobjectTypes.indexOf(type) == -1) { throw "'" + type + "' is not a valid artefact type."; };//
            //console.debug(_name+' type validated: '+type);
            if (type == "door") {
                var validDoorSubTypes = ["", "emergency"];
                if (validDoorSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid " + type + " subtype."; };
                //console.debug(_name+' subtype validated: '+subType);
            };

            if (type == "weapon") {
                //weapons must have a subtype
                var validWeaponSubTypes = ["blunt", "sharp", "projectile", "magic", "energy", "choke"];
                if (validWeaponSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid "+type+" subtype."; };
                //console.debug(_name+' subtype validated: '+subType);
            };

            if (type == "tool") {
                var validToolSubTypes = ["","buff","sharpen","assemble","sharp","clean","fire","dig","hook","lockpick"];
                if (validToolSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid "+type+" subtype."; };
                //console.debug(_name+' subtype validated: '+subType);
            };
            
            if (type == "container") {
                var validContainerSubTypes = ["", "bottle", "box", "magic"]; //magic containers will in futur eallow higher carry wieghts
                if (validContainerSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid " + type + " subtype."; };
                if (subType == "bottle" && !_broken && !_destroyed) {
                    _holdsLiquid = true;
                };
            };            

            if (type == "scenery") {
                _hidden = true; //scenery is not shown in inventory etc.
                var validScenerySubTypes = ["","intangible", "plant", "wall", "floor", "furniture", "art", "sign", "building","geography"];
                if (validScenerySubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid "+type+" subtype."; };
            };

            if (type == "vehicle") {
                var validVehicleSubTypes = ["", "van", "car", "bike", "horse", "aeroplane", "train", "boat"];
                if (validVehicleSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid "+type+" subtype."; };
                if (_defaultAction == "examine") { throw "vehicle type '" + subType + "' needs a valid default action."; };
            };

            if (type == "light") {
                //all lights are marked as "switched". May not need power though
                var validLightSubTypes = ["", "electric", "natural", "burn", "magic"];
                if (validLightSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid " + type + " subtype."; };
                if (subType == "" || subType == "electric") {
                    _switched = true;
                };
            };

            if (type == "food") {
                //all food is marked as edible. Nutrition could be negative though.
                var validFoodSubTypes = ["", "snack", "meal", "drink", "poison"];
                if (validFoodSubTypes.indexOf(subType) == -1) { throw "'" + subType + "' is not a valid " + type + " subtype."; };
                _edible = true;
            };

            //food doesn't *need* charges defined - if they are, it changes how eating them is described. (part vs whole)
            //add synonym for splitting - note as we're stil under construction, we use member variables here rather than functions.
            //non-food items also use charges
            if (_charges > 0) {
                if ((_chargeUnit) && _chargeUnit != "charge") {
                    if (self.willDivide(2)) { //minor hack to handle only having 1 charge but still wanting unit synonym.
                            //variants of charge unit. unit alone may clash with other objects (e.g. "cup") so we don't add that in.
                        self.addSyns([_chargeUnit+" of "+_description, _chargeUnit+" of "+_name]);
                    };
                };
            };
            
        };

        validate(_type, _subType);

        //return right prefix for item       
        self.descriptionWithCorrectPrefix = function (anItemDescription, plural, useThe) {
            var state = " ";
            let describingSelf = false;
            if (self.syn(anItemDescription)) {
                //this is the same object but possibly name instead of description.
                describingSelf = true;
            };
            if (!anItemDescription) {
                //we're describing self.
                anItemDescription = self.getRawDescription();
                describingSelf = true;
            };
            
            //before we go any futher, we need to remove any current prefixes (an, a, some, the)
            let tokens = anItemDescription.split(/\s+/); 
            if (["some", "an", "a"].includes(tokens[0])) {
                tokens.shift();
                anItemDescription = tokens.join(" ");
            };

            if (describingSelf) {
                plural = _plural;
                if (self.isDestroyed()) {
                    return "some "+self.getRawDescription();  
                };
                if (self.isBroken()) {
                    state = " broken ";
                //we don't report damaged                      
                //} else if (self.isDamaged()) {
                //    state = " damaged ";   
                } else if (self.isChewed()) {
                    if (self.chargesRemaining() > 0) {
                        //a portion of the item has been eaten, it's not the same as actually chewed
                        state = " ";
                    } else {
                        state = " chewed ";
                    };  
                };
                
                if (self.getChargeUnit() != "charge") { //"charge" is default if null.
                     if (self.chargesRemaining() == 1) {  //We do this to handle a "split" item - when we split an item, we get a single unit back of it! (e.g. slice of cake)
                        anItemDescription = self.getChargeUnit() + " of " + anItemDescription;
                     };
                };

            };

            if (tools.isProperNoun(anItemDescription) || anItemDescription.substr(0, 4) == "the " || anItemDescription.substr(0, 1) == "'") {
                //Description starts with a proper noun, "the" or is quoted.
                return anItemDescription;
            };

            if (plural) {
                //special cases
                var collectionPlurals = ["pair", "pack", "bowl", "pool", "set", "box", "tin", "jar", "packet", "bag", "bottle", "cluster", "collection", "group"];
                if (self.getChargeUnit() != "charge") {
                    collectionPlurals.push(self.getChargeUnit());
                };
                var descriptionAsWords = anItemDescription.split(/\s+/); 
                if (descriptionAsWords.length>2) {
                    //"x of y" ?
                    if (!(collectionPlurals.indexOf(descriptionAsWords[0]) > -1 && descriptionAsWords[1] == "of")) {
                        //not "x of y"
                        return "some"+state+anItemDescription;
                    };
                } else {
                    //normal single word plural case
                    return "some"+state+anItemDescription;
                };
            };
            
            let description;
            if (useThe) {
                description = "the"+state+anItemDescription;
            } else {
                description = tools.anOrA(anItemDescription, state);
            }
            return description;
        };

        //public member functions
        self.toString = function() {
            //var _synonyms = [];
            var resultString = '{"object":"'+_objectName+'","name":"'+_name+'","description":"'+_description+'","detailedDescription":"'+_initialDetailedDescription;
            resultString += '","attributes":'+JSON.stringify(self.getAttributesToSave()); //should use self.getCurrentAttributes()
            if (_linkedExits.length>0) {
                resultString+= ',"linkedexits":[';
                for(var i=0; i<_linkedExits.length;i++) {
                    if (i>0) {resultString+= ',';};
                    resultString+= _linkedExits[i].toString();
                };
                resultString+= ']';
            };
            if (_synonyms.length >0) {
                resultString+= ',"synonyms":[';
                for(var i=0; i<_synonyms.length;i++) {
                    if (i>0) {resultString+= ',';};
                    resultString+= '"'+_synonyms[i]+'"';
                };
                resultString+= ']';
            };
            if (_delivers.length>0) {
                resultString += ',"delivers":[';
                for (var i = 0; i < _delivers.length; i++) {
                    if (i > 0) { resultString += ','; };
                    resultString += _delivers[i].toString();
                };
                resultString += ']';
            };
            if (_inventory.size(true) >0) {resultString+= ',"inventory":'+_inventory.toString();};
            if (_missions.length >0) {
                resultString+= ',"missions":[';
                for(var i=0; i<_missions.length;i++) {
                    if (i>0) {resultString+= ',';};
                    resultString+= _missions[i].toString();
                };
                resultString+= ']';
            };
            resultString+= '}';
            return resultString;
        };

        self.getName = function() {
            return _name;
        }; 

        self.getImageName = function() {
            return _imageName;
        };
        
        self.setImageName = function(imageName) {
            _imageName = imageName;
        };

        self.getCustomAction = function() {
            return _customAction;
        };

        self.checkCustomAction = function(verb) {
            return customAction.checkCustomAction(verb, self);
        };
        
        self.performCustomAction = function (verb, map, player) {
            return customAction.performCustomAction(verb, map, player, self);
        };
        
        self.play = function (verb, map, player, artefact) {
            if (self.checkCustomAction(verb)) {
                return self.performCustomAction(verb, map, player);
            };

            return "Try as you might, you just don't find playing with " + self.descriptionWithCorrectPrefix() + " as entertaining as you'd hoped.";
        };

        self.getTexture = function() {
            return _texture;
        };

        self.setTexture = function(texture) {
            _texture = texture;
        };
        self.getSmell = function() {
            return _smell;
        };

        self.setSmell = function(smell) {
            _smell = smell;
        };

        self.getSound = function() {
            return _sound;
        };

        self.setSound = function(sound) {
            _sound = sound;
        };
        
        
        self.getTaste = function () {
            return _taste;
        };
        
        self.setTaste = function (taste) {
            _taste = taste;
        };

        self.getDefaultAction = function() {
            return _defaultAction;
        };

        self.getDefaultResult = function() {
            return _defaultResult;
        };

        self.getCurrentAttributes = function() {
            var currentAttributes = {};
            currentAttributes.synonyms = _synonyms;
            currentAttributes.initialDetailedDescription = _initialDetailedDescription;
            currentAttributes.initialDescription = _initialDescription;
            currentAttributes.defaultAction = _defaultAction;
            currentAttributes.defaultResult = _defaultResult;
            currentAttributes.customAction = _customAction;
            currentAttributes.price = _price;            
            currentAttributes.extendedInventoryDescription = _extendedInventoryDescription;
            currentAttributes.carryWeight = _inventory.getCarryWeight();
            currentAttributes.lockable = _lockable;
            currentAttributes.autoLock = _autoLock;
            currentAttributes.lockInMoves = _lockInMoves; 
            currentAttributes.locked = _locked;
            currentAttributes.canCollect = _collectable;
            currentAttributes.read = _read;
            currentAttributes.sharpened = _sharpened;
            currentAttributes.polished = _polished;
            currentAttributes.canOpen = _opens;                    
            currentAttributes.isOpen = _open;
            currentAttributes.charges = _charges;
            currentAttributes.burnRate = _burnRate;            
            currentAttributes.chargeUnit = _chargeUnit;
            currentAttributes.chargesDescription = _chargesDescription;
            currentAttributes.hideDeliveryDescription = _hideDeliveryDescription;
            currentAttributes.combinesDescription = _combinesDescription;
            currentAttributes.saleUnit = _saleUnit;            
            currentAttributes.checkComponents = self.checkComponents();
            currentAttributes.checkComponentsExist = self.checkComponentsExist();
            currentAttributes.switched = _switched;
            currentAttributes.flammable = _flammable;
            currentAttributes.explosive = _explosive;
            currentAttributes.isOn = _on;
            currentAttributes.isEdible = _edible;
            currentAttributes.nutrition = _nutrition;
            currentAttributes.chewed = _chewed;
            currentAttributes.weight = _weight;
            currentAttributes.plural = _plural;
            currentAttributes.attackStrength = _attackStrength;
            currentAttributes.affinityModifier = _affinityModifier;
            currentAttributes.type = _type;
            currentAttributes.subType = _subType;
            currentAttributes.isBreakable = _breakable;
            currentAttributes.isDamaged = _damaged;
            currentAttributes.isBroken = _broken;
            currentAttributes.isDestroyed =_destroyed
            currentAttributes.unlocks = _unlocks;
            currentAttributes.componentOf = _componentOf;
            currentAttributes.combinesWith = _combinesWith;
            currentAttributes.requiredComponentCount = _requiredComponentCount;
            currentAttributes.requiresContainer = _requiresContainer;
            currentAttributes.requiredContainer = _requiredContainer;
            currentAttributes.isLiquid = _liquid;
            currentAttributes.isPowder = _powder;
            currentAttributes.holdsLiquid = _holdsLiquid;
            currentAttributes.hidden = _hidden;
            currentAttributes.position = _position;
            currentAttributes.hasLinkedDoor = _hasLinkedDoor;
            currentAttributes.imageName = _imageName;
            currentAttributes.smell = _smell;
            currentAttributes.sound = _sound;
            currentAttributes.taste = _taste;
            currentAttributes.texture = _texture;
            currentAttributes.wetted = _wetted;
            currentAttributes.contagion = _contagion;
            currentAttributes.antibodies = _antibodies;
            currentAttributes.canDrawOn = _canDrawOn;
            currentAttributes.drawings = _drawings;
            currentAttributes.writings = _writings;
            currentAttributes.typings = _typings;
            currentAttributes.viewDestination = _viewDestination;    
            
            currentAttributes.inventoryValue = _inventory.getInventoryValue();
            currentAttributes.foodPortionCount = _inventory.foodPortionCount();

            return currentAttributes;

        };

        self.getAttributesToSave = function() {
            var saveAttributes = {};
            var artefactAttributes = self.getCurrentAttributes();

            //we save syns separately
            //if (artefactAttributes.synonyms != undefined) { saveAttributes.synonyms = artefactAttributes.synonyms;};

            if (artefactAttributes.initialDetailedDescription != _detailedDescription) { saveAttributes.initialDetailedDescription = artefactAttributes.initialDetailedDescription; };
            if (artefactAttributes.initialDescription != _initialDescription) { saveAttributes.initialDescription = artefactAttributes.initialDescription; };

            if (artefactAttributes.defaultAction != "examine") { saveAttributes.defaultAction = artefactAttributes.defaultAction;};
            if (artefactAttributes.extendedInventoryDescription != _prefix+" contains $inventory." && artefactAttributes.extendedInventoryDescription != _prefix+" contain $inventory." && artefactAttributes.extendedInventoryDescription != "") {
                saveAttributes.extendedInventoryDescription = artefactAttributes.extendedInventoryDescription;
            };
            if (artefactAttributes.weight != 0) {saveAttributes.weight = parseFloat(artefactAttributes.weight);};
            if (artefactAttributes.carryWeight != 0) {saveAttributes.carryWeight = artefactAttributes.carryWeight;};           
            if (artefactAttributes.attackStrength != 0) {saveAttributes.attackStrength = artefactAttributes.attackStrength;};
            if (artefactAttributes.type != "junk") {saveAttributes.type = artefactAttributes.type;};
            if (artefactAttributes.subType != "") {saveAttributes.subType = artefactAttributes.subType;};           
            if (artefactAttributes.requiresContainer) {saveAttributes.requiresContainer = true;};
            if (artefactAttributes.isLiquid) {saveAttributes.isLiquid = true;};
            if (artefactAttributes.isPowder) {saveAttributes.isPowder = true;};
            if (artefactAttributes.holdsLiquid) {saveAttributes.holdsLiquid = true;};
            if (artefactAttributes.requiredContainer != undefined) {saveAttributes.requiredContainer = artefactAttributes.requiredContainer;};
            if (artefactAttributes.canCollect) { saveAttributes.canCollect = true;};
            if (artefactAttributes.chewed) {saveAttributes.chewed = true;};
            if (artefactAttributes.isBreakable) {saveAttributes.isBreakable = true;};
            if (artefactAttributes.isBroken) {saveAttributes.isBroken = true;};
            if (artefactAttributes.isDamaged) {saveAttributes.isDamaged = true;};
            if (artefactAttributes.isDestroyed) {saveAttributes.isDestroyed = true;};
            if (artefactAttributes.charges != -1) {saveAttributes.charges = artefactAttributes.charges;};
            if (artefactAttributes.burnRate != 0) {saveAttributes.burnRate = artefactAttributes.burnRate;};
            if (artefactAttributes.chargeUnit != "") {saveAttributes.chargeUnit = artefactAttributes.chargeUnit;};
            if (artefactAttributes.chargesDescription != "") { saveAttributes.chargesDescription = artefactAttributes.chargesDescription; };
            if (artefactAttributes.hideDeliveryDescription) { saveAttributes.hideDeliveryDescription = artefactAttributes.hideDeliveryDescription; };
            if (artefactAttributes.combinesDescription != "") { saveAttributes.combinesDescription = artefactAttributes.combinesDescription; };
            if (artefactAttributes.saleUnit != -1) {saveAttributes.saleUnit = artefactAttributes.saleUnit;};           
            if (artefactAttributes.plural) {saveAttributes.plural = true;};            
            if (artefactAttributes.affinityModifier != 1) {saveAttributes.affinityModifier = artefactAttributes.affinityModifier;};
            if (artefactAttributes.read) { saveAttributes.read = true;};
            if (artefactAttributes.canOpen) { saveAttributes.canOpen = true;};                    
            if (artefactAttributes.isOpen) { saveAttributes.isOpen = true;};
            if (artefactAttributes.lockable) { saveAttributes.lockable = true;};
            if (artefactAttributes.locked) { saveAttributes.locked = true; };
            if (artefactAttributes.autoLock >=0) { saveAttributes.autoLock = artefactAttributes.autoLock; };
            if (artefactAttributes.lockInMoves >= 0) { saveAttributes.lockInMoves = artefactAttributes.lockInMoves; };
            if (artefactAttributes.isEdible) {saveAttributes.isEdible = true;};
            if (artefactAttributes.nutrition != 0) { saveAttributes.nutrition = artefactAttributes.nutrition; };
            if (artefactAttributes.sharpened != 0) { saveAttributes.sharpened = artefactAttributes.sharpened; };
            if (artefactAttributes.polished != 0) { saveAttributes.polished = artefactAttributes.polished; };
            if (artefactAttributes.price != 0) { saveAttributes.price = artefactAttributes.price; };
            if (artefactAttributes.switched) { saveAttributes.switched = true; };
            if (artefactAttributes.flammable) { saveAttributes.flammable = true; };
            if (artefactAttributes.explosive) { saveAttributes.explosive = true; };
            if (artefactAttributes.isOn) {saveAttributes.isOn = true;};
            if (artefactAttributes.hidden && artefactAttributes.type != "scenery") {saveAttributes.hidden = true;};
            if (artefactAttributes.position != "" && artefactAttributes.position != undefined) { saveAttributes.position = artefactAttributes.position; };            
            if (artefactAttributes.unlocks != "") {saveAttributes.unlocks = artefactAttributes.unlocks;};
            if (artefactAttributes.componentOf.length > 0) { saveAttributes.componentOf = artefactAttributes.componentOf; };
            if (artefactAttributes.combinesWith != "") { saveAttributes.combinesWith = artefactAttributes.combinesWith; };            
            if (artefactAttributes.requiredComponentCount != 0) {saveAttributes.requiredComponentCount = artefactAttributes.requiredComponentCount;};
            if (artefactAttributes.customAction != undefined) { saveAttributes.customAction = artefactAttributes.customAction;};
            if (artefactAttributes.defaultResult != undefined) { saveAttributes.defaultResult = artefactAttributes.defaultResult;};
            if (artefactAttributes.hasLinkedDoor) { saveAttributes.hasLinkedDoor = true;};
            if (artefactAttributes.imageName != undefined) {saveAttributes.imageName = artefactAttributes.imageName;};  
            if (artefactAttributes.smell != undefined) {saveAttributes.smell = artefactAttributes.smell;};                
            if (artefactAttributes.sound != undefined) { saveAttributes.sound = artefactAttributes.sound; };
            if (artefactAttributes.taste != undefined) { saveAttributes.taste = artefactAttributes.taste; };  
            if (artefactAttributes.texture != undefined) { saveAttributes.texture = artefactAttributes.texture; };
            if (artefactAttributes.wetted.length >0) {saveAttributes.wetted = artefactAttributes.wetted;};           
            if (artefactAttributes.contagion.length>0) {
                saveAttributes.contagion = [];
                for (var c=0;c<artefactAttributes.contagion.length;c++) {
                    saveAttributes.contagion.push(JSON.parse(artefactAttributes.contagion[c].toString()));
                };                
            };                        
            if (artefactAttributes.antibodies.length>0) {saveAttributes.antibodies = artefactAttributes.antibodies;}; 
            if (artefactAttributes.canDrawOn) {saveAttributes.canDrawOn = artefactAttributes.canDrawOn;};                  
            if (artefactAttributes.writings.length>0) {saveAttributes.writings = artefactAttributes.writings;};   
            if (artefactAttributes.drawings.length > 0) { saveAttributes.drawings = artefactAttributes.drawings; };
            if (artefactAttributes.viewDestination != undefined) {saveAttributes.viewDestination = _viewDestination;}; 
            return saveAttributes;
        };

        self.matches = function (anObject) {
            if (self.toString() === anObject.toString()) {
                return true;
            };
            return false;
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
                return false;
            };
            if (_synonyms.indexOf(synonym) > -1) { 
                return true; 
            };

            //description - complete match
            if (synonym == self.getDescription()) { 
                return true; 
            };
            
            if (synonym.endsWith("s")) {
                return self.syn(synonym.substring(0, synonym.length - 1));
            };

            return false;
        };
        
        //artefact only function at the moment
        self.getSourceAttributes = function () {
            return _sourceAttributes;
        }; 

        self.setDeliveryItems = function(deliveryItemsArray) {
            _delivers = deliveryItemsArray; //overwrites current list
        };

        self.getDeliveryItems = function() {
            return _delivers;
        };

        self.getLinkedExits = function() {
            return _linkedExits;
        };

        self.getLinkedDestinationForSource = function(currentLocationName) {
            var exits = self.getLinkedExits();
            for (var e=0;e<exits.length;e++) {
                if (exits[e].getSourceName() == currentLocationName) {
                    return exits[e].getDestinationName();
                };
            };
        };

        self.sells = function(anObjectName) {
            return false;
        };

        self.check = function(anObjectName) {
            return _inventory.check(anObjectName);
        };

        //artefact only function at the moment
        self.setAttributes = function(attributes) {
            if (attributes.type != undefined) {
                try{validate(attributes.type, attributes.subType);}
                catch(err){
                    console.error("Error: "+err);
                    return null;//exit early
                };
            };
            _sourceAttributes = attributes;
            processAttributes(attributes);
        };
        
        self.getOriginalDisplayName = function () {
            if (tools.isProperNoun(_initialDescription) || _initialDescription.substr(0, 4).toLowerCase() == "the " || _initialDescription.substr(0, 1) == "'") {
                return _initialDescription;
            };
            return "the " + _initialDescription;
        };        

        self.getDisplayName = function () {
            if (tools.isProperNoun(_description) || _description.substr(0, 4).toLowerCase() == "the " || _description.substr(0, 1) == "'") {
                return _description;
            };
            return "the "+_description;
        };

        self.getSubType = function() {
            return _subType;
        };

        self.supportsAction = function(verb) {
            if (tools.unarmedAttackVerbs.includes(verb)) {return false};

            //validate verb against subType
            var subType = self.getSubType();
            
            switch(subType) {
                case "intangible":
                    return false;
                    break;
                case "projectile":
                    if (tools.sharpAttackVerbs.includes(verb)) {return false}; //can still use blunt attacks
                    if (tools.projectileAttackVerbs.includes(verb) && self.isDamaged()) {return false};
                    break;
                case "blunt":
                    if (tools.sharpAttackVerbs.includes(verb)) {return false};
                    if (tools.projectileAttackVerbs.includes(verb)) {return false};
                    break;
                case "sharp":
                    if (tools.projectileAttackVerbs.includes(verb)) {return false};
                    break;
                default:
                    //assume neither sharp, nor projectile - e.g. throwing and hitting things?
                    if (tools.sharpAttackVerbs.includes(verb)) {return false};
                    if (tools.projectileAttackVerbs.includes(verb)) {return false};
                    break;
            };
            return true;
        };

        
        self.setCombinesWith = function (objecName) {
            _combinesWith = objecName;
        };

        self.getCombinesWith = function () {
            return _combinesWith;
        };

        self.isComponentOf = function (anObjectName) {
            if (_componentOf.includes(anObjectName)) {return true;};
            return false;
        };

        self.requiresContainer = function() {
                return _requiresContainer
        };
        
        self.isSolid = function () {
            if (_powder || _liquid) {
                return false;
            };
            if (self.getSubType() == "intangible") {
                return false;
            };
            
            return true;
        };
        
        self.compareLiquidOrPowder = function (item1, item2) {
            //compare attributes we care about.
            if (item1.getType() != item2.getType()) {
                return false;
            };
            if (item1.getName() != item2.getName()) {
                return false;
            };
            if (item1.getDisplayName() != item2.getDisplayName()) {
                return false;
            };

            if (item1.isPowder() && item2.isPowder()) {
                return true;
            };

            if (item1.isLiquid() && item2.isLiquid()) {
                return true;
            };

            return false;

        };
        
        self.combineWithLiquid = function (consume, keep) {
            //we assume liquid/powder has already been compared!
            if (keep.isPowder()) {
                //swap keep/consume - adding powder to liquid (or another powder in which case it doesn't matter))
                var tempConsume = consume;
                consume = keep;
                keep = tempConsume;
            };
            var consumeAttributes = consume.getCurrentAttributes();
            var keepAttributes = keep.getCurrentAttributes();
            var newAttributes = {};
            for (var attr in keepAttributes) {
                switch (typeof (keepAttributes[attr])) {
                    case "number":
                        if (keepAttributes[attr] == -1 && consumeAttributes[attr] == -1) {
                            newAttributes[attr] = keepAttributes[attr];
                        } else {
                            newAttributes[attr] = keepAttributes[attr] + consumeAttributes[attr];
                        };
                        break;
                    case "string":
                        newAttributes[attr] = keepAttributes[attr];
                        break;
                    case "boolean":
                        if (keepAttributes[attr] || consumeAttributes[attr]) {
                            newAttributes[attr] = true;
                        } else {
                            newAttributes[attr] = false;
                        };
                        break;
                    case "object":
                        if (Array.isArray(keepAttributes[attr])) {
                            newAttributes[attr] = keepAttributes[attr].concat(consumeAttributes[attr]);
                        } else {
                            newAttributes[attr] = keepAttributes[attr]; //just keep the original (@todo - handle this better)
                        };
                        break;
                    default:
                        newAttributes[attr] = keepAttributes[attr];
                        break;
                };
            };
            
            //note we only preserve linked exits and delivery items from the destination item - beware differing "newAttributes" vs keep... here!
            return new Artefact(keep.getName(), keep.getRawDescription(), keep.getRawDetailedDescription(), newAttributes, keep.getLinkedExits(), keep.getDeliveryItems());
            
        };


        self.holdsLiquid = function() {
                if (_broken || _destroyed) {return false;};
                return _holdsLiquid;
        };

        self.drain = function(location) {
            var resultString = "";
            if (!_holdsLiquid) {return resultString;};

            var inv = _inventory.getAllObjects(true);
            var liquids = [];
            for (var i=0;i<inv.length;i++) {
                if (inv[i].isLiquid()) {
                    liquids.push(inv[i].getName());
                };
            };

            if (liquids.length ==0) {return resultString;};

            resultString += "<br>The "
            for (var l=0;l<liquids.length;l++) {
                _inventory.remove(liquids[l]);
                location.addLiquid(liquids[l]);
                resultString += tools.listSeparator(l, liquids.length);
                resultString += liquids[l];
            };
            var wasWere = "was";
            if (liquids.length >1) {wasWere = "were";};
            resultString += " that "+wasWere+" in "+_suffix+" slowly trickles away.";
            return resultString;
        };

        self.getNutrition = function() {
            return _nutrition;
        };

        self.getRequiredContainer = function() {
            if (_requiredContainer) {
                return _requiredContainer
            };
            return null;
        };

        self.getDescription = function(useThe) {
            var resultString = self.descriptionWithCorrectPrefix(null, null, useThe);
            //if it's a container with a single item and it's open (or fixed open), include contents
            if (self.getType() == "container" && _inventory.size(false, true) == 1 && ((!_opens)||_open)) {
                var inventoryItems = _inventory.getAllObjects();
                var inventoryItem;
                if (inventoryItems.length > 0) {
                    inventoryItem = inventoryItems[0];

                    //object is not hidden or positioned
                    if (inventoryItem.requiresContainer()) {
                        resultString += " of " + inventoryItem.getRawDescription();
                    };
                };
            };
            return resultString;
        };

        self.getRawDescription = function() {
            return _description;
        };
        
        self.getRawDetailedDescription = function () {
            return _detailedDescription;
        };

        self.getPrefix = function() {
            return _prefix;
        };

        self.getDescriptivePrefix = function() {
            return _descriptivePrefix;
        };

        self.getSuffix = function() {
            return _suffix;
        };

        self.getPossessiveSuffix = function() {
            return _possessiveSuffix;
        };

        self.addMission = function(aMission) {
            _missions.push(aMission);
        };

        self.removeMission = function(aMissionName) {
            for(var index = 0; index < _missions.length; index++) {
                if (_missions[index].getName()==aMissionName) {
                    _missions.splice(index,1);
                    //console.debug(aMissionName+" removed from "+self.getDisplayName());
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

        self.getInitialDetailedDescription = function() {
            return _initialDetailedDescription;
        };

        self.describeNotes = function() {
            var resultString = "";
            if (_drawings.length>0) {
                resultString += "<br>Someone has drawn ";
                for (var a=0;a<_drawings.length;a++) {
                    resultString += tools.listSeparator(a, _drawings.length);

                    var pluralArt = false;
                    if (_drawings[a].length > 1 && ((_drawings[a].substr(-1) == "s" && _drawings[a].substr(-2) != "us")|| (_drawings[a].substr(-2) == "ii"))) {
                        pluralArt = true;
                    };
                    resultString += self.descriptionWithCorrectPrefix(_drawings[a], pluralArt);
                };
                resultString+= " on "+_suffix+".<br>";
            };

            if (_writings.length>0) {
                if (_drawings.length>0) {
                    resultString += "They've also written ";
                } else {
                    resultString += "<br>Someone has written ";
                };
                for (var a=0;a<_writings.length;a++) {
                    resultString += tools.listSeparator(a, _writings.length);
                    resultString += "'"+_writings[a]+"'";
                };
                if (_drawings.length==0) {
                    resultString+= " on "+_suffix;
                };
                resultString+= ".<br>";                
            };

            return resultString;
        };
        
        self.describeView = function (viewDestination, map) {
            if (viewDestination && map) {
                var destination = map.getLocation(viewDestination);
                if (destination) {
                    var objectList = destination.listObjects(2);
                    if (objectList.length > 1) {
                        return "<br>From " + self.getDisplayName() + " you can see " + destination.listObjects(2) + ".";
                    };
                };
            };
            return "";
        };

        self.getDetailedDescription = function (playerAggression, map, minSize) {
            if (!minSize) { minSize = -999; };
            //note we can change description based on player aggression - better for creatures but supported here too.
            var resultString = _detailedDescription; //original description
            if (minSize >= 200 && (self.getWeight() >= minSize) && (!_destroyed) ) {
                //we're looking from a distance;
                return _detailedDescription;
            };
            if (_destroyed) {
                resultString += self.describeView(_viewDestination, map);
                return resultString;
            }; //don't go any further.
            
            if (self.getType() != "book") {
                resultString += self.describeNotes();
            };
            
            if (self.getPrice() > 0) {
                resultString += "<br>" + tools.initCap(_descriptivePrefix) + " worth about £" + self.getPrice().toFixed(2) + ".";
            };
            
            var inventoryIsVisible = true;
            
            if (_lockable && (_locked)) {
                if (!self.isBroken()) {
                    resultString += "<br>" + tools.initCap(_descriptivePrefix) + " locked.";
                };
                inventoryIsVisible = false;
            } else if (_opens && (!(_open))) {
                if (!self.isBroken()) {
                    resultString += "<br>" + tools.initCap(_descriptivePrefix) + " closed.";
                };
                inventoryIsVisible = false;
            };
            
            var inventoryDescription = _inventory.describe(null, minSize)
            if ((_inventory.size(false, true) > 0) && inventoryIsVisible && (!((inventoryDescription.substr(0, 7) == "nothing") && inventoryDescription.length > 7))) {
                resultString += "<br>";
                
                //inventory description may be extended...
                //ensure we have a substitution value
                var placeholder = _extendedInventoryDescription.indexOf("$inventory");
                if (placeholder == -1) {
                    _extendedInventoryDescription += "$inventory."
                };
                
                //if viewing from a distance and nothing is visible, don't report it.
                if (!(minSize >= tools.minimumSizeForDistanceViewing && inventoryDescription == "nothing")) {
                    resultString += _extendedInventoryDescription;
                    resultString = resultString.replace("$inventory", inventoryDescription);
                };
                
            } else if ((_inventory.size(false, true) > 0)) {
                var positionedItems = _inventory.describePositionedItems(minSize);
                if (positionedItems.length > 0) {
                    resultString += positionedItems + ".";
                };
            };
            
            resultString = resultString.replace("placed on top", "on " + _suffix);
            
            resultString += self.describeView(_viewDestination, map);
            
            //remove original description if it's not working.
            if (_switched) {
                if (!(self.hasPower())) {
                    resultString = resultString.replace(_detailedDescription, "");
                    resultString += "<br>" + tools.initCap(_descriptivePrefix) + " not working.<br>Try <i>switch</i>ing "+_suffix+" <i>on</i>.";
                } else {
                    if (!(self.isPoweredOn())) {
                        resultString = resultString.replace(_detailedDescription, "");
                        resultString += "<br>" + tools.initCap(_descriptivePrefix) + " switched off.";
                    };
                };
            } else
            if (self.isBroken()) {
                resultString = resultString.replace(_detailedDescription, "");
                resultString += "<br>" + tools.initCap(_descriptivePrefix) + " broken.";           
            } else if (!(self.checkComponentsExist())) {
                resultString = resultString.replace(_detailedDescription, "");
                resultString += "<br>" + tools.initCap(_descriptivePrefix) + " missing something.";
            } else if (!(self.checkComponents())) {
                resultString = resultString.replace(_detailedDescription, "");
                resultString += "<br>It <i>looks</i> like everything's there but there's still something wrong with "+_suffix+".";
            } else {
                if (_delivers.length > 0 && (!_hideDeliveryDescription)) {
                    //split "deliver"s items into what can currently be delivered and what can't
                    //so that we can determine what to describe
                    var canDeliverList = [];
                    var sellsList = [];
                    var cannotDeliverList = [];
                    var combinesWithList = [];
                    for (var i = 0; i < _delivers.length; i++) {
                        if (self.getCombinesWith().length > 0) {
                            //combine items don't "deliver" as such, they convert into other things
                            combinesWithList.push(_delivers[i]);
                        } else if (self.canDeliver(_delivers[i].getName())) { 
                            if (_delivers[i].getPrice() > 0) {
                                sellsList.push(_delivers[i]); 
                            } else {
                                canDeliverList.push(_delivers[i]); 
                            };
                        } else { cannotDeliverList.push(_delivers[i]); };

                    };

                    //return what can be combined with
                    if (combinesWithList.length > 0 && _combinesDescription != " ") {
                        //if we override the default "delivers" description...
                        if (_combinesDescription.length > 0) {
                            resultString += "<br>" + tools.initCap(_combinesDescription);
                        } else {
                            resultString += "<br>" + tools.initCap(self.getName()) + " can be used to make ";
                            for (var i = 0; i < combinesWithList.length; i++) {
                                resultString += tools.listSeparator(i, combinesWithList.length);
                                resultString += combinesWithList[i].getName();
                            };
                        };
                        resultString += ".";
                    };

                    //return what can be delivered
                    if (canDeliverList.length > 0) {
                        resultString += "<br>" + _prefix + " delivers ";
                        for (var i = 0; i < canDeliverList.length; i++) {
                            resultString += tools.listSeparator(i, canDeliverList.length);
                            resultString += canDeliverList[i].getName();
                        };
                        resultString += ".";
                    };
                    
                    //return what can be sold
                    if (sellsList.length > 0) {
                        resultString += "<br>" + _prefix + " sells";

                        if (sellsList.length >1 ) {
                            resultString += ":<br>";
                        } else {resultString += " ";};

                        for (var i = 0; i < sellsList.length; i++) {
                            if (sellsList.length >1 ) {resultString += "- ";};
                            if (sellsList.length >1 ) {resultString +=tools.initCap(sellsList[i].getName());}
                            else {  resultString +=sellsList[i].getName();};                   
                            resultString += " (£"+sellsList[i].getPrice().toFixed(2)+")<br>";
                        };
                    };

                    //return what cannot be delivered
                    if (cannotDeliverList.length > 0) {
                        resultString += "<br>With the right additional items " + _prefix.toLowerCase()+ " can";
                        if (canDeliverList.length > 0) { resultString += " also" };

                        resultString += " deliver ";
                        for (var i = 0; i < cannotDeliverList.length; i++) {
                            resultString += tools.listSeparator(i, cannotDeliverList.length);
                            resultString += cannotDeliverList[i].getName();
                        };
                        resultString += ".";
                    };
                };               
            };

            //describe remaining charges (if not unlimited)
            if (self.chargesRemaining() == 0) {
                resultString += "<br>"+tools.initCap(_descriptivePrefix)+" all used up.";
            }
            else if (self.chargesRemaining() > 1) { //we don't report when there's only a single use left.
                var lineBreak = "<br>";
                if (!_switched) {
                    if (_on && (self.isFlammable() || self.isExplosive())) {
                        resultString += "<br>" + tools.initCap(_descriptivePrefix) + " burning away quite happily. ";
                        lineBreak = "";
                    };
                };
       
                //set plural
                var tempPluralString = "s";
                if (self.chargesRemaining() == 1) {tempPluralString = "";};
                var tempUnits = _chargeUnit+tempPluralString;

                //if (_detailedDescription.indexOf('$') >-1) {//we have custom placeholders in the description
                if (_chargesDescription.length>0) { //we have a custom description

                    //replace substitution variables if set
                    var tempDescription = _chargesDescription;
                    tempDescription = tempDescription.replace("$chargeUnit",tempUnits);
                    tempDescription = tempDescription.replace("$charges",Math.ceil(self.chargesRemaining()));

                    //set output
                    if (tempDescription.length > 1) {
                        resultString += lineBreak + tempDescription + ".";
                    };

                } else {
                    resultString += lineBreak+"There's "+self.chargesRemaining()+" "+tempUnits+" remaining."
                };
            };

            if (_wetted.length > 0) {resultString += "<br>Someone has spilled ";};
            for (var i = 0; i < _wetted.length; i++) {
                resultString += tools.listSeparator(i, _wetted.length);
                resultString += _wetted[i];
            };
            if (_wetted.length > 0) {resultString += " on "+_suffix+".";};

            if ((_inventory.size() != _inventory.size(true, true)) && self.getType() != "scenery") {
                if ( inventoryIsVisible || (_inventory.getPositionedObjects(true).length > 0)) {
                    //something is hidden here
                    //50% chance of spotting something amiss
                    var randomInt = Math.floor(Math.random() * 2);
                    if (randomInt > 0) {
                        resultString += "<br>You notice something odd about "+self.getDisplayName()+". "+_prefix+" might bear even closer inspection.";
                    };  
                };
            };

            if (_initialDetailedDescription == "There's nothing of interest here." && resultString.length > _initialDetailedDescription.length) {
                resultString = resultString.replace(_initialDetailedDescription+"<br>","");
                resultString = resultString.replace(_initialDetailedDescription+" ","");
            };

            if (resultString.substr(0, 4) == "<br>") { resultString = resultString.substr(4); }; //trim opening line break if needed.

            return resultString+tools.imgTag(self);
        };

        self.read = function (verb) {
            var resultString = "";
            if (!_read) {
                _read = true;
                resultString += "You " + verb + " " + self.getDisplayName() + ".";
            };

            return resultString+tools.imgTag(self);
        };

        self.isRead = function() {
            return _read;
        };

        self.getViewLocation = function() {
            return _viewDestination;
        };

        self.hasContagion = function(contagionName) {
            for (var i=0;i<_contagion.length;i++) {
                if (_contagion[i].getName() == contagionName) {
                    return true;
                };
            };

            return false;
        };

        self.hasAntibodies = function(antibodies) {
            if (_antibodies.indexOf(antibodies) > -1) {
                return true;
            };
            return false;
        };

        self.getContagion = function() {
            return _contagion;
        };

        self.getAntibodies = function() {
            return _antibodies;
        };

        self.getDrawings = function() {
            return _drawings;
        };

        self.getWritings = function() {
            return _writings;
        };
        
        self.getTypings = function () {
            return _typings;
        };

        self.canDrawOn = function() {
            return _canDrawOn;
        };

        self.hasWritingOrDrawing = function(content) {
            var index = _drawings.indexOf(content);
            if (index > -1) {
                return true;
            };

            index = _writings.indexOf(content);
            if (index > -1) {
                return true;
            };

            return false;
        };

        self.addDrawing = function(drawing) {
            if (self.canDrawOn()) {
                _drawings.push(drawing);
                if (self.getPrice() >0) {
                    //diminish value
                    self.discountPriceByPercent(5);
                }; 
                return true;
            };
            return false;
        };

        self.addWriting = function(writing) {
            if (self.canDrawOn()) {
                _writings.push(writing);
                if (self.getPrice() >0) {
                    //diminish value
                    self.discountPriceByPercent(5);
                }; 
                return true;
            };
            return false;
        };
            
        self.addTyping = function (text) {
            if (self.getType() == "computer") {
                _typings.push(text);
                return true;
            };
            return false;
        };


        self.removeDrawing = function(drawing) {
            var index = _drawings.indexOf(drawing);
            if (index > -1) {
                _drawings.splice(index,1);
                return 1;
            };
            return 0;
        };

        self.removeWriting = function(writing) {
            var index = _writings.indexOf(writing);
            if (index > -1) {
                _writings.splice(index,1);
                return 1;
            };
            return 0;
        };

        self.clearDrawings = function() {
            var count = _drawings.length;
            _drawings = [];
            return count;
        };

        self.clearWritings = function() {
            var count = _writings.length;
            _writings = [];
            return count;
        };

        self.setContagion = function(contagion) {
            //if not already carrying and not immune
            if (!(self.hasAntibodies(contagion.getName()))) {
                if (!(self.hasContagion(contagion.getName()))) {
                    _contagion.push(contagion);
                };
            };
        };

        self.setAntibody = function(antibodyName) {
            //if not already carrying
            if (_antibodies.indexOf(antibodyName) == -1) {
                _antibodies.push(antibodyName);
                self.removeContagion(antibodyName);
            };
        };

        self.removeContagion = function(contagionName) {
            var contagionToKeep = [];
            for (var i=0;i<_contagion.length;i++) {
                if (!(_contagion[i].getName() == contagionName)) {
                    contagionToKeep.push(_contagion[i]);
                };
            };
            _contagion = contagionToKeep;
        };

        self.transmitAntibodies = function(receiver, transmissionMethod) {
            for (var a=0;a<_antibodies.length;a++) {
                if (!(receiver.hasAntibodies(_antibodies[a]))) {
                    var chanceModifier = 4 //75% chance of success by default
                    if (transmissionMethod == "inject") {
                        chanceModifier = 8 //much more likely to succeed with inject
                    };
                    var randomInt = Math.floor(Math.random() * chanceModifier); 
                    if (randomInt > 0) { //% chance of success
                        receiver.setAntibody(_antibodies[a])
                        //console.debug("antibodies passed to "+receiver.getType());
                    };
                };
            };
        };

        self.transmitContagion = function(receiver, transmissionMethod) {
            for (var c=0;c<_contagion.length;c++) {
                //note, contagion objects are their own thing, not artefacts
                _contagion[c].transmit(self, receiver, transmissionMethod); 
            };
        };

        self.transmit = function(receiver, transmissionMethod) {
            self.transmitContagion(receiver, transmissionMethod);
            self.transmitAntibodies(receiver, transmissionMethod);
            return "";
        };

        self.cure = function(contagionName) {
            itemToRemove = _antibodies.indexOf(contagionName);
            if (itemToRemove) {
                self.removeContagion(contagionName);
                self.setAntibody(contagionName);
            };
        };

        self.isHidden = function() {
            return _hidden;
        };

        self.hide = function() {
            _hidden = true;
            return _hidden;
        };

        self.show = function() {
            _hidden = false;
            _position = null;
            return _hidden;
        };

        self.getPosition = function() {
            return _position;
        };

        self.setPosition = function(position) {
            _position = position;
            return _position;
        };

        self.isDead = function() {
            return false; //inanimate, not dead
        };

        self.setWeight = function(newWeight) {
            _weight = parseFloat(newWeight);
        };

        self.getWeight = function() {
            return _weight+_inventory.getWeight();
        };

        self.getRemainingSpace = function () {
            return _inventory.getRemainingSpace();
        };

        self.getPrice = function () {
            return _price;
        };

        self.getRepairCost = function () {
            var repairFactor = 0;
            if (_broken) {
                repairFactor = 40;
            } else if (_damaged) {
                repairFactor = 20;
            } else if (_chewed) {
                repairFactor = 8;
            };
            return ((((Math.round(_price * (1 + (repairFactor / 100)) * 100) / 100)-_price).toFixed(2))/1); //tofixed returns a string!
        };

        self.increasePriceByPercent = function (percent) {
            _price = Math.round(_price * (1 + (percent / 100)) * 100) / 100;
            return _price;
        };

        self.discountPriceByPercent = function (percent) {
            if (_price > 0) {
                _price = Math.round(_price * ((100 - percent) / 100) * 100) / 100;
            };
            return _price;
        };

        self.getAttackStrength = function() {
            if (self.isDestroyed()) {return 0;};

            if (self.getType() == "weapon") {
                //reduce damage if weapon is broken.  (a broken chair would work differently)
                if (self.isDamaged()) {return _attackStrength*(tools.randomIntInRange(8,9)/10);}
                if (self.isBroken()) {return _attackStrength*(tools.randomIntInRange(5,8)/10);}
            }
            return _attackStrength;
        };

        self.getAffinityModifier = function() {
            if (self.isDestroyed()) {return 0;};
            if (self.isBroken()) {return Math.floor(_affinityModifier/2);};
            return _affinityModifier;
        };

        self.reduceAffinityModifier = function() {
            //bring affinity modifier closer to 0.
            if (_affinityModifier>0) {
                _affinityModifier--;
            };
            if (_affinityModifier<0) {
                _affinityModifier++;
            };
        };


        self.isCollectable = function() {
            return _collectable;
        };

        self.isEdible = function() {
            if (self.isDestroyed()) {return false;};
            if ((!self.isOpen()) && self.opens()) {return false;};
            return _edible;
        };

        self.isBreakable = function() {
            return _breakable;
        };
  
        self.setBreakable = function(bool) {
            if (!bool || bool == "false") {
                _breakable = false;
            } else {
                _breakable = true;
            };
        };

        //artefact only
        self.isIntact = function() {
            //check if object is completely intact
            if (_destroyed||_broken||_chewed||_damaged) {return false;};
            return true;
        };

        self.isDestroyed = function() {
            return _destroyed;
        };

        self.isBroken = function() {
            return _broken;
        };

        self.isDamaged = function() {
            return _damaged;
        };

        self.isChewed = function() {
            return _chewed;
        };

        self.forceRepair = function() {
            //force opening and repair of object
                _broken = false;
                _damaged = false;
                _chewed = false;
                if (_locked) {
                    _locked = false;
                };
                if (_opens) {
                    _open = true;
                }

            return self.getDisplayName() + " repaired.";
        };

        self.combinesWith = function(anObject, crossCheck) {
            if (self.isDestroyed()) {return false;};
            var combinesWithResultArray = self.getCombinesWith();
            var combinesWithResult;

            if (Array.isArray(combinesWithResultArray)) {
                    var index = combinesWithResultArray.indexOf(anObject.getName());
                    if (index >-1) {
                        combinesWithResult = combinesWithResultArray[index];
                    }; 
            } else {
                if (combinesWithResultArray == anObject.getName()) {
                    combinesWithResult = combinesWithResultArray;
                };                       
            };
            
            if (combinesWithResult) { //we have a match
                if (crossCheck) {
                    let localName = self.getName();
                    let otherObject = anObject.getName();
                    if (anObject.combinesWith(self, false)) { return true;};
                } else {
                    //no need to cross-check
                    return true;
                };
            };

            return false;
        };

        self.combinesWithContentsOf = function(anObject) {
            var objectInventory = anObject.getInventoryObject();
            var items = objectInventory.getAllObjectsAndChildren(false);
            for (var i=0; i<items.length;i++) {
                if (self.combinesWith(items[i],true)) {
                    return true;
                };
            };
            return false;
        };
        
        
        self.split = function (chargeSize, removeSplitPart) {
            
            if (chargeSize >= self.chargesRemaining()) {
                //caller will need to handle nothing coming back and taking whole item instead.
                return null;
            };
            //we can only split items without inventory
            if (self.getInventorySize(true) > 0) {
                return null;
            };
           
            //adjust/define weight and charges
            var originalWeight = self.getWeight();
            var originalCharges = self.chargesRemaining();
            var chargeWeight = self.getChargeWeight();

            var newDestinationWeight = chargeWeight * chargeSize;
            
            //we sometimes call artefact.split to test a result - in these cases we don't want to remove it from the original 
            if (removeSplitPart) {
                self.consume(chargeSize);
                
                //set new weights rounded to 1 decimal place
                var newSourceWeight = chargeWeight * self.chargesRemaining();
                if (originalWeight < newSourceWeight + newDestinationWeight) {
                    //catch rounding issues
                    var reduceSourceWeightBy = (newSourceWeight + newDestinationWeight) - originalWeight;
                    newSourceWeight -= reduceSourceWeightBy;
                };

                self.setWeight(newSourceWeight);

                if (self.chargesRemaining() == 1) {
                    //last piece remaining
                    _collectable = true;
                };
            };            
            
            
            //return a new (smaller) instance of self
            var sourceAttributes = self.getSourceAttributes();
            //as it's splittable, it should also be collectable (even if original object was not)
            //@todo - check this is actually duplicating attributes - risky if not.
            sourceAttributes.canCollect = true;

            var newDescription = self.getRawDescription();

            var splitItem = new Artefact(self.getName(), newDescription, self.getInitialDetailedDescription(), sourceAttributes, self.getLinkedExits(), self.getDeliveryItems());
            splitItem.addSyns(self.getSyns());               
            splitItem.setCharges(chargeSize);
            splitItem.setWeight(newDestinationWeight);       
            
            return splitItem;
        };        

        self.combineWith = function (anObject) {
            if (!(self.combinesWith(anObject, true))) { return null; };

            //get first available delivery item that matches both combine objects.
            var deliveryItemSource;
            var objectDeliveryItems = anObject.getDeliveryItems();
            let match = false;
            for (var d = 0;d<objectDeliveryItems.length;d++) {
                for (var dd = 0; dd < _delivers.length; dd++) {
                    if (_delivers[dd].getName() == objectDeliveryItems[d].getName())  {
                        deliveryItemSource = _delivers[dd];
                        match = true;
                        break;
                    };
                }; 
                if (match) {break;}
            };    

            
            //console.debug("combining :" + self.getName() + " with " + anObject.getName() + " to produce " + deliveryItemSource.getName());                      

            //consume charge
            var originalCharges = anObject.chargesRemaining();
            var objectCharges = originalCharges;

            if (objectCharges > 0) {
                objectCharges = anObject.consume();
            };

            //zero the weights of both source objects. Unfortunately the caller must remove them from wherever they came from 

            //reduce weight of supplied object.
            if (anObject.chargesRemaining() == 0) {              
                anObject.setWeight(0);
            } else if (objectCharges > 0) {
                //new weight (rounded to 2 decimal places here)
                anObject.setWeight(Math.round((anObject.getWeight()/originalCharges)*objectCharges*100)/100);
            };

            //if we don't have a delivery item...
            if (!deliveryItemSource) { return null;};    

            //we do have a new item to deliver, continue...
            //as we are the combine-ee, we will be wiped out and replaced - regardless of charges remaining.
            //(caller will need to remove)
            self.setWeight(0);
            self.consumeAll(); 

            //return a new instance of deliveryObject
            var deliveredItem = new Artefact(deliveryItemSource.getName(), deliveryItemSource.getRawDescription(), deliveryItemSource.getInitialDetailedDescription(), deliveryItemSource.getSourceAttributes(), deliveryItemSource.getLinkedExits(), deliveryItemSource.getDeliveryItems());
            deliveredItem.addSyns(deliveryItemSource.getSyns());

            //clone inventory from source too.
            var sourceInventoryItems = deliveryItemSource.getAllObjects(true);
            var deliveredItemInventory = deliveredItem.getInventoryObject();
            for (var s=0;s<sourceInventoryItems.length;s++) {
                deliveredItemInventory.add(new Artefact(sourceInventoryItems[s].getName(), sourceInventoryItems[s].getRawDescription(), sourceInventoryItems[s].getInitialDetailedDescription(), sourceInventoryItems[s].getSourceAttributes(), sourceInventoryItems[s].getLinkedExits(), sourceInventoryItems[s].getDeliveryItems()));
            };

            return deliveredItem;
        };

        self.canSupport = function(anObject) {
            if (self.isDestroyed()) { return false; };
            if (self.isBroken() && anObject.isSolid()) { return false; };
            if (!self.isSolid()) { return false; };
            if (self.getType() == "scenery" && anObject.isSolid()){ return false; };
            if (anObject.getWeight() > self.getWeight()) { return false; }; //object is too big/heavy

            return true;
        };

        self.canHide = function(anObject) {
            if (self.isDestroyed()) { return false; };
            if (!self.isSolid()) { return false; };
            if (!anObject.isSolid()) { return false; }; //can't hide liquids and powders.
            if (self.getType() == "scenery"){ return false; };
            if (!self.isCollectable() || (Number(self.getWeight()) > 200)) { return false; }; //far too heavy
            if (anObject.getWeight() > self.getWeight()) { return false; }; //object is too big/heavy

            return true;
        };

        self.canContain = function(anObject) {
            //broken containers can't contain anything
            if (self.isDestroyed()) { return false; };
            if (self.getType() == "container" && self.isBroken()) { return false; };
            if (self.getSubType() == "bottle" && anObject.isSolid()) { return false; };
            if ((anObject.isLiquid()||anObject.isPowder()) && (!(self.holdsLiquid()))) { return false; };
            return _inventory.canContain(anObject, self.getName());
        };

        self.getCarryWeight = function() {
            return _inventory.getCarryWeight();
        };

        self.canCarry = function(anObject, position) {
            //broken containers can't contain anything
            if (self.isDestroyed()) {return false};
            if ((anObject.isLiquid()||anObject.isPowder()) && (!(self.holdsLiquid()))) {return false;};
            if (position) {
                //can't carry something bigger than self
                if (anObject.getWeight() > self.getWeight()) {
                    return false;
                };

                //is the space already taken? //note we allow a player plus another object!
                if (_inventory.getObjectByPosition(position, true) && anObject.getType() != "player") {
                    return false; 
                };

                return true;
            };   

            if (self.getType() == "container" && self.isBroken()) {return false;};
            if (self.isLocked()) {return false;};

            return _inventory.canCarry(anObject);

        };

        self.getObject = function(anObjectName) {
            return _inventory.getObject(anObjectName);
        };

        self.getLiquidOrPowder = function() {
            return _inventory.getLiquidOrPowder();
        };

        self.getInventorySize = function(countHiddenObjects, ignoreSceneryObjects) {
            return _inventory.size(countHiddenObjects, ignoreSceneryObjects);
        };

        self.contains = function(anObjectName) {
            //console.debug("checking inventory for "+anObjectName);
            return _inventory.check(anObjectName);
        };

        self.listHiddenObjects = function(position, location) {
            return _inventory.listHiddenObjects(position, location);
        };

        self.showHiddenObjects = function(position, location) {
            return _inventory.showHiddenObjects(position, location);
        };

        self.getHiddenObjects = function(position, location) {
            return _inventory.getHiddenObjects(position, location);
        };

        self.getAllObjects = function(includeHiddenObjects) {
            return _inventory.getAllObjects(includeHiddenObjects);
        };

        self.getComponents = function(anObjectName) {
            return _inventory.getComponents(anObjectName);
        };

        self.removeObject = function(anObjectName) {
            return _inventory.remove(anObjectName);
        };

        self.wave = function(verb, otherObject, map, player) { 
            if (self.isDestroyed()) {return "There's nothing left of "+_suffix+".";};
            //we may wave this at another object or creature
            if (self.checkCustomAction(verb)) {
                return self.performCustomAction(verb, map, player);
            };
            return "Nothing happens.";
        };

        self.rub = function(anObject, player) {
            if (self.isDestroyed()) {return "There's nothing left of "+_suffix+".";};
            if (anObject) {

                //we may rub this with another object or creature
                if (anObject.getType() == "food") {
                    if (_attackStrength >=5) {_attackStrength -= 5;}; //yes you can reduce the strenght of an item by repeatedly coating it with food!
                    anObject.consume();
                    return "You make a sticky mess that leaves "+self.getDisplayName()+" somewhat slippery but see no obvious benefit.";
                };

                if (anObject.getSubType() == "buff") {
                    if (_polished <2) {
                        _polished++;
                        self.increasePriceByPercent(5);
                        anObject.consume();
                        return "Ooh shiny!"
                    };
                    return _descriptivePrefix+" polished as much as "+_prefix.toLowerCase()+" can be already.";
                };

                if (self.getSubType() == "sharp" && anObject.getSubType() == "sharpen") {
                    if (_sharpened <2) {
                        _sharpened++;
                        _attackStrength+=3;
                        anObject.consume();
                        return "That's a keen edge you've got going there!<br>Nice job."
                    };
                    return "I think "+_descriptivePrefix.toLowerCase()+" as sharp as you're going to get "+_prefix.toLowerCase()+".";
                };

                if (anObject.isLiquid()) {
                    anObject.consume();
                    return "You smear "+anObject.getDisplayName()+" over "+self.getDisplayName()+". That was fun!";
                } else if (anObject.isPowder()) {
                    anObject.consume();
                    return "You rub "+anObject.getDisplayName()+" over "+self.getDisplayName()+".";                    
                };
            };

            return "Nothing happens.";
        };
        
        self.shake = function (verb, map, player) {
            if (self.isDestroyed()) { return "There's nothing left of " + _suffix + "."; };
            
            if (self.checkCustomAction(verb)) {
                return self.performCustomAction(verb, map, player);
            };
            

            if (self.isLiquid()) {
                return "Slosh, splosh, gurgle...<br>... Well, you dind't spill any at least.";
            };

            if (self.isPowder()) {
                return "You hear a gentle rattle. Nothing else happens though.";
            };

            var  liquidOrPowder = _inventory.getLiquidOrPowder();
            if (liquidOrPowder) {
                let sloshesOrRattles = "rattles";
                if (liquidOrPowder.isLiquid()) {
                    sloshesOrRattles = "sloshes";
                };
                if (self.isOpen()) {
                    return tools.initCap(liquidOrPowder.getName())+" "+sloshesOrRattles+" around inside " + _suffix + " but you manage not to spill any.";
                } else {
                    return "You hear "+sloshesOrRattles+" from inside " + _suffix + ".";
                };
            };
            if (_inventory.size(true, true) > 0) {
                var bashResult = self.bash();
                return "Rattle rattle rattle... ...kerchink!<br>your fingers slip briefly from " + self.getName() + " before you recover your composure. "+bashResult;
            };
            
            return "Rattle rattle rattle... ...Nothing happens.";
        };  

        self.chargesRemaining = function() {
            if (self.isDestroyed()) {return 0;};
            //console.debug("Remaining charges for "+self.getDisplayName()+": "+_charges);
            //we use -1 to mean unlimited
            if (_charges == -1) {return _charges};

            return Math.round(_charges*100)/100; //round to 2dp
        };

        self.getChargeUnit = function() {
            if (_chargeUnit) {return _chargeUnit;};
            return "charge";
        };
        
        self.getChargeWeight = function () {
            if (!self.willDivide()) { return self.getWeight(); };
            if (_charges < 1) { return self.getWeight(); };
            return (self.getWeight() / self.chargesRemaining()).toFixed(1);
        };

        self.setCharges = function(newValue) {
            if (self.isDestroyed()) {return 0;};
            _charges = newValue;
        };

        self.saleUnit = function() {
            if (self.isDestroyed()) {return 0;};
            //we use -1 to mean "all" (default)
            return _saleUnit;
        };

        self.hasPower = function() {
            if (!(_switched) && !(_flammable) && !(_explosive)) {return false;};
            if (_broken || _destroyed) {return false;};
            if (_charges == 0) { return false; }; //we use -1 to mean unlimited
            if (!(self.checkComponents())) {return false;};
            //console.debug(self.getDisplayName()+" has power.");
            return true;
        };

        self.isPoweredOn = function() {
            if (self.hasPower() && _on) {
                //console.debug(self.getDisplayName()+" is switched on.");
                return true;
            };
            //console.debug(self.getDisplayName()+" is switched off.");
            return false;
        };
        
        self.isBurning = function () {
            if ((_flammable||_explosive) && _on) {
                return true;
            };
            return false;
        };

        self.isSwitched = function() {
            return _switched;
        };
               
        self.isFlammable = function () {
            return _flammable;
        };
             
        self.isExplosive = function () {
            return _explosive;
        };

        self.turn = function(verb, direction) {
            if (direction) {direction = " "+direction;};
            if (_collectable) {
                return "You attempt to "+verb+" "+self.getDisplayName()+direction+". Nothing of interest happens.";
            };
            return _descriptivePrefix+" fixed in place, there's no obvious way to "+verb+" "+_suffix+".";
        };        

        self.switchOnOrOff = function(verb, onOrOff, ignitionSource) {
            if (_broken||self.isDestroyed()) {return tools.initCap(_descriptivePrefix)+" broken.";};
            if (!(_switched) && !(_flammable) && !(_explosive)) {
                var resultString = "There's no obvious way to " + verb + " " + _suffix;
                if (verb != "light") {
                    resultString += " " + onOrOff;
                };
                return resultString + ".";
            };
            if (_locked) {return tools.initCap(_descriptivePrefix)+" locked, you'll need to find a way into "+_suffix+" first.";};

            if (verb == "start") {
                onOrOff = "start";
            };

            if (verb == "stop") {
                onOrOff = "off";
            };
            
            if (verb == "extinguish") {
                if (_flammable || _explosive) {
                    if (self.getWeight() <= 1) {
                        //player can blow out small items but not large ones
                        verb = "blow";
                    } else {
                        verb = "put";
                    };
                } else if (_switched) {
                    verb = "turn";
                };

            };

            if (!(self.hasPower()) && (onOrOff == "on" || onOrOff == "start" || onOrOff == " on and off ")) {
                var resultString = tools.initCap(_descriptivePrefix) + " dead, there's no sign of power.";
                if (!(self.checkComponentsExist())) {
                    resultString += " " + tools.initCap(_descriptivePrefix) + " missing something.";
                } else if (!(self.checkComponents())) {
                    resultString += " You'll need to check "+_suffix+" over carefully.";
                };
                if (_flammable) { resultString = tools.initCap(_descriptivePrefix) + " all burned out."; }
                return resultString;
            };

            switch (onOrOff) {
                case "on and off":
                case "off and on":
                    if (_switched) {
                        return "You must work in IT!<br>Whilst power cycling hardware sometimes helps in the real world, nothing here is quite that simple.";
                    } else {
                        return "You must work in IT!<br>In this particular case however, I can promise you that'll make no difference at all and just wastes time.";
                    };
                    break;
                case "on":
                    if (_on) {
                        if (_flammable) {
                            return tools.initCap(_descriptivePrefix) + " already burning.";
                        };
                        return tools.initCap(_descriptivePrefix) + " already " + onOrOff + ".";
                    }; 
                    break;
                case "start":
                    if (_on) {return tools.initCap(_descriptivePrefix)+" already running.";}; 
                    break;
                case "off":
                case "out":                    
                    if (!(_on)) {
                        if (_flammable) {
                            return tools.initCap(_descriptivePrefix) + " not lit.";
                        };
                        return tools.initCap(_descriptivePrefix) + " already " + onOrOff + ".";
                    };
                    break;
                default:
                    null; 
            };
            
            if (_flammable && !(_on) && (onOrOff != "off" || onOrOff != "out" || onOrOff != "stop" )) {
                if (!ignitionSource) {
                    return "You don't have anything to light "+_suffix+ " with."
                };
            };

            _on = (!(_on)); //toggle switch 
            var resultString = "You " + verb + " " + self.getDisplayName();
            if (verb != "extinguish" && verb != "light" && verb != "ignite" && verb != "start" && verb != "stop") {
                if (_on) {resultString+= " on";} 
                else {resultString+= " "+onOrOff;};
            };
            
            if (!ignitionSource) {
                resultString += ".";
            };
            return resultString;
        };

        self.getBurnRate = function() {
            return _burnRate;
        };

        self.recharge = function(quantity) {
            if (quantity <0) {return _charges} // use consume instead!
            if (_charges == -1) {return -1};
            _charges += quantity;
            return _charges;
        };

        self.consumeAll = function() {
            if (_charges < 0) {return _charges;};
            _charges = 0;
            return _charges;
        };

        self.consume = function(quantity) {
            if (quantity <0) {return _charges} //if we want to recharge something instead, we need a recharge function!
            if (_charges <= 0) {return _charges;};

            if (!(quantity)) {
                if (_burnRate > 0) {
                    quantity = _burnRate;
                } else {
                    quantity = 1;
                };
            };

            //we have charges > 0
            if (_charges-quantity >0) {
                _charges -=quantity;
            } else {
                _charges = 0;
            };

            return Math.round(_charges*100)/100;  //to 2 decimals.
            //console.debug("Consumed "+self.getDisplayName()+" charges remaining: "+_charges);
        };

        self.consumeItem = function (anObject) {
            var anObjectChargesRemaining = anObject.consume(); 
            if (anObjectChargesRemaining == 0) { _inventory.remove(anObject.getName());}; //we throw the object consumed away if empty (for now).
        };

        self.consumeComponents = function(quantity, components) {
            //comsume a charge from each component and return the lowest remaining charge.
            if (!components) {
                components = _inventory.getComponents(self.getName(), true);
            };
            if (!(quantity)) {
                if (_burnRate > 0) {
                    quantity = _burnRate;
                };
            };
            
            var minChargesRemaining = -1;
            for (var i = 0; i < components.length; i++) {
                var originalCharges = components[i].chargesRemaining();
                var chargesRemaining = components[i].consume(quantity);
                if (components[i].willDivide()) {
                    //decrease weight of component
                    var originalWeight = components[i].getWeight();
                    var newWeight = Math.round((originalWeight / originalCharges) * chargesRemaining * 100) / 100;
                    components[i].setWeight(newWeight);
                };
                //remove item if it's completely consumable
                if (chargesRemaining == 0 && (components[i].isLiquid() || components[i].isPowder() || components[i].getType() == "food")) {
                    _inventory.remove(components[i].getName());
                };
                if (chargesRemaining >-1 ) {
                    if (minChargesRemaining == -1 || minChargesRemaining > chargesRemaining) {
                        minChargesRemaining = chargesRemaining;
                    };
                };
            };
            
            return minChargesRemaining;
        };

        self.getConsumedComponents = function() {
            var components = _inventory.getComponents(self.getName(), true);
            var consumedItems = []
            for (var i=0;i<components.length;i++) {
                if (components[i].chargesRemaining() == 0) {
                    consumedItems.push(components[i]);
                };
            };

            return consumedItems;
        };
        
        self.checkComponentsExist = function (someComponents) {
            var components = [];
            components = components.concat(_inventory.getComponents(self.getName(), true));
            //if we have some optionally passed in components, consider those too.
            if (someComponents) {
                components = components.concat(someComponents);
            };

            if (components.length >= _requiredComponentCount) { return true; }; //we have everything we need yet.
            return false;
        };        

        self.checkComponents = function(someComponents) {
            if (self.isDestroyed()) {return false;};
            var components = [];
            components = components.concat(_inventory.getComponents(self.getName()));
            //if we have some optionally passed in components, consider those too.
            if (someComponents) {
                components = components.concat(someComponents);
            };
            //console.debug("Required components for "+self.getName()+": " + _requiredComponentCount + " Current Components: " + components.length);
            for (var i = 0; i < components.length; i++) {
                if (components[i].isBroken()) { return false; };
                if (components[i].isDamaged()) { return false; };
                if (components[i].chargesRemaining() == 0) {return false;};
            };
            if (components.length >= _requiredComponentCount) {return true;}; //we have everything we need yet.
            return false;
        };

        self.delivers = function (anObjectName) {
            for (var i = 0; i < _delivers.length; i++) {
                if (_delivers[i].syn(anObjectName)) {
                    return true;
                };
            };
            return false;
        };


        self.deliver = function (anObjectName) {
            //if we can't deliver the requested object
            if (!(self.canDeliver(anObjectName))) {return null;};

            //retrieve all components (both source and destination)
            var components = _inventory.getComponents(self.getName());
            components = components.concat(_inventory.getComponents(anObjectName));

            //iterate thru each component - remove charge and reduce weight.
            self.consumeComponents(null, components);                       

            //get the source we're using...
            var deliveryItemSource;

            for (var i = 0; i < _delivers.length; i++) {
                if (_delivers[i].syn(anObjectName)) {
                    deliveryItemSource = _delivers[i];
                    break;
                };
            };

            if (!(deliveryItemSource)) { return null; };

            var deliveredItem = new Artefact(deliveryItemSource.getName(), deliveryItemSource.getRawDescription(), deliveryItemSource.getInitialDetailedDescription(), deliveryItemSource.getSourceAttributes(), deliveryItemSource.getLinkedExits(), deliveryItemSource.getDeliveryItems()); //return a new instance of deliveryObject
            deliveredItem.addSyns(deliveryItemSource.getSyns());
            deliveredItem.show();
            return deliveredItem;
        };

        self.repair = function(repairer) {
            var repairerInventory = repairer.getInventoryObject();
            var repairerType = repairer.getType();
            var resultString = "";

            if(_destroyed) {return tools.initCap(_descriptivePrefix)+" beyond repair."};

            if (!(repairer.canRepair(self))) {
                if (repairerType == "player") {
                    return "Unfortunately you don't have the skills needed to fully repair "+_suffix+". Somebody around here can hopefully sort "+_suffix+" out for you if you <i>ask</i> them nicely.<br>If you're in a hurry, you <i>might</i> be able to find a guide somewhere and learn how to sort "+_suffix+" out on your own."; 
                } else {
                    return "Unfortunately "+repairer.getPrefix().toLowerCase()+" can't fix "+_suffix+"."; 
                };
            };

            _description = _initialDescription;
            _detailedDescription = _initialDetailedDescription;

            //restore price
            if (_price > 0) { 
                if (_broken) {
                    self.increasePriceByPercent(50); 
                } else if (_damaged) {
                    self.increasePriceByPercent(25); 
                } else if (_chewed) {
                    self.increasePriceByPercent(10); 
                };
            }; 

            _broken = false;
            _damaged = false;
            _chewed = false;

            resultString += repairer.getPrefix()+" fixed "+self.getDisplayName();

            if (self.checkComponents()) { return resultString+".";};
        
            //if there's still components missing...
            //attempt to add components from repairer inventory
            var components = repairerInventory.getComponents(self.getName());
            if (components.length == 0) {return resultString +" but "+ _descriptivePrefix.toLowerCase()+" still missing something.";};
       
            var addedComponentCount = 0;
            var notAddedComponentCount = 0;
            var addedComponentString = " and put ";

            for (var i=0; i<components.length; i++) {
                if (self.canContain(components[i], self.getName())) {
                    if (addedComponentCount>0 && addedComponentCount==components.length-1) {addedComponentString +=" and ";};  
                    if (addedComponentCount>0 && addedComponentCount<components.length-1) {addedComponentString +=", ";};                     
                    addedComponentString += components[i].getDisplayName();
                    _inventory.add(components[i]);
                    repairerInventory.remove(components[i].getName());
                    addedComponentCount++;
                } else {
                    notAddedComponentCount++;
                };
            };
                
            if (addedComponentCount>0) {
                if (repairerType == "player") {
                    resultString+= addedComponentString+" you were carrying into "+_suffix+".<br>";
                } else {
                    resultString+= addedComponentString+" "+repairer.getSuffix()+" was carrying into "+_suffix+".<br>";
                };
            }
            else {
                resultString+="."
            };


            //check we have everything we need
            if (!(self.checkComponents())) {
                if (repairerType == "player") {
                    resultString += "<br>You make a valiant attempt at getting "+_suffix+" fully working but ";
                } else {
                    resultString += "<br>"+repairer.getPrefix()+" makes a valiant attempt at getting "+_suffix+" fully working but ";
                };

                if (notAddedComponentCount>0) {
                    if (_locked) {
                        resultString += _descriptivePrefix.toLowerCase()+" locked.";
                    } else {
                        resultString += "can't get all the right parts to fit.";
                    };
                    
                } else {
                    if (!(self.checkComponentsExist())) {
                        resultString += _descriptivePrefix.toLowerCase() + " still missing something.";
                    } else {
                        resultString += " there's still something else wrong with " + _suffix + ".";
                    }
                };
            };

            return resultString;

        };

        self.break = function(verb, deliberateAction, map, player) {
            if (_broken && deliberateAction) {return self.destroy(deliberateAction);};
            var wasAlreadyDamaged = _damaged;
            _damaged = true;
            if (_breakable) {
                _broken = true;
                var wasLocked = _locked;
                var wasOpen = _open;
                if (_lockable) {_locked = false;};
                if (_opens && !_open) {_open = true;};
                if (_price > 0) { self.discountPriceByPercent(50); };
                _detailedDescription = tools.initCap(_descriptivePrefix)+" broken";
                var opened = "";
                if (wasLocked && !wasOpen && _open) { opened = " open"; };
                if (_viewDestination) {
                    self.revealHiddenExits();
                };
                var customActionResult = "";
                if (self.checkCustomAction(verb)) {
                    customActionResult = "<br>"+self.performCustomAction(verb, map, player);
                };
                return "You broke "+_suffix+opened+"!"+customActionResult;
            };

            if (!wasAlreadyDamaged) {
                _detailedDescription += "<br>"+_prefix+" "+self.showsPlural()+" signs of abuse.";
                if (deliberateAction) {return "You do some minor damage but fail to do any <i>real</i> harm to "+_suffix+".";};
            } else {
                if (deliberateAction) {return "Try as you might, you can't seem to do any more harm to "+_suffix+".";};
            };
            return "";
        };

        self.destroy = function(deliberateAction) {
            if (_destroyed && deliberateAction) { return "There's not enough of "+_suffix+" left to do any more damage to.";};
            var wasAlreadyDamaged = _damaged;
            _damaged = true;
            if (_breakable) {
                var desc = self.descriptionWithCorrectPrefix();
                _broken = true;
                _destroyed = true;
                _hidden = false;
                _synonyms.push("wreckage");
                if (_price > 0) { self.discountPriceByPercent(100); };
                //mark delivery items as destroyed too
                var deliveryItems = self.getDeliveryItems();
                for (var i=0;i<deliveryItems;i++) {
                    deliveryItems[i].destroy(deliberateAction);
                };

                if (_lockable) {_locked = false;};

                desc = desc.replace(" broken "," ")
                desc = desc.replace(" chewed "," ")
                desc = desc.replace(" damaged "," ")
                _description = "wreckage that was once " + desc;
                _detailedDescription = " There's nothing left but a few useless fragments.";
                //note, player will remove object from game if possible
                var resultString = "You destroyed "+_suffix+"!";

                //remove inactive missions - active ones will be handled elsewhere
                var missionsToKeep = [];
                for (var m=0;m<_missions.length;m++) {
                    var keepFlag = false;
                    if (_missions[m].isActive()) {
                        missionsToKeep.push(_missions[m]);
                        keepFlag = true;
                    };
                    //handle "destroy" missions...
                    if (!(keepFlag)) {                   
                        if (_missions[m].getMissionObjectName() == self.getName()) {
                            var conditionAttributes = _missions[m].getConditionAttributes();
                            if (conditionAttributes["isDestroyed"]) {
                                if (conditionAttributes["isDestroyed"] == true) {
                                    missionsToKeep.push(_missions[m]);
                                };
                            };
                        };
                    };
                };
                var numberOfMissionsToRemove = _missions.length - missionsToKeep.length;
                if (numberOfMissionsToRemove > 0) {
                    resultString += "<br>Unfortunately you needed "+self.getOriginalDisplayName()+". ";
                    resultString += "You're welcome to carry on and see how well you do without "+_suffix+" though."

                    _missions = missionsToKeep;
                };

                return resultString;
            };
            if (!wasAlreadyDamaged) {
                _detailedDescription += "<br>"+_prefix+" "+self.showsPlural()+" signs of abuse.";
                if (deliberateAction) {return "You do a little damage but try as you might, you can't seem to destroy "+_suffix+".";};
            } else {
                if (deliberateAction) {return "Try as you might, you can't seem to do any more harm to "+_suffix+".";};
            };
            return "";
        };

        self.bash = function() {
            //cascade to contents
            if (_inventory.size(true) > 0) {
                var contents = _inventory.getAllObjects(true);
                for (var i=0;i<contents.length;i++) {
                    //75% chance of damaging contents
                    var randomInt = Math.floor(Math.random() * 4);
                    if (randomInt > 0) {
                        contents[i].bash();
                    };                
                };
            };

            //if you mistreat something breakable more than once it breaks, if you do it again, you lose it.
            if (((_broken) && (_breakable) && (_damaged))) {
                return self.destroy(false);
            };
            if ((_breakable)&&(_damaged)) {
                return self.break("bash",false);
            };
            if (!(_damaged)) {
                _damaged = true;
                if (_price > 0) { self.discountPriceByPercent(25); };
                _detailedDescription += " "+_prefix+" "+self.showsPlural()+" signs of being dropped or abused.";
            };
            return "";
        };

        self.hurt = function(pointsToRemove) {
            //cascade to contents
            if (_inventory.size(true) > 0) {
                var contents = _inventory.getAllObjects(true);
                for (var i=0;i<contents.length;i++) {
                    //75% chance of damaging contents
                    var randomInt = Math.floor(Math.random() * 4);
                    if (randomInt > 0) {
                        contents[i].bash();
                    };                
                };
            };

            if (((_broken) && (_breakable) && (_damaged))) {
                return self.destroy();
            };
        
            if (_breakable) {
                return self.break("hurt", false);
            };
            if (!(_damaged)) {
                _damaged = true;
                _detailedDescription += " "+_prefix+" "+self.showsPlural()+" signs of damage beyond normal expected wear and tear.";
            };

            return "";
        };

        self.moveOpenOrClose = function(verb, locationName, map, player) {
            if (self.isOpen() && self.opens()) {
                return self.close(verb, locationName);
            } else {
                return self.moveOrOpen(verb, locationName, map, player);
            };
        };

        self.getLinkedDoors = function(map, currentLocationName) {
            if (!(_hasLinkedDoor)) {return [];};
            var linkedDoors = [];

            for (var i=0;i<_linkedExits.length;i++) {
                if (_linkedExits[i].getSourceName() == currentLocationName) {
                    var newSource = _linkedExits[i].getDestinationName();
                    var newDoor = map.getDoorFor(newSource, currentLocationName);
                    if (newDoor) {linkedDoors.push(newDoor)};
                };
            }; 
            
            return linkedDoors;        
        };

        self.revealHiddenExits = function(locationName) {
            if (_opens || _linkedExits.length==0){ return "";};

            var localExit;
            var resultString = "";
            for (var i=0;i<_linkedExits.length;i++) {
                if (_linkedExits[i].getSourceName() == locationName) {
                    localExit = _linkedExits[i];
                    //toggle exit visibility
                    if (!(_linkedExits[i].isVisible())) {                            
                        resultString = _linkedExits[i].show();
                    };
                } else {
                    //toggle exit visibility
                    if (!(_linkedExits[i].isVisible())) {
                        _linkedExits[i].show();
                    };
                };
            };

            if (!(localExit)) {
                //we had no *local* exit but we know there's at least one somewhere
                resultString = "A secret door opens somewhere.";
            };

            resultString = resultString.replace(" new ", " hidden ")
            if (resultString.length > 0) {resultString = "<br>"+resultString;};

            return resultString;
        };

        self.moveOrOpen = function(verb, locationName, map, player) {
            if (self.isDestroyed()) {return "There's nothing viable left to work with.";};
            if (_locked) {return tools.initCap(_descriptivePrefix)+" locked."};
            if (_opens && (!(_open))){

                _open = true;
                if(_linkedExits.length>0) {
                    var localExit;
                    var exitResult = "";
                    for (var i=0;i<_linkedExits.length;i++) {
                        if (_linkedExits[i].getSourceName() == locationName) {
                            localExit = _linkedExits[i];
                            //toggle exit visibility
                            if (_linkedExits[i].isVisible()) {
                                if (verb != "open") {
                                    exitResult = _linkedExits[i].hide();
                                };
                            } else {
                                exitResult = _linkedExits[i].show();
                            };
                        } else {
                            //toggle exit visibility
                            if (_linkedExits[i].isVisible()) {
                                if (verb != "open") {
                                    _linkedExits[i].hide();  
                                };
                            } else {
                                _linkedExits[i].show();
                            };
                        };
                    };

                    if (!(localExit)) {
                        //we had no *local* exit
                        exitResult = "A door opens somewhere.";
                    };

                    return "You "+verb+" "+self.getDisplayName()+". "+exitResult;
                };
               

                if (verb == 'open'||verb == 'unlock') {
                    var resultString = "You "+verb+" "+self.getDisplayName()+".";
                    if (_inventory.size(false, true) > 0) {
                        resultString += " "+tools.initCap(_prefix)+ " contain";
                        if (!(_plural)) resultString += "s"
                        resultString +=" "+_inventory.describe()+".";
                    } else if (_inventory.getCarryWeight() > 0) {
                        resultString +=" "+tools.initCap(_descriptivePrefix)+" empty.";
                    };
                    return resultString;
                };
            };
            if (verb == 'open') {
                if (_opens && (_open)) {
                    if (_autoLock >= 0) {
                        _lockInMoves = _autoLock;
                        //console.debug("resetting autolock to "+ _lockInMoves)
                        //reset auto-lock timer
                    };
                    return tools.initCap(_descriptivePrefix) + " already open.";
                };
                if (self.checkCustomAction(verb)) {
                    return self.performCustomAction(verb, map, player);
                } else {
                    return _prefix + " " + doesPlural() + " open.";
                };
            };
            if (verb == 'unlock') { return "You "+verb+" "+self.getDisplayName()+"."};

            if (_broken) {return _descriptivePrefix+" broken.";};
            return "You try to "+verb+" "+self.getDisplayName()+".<br>After a few minutes of yanking and shoving you conceed defeat.";
        };

        self.close = function(verb, locationName) {
            if (self.getSubType() == "intangible") {return self.getDescription()+" isn't something you can close.";};
            if (self.isDestroyed()) {return "There's nothing viable left to work with.";};
            if (_opens && _open){
                _open = false;

                var exitResult = "";

                if(_linkedExits.length>0) {
                    var localExit;
                    
                    for (var i=0;i<_linkedExits.length;i++) {
                        if (_linkedExits[i].getSourceName() == locationName) {
                            localExit = _linkedExits[i];
                        }; 
                        //note, we don't toggle exit visibility for other exits here - only on "open"
                        exitResult ="<br>"+_linkedExits[i].hide();  
                    };

                    if (!(localExit)) {
                        //we had no *local* exit
                        exitResult = "<br>A door closes somewhere.";
                    };
                };

                return "You "+verb+" "+self.getDisplayName()+". "+exitResult;
            } else {return tools.initCap(_descriptivePrefix)+" not open."};
        };

        self.hasSpoken = function() {
            return false;
        };

        self.reply = function(someSpeech, player, keyword, map) {
            if (self.isDestroyed()) { return "The remaining fragments of inanimate spirit from " + self.getDisplayName() + " ignore you."; };
            if (self.getSubType() == "intangible") {return "You call into the aether but receive no response."}
            return tools.initCap(_descriptivePrefix)+" quietly aware of the sound of your voice but "+self.showsPlural()+" no sign of response.";
        };

        self.canTravel = function() {
            return false;
        };
        
        self.inject = function (player) {            
            if (!self.checkCustomAction("inject")) {
                return tools.initCap(_descriptivePrefix) + " not designed for that kind of personal medical use.";
            };
            var cures = _inventory.getAllObjectsOfType("cure");
            if (cures.length == 0) {
                return "There's nothing in " + _suffix + " that you can sensibly inject.";
            };
            
            for (var c = 0; c < cures.length; c++) {
                cures[c].transmit(player, "inject");
                self.consumeItem(cures[c]); //will remove item if all doses are used up
            };

            var cureListAsString = "";
            for (var i = 0; i < cures.length; i++) {
                cureListAsString += tools.listSeparator(i, cures.length);
                cureListAsString += cures[i].getDisplayName();
            };
            
            var hurtString = player.hurt(5, self);
            
            var resultString = "You inject yourself with " + cureListAsString + ". ";
            if (player.isDead()) {
                resultString += hurtString;
            } else {
                resultString += "It's probably worth checking your <i>status</i> just to be sure it worked properly.";
            };

            return resultString;
        };

        self.consumeEdible = function(action, consumer, map, player) {
            const drinkVerbs = ["drink", "gulp", "quaff", "neck"]
            if (_liquid && (!drinkVerbs.includes(action))) {action = "drink"};
            let s = consumer.getType() != "player" ? "s" : "";
            if (self.checkCustomAction(action)) {
                return self.performCustomAction(action, map, player);
            }
            if (self.getSubType() == "intangible") {
                if (drinkVerbs.includes(action) ) {
                    return consumer.getPrefix() + " gulp" + s + " around trying to get a mouthful of " + self.getName() + ".<br>After leaping around like a guppy out of water for a while, " + consumer.getPrefix().toLowerCase() + " decide" + s + " to give up.";
                } else {
                    return "Nope, that's not going to work for "+consumer.getSuffix()+".";
                };
            }
            if ((!self.isOpen()) && self.opens()) {
                return consumer.getPrefix() + "'ll need to open " + _suffix + " up first.";
            }
            if (self.isDestroyed()) {
                return "There's nothing left for " + consumer.getSuffix() + " to " + action + ".";
            }

            if (action == "lick" || action == "taste") {
                var taste = self.getTaste();
                if (taste) { return taste;}
                if (self.getType() == "food") {
                    if (_nutrition < 0) {return "Not so good. I'd avoid that if I were you."};
                    return "Tastes like " + self.getName()+"."+tools.imgTag(self);
                };
            }

            if (_edible) {
                if (drinkVerbs.includes(action) && (!_liquid)) {
                    return _prefix + "'d get stuck in "+consumer.getPossessiveSuffix()+" throat if "+consumer.getPrefix().toLowerCase()+" tried.";
                };

                let originalCharges = self.chargesRemaining();
                let chargesRemaining = originalCharges;
                if (chargesRemaining > 0) {
                    chargesRemaining = self.consume();
                }
                if (chargesRemaining == 0) {
                    _weight = 0;
                } else if (chargesRemaining > 0) {
                    if (self.willDivide()) {
                        let originalWeight = self.getWeight();
                        let newWeight = Math.round((originalWeight / originalCharges) * chargesRemaining * 100) / 100;
                        self.setWeight(newWeight);
                    }
                }
                let objectDescription = self.getDisplayName();
                if (originalCharges >= 1) {
                    let chargeUnit = self.getChargeUnit();
                    if (chargeUnit == "charge") {
                        objectDescription = "some " + self.getRawDescription();
                    } else {
                        objectDescription = tools.anOrA(chargeUnit) + " of " + self.getRawDescription();
                    }
                }
                let resultString = tools.initCap(consumer.getPrefix()) + " " + action + s + " " + objectDescription;
                if (_nutrition >= 0) {
                    consumer.recover(_nutrition);

                    let randomReplies = [];
                    if (_liquid) {randomReplies = [". Yup, that was a very welcome drink.", ". Tasty. Much better!", ". That hit the spot.", ". That quenched "+consumer.getPossessiveSuffix()+" thirst."]}
                    else if (self.getSubType() == "meal") {randomReplies = [". A good meal is just what " + consumer.getSuffix() + " needed.", ". That hit the spot.", ". That'll keep " + consumer.getSuffix() + " going for hours."]}
                    else if (_nutrition >= 20) {randomReplies = [". Mmm, tasty. Much better!", ". That hit the spot.", ". That should keep " + consumer.getSuffix() + " going for a while."]}
                    else {randomReplies = [". Mmm, tasty.", ". Not bad!", ". That'll stave off the hunger for a short while."]}

                    if (randomReplies.length > 0) {
                        let randomIndex = Math.floor(Math.random() * randomReplies.length);
                        resultString += randomReplies[randomIndex];
                    }
                } else {
                    resultString += ". That wasn't a good idea. ";
                    resultString += consumer.hurt(_nutrition * -1);
                }
                let transmissionMethod = _liquid ? "drink" : "bite";
                resultString += self.transmit(consumer, transmissionMethod);
                return resultString+tools.imgTag(self);
            }
            else if (drinkVerbs.includes(action) ) {
                //we should only get here if it's an inedible liquid
                return "After much gagging and spluttering, it's clear "+_suffix + " just won't stay down.";
            }
            else if (_chewed) {
                return "It's really not worth " + consumer.getSuffix() + " trying to eat "+_prefix.toLowerCase()+" again."; 
            }         
            else {
                    if (_price > 0) { self.discountPriceByPercent(10); };
                    _chewed = true;
                    _detailedDescription += ".<br>"+_prefix+" looks like "+_descriptivePrefix.toLowerCase()+" been chewed by something.";
                    consumer.hurt(5);
                    return tools.initCap(consumer.getPrefix())+" just can't seem to keep "+_suffix+" in "+consumer.getPossessiveSuffix()+" mouth without causing an injury."
            };
            
        };

        self.drink = function (consumer, map, player) {
            return self.consumeEdible("drink", consumer, map, player);
        };

        self.eat = function (verb, consumer, map, player) {
            return self.consumeEdible(verb, consumer, map, player)
        };

        self.canDeliver = function (anObjectName) {
            //do we deliver anything at all?
            if (!(_delivers)) {
                //console.debug(self.getName() + " doesn't deliver anything");
                return false;
            };

            //find delivery item in array...
            var deliveryItem;
            //is the requested object one we can deliver?     
            for (var i = 0; i < _delivers.length; i++) {
                if (_delivers[i].syn(anObjectName)) {
                    deliveryItem = _delivers[i];
                    break;
                };
            };

            if (!(deliveryItem)) {
                //console.debug(self.getName() + " doesn't deliver " + anObjectName);
                return false;
            };

            //is the deliverer intact?
            if (self.isBroken() || self.isDestroyed()) {
                //console.debug(self.getName() + " is broken");
                return false;
            };

            //do we have all the components needed to work?
            if (!(self.checkComponentsExist())) {
                //console.debug(self.getName() + " doesn't have all the required components to run");
                return false;
            };
            
            //is everything intact and charged?
            if (!(self.checkComponents())) {
                //console.debug(self.getName() + " something's wrong with a component somewhere");
                return false;
            };
            
            //is the deliverer working?
            if (_switched) {
                if (!(self.isPoweredOn())) {
                    //console.debug(self.getName() + " isn't switched on");
                    return false;
                };
            };

            //do we have the required components for what we're delivering?
            var deliveryComponents = _inventory.getComponents(anObjectName);
            if (!(deliveryItem.checkComponents(deliveryComponents))) {
                //console.debug(self.getName() + " doesn't have all the required components to deliver "+anObjectName);
                return false;
            };

            return true;
        };

        self.relinquish = function(anObjectName, map, player, locationInventory) {
            if (self.getSubType() == "intangible") {return self.getDisplayName()+" can't give you anything.";};
            var playerInventory = player.getInventoryObject();

            //are we attempting to retrieve a delivery object?
            var objectToGive;
            if (_delivers && (!(self.getCombinesWith()))) {
                //is the requested object one we can deliver?     
                for (var i = 0; i < _delivers.length; i++) {
                    if (_delivers[i].syn(anObjectName)) {
                        objectToGive = _delivers[i];
                        break;
                    };
                };
            };

            if ((!objectToGive) && _locked && (!(self.isDestroyed()))) { return tools.initCap(_descriptivePrefix) + " locked."; };
            if ((!objectToGive) && (!(self.isOpen()))) { return tools.initCap(_descriptivePrefix) + " closed."; };


            //is this something we deliver
            var delivering = false;
            if (objectToGive) {
                if (self.isDestroyed() || self.isBroken()) { return tools.initCap(_descriptivePrefix) + " broken."; };
                if (objectToGive.getPrice() > 0) { 
                    if (!(player.canAfford(objectToGive.getPrice()))) {return "You can't afford " + objectToGive.getPrefix().toLowerCase() + ".";};
                };
                delivering = true;
            }; 

            //if not a deliverable, check inventory
            if (!(objectToGive)) { objectToGive = _inventory.getObject(anObjectName); };

            if (!(objectToGive)) {
                var firstWord = anObjectName.split(" ", 1)[0];
                if (firstWord == "all") {
                    return player.getAll("collect", self.getName(), anObjectName.replace("all ", ""));
                };
                return tools.initCap(self.getDisplayName()) + " doesn't contain " + anObjectName + ".";
            };

            if (delivering && !(self.canDeliver(anObjectName))) { return "Sorry. "+self.getDisplayName()+" "+doesPlural()+" seem to be working at the moment.<br>Try <i>examining</i> "+_suffix+" to see what's wrong."+tools.imgTag(self);};
            
            if (!(objectToGive.isCollectable())) {
                if (objectToGive.checkCustomAction("get")) {
                    return objectToGive.performCustomAction("get", map, player);
                };
                return "I'm not quite sure what you're trying to do with "+self.getDisplayName() + ". Whatever it is, it's not going to happen.";
            };

            var requiresContainer = objectToGive.requiresContainer();
            var suitableContainer = playerInventory.getSuitableContainer(objectToGive);

            //fallback option, is there a container in the location itself?
            if (!(suitableContainer)) {
                if (locationInventory) {
                    suitableContainer = locationInventory.getSuitableContainer(objectToGive);
                };
            };
    
            if (requiresContainer && (!(suitableContainer))) { return "Sorry. You need something (suitable) to carry "+objectToGive.getDisplayName()+" in.";};

            if (!(playerInventory.canCarry(objectToGive))) { return "Sorry. You can't carry " + anObjectName + " at the moment." };

            var deliveredItem;
            if (delivering) {
                deliveredItem = self.deliver(objectToGive.getName());
                if (!(deliveredItem)) { return tools.initCap(_descriptivePrefix) + " not working at the moment." };
                objectToGive = deliveredItem;
                if (objectToGive.getPrice() > 0) { 
                    player.reduceCash(objectToGive.getPrice());
                    _inventory.increaseCash(objectToGive.getPrice());
                };
            };

            if (!(deliveredItem)) {_inventory.remove(anObjectName);};

            //add to suitable container or to player inventory
            //if container is required, we _know_ we have a suitable container by this point.
            if (requiresContainer) {
                var resultString = suitableContainer.receive(objectToGive, map, player, false);
                //return "You now have a "+suitableContainer.getName()+" of "+objectToGive.getName()+".";

                if (playerInventory.check(suitableContainer.getName())) {
                    //player has container
                    //did it combine with something and "vanish"?
                    if (playerInventory.check(objectToGive.getName(), true)) {
                        return "You now have a " + suitableContainer.getName() + " of " + objectToGive.getName() + "."+tools.imgTag(suitableContainer);
                    } else {
                        return resultString;
                    };
                    
                };

                //location has container
                if (suitableContainer.getInventoryObject().check(objectToGive.getName(), true)) {
                    resultString = "You collect " + objectToGive.getName() + " into a nearby " + suitableContainer.getName() + ".<br>";
                } else {
                    resultString = resultString.replace(suitableContainer.getDisplayName(), "a nearby " + suitableContainer.getName())+ "<br>You collect "+suitableContainer.getDisplayName()+".";
                };

                //automatically collect the container if possible
                if (playerInventory.canCarry(suitableContainer)) {
                    if (locationInventory) {
                        locationInventory.remove(suitableContainer.getName());
                    };
                    playerInventory.add(suitableContainer);
                    
                    return resultString+tools.imgTag(suitableContainer) ;
                };

                //if the player can't pick it up.
                return resultString + "<br>" + objectToGive.getDescriptivePrefix().toLowerCase() + " here for you to collect when you're ready.";
            };

            playerInventory.add(objectToGive);

            if (objectToGive.isComponentOf(self.getName())) {          
                  if (_switched) {self.switchOnOrOff('switch','off');}; //kill the power
                  return "You take "+objectToGive.getDisplayName()+".<br>Hopefully nobody needs "+self.getDisplayName()+" to work any time soon.<br>";      
            };

            return "You're now carrying "+objectToGive.getDescription()+"."+tools.imgTag(objectToGive);
        };

        self.addLiquid = function(liquidName) {
            if (_wetted.indexOf(liquidName) == -1) {
                _wetted.push(liquidName);
            };
       };

        self.removeLiquid = function(liquidName) {
            var index = _wetted.indexOf(liquidName);
            if (index > -1) {
                _wetted.splice(index,1);
                return 1;
            };
            return 0;
        };

        self.hasLiquid = function(liquidName) {
            var index = _wetted.indexOf(liquidName);
            if (index > -1) {
                return true;
            };
            return false;
        };

        self.countLiquid = function() {
            return _wetted.length;
        };

        self.clearLiquids = function() {
            var count = _wetted.length;
            _wetted = [];
            return count;
        };

        self.position = function(anObject, position) {
            if (self.isDestroyed()) {return tools.initCap(_descriptivePrefix)+" damaged beyond repair, there's no hope of "+_suffix+" concealing anything.";};

            var objectAlreadyInPlace = _inventory.getObjectByPosition(position);
            if (objectAlreadyInPlace) {
                if (objectAlreadyInPlace.getName() == anObject.getName()) {return tools.initCap(_descriptivePrefix)+" already there.";};
                return "There's already something "+position+" there."
            };
            _inventory.position(anObject, position);            
            return self.getDisplayName()+" now has "+anObject.getDescription()+" "+position+" "+_suffix+".";
        };

        self.receive = function(anObject, map, player, playerisAsking) {
            if (self.getType() == "container" && self.isBroken()) {return tools.initCap(_descriptivePrefix)+" broken. You'll need to fix "+_suffix+" first.";};
            if (self.isDestroyed()) {return tools.initCap(_descriptivePrefix)+" damaged beyond repair, there's no hope of "+_suffix+" carrying anything.";};
            if (_locked) {return tools.initCap(_descriptivePrefix)+" locked.";};
            var resultString = "";           

            //if object combines with something in contents...
            if (anObject.combinesWithContentsOf(self)) {
                var newReceiver;
                var items = _inventory.getAllObjectsAndChildren(false);
                for (var i = 0; i < items.length; i++) {
                    if (anObject.combinesWith(items[i], true)) {
                        newReceiver = items[i];
                    };
                };
                
                var newObject = newReceiver.combineWith(anObject);
                var requiredContainer = newObject.getRequiredContainer();
                if (requiredContainer) {
                    if (requiredContainer == self.getName()) {
                        _inventory.remove(newReceiver.getName());
                        _inventory.add(newObject);
                        resultString = "You add the " + anObject.getName() + " to " + self.getDisplayName() + ".<br>";
                        return resultString + tools.initCap(self.getDisplayName()) + " now contains " + newObject.descriptionWithCorrectPrefix() + "."+tools.imgTag(self);
                    } else {
                        resultString = "You attempt to make " + newObject.getDescription() + " by adding " + anObject.getDisplayName() + " to " + newReceiver.getDisplayName();
                        resultString += " in " + self.getDisplayName() + " but you need something else to put " + newObject.getPrefix().toLowerCase() + " in.<br>"
                    };
                } else {
                    if (self.canCarry(newObject)) {
                        _inventory.remove(newReceiver.getName());
                        _inventory.add(newObject);
                        resultString = "You add the " + anObject.getName() + " to " + self.getDisplayName() + ".<br>";
                        return resultString + self.getDisplayName() + " now contains " + newObject.getDescription() + "."+tools.imgTag(self);
                    } else {
                        resultString = "You attempt to make " + newObject.getDescription() + " by adding " + anObject.getName() + " to " + newReceiver.getDisplayName();
                        resultString += " in " + self.getDisplayName() + " but you need something else to put " + newObject.getPrefix().toLowerCase() + " in.<br>"
                    };

                };
                
                //return result
                return resultString + tools.initCap(self.getDisplayName()) + " now contains " + anObject.getDescription() + "."+tools.imgTag(self);
            //handle liquids or powders here
            } else if (anObject.isLiquid() || anObject.isPowder()) {
                //console.debug("liquid handling");
                var inventoryLiquidOrPowder = _inventory.getLiquidOrPowder();
                if (inventoryLiquidOrPowder) {
                    if (inventoryLiquidOrPowder.getName() != anObject.getName()) {
                        //we're mixing 2 liquids that shouldn't combine.
                        resultString = "$fail$You consider adding " + anObject.descriptionWithCorrectPrefix(anObject.getName()) + " to " + self.getDisplayName();
                        return resultString + " but "+anObject.getPrefix().toLowerCase()+" won't really mix well with " + inventoryLiquidOrPowder.getDisplayName() + " that's already in there."+tools.imgTag(self);
                    } else {
                        //this is a liquid with the same name - is is comparable
                        if (self.compareLiquidOrPowder(anObject, inventoryLiquidOrPowder)) {
                            var combinedLiquidOrPowder = self.combineWithLiquid(anObject, inventoryLiquidOrPowder);
                            _inventory.remove(inventoryLiquidOrPowder.getName());
                            _inventory.add(combinedLiquidOrPowder);
                            //increase attributes of existing inventory object from attributes of the one we're adding
                            return resultString + _prefix + " now contains more " + combinedLiquidOrPowder.getName() + "."+tools.imgTag(self);
                        };
                    };
                };
            };
            
            //item didn't combine - add it to inventory
            // if(anObject.willDivide(2)) {self.add} @todo #bug - need a git blame to work out what this was meant to do
            _inventory.add(anObject);
            return "";
        };

        self.isOpen = function() {
            //treat it as "open" if it *doesn't* open.
            if ((_opens && _open) || (!(_opens)) ||(self.isDestroyed())) {return true;};
            return false;
        };

        self.opens = function() {
            return _opens;
        };
        
        self.setAutoLock = function (duration) {
            _autoLock = duration;
        };
        
        self.hasAutoLock = function () {
            if (_autoLock >= 0) { return true; };
            return false;
        };

        self.isLocked = function() {
            if (self.isDestroyed()) {return false;};
            if (_locked) {return true;};
            return false;
        };

        self.getMatchingKey = function(verb, inventoryObject) {
            //find the strongest non-breakable key or tool the player is carrying.
            var keys = inventoryObject.getAllObjectsOfType("key");
            //then try any keys that are part of this object itself
            keys = keys.concat(_inventory.getAllObjectsOfType("key"));

            if (verb == "pick" || verb == "unlock") {
                keys = keys.concat(inventoryObject.getAllObjectsOfType("lockpick"));
                keys = keys.concat(_inventory.getAllObjectsOfType("lockpick"));
            };

            if (["dismantle", "undo", "unscrew", "tighten", "unpick"].includes(verb)) {
                keys = keys.concat(inventoryObject.getAllObjectsOfType("assemble"));
                keys = keys.concat(_inventory.getAllObjectsOfType("assemble"));
            };
            
            for(var index = 0; index < keys.length; index++) {
                //caller must explicitly choose to use a breakable key using "pick" otherwise only auto-use non-breakable ones.
                if (((!(keys[index].isBreakable()))||verb == "pick"||verb == "dismantle")) {
                    if (keys[index].keyTo(self)) {
                        //console.debug('Key found for: '+self.getName());
                        return keys[index];
                    };                   
                };
            };
            //console.debug('Matching key not found');
            return null;
        };

        self.lock = function(aKey, locationName) {
            if (self.isDestroyed()||_broken) {return tools.initCap(_descriptivePrefix)+" broken. You'll need to fix "+_suffix+" first.";};
            if (!(_lockable)) {return _prefix+" "+doesPlural()+" have a lock.";};
            if (!(_locked)) {
                if (!(aKey)) {return "You don't have a key that fits.";};
                if (aKey.keyTo(self)) {
                    _locked = true;
                    if (self.getType() == "property" || self.getType() == "vehicle") {_collectable = false;};
                    if (_open) {return self.close('close and lock',locationName);}
                    else {return "You lock "+self.getDisplayName()+"."};
                } else {
                    return "You need something else to lock "+_suffix+".";
                };
            };
            return tools.initCap(_descriptivePrefix)+" already locked.";
        };

        self.unlock = function(aKey, locationName, map, player) {
            if (self.isDestroyed() || _broken) {
                if (self.isDestroyed()) {
                    _locked = false;
                    return tools.initCap(_descriptivePrefix) + " just wreckage. Not much point in being locked now, is there? " + _suffix + ".";
                } else if (!_locked) {
                    return tools.initCap(_descriptivePrefix) + " broken. No need to unlock " + _suffix + ".";
                };
            };
            if (!(_lockable)) {return _prefix+" "+doesPlural()+" have a lock.";};
            if (_locked) {
                if (!(aKey)) {return "You need something to unlock "+_suffix+" with.";};
                if (aKey.keyTo(self)) {
                    _locked = false;
                    if (self.getType() == "property" || self.getType() == "vehicle") {_collectable = true;};
                    var resultString = self.moveOrOpen('unlock',locationName, map, player);
                    //unlocking with a breakable item will damage it
                    if (aKey.isBreakable()) {
                        aKey.bash();
                        if (aKey.isBroken()) {resultString += " You broke "+aKey.getDisplayName()+".";};
                        if (aKey.isDestroyed()) {resultString += " You destroyed "+aKey.getDisplayName()+".";};
                    };
                    return resultString;
                } else {
                    return "You need something else to unlock "+_suffix+".";
                };
            };
            return  tools.initCap(_descriptivePrefix)+" already unlocked.";
        };

        self.keyTo = function(anObject) {
            if (self.isDestroyed()||_broken) {return false;};
            if (_unlocks == anObject.getName()) {return true;};
            if (_unlocks == "everything") {return true;};
            return false;
        };

        //nasty - expose our internals - needed to support inventory containers
        self.getInventoryObject = function() {
            return _inventory;
        };

        self.tick = function (owner) {
            //if turned on and "burnRate" set, decrement charges on self and/or contents.
            //for those turned on (or ticking), decrement relevant stats
            //not implemented yet
            var resultString = "";
            var ownerString = "A nearby";  //owner is location
            if (owner) {
                if (owner.getType() == "player") {
                    ownerString = "Your";
                } else if (owner.getType() == "creature") {
                    ownerString = owner.getFirstName();
                    ownerString += "'";
                    if (ownerString.slice(-2) != "s'") {
                        ownerString += "s";
                    };
                };
            };
            var usedItem; 
            if (_on) {
                if (_burnRate >0) {
                    var remainingcharge = self.consume()
                    var remainingComponentCharge = self.consumeComponents();
                    if (remainingcharge == 0) {usedItem = self;};

                    if (!(usedItem)) {
                        if (remainingComponentCharge == 0) {
                            //figure out what was consumed...
                            var consumedItems = self.getConsumedComponents();
                            if (consumedItems.length > 0) {
                                usedItem = consumedItems[0];
                            };
                        };
                    };
                };

                if (usedItem) {
                    _on = false;
                    var usedItemString = usedItem.getName();
                    var runOutString = " run out";
                    if (usedItemString != self.getName()) { usedItemString = self.getName() + " " + usedItem.getName(); };
                    if (usedItem.isFlammable()) {
                        runOutString = " burned out";
                        if (owner) {
                            var ownerInventory = owner.getInventoryObject();
                            ownerInventory.remove(usedItemString, false);
                        };
                    };

                    resultString += ownerString+ " " + usedItemString + " " + usedItem.hasPlural() + runOutString + ".<br>";
                };
            };
            
            //if autolock enabled - tick down lock timer,  lock/close (and reset timer) if expired.
            if (_autoLock >= 0 && !_broken && !_destroyed) {
                if ((_lockable && (!(self.isLocked()))) || self.isOpen()) {
                    var wasOpen = self.isOpen();
                    var wasUnLocked = (_lockable && !(self.isLocked()));
                    if (_lockInMoves <= 0) {
                        self.close("close", "");  //close it.                        
                        if (_lockable) {
                            //note, if autolock is set but object isn't "Lockable", it'll just auto-close
                            _locked = true;  //force lock - even without key. 
                        };
                        _lockInMoves = _autoLock; //reset lockInMoves for next time.
                        var closeAndLock = "";
                        if (wasOpen && wasUnLocked) {
                            closeAndLock += " closes and locks shut";
                        } else if (wasUnLocked) {
                            closeAndLock += " locks shut";
                        } else {
                            closeAndLock += " closes";
                        };
                        closeAndLock += ".<br>";
                        resultString += tools.initCap(self.getDisplayName()) + closeAndLock;
                    } else {
                        _lockInMoves--;
                    };
                };
            };
            return resultString;
        };

        //end public member functions

        //console.debug(_objectName + " created: "+_name+", "+self.destinationName);
    }
    catch(err) {
	    console.error("Unable to create Artefact object '"+name+"': "+err);
        throw err;
    };	
};