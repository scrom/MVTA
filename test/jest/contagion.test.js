"use strict";
const contagion = require('../../server/js/contagion.js');
const player = require('../../server/js/player.js');
const map = require('../../server/js/map.js');
const location = require('../../server/js/location.js');
const creature = require('../../server/js/creature.js');
const artefact = require('../../server/js/artefact.js');
const mapBuilder = require('../../server/js/mapbuilder.js');

describe('Contagion', () => {
    test('toStringForContagionDeliversExpectedJSONStringResult', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 10,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "bite", frequency: 0.3, escalation: 0 }],
            duration: -1
        });

        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"incubationPeriod":10,"communicability":0.5,"symptoms":[{"action":"bite","frequency":0.3,"escalation":0}]}}';
        const actualResult = c.toString();
        expect(actualResult).toBe(expectedResult);
    });

    test('consumingItemWithAntibodiesProvidesImmunity', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 10,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "bite", frequency: 0.3, escalation: 0 }],
            duration: -1
        });
        const a = new artefact.Artefact("venom", "venom", "venom", { defaultAction: "drink", canCollect: true, charges: 10, isLiquid: true, isEdible: true, antibodies: ["zombie"] });
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        const playerAttributes = { username: "player" };
        const m0 = new map.Map();
        const p0 = new player.Player(playerAttributes, m0, mb);
        const inv = p0.getInventoryObject();
        inv.add(a);

        p0.setContagion(c);

        // try 10 times as it randomly doesn't take (deliberate)
        var attempts = 0;
        var actualResult = true;
        const expectedResult = false;
        //randomly happens roughly 1 in 3 times
        while (actualResult != expectedResult && attempts < 10) {
            p0.drink("drink", "venom");
            actualResult = p0.hasContagion("zombie");
            console.debug(actualResult);
            attempts++;
        };
        console.debug("Attempts taken before result: "+attempts);

        expect(actualResult).toBe(expectedResult);
    });

    test('consumingItemWithAntibodiesCuresContagion', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 10,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "bite", frequency: 0.3, escalation: 0 }],
            duration: -1
        });
        const a = new artefact.Artefact("venom", "venom", "venom", { defaultAction: "drink", canCollect: true, charges: 3, isLiquid: true, isEdible: true, antibodies: ["zombie"] });
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        const playerAttributes = {
            username: "player",
            contagion: [{
                object: "Contagion",
                name: "zombie",
                displayName: "zombieism",
                attributes: {
                    incubationPeriod: 10,
                    communicability: 0.5,
                    symptoms: [{ action: "bite", frequency: 0.3, escalation: 0 }]
                }
            }]
        };
        const m0 = new map.Map();
        const p0 = new player.Player(playerAttributes, m0, mb);
        const inv = p0.getInventoryObject();
        inv.add(a);

        // try 3 times as it randomly doesn't take (deliberate)
        p0.drink("drink", "venom");
        p0.drink("drink", "venom");
        p0.drink("drink", "venom");

        const expectedResult = false;
        const actualResult = p0.hasContagion("zombie");
        expect(actualResult).toBe(expectedResult);
    });

    
    test('can inject a vaccine into self', () => {
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        let m0 = new map.Map();
        var supportFromAileen = mb.buildMission({ "file": "mission-supportfromaileen" });
        var reward = supportFromAileen.success();
        var syringe = reward.delivers;
        var venomData = {file: "venom" };
        var venom = mb.buildArtefact(venomData);
        let l0 = new location.Location('home', 'home', 'a home location');
        let p0 = new player.Player({"username":"tester"}, m0, mb);
        p0.setStartLocation(l0);
        p0.setLocation(l0);
        l0.addObject(venom);
        l0.addObject(syringe);
        p0.get('get', syringe.getName());
        console.debug(p0.examine("examine", "syringe", null, m0));
        console.debug(p0.get('get', venom.getName()));
        var expectedResult = "You inject yourself with the zombie antibodies. It's probably worth checking your <i>status</i> just to be sure it worked properly.";
        var actualResult = p0.inject('venom', 'self');
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('issue #617 attempting to collect venom without a syringe should not use it up', () => {
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        let m0 = mb.buildMap();
        var venomData = { file: "venom" };
        var venom = mb.buildArtefact(venomData);
        var syringeData = { file: "syringe" };
        var syringe = mb.buildArtefact(syringeData);
        var mugData = { file: "cup" };
        var mug = mb.buildArtefact(mugData);
        let l0 = new location.Location('home', 'home', 'a home location');
        m0.addLocation(l0);
        let p0 = new player.Player({"username":"tester"}, m0, mb);
        p0.setStartLocation(l0);
        p0.setLocation(l0);
        l0.addObject(venom);
        console.debug(p0.get('get', venom.getName()));
        //p0.put("collect", "venom", "into", "mug");
        l0.addObject(mug);
        console.debug("^^ Get - no container - Remaining Venom: "+venom.chargesRemaining());
        console.debug(p0.get("get", "venom"));
        console.debug("^^ Get - with mug in location - Remaining Venom: "+venom.chargesRemaining());
        console.debug(p0.put("pour", "venom", "into", "mug"));
        console.debug("Put/Pour - Remaining Venom: "+venom.chargesRemaining());
        console.debug(p0.examine("examine", "mug"));

        console.debug(p0.position("put", "venom", "mug", "into"));
        console.debug("^^ Position/Put - Remaining Venom: "+venom.chargesRemaining());
        console.debug(p0.examine("examine", "mug"));

        console.debug(p0.take("collect", "venom", "mug"));
        console.debug("^^ Collect - Remaining Venom: "+venom.chargesRemaining());
        console.debug(p0.examine("examine", "mug"));

        l0.addObject(syringe);

        var expectedResult = "xxx";
        var actualResult = p0.get('get', venom.getName());
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('injecting a vaccine provides antibodies', () => {
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        let m0 = new map.Map();
        var supportFromAileen = mb.buildMission({ "file": "mission-supportfromaileen" });
        var reward = supportFromAileen.success();
        var syringe = reward.delivers;
        var venomData = { file: "venom" };
        var venom = mb.buildArtefact(venomData);
        let l0 = new location.Location('home', 'home', 'a home location');
        let p0 = new player.Player({"username":"tester"}, m0, mb);
        p0.setStartLocation(l0);
        p0.setLocation(l0);
        l0.addObject(venom);
        l0.addObject(syringe);
        p0.get('get', syringe.getName());
        console.debug(p0.examine("examine", "syringe", null, m0));
        console.debug(p0.get('get', venom.getName()));
        console.debug(p0.inject('venom', 'self'));
        console.debug(p0.inject('venom', 'self'));
        console.debug(p0.inject('venom', 'self')); //often fails to take on first attempt.
        var expectedResult = true;
        var actualResult = p0.hasAntibodies("zombie");
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult).toBe(expectedResult);
    });

    test('checkContagionEscalationOccurs', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.3, escalation: 0.3 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const minExpectedHealth = 9;
        const expectedFrequency = 1;
        const expectedEscalation = 0.6;
        const expectedResult = "Health Increased: true Frequency:1 Escalation:0.6";

        const resultAttributes = c.getCurrentAttributes();
        const resultSymptoms = resultAttributes.symptoms;
        const resultHealth = resultSymptoms[0].health;
        const resultFrequency = resultSymptoms[0].frequency;
        const resultEscalation = Math.round(resultSymptoms[0].escalation * 100) / 100;

        const healthComparison = resultHealth >= minExpectedHealth;
        const actualResult = `Health Increased: ${healthComparison} Frequency:${resultFrequency} Escalation:${resultEscalation}`;
        expect(actualResult).toBe(expectedResult);
    });

    test('checkSlowContagionEscalationManifestsCorrectly', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.05, escalation: 0.05 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        for (let i = 0; i < 14; i++) {
            c.enactSymptoms(cr);
        }

        const minExpectedHealth = 6;
        const minExpectedFrequency = 0.75;
        const expectedEscalation = 0.07;
        const expectedResult = "Health Increased: true Frequency:true Escalation:true";

        const resultAttributes = c.getCurrentAttributes();
        const resultSymptoms = resultAttributes.symptoms;
        const resultHealth = resultSymptoms[0].health;
        const resultFrequency = resultSymptoms[0].frequency;
        const resultEscalation = Math.round(resultSymptoms[0].escalation * 100) / 100;

        const escalationComparison = resultEscalation >= expectedEscalation;
        const healthComparison = resultHealth >= minExpectedHealth;
        const frequencyComparison = resultFrequency >= minExpectedFrequency;
        const actualResult = `Health Increased: ${healthComparison} Frequency:${frequencyComparison} Escalation:${escalationComparison}`;
        expect(actualResult).toBe(expectedResult);
    });

    test('checkCloneUsesOriginalAttributes', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 2,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.3, escalation: 0.1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"incubationPeriod":2,"communicability":0.5,"symptoms":[{"action":"hurt","health":5,"frequency":0.3,"escalation":0.1}]}}';
        const actualResult = c.clone().toString();
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);   
        expect(actualResult).toBe(expectedResult);
    });

    test('checkCloneWithMutationManglesOriginalAttributes', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            mutate: true,
            incubationPeriod: 2,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.3, escalation: 0.1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const expectedResult = {"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"incubationPeriod":2,"communicability":0.5,"symptoms":[{"action":"hurt","health":5,"frequency":0.3,"escalation":0.1}]}};
        const actualResult = JSON.parse(c.clone().toString());
        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);
        expect(actualResult.name).toBe(expectedResult.name);
        expect(actualResult.attributes).not.toBe(expectedResult.attributes);
        expect(actualResult).not.toBe(expectedResult);
    });

    test('checkIncubationPeriodDeclinesTo0OverTime', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 2,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.3, escalation: 0.1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"originalIncubationPeriod":2,"communicability":0.5,"symptoms":[{"action":"hurt","health":5,"frequency":0.3,"escalation":0.1}]}}';
        const actualResult = c.toString();
        expect(actualResult).toBe(expectedResult);
    });

    test('checkIncubationPeriodDeclinesBy1PointWith1Enaction', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            incubationPeriod: 2,
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 5, frequency: 0.3, escalation: 0.1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);

        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"incubationPeriod":1,"originalIncubationPeriod":2,"communicability":0.5,"symptoms":[{"action":"hurt","health":5,"frequency":0.3,"escalation":0.1}]}}';
        const actualResult = c.toString();
        expect(actualResult).toBe(expectedResult);
    });

    test('checkBitingWorksCorrectlyWithSelfAndOneOtherCreatureInLocation', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "bite", frequency: 1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature1", "creature", "creature", { health: 25 });
        const cr2 = new creature.Creature("creature2", "creature", "creature", { health: 25 });
        const l = new location.Location("location", "location");
        cr.go(null, l);
        cr2.go(null, l);

        const expectedResult = " The creature1 bites the creature2. <br>";
        const actualResult = c.enactSymptoms(cr, l);
        expect(actualResult).toBe(expectedResult);
    });

    test('checkBitingWorksCorrectlyWithSelfAndFourOtherCreaturesInLocation', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "bite", frequency: 1 }],
            duration: -1
        });
        const cr = new creature.Creature("creature1", "creature", "creature", { health: 25 });
        const cr2 = new creature.Creature("creature2", "creature", "creature", { health: 25 });
        const cr3 = new creature.Creature("creature3", "creature", "creature", { health: 25 });
        const cr4 = new creature.Creature("creature4", "creature", "creature", { health: 25 });
        const cr5 = new creature.Creature("creature5", "creature", "creature", { health: 25 });
        const l = new location.Location("location", "location");
        cr.go(null, l);
        cr2.go(null, l);
        cr3.go(null, l);
        cr4.go(null, l);
        cr5.go(null, l);

        // We expect 2 and only 2 creatures to be bitten but it'll be random which 2 it is
        const expectedResult = 80;
        const resultText = c.enactSymptoms(cr, l);
        const actualResult = resultText.length;
        expect(actualResult).toBe(expectedResult);
    });

    test('testSymptomsStopIfDurationIsSet', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 1, frequency: 1 }],
            duration: 5
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        let actualResult = c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);

        const expectedResult = actualResult; // should only see 5 sets of symptoms logged

        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);
        actualResult += c.enactSymptoms(cr);

        expect(actualResult).toBe(expectedResult);
    });

    test('testSymptomDurationDeclinesIfSet', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 1, frequency: 1 }],
            duration: 5
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const actualResult = c.toString();
        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"communicability":0.5,"symptoms":[{"action":"hurt","health":1,"frequency":1}],"duration":3,"originalDuration":5}}';
        expect(actualResult).toBe(expectedResult);
    });

    test('testSymptomsMarkedAsExpiredOnObjectIfDurationIsSet', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            transmission: "bite",
            symptoms: [{ action: "hurt", health: 1, frequency: 1 }],
            duration: 5
        });
        const cr = new creature.Creature("creature", "creature", "creature", { health: 25 });

        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);
        c.enactSymptoms(cr);

        const actualResult = c.toString();
        const expectedResult = '{"object":"Contagion","name":"zombie","displayName":"zombieism","attributes":{"communicability":0.5,"symptoms":[{"action":"hurt","health":1,"frequency":1}],"duration":0,"originalDuration":5}}';
        expect(actualResult).toBe(expectedResult);
    });
});