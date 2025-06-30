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

    test('issue #617 attempting to collect venom without a syringe should work in correcrt circumstances only', () => {
        const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');
        let m0 = mb.buildMap();
        let wreckData = {file: "wreckage"};
        let wreck = mb.buildArtefact(wreckData);

        let syringeData = { file: "syringe" };
        let syringe = mb.buildArtefact(syringeData);

        let mugData = { file: "cup" };
        let mug = mb.buildArtefact(mugData);

        let l0 = new location.Location('home', 'home', 'a home location');
        m0.addLocation(l0);
        let p0 = new player.Player({"username":"tester"}, m0, mb);
        p0.setStartLocation(l0);
        p0.setLocation(l0);
        l0.addObject(wreck);

        let result = p0.search('seach', 'wreckage');
        expect(result).toBe("You seach the plane wreckage and discover a pool of zombie venom and a burned corpse.");

        let venom = wreck.getObject("venom");

        result = p0.get('get', venom.getName());

        expect(result).toBe("You're not carrying anything that you can collect the venom into.");
        //p0.put("collect", "venom", "into", "mug");

        l0.addObject(mug);
        result = p0.get('get', venom.getName()); //Get - with mug in location
        expect(result).toBe("You're not carrying anything that you can collect the venom into.");

        result = p0.put("pour", venom.getName(), "into", "mug"); //put/pour
        charges = venom.chargesRemaining();
        expect(result).toBe("You need <i>something else</i> to pour it into."); //@todo this could do with improving

        result = p0.put("put", venom.getName(), "into", "mug"); //put/put
        expect(result).toBe("You need <i>something else</i> to put it into.");

        result = p0.take("collect", "venom", "into", "mug"); //take/collect
        expect(result).toBe("You need <i>something else</i> to collect it into.");

        l0.addObject(syringe);
        var expectedResult = "You add the pool of zombie venom to the hypodermic syringe and needle.$imagesyringe.jpg/$image"; //@todo improve this - default combines wording.
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

        for (let i = 0; i < 50; i++) {
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

    test('checkCloneWithoutMutationUsesOriginalAttributes', () => {
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

        const expectedResult = {"incubationPeriod":2,"communicability":0.5,"symptoms":[{"action":"hurt","health":5,"frequency":0.3,"escalation":0.1}]};
        let clone = c.clone();
        const actualResult = clone.getAttributesToSave(); //we read "attributes to save" as this returns only non-default values. 
        delete actualResult.mutate; //mutation *can* change between cloning.


        console.debug("Expected: " + expectedResult);
        console.debug("Actual  : " + actualResult);   
        expect(actualResult).toStrictEqual(expectedResult);
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

    test('#414 - test symptoms mutatate over time', () => {
        const c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            duration: 5,
            transmission: "bite",
            "symptoms": [
            {
              "action": "hurt",
              "health": 2,
              "frequency": 0.05
            },
            {
              "action": "bite",
              "frequency": 0.16,
              "escalation": 0.02
            }
          ]
        });

        let symptoms = c.getSymptoms();
        const oldSymptoms = symptoms;
        for (s = 0 ; s < 100; s++) { //mutate 100x
            symptoms = c.mutateSymptoms(symptoms);
        };

        //hard to be deterministic given random % changes but rounding up tends higher so... 
        //probe a different value on each symptom
        expect(symptoms[1].escalation).toBeGreaterThan(oldSymptoms[1].escalation);
        expect(symptoms[0].frequency).toBeGreaterThan(oldSymptoms[0].frequency);

    });

    test('#414 - test cloning mutates base (numeric) attributes *and* symptoms', () => {
        //This test may fail very occasionally given the randomness of attributes - 
        //for the more stable attributes we calculate max/min of each and ensure that we have seen at least some variation over time
        let c = new contagion.Contagion("zombie", "zombieism", {
            communicability: 0.5,
            incubationPeriod: 5,
            duration: 10,
            mutate: true,
            transmission: "bite",
            "symptoms": [
            {
              "action": "hurt",
              "health": 2,
              "frequency": 0.05
            },
            {
              "action": "bite",
              "frequency": 0.16,
              "escalation": 0.02
            }
          ]
        });

        let symptoms = c.getSymptoms();
        let attributes = c.getCurrentAttributes();
        const oldSymptoms = symptoms;
        const oldAttributes = attributes;
        let newContagion = c;
        let maxEscalation = oldSymptoms[1].escalation;
        let maxFrequency = oldSymptoms[0].frequency;
        let maxCommunicability = oldAttributes.communicability;
        let maxIncubationPeriod = oldAttributes.incubationPeriod;
        let minIncubationPeriod = oldAttributes.incubationPeriod;
        let maxDuration = oldAttributes.duration; 
        let minDuration = oldAttributes.duration; 
        for (c = 0 ; c < 200; c++) { //mutate 200x
            newContagion = newContagion.clone();

            symptoms = newContagion.getSymptoms();
            attributes = newContagion.getCurrentAttributes();
            if (maxEscalation < symptoms[1].escalation) {maxEscalation = symptoms[1].escalation};
            if (maxFrequency < symptoms[1].frequency) {maxFrequency = symptoms[1].frequency};
            if (maxCommunicability < attributes.communicability) {maxCommunicability = attributes.communicability};
            if (maxIncubationPeriod < attributes.incubationPeriod) {maxIncubationPeriod = attributes.incubationPeriod};
            if (minIncubationPeriod > attributes.incubationPeriod) {minIncubationPeriod = attributes.incubationPeriod};
            if (maxDuration < attributes.duration) {maxDuration = attributes.duration};
            if (minDuration > attributes.duration) {minDuration = attributes.duration};

        };

        //hard to be deterministic given random % changes but rounding up tends higher so 
        //Symptoms tend to increase, attributes are more random/tending toward a middle.
        //probe a different value on each symptom
        expect(maxEscalation).toBeGreaterThan(oldSymptoms[1].escalation);
        expect(maxFrequency).toBeGreaterThan(oldSymptoms[0].frequency);
        expect(maxCommunicability).not.toEqual(oldAttributes.communicability);
        expect(maxIncubationPeriod-minIncubationPeriod).not.toEqual(0); //ensure it at least fluctuates
        expect(maxDuration-minDuration).not.toEqual(0); //ensure it at least fluctuates

    });
});