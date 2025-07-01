"use strict";
//inventory object - used for player, creature and eventually object inventories
module.exports.Inventory = function Inventory(maxCarryingWeight, openingCashBalance, ownerName) {
    try{
        //module deps
        var tools = require('./tools.js');     
        const dictionaryModule = require('./dictionary');    
                
	    var self = this; //closure so we don't lose this reference in callbacks

	    var _objectName = "Inventory";
        var _ownerName = ownerName;
        var _maxCarryingWeight = maxCarryingWeight;
        var _items = [];
        var _money = openingCashBalance;

        //console.debug(_objectName + ' created');

        ////public methods
        self.toString = function() {
            //return self.describe;
            if (_items.length == 0) {return "[]";};
            var resultString = "[";
            for(var i = 0; i < _items.length; i++) {
                    if (i>0) {resultString += ", ";};
                    resultString+= _items[i].toString();
            };
            resultString += "]";

            //need to add money in here.
            return resultString;
       
        };

        self.size = function(countHiddenObjects, ignoreSceneryObjects) {
            if (countHiddenObjects) {
                if (ignoreSceneryObjects) {
                    var objectCount = 0;
                    for (var i = 0; i < _items.length; i++) {
                        if (_items[i].getType() != "scenery") {
                            objectCount++;
                        };
                    };
                    return objectCount;
                };
                return _items.length;
            };
            var objectCount = 0;
            for (var i=0;i<_items.length;i++){
                if (!(_items[i].isHidden())) {objectCount++;};
            };
            return objectCount;
        };

        self.creatureCount = function(subType, includeDeadCreatures) {
            var objectCount = 0;
            for (var i=0;i<_items.length;i++){
                if (_items[i].getType() == "creature") {
                    if (!_items[i].isDead()||includeDeadCreatures) {
                        if (subType) {
                            if (_items[i].getSubType() == subType) {
                                objectCount++;
                            };
                        } else {
                            objectCount++;
                        };
                    };
                };
            };
            return objectCount;
        };
        
        self.foodPortionCount = function () {
            var portionCount = 0;
            var foodItems = self.getAllObjectsOfType("food");
            for (var f = 0; f < foodItems.length; f++) {
                var portions = foodItems[f].chargesRemaining();
                if (portions < 0) {
                    portions = 1;
                };
                portionCount += portions;
            };
            return portionCount;
        };

        self.setCashBalance = function (newBalance) {
            _money = newBalance;
        };

        self.getCashBalance = function () {
            return _money;
        };

        self.getInventoryValue = function () {
            var value = 0;
            for (var i=0;i<_items.length;i++) {
               value += _items[i].getPrice(); 
            };
            return value;
        };

        self.canAfford = function (price) {
            //console.debug("Can afford? money:"+_money+" price: "+price);
            if (_money >= price) { return true; };
            return false;
        };

        self.reduceCash = function(amount) {
            _money -= amount;
        };

        self.increaseCash = function (amount) {
            _money += amount;
        };

        self.updateCarryWeight = function (changeBy) {
            var newWeight = _maxCarryingWeight + changeBy;
            if (newWeight <0) {newWeight = 0;};
            self.setCarryWeight(newWeight);
        };


        self.setCarryWeight = function(newWeight) {
            //ensure new weight is not set below current contents
            if (self.getWeight() > newWeight) {
                _maxCarryingWeight = self.getWeight();
            } else {
                _maxCarryingWeight = parseFloat(newWeight);
            };
        };

        self.getCarryWeight = function() {
            return _maxCarryingWeight;
        };

        //take a set of objects and return simple JSON description and price.
        //de-duplicate at the same time
        self.prepareItemList = function (items, minSize) {
            if (minSize == undefined) {
                minSize = -999;
            };

            var itemList = [];
            var finalList = [];
            for (var i = 0; i < items.length; i++) {
                if (minSize) {if (items[i].getWeight() < minSize) {continue;};};
                var itemString = items[i].toString();
                if (itemList[itemString]) {
                    itemList[itemString].count += 1;
                } else {
                    var unitCount = 1
                    var charges = items[i].chargesRemaining();
                    var saleUnit = items[i].saleUnit()
                    if (charges > 0 && saleUnit > 0) {
                        unitCount = Math.floor(Math.round((charges*100)/(saleUnit*100)));
                    };
                    
                    var rawDescription = items[i].getRawDescription();
                    if (charges == 1) {
                        if (items[i].getChargeUnit() != "charge") {
                            rawDescription = items[i].getChargeUnit() + " of " + rawDescription;
                        };
                    };

                    //@todo - want to use items[i].getDescription() instead of raw description if it's a container of x - e.g. bottle of milk
                    itemList[itemString] = { "description": items[i].getDescription(), "rawDescription": rawDescription, "price": items[i].getPrice(), "count": unitCount };
                };
            };

            for (var key in itemList) {
                if (itemList[key].count > 1) {
                    //note this uses raw description, not modified one
                    itemList[key].description = tools.pluraliseDescription(itemList[key].rawDescription, itemList[key].count);
                };
                finalList.push({ "description": itemList[key].description, "price": itemList[key].price, "count": itemList[key].count });
            };

            return finalList;
        };

        self.describe = function(additionalAttribute, minSize) {
            var description = '';
            var allItems = self.getAllObjects();
            var items = self.prepareItemList(allItems, minSize);
            if (items.length == 0) { description = "nothing" };

            for (var i = 0; i < items.length; i++) {
                //show as items for sale
                if (additionalAttribute == "price") {
                    if (items.length >1 ) {description += "- ";};
                    
                    if (items.length >1 ) {description +=tools.initCap(items[i].description);}
                    else { description += items[i].description;};
                    
                    description += " (price: &pound;" + items[i].price.toFixed(2);
                    if (items[i].count > 1) {
                        description += " each";
                    };
                    description += ")";
                    
                    if (items.length >1 ) {description +="<br>";};
                } else {
                    //just show as items
                    description += tools.listSeparator(i, items.length);
                    description += items[i].description;
                };

            };

            if (additionalAttribute != "price") {
                description += self.describePositionedItems(minSize);
            };

            return description;
        };	

        self.describePositionedItems = function(minSize) {
            var positionedItems = self.getPositionedObjects(false, minSize);
            var description = "";
            if (positionedItems.length >0) {
                var isAre = " are";
                if (positionedItems.length == 1) {isAre = "'s";};
                description += "<br>There"+isAre+" ";

                var items = self.prepareItemList(positionedItems);
                for (var i = 0; i < items.length; i++) {
                    description += tools.listSeparator(i, items.length);
                    description += items[i].description;
                };

                description += " placed on top";
            };

            return description;
        };

        self.getWeight = function() {
            if (_items.length==0){return 0};
            var weight = 0;
            for(var i = 0; i < _items.length; i++) {
                    if (!(_items[i].getPosition())) {
                        weight+=parseFloat(_items[i].getWeight());
                    };
            };
            return weight;
        };

        self.canContain = function(anObject,containerName) {

            var requiredContainer = anObject.getRequiredContainer();
            if (requiredContainer) {
                if (requiredContainer != containerName) {return false;};
            };

            return self.canCarry(anObject);
        };
        
        self.getLiquidOrPowder = function () {
            //as opposed to "hasLiquid". 
            //only explore items directly in this inventory, no nested items.
            //we cannot have more than one liquid or powder in a container.
            for (var i = 0; i < _items.length; i++) {
                if (_items[i].isLiquid() || _items[i].isPowder()) { return _items[i]; };
            };
            return null;
        };

        self.canCarry = function(anObject) {
            if (anObject == undefined || !(anObject)) {
                return false;
            };

            //reminder - we're inside the inventory here - self.getWeight is the weight of other inventory contents.
            const objectWeight = anObject.getWeight();
            const inventoryWeight = self.getWeight()
            if ((objectWeight + inventoryWeight) > _maxCarryingWeight) {
                //console.debug("can't carry total weight of "+parseFloat(anObject.getWeight()+self.getWeight()));
                return false;
            };

            //check if what we're adding will conflict vs combine with existing liquid or powder.
            if (anObject.isLiquid()||anObject.isPowder()) {
                let contents = self.getLiquidOrPowder();
                if (!(contents)) {
                    return true;
                };

                let objectName = anObject.getName();
                let contentsName = contents.getName();

                if (contentsName == objectName) {
                    return true;
                };

                if (contents.getWeight() <= 0 && contents.getType() != "scenery" && contents.getSubType() != "intangible" ) {
                    //minor hack to handle when we're in the middle of combining things and have zeroed weight..
                    if (contents.delivers(objectName)) {
                        return true;
                    };
                };
                if (!anObject.combinesWith(contents, true)) {
                    return false;
                };
            };

            return true;
        };
        
        self.getRemainingSpace = function () {
            return _maxCarryingWeight - self.getWeight();
        };
    
        self.add = function(anObject) {
            if (anObject == undefined) {return "Can't pick it up.";};
            if (!(self.canCarry(anObject))) {return tools.initCap(anObject.getDescriptivePrefix())+" too heavy.";};
            return self.forceAdd(anObject); 
        };

        self.forceAdd = function(anObject) {
            if (anObject == undefined) {return "Can't pick it up.";};

            _items.push(anObject);
            return "success: "+anObject.getDescription()+".";
        };

        self.position = function(anObject, position) {
            if (!position) {return self.add(anObject);};

            self.forceAdd(anObject);

            if (self.check(anObject.getName(), true, true)) {
                anObject.setPosition(position);
            };

        };
    
        self.remove = function(anObjectName, searchCreatures) {
            var localInventory = self.getAllObjects(true);
            //loop through top level items only first.           
            for (var index = localInventory.length - 1; index >= 0; index--) {
                //find by name first
                let itemName = localInventory[index].getName();
                if (itemName == anObjectName) {
                    var returnObject = _items[index];
                    localInventory.splice(index, 1);
                    //console.debug(anObjectName+" removed from "+_ownerName+" inventory");
                    returnObject.show();
                    return returnObject;
                };
            };
            
            //if not already removed, remove nested object
            for (var index = localInventory.length - 1; index >= 0; index--) {
                if(((localInventory[index].getType() != 'creature') || searchCreatures) && (!(localInventory[index].isLocked()))) {
                    if (localInventory[index].isOpen()) {
                        //only remove from open, unlocked containers - this way we know the player has discovered them
                        var containerInventory = localInventory[index].getInventoryObject()
                        var object = containerInventory.remove(anObjectName);
                    };
                    if (object) {
                        object.show();
                        return object;
                    };
                            
                    if (localInventory[index].getType() == 'creature') {
                        var salesInventory = localInventory[index].getSalesInventoryObject();
                        object = salesInventory.remove(anObjectName);
                        if (object) {
                            object.show();
                            return object
                        };
                    };
                } else if (localInventory[index].isLocked()) {
                    var objects = localInventory[index].getInventoryObject().getPositionedObjects(false);
                    for (var o=0;o<objects.length;o++) {
                        if (objects[o].getName() == anObjectName) {
                            return objects[o];
                        };
                    };
                };
            };

            //find by synonym if not already returned.
            for(var index = localInventory.length-1; index >= 0; index--) {
                if (localInventory[index].syn(anObjectName)) {
                    var returnObject = _items[index];
                    localInventory.splice(index,1);
                    //console.debug(anObjectName+" removed from "+_ownerName+" inventory");
                    returnObject.show();
                    return returnObject;
                };
            };

            //console.debug(_ownerName+" is not carrying "+anObjectName);
            return null;
        };
    
        self.check = function(anObjectName, ignoreSynonyms, searchCreatures, ignoreScenery) {
            //unfortunately can't use dictionary here as we need to also look inside other items.
            //check if passed in object name is in inventory
            if (self.getObject(anObjectName, ignoreSynonyms, searchCreatures, null, ignoreScenery)){return true;};
            return false;
        };

        self.listHiddenObjects = function(position, location) {
            var foundItems = [];
            for(var i = 0; i < _items.length; i++) {
                if (_items[i].isHidden() && _items[i].getType() != "scenery") {
                    if (!position || (_items[i].getPosition() == position)) {
                        foundItems.push(_items[i]);
                    };
                };
            };

            //return foundItems;
            if (foundItems.length == 0) { return "nothing new"; };
            var items = self.prepareItemList(foundItems);
            var resultString = "";
            for(var i = 0; i < items.length; i++) {
                resultString += tools.listSeparator(i, items.length);
                resultString += items[i].description;
            };
            return resultString;
        };

        self.showHiddenObjects = function(position, location) {
            var foundItems = [];
            for(var i = 0; i < _items.length; i++) {
                if (_items[i].isHidden() && _items[i].getType() != "scenery") {
                    if (!position || (_items[i].getPosition() == position)) {
                        _items[i].show();
                        foundItems.push(_items[i]);
                    };
                };
            };

            //return foundItems;
            if (foundItems.length == 0) { return "nothing new"; };
            var items = self.prepareItemList(foundItems);
            var resultString = "";
            for (var i = 0; i < items.length; i++) {
                resultString += tools.listSeparator(i, items.length);
                resultString += items[i].description;
            };
            return resultString;
        };

        self.getHiddenObjects = function(position, location) {
            var foundItems = [];
            for(var i = 0; i < _items.length; i++) {
                if (_items[i].isHidden()) {
                    if (!position || (_items[i].getPosition() == position)) {
                        _items[i].show();
                        foundItems.push(_items[i]);
                    };
                };
            };

            return foundItems;
        };

        self.listObjects = function(minSize) {
            var resultString = ""
            var allItems = self.getAllObjects();
            var items = self.prepareItemList(allItems, minSize);
            for(var i = 0; i < items.length; i++) {
                    resultString += tools.listSeparator(i, items.length);
                    resultString+=items[i].description;
            };
            return resultString;
        };
        
        self.countNamedObject = function (objectName) {
            var allItems = self.getAllObjects();
            var count = 0;
            for (var i = 0; i < allItems.length; i++) {
                if (allItems[i].getName() == objectName) {
                    count++;
                };
            };
            return count;
        };
        
        self.quantifyNamedObject = function (objectName) {
            var allItems = self.getAllObjects();
            var count = 0;
            for (var i = 0; i < allItems.length; i++) {
                if (allItems[i].getName() == objectName) {
                    if (allItems[i].getType() != "creature") {
                        if (allItems[i].isPlural()) {
                            return "some";
                        };
                    };
                    count++;
                };
            };
            var returnString = "some";
            switch (count) {
                case 1:
                    return "one";
                    break;
                case 2:
                    return "a couple";
                    break;
                case 3:
                    return "a few";
                    break
                default:
                    return "plenty";
            };
            return returnString;            
        };

        self.getRandomObject = function() {
            var items = self.getAllObjects();
            var randomIndex = Math.floor(Math.random() * items.length);
            var randomSuccess = Math.floor(Math.random() * 2);
            if (randomSuccess == 0) {
                return self.getObject(items[randomIndex].getName());
            };
            return null;
        };
        
        //internal function (used twice in getObject)
        var getMatchedItemForGetObject = function (item, anObjectName, ignoreSynonyms, customAction, ignoreScenery) {
            var foundItem = false;
            //name/syn match
            if (ignoreSynonyms && (item.getName() == anObjectName)) {
                foundItem = true;
            } else if (!ignoreSynonyms && item.syn(anObjectName)) {
                foundItem = true;
            };
            
            if (ignoreScenery && (!foundItem)) {
                if (item.getType() == "scenery" || item.getSubType() == "intangible") {
                    if (customAction != "hunt" && customAction != "follow" && customAction != "find") {
                        foundItem = false;
                    };
                };
            };
            
            if (foundItem) {
                if (customAction) {
                    //we have a name match, do we have an action match?
                    if (item.checkCustomAction(customAction)) {
                        return item;
                    };
                } else {
                    //important - only return if not checking custom action.
                    //we found the item.
                    return item;
                };
                
                //we didn't find what we're looking for yet.
                return false; //different return type!
            };
        };
        
        self.objectIsDirectlyAccessible = function (anObjectName) {
            //checks that an object is directly accessible from *this* inventory.
            //e.g. not inside something else
            //work backwards from most recently added item
            for (var index = _items.length - 1; index >= 0; index--) {
                if (_items[index].getName() == anObjectName) {
                    return true;
                };
            };
            return false;           
        };

        //recursively gets objects in other objects
        //this will also get hidden objects (assume if player knows object name that they're shortcutting search.
        self.getObject = function (anObjectName, ignoreSynonyms, searchCreatures, customAction, ignoreScenery) {
            //work backwards from most recently added item
            for (var index = _items.length - 1; index >= 0; index--) {
                var matchedItem = getMatchedItemForGetObject(_items[index], anObjectName, ignoreSynonyms, customAction, ignoreScenery);
                if (matchedItem) {
                    return matchedItem;
                };
                
                //we use this multiple times - minor optimisation.
                var itemType = _items[index].getType();

                ////
                if (itemType != 'creature') {
                    //just retrieve positioned objects from artefacts
                    //doesn't retrieve items hidden by creatures
                    //this section doesn't check custom actions at the moment - pretty sure that's a bug.
                    //include hidden "positioned" items here as we've explicitly names what we're after and it might be scenery
                    //possibly a bit wrong though.
                    var objects = _items[index].getInventoryObject().getPositionedObjects(false, 0, true); 
                    //work backwards again
                    for (var o = objects.length-1; o >= 0; o--) {
                        matchedItem = getMatchedItemForGetObject(objects[o], anObjectName, ignoreSynonyms, customAction, ignoreScenery);
                        if (matchedItem) {
                            return matchedItem;
                        };

                    };
                };
               
                ////                
                if (itemType == 'creature' && !searchCreatures) {
                    //if we won't search creatures
                    continue;
                };

                if (itemType != 'creature' &&_items[index].isLocked() ) {
                    //if we've got this far we can't look in locked artefacts
                    continue;
                };
                
                ////
                //search creatures and unlocked artefacts...
                //only confirm items from open, unlocked containers or things that don't open - this way we know the player has discovered them
                //@bug ? @todo -@see issue#356 positioned items will only be revealed to "locked" and "open" objects - this seems odd.
                if (_items[index].isOpen()) { //if it doesn't open, we may still want to retrieve nested scenery items.
                    //console.debug(_items[index].getDisplayName()+" open? "+_items[index].isOpen());
                    var itemInventory = _items[index].getInventoryObject();
                    var heldObject = itemInventory.getObject(anObjectName, ignoreSynonyms, searchCreatures, customAction, ignoreScenery);
                    if (heldObject) {                        
                        return heldObject;
                    };                     
                };
                
                //we're searching creatures - check creature sales inventory
                if (itemType == 'creature') {
                    var salesInventory = _items[index].getSalesInventoryObject();
                    if (salesInventory) {
                        var salesObject = salesInventory.getObject(anObjectName, ignoreSynonyms, searchCreatures, customAction, ignoreScenery);
                        if (salesObject) {
                            return salesObject;
                        };
                    };
                };

           };
           return null;
        };

        //this one doesn't cascade to contents of other objects.
        self.getObjectByType = function(anObjectType) {
            for(var index = _items.length-1; index >= 0; index--) {
                if(_items[index].getType() == anObjectType  && (!(_items[index].isHidden()))) {
                    //console.debug(anObjectType+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                    return _items[index];
                };
           };
        };

        //this one doesn't cascade to contents of other objects.
        self.getObjectBySubType = function(anObjectSubType, returnOnlyWorkingItems) {         
           for(var index = _items.length-1; index >= 0; index--) {
                if (_items[index].getSubType() == anObjectSubType) {
                    if (_items[index].isHidden()) { continue; };
                    if (returnOnlyWorkingItems) {
                        if (_items[index].isBroken()) { continue; };
                        if (_items[index].isDestroyed()) { continue; };
                        if (_items[index].chargesRemaining() == 0) { continue; };
                        if (!_items[index].checkComponents()) { continue; };
                    };
                    //console.debug(anObjectType+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                    return _items[index];
                };
           };
           return null;
        };

        //this one doesn't cascade to contents of other objects.
        self.getObjectByPosition = function(aPosition, showHiddenItems) {
           for(var index = _items.length-1; index >= 0; index--) {
                if(_items[index].getPosition() == aPosition  && ((!(_items[index].isHidden()))||showHiddenItems)) {
                    return _items[index];
                };
           };
           return null;
        };

        //returns "intact" components only!
        self.getComponents = function(anObjectName, includeDischargedItems) {
            var returnObjects = [];
            for(var index = 0; index < _items.length; index++) {
                if(_items[index].isComponentOf(anObjectName)) {
                    if((_items[index].chargesRemaining() > 0 || _items[index].chargesRemaining() < 0 || includeDischargedItems) && (!(_items[index].isBroken()) && !(_items[index].isDestroyed()))) {
                        //console.debug("Component for "+anObjectName+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                        returnObjects.push(_items[index]);
                    };// else {console.debug("Discharged component for "+anObjectName+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);};                     
                };

                if(_items[index].getType() != 'creature' && (!(_items[index].isLocked()))) {
                    if (_items[index].isOpen()) {
                        //only confirm item from open, unlocked containers - this way we know the player has discovered them
                        var containerObjects = _items[index].getComponents(anObjectName);
                        if (containerObjects.length > 0) {
                            returnObjects = returnObjects.concat(containerObjects);
                        };
                    };
                };
            };
            return returnObjects;
        };

        self.getAllObjects = function(includeHiddenObjects, includeScenery) {
            if (includeHiddenObjects) { return _items;}; //caution - this returns the original array
            var itemsToReturn = [];
            for (var i=0;i<_items.length;i++) {
                if ((_items[i].getType() == "scenery" && includeScenery) || (!(_items[i].isHidden()) && !(_items[i].getPosition()))) {
                    itemsToReturn.push(_items[i])
                };
            };
            return itemsToReturn;
        };

        self.hasPositionedObjects = function() {
            for (var index = _items.length-1; index >= 0; index--) {
                if (_items[index].getPosition()) {return true;};
            };
            return false;
        };

        self.hasLiquid = function(liquidName) {
            for (var index = _items.length-1; index >= 0; index--) {
                if (_items[index].hasLiquid(liquidName)) {return true;};
            };
            return false;
        };

        self.getPositionedObjects = function(showHiddenObjects, minSize, includeScenery) {
            var itemsToReturn = [];
            if (minSize == undefined) {
                minSize = -999;
            };
            for (var i=0;i<_items.length;i++) {
                if (_items[i].getWeight() >= minSize) {
                    if (((!_items[i].isHidden()) || showHiddenObjects ||(_items[i].getType() == "scenery" && includeScenery)) && (_items[i].getPosition())) {
                        itemsToReturn.push(_items[i])
                    };
                };
            };
            return itemsToReturn;
        };

        self.getAllObjectsAndChildren = function(includeInaccessible) {
            var objects = _items;
            for (var i=0;i<_items.length;i++) {
                //only return accessible children.
                if ((_items[i].getType() != 'creature' && (!(_items[i].isLocked()))  && (!(_items[i].isHidden()))) || includeInaccessible == true) {
                    if (_items[i].isOpen()|| includeInaccessible == true) {
                        var itemInventory = _items[i].getInventoryObject();
                        if (itemInventory.size(includeInaccessible)>0) {
                            objects = objects.concat(itemInventory.getAllObjectsAndChildren(includeInaccessible));
                        };
                    };
                };
            };
            return objects;
        };

        //cascades to child objects
        self.getAllObjectsOfType = function(anObjectType) {
            var returnObjects = [];
            for(var index = 0; index < _items.length; index++) {
                if((_items[index].getType() == anObjectType || _items[index].getSubType() == anObjectType) && (!(_items[index].isHidden()))) {
                    //console.debug(anObjectType+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                    returnObjects.push(_items[index]);
                } else {
                    //accessible children.
                    if(_items[index].getType() != 'creature' && (!(_items[index].isLocked()))) {
                        if (_items[index].isOpen()) {
                            var itemInventory = _items[index].getInventoryObject();
                            if (itemInventory.size()>0) {
                                returnObjects = returnObjects.concat(itemInventory.getAllObjectsOfType(anObjectType));
                            };
                        };
                    }; 
                };
           };
           return returnObjects;
        };
        
        //cascades to child objects
        self.getAllObjectsWithSyn = function (aSynonym) {
            var returnObjects = [];
            for (var index = 0; index < _items.length; index++) {
                if (_items[index].syn(aSynonym) && (!(_items[index].isHidden()))) {
                    //console.debug(aSynonym+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                    returnObjects.push(_items[index]);
                } else {
                    //accessible children.
                    if (_items[index].getType() != 'creature' && (!(_items[index].isLocked()))) {
                        if (_items[index].isOpen()) {
                            var itemInventory = _items[index].getInventoryObject();
                            if (itemInventory.size() > 0) {
                                returnObjects = returnObjects.concat(itemInventory.getAllObjectsWithSyn(aSynonym));
                            };
                        };
                    };
                };
            };
            return returnObjects;
        };

        self.checkWritingOrDrawing = function(content) {
            for (var index = 0; index < _items.length; index++) {
                if (_items[index].hasWritingOrDrawing(content) && ((!(_items[index].isHidden())) || _items[index].getType() == "scenery")) {
                    return true;
                } else {
                    //accessible children.
                    if (_items[index].getType() != 'creature' && (!(_items[index].isLocked()))) {
                        if (_items[index].isOpen()) {
                            var itemInventory = _items[index].getInventoryObject();
                            if (itemInventory.size() > 0) {
                                var result = itemInventory.checkWritingOrDrawing(content);
                                if (result == true) {return true;};
                            };
                        };
                    };
                };
            };

            return false;
        };
        

        self.getAllObjectsWithViewLocation = function() {
           var returnObjects = [];
           for(var index = 0; index < _items.length; index++) {
                if(_items[index].getViewLocation()  && ((!(_items[index].isHidden())) || _items[index].getType() == "scenery")) {
                    //console.debug(anObjectType+" found: "+_items[index].getName()+" in "+_ownerName+" inventory. Index: "+index);
                    returnObjects.push(_items[index]);
                } else {
                    //accessible children.
                    if(_items[index].getType() != 'creature' && (!(_items[index].isLocked()))) {
                        if (_items[index].isOpen()) {
                            var itemInventory = _items[index].getInventoryObject();
                            if (itemInventory.size()>0) {
                                returnObjects = returnObjects.concat(itemInventory.getAllObjectsWithViewLocation());
                            };
                        };
                    }; 
                };
           };
           return returnObjects;
        };
        
        self.getOwnerFor = function (anObjectName) {
            for (var index = _items.length - 1; index >= 0; index--) {
                if (_items[index].getType() == "creature") {
                    continue;
                };
                if (_items[index].contains(anObjectName)) {
                    //check it's not nested futher.
                    var nestedInventory = _items[index].getInventoryObject();
                    var owner = nestedInventory.getOwnerFor(anObjectName);
                    if (owner) { return owner };
                    return _items[index];
                };
            };
            return null;
        };

        self.getSuitableContainer = function(anObject) {
            //if required container, get suitable container 
            //find all player containers *or* get specific required container
            //loop thru all containers
            //check canContain
            //if any one is true, add it, if not fail
            var requiresContainer = anObject.requiresContainer();
            var requiredContainer = anObject.getRequiredContainer();
            var suitableContainer;
            if (requiredContainer) {
                suitableContainer = self.getObject(requiredContainer);
                if (!(suitableContainer)) {
                    return null;
                };
                //check suitable container can carry item
                if (!(suitableContainer.canCarry(anObject))) {
                    if (!anObject.willDivide()) {
                        return null;
                    };
                    
                    //try one more time with smaller portion size                  
                    var anObjectPiece = anObject.split(1, false);
                    
                    if (!(suitableContainer.canCarry(anObjectPiece))) {
                        return null;
                    };
                };
                //it fits
                return suitableContainer;
            };
            
            if (requiresContainer) {
                //find all containers 
                var possibleContainers = self.getAllObjectsOfType("container");
                //work backwards from most recently added
                for (var index = possibleContainers.length - 1; index >= 0; index--) {
                    //loop thru all containers
                    //check canContain
                    //if any one is true, add it, if not fail
                    if(possibleContainers[index].canCarry(anObject)) {
                        //console.debug("suitable container found: "+possibleContainers[index].getDisplayName()+" in "+_ownerName+" inventory. Index: "+index);
                        return possibleContainers[index];
                    };
                };

                //we only get this far if we don't have anything that'll take the whole quantity
                if (!anObject.willDivide()) {
                    return null;
                };

                //try one more time with smaller portion size                  
                var anObjectPiece = anObject.split(1, false);
                    
                for (var index = possibleContainers.length - 1; index >= 0; index--) {
                    if (possibleContainers[index].canCarry(anObjectPiece)) {
                        return possibleContainers[index];
                    };
                };
            };
            //probably null at this point
            return suitableContainer;
        };

        self.tick = function(owner) {
            //iterate through each object and tick for each
            var resultString = "";
            for (var i=0;i<_items.length;i++) {
                if (_items[i].getType() != "creature") {
                    resultString += _items[i].tick(owner);
                };
            };
            if (resultString.length >0) {resultString = "<br>"+resultString;};
            return resultString;
        };

        ////end public methods
    }
    catch(err) {
	    console.error('Unable to create Inventory object: '+err);
        throw err;
    };	
};