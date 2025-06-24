"use strict";
const action = require('../../server/js/action.js');
const stubFactory = require('../stubs/stubFactory.js');
const player = require('../../server/js/player.js');
const map = require('../../server/js/map.js');

const sf = new stubFactory.StubFactory();

let p, playerStub, m, mapStub, a;

beforeEach(() => {
    p = new player.Player("Tester");
    playerStub = sf.generateStubClass(p);
    m = new map.Map();
    mapStub = sf.generateStubClass(m);
    a = new action.Action(playerStub, mapStub);
});

test('can use stub', () => {
    const stub = sf.generateStubClass(p);
    const expectedResult = 'function: getUsername, args[0]:stephen, args[1]:param 2, args[2]:another param';
    const actualResult = stub.getUsername("stephen", "param 2", "another param");
    expect(actualResult).toBe(expectedResult);
});

test('stub action', () => {
    const expectedResult = '{"verb":"ask","object0":"violet","object1":"stephen g","description":"function: ask, args[0]:find, args[1]:violet, args[2]:stephen g, args[3]:<Object>function: updateMissions, args[0]:function: calculateTicks, args[0]:1, args[1]:ask, args[1]:<Object>function: tick, args[0]:1, args[1]:<Object>","attributes":function: getClientAttributesString}';
    const actualResult = a.act("ask violet to find stephen g");
    expect(actualResult).toBe(expectedResult);
});

test('simple help action', () => {
    const actionString = "help";
    a.setActionString(actionString); 
    a.convertActionToElements(actionString);

    const expectedResult = "Stuck already? Ok...<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i> etc.<br>You can interact with objects and creatures by supplying a <i>verb</i> and the <i>name</i> of the object or creature. e.g. <i>'get sword'</i> or <i>'eat apple'</i>.<br>You can also <i>'use'</i> objects on others (and creatures) e.g. <i>'give sword to farmer'</i>, <i>'hit door with sword'</i> or <i>'put key in box'</i>.<br><br>Two of the most useful verbs to remember are <i>'look'</i> and <i>'examine'</i>.<br>In general I understand a fairly limited set of interactions (and I won't tell you them all, that'd spoil the fun) but hopefully they'll be enough for you to enjoy something more than a minimum viable adventure.<br><br>To find out more about how you're doing, try <i>'stats'</i> or <i>'status'</i><br>In many cases, your positive or negative interactions within the game may impact how others respond to you, use this knowledge wisely.<br><br>You can save your progress by entering <i>'save'</i>.<br>You can return to a previously saved point from <i>this</i> session by simply typing <i>restore</i><br>You can load a previously saved game by entering '<i>load filename-x</i>' (where <i>filename-x</i> is the name of your previously saved game file.)<br>If you've really had enough of playing, you can enter <i>quit</i> to exit the game (without saving).<br>";
    const actualResult = a.performPlayerAction();
    expect(actualResult).toBe(expectedResult);
});

test('ask X to find Y action', () => {
    const actionString = "ask violet to find stephen g";
    a.setActionString(actionString); 
    a.convertActionToElements(actionString);

    const expectedResult = 'function: ask, args[0]:find, args[1]:violet, args[2]:stephen g, args[3]:<Object>';
    const actualResult = a.performPlayerAction();
    expect(actualResult).toBe(expectedResult);
});

test('where is action', () => {
    const actionString = "where is the beef sandwich";
    a.setActionString(actionString); 
    a.convertActionToElements(actionString);

    const expectedResult = 'function: hunt, args[0]:where, args[1]:beef sandwich, args[2]:<Object>';
    const actualResult = a.performPlayerAction();
    expect(actualResult).toBe(expectedResult);
});

test('move into action', () => {
    const actionString = "move fish into bowl";
    const expectedResult = 'function: put, args[0]:put, args[1]:fish, args[2]:into, args[3]:bowl';
    const actualResult = a.processAction(actionString);
    expect(actualResult).toBe(expectedResult);
});

test('move shove action', () => {
    const actionString = "move bowl of fish";
    const expectedResult = 'function: shove, args[0]:move, args[1]:bowl of fish';
    const actualResult = a.processAction(actionString);
    expect(actualResult).toBe(expectedResult);
});

test('move go action', () => {
    const actionString = "move north";
    const expectedResult = 'function: go, args[0]:move, args[1]:north, args[2]:<Object>';
    const actualResult = a.processAction(actionString);
    expect(actualResult).toBe(expectedResult);
});

test('go direction action', () => {
    const actionString = "go north";
    const expectedResult = 'function: go, args[0]:go, args[1]:north, args[2]:<Object>';
    const actualResult = a.processAction(actionString);
    expect(actualResult).toBe(expectedResult);
});

test('go object action', () => {
    const actionString = "go to fruit bowl";
    const expectedResult = 'function: goObject, args[0]:go, args[1]:to, args[2]:fruit bowl, args[3]:<Object>';
    const actualResult = a.processAction(actionString);
    expect(actualResult).toBe(expectedResult);
});

test('cannot continue playing after end game', () => {
    // For this test, we need to use the real player and map, not the stubs
    const realP = new player.Player("Tester");
    const realM = new map.Map();  
    realP.endGame();    
    const realA = new action.Action(realP, realM);

    const expectedResult = '{"verb":"","object0":"","object1":"","description":"Thanks for playing.<br>There\'s nothing more you can do here for now.<br><br>You can either <i>quit</i> and start a fresh game or <i>load</i> a previously saved game.","attributes":{"username":"undefined","money":5,"score":0,"injuriesReceived":0,"bleeding":false,"aggression":0,"health":100,"hp":100,"fed":30,"watered":100,"rested":100,"time": "09:00"}}';
    const actualResult = realA.act("look");
    expect(actualResult).toBe(expectedResult);
});

// added by copilot (with some tweaking)
test('convertActionToElements parses verb and objects correctly', () => {
    a.convertActionToElements("give apple to teacher");
    // _verb, _object0, _object1 are private, but we can test via performPlayerAction stub
    // Since stub returns function: give, args[0]:apple, args[1]:teacher, args[2]:<Object>
    expect(a.performPlayerAction()).toBe("function: give, args[0]:give, args[1]:apple, args[2]:to, args[3]:teacher");
});

test('catchPlayerNotUnderstood returns random apology', () => {
    // Force _object0 and _object1 to empty by parsing nonsense
    a.convertActionToElements("asdfghjkl");
    const result = a.catchPlayerNotUnderstood();
    expect([
        "Sorry, I didn't understand you. Can you try rephrasing that?",
        "Can you try rephrasing that?",
        "I'm struggling to understand you. Can you try something else?",
        "I'm only a simple game. I'm afraid you'll need to try a different verb to get through to me.",
        "What do you want to do with 'asdfghjkl'?<br>You'll need to be a little clearer."
    ]).toContain(result);
});

test('processAction returns special message for self-referencing objects', () => {
    a.convertActionToElements("eat apple with apple");
    // _object0 and _object1 will both be "apple"
    const result = a.processAction("eat apple with apple");
    expect(result).toContain("interact with itself");
});

test('processAction handles swearing', () => {
    a.convertActionToElements("fuck");
    // _verb will be "fuck"
    const result = a.processAction("fuck");
    expect(result).toContain("to you too");
    expect(result).toContain("verbal abuse");
});

test('performPlayerNavigation returns empty string for unknown direction', () => {
    a.convertActionToElements("fly to the moon");
    const result = a.performPlayerNavigation();
    expect(result).toBe("");
});

test('getResultString returns last result string', () => {
    a.act("look at map");
    const result = a.getResultString();
    expect(result).toContain("function: examine, args[0]:look at, args[1]:map");
});

test('handle "look closely" as equivalent of search', () => {
    a.convertActionToElements("look closely at map");
    // called function should be serarch,  _object0 should be "map"
    expect(a.performPlayerAction()).toContain("function: search");
    expect(a.performPlayerAction()).toContain("args[1]:map");
});

test('extractAdverb extracts adverb and strips it', () => {
    a.convertActionToElements("speak quietly to David");
    expect(a.performPlayerAction()).toBe("function: say, args[0]:talk, args[1]:, args[2]:david, args[3]:<Object>");
});