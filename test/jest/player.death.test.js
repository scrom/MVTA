"use strict";
const player = require('../../server/js/player.js');
const creature = require('../../server/js/creature.js');
const location = require('../../server/js/location.js');
const artefact = require('../../server/js/artefact.js');
const contagion = require('../../server/js/contagion.js');
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
    weaponAttributes = {weight: 4, carryWeight: 0, attackStrength: 25, type: "weapon",subType: "sharp", canCollect: true, canOpen: false, isEdible: false, isBreakable: false};    
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

test('canBeKilledAndDropInventory', () => {
    p0.get('get', food.getName());
    p0.kill();
    const expectedResult = 'cake';
    const actualResult = l0.getObject(food.getName()).getName();
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('killPlayerMoreThan5TimesReturnsExpectedStringResult', () => {
    const expectedResult = "<br>That's it. Game over. You had plenty of chances.<br>If you want to try again you either need to <i>quit</i> and restart a game or <i>load</i> a previously saved game.";
    p0.kill();
    p0.kill();
    p0.kill();
    p0.kill();
    p0.kill();
    const actualResult = p0.kill();
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('killPlayerReturnsExpectedStringResult', () => {
    const expectedResult = "<br><br>You're dead. You really should try to stay out of trouble and look after yourself better.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const actualResult = p0.kill();
    console.debug("Expected: "+expectedResult);
    console.debug("Actual  : "+actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('creatureRetaliationCanKillPlayer', () => {
    c0.setAttackStrength(104);
    p0.setLocation(l0);
    const expected = "You attempt a bare-knuckle fight with the creature.<br>You do no visible damage and end up coming worse-off. <br><br>You're dead. You really should try to stay out of trouble and look after yourself better.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const missed = "You attempt a bare-knuckle fight with the creature.<br>You do no visible damage. ";
    let actual = missed;
    let attempts = 0;
    while (actual === missed && attempts < 25) {
        actual = p0.hit('hit', c0.getName());
        attempts++;
    }
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureAttackCanKillPlayer', () => {
    const creatureName = 'creature';
    l0.removeObject(c0.getName());
    const c2 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:104, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-15});
    c2.go(null, l0);
    const expected = "<br>The creature attacks you. <br><br>You're dead. You really should try to stay out of trouble and look after yourself better.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, a container, and a beastie.<br>There is a single exit to the South.<br>";
    let actual = c2.fightOrFlight(null, p0);
    let counter = 0;
    while (p0.getScore() >= 0 && counter < 10) {
        //sometimes creature misses - repeat up to 10 attempts (score would be -50 if player was killed.
        actual = c2.fightOrFlight(null, p0);
        counter ++;
    };
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('hitAndKillPlayerReturnsExpectedStringResult', () => {
    const expectedResult = "<br><br>You're dead. You really should try to stay out of trouble and look after yourself better.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const actualResult = p0.hurt(101);
    console.debug("Expected: "+expectedResult);
    console.debug("Actual  : "+actualResult);
    expect(actualResult).toBe(expectedResult);
});
test('playerDeathFromStarvationReturnsExpectedStringResult', () => {
    p0.increaseTimeSinceEating(200); // new player hunger starts at 500 
    p0.tick(17, m0);
    const expectedResult = "<br><br>You're dead. You really do need to keep your energy up if you're going to survive in this environment.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const actualResult = p0.tick(1, m0);
    console.debug(p0.health());
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('playerDeathFromDehydrationReturnsExpectedStringResult', () => {
    p0.increaseTimeSinceDrinking(300);
    p0.tick(17, m0);
    const expectedResult = "<br><br>You're dead. You really do need to keep your fluid levels up if you're going to survive in this environment.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const actualResult = p0.tick(1, m0);
    console.debug(p0.health());
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('playerDeathFromContagionReturnsExpectedStringResult', () => {
    const con = new contagion.Contagion("death", "deathness", { "communicability": 1, "transmission": "bite", "symptoms": [{ "action": "hurt", "health": "3", "frequency": 1 }], "duration": -1 });
    p0.setContagion(con);
    const expectedResult = "<br><br>You collapse in a pool of weeping pus.<br>That was unfortunate. It looks like you were overcome by the death contagion or something equally nasty.<br>Fortunately, we currently have a special on reincarnation.<br>This time we've charged you 50 points and you'll need to find your way back to where you were to pick up all your stuff!<br>Good luck.<br><br>Current location: Home<br>a home location<br><br>You can see a creature, Mr Evil, an artefact of little consequence, a mighty sword, a drinking glass, a slab of sugary goodness, and a container.<br>There is a single exit to the South.<br>";
    const actualResult = p0.tick(80, m0); // oddly, this triggers bleeding to death - not directly contagion - but good enough.
    console.debug(p0.health());
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});
