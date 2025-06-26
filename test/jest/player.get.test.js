"use strict";
const player = require('../../server/js/player.js');
const location = require('../../server/js/location.js');
const artefact = require('../../server/js/artefact.js');

const mapBuilder = require('../../server/js/mapbuilder.js');
const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');

const fileManager = require('../../server/js/filemanager.js');
const testDataDir = '../../test/testdata/';
const testImageDir = '../../test/testdata/images/';
const fm = new fileManager.FileManager(true, testDataDir, testImageDir);

const prodDataDir = '../../data/';
const prodImageDir = '../../images/';
const prodfm = new fileManager.FileManager(true, prodDataDir, prodImageDir);

let junkAttributes;
let fixedAttributes;
let containerAttributes;
let playerName;
let p0; // player object.
let l0; //location object.
let a0; //artefact object.
let a1; //artefact object.
let container; //container object

beforeEach(() => {
    playerName = 'player';
    p0 = new player.Player({"username": playerName});
    l0 = new location.Location('home','a home location');
    p0.setLocation(l0);
    junkAttributes = {weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false};    
    fixedAttributes = {weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: false, canOpen: false, isEdible: false, isBreakable: false};
    containerAttributes = {weight: 2, carryWeight: 25, attackStrength: 2, type: "container", canCollect: true, canOpen: true, isEdible: false, isBreakable: true};
    a0 = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',junkAttributes, null);
    container = new artefact.Artefact('container', 'container', 'hold hold hold',containerAttributes, null);
    a1 = new artefact.Artefact('box', 'box', 'just a box',junkAttributes, null);
    l0.addObject(a0);
    l0.addObject(container);
});

afterEach(() => {
    playerName = null;
    p0 = null;
    l0 = null;
    junkAttributes = null;
    fixedAttributes = null;
    containerAttributes = null;
    a0 = null;
    a1 = null;
    container = null;
});

test("Test that a player can get an object.", () => {
    const expectedResult = "You get an artefact of little consequence.";
    const actualResult = p0.get('get', a0.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get all objects in a location.", () => {
    const expectedResult = "You collected 2 items.";
    const actualResult = p0.get('get', 'all');
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get a container-type object.", () => {
    container.receive(a1);
    const expectedResult = "You get a container.";
    const actualResult = p0.get('get', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get an object from an open container they're carrying.", () => {
    container.moveOrOpen('open');    
    container.receive(a1);
    p0.get('get', container.getName());
    const expectedResult = "You take a box from your container.";
    const actualResult = p0.get('get', a1.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get an object from a closed container they're carrying.", () => {
    const map = require('../../server/js/map.js');
    const m0 = new map.Map();
    m0.addLocation(l0);
    p0 = new player.Player({"username": playerName}, m0, mb);
    p0.setLocation(l0);

    container.receive(a1);
    p0.get('get', container.getName());
    const objectName = "box";
    const expectedResults = [
        "There's no "+objectName+" here and you're not carrying any either.",
        "You can't see any "+objectName+" around here.",
        "There's no sign of any "+objectName+" nearby. You'll probably need to look elsewhere.",
        "You'll need to try somewhere (or someone) else for that.",
        "There's no "+objectName+" available here at the moment."
    ];
    const actualResult = p0.get('get', a1.getName());
    expect(expectedResults).toContain(actualResult);
});

test("Test that a player can get an object from an open container in a location.", () => {
    container.moveOrOpen('open');  
    container.receive(a1);
    const expectedResult = "You get a box.";
    const actualResult = p0.get('get', a1.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get an object from a closed container in a location.", () => {
    const map = require('../../server/js/map.js');
    const m0 = new map.Map();
    m0.addLocation(l0);
    p0 = new player.Player({"username": playerName}, m0, mb);
    p0.setLocation(l0);

    container.moveOrOpen('open');  
    container.receive(a1);
    container.close('close');
    const objectName = "box";
    const expectedResults = [
        "There's no "+objectName+" here and you're not carrying any either.",
        "You can't see any "+objectName+" around here.",
        "There's no sign of any "+objectName+" nearby. You'll probably need to look elsewhere.",
        "You'll need to try somewhere (or someone) else for that.",
        "There's no "+objectName+" available here at the moment."
    ];
    const actualResult = p0.get('get', a1.getName());
    expect(expectedResults).toContain(actualResult);
});

test("Test that a player cannot get an object that doesn't exist.", () => {
    const map = require('../../server/js/map.js');
    const m0 = new map.Map();
    m0.addLocation(l0);
    p0 = new player.Player({"username": playerName}, m0, mb);
    p0.setLocation(l0);

    const objectName = "nothing";
    const expectedResults = [
        "There's no "+objectName+" here and you're not carrying any either.",
        "You can't see any "+objectName+" around here.",
        "There's no sign of any "+objectName+" nearby. You'll probably need to look elsewhere.",
        "You'll need to try somewhere (or someone) else for that.",
        "There's no "+objectName+" available here at the moment."
    ];
    const actualResult = p0.get('get', 'nothing');
    expect(expectedResults).toContain(actualResult);
});

test("Test that a player cannot get an '' object.", () => {
    const expectedResult = "get what?";
    const actualResult = p0.get('get', '');
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get a named hidden object from an open container in a location.", () => {
    container.moveOrOpen('open');  
    container.receive(a1);
    a1.hide();
    const expectedResult = "You get a box.";
    const actualResult = p0.get('get', a1.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can search an object and gain nothing - 0 items collected, 0 items collectable,  0 items found.", () => {
    container.moveOrOpen('open');  
    container.receive(a1);
    const expectedResult = "You search the container and discover nothing new.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get a hidden object by searching - 1 item  collected, 1 item  collectable,  1 item  found.", () => {
    container.moveOrOpen('open');  
    container.receive(a1);
    a1.hide();
    const expectedResult = "You search the container and discover a box.<br>You collect the box.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get hidden objects by searching - 2 items collected, 2 items collectable,  2 items found.", () => {
    container.moveOrOpen('open');
    const a2 = new artefact.Artefact('box two', 'box two', 'another box',junkAttributes, null);
    container.receive(a1);
    container.receive(a2);
    a1.hide();
    a2.hide();
    const expectedResult = "You search the container and discover a box and a box two.<br>You collect up all your discoveries.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get hidden objects by searching - 0 items collected, 0 items collectable,  1 item found.", () => {
    container.moveOrOpen('open');
    const a2 = new artefact.Artefact('box two', 'box two', 'another box',fixedAttributes, null);
    container.receive(a2);
    a2.hide();
    const expectedResult = "You search the container and discover a box two.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get a hidden object by searching when they cannot carry it - 0 items collected, 1 item  collectable,  1 item  found.", () => {
    container.moveOrOpen('open');  
    const heavyAttributes = {weight: 20, canCollect: true};
    const heavy = new artefact.Artefact('heavy', 'heavy', 'inventory filler',heavyAttributes, null);
    const playerInventory = p0.getInventoryObject();
    playerInventory.add(heavy);

    container.receive(a1);
    a1.hide();
    const expectedResult = "You search the container and discover a box.<br>Unfortunately you can't carry it right now.<br>You might want to come back for it later or <i>drop</i> something else you're carrying.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get a hidden object by searching when they cannot carry it - 0 items collected, 2 items collectable,  2 items found.", () => {
    container.moveOrOpen('open');  
    const heavyAttributes = {weight: 20, canCollect: true};
    const heavy = new artefact.Artefact('heavy', 'heavy', 'inventory filler',heavyAttributes, null);
    const playerInventory = p0.getInventoryObject();
    playerInventory.add(heavy);

    container.receive(a1);
    a1.hide();

    const a2 = new artefact.Artefact('box two', 'box two', 'another box',junkAttributes, null);
    container.receive(a2);
    a2.hide();

    const expectedResult = "You search the container and discover a box and a box two.<br>Unfortunately you can't carry any more right now.<br>You might want to come back for some of these later or <i>drop</i> something else you're carrying.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get a _fixed_ hidden object by searching - 0 items collected, 0 items collectable,  2 items found.", () => {
    container.moveOrOpen('open');  

    const a2 = new artefact.Artefact('box two', 'box two', 'another box',fixedAttributes, null);
    container.receive(a2);
    a2.hide();

    const a3 = new artefact.Artefact('box three', 'box three', 'a third box',fixedAttributes, null);
    container.receive(a3);
    a3.hide();

    const expectedResult = "You search the container and discover a box two and a box three.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get some hidden objects by searching but not fixed one - 1 item collected, 1 item collectable,  2 items found.", () => {
    container.moveOrOpen('open');

    container.receive(a1);
    a1.hide();

    const a3 = new artefact.Artefact('box three', 'box three', 'a third box',fixedAttributes, null);
    container.receive(a3);
    a3.hide();

    const expectedResult = "You search the container and discover a box and a box three.<br>You collect the box.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot get overweight and fixed hidden objects by searching - 0 items collected, 1 item collectable,  2 items found.", () => {
    container.moveOrOpen('open');

    const heavyAttributes = {weight: 20, canCollect: true};
    const heavy = new artefact.Artefact('heavy', 'heavy', 'inventory filler',heavyAttributes, null);
    const playerInventory = p0.getInventoryObject();
    playerInventory.add(heavy);

    container.receive(a1);
    a1.hide();

    const a3 = new artefact.Artefact('box three', 'box three', 'a third box',fixedAttributes, null);
    container.receive(a3);
    a3.hide();

    const expectedResult = "You search the container and discover a box and a box three.<br>Unfortunately you can't carry any more right now.<br>You might want to come back for something here later or <i>drop</i> something else you're carrying.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get two carryable hidden objects by searching but not the heavy one  - 2 items collected, 3 items collectable,  3 items found.", () => {
    container.moveOrOpen('open');  
    const heavyAttributes = {weight: 14, canCollect: true};
    const heavy = new artefact.Artefact('heavy', 'heavy', 'inventory filler',heavyAttributes, null);
    const playerInventory = p0.getInventoryObject();
    playerInventory.add(heavy);

    container.receive(a1);
    a1.hide();

    const a2 = new artefact.Artefact('box two', 'box two', 'another box',junkAttributes, null);
    container.receive(a2);
    a2.hide();

    const a3 = new artefact.Artefact('box three', 'box three', 'a third box',junkAttributes, null);
    container.receive(a3);
    a3.hide();

    const expectedResult = "You search the container and discover a box, a box two, and a box three.<br>You collect the box and a box two.<br>Unfortunately you can't carry everything right now.<br>You might want to come back for the box three later or <i>drop</i> something else you're carrying.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get two out of 4 hidden objects by searching. Limited by weight  - 2 items collected, 4 items collectable,  4 items found.", () => {
    container.moveOrOpen('open');  
    const heavyAttributes = {weight: 14, canCollect: true};
    const heavy = new artefact.Artefact('heavy', 'heavy', 'inventory filler',heavyAttributes, null);
    const playerInventory = p0.getInventoryObject();
    playerInventory.add(heavy);

    container.receive(a1);
    a1.hide();

    const a2 = new artefact.Artefact('box two', 'box two', 'another box',junkAttributes, null);
    container.receive(a2);
    a2.hide();

    const a3 = new artefact.Artefact('box three', 'box three', 'a third box',junkAttributes, null);
    container.receive(a3);
    a3.hide();

    const a4 = new artefact.Artefact('box four', 'box four', 'a fourth box',junkAttributes, null);
    container.receive(a4);
    a4.hide();

    const expectedResult = "You search the container and discover a box, a box two, a box three, and a box four.<br>You collect the box and a box two.<br>Unfortunately you can't carry the rest right now.<br>You might want to come back for some of these later or <i>drop</i> something else you're carrying.";
    const actualResult = p0.search('search', container.getName());
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get a single slice of cake.", () => {
    let cakeJSON = fm.readFile("cake.json");
    let cake = mb.buildArtefact(cakeJSON);

    //Cake is not collectable - this forces the game to "split" the cake!

    l0.addObject(cake);

    const expectedResult = "You get a slice of victoria sponge cake.$imagecake.jpg/$image";
    const actualResult = p0.get('get', "cake");
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get *one* bowl of coco pops.", () => {
    mb.buildMap();
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    let kitchen = m0.getLocation("kitchen-ground-floor")
    p0.setLocation(kitchen);

    console.debug("Location: "+kitchen)

    const expectedResult = "You collect some coco pops into a nearby bowl.<br>$imagebowl.jpg/$image";
    const actualResult = p0.get('get', 'coco pops');
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player can get *two* bowls of coco pops.", () => {
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    let kitchen = m0.getLocation("kitchen-ground-floor")
    p0.setLocation(kitchen);

    p0.get('get', 'coco pops');
    const expectedResult = "You collect some coco pops into a nearby drinking glass.<br>$imagedrinkingglass.jpg/$image";
    const actualResult = p0.get('get', 'coco pops');
    expect(actualResult).toBe(expectedResult);
});


test("Test that a player can get water from the kitchen sink.", () => {
    //sing "delivers" water so basic get needs to route through "delivered" items and then get a glass or similar to put it in.
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    let kitchen = m0.getLocation("kitchen-ground-floor")
    p0.setLocation(kitchen);

    const expectedResult = "You collect water into a nearby drinking glass.<br>$imagedrinkingglass.jpg/$image";

    //check glass is no longer in location and is now in inventory!
    var originalLocationInventorySize = kitchen.getInventoryObject().size();

    const actualResult = p0.get('get', 'water');
    expect(actualResult).toBe(expectedResult);

    expect(originalLocationInventorySize).toBe(kitchen.getInventoryObject().size()+1); 

    var playerHasGlass = p0.getInventoryObject().check("glass");
    expect(playerHasGlass).toBe(true); 
});


test("Test that a player cannot add coco pops to water.", () => {
    //sing "delivers" water so basic get needs to route through "delivered" items and then get a glass or similar to put it in.
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    let kitchen = m0.getLocation("kitchen-ground-floor")
    p0.setLocation(kitchen);

    const expectedResult = "Nope. They really won't mix well together.";

    p0.get('get', 'water');

    const actualResult = p0.put('put', 'coco pops', 'into' , 'water');
    expect(actualResult).toBe(expectedResult);
});

test("Test that a player cannot add coco pops to a glass of water.", () => {
    //sing "delivers" water so basic get needs to route through "delivered" items and then get a glass or similar to put it in.
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    let kitchen = m0.getLocation("kitchen-ground-floor")
    p0.setLocation(kitchen);

    const expectedResult = "You attempt to add coco pops to the glass but realise they won't really mix well with the water that's already in there.$imagedrinkingglass.jpg/$image";

    p0.get('get', 'water');

    const actualResult = p0.put('put', 'coco pops', 'into' , 'glass');
    expect(actualResult).toBe(expectedResult);
});

test("issue #394 Test that a player avoids container with water (and uses alternate) when collecting coco pops.", () => {
    //sing "delivers" water so basic get needs to route through "delivered" items and then get a glass or similar to put it in.
    const m0 = mb.buildMap();
    p0 = new player.Player({"username": playerName}, m0, mb);
    p0.setLocation(l0);

    let objectJSON  = prodfm.readFile("artefacts/glass.json"); 
    const glass = mb.buildArtefact(objectJSON);

    objectJSON  = prodfm.readFile("artefacts/bowl.json"); 
    const bowl = mb.buildArtefact(objectJSON);

    objectJSON  = prodfm.readFile("artefacts/water.json"); 
    const water = mb.buildArtefact(objectJSON);

    objectJSON  = prodfm.readFile("artefacts/coco-pops.json"); 
    const pops = mb.buildArtefact(objectJSON);

    l0.addObject(glass);
    l0.addObject(bowl);
    l0.addObject(pops);

    //ensure both containers have plenty of physical space...
    const glassInv = glass.getInventoryObject();
    glassInv.setCarryWeight(5);
    const bowlInv = bowl.getInventoryObject();
    bowlInv.setCarryWeight(5);

    let expected = ""
    let result = bowl.receive(water);
    expect(result).toBe(expected);  

    const expectedResult = "You collect the coco pops into a nearby drinking glass.<br>";

    const actualResult = p0.get('get', 'coco pops'); //this should succeed
    expect(actualResult).toBe(expectedResult);
});


/*
    const object2JSON  = prodfm.readFile("artefacts/vial.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const object3JSON  = prodfm.readFile("artefacts/water.json"); 
    const object3 = mb.buildArtefact(object3JSON);
    object2.receive(object3);
*/