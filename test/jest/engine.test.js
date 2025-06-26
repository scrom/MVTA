"use strict";
const player = require('../../server/js/player.js');
const createEngine = require('../../server/js/engine.js');
const map = require('../../server/js/map.js');
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

beforeEach(() =>
{
    const playerName = 'tester';
    const playerAttributes = { "username": playerName};
    m0 = new mb.buildMap();
    p0 = new player.Player(playerAttributes, m0, mb);
    engine = createEngine(p0, m0);
    l0 = new location.Location('home', 'home', 'a home location');
    m0.addLocation(l0);
    l0.addExit("u", "home", "atrium");
    p0.setStartLocation(l0);
    p0.setLocation(l0);
});

afterEach(() =>
{
    playerName = null;
    playerAttributes = null;
    p0 = null;
    l0 = null;
    m0 = null;
    engine = null;
});

test('engine responds appropriately with empty input', () => {
    const input = "";
    const expectedResult = "Sorry, I didn't hear you there";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('can call engine with simple action', () => {
    const input = "help";
    const expectedResult = "Stuck already? Ok...<br> I accept basic commands to move e.g";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('"cheat" verb', () => {
    const input = "cheat";
    const expectedResult = "Hmmm. I'm sure I heard about some cheat codes somewhere";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('"map" verb', () => {
    const input = "map";
    const expectedResult = "Oh dear, are you lost?";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});


test('"health" verb for player', () => {
    const input = "health";
    const expectedResult = "You're generally the picture of health.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"health" verb for creature', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    l0.addObject(object);
    const input = "triage cat";
    const expectedResult = "It's generally the picture of health.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"heal" verb for self', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    l0.addObject(object);
    const input = "heal self";
    const expectedResult = "You don't need healing at the moment.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"heal" verb for creature', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    l0.addObject(object);
    const input = "heal cat";
    const expectedResult = "You don't have anything to heal with.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"stats" verb', () => {
    const input = "stats";
    const expectedResult = "<i>Statistics for $player:</i><br>Your score is 0 out of 2055";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('"status" verb', () => {
    const input = "status";
    const expectedResult = "<i>Status:</i><br>Your health is at 100%.<br><br>a home location<br>There is a single exit up.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"visits" verb', () => {
    const input = "visits";
    const expectedResult = "You have visited this location once.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('"inv" verb', () => {
    const input = "inv";
    const expectedResult = "You're carrying nothing.<br>You have &pound;5.00 in cash.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('can call engine with basic player action', () => {
    const input = "wait";
    const expectedResult = "Time passes... ...slowly.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('can call engine with player interacting with single object', () => {
    const input = "examine floor";
    const expectedResult = "You look down. Yep, that's the ground beneath your feet.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test basic "look" gets the right words', () => {
    const input = "look";
    const expectedResult = "a home location<br>There is a single exit up.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "look at" gets the right words', () => {
    const input = "look at floor";
    const expectedResult = "You look down. Yep, that's the ground beneath your feet.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "look at" with an adverb gets the right words', () => {
    const input = "look carefully at floor";
    const expectedResult = "You carefully look at the floor and discover nothing new.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "look over" with an adverb gets the right words', () => {
    const input = "look over the floor carefully";
    const expectedResult = "You carefully look over the floor and discover nothing new.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "look under" gets the right words', () => {
    const input = "look under the floor";
    const expectedResult = "You look under the floor and discover nothing new.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "search" gets the right words', () => {
    const input = "search floor";
    const expectedResult = "You search the floor and discover nothing new.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('can call engine with player interacting with 2 objects', () => {
    const objectJSON  = fm.readFile("artefacts/bowl.json"); 
    const object = mb.buildArtefact(objectJSON);
    const subjectJSON = fm.readFile("artefacts/coco-pops.json");
    const subject = mb.buildArtefact(subjectJSON);
    l0.addObject(object);
    l0.addObject(subject);
    const input = "put pops in to bowl";
    const expectedResult = "You put some coco pops into the bowl.<br>$imagebowl.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('can call engine with player interacting with 2 objects with different preposition', () => {
    const objectJSON  = fm.readFile("artefacts/bowl.json"); 
    const object = mb.buildArtefact(objectJSON);
    const subjectJSON = fm.readFile("artefacts/coco-pops.json");
    const subject = mb.buildArtefact(subjectJSON);
    l0.addObject(object);
    l0.addObject(subject);
    const input = "put pops into bowl";
    const expectedResult = "You put some coco pops into the bowl.<br>$imagebowl.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('Attempting to put an object we dont own into a bowl fails gracefully', () => {
    var atrium = m0.getLocation("atrium");
    const objectJSON  = fm.readFile("artefacts/bowl.json"); 
    const object = mb.buildArtefact(objectJSON);
    atrium.addObject(object);
    p0.setLocation(atrium);
    const input = "put beans in to bowl";
    const expectedResults = ["There's no","You can't ","You'll nee"];
    const actualResult = engine(input).substring(0,expectedResults[0].length);
    console.debug(actualResult);
    expect(expectedResults.includes(actualResult)).toBe(true);
});

test('test "try/attempt" verb with a nonexistent object', () => {
    const input = "attempt very carefully to eat a tiny tin of dog food with a spoon";
    const expectedResults = ["There's no","You can't ","You'll nee"];
    const actualResult = engine(input).substring(0,expectedResults[0].length);
    console.debug(actualResult);
    expect(expectedResults.includes(actualResult)).toBe(true);
});

test('test "use" verb with an item that returns a new verb based action', () => {
    const objectJSON  = fm.readFile("artefacts/guitar.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "use guitar";
    const expectedResult = "You attempt to strum a few notes but virtual music doesn't seem to be your forte.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test unknown verbs attempt custom action and fail gracefully', () => {
    const input = "skibidee an artefact of little consequence";
    const expectedResult = "Sorry, I didn't quite understand you there.";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test 3 unknown actions in a row triggers help', () => {
    const input = "skibidee an artefact of little consequence";
    let expectedResult = "Sorry, I didn't quite understand you there.";
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);

    expectedResult = "It looks like you're struggling to be understood.<br>If you need some assistance, try typing <i>help</i>.";
    actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);

    expectedResult = "<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i>";
    actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test fail count reverts and restarts after successful action', () => {
    const input = "skibidee an artefact of little consequence";
    let expectedResult = "Sorry, I didn't quite understand you there.";
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);

    expectedResult = "a home location<br>There is a single exit up.<br>";
    actualResult = engine("look"); // no need to test result of this.
    expect(actualResult).toBe(expectedResult);

    expectedResult = "Sorry, I didn't quite understand you there.";
    actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);

    expectedResult = "Sorry, I didn't quite understand you there.";
    actualResult = engine(input).substring(0,expectedResult.length);;
    expect(actualResult).toBe(expectedResult);

    expectedResult = "It looks like you're struggling to be understood.<br>If you need some assistance, try typing <i>help</i>.";
    actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);

    expectedResult = "<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i>";
    actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test initate dialogue with "say"', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const input = "say hello to aaron";
    const expectedResult = "Aaron says";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test initate dialogue with salutation to creature', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const input = "hiya aaron";
    const expectedResult = "He says"; //note, prefix is picked up 
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test initate dialogue with open salutation when only one creature present', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const input = "ahoy";
    const expectedResult = "Aaron says";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test saying things out loud when no characters nearby', () => {
    const input = "ahoy there";
    const expectedResult = "'ahoy there'<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test follow-on dialogue in active conversation with find request', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const firstInput = "say hello to aaron";

    const expecteFirstResult = "Aaron says";
    const actualFirstResult = engine(firstInput).substring(0,expecteFirstResult.length);
    expect(actualFirstResult).toBe(expecteFirstResult);

    const input = "can you find my guitar";
    const expectedResult = "You ask Aaron to find";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test follow-on dialogue in active conversation including other verbs', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const firstInput = "say hello to aaron";

    const expectedFirstResult = "Aaron says";
    const actualFirstResult = engine(firstInput).substring(0,expectedFirstResult.length);
    expect(actualFirstResult).toBe(expectedFirstResult);

    const input = "can you put my guitar in the toaster";
    const expectedResult = "Aaron says";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test revert to actions from active conversation', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);

    const object2JSON  = fm.readFile("artefacts/guitar.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);

    const firstInput = "say hello to aaron";

    const expectedFirstResult = "Aaron says";
    const actualFirstResult = engine(firstInput).substring(0,expectedFirstResult.length);
    expect(actualFirstResult).toBe(expectedFirstResult);

    const input = "examine guitar";
    const expectedResult = "The strings are a bit tatty but it's mostly in tune.<br>It's worth about £10.00.$imageguitar.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "wait" verb', () => {
    const objectJSON  = fm.readFile("artefacts/hammock.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "wait";
    const expectedResult = "Time passes... ...slowly.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "rest"/"sit" verb', () => {
    const objectJSON  = fm.readFile("artefacts/hammock.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    p0.increaseTimeSinceResting(55);
    const input = "sit";
    const expectedResult = "You rest for a while.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "sleep"/"nap" verb', () => {
    const objectJSON  = fm.readFile("artefacts/hammock.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    p0.increaseTimeSinceResting(55);
    const input = "nap";
    const expectedResult = "You sleep for a while.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "hide"/"stash" *in* verb', () => {
    const objectJSON  = fm.readFile("artefacts/bowl.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const object2JSON  = fm.readFile("artefacts/skip.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const input = "stash bowl in skip";
    const expectedResult = "That's a bit obvious. You'll need to hide it somewhere else.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "hide"/"stash" *under* verb', () => {
    const objectJSON  = fm.readFile("artefacts/bowl.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const object2JSON  = fm.readFile("artefacts/hookah.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const input = "stash bowl under hookah";
    const expectedResult = "You hide the bowl under the ornate hookah pipe.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "empty" verb', () => {
    const objectJSON  = fm.readFile("artefacts/hammock.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "empty hammock";
    const expectedResult = "There's nothing to empty out of it.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "water" verb', () => {
    const objectJSON  = fm.readFile("artefacts/tomato-plants.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const object2JSON  = fm.readFile("artefacts/vial.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const object3JSON  = fm.readFile("artefacts/water.json"); 
    const object3 = mb.buildArtefact(object3JSON);
    object2.receive(object3);
    const input = "water plants";
    const expectedResult = "You add the water to the tomato plants to produce healthy tomato plants.$imagehealthytomatoplants.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "water" verb - alternate sentence structure', () => {
    const objectJSON  = fm.readFile("artefacts/tomato-plants.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const object2JSON  = fm.readFile("artefacts/vial.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const object3JSON  = fm.readFile("artefacts/water.json"); 
    const object3 = mb.buildArtefact(object3JSON);
    object2.receive(object3);
    const input = "spray tomato plants with water";
    const expectedResult = "You add the water to the tomato plants to produce healthy tomato plants.$imagehealthytomatoplants.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "feed" verb - sentence structure 1', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const input = "feed cat";
    const expectedResult = "It sniffs at the 99 flake ice cream, makes a disgruntled snort and turns away.<br>You leave it on the ground in case it comes back later.$imageice-cream.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "feed" verb - sentence structure 2', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const input = "feed ice cream to cat";
    const expectedResult = "It sniffs at the 99 flake ice cream, makes a disgruntled snort and turns away.<br>You leave it on the ground in case it comes back later.$imageice-cream.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "feed" verb - sentence structure 3', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    l0.addObject(object2);
    const input = "feed cat with ice cream";
    const expectedResult = "It sniffs at the 99 flake ice cream, makes a disgruntled snort and turns away.<br>You leave it on the ground in case it comes back later.$imageice-cream.jpg/$image";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "drop" verb', () => {
    const objectJSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "drop ice cream";
    const expectedResult = "You drop the 99 flake ice cream. ";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "drop onto" verb', () => {
    const objectJSON  = fm.readFile("creatures/cat.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    p0.acceptItem(object2);
    const input = "drop ice cream onto the cat";
    const expectedResult = "I don't think the cat appreciates you doing that.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});


test('test "give" X to Y verb', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    p0.acceptItem(object2);
    const input = "give ice cream to aaron";
    const expectedResult = "Aaron takes a 99 flake ice cream.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test "give me your X', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    const inv = object.getInventoryObject();
    inv.add(object2);
    let greet = engine("hi aaron"); //start conversation
    const input = "give me your ice cream";
    const expectedResult = "You ask Aaron to give you his ice cream.";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test "I want your X"', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    const inv = object.getInventoryObject();
    inv.add(object2);
    let greet = engine("hi aaron"); //start conversation
    const input = "i want some ice cream";
    const expectedResult = "$imageaaronprescott.jpg/$image<br>"; //image comes back - we're still talking
    let actualResult = engine(input);
    actualResult = actualResult.substring(actualResult.length-expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test "go location"', () => {
    const input = "go to kitchen";
    const expectedResult = "You'll need to explore and find your way there yourself I'm afraid.";
    let actualResult = engine(input);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});

test('test "go direction"', () => {
    const input = "go north";
    const expectedResult = "There's no way <i>North</i> from here.";
    let actualResult = engine(input);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});

test('test "crawl direction"', () => {
    const input = "crawl up";
    const expectedResult = "You crawl up...<br><br>";
    let actualResult = engine(input).substring(0,expectedResult.length);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});


test('test "crawl out"', () => {
    const input = "crawl out";
    const expectedResult = "You crawl up...<br><br>";
    let actualResult = engine(input).substring(0,expectedResult.length);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});

test('test "n" direction', () => {
    const input = "n";
    const expectedResult = "There's no way <i>North</i> from here.";
    let actualResult = engine(input);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});

test('test "climb in" direction', () => {
    const input = "climb in";
    const expectedResult = "There's no way <i>in</i> from here.";
    let actualResult = engine(input);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});

test('test "follow X"', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "follow aaron";
    const expectedResult = "He's right here."; 
    let actualResult = engine(input);
    actualResult = actualResult;
    expect(actualResult).toBe(expectedResult);
});
//@todo - handle "have a break" - break as a verb with nothing else == rest