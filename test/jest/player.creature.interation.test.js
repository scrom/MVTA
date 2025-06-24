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
test('player can give an item from inventory to a creature', () => {
    p0.get('get', food.getName());
    const expectedResult = 'The creature takes a slab of sugary goodness.';
    const actualResult = p0.give('give','cake', 'to', c0.getName());
    expect(actualResult).toBe(expectedResult);
});

test('player can give a high affinity item to a friendly creature', () => {
    l0.addObject(a1);
    p0.get(a1.getName());
    const expectedResult = "The creature takes a box.";
    const actualResult = p0.give('give',a1.getName(), 'to', c0.getName());
    expect(actualResult).toBe(expectedResult);
});

test('player cannot give a high affinity item to an unfriendly creature', () => {
    l0.addObject(a1);
    p0.get(a1.getName());
    const expectedResult = "It's not willing to accept gifts from you at the moment.";
    const actualResult = p0.give('give',a1.getName(), 'to', c1.getName());
    expect(actualResult).toBe(expectedResult);
});

test('player can ask a friendly creature for an object', () => {
    const expectedResult = "'Sure. Here you go.'<br>He hands you the box.";
    const actualResult = p0.ask('ask',c0.getName(), 'box');
    expect(actualResult).toBe(expectedResult);
});

test('player can steal an item from a creature', () => {
    p0.setStealth(7); //crank stealth up to guarantee successful steal
    const expectedResult = "You manage to steal a box from the creature.";
    const actualResult = p0.steal('steal','box',c0.getName());
    expect(actualResult).toBe(expectedResult);
});

test('player can hit a creature with a weapon they are carrying', () => {
    p0.get('get', weapon.getName());
    const expectedResult = "He's injured.";
    let hitcount = 0;
    let actualResult;
    while (hitcount < 1) {
        actualResult = p0.hit('hit', c0.getName());
        if (actualResult !== "You missed!") {
            hitcount++;
        }
    }
    expect(actualResult).toBe(expectedResult);
});

test('a healthy player does full damage to a creature', () => {
    p0.get('get', weapon.getName());
    p0.hurt(49);
    let hitcount = 0;
    while (hitcount < 2) {
        const result = p0.hit('hit', c0.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    const expectedResult = "He's really not in good shape.";
    const actualResult = c0.health();
    expect(actualResult).toBe(expectedResult);
});

test('a bleeding player does less damage to a creature than normal', () => {
    p0.get('get', weapon.getName());
    p0.hurt(51);
    let hitcount = 0;
    while (hitcount < 1) {
        const result = p0.hit('hit', c0.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    const expectedResult = "He's taken a fair beating.";
    const actualResult = c0.health();
    expect(actualResult).toBe(expectedResult);
});

test('a badly injured player does even less damage to a creature', () => {
    p0.get('get', weapon.getName());
    p0.hurt(91);
    let hitcount = 0;
    while (hitcount < 1) {
        const result = p0.hit('hit', c0.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    const expectedResult = "He's not happy.";
    const actualResult = c0.health();
    expect(actualResult).toBe(expectedResult);
});

test('player can hit and kill a creature', () => {
    p0.get('get', weapon.getName());
    let hitcount = 0;
    let result;
    while (hitcount < 5) {
        result = p0.hit('hit', c0.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    const expectedResult = "He's dead.";
    const actualResult = c0.health();
    expect(actualResult).toBe(expectedResult);
});

test('a nearly dead player does double damage to a creature', () => {
    p0.get('get', weapon.getName());
    p0.hurt(96);
    let hitcount = 0;
    while (hitcount < 2) {
        const result = p0.hit('hit', c0.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    const expectedResult = "He's dead.";
    const actualResult = c0.health();
    expect(actualResult).toBe(expectedResult);
});

test('hitting a friendly creature three times makes it fightable', () => {
    const friendlyCreature = new creature.Creature('friend', 'A friend', "Super-friendly.", {weight:140, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:215, affinity:2, canTravel:true});
    friendlyCreature.go("n",l0); 
    p0.get('get', weapon.getName());
    p0.hit('hit',friendlyCreature.getName());
    p0.hit('hit',friendlyCreature.getName());
    const expectedResult = "You're obviously determined to fight him. Fair enough, on your head be it.";
    const actualResult = p0.hit('hit',friendlyCreature.getName()).substr(0,74);
    expect(actualResult).toBe(expectedResult);
});

test('friendly creature hit count erodes by walking the effects off', () => {
    const friendlyCreature = new creature.Creature('friend', 'A friend', "Super-friendly.", {weight:140, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:215, affinity:2, canTravel:true});
    friendlyCreature.go("n",l0); 
    p0.get('get', weapon.getName());
    p0.hit('hit',friendlyCreature.getName());
    p0.hit('hit',friendlyCreature.getName());
    friendlyCreature.go("n",l0);
    friendlyCreature.go("n",l0);
    const expectedResult = "You missed. This is your last chance. Seriously, don't do that again any time soon.";
    const actualResult = p0.hit('hit',friendlyCreature.getName());
    expect(actualResult).toBe(expectedResult);
});

test('a previously turned friendly creature can be recovered', () => {
    const friendlyCreature = new creature.Creature('friend', 'A friend', "Super-friendly.", {weight:140, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:215, affinity:2, canTravel:true});
    friendlyCreature.go(null,l0); 
    p0.get('get', weapon.getName());
    let hitcount = 0;
    while (hitcount < 3) {
        const result = p0.hit('hit', friendlyCreature.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    friendlyCreature.receive(iceCream);
    const expectedResult = "friendly";
    const actualResult = friendlyCreature.getSubType();
    expect(actualResult).toBe(expectedResult);
});

test('a previously turned friendly creature cannot be recovered without a decent bribe', () => {
    const friendlyCreature = new creature.Creature('friend', 'A friend', "Super-friendly.", {weight:140, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:215, affinity:2, canTravel:true});
    friendlyCreature.go(null,l0); 
    p0.get('get', weapon.getName());
    let hitcount = 0;
    while (hitcount < 3) {
        const result = p0.hit('hit', friendlyCreature.getName());
        if (result !== "You missed!") {
            hitcount++;
        }
    }
    friendlyCreature.receive(food);
    const expectedResult = "creature";
    const actualResult = friendlyCreature.getSubType();
    expect(actualResult).toBe(expectedResult);
});

test('hitting a creature when unarmed usually damages the player', () => {
    const expectedResult = "You attempt a bare-knuckle fight with the creature.<br>You do no visible damage and end up coming worse-off. You feel weaker. ";
    const expectedResult2 = "You attempt a bare-knuckle fight with the creature.<br>You do no visible damage. ";
    let hitcount = 0;
    let actualResult;
    while (hitcount < 1) {
        actualResult = p0.hit('hit', c0.getName());
        if (actualResult !== "You missed!") {
            hitcount++;
        }
    }
    if (actualResult === expectedResult2) {
        expect(actualResult).toBe(expectedResult2);
    } else {
        expect(actualResult).toBe(expectedResult);
    }
});

test('player cannot drink a dead creature', () => {
    const deadCreature = new creature.Creature('creature', 'A dead creature', "crunchy.", {weight:20, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true});
    deadCreature.go(null,l0); 
    p0.get('get','creature');

    const expectedResult = "He'd get stuck in your throat if you tried.";
    const actualResult = p0.drink('drink','creature');
    expect(actualResult).toBe(expectedResult);
});

test('player can eat a dead creature from location', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:20, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true});
    deadCreature.go(null,l0); 
    p0.setLocation(l0);
    p0.increaseTimeSinceEating(35);
    p0.reduceHitPoints(6);

    const expectedResult = 'You tear into the raw flesh of the dead creature.<br>That was pretty messy but you actually managed to get some nutrition out of him.<br>You\'re feeling nicely full!';
    const actualResult = p0.eat('eat','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('player can eat a dead creature from inventory', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:20, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true});
    deadCreature.go(null,l0); 
    p0.get('get','dead creature');
    p0.increaseTimeSinceEating(35);
    p0.reduceHitPoints(6);

    const expectedResult = 'You tear into the raw flesh of the dead creature.<br>That was pretty messy but you actually managed to get some nutrition out of him.<br>You\'re feeling nicely full!';
    const actualResult = p0.eat('eat','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('eating all of a dead creature carrying items drops contents', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:5, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,l0); 
    p0.setLocation(l0);
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);

    const expectedResult = 'You tear into the raw flesh of the dead creature.<br>That was pretty messy but you actually managed to get some nutrition out of him.<br>His possessions are scattered on the floor.<br>You\'re feeling nicely full!';
    const actualResult = p0.eat('eat','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('eating all of a dead creature carrying items returns contents to player', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:5, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,l0); 
    p0.setLocation(l0);
    p0.get('get','dead creature');
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);

    const expectedResult = 'You tear into the raw flesh of the dead creature.<br>That was pretty messy but you actually managed to get some nutrition out of him.<br>You manage to gather up his possessions.<br>You\'re feeling nicely full!';
    const actualResult = p0.eat('eat','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('dropped items from eating all of dead creature are all returned to location', () => {
    const homeLoc = new location.Location('homeloc','homeloc','a home location');
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:5, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,homeLoc); 
    p0.setLocation(homeLoc);
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);
    p0.eat('eat','dead creature');

    const expectedResult = "a home location<br><br>You can see a slab of sugary goodness, a drinking glass, a mighty sword, and a container.<br>There's a lot of blood around here. It looks like someone or something's been injured very recently.<br>There are no visible exits.<br>";
    const actualResult = p0.examine("look");
    expect(actualResult).toBe(expectedResult);
});

test('dropped items from eating all of heavy dead creature are all returned to location', () => {
    const homeLoc = new location.Location('homeloc','homeloc','a home location');
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:25, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,homeLoc); 
    p0.setLocation(homeLoc);
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);
    p0.eat('eat','dead creature');

    const expectedResult = "a home location<br><br>You can see the remains of a well-chewed dead creature, a slab of sugary goodness, a drinking glass, a mighty sword, and a container.<br>There's a lot of blood around here. It looks like someone or something's been injured very recently.<br>There are no visible exits.<br>";
    const actualResult = p0.examine("look");
    expect(actualResult).toBe(expectedResult);
});

test('dropped items from eating all of dead creature are all returned to player', () => {
    const homeLoc = new location.Location('homeloc','a home location');
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:5, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,homeLoc); 
    p0.setLocation(homeLoc);
    p0.get('get','dead creature');
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);
    p0.eat('eat','dead creature');

    const expectedResult = "You're carrying a slab of sugary goodness, a drinking glass, a mighty sword, and a container.<br>You have &pound;5.00 in cash.<br>";
    const actualResult = p0.describeInventory();
    expect(actualResult).toBe(expectedResult);
});

test('dropped items from eating all of heavy dead creature are all returned to player', () => {
    const inv = p0.getInventoryObject();
    inv.setCarryWeight(50);
    const homeLoc = new location.Location('homeloc','a home location');
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:25, attackStrength:12, gender:'male', type:'creature', carryWeight:51, health:0, affinity:5, canTravel:true},[food, breakable, weapon, container]);
    deadCreature.go(null,homeLoc); 
    p0.setLocation(homeLoc);
    p0.get('get','dead creature');
    p0.increaseTimeSinceEating(65);
    p0.reduceHitPoints(6);
    p0.eat('eat','dead creature');

    const expectedResult = "You're carrying the remains of a well-chewed dead creature, a slab of sugary goodness, a drinking glass, a mighty sword, and a container.<br>You have &pound;5.00 in cash.<br>";
    const actualResult = p0.describeInventory();
    expect(actualResult).toBe(expectedResult);
});

test('player cannot eat a dead friendly creature', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:20, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:0, affinity:5, canTravel:true});
    deadCreature.go(null,l0); 
    p0.get('get','dead creature');
    p0.increaseTimeSinceEating(28);
    p0.reduceHitPoints(6);

    const expectedResult = 'You sink your teeth into him but gag at the thought of eating corpses. ';
    const actualResult = p0.eat('eat','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('player cannot eat a live creature', () => {
    p0.get('get','creature');
    p0.increaseTimeSinceEating(25);
    p0.reduceHitPoints(6);

    const expectedResult = 'You try biting the creature but he ducks out of your way and glares at you menacingly.';
    const actualResult = p0.eat('eat','creature');
    expect(actualResult).toBe(expectedResult);
});

test('player can touch a dead creature', () => {
    const deadCreature = new creature.Creature('dead creature', 'A dead creature', "crunchy.", {weight:20, attackStrength:12, gender:'male', type:'friendly', carryWeight:51, health:0, affinity:5, canTravel:true});
    deadCreature.go(null,l0); 
    p0.get('get','dead creature');

    const expectedResult = 'You reach out and feel the lifeless body of the dead creature. It\'s cold and unyielding.';
    const actualResult = p0.touch('feel','dead creature');
    expect(actualResult).toBe(expectedResult);
});

test('player can touch a friendly live creature', () => {
    p0.get('get','creature');

    const expectedResult = 'You reach out and touch the creature. He seems to appreciate your attention.';
    const actualResult = p0.touch('touch','creature');
    expect(actualResult).toBe(expectedResult);
});

test('player cannot touch a hostile live creature', () => {
    p0.get('get','evil');

    const expectedResult = "It lashes out at you.";
    const actualResult = p0.touch('touch','evil');
    expect(actualResult).toContain(expectedResult);
});