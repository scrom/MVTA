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
    const expectedResult = "He says 'H";
    const actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test initate dialogue with salutation to creature', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go(null, l0);
    const input = "hiya aaron";
    const expectedResult = "He says 'H"; //note, prefix is picked up 
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

    const expecteFirstResult = "He says";
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

    const expectedFirstResult = "He says";
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

    const expectedFirstResult = "He says";
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

test('test "throw" verb', () => {
    const objectJSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object); 
    const input = "throw ice cream at the wall";
    const expectedResult = "In a display of pointless aggression, you throw the 99 flake ice cream at the wall.<br>"; 
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
    const input = "i want your ice cream";
    const expectedResult = "$imageaaronprescott.jpg/$image<br>"; //image comes back - we're still talking
    let actualResult = engine(input);
    actualResult = actualResult.substring(actualResult.length-expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test "go location"', () => {
    const input = "go to kitchen";
    const expectedResult = "You'll need to explore and find your way there yourself I'm afraid.";
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "go direction"', () => {
    const input = "go north";
    const expectedResult = "There's no way <i>North</i> from here.";
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "crawl direction"', () => {
    const input = "crawl up";
    const expectedResult = "You crawl up...<br><br>";
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});


test('test "crawl out"', () => {
    const input = "crawl out";
    const expectedResult = "You crawl up...<br><br>";
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "n" direction', () => {
    const input = "n";
    const expectedResult = "There's no way <i>North</i> from here.";
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "climb in" direction', () => {
    const input = "climb in";
    const expectedResult = "There's no way <i>in</i> from here.";
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "follow X"', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "follow aaron";
    const expectedResult = "He's right here."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test "take a break"', () => {
    const input = "take a break";
    const expectedResult = "There's nothing to rest on here."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test push/shove', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "shove aaron down the stairs";
    const expectedResult = "He really doesn't appreciate being pushed around."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test unimplemented verb', () => {
    const input = "conjure demon";
    const expectedResult = "Something bad happened on the server. We've logged it for review. If this happens again, you've probably found a bug. (Thanks for finding it!)"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test cheatcodes', () => {
    const input = "+affinity aaron 5";
    const expectedResult = "aaron affinity increased by 5"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test cheatcodes', () => {
    const input = "+heal aaron 25";
    const expectedResult = "Healed aaron prescott: He's generally the picture of health."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test open', () => {
    const objectJSON  = fm.readFile("artefacts/bag.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "open bag";
    let expectedResult = "You open the giant bag. It contains some coffee beans.$imagecoffeebag.jpg/$image"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);

    //and again
    expectedResult = "It's already open.$imagecoffeebag.jpg/$image"; 
    actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult); 
});

test('test close', () => {
    const objectJSON  = fm.readFile("artefacts/bag.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "close bag";
    let expectedResult = "It's not open."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test eat', () => {
    const objectJSON  = fm.readFile("artefacts/crisps.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "eat crisps";
    let expectedResult = "You eat a packet of crisps."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test drink', () => {
    const objectJSON  = fm.readFile("artefacts/milk.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "drink milk";
    let expectedResult = "You drink a serving of milk."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test shake', () => {
    const objectJSON  = fm.readFile("artefacts/milk.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "shake milk";
    let expectedResult = "You shake the milk. Slosh, splosh, gurgle...<br>... Well, you dind't spill any at least."; 
    let actualResult = engine(input)
    
    expect(actualResult).toBe(expectedResult);
});

test('test attacks - hit', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "hit aaron";
    const expectedResult = "You attempt a bare-knuckle fight with Aaron.<br>He takes exception to your violent conduct.<br>Fortunately for you, you missed. Don't do that again."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test attacks - strangle', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "strangle aaron";
    const expectedResult = "You reach out to grab Aaron but your feeble hands feel more like a caress.<br>He takes exception to your violent conduct.<br>Fortunately for you, you missed. Don't do that again."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test pay', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "pay man for ice cream";
    const expectedResult = "The ice cream man sells you a 99 flake ice cream.$imageice-cream.jpg/$image"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test buy', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "buy ice cream";
    const expectedResult = "The ice cream man sells you a 99 flake ice cream.$imageice-cream.jpg/$image"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test sell', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    p0.acceptItem(object2);
    const input = "sell ice cream to aaron";
    const expectedResult = "Aaron bought the 99 flake ice cream."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});


test('test unlock', () => {
    let objectJSON  = fm.readFile("artefacts/floor-safe.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "unlock safe";
    const expectedResult = "You need something to unlock it with."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test lock', () => {
    let objectJSON  = fm.readFile("artefacts/floor-safe.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "lock safe";
    const expectedResult = "It's already locked."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test pick', () => {
    let objectJSON  = fm.readFile("artefacts/floor-safe.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "pick safe";
    const expectedResult = "You need something to unlock it with."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test pick up', () => {
    let objectJSON  = fm.readFile("artefacts/floor-safe.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "pick up safe";
    const expectedResults = ["It can't be picked up.","You try in vain to lift the floor safe but just end up tired and annoyed.", "Nope, that's not going to work for you, sorry."];
    const actualResult = engine(input)
    console.debug(actualResult);
    expect(expectedResults.includes(actualResult)).toBe(true);
});

test('test take apart/dismantle', () => {
    let objectJSON  = fm.readFile("artefacts/torch.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "dismantle torch";
    const expectedResult = "You dismantle the emergency torch and retrieve some torch batteries."; 
    let actualResult = engine(input).substring(0,expectedResult.length); //sometimes you accidentally break things!
    
    expect(actualResult).toBe(expectedResult);
});

test('test take apart/dismantle', () => {
    let objectJSON  = fm.readFile("artefacts/torch.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "take apart torch";
    const expectedResult = "You dismantle the emergency torch and retrieve some torch batteries."; 
    let actualResult = engine(input).substring(0,expectedResult.length); //sometimes you accidentally break things!
    
    expect(actualResult).toBe(expectedResult);
});

test('test mug', () => {
    let objectJSON  = fm.readFile("artefacts/cup.json"); //just to check we don't get this instead!
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    //objectJSON  = fm.readFile("artefacts/axe.json") //increase our chances of success with a weapon!
    //const axe = mb.buildArtefact(objectJSON);
    //p0.acceptItem(axe);
    objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object2 = mb.buildCreature(objectJSON);
    object2.go("", l0);
    const input = "mug aaron";
    const expectedResults = ["He dodges out of the way and attacks you instead. <br>You failed to gain anything but pain for your actions.", "He takes exception to your violent conduct.<br>Fortunately for you, you missed. Don't do that again.<br>"];
    const actualResult = engine(input)
    console.debug(actualResult);
    expect(expectedResults.includes(actualResult)).toBe(true);
});


test('test wave', () => {
    let objectJSON  = fm.readFile("artefacts/cup.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object2 = mb.buildCreature(objectJSON);
    object2.go("", l0);
    const input = "wave cup at aaron";
    const expectedResult = "You wave the cup at Aaron Prescott. Nothing happens.<br>Your arms get tired and you feel slightly awkward."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test touch', () => {
    objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object2 = mb.buildCreature(objectJSON);
    object2.go("", l0);
    const input = "stroke aaron";
    const expectedResult = "You reach out and stroke Aaron Prescott."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test rub', () => {
    let objectJSON  = fm.readFile("artefacts/cup.json");
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "polish cup";
    const expectedResult = "You can't find anything to polish the cup with."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test sharpen', () => {
    let objectJSON  = fm.readFile("artefacts/sword.json");
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    objectJSON  = fm.readFile("artefacts/whetstone.json");
    const tool = mb.buildArtefact(objectJSON);
    l0.addObject(tool);
    const input = "sharpen sword";
    const expectedResult = "You sharpen the ornamental sword with the whetstone."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test think', () => {
    const input = "imagine laying on a sunny beach";
    const expectedResult = "You close your eyes and quietly try to imagine laying on a sunny beach...<br>It doesn't really do anything for you."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test taste', () => {
    const objectJSON  = fm.readFile("artefacts/ice-cream.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "taste ice cream";
    const expectedResult = "You lick at the ice cream. It's sweet, cold and delicious in a processed artificial non-dairy vanilla flavouring sort of way."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test break', () => {
    let objectJSON  = fm.readFile("artefacts/screen.json");
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "break screen";
    const expectedResult = "You set to with your bare hands and sheer malicious ingenuity in a bid to cause damage.<br>You broke it!"; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});


test('test destroy', () => {
    let objectJSON  = fm.readFile("artefacts/screen.json");
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "destroy screen";
    const expectedResult = "You set to with your bare hands and sheer malicious ingenuity in a bid to cause damage.<br>You destroyed it!"; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    
    expect(actualResult).toBe(expectedResult);
});

test('test kill', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "kill aaron";
    const expectedResult = "Much as you may like to believe in instant karma. If you <b>have</b> to kill, you'll need to fight it out yourself."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});


test('test shout', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "shout hello";
    const expectedResult = "Aaron says 'H"; 
    let actualResult = engine(input).substring(0,expectedResult.length);;
    
    expect(actualResult).toBe(expectedResult);
});

test('test sing', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "sing la lal lalalal";
    const expectedResult = "It's lovely that you feel the joyful urge to sing. But... ...seriously. Come back when you can hold a tune."; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});

test('test reply outside conversation', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "reply yes of course I can";
    const expectedResult = "Reply to who??"; 
    let actualResult = engine(input);
    
    expect(actualResult).toBe(expectedResult);
});


test('test reply inside conversation', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    engine("hi aaron");
    const input = "reply yes of course I can";
    const expectedResult = "He says 'OK"; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test basic "talk"', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const input = "talk to man";
    const expectedResult = "He says 'H"; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test ask for sale item', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    engine("talk to man");
    const input = "can I have an ice cream";
    const expectedResult = "You ask the ice cream man for an ice cream.<br>He says 'You're in luck!' 'I have some for sale right here.'$imageicecreamman.jpg/$image"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test ask for sale item', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    engine("talk to man");
    const input = "can I have some ice cream";
    const expectedResult = "You ask the ice cream man for some ice cream.<br>He says 'You're in luck!' 'I have some for sale right here.'$imageicecreamman.jpg/$image"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test ask for sale item', () => {
    const objectJSON  = fm.readFile("creatures/ice-cream-man.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    engine("talk to man");
    const input = "do you have any ice cream";
    const expectedResult = "You ask the ice cream man if he has any ice cream.<br>He says 'You're in luck!' 'I have some for sale right here.'$imageicecreamman.jpg/$image"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test ask find', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/guitar.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    p0.acceptItem(object2);
    const input = "ask aaron to find my guitar";
    const expectedResult = "You're carrying it!$imageaaronprescott.jpg/$image"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test ask for repair', () => {
    const objectJSON  = fm.readFile("creatures/aaron-prescott.json"); 
    const object = mb.buildCreature(objectJSON);
    object.go("", l0);
    const object2JSON  = fm.readFile("artefacts/guitar.json"); 
    const object2 = mb.buildArtefact(object2JSON);
    p0.acceptItem(object2);
    const input = "ask aaron to fix my guitar";
    const expectedResult = "It's not broken or damaged.$imageaaronprescott.jpg/$image"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test read', () => {
    const objectJSON  = fm.readFile("artefacts/coffee-machine-manual.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "read manual";
    const expectedResult = "You read the maintenance manual for the coffee machines.<br>Blah blah blah wiring blah <i>lock</i>s blah coffee blah <i>beans</i> blah <i>milk</i> blah.<br><br> If something is broken and you have the right tools and/or skills you can try <i>repair</i>ing it.<br>Just don't go overboard and <i>destroy</i> anything you need and don't get caught <i>break</i>ing stuff deliberately.<br><br>You've learned how to repair a coffee machine. That might be handy.<br>"; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test repair', () => {
    const objectJSON  = fm.readFile("artefacts/guitar.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "fix my guitar";
    const expectedResult = "It's not broken or damaged."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test turning on torch', () => {
    const objectJSON  = fm.readFile("artefacts/torch.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "on torch";
    const expectedResult = "You turn the emergency torch on."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test extinguish torch', () => {
    const objectJSON  = fm.readFile("artefacts/torch.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "extinguish torch";
    const expectedResult = "It's already off."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test lighting candle (without lighter)', () => {
    const objectJSON  = fm.readFile("artefacts/candle.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "light candle";
    const expectedResult = "You don't have anything to light it with."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test lighting candle (with lighter)', () => {
    let objectJSON  = fm.readFile("artefacts/candle.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    objectJSON  = fm.readFile("artefacts/lighter.json"); 
    const object2 = mb.buildArtefact(objectJSON);
    p0.acceptItem(object2);
    const input = "light candle";
    const expectedResult = "You light the candle with your lighter."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test blowing out candle', () => {
    let objectJSON  = fm.readFile("artefacts/candle.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "blow candle out";
    const expectedResult = "It's not lit."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test turning item over', () => {
    let objectJSON  = fm.readFile("artefacts/hookah.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "turn hookah over";
    const expectedResult = "You attempt to turn the ornate hookah pipe over. Nothing of interest happens."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test turning wrong item off', () => {
    let objectJSON  = fm.readFile("artefacts/hookah.json"); 
    const object = mb.buildArtefact(objectJSON);
    p0.acceptItem(object);
    const input = "switch off hookah";
    const expectedResult = "There's no obvious way for you to switch it off."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});


test('test "sign in"', () => {
    let objectJSON  = fm.readFile("artefacts/visitors-book.json"); 
    const object = mb.buildArtefact(objectJSON);
    objectJSON  = fm.readFile("artefacts/biro-reception-desk.json"); 
    const object2 = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    l0.addObject(object2);
    const input = "sign my name in the visitors book";
    const expectedResult = "You sign '$player' in the visitor's book."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test "sign in"', () => {
    let objectJSON  = fm.readFile("artefacts/visitors-book.json"); 
    const object = mb.buildArtefact(objectJSON);
    objectJSON  = fm.readFile("artefacts/biro-reception-desk.json"); 
    const object2 = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    l0.addObject(object2);
    const input = "sign in";
    const expectedResult = "You sign '$player' in the visitor's book."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test drawing', () => {
    let objectJSON  = fm.readFile("artefacts/visitors-book.json"); 
    const object = mb.buildArtefact(objectJSON);
    objectJSON  = fm.readFile("artefacts/biro-reception-desk.json"); 
    const object2 = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    l0.addObject(object2);
    const input = "draw a large flower in the book";
    const expectedResult = "You draw a large flower in the visitor's book."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test writing', () => {
    let objectJSON  = fm.readFile("artefacts/visitors-book.json"); 
    const object = mb.buildArtefact(objectJSON);
    objectJSON  = fm.readFile("artefacts/biro-reception-desk.json"); 
    const object2 = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    l0.addObject(object2);
    const input = "write i am a bad person on the walls";
    const expectedResult = "You write 'i am a bad person' on the wall."; 
    let actualResult = engine(input).substring(0,expectedResult.length);
    expect(actualResult).toBe(expectedResult);
});

test('test cleaning', () => {
    const input = "clear dirt off walls";
    const expectedResult = "You can't find anything to clean the wall with."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test noise', () => {
    const input = "growl at the dog";
    const expectedResult = "You attempt to growl and manage to emit a tuneless, annoying noise.<br>Thanks for that then."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test smell', () => {
    let objectJSON  = fm.readFile("artefacts/air.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "smell air";
    const expectedResult = "You detect the slightly warm, damp, youthful smell of Cambridge graduates."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test listen', () => {
    let objectJSON  = fm.readFile("artefacts/air-plant-room.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "listen";
    const expectedResult = "You hear a mix of occasional clanking, a low level generator hum, and the odd burst of a boiler firing up."; 
    let actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test play', () => {
    const objectJSON  = fm.readFile("artefacts/guitar.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "play guitar";
    const expectedResult = "You attempt to strum a few notes but virtual music doesn't seem to be your forte.<br>";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});

test('test inject', () => {
    const objectJSON  = fm.readFile("artefacts/biro.json"); 
    const object = mb.buildArtefact(objectJSON);
    l0.addObject(object);
    const input = "inject myself with a biro";
    const expectedResult = "It's not designed for that kind of personal medical use.";
    const actualResult = engine(input);
    expect(actualResult).toBe(expectedResult);
});