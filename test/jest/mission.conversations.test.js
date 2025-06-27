"use strict";
const mapBuilder = require('../../server/js/mapbuilder.js');
const player = require('../../server/js/player.js');
const location = require('../../server/js/location.js');

let playerName;
let playerAttributes;
let p0;
let mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
let m0;
let l0;

beforeEach(done => {
    //build map, create new empty location and put player in it.
    m0 = mb.buildMap();
    l0 = new location.Location('home', 'home', 'a home location');
    m0.addLocation(l0);
    playerName = 'player';
    playerAttributes = { "username": playerName, carryWeight:25 };
    p0 = new player.Player(playerAttributes, m0, mb);
    p0.setStartLocation(l0);
    p0.setLocation(l0);
    done();
});

afterEach(done => {
    m0 = null;
    l0 = null;
    playerName = null;
    playerAttributes = null;
    p0 = null;
    done();
});
test('test a conversation that fails a mission', () => {
    //say no, then yes to the ice cream man
    var character = mb.buildCreature({ "file": "ice-cream-man" });
    l0.addObject(character);
    var missions = character.getMissions(true);
    var testMission = missions[0];
    testMission.clearParent();
    var missionOwner = character;

    const result1 = p0.say("talk", "hello", "", m0);
    expect(result1).toBe("'Hi $player.'<br>'Would you like an ice cream?'$imageicecreamman.jpg/$image<br>");

    const state1 = testMission.checkState (p0, m0, missionOwner);
    expect(state1).toBe(null);

    const result2 = p0.say("talk", "no", "", m0);
    expect(result2).toBe("'No strings attached, honest!'<br>'Are you <i>sure</i>?'$imageicecreamman.jpg/$image<br>");

    const result3 = p0.say("talk", "yes", "", m0);
    expect(result3).toBe("'You people amaze me.'<br>'Maybe you have trust issues or something.'<br>'Nevermind... Your loss.' $imageicecreamman.jpg/$image<br>");

    const actualResult = testMission.checkState (p0, m0, missionOwner);
    expect(actualResult.fail).toBe(true);
    expect(actualResult.message).toBe("<br>Too bad. A free ice cream might have been useful.<br>Ah well, on with the work.");

});

test('test a conversation that passes a mission', () => {
    //try fix chris; bike mission
    var character = mb.buildCreature({ "file": "chris-maddox" });
    l0.addObject(character);
    var missions = character.getMissions(true);
    var testMission = missions[0];
    testMission.clearParent();
    var missionOwner = character;

    const result1 = p0.say("talk", "hello", "", m0);
    expect(result1).toBe("'Hi $player.'<br>'I've just got a new bike but it's not set up properly.'<br>'I've booked it in for repairs but I'm flat-out all day today.'<br>'Could you do me a favour and take it for a service?'$imagechrismaddox.jpg/$image<br>");

    const state1 = testMission.checkState (p0, m0, missionOwner);
    expect(state1).toBe(null);

    const result2 = p0.say("talk", "yes", "", m0);
    expect(result2).toBe("'Cheers $player.'<br>'You'll need to <i>search</i> through the racks for it I'm afraid.'$imagechrismaddox.jpg/$image<br>");

    const result3 = p0.say("talk", "ok", "", m0); //ideally would love a delay in time here fr player to find bike and come back. //or for player to ask for key
    expect(result3).toBe("'Hey $player.'<br>'Have you been able to sort my bike out yet?'$imagechrismaddox.jpg/$image<br>");

    const result4 = p0.say("talk", "no", "", m0);
    expect(result4).toBe("'Oops. You'll need the key. Here you go.'$imagechrismaddox.jpg/$image<br>");   

    const actualResult = testMission.checkState (p0, m0, missionOwner);
    expect(actualResult.message).toBe("Chris hands you a bike key.");
    expect(actualResult.delivers.getName()).toBe("bike key"); //we get a real object delivered back

});

test('test a single message conversation passes', () => {
    //say yes to Angelina
    var character = mb.buildCreature({ "file": "angelina-morrison" });
    l0.addObject(character);
    var missions = character.getMissions(true);
    var testMission = missions[0];
    testMission.clearParent();
    var missionOwner = character;

    const result1 = p0.say("talk", "hello", "angel", m0);
    expect(result1).toBe("'Hi $player.'<br>'Would you be willing to help me out with a quick (but fairly urgent) maintenance job?'$imageangelinamorrison.jpg/$image<br>");
    const state1 = testMission.checkState (p0, m0, missionOwner);
    expect(state1).toBe(null);

    const result2 = p0.say("talk", "sure", "angel", m0);
    expect(result2).toBe("'Thankyou!'<br>'It's pretty simple, I need someone to fix the projector in <i>Poppy</i> for me.'<br>'I think someone knocked it off of the table'<br>'Here's a bulb. You might need to do a bit of a <i>repair</i> on it as well though.'$imageangelinamorrison.jpg/$image<br>");

    const actualResult = testMission.checkState(p0, m0, missionOwner);

    expect(actualResult.delivers.getName()).toBe("bulb"); //we get a real object delivered back
    expect(actualResult.message).toBe("Angelina hands you a projector bulb.");
    expect(actualResult.repairSkill).toBe("projector");

});

test('test we can check for failed conversation', () => {
    //try this with destroy maracas
    //player.say(verb, speech, receiverName, map)
    var character = mb.buildCreature({ "file": "chris-warrington" });
    l0.addObject(character);
    var missions = character.getMissions(true);
    var testMission = missions[0];
    testMission.clearParent();
    var missionOwner = character;

    const result1 = p0.say("talk", "hello", "chris", m0);
    expect(result1).toBe("'Hi $player.'<br>'I think I made a terrible mistake.'<br>'After the last Porta Rossa day out I offered a prize to whoever could guess the full list of samples used in one of my tracks.'<br>'Unfortunately for all of us, Jim Dobbins won.'<br>'Now in addition to his boundless positivity he's liable to shake his maracas at people.'<br>'Can you get hold of them and quietly <i>destroy</i> them whilst nobody's looking?'$imagechriswarrington.jpg/$image<br>");
    const state1 = testMission.checkState (p0, m0, missionOwner);
    expect(state1).toBe(null);

    const result2 = p0.say("talk", "no", "chris", m0);
    expect(result2).toBe("'Fine. Forget I asked.'$imagechriswarrington.jpg/$image<br>");

    const actualResult = testMission.checkState (p0, m0, missionOwner);
    const expectedResult = {"affinityModifier": 1, "decreaseAffinityFor": "chris warrington", "fail": true, "message": "<br>You know, refusing to help people out on your first day in the office is going to put you on the fast track to nowhere."};
    expect(actualResult.fail).toBe(true);
    expect(actualResult.affinityModifier).toBe(1);    
    expect(actualResult.decreaseAffinityFor).toBe("chris warrington");    
    expect(actualResult.message).toBe("<br>You know, refusing to help people out on your first day in the office is going to put you on the fast track to nowhere.");
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test a creature will initiate conversation', () => {
    //try this with Lou's find Dan and R mission.
    var character = mb.buildCreature({ "file": "lou-boynton" });
    l0.addObject(character);
    character.go("",l0); //sets curent location   
    var missions = character.getMissions(true);
    var testMission = missions[0];
    testMission.clearParent();
    var missionOwner = character;

    var tick = character.tick(1, m0, p0);
    expect(tick).toEqual("<br>Lou Boynton approaches you.<br>'Hi $player.'<br>'Daniel and Robin are supposed to be flying back from a comic book convention today.'<br>'I don't suppose you've seen them around anywhere have you?'$imagelouboynton.jpg/$image<br>");

    const result2 = p0.say("talk", "no", "lou", m0);
    expect(result2).toBe("'Well. I hope they're ok. They sounded a bit rough last time I spoke to them.'<br>'Keep an eye out for them if you can.'$imagelouboynton.jpg/$image<br>");

    const actualResult = testMission.checkState (p0, m0, missionOwner);;
    expect(actualResult).toStrictEqual({}); //empty success object  - no message, no actions.

    tick = character.tick(1, m0, p0);
    expect(tick).toEqual("");
});


test('test what happens when a creature does not understand a player', () => {
    //not actually mission related - making sure plyer not bing understood works in test
    var character = mb.buildCreature({ "file": "chris-warrington" });
    l0.addObject(character);
    character.go("",l0); //sets curent location

    const result1 = p0.say("talk", "hello", "chris", m0);
    expect(result1).toEqual(expect.stringContaining("He says '"));
    expect(result1).toEqual(expect.stringContaining("$imagechriswarrington.jpg/$image<br>"));
    
    const actualResult = p0.say("talk", "beady beady boop boop", "chris", m0);
    expect(actualResult).toEqual(expect.stringContaining("Chris says '"));
    expect(actualResult).toEqual(expect.stringContaining("$imagechriswarrington.jpg/$image<br>"));
});

/*add tests for:
checkFailedConversation
checkPassedConversation
*/