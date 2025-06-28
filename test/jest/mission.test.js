"use strict";
const mission = require('../../server/js/mission.js');
const missionController = require('../../server/js/missioncontroller.js');
const customAction = require('../../server/js/customaction.js');
const artefact = require('../../server/js/artefact.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const tools = require('../../server/js/tools.js');
const player = require('../../server/js/player.js');

let playerName;
let playerAttributes;
let p0;
let mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
let m0;

beforeEach(done => {
    m0 = mb.buildMap();
    playerName = 'player';
    playerAttributes = { "username": playerName };
    p0 = new player.Player(playerAttributes, m0, mb);
    done();
});

afterEach(done => {
    m0 = null;
    playerName = null;
    playerAttributes = null;
    p0 = null;
    done();
});

test('rewardToStringReturnsValidJSON', () => {
    const keyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "" };
    const fob = new artefact.Artefact('keyfob', 'a key fob', "Carrying this ensures you have access to the office whenever you need.", keyAttributes);
    const keyFob = new mission.Mission('keyFob', null, "Violet has a key fob for you.", { "missionObject": "Violet", "static": true, "dialogue": ["Good morning $player.<br>Welcome aboard! Here's your key fob, you'll need this to get in and out of some parts of the office."] }, null, { isBroken: false }, null, { score: 10, delivers: fob, message: "Have 10 points." });

    const expectedResult = '{"object":"mission","name":"keyfob","description":"Violet has a key fob for you.","attributes":{"missionObject":"Violet", "static":true, "dialogue":["Good morning $player.<br>Welcome aboard! Here\'s your key fob, you\'ll need this to get in and out of some parts of the office."]},"conditionAttributes":{"isBroken":false},"reward":{"score":10, "delivers":{"object":"artefact","name":"keyfob","description":"a key fob","detailedDescription":"Carrying this ensures you have access to the office whenever you need.","attributes":{"weight":0.1,"type":"key","canCollect":true}}, "message":"Have 10 points."}}';
    const actualResult = keyFob.toString();
    expect(actualResult).toBe(expectedResult);
});

test('rewardPositivelyModifiesCreatureAffinity', () => {
    const reward = { "score": 50, "affinityModifier": 5, "increaseAffinityFor": "stephen goodwin", "decreaseAffinityFor": "joel morris", "message": "Congratulations. You killed the spy! Have 50 points." };
    const stephen = m0.getCreature('stephen goodwin');

    customAction.processAffinityModifiers(m0, reward);
    const expectedResult = '<br>He seems to like you.';
    const actualResult = stephen.getAffinityDescription();
    expect(actualResult).toBe(expectedResult);
});

test('rewardModifyLocationCreaturesAltersCreatureHealth', () => {
    const reward = { "modifyLocationCreatures": { "name": "poppy", "health": -350 } };
    const stephen = m0.getCreature('stephen goodwin');

    const m = new mission.Mission('mission');
    m.processReward(m0, reward, p0);
    const expectedResult = "He's really not in good shape.";
    const actualResult = stephen.health();
    expect(actualResult).toBe(expectedResult);
});

test('rewardModifyLocationCreaturesAltersCreatureHealthByPercent', () => {
    const reward = { "modifyLocationCreatures": { "name": "poppy", "health": -0.9 } };
    const stephen = m0.getCreature('stephen goodwin');

    const m = new mission.Mission('mission');
    m.processReward(m0, reward, p0);
    const expectedResult = "He's almost dead.";
    const actualResult = stephen.health();
    expect(actualResult).toBe(expectedResult);
});

test('rewardModifyLocationCreaturesGivesMultipleRepairSkills', () => {
    const reward = { "modifyLocationCreatures": { "name": "poppy", "repairSkills": ["strategy", "management", "faux-pas"] } };
    const stephen = m0.getCreature('stephen goodwin');

    const m = new mission.Mission('mission');
    m.processReward(m0, reward, p0);
    const expectedResult = ["strategy", "management", "faux-pas"];
    const actualResult = stephen.getSkills();
    expect(actualResult).toStrictEqual(expectedResult);
});

test('rewardModifyLocationCreaturesModifiesCash', () => {
    const reward = { "modifyLocationCreatures": { "name": "poppy", "money": -50 } };
    const stephen = m0.getCreature('stephen goodwin');

    const m = new mission.Mission('mission');
    m.processReward(m0, reward, p0);
    const expectedResult = false;
    const actualResult = stephen.canAfford(31); //should only have 30 left after removing 50
    expect(actualResult).toBe(expectedResult);
});

test('rewardNegativelyModifiesCreatureAffinity', () => {
    const reward = { "score": 50, "affinityModifier": 5, "increaseAffinityFor": "stephen goodwin", "decreaseAffinityFor": "joel morris", "message": "Congratulations. You killed the spy! Have 50 points." };
    const joel = m0.getCreature('joel morris');

    customAction.processAffinityModifiers(m0, reward);
    const expectedResult = "<br>He really doesn't like you.";
    const actualResult = joel.getAffinityDescription();
    expect(actualResult).toBe(expectedResult);
});

test('canCompleteHardDiskMissionByInstallingInServer', () => {
    const location = m0.getLocation("machine-room-east");
    const disk = new artefact.Artefact("hard disk", "hard disk", "mission object", { weight: 0.75, price: 50, canCollect: true, componentOf: ["server"] }, null, null);
    location.addObject(disk);
    const server = location.getObject("server");
    const missionObj = server.getMissions()[0];
    missionObj.startTimer();
    p0.setLocation(location);

    var installDisk = p0.put("install", "hard disk", "in", "server");
    console.debug("Install Disk Result: " + installDisk);
    //console.debug("Does server contain disk? " + server.check("hard disk"));

    expect(server.check("hard disk")).toBe(true);

    const result = missionObj.checkState(p0, m0);
    let actualResult = false;
    if (result) { actualResult = true; }
    expect(actualResult).toBe(true);

    missionObj.processReward(m0, result, p0);
    expect(server.check("hard disk")).toBe(false);
});

test('testMissionDialogue', () => {
    const dialogue = [
        "'Psst!'<br>'I've got some covert jobs if you're interested. Are you up for it?'",
        {
            "state": 1,
            "keywords": [
                "yes",
                "ok",
                "yup",
                "y"
            ],
            "response": "'Great! I'd like you to get hold of Stephen Goodwin's sketchbook and bring it to me (<i>steal</i> or <i>mug</i> him if it's easier), I'll make it worth your while.'",
            "nextState": 3
        },
        {
            "state": 1,
            "keywords": [
                "n",
                "no",
                "not",
                "not yet"
            ],
            "response": "'Never mind, your loss. You won't get another chance",
            "nextState": -999
        },
        {
            "state": 1,
            "response": "'Whatever. Check in later if you think you're up to the job.'",
            "nextState": 3
        },
        {
            "state": 3,
            "keywords": [
                "ok"
            ],
            "response": "'Come back when you've got what I'm after.'",
            "nextState": 3
        },
        {
            "state": 3,
            "response": "'Have you got it?'",
            "nextState": 4
        },
        {
            "state": 4,
            "requestedObject": "sketchbook",
            "keywords": [
                "yes",
                "ok",
                "yup",
                "y"
            ],
            "response": "'Excellent!'",
            "nextState": 3
        },
        {
            "state": 4,
            "keywords": [
                "n",
                "no",
                "not",
                "not yet"
            ],
            "response": "'Come back when you've got what I'm after.'",
            "nextState": 3
        },
        {
            "state": 4,
            "response": "'I won't ask again but as i said before, I'll make it worth your while.'"
        }
    ];

    let attributes, initialAttributes, conditionAttributes, failAttributes, reward;
    attributes = {
        "missionObject": "sketchbook",
        "destination": "jordan marshall",
        "static": true,
        "dialogue": dialogue
    }

    failAttributes = { "isDestroyed": true, "conversationState": -999 };
    conditionAttributes = { "isDestroyed": false };
    reward = {
        "affinityModifier": 2, "decreaseAffinityFor": "stephen goodwin", "increaseAffinityFor": "jordan marshall",
        "removeObject": "sketchbook",
        "money": 50,
        "message": "Jordan says 'Nice work!'"
    };

    const mish = new mission.Mission("stealsketchbook", "steal Stephen's sketch book", "steal Stephen's sketch book", attributes, initialAttributes, conditionAttributes, failAttributes, reward);
    mish.startTimer();

    mish.getNextDialogue("");
    mish.getNextDialogue("ok");
    mish.getNextDialogue("ok");
    mish.getNextDialogue("");
    mish.getNextDialogue("no");
    mish.getNextDialogue("");
    mish.getNextDialogue("yes");
    mish.getNextDialogue("");

    const actualResult = mish.getNextDialogue("yes") + " | " + mish.getConversationState();
    const expectedResult = "'Excellent!'$requestsketchbook | 3";
    expect(actualResult).toBe(expectedResult);
});

test('completingAnEventCanCreateANewLocationAndCreature', () => {
    const kitchen = m0.getLocation("kitchen-ground-floor");
    const planeCrash = kitchen.getMissions(true)[0];
    const crashReward = planeCrash.event();
    planeCrash.processReward(m0, crashReward, p0);

    const spy = m0.getCreature('spy');
    const name = spy.getName();
    const location = m0.getLocation("crash-site");
    const locationName = location.getName();

    const expectedResult = "Name: jordan marshall | Location: crash-site";
    const actualResult = "Name: " + name + " | Location: " + locationName;
    expect(actualResult).toBe(expectedResult);
});

test('spyReachingMachineRoomDeliversHardDiskToSpy', () => {
    const kitchen = m0.getLocation("kitchen-ground-floor");
    const planeCrash = kitchen.getMissions(true)[0];
    const crashReward = planeCrash.event();
    planeCrash.processReward(m0, crashReward, p0);

    const spy = m0.getCreature('jordan');
    const missions = spy.getMissions(true);
    let event;
    for (let m = 0; m < missions.length; m++) {
        if (missions[m].getName() == "jordanreachesmachineroom") {
            event = missions[m];
            break;
        }
    }
    event.clearParent();
    event.startTimer();

    const destination = m0.getLocation('machine-room-east');
    spy.go(null, destination);
    m0.updateMissions(1, p0);

    const disk = spy.getObject("hard disk");

    const expectedResult = "hard disk";
    const actualResult = disk.getName();
    expect(actualResult).toBe(expectedResult);
});

test('spyReachingMachineRoomSetsDefaultResultOnServer', () => {
    const kitchen = m0.getLocation("kitchen-ground-floor");
    const planeCrash = kitchen.getMissions(true)[0];
    const crashReward = planeCrash.event();
    planeCrash.processReward(m0, crashReward, p0);

    const spy = m0.getCreature('spy');
    const missions = spy.getMissions(true);
    let event;
    for (let m = 0; m < missions.length; m++) {
        if (missions[m].getName() == "jordanreachesmachineroom") {
            event = missions[m];
            break;
        }
    }
    event.clearParent();
    event.startTimer();

    const destination = m0.getLocation('machine-room-east');
    spy.go(null, destination);
    m0.updateMissions(1, p0);

    const aServer = destination.getObject("server");
    const expectedResult = "$action install disk in server";
    const actualResult = aServer.getDefaultResult();
    expect(actualResult).toBe(expectedResult);
});

test('endofBreakfastClearsAndUpdatesServery', () => {
    const endofBreakfast = m0.getNamedMission("endofbreakfast");
    const reward = endofBreakfast.event();
    endofBreakfast.processReward(m0, reward, p0);

    const kitchen = m0.getLocation("servery-food-bar");

    const expectedResult = "You're in the SQL Servery serving area.<br>The breakfast spread has been cleared away and things are quiet out here whilst the kitchen team prepare for lunch.<br><br>You can see an empty cooking vat.<br>There are exits to the North, East, and West.<br>";
    const actualResult = kitchen.describe();
    expect(actualResult).toBe(expectedResult);
});

test('endofDayEndsGame', () => {
    const endofDay = m0.getNamedMission("endofday");
    const reward = endofDay.event();

    const expectedResult = "<br>It's 5pm. Your first (eventful) day in the office is over.<br>Even if you're part-way through battling a particularly nasty bug we have a strict policy on sending new recruits home on time in their fist week so that's all for today. Off you go.<br><br><br>That's it, game over. Thanks for playing!<br>How did you do?<br>Take a look at your <i>stats</i> to evaluate your performance.<br><br>If you'd like to play again you can either <i>quit</i> and start a new game or <i>load</i> a previously saved game.";
    const actualResult = endofDay.processReward(m0, reward, p0);
    expect(actualResult).toBe(expectedResult);
});

test('installDiskMissionModifiesMultipleObjects', () => {
    const installDisk = m0.getNamedMission("installdisk");
    const reward = installDisk.success();
    installDisk.processReward(m0, reward, p0);

    const machineRoom = m0.getLocation("machine-room-east");
    const aConsole = machineRoom.getObject("console");
    const aServer = machineRoom.getObject("server");

    const expectedResult = "It's a really old-style green screen (or at least it's made to look like one).<br> It's continuously paging through data from somewhere.<br><br>You scan the contents as they run past and pick up the odd mangled word and phrase.<br>'...I 5_!£_ 6!£¬_$@th call for¬@£^ the C~#t of !£* R£@ G~#@'...<br>...'book of summ!£*_+g...<br>...sacri+}[@: souls open _^* gate'...<br>...'eternal ¬~@#'...<br><br>There's much more to this place than just a software company. If only you'd read the small print on your employment contract.<br><br>Let's assume not everyone here is a willing participant in this - and from what you can gather here, the consequences of whatever's going on are unlikely to be localised to just this building.|<--->|The servers look like they can be accessed via a console nearby.";
    const actualResult = aConsole.getDetailedDescription(0, m0, 0) + "|<--->|" + aServer.getDetailedDescription(0, m0, 0);
    expect(actualResult).toBe(expectedResult);
});

test('canGainHuntAttributeFromReadBookMission', () => {
    const initialValue = p0.getHunt();
    const book = m0.getObject('battered book');
    const inv = p0.getInventoryObject();
    inv.add(book);
    p0.read("read", "battered book", m0);
    const resultString = p0.getHunt() - initialValue;

    const expectedResult = "2";
    const actualResult = resultString + "";
    expect(actualResult).toBe(expectedResult);
});

test('canGainStealthAttributeFromReadBookMission', () => {
    const initialValue = p0.getStealth();
    const book = m0.getObject('black book');
    const inv = p0.getInventoryObject();
    inv.add(book);
    p0.read("read", "black book", m0);
    const resultString = p0.getStealth() - initialValue;

    const expectedResult = "4";
    const actualResult = resultString + "";
    expect(actualResult).toBe(expectedResult);
});

test('canCompletePartyBusMission', () => {
    const missionOwner = m0.getCreature('michael weston');
    const atrium = m0.getLocation("atrium");
    let missions = missionOwner.getMissions(true);
    missions = missions.concat(atrium.getMissions(true));
    let mission;
    let preMission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "partybusprep") {
            preMission = missions[i];
        }
        if (missions[i].getName() == "partybus") {
            mission = missions[i];
        }
    }

    p0.addMission(mission);

    preMission.clearParent();
    preMission.getNextDialogue('y', 'y');
    let reward = preMission.checkState(p0, m0);
    preMission.processReward(m0, reward, p0);

    mission.clearParent();
    mission.getNextDialogue('y', 'y');
    mission.startTimer();
    mission.addTicks(250);
    const creatures = m0.getAllCreatures();
    const location = m0.getLocation("bus");
    p0.setLocation(location);
    reward = mission.checkState(p0, m0);
    const resultString = reward.message;

    const expectedResult = "<br>Oh no, you're out of time!<br>The party bus is leaving and you haven't got enough people on board.<hr>You rush out to try and salvage your efforts.<br>As you recover your breath outside and the bus pulls away you see a lick of flame through the windows.<br>Something's very wrong here.<br><br>You watch in horror before finally registering what's happening and dive for cover.<br>As the bus explodes into flames and a piece of shrapnel tears into your leg you realise it could have been so much worse.<br><br>You look around you for survivors. Anyone that made it out alive is going to need urgent medical help!";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canFailPartyBusMission', () => {
    const missionOwner = m0.getCreature('michael weston');
    const atrium = m0.getLocation("atrium");
    let missions = missionOwner.getMissions(true);
    missions = missions.concat(atrium.getMissions(true));
    let mission;
    let preMission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "partybusprep") {
            preMission = missions[i];
        }
        if (missions[i].getName() == "partybus") {
            mission = missions[i];
        }
    }

    p0.addMission(mission);

    preMission.clearParent();
    preMission.getNextDialogue('y', 'y');
    let reward = preMission.checkState(p0, m0);
    preMission.processReward(m0, reward, p0);

    mission.clearParent();
    mission.getNextDialogue('y', 'y');
    mission.startTimer();
    mission.addTicks(150);
    const creatures = m0.getAllCreatures();
    const location = m0.getLocation("bus");
    for (let i = 0; i < creatures.length; i++) {
        creatures[i].go("", location);
        if (i == 7) { break; }
    }
    p0.setLocation(atrium);
    reward = mission.checkState(p0, m0);
    const resultString = reward.message;

    const expectedResult = "<br><br>It looks like you're doing well at getting people onto the bus. Great job!<br>It's often hard work herding people around here.<hr>You dash out to the front of the office to check for stragglers and as you recover your breath you smell smoke on the air.<br>Something's very wrong here.<br><br>As precious seconds pass, you register what's happening and dive for cover.<br>The bus explodes into flames before your eyes and you realise you've just lured some of your new friends and colleagues to their doom.<br>Your senses slowly recover to a feeling of numbness in your arm and blood on your hands.";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('completingPartyBusMissionTeleportsPlayer', () => {
    const missionOwner = m0.getCreature('michael weston');
    const atrium = m0.getLocation("atrium");
    let missions = missionOwner.getMissions(true);
    missions = missions.concat(atrium.getMissions(true));
    let mission;
    let preMission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "partybusprep") {
            preMission = missions[i];
        }
        if (missions[i].getName() == "partybus") {
            mission = missions[i];
        }
    }

    p0.addMission(mission);

    preMission.clearParent();
    preMission.getNextDialogue('y', 'y');
    let reward = preMission.checkState(p0, m0);
    preMission.processReward(m0, reward, p0);

    mission.clearParent();
    mission.startTimer();
    mission.addTicks(250);
    const creatures = m0.getAllCreatures();
    const location = m0.getLocation("bus");
    p0.setLocation(atrium);
    reward = mission.checkState(p0, m0);

    mission.processReward(m0, reward, p0);
    const resultString = p0.examine("look", "", m0);

    const expectedResult = "You're standing outside the front of the Porta Rossa offices.<br>The weather has turned grey, damp and miserable.<br>A smell of smoke lingers in the air and the wreckage outside the office seems to be piling up.<br><br>You can't shake the feeling something is deeply wrong here.<br><br>You can see an ice cream man.<br>There are exits to the South, East, and West.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('completingPartyBusMissionInjuresNPCs', () => {
    const missionOwner = m0.getCreature('michael weston');
    const atrium = m0.getLocation("atrium");
    let missions = missionOwner.getMissions(true);
    missions = missions.concat(atrium.getMissions(true));
    let mission;
    let preMission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "partybusprep") {
            preMission = missions[i];
        }
        if (missions[i].getName() == "partybus") {
            mission = missions[i];
        }
    }

    p0.addMission(mission);

    preMission.clearParent();
    preMission.getNextDialogue('y', 'y');
    let reward = preMission.checkState(p0, m0);
    preMission.processReward(m0, reward, p0);

    mission.clearParent();
    mission.getNextDialogue('y', 'y');
    mission.startTimer();
    mission.addTicks(250);
    const creatures = m0.getAllCreatures();
    const location = m0.getLocation("bus");
    const locationCreatures = [];
    for (let i = 0; i < creatures.length; i++) {
        creatures[i].go("", location);
        locationCreatures.push(creatures[i]);
        if (i == 5) { break; }
    }
    p0.setLocation(location);

    reward = mission.checkState(p0, m0);

    mission.processReward(m0, reward, p0);

    const resultString = "Creature[3]: " + locationCreatures[3].health();

    const expectedResult = "Creature[3]: He's really not in good shape.";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('failingPartyBusMissionKillsNPCs', () => {
    const missionOwner = m0.getCreature('michael weston');
    const atrium = m0.getLocation("atrium");
    let missions = missionOwner.getMissions(true);
    missions = missions.concat(atrium.getMissions(true));
    let mission;
    let preMission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "partybusprep") {
            preMission = missions[i];
        }
        if (missions[i].getName() == "partybus") {
            mission = missions[i];
        }
    }

    p0.addMission(mission);

    preMission.clearParent();
    preMission.getNextDialogue('y', 'y');
    let reward = preMission.checkState(p0, m0);
    preMission.processReward(m0, reward, p0);

    mission.clearParent();
    mission.getNextDialogue('y', 'y');
    mission.startTimer();
    mission.addTicks(150);
    const creatures = m0.getAllCreatures();
    const location = m0.getLocation("bus");
    for (let i = 0; i < creatures.length; i++) {
        creatures[i].go("", location);
        if (i == 7) { break; }
    }
    p0.setLocation(location);
    reward = mission.checkState(p0, m0);

    mission.processReward(m0, reward, p0);
    const resultString = m0.getDeathTollReport();

    const expectedResult = "Friendly death toll: 8<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canCompleteKillSpyMission', () => {
    const kitchen = m0.getLocation("kitchen-ground-floor");
    const planeCrash = kitchen.getMissions(true)[0];
    const crashReward = planeCrash.event();
    planeCrash.processReward(m0, crashReward, p0);

    const spy = m0.getCreature('spy');
    let missions = spy.getMissions(true);
    let mission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "killthespy") {
            mission = missions[i];
            break;
        }
    }

    mission.clearParent();

    const location = m0.getLocation("crash-site");
    p0.setLocation(location);
    spy.kill();

    const resultString = m0.updateMissions(1, p0);

    const expectedResult = "<br><br>Jordan (the spy) is dead! Let's hope that's the end of all our troubles.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canCompleteKillSpyMissionWhenSpyDiesBeforePlayerReachesThem', () => {
    const kitchen = m0.getLocation("kitchen-ground-floor");
    const planeCrash = kitchen.getMissions(true)[0];
    const crashReward = planeCrash.event();
    planeCrash.processReward(m0, crashReward, p0);

    const spy = m0.getCreature('spy');
    let missions = spy.getMissions(true);
    let mission;
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "killthespy") {
            mission = missions[i];
            break;
        }
    }

    mission.clearParent();

    spy.kill();

    const location = m0.getLocation("crash-site");
    p0.setLocation(location);

    const resultString = m0.updateMissions(1, p0);

    const expectedResult = "<br><br>Jordan (the spy) is dead! Let's hope that's the end of all our troubles.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canCompleteReadArticleMission', () => {
    const book = m0.getObject("solid article");
    m0.removeObject("solid article");
    const inv = p0.getInventoryObject();
    inv.add(book);

    const resultString = p0.read("read", "article", m0);
    const expectedResult = "You read 'Learn on the Loo' article.$imagesolid.jpg/$image<br>'Do Me a SOLID'.  What a <i>great</i> name for an article on the back of a toilet cubicle door.<br>You admit it <i>does</i> bring you a little smile.<br>It goes on to describe SOLID design principles in software development. It finishes with a reference to <a href=https://en.wikipedia.org/wiki/SOLID target=_blank>Wikipedia</a> online.<br><i>(Seriously, don't ever read the source code for this game!)</i><br>Congratulations. You've learned the basics on how to develop good software architecture.<br>$imagesolid.jpg/$image";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canGainSkillsFromReadingManual', () => {
    const book = m0.getObject("coffee machine manual");
    const inv = p0.getInventoryObject();
    inv.add(book);

    p0.read("read", "manual", m0);
    const resultString = p0.getSkills();
    const expectedResult = ["coffee machine"];
    const actualResult = resultString;
    expect(actualResult).toStrictEqual(expectedResult);
});

test('canGetBulbFromAmandaTalkingMission', () => {
    const missions = m0.getAllMissions();
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "teachprojectorrepair") {
            missions[i].clearParent();
        }
    }

    const angelina = m0.getCreature('angelina');
    const location = m0.getLocation("is-area");
    p0.setLocation(location);

    p0.say("talk", null, "angelina");
    p0.say("talk", "ok", "angelina");
    const resultString = m0.updateMissions(1, p0);

    const expectedResult = "<br>Angelina hands you a projector bulb.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('canRepairProjectorWithBulbAndSkills', () => {
    const missions = m0.getAllMissions();
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "teachprojectorrepair") {
            missions[i].clearParent();
        }
    }

    const angelina = m0.getCreature('angelina');
    let location = m0.getLocation("is-area");
    p0.setLocation(location);

    p0.say("talk", null, "angelina");
    p0.say("talk", "ok", "angelina");
    m0.updateMissions(1, p0);

    location = m0.getLocation("poppy");
    p0.setLocation(location);
    const resultString = p0.repair('repair', 'projector');

    const expectedResult = "You fixed the projector and put the projector bulb you were carrying into it.<br><br>Great job! Next time there's a meeting in here, nobody will curse the previous occupants.<br>Curses can only lead to <i>bad things!</i><br>";
    const actualResult = resultString + m0.updateMissions(1, p0);
    expect(actualResult).toBe(expectedResult);
});

test('bulbFromAmandaTalkingMissionIsLeftInLocationIfInventoryIsFull', () => {
    const missions = m0.getAllMissions();
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "teachprojectorrepair") {
            missions[i].clearParent();
        }
    }

    const angelina = m0.getCreature('angelina');
    const location = m0.getLocation("is-area");
    p0.setLocation(location);

    const inv = p0.getInventoryObject();
    inv.setCarryWeight(0);

    p0.say("talk", null, "angelina");
    p0.say("talk", "ok", "angelina");
    m0.updateMissions(1, p0);

    const loc = p0.getCurrentLocation();
    const resultString = loc.objectExists("bulb");

    const expectedResult = true;
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('playerIsToldThatBulbFromAmandaTalkingMissionIsLeftInLocationIfInventoryIsFull', () => {
    const missions = m0.getAllMissions();
    for (let i = 0; i < missions.length; i++) {
        if (missions[i].getName() == "teachprojectorrepair") {
            missions[i].clearParent();
        }
    }

    const angelina = m0.getCreature('angelina');
    const location = m0.getLocation("is-area");
    p0.setLocation(location);

    const inv = p0.getInventoryObject();
    inv.setCarryWeight(0);

    p0.say("talk", null, "angelina");
    p0.say("talk", "ok", "angelina");
    const resultString = m0.updateMissions(1, p0);

    const expectedResult = "<br>Angelina hands you a projector bulb.<br>Unfortunately it's too heavy for you to carry right now.<br>You leave it here to collect when you're ready.";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

test('clearingSingleParentForMissionWith2AndParentsOnlyClearsSingleParent', () => {
    const mc = new missionController.MissionController();

    const childMission = m0.getNamedMission("lunchtime");
    const parentMission1 = m0.getNamedMission("tomatoesformelanie");
    const parentMission2 = m0.getNamedMission("startoflunch");

    mc.initiateNewChildMissions(childMission, ["tomatoesformelanie"], p0, p0.getCurrentLocation(), "melanie sheldon");

    m0.updateMissions(1, p0);

    //curiously, the nodeunit version of this test sees 2 strings returned and passes. 
    //Have modified the Jest version to pass following what the code *does* currently but unclear whether string or array should be returned (see TODO in mission.js)
    const expectedResult = {"allOf": ["startoflunch"]};
    const actualResult = childMission.getParents();
    expect(actualResult).toStrictEqual(expectedResult);
});

test('clearingBothParentsForMissionWith2AndParentsWillSuccessfullyActivateMission', () => {
    const mc = new missionController.MissionController();

    const childMission = m0.getNamedMission("lunchtime");
    const parentMission1 = m0.getNamedMission("tomatoesformelanie");
    const parentMission2 = m0.getNamedMission("startoflunch");

    mc.initiateNewChildMissions(childMission, ["tomatoesformelanie"], p0, p0.getCurrentLocation(), "melanie sheldon");
    mc.initiateNewChildMissions(childMission, ["startoflunch"], p0, p0.getCurrentLocation(), "melanie sheldon");

    m0.updateMissions(1, p0);

    const expectedResult = true;
    const actualResult = childMission.isActive();
    expect(actualResult).toBe(expectedResult);
});

    test('clearingSingleParentForMissionWith2_OR_ParentsClearsAllParents', () => {
        const mc = new missionController.MissionController();

        const missionJSONString = {
            "object": "mission",
            "name": "test mission",
            "displayName": "will it build?",
            "attributes": {
                "type": "event",
                "parent": { "option1": "or", "option2": "or" }
            },
            "conditionAttributes": {
                "time": "666"
            },
            "reward": {
                "message": "tadaaa!"
            }
        };

        var mission = mb.buildMission(missionJSONString);
        p0.addMission(mission);
        // mission parents are cleared in missionController.initiateNewChildMissions
        mc.initiateNewChildMissions(mission, ["option2"], p0, p0.getCurrentLocation(), null);

        m0.updateMissions(1, p0);

        var expectedResult = "none";
        var actualResult = mission.getParents();
        expect(actualResult).toBe(expectedResult);
    });

    test('lunchWillIncludeRoastIfTomatoesMissionIsCompleted', () => {
        const mc = new missionController.MissionController();

        const childMission = m0.getNamedMission("lunchtime");
        const parentMission1 = m0.getNamedMission("tomatoesformelanie");
        const parentMission2 = m0.getNamedMission("startoflunch");

        p0.addMission(childMission);

        mc.initiateNewChildMissions(childMission, ["tomatoesformelanie"], p0, p0.getCurrentLocation(), "melanie sheldon");
        mc.initiateNewChildMissions(childMission, ["startoflunch"], p0, p0.getCurrentLocation(), "melanie sheldon");

        m0.updateMissions(1, p0);
        m0.updateMissions(2, p0);

        const foodbar = m0.getLocation("servery-food-bar");
        const servery = m0.getLocation("servery-main");
        const nutRoast = foodbar.getObject("nut roast");
        const roast = foodbar.getObject("roast");
        const smellObject = servery.getObject("smell of food");
        const smell = smellObject.getSmell();
        const expectedSmell = "It smells like roast dinner day. There's usually meat and vegetarian options.<br>Gotta love the free food in this place!";

        const expectedResult = nutRoast.getName() + "||" + roast.getName() + "||" + expectedSmell;
        const actualResult = "nut roast||" + "roast||" + smell;
        expect(actualResult).toBe(expectedResult);
    });

    test('timedPlayerEventCanBeCompletedWithMessageToPlayer', () => {
        const mc = new missionController.MissionController();

        const childMission = m0.getNamedMission("lunchtime");
        const parentMission1 = m0.getNamedMission("tomatoesformelanie");
        const parentMission2 = m0.getNamedMission("startoflunch");

        p0.addMission(childMission);

        mc.initiateNewChildMissions(childMission, ["tomatoesformelanie"], p0, p0.getCurrentLocation(), "melanie sheldon");
        mc.initiateNewChildMissions(childMission, ["startoflunch"], p0, p0.getCurrentLocation(), "melanie sheldon");

        m0.updateMissions(1, p0);
        const resultString = m0.updateMissions(2, p0);
        const expectedResult = "<br>It's time to enjoy the wonders of our kitchen and the results of all your help so far.<br>The food they provide here is pretty amazing.<br>";
        expect(resultString).toBe(expectedResult);
    });

    test('mapBuilderCanHandleBuildingAMissionWith_OR_ParentsDefined', () => {
        const missionJSONString = {
            "object": "mission",
            "name": "test mission",
            "displayName": "will it build?",
            "attributes": {
                "type": "event",
                "parent": { "option1": "or", "option2": "or" }
            },
            "conditionAttributes": {
                "time": "666"
            },
            "reward": {
                "message": "tadaaa!"
            }
        };

        const mission = mb.buildMission(missionJSONString);

        const expectedResult = '{"object":"mission","name":"test mission","displayName":"will it build?","attributes":{"type":"event", "parents":{"anyOf":["option1","option2"]}},"conditionAttributes":{"time":"666"},"reward":{"message":"tadaaa!"}}';
        const actualResult = mission.toString();
        expect(actualResult).toBe(expectedResult);
    });

    test('clearingSingleParentForMissionWith2_AND_ParentsAsObjectOnlyClearsOneParent', () => {
        const mc = new missionController.MissionController();

        const missionJSONString = {
            "object": "mission",
            "name": "test mission",
            "displayName": "will it build?",
            "attributes": {
                "type": "event",
                "parent": { "option1": "and", "option2": "and" }
            },
            "conditionAttributes": {
                "time": "666"
            },
            "reward": {
                "message": "tadaaa!"
            }
        };

        const mission = mb.buildMission(missionJSONString);
        p0.addMission(mission);

        mc.initiateNewChildMissions(mission, ["option2"], p0, p0.getCurrentLocation(), null);

        m0.updateMissions(1, p0);

        const expectedResult = '{"allOf":["option1"]}';
        const actualResult = tools.literalToString(mission.getParents());
        expect(actualResult).toBe(expectedResult);
    });

    test('clearingPlayerReachesCrashSiteEventActivatesSupportFromAileenMission', () => {
        const mc = new missionController.MissionController();

        const kitchen = m0.getLocation("kitchen-ground-floor");
        const planeCrash = kitchen.getMissions(true)[0];

        m0.completeNamedMission("planecrash", p0);
        p0.setLocation(kitchen);
        p0.tick(1, m0);
        p0.tick(2, m0);
        mc.updateMissions(2, p0, m0);
        mc.updateMissions(2, p0, m0);

        const aileen = m0.getCreature("aileen emerson");
        const book = aileen.getObject("survival book");
        const playerInventory = p0.getInventoryObject();
        playerInventory.add(book);

        p0.read("read", "survival book", m0);
        mc.updateMissions(2, p0, m0);

        const playerreachescrashsite = m0.getNamedMission("playerreachescrashsite");

        const crashSite = m0.getLocation("crash-site");
        p0.setLocation(crashSite);
        p0.tick(6, m0);
        mc.updateMissions(4, p0, m0);
        mc.updateMissions(1, p0, m0);

        const supportfromaileen = m0.getNamedMission("supportfromaileen");

        const expectedResult = "Is Aileen hunting player? true";
        const actualResult = "Is Aileen hunting player? " + aileen.isHuntingPlayer();
        expect(actualResult).toBe(expectedResult);
    });

    test('playerReachesCrashSiteEventCanBeCompleted', () => {
        const mc = new missionController.MissionController();

        const kitchen = m0.getLocation("kitchen-ground-floor");
        const planeCrash = kitchen.getMissions(true)[0];

        m0.completeNamedMission("planecrash", p0);
        p0.setLocation(kitchen);
        p0.tick(1, m0);
        p0.tick(2, m0);
        mc.updateMissions(2, p0, m0);
        mc.updateMissions(2, p0, m0);

        const aileen = m0.getCreature("aileen emerson");
        const book = aileen.getObject("survival book");
        const playerInventory = p0.getInventoryObject();
        playerInventory.add(book);

        p0.read("read", "survival book", m0);
        mc.updateMissions(2, p0, m0);

        const playerreachescrashsite = m0.getNamedMission("playerreachescrashsite");

        const crashSite = m0.getLocation("crash-site");
        p0.setLocation(crashSite);
        p0.tick(6, m0);
        mc.updateMissions(4, p0, m0);
        mc.updateMissions(1, p0, m0);

        const expectedResult = true;
        const actualResult = playerreachescrashsite.isFailedOrComplete();
        expect(actualResult).toBe(expectedResult);
    });

    
test('canSucceedCounterIntuitiveDestroyScreenMission', () => {
    const screen = m0.getObject("screen");
    const atrium = m0.getLocation("atrium")

    p0.setLocation(atrium);
    var examine = p0.examine("examine", "screen", null, m0);
    console.debug(examine);

    const mc = new missionController.MissionController();
    var activated = mc.activateNamedMission("destroyscreen", [atrium], p0);
    console.debug(activated);
    m0.updateMissions(40, p0);

    const resultString = m0.updateMissions(1, p0);
    const expectedResult = "<br><br>Did you forget to trash the screen in the Atrium?<br>Looks like you missed your chance now things are a little busier around here.<br>To be honest, it's probably better that you left it alone anyway.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});
  
test('canFailCounterIntuitiveDestroyScreenMission', () => {
    const screen = m0.getObject("screen");
    const atrium = m0.getLocation("atrium")

    p0.setLocation(atrium);
    var examine = p0.examine("examine", "screen", null, m0);
    console.debug(examine);

    const mc = new missionController.MissionController();
    var activated = mc.activateNamedMission("destroyscreen", [atrium], p0);
    console.debug(activated);
    var destroy = p0.breakOrDestroy("destroy", "screen"); 
    console.debug(destroy);

    const resultString = m0.updateMissions(1, p0);
    const expectedResult = "<br><br>Bad you! Sometimes you just have to resist your violent urges.<br>Just to make things worse you manage to cut yourself on the splintered screen.<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});

  
test('can Sign In and get keyfobMission', () => {
    const reception = m0.getLocation("reception")

    p0.setLocation(reception);
    var say = p0.say("talk", "", "vi", m0);
    const expectedSay = "'Good morning. You must be $player.'<br>'Welcome aboard!'$imagevioletwilmott.jpg/$image<br>"
    expect(say).toBe(expectedSay);
    m0.updateMissions(2, p0);

    const mc = new missionController.MissionController();
    var activated = mc.activateNamedMission("mission-keyfob", [reception], p0);
    console.debug(activated);
    var destroy = p0.writeOrDraw("sign", "$player", "visitors book");
    console.debug(destroy);

    const resultString = m0.updateMissions(1, p0);
    const expectedResult = "<br><br>Violet Says 'Here's your key fob.'<br>'You'll need it to get in and out of some parts of the office.'<br>";
    const actualResult = resultString;
    expect(actualResult).toBe(expectedResult);
});