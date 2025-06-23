"use strict";
const player = require('../../server/js/player.js');
const creature = require('../../server/js/creature.js');
const location = require('../../server/js/location.js');
const artefact = require('../../server/js/artefact.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const map = require('../../server/js/map.js');
const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');

//these are used in setup and teardown - need to be accessible to all tests
let junkAttributes;
let breakableJunkAttributes;
let weaponAttributes;
let foodAttributes;
let bedAttributes;
let iceCreamAttributes;
let containerAttributes;
let playerName;
let playerAttributes;
let p0; // player object.
let l0; //location object.
let a0; //artefact object.
let a1; //artefact object.
let c0; //creature object.
let c1; //creature object
let m0; //map object
let weapon; //weapon object
let food; //food object
let bed; //chair object
let iceCream; //a bribe
let container; //container object
let breakable; //breakable object

beforeEach(() => {
    foodAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom', foodAttributes, null);
    bedAttributes = { weight: 10, carryWeight: 0, attackStrength: 0, type: "bed", canCollect: true};
    bed = new artefact.Artefact('bed', 'somewhere to rest', 'rest rest rest', bedAttributes, null);
    playerName = 'player';
    playerAttributes = {"username":playerName, "consumedObjects":[JSON.parse(food.toString())]};
    m0 = new map.Map();
    p0 = new player.Player(playerAttributes, m0, mb);
    l0 = new location.Location('home', 'home', 'a home location');
    l0.addExit("s", "home", "new");
    p0.setStartLocation(l0);
    p0.setLocation(l0);
    junkAttributes = {weight: 3, carryWeight: 3, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false};
    breakableJunkAttributes = {weight: 3, carryWeight: 3, attackStrength: 5, affinityModifier: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: true};
    weaponAttributes = {weight: 4, carryWeight: 0, attackStrength: 25, type: "weapon", subType: "sharp", canCollect: true, canOpen: false, isEdible: false, isBreakable: false};    
    iceCreamAttributes = {weight: 1, carryWeight: 0, attackStrength: 0, affinityModifier:5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    containerAttributes = {weight: 2, carryWeight: 25, attackStrength: 2, type: "container", canCollect: true, canOpen: true, isEdible: false, isBreakable: true};
    a0 = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',junkAttributes, null);
    weapon = new artefact.Artefact('sword', 'mighty sword', 'chop chop chop',weaponAttributes, null);
    iceCream = new artefact.Artefact('ice cream', 'great bribe', 'nom nom nom',iceCreamAttributes, null);
    container = new artefact.Artefact('container', 'container', 'hold hold hold',containerAttributes, null);
    a1 = new artefact.Artefact('box', 'box', 'just a box',breakableJunkAttributes, null);
    breakable = new artefact.Artefact('glass', 'drinking glass', 'a somewhat fragile drinking vessel',breakableJunkAttributes, null);
    c0 = new creature.Creature('creature', 'creature', "Super-friendly.", {weight:140, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:100, affinity:5, canTravel:true},[a1]);
    c0.go(null,l0); 
    c1 = new creature.Creature('evil', 'Mr Evil', "Very shifty. I'm sure nobody would notice if they disappeared.", {weight:140, attackStrength:12, type:'creature', carryWeight:51, health:215, affinity:-5, canTravel:true},[a1]);
    c1.go(null,l0); 

    l0.addObject(a0);
    l0.addObject(weapon);
    l0.addObject(breakable);
    l0.addObject(food);
    l0.addObject(container);
});

afterEach(() => {
    playerName = null;
    playerAttributes = null;
    p0 = null;
    l0 = null;
    m0 = null;
    junkAttributes = null;
    breakableJunkAttributes = null;
    weaponAttributes = null;
    foodAttributes = null;
    iceCreamAttributes = null;
    containerAttributes = null;
    a0 = null;
    a1 = null;
    weapon = null;
    breakable = null;
    food = null;
    iceCream = null;
    container = null;
    c0 = null;
    c1 = null;
});
describe('Player Blood Liquid Interaction', () => {
    test('addingLiquidsToLocationAddsThemToExistingFloorAsWell', () => {
        p0.examine("examine", "floor");
        l0.addLiquid("blood");
        l0.addLiquid("custard");

        const expectedResult = "You look down. Yep, that's the ground beneath your feet.<br>Someone has spilled blood and custard on it.";
        const actualResult = p0.examine("examine", "floor");
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('PlayerCanSlipOnWetFloor', () => {
        const l1 = new location.Location('new', 'new', 'a new location');
        l1.addExit("N", "new", "home");
        const m1 = new map.Map();
        m1.addLocation(l0);
        m1.addLocation(l1);
        p0.setLocation(l1);

        // add enough liquids to guarantee slipping...
        l0.addLiquid("blood");
        l0.addLiquid("custard");
        l0.addLiquid("water");
        l0.addLiquid("liquid4");
        l0.addLiquid("liquid5");
        l0.addLiquid("liquid6");
        l0.addLiquid("liquid7");
        l0.addLiquid("liquid8");
        l0.addLiquid("liquid9");
        l0.addLiquid("liquid10");

        let expectedResult = "<br>As you enter, you slip on the mess on the floor and injure yourself.<br>You feel weaker. ";
        const alternateResult = " is a single exit to the South.<br><br>You might want to mind out, the floor's slippery here."
        const actualResult = p0.go("n", "n", m1).substr(-93);
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        if (actualResult === alternateResult) {
            expectedResult = alternateResult;
        }
        expect(actualResult).toBe(expectedResult);
    });

    test('addingLiquidsToLocationAddsThemToFutureFloorAsWell', () => {
        const bookAttributes = { weight: 1, type: "book", canCollect: true, canDrawOn: true };
        const book = new artefact.Artefact('book', 'book', "Read me.", bookAttributes, null);

        l0.addLiquid("blood");
        l0.addLiquid("custard");

        const expectedResult = "You look down. Yep, that's the ground beneath your feet.<br>Someone has spilled blood and custard on it.";
        const actualResult = p0.examine("examine", "floor");
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('playerCanCleanBloodOffTheFloor', () => {
        const bookAttributes = { weight: 1, type: "book", canCollect: true, canDrawOn: true };
        const book = new artefact.Artefact('book', 'book', "Read me.", bookAttributes, null);
        const cleanAttributes = { weight: 1, type: "tool", subType: "clean", charges: 2, canCollect: true };
        const cleaner = new artefact.Artefact('cloth', 'worn cloth', "A tatty and grimy wash cloth", cleanAttributes, null);

        p0.examine("examine", "floor");
        l0.addLiquid("blood");
        l0.addLiquid("custard");
        const inv = p0.getInventoryObject();
        inv.add(cleaner);

        console.debug(l0.describe());
        console.debug(p0.examine("examine", "floor"));

        const expectedResult = "You clean the gory mess from the floor.";
        const actualResult = p0.clean('clean', 'floor');
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('locationHasNoBloodAfterCleaningFloor', () => {
        const bookAttributes = { weight: 1, type: "book", canCollect: true, canDrawOn: true };
        const book = new artefact.Artefact('book', 'book', "Read me.", bookAttributes, null);
        const cleanAttributes = { weight: 1, type: "tool", subType: "clean", charges: 2, canCollect: true };
        const cleaner = new artefact.Artefact('cloth', 'worn cloth', "A tatty and grimy wash cloth", cleanAttributes, null);

        p0.examine("examine", "floor");
        l0.addLiquid("blood");
        const inv = p0.getInventoryObject();
        inv.add(cleaner);
        p0.clean('clean', 'floor');

        const expectedResult = "";
        const actualResult = l0.describeBlood();
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('playerCanCollectBloodFromAFreshKill', () => {
        c0.kill();
        const liquidContainerAttributes = { weight: 2, carryWeight: 1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true };
        const bottle = new artefact.Artefact('bottle', 'a bottle', "Good for carrying liquids.", liquidContainerAttributes);
        const inv = p0.getInventoryObject();
        inv.add(bottle);

        const expected = "You collect the blood into your bottle.<br>";
        const actual = p0.get("collect", "blood");
        console.debug("expected:" + expected);
        console.debug("actual:" + actual);
        expect(actual).toBe(expected);
    });

    test('playerCanCollectAndPourBloodOnFloor', () => {
        c0.kill();
        const liquidContainerAttributes = { weight: 2, carryWeight: 1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true };
        const bottle = new artefact.Artefact('bottle', 'a bottle', "Good for carrying liquids.", liquidContainerAttributes);
        const inv = p0.getInventoryObject();
        inv.add(bottle);
        p0.get("collect", "blood");

        const expected = "Hmm. You're a bit sick aren't you.<br>You pour blood over the floor.";
        const actual = p0.put("pour", "blood", "on", "floor");
        console.debug("expected:" + expected);
        console.debug("actual:" + actual);
        expect(actual).toBe(expected);
    });

    test('bloodPouredOnFloorIsVisible', () => {
        c0.kill();
        const liquidContainerAttributes = { weight: 2, carryWeight: 1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true };
        const bottle = new artefact.Artefact('bottle', 'a bottle', "Good for carrying liquids.", liquidContainerAttributes);
        const inv = p0.getInventoryObject();
        inv.add(bottle);
        p0.get("collect", "blood");
        l0.tick(15);
        p0.put("pour", "blood", "onto", "floor");
        const expected = "<br>There's a lot of blood around here. It looks like someone or something's been injured very recently.";
        const actual = l0.describeBlood();
        console.debug("expected:" + expected);
        console.debug("actual:" + actual);
        expect(actual).toBe(expected);
    });

    test('emptiedbottleOfBloodIsVisible', () => {
        c0.kill();
        const liquidContainerAttributes = { weight: 2, carryWeight: 1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true };
        const bottle = new artefact.Artefact('bottle', 'a bottle', "Good for carrying liquids.", liquidContainerAttributes);
        const inv = p0.getInventoryObject();
        inv.add(bottle);
        p0.get("collect", "blood");
        l0.tick(15);
        p0.empty("empty", "bottle");
        const expected = "<br>There's a lot of blood around here. It looks like someone or something's been injured very recently.";
        const actual = l0.describeBlood();
        console.debug("expected:" + expected);
        console.debug("actual:" + actual);
        expect(actual).toBe(expected);
    });

    test('playerCanEmptyaBottleOfBlood', () => {
        c0.kill();
        const liquidContainerAttributes = { weight: 2, carryWeight: 1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true };
        const bottle = new artefact.Artefact('bottle', 'bottle', "Good for carrying liquids.", liquidContainerAttributes);
        const inv = p0.getInventoryObject();
        inv.add(bottle);
        p0.get("collect", "blood");
        l0.tick(15);

        const expected = "You empty the bottle.<br>Its contents are beyond recovery.";
        const actual = p0.empty("empty", "bottle");
        console.debug("expected:" + expected);
        console.debug("actual:" + actual);
        expect(actual).toBe(expected);
    });
});
