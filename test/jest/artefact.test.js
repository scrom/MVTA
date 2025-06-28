"use strict";
const artefact = require('../../server/js/artefact.js');
const player = require('../../server/js/player.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');

let a0;
let attributes = null;
const aName = 'name';
const aDesc = 'description';
const aDetailedDesc = 'detailed description';

describe('Artefact Tests', () => {
    beforeEach(() => {
        a0 = new artefact.Artefact(aName, aDesc, aDetailedDesc, attributes);
    });

    afterEach(() => {
        a0 = null;
        attributes = null;
    });

    test('canCreateArtefactObject', () => {
        const expectedResult = '{"object":"artefact","name":"name","description":"description","detailedDescription":"detailed description","attributes":{}}';
        const actualResult = a0.toString();
        expect(actualResult).toBe(expectedResult);
    });

    test('canAddSynonymsToArtefactAndMatchOneOfThem', () => {
        const expectedResult = true;
        a0.addSyns(["hello", "unique", "synosyn"]);
        const actualResult = a0.syn("unique");
        expect(actualResult).toBe(expectedResult);
    });

    test('canMatchTwoSameObjects', () => {
        const drinkAttributes = { initialDescription: "desc!", weight: 1, carryWeight: 1, attackStrength: 5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const moreCoffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        coffee.addSyns(["brew", "char", "cuppa"]);
        moreCoffee.addSyns(["brew", "char", "cuppa"]);
        const expectedResult = true;
        const actualResult = coffee.matches(moreCoffee);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotMatchTwoSameObjectsWithDifferingSyns', () => {
        const drinkAttributes = { initialDescription: "desc!", weight: 1, carryWeight: 1, attackStrength: 5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const moreCoffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        coffee.addSyns(["brew", "char", "cuppa"]);
        moreCoffee.addSyns(["brew", "cuppa", "char"]);
        const expectedResult = false;
        const actualResult = coffee.matches(moreCoffee);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotMatchTwoSlightlyDifferentObjects', () => {
        const drinkAttributes = { initialDescription: "desc!", weight: 1, carryWeight: 1, attackStrength: 5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const moreDrinkAttributes = { weight: 1, carryWeight: 1, initialDescription: "desc!", attackStrength: 5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup', nutrition: 25 };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const moreCoffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", moreDrinkAttributes, null);
        coffee.addSyns(["brew", "char", "cuppa"]);
        moreCoffee.addSyns(["brew", "char", "cuppa"]);
        const expectedResult = false;
        const actualResult = coffee.matches(moreCoffee);
        expect(actualResult).toBe(expectedResult);
    });

    test('canRetrieveACurrentAttribute', () => {
        const expectedResult = false;
        const actualResult = a0.getCurrentAttributes().read;
        expect(actualResult).toBe(expectedResult);
    });

    test('canSetTypeAttributeAfterConstruction', () => {
        const expectedResult = 'treasure';
        const newAttribute = {type: "treasure"};
        a0.setAttributes(newAttribute);
        const actualResult = a0.getType();
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotOverwriteTypeWithInvalidValueAfterConstruction', () => {
        const expectedResult = 'junk';
        const newAttribute = {type: "invalid"};
        a0.setAttributes(newAttribute);
        const actualResult = a0.getType();
        expect(actualResult).toBe(expectedResult);
    });

    test('canSetPluralAttributeAndRetrieveCorrectDescription', () => {
        const sugarAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, plural: true, isPowder: true};
        const sugar = new artefact.Artefact("sugar", "sugar", "sweet and sugary", sugarAttributes);
        const expectedResult = "some sugar";
        const actualResult = sugar.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canDamageAnItemAndRetrieveCorrectDescription', () => {
        const woodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: true, plural: true, isPowder: true};
        const wood = new artefact.Artefact("wood", "wood", "sharp and woody", woodAttributes);
        wood.bash();
        const expectedResult = "some wood";
        const actualResult = wood.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canBreakAnItemAndRetrieveCorrectDescription', () => {
        const woodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: true, plural: true, isPowder: true};
        const wood = new artefact.Artefact("wood", "wood", "sharp and woody", woodAttributes);
        wood.break();
        const expectedResult = "some broken wood";
        const actualResult = wood.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canChewAnItemAndRetrieveCorrectDescription', () => {
        const woodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: true, plural: true, isPowder: true};
        const wood = new artefact.Artefact("wood", "wood", "sharp and woody", woodAttributes);
        const p0 = new player.Player({carryWeight:25},null,null);
        const _inventory = p0.getInventoryObject();
        _inventory.add(wood);
        wood.eat("eat", p0);
        const expectedResult = "some chewed wood";
        const actualResult = wood.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canDestroyAnItemAndRetrieveCorrectDescription', () => {
        const woodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "junk", canCollect: false, canOpen: false, isEdible: false, isBreakable: true, plural: true, isPowder: true};
        const wood = new artefact.Artefact("wood", "wood", "sharp and woody", woodAttributes);
        wood.destroy();
        const expectedResult = "some wreckage that was once some wood";
        const actualResult = wood.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canDestroyAPreviouslyBrokenItemAndStillRetrieveCorrectDescription', () => {
        const woodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "junk", canCollect: false, canOpen: false, isEdible: false, isBreakable: true, plural: true, isPowder: true};
        const wood = new artefact.Artefact("wood", "wood", "sharp and woody", woodAttributes);
        wood.break();
        wood.destroy();
        const expectedResult = "some wreckage that was once some wood";
        const actualResult = wood.getDescription();
        expect(actualResult).toBe(expectedResult);
    });

    test('canUnlockDoor', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: true, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "door"
        };
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const key = new artefact.Artefact('key','door key',"it unlocks doors", keyAttributes, null);
        const expectedResult = "You unlock the door.";
        const actualResult = door.unlock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotUnlockDoorWithWrongKey', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: true, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "something"
        };
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const key = new artefact.Artefact('key','door key',"it unlocks doors", keyAttributes, null);
        const expectedResult = "You need something else to unlock it.";
        const actualResult = door.unlock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('canLockDoor', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: false, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "door"
        };
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const key = new artefact.Artefact('key','door key',"it unlocks doors", keyAttributes, null);
        const expectedResult = "You lock the door.";
        const actualResult = door.lock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('canLockAndCloseOpenDoor', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true,
            isOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: false, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "door"
        };
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const key = new artefact.Artefact('key','door key',"it unlocks doors", keyAttributes, null);
        const expectedResult = "You close and lock the door. ";
        const actualResult = door.lock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotLockDoorWithWrongKey', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: false, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "something"
        };
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const key = new artefact.Artefact('key','door key',"it unlocks doors", keyAttributes, null);
        const expectedResult = "You need something else to lock it.";
        const actualResult = door.lock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotLockDoorWithoutKey', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: false, 
            defaultAction: "open"};
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const expectedResult = "You don't have a key that fits.";
        const actualResult = door.lock();
        expect(actualResult).toBe(expectedResult);
    });

    test('canUnlockEmptyContainer', () => {
        const containerAttributes = {
            weight: 50, 
            type: "container", 
            canOpen: true, 
            carryWeight: 25,
            isBreakable: true, 
            lockable: true, 
            locked: true, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "container"
        };
        const container = new artefact.Artefact('container', 'container', "locky container",containerAttributes, null);
        const key = new artefact.Artefact('key','container key',"it unlocks container", keyAttributes, null);
        const expectedResult = "You unlock the container. It's empty.";
        const actualResult = container.unlock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('canUnlockContainerWithContents', () => {
        const containerAttributes = {
            weight: 50, 
            type: "container", 
            canOpen: true, 
            carryWeight: 25,
            isBreakable: true, 
            lockable: true, 
            locked: true, 
            defaultAction: "open"};
        const keyAttributes =  {
            weight: 0.1,
            type: "key",
            canCollect: true,
            unlocks: "container"
        };
        const junkAttributes = {
            weight: 10, 
            type: "junk",
            plural: "true", 
            canOpen: false, 
            isBreakable: true
        };
        const container = new artefact.Artefact('container', 'container', "locky container",containerAttributes, null);
        const containerInventory = container.getInventoryObject();
        const junk = new artefact.Artefact('junk','junk',"lots of junk", junkAttributes, null);
        const key = new artefact.Artefact('key','container key',"it unlocks container", keyAttributes, null);
        containerInventory.add(junk);
        const expectedResult = "You unlock the container. It contains some junk.";
        const actualResult = container.unlock(key);
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotUnlockDoorWithoutKey', () => {
        const doorAttributes = {
            weight: 200, 
            type: "door", 
            canOpen: true, 
            isBreakable: true, 
            lockable: true, 
            locked: true, 
            defaultAction: "open"};
        const door = new artefact.Artefact('door', 'door', "locky door",doorAttributes, null);
        const expectedResult = "You need something to unlock it with.";
        const actualResult = door.unlock();
        expect(actualResult).toBe(expectedResult);
    });

    test('canCreateToxicFood', () => {
        const poisonAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, nutrition: -50, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
        const poison = new artefact.Artefact('poison', 'poison', "eek, don't eat it!",poisonAttributes, null);
        const attribs = poison.getCurrentAttributes();
        const expectedResult = -50;
        const actualResult = attribs.nutrition;
        expect(actualResult).toBe(expectedResult);
    });

    test('readABoringBookGivesRelevantMessage', () => {
        const bookAttributes = {weight: 1, type: "book", canCollect: true, "defaultAction": "read", "price": 15,"canDrawOn": true};
        const comic = new artefact.Artefact('comic', 'book with charred pages', "It looks like the tattered and charred remnants of a very rare comic book.<br>It could be a clue.",bookAttributes, null);
        const p0 = new player.Player({carryWeight:25},null,null);
        const inv = p0.getInventoryObject();
        inv.add(comic);
        const expectedResult = "You read the book with charred pages.<br>It's mildly interesting but you learn nothing new.";
        const actualResult = p0.read("read", "comic");
        expect(actualResult).toBe(expectedResult);
    });

    test('readABookWithContentButNoMissionsReturnsContent', () => {
        const bookAttributes = {weight: 1, type: "book", canCollect: true, "defaultAction": "read", "price": 15,"canDrawOn": true,"defaultResult": "Normal person has bad experience, becomes superhero. Rich person has bereavment, becomes evil genuis nemesis.<br>The usual.<br>Even in its current state, this one looks rare so it could be worth something."};
        const comic = new artefact.Artefact('comic', 'book with charred pages', "It looks like the tattered and charred remnants of a very rare comic book.<br>It could be a clue.",bookAttributes, null);
        const p0 = new player.Player({carryWeight:25},null,null);
        const inv = p0.getInventoryObject();
        inv.add(comic);
        const expectedResult = "You read the book with charred pages.<br>Normal person has bad experience, becomes superhero. Rich person has bereavment, becomes evil genuis nemesis.<br>The usual.<br>Even in its current state, this one looks rare so it could be worth something.$result$";
        const actualResult = p0.read("read", "comic");
        expect(actualResult).toBe(expectedResult);
    });

    test('canSwitchOnPoweredItem', () => {
        const torch = mb.buildArtefact({ "file": "torch" });
        const expectedResult = "You turn the emergency torch on.";
        const actualResult = torch.switchOnOrOff("turn", "on");
        expect(actualResult).toBe(expectedResult);
    });

    test('canSwitchOnFlammableItem', () => {
        const candle = mb.buildArtefact({ "file": "candle" });
        const lighter = mb.buildArtefact({ "file": "lighter" });
        const expectedResult = "You light the candle";
        const actualResult = candle.switchOnOrOff("light", "", lighter);
        expect(actualResult).toBe(expectedResult);
    });

    test('flammableItemWillBurnOut', () => {
        const candle = mb.buildArtefact({ "file": "candle" });
        const lighter = mb.buildArtefact({ "file": "lighter" });
        candle.switchOnOrOff("light", "", lighter);
        const expectedResult = "A nearby candle has burned out.<br>";
        let actualResult;
        let loopcount = 0;
        while (!(actualResult) && loopcount < 151) {
            actualResult = candle.tick();
            loopcount++;
        }
        expect(actualResult).toBe(expectedResult);
    });

    test('poweredItemWillConsumePower', () => {
        const torch = mb.buildArtefact({ "file": "torch" });
        const initialCharge = torch.consumeComponents(0);
        torch.switchOnOrOff("light", "");
        const expectedResult = "3.2";
        let loopcount = 0;
        let actualResult;
        while (!(actualResult) && loopcount < 15) {
            torch.tick();
            loopcount++;
        }
        actualResult = initialCharge - torch.consumeComponents(0);
        expect(actualResult.toString()).toBe(expectedResult);
    });

    
    test('Using an item with a bad default/action does not cause an infinite loop', () => {
        const testmb = new mapBuilder.MapBuilder('../../test/testdata/');
        let m = mb.buildMap();
        const bad = testmb.buildArtefact({ "file": "bad-artefact" });
        const p0 = new player.Player({username: "player", carryWeight:25},m,testmb);
        loc = m.getLocation('atrium');
        p0.setLocation(loc);
        const createEngine = require('../../server/js/engine.js');
        engine = createEngine(p0, m);

        const inv = p0.getInventoryObject();
        inv.add(bad);

        const expectedResult = "Default Action and Result are both *USE* - we shouldn't ever have this but need to handle bad data";
        const actualResult = engine("use bad"); // this is the main action call when a player performs an action
        const actualResultObject = actualResult;
        expect(actualResultObject.description).toBe(expectedResult);
    });

    test('Can "Use" an item with a default action/result', () => {
        const testmb = new mapBuilder.MapBuilder('../../test/testdata/');
        let m = mb.buildMap();
        const lighter = testmb.buildArtefact({ "file": "lighter" });
        const p0 = new player.Player({username: "player", carryWeight:25},m,testmb);
        loc = m.getLocation('atrium');
        p0.setLocation(loc);

        const createEngine = require('../../server/js/engine.js');
        engine = createEngine(p0, m);

        const inv = p0.getInventoryObject();
        inv.add(lighter);

        const expectedResult = "You strike the flint a few times and see a small flicker of flame. It gutters out quickly.<br>You'd best only use it to light things when you really need to as you can't see an obvious way to refill it when it's empty.<br>";
        const actualResult = engine("use lighter"); // this is the main action call when a player performs an action
        const actualResultObject = actualResult;
        expect(actualResultObject.description).toBe(expectedResult);
    });
});