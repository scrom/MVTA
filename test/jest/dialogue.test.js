"use strict";
const player = require('../../server/js/player.js');
const createEngine = require('../../server/js/engine.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const location = require('../../server/js/location.js');
const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
const fileManager = require('../../server/js/filemanager.js');
const dataDir = '../../data/';
const imageDir = '../../images/';
const fm = new fileManager.FileManager(true, dataDir, imageDir);

var engine;
var p0;
var l0;
var m0;

var man = null;
var aaron = null;
var vi = null;
var cat = null;
var note = null;
var notes = null;
var plant = null;
var bookshelf = null;
var sword = null;
var cake  = null;

beforeEach(() =>
{
    const playerName = 'tester';
    const playerAttributes = { "username": playerName};
    m0 = new mb.buildMap();
    p0 = new player.Player(playerAttributes, m0, mb);
    l0 = new location.Location('home', 'home', 'a home location');
    m0.addLocation(l0);
    l0.addExit("u", "home", "atrium");
    p0.setStartLocation(l0);
    p0.setLocation(l0);
    engine = createEngine(p0, m0);

    //some basic reusable things...
    let objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    man = mb.buildCreature(objectJSON);
    objectJSON = fm.readFile("creatures/aaron-prescott.json"); 
    aaron = mb.buildCreature(objectJSON);
    objectJSON = fm.readFile("creatures/violet-wilmott.json"); 
    vi = mb.buildCreature(objectJSON);
    objectJSON = fm.readFile("creatures/cat.json"); 
    cat = mb.buildCreature(objectJSON);
    objectJSON = fm.readFile("artefacts/handwritten-note.json"); 
    note =  mb.buildArtefact(objectJSON);
    objectJSON = fm.readFile("artefacts/notes.json"); 
    notes =  mb.buildArtefact(objectJSON);
    objectJSON = fm.readFile("artefacts/indoor-plant.json"); 
    plant =  mb.buildArtefact(objectJSON);
    objectJSON = fm.readFile("artefacts/bookshelf.json"); 
    bookshelf =  mb.buildArtefact(objectJSON);
    objectJSON = fm.readFile("artefacts/sword.json"); 
    sword =  mb.buildArtefact(objectJSON);
    objectJSON = fm.readFile("artefacts/cake.json"); 
    cake =  mb.buildArtefact(objectJSON);
});

afterEach(() =>
{
    playerName = null;
    playerAttributes = null;
    p0 = null;
    l0 = null;
    m0 = null;
    engine = null;
    man = null;
    aaron = null;
    vi = null;
    cat = null;
    note = null;
    notes = null;
    plant = null;
    bookshelf = null;
    sword = null;
    cake  = null;
});

test('test - dialogue - asking a question with only 1 person in the room gets a response from them', () => {
    //set up a nice busy location multiple people, multiple ofbjects, and objects inside objects, player inventory, etc.
    aaron.go(null, l0);
    aaron.increaseAffinity(2); // make them more positive
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to aaron");
    const input = "would you like some of my tasty biscuits";
    const expectedResult = "'I don't think that's something you can <i>truly</i> offer me right now.'"; 
    let actualResult = engine(input).description;
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - talking openly suggests talking directly *to* someone', () => {
    //set up a nice busy location multiple people, multiple ofbjects, and objects inside objects, player inventory, etc.
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    //engine("talk to man");
    const input = "do you have any ice cream?";
    const expectedResult = "You ask 'Do you have any ice cream'<br>Nobody responds. You'll need to directly talk <i>to</i> someone if you want attention."; 
    let actualResult = engine(input).description;
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - asking creature for an item owned by another responds with suggestion', () => {
    //set up a nice busy location multiple people, multiple ofbjects, and objects inside objects, player inventory, etc.
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to aaron");
    const input = "do you have any ice cream?";
    const expectedResult = "You ask Aaron if he has any ice cream.<br>He says 'I think the ice cream man may have some for sale.'"; 
    let actualResult = engine(input).description;
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - can initiate conversation with ice cream man', () => {
    //set up a nice busy location multiple people, multiple ofbjects, and objects inside objects, player inventory, etc.
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    const input = "talk to ice cream man";
    const expectedResult = "The ice cream man says 'H"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - asking creature we are already talking to to give an item to another', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to ice cream man");
    const input = "can you give aaron one of your ice creams?";
    const expectedResult = "You ask the ice cream man to give aaron one of his ice creams.<br>He says '"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - asking creature to find another', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to ice cream man");
    const input = "where do you think aaron is?";
    const expectedResult = "You ask the ice cream man to find aaron<br>...<br>'He's right here.'"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});


test('test - dialogue - with busy location - asking creature go to a location', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    aaron.increaseAffinity(2);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to aaron");
    const input = "please go to the kitchen";
    const expectedResult = "You ask Aaron to go to the kitchen.<br>He says '"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - asking creature go to a direction', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    aaron.increaseAffinity(2);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to aaron");
    const input = "please go up";
    const expectedResult = "You ask Aaron to go up.<br>He says '"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - requests with "help" in are treated as a generic request for help.', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to ice cream man");
    const input = "please help me find my textbook";
    const expectedResult = "He says 'OK. Here's some things to try...'<br>"; 
    let actualResult = engine(input).description.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - ask single creature to "wait".', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    engine("talk to ice cream man");
    const input = "please wait here";
    const expectedResult = "You ask the ice cream man to wait.<br>He says 'I'm not planning on going anywhere.'<br>"; 
    let actualResult = engine(input).description//.substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test - dialogue - with busy location - ask everyone to wait.', () => {
    //this breaks around the "swtiching creature conversation" block in the parser as we have mentioned another character!!
    man.go(null, l0);
    aaron.go(null, l0);
    vi.go(null, l0);
    l0.addObject(note);
    l0.addObject(notes);
    l0.addObject(plant);
    l0.addObject(bookshelf);
    p0.acceptItem(sword);
    p0.acceptItem(cake);
    const input = "everyone, please wait here";
    let actualResult = engine(input).description
    const searchTerms = ["Aaron", "Violet", "the ice cream man", "wait"]; 
    for (t=0;t<searchTerms.length;t++) {
        expect(actualResult).toContain(searchTerms[t]);
    };
});

