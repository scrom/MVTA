"use strict";
const creature = require('../../server/js/creature.js');
const player = require('../../server/js/player.js');
const artefact = require('../../server/js/artefact.js');
const contagion = require('../../server/js/contagion.js');
const mission = require('../../server/js/mission.js');
const location = require('../../server/js/location.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const map = require('../../server/js/map.js');

let mb;
let junkAttributes;
let a0;
let weakWeaponAttributes;
let lightWeaponAttributes

const removeAllDoorsInMap = function(map) {
    var locations = map.getLocations();
    for (var l=0;l<locations.length;l++) {
        var doors = locations[l].getAllObjectsOfType("door");
        for (var d=0;d<doors.length;d++) {
            var exits = doors[d].getLinkedExits();
            for (var e=0;e<exits.length;e++) {
                exits[e].show();
            };
            locations[l].removeObject(doors[d].getName());
        };
        var exits = locations[l].getE
    };
};

beforeEach(() => {
    mb = new mapBuilder.MapBuilder('../../data/','root-locations');
    junkAttributes = {weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false};
    a0 = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',junkAttributes, null);

    weakWeaponAttributes = {weight: 1, attackStrength: 8, type: "weapon", subType: "blunt", canCollect: true};
    lightWeaponAttributes = {weight: 2, attackStrength: 12, type: "weapon", subType: "blunt", canCollect: true};
});

afterEach(() => {
    junkAttributes = null;
    a0 = null;
    mb = null;
});

//creature constructor params are: (aname, aDescription, aDetailedDescription, weight, aType, carryWeight, health, affinity, carrying)
test('canCreateCreature', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    var expectedResult = '{"object":"creature","name":"creature","displayName":"the creature","description":"beastie","detailedDescription":"a big beastie with teeth","attributes":{"weight":120,"attackStrength":50,"type":"creature","carryWeight":50,"health":150}}';
    var actualResult = c0.toString();
    expect(actualResult).toBe(expectedResult);
});

test('canRetrieveACurrentAttribute', () => {
    var expectedResult = 120;
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});  
    var actualResult = c0.getCurrentAttributes().weight;
    expect(actualResult).toBe(expectedResult);
});

test('canCreateCreatureWithSingleObject', () => {
    var creatureName = 'creature';
    var creatureDescription = 'beastie'
    var creatureDetailedDescription = "It's a big beastie with teeth.";
    var artefactDescription = 'artefact of little consequence';
    var c0 = new creature.Creature(creatureName, creatureDescription, creatureDetailedDescription,{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0}, a0);
    var expectedResult = creatureDetailedDescription+"<br>"+"It's carrying an "+artefactDescription+'.';
    expect(c0.getDetailedDescription()).toBe(expectedResult);
});

test('canCreateCreatureWithMultipleObjects', () => {
    var creatureName = 'creature';
    var creatureDescription = 'beastie'
    var creatureDetailedDescription = "It's a big beastie with teeth.";
    var artefactDescription = 'artefact of little consequence';
    var anotherArtefactDescription = 'second artefact of little consequence';
    var anotherArtefactName = 'another artefact'
    var a1 = new artefact.Artefact(anotherArtefactName, anotherArtefactDescription, 'not much to say really',junkAttributes, null);
    var c0 = new creature.Creature(creatureName, creatureDescription, creatureDetailedDescription,{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0}, [a0,a1]);
    var expectedResult = "It's a big beastie with teeth.<br>It's carrying an artefact of little consequence and a second artefact of little consequence.";
    expect(c0.getDetailedDescription()).toBe(expectedResult);
});

test('creatureToStringReturnsValidJSON', () => {
    var keyAttributes = {weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: ""};
    var fob = new artefact.Artefact('keyfob', 'a key fob', "Carrying this ensures you have access to the office whenever you need.", keyAttributes);
    var parcel = new artefact.Artefact('parcel', 'a parcel', "A Parcel with key attributes - odd.", keyAttributes);
    var keyFob = new mission.Mission('keyFob', null,"Violet has a key fob for you.",{"missionObject": "Violet","static": true,"dialogue": ["Good morning $player.<br>Welcome aboard! Here's your key fob, you'll need this to get in and out of some parts of the office."]},null,{isBroken: false}, null,{score: 10, delivers: fob, message: "Have 10 points."});
    var receptionist = new creature.Creature('Violet', 'Violet the receptionist', "Well, receptionist is an understatement to be honest.<br> She looks out for everyone here. Be nice to her.", {weight:100, attackStrength:25, gender:'female', type:'friendly', carryWeight:15, health:215, affinity:0, canTravel:false}, null);
    receptionist.addSyns(['receptionist','violet','heidi','her']);
    receptionist.addMission(keyFob);
    var bookMission = new mission.Mission('violetsBook', null,"Violet has a parcel for you but she'd like something to read first.",{"missionObject": "small book","destination": "Violet","static": true},null,{isDestroyed: false,isBroken: false}, null,{score: 50, delivers: parcel, message: "Congratulations. Violet likes the book! Have 50 points."});
    receptionist.addMission(bookMission);
    var expectedResult = '{"object":"creature","name":"violet","displayName":"Violet","description":"Violet the receptionist","detailedDescription":"Well, receptionist is an understatement to be honest.<br> She looks out for everyone here. Be nice to her.","attributes":{"weight":100,"attackStrength":25,"gender":"female","type":"friendly","carryWeight":15,"health":215},"synonyms":["receptionist","violet","heidi","her"],"missions":[{"object":"mission","name":"keyfob","description":"Violet has a key fob for you.","attributes":{"missionObject":"Violet", "static":true, "dialogue":["Good morning $player.<br>Welcome aboard! Here\'s your key fob, you\'ll need this to get in and out of some parts of the office."]},"conditionAttributes":{"isBroken":false},"reward":{"score":10, "delivers":{"object":"artefact","name":"keyfob","description":"a key fob","detailedDescription":"Carrying this ensures you have access to the office whenever you need.","attributes":{"weight":0.1,"type":"key","canCollect":true}}, "message":"Have 10 points."}}, {"object":"mission","name":"violetsbook","description":"Violet has a parcel for you but she\'d like something to read first.","attributes":{"missionObject":"small book", "destination":"Violet", "static":true},"conditionAttributes":{"isDestroyed":false, "isBroken":false},"reward":{"score":50, "delivers":{"object":"artefact","name":"parcel","description":"a parcel","detailedDescription":"A Parcel with key attributes - odd.","attributes":{"weight":0.1,"type":"key","canCollect":true}}, "message":"Congratulations. Violet likes the book! Have 50 points."}}]}';
    var actualResult = receptionist.toString();
    expect(actualResult).toBe(expectedResult);
});

test('creatureCanReceiveObject', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    var expected = "The creature takes the artefact of little consequence.";
    var actual = c0.receive(a0);
    expect(actual).toBe(expected);
});

// Skipping the commented out test 'unfriendlyCreatureWontShareObject'

test('creatureIsUnfriendlyWhenAffinityLessThan0', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-1});
    var expected = false;
    var playerAggression = 0;
    var actual = c0.isFriendly(playerAggression);
    expect(actual).toBe(expected);
});

test('creatureIsUnfriendlyWhenAffinityIs0', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    var expected = false;
    var playerAggression = 0;
    var actual = c0.isFriendly(playerAggression);
    expect(actual).toBe(expected);
});

test('creatureIsFriendlyWhenAffinityIsGreaterThan0', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = true;
    var playerAggression = 0;
    var actual = c0.isFriendly(playerAggression);
    expect(actual).toBe(expected);
});

test('creatureIsFriendlyWhenAffinityEqualsPlayerAggression', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = true;
    var playerAggression = 1;
    var actual = c0.isFriendly(playerAggression);
    expect(actual).toBe(expected);
});

test('creatureIsUnfriendlyWhenAffinityLessThanPlayerAggression', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = false;
    var playerAggression = 2;
    var actual = c0.isFriendly(playerAggression);
    expect(actual).toBe(expected);
});

test('unfriendlyCreatureWontShare', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-1});
    var expected = false;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, 1);
    expect(actual).toBe(expected);
});

test('unfriendlyCreatureWontShareRegardlessOfAffinityImpact', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-1});
    var expected = false;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, -99);
    expect(actual).toBe(expected);
});

// --- End Jest conversion of first 15 tests ---
// Jest conversions of the selected nodeunit tests

test('friendlyCreatureWillShare', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = true;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, 1);
    expect(actual).toBe(expected);
});

test('friendlyCreatureWillShareItemWith0AffinityImpact', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = true;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, 1);
    expect(actual).toBe(expected);
});

test('friendlyCreatureWontShareSomethingWithHighAffinityImpact', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = false;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, 2);
    expect(actual).toBe(expected);
});

test('deadCreatureWithNegativeAffinityWillShare', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:0, affinity:-1});
    var expected = true;
    var playerAggression = 0;
    var actual = c0.willShare(playerAggression, 1);
    expect(actual).toBe(expected);
});

test('deadCreaturesCantAcceptGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:0, affinity:-1});
    var expected = false;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillAcceptSmallGiftsIfPlayerIsNotAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-1});
    var expected = true;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('neutralCreaturesWillAcceptSmallGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:0});
    var expected = true;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillAcceptSmallGiftsIfPlayerIsBarelyAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-1});
    var expected = true;
    var playerAggression = 1;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillRefuseSmallGiftsIfPlayerIsModeratelyAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-1});
    var expected = false;
    var playerAggression = 2;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillRefuseMissionObjects', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-1});
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var m0 = new mission.Mission("mission","a mission", "a mission", {missionObject:gift.getName()},null,null,null,{});
    c0.addMission(m0);
    var expected = false;
    var playerAggression = 0;    
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});
test('veryUnfriendlyCreaturesWillAcceptSmallGiftsIfPlayerIsOnlyMildlyAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-5});
    var expected = true;
    var playerAggression = 1;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('veryUnfriendlyCreaturesWillRefuseLargeGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-5});
    var expected = false;
    var playerAggression = 1;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:5,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('friendlyCreaturesWillAcceptSmallGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:1});
    var expected = true;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:1,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('friendlyCreaturesWillNotAccept99LevelAffinityGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 50, affinity: 1 });
    var expected = false;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really', { affinityModifier: 99, canCollect: true }, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('friendlyCreaturesWillAcceptLargeGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:1});
    var expected = true;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:98,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillNotAccept99LevelAffinityGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 50, affinity: -1 });
    var expected = false;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really', { affinityModifier: 99, canCollect: true }, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});

test('waryCreaturesWillAcceptLargeGifts', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:50, affinity:-1});
    var expected = true;
    var playerAggression = 0;
    var gift = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really',{affinityModifier:98,canCollect:true}, null);
    var actual = c0.willAcceptGift(playerAggression, gift);
    expect(actual).toBe(expected);
});


/*
        self.willAcceptGift = function(playerAggression, affinityModifier) {
            //more tolerant than fight or flight but not by much...
            //this allows a moderate bribe to get a flighty creature to stick around
            //but prevents them taking something and running away immediately afterward
            if ((_affinity <-1) && (playerAggression>1)) {return false;};
            //if player is peaceful but creature is very low affinity, 
            //cannot give a single gift of affinity impact enough to transform their response.
            if ((_affinity <-5) && (0-affinityModifier<_affinity)) {return false;};
            if (self.isDead()) {return false;};
*/
// Jest conversions of the selected nodeunit tests

test('canGetObjectFromCreature', () => {
    var creatureName = 'creature';
    var artefactDescription = 'an artefact of little consequence'
    var artefactName = 'artefact'
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    c0.receive(a0);
    expect(c0.getObject(artefactName).getName()).toBe(artefactName);
});

test('canRetrieveAffinity', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-5});
    var expected = "<br>It doesn't like you much.";
    var actual = c0.getAffinityDescription();
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureIsFriendlyWhenAffinityGreaterThanPlayerAggression', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = true;
    var actual = c0.isFriendly(1);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureIsNotFriendlyWhenPlayerIsAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    var expected = false;
    var actual = c0.isFriendly(1);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureIsHostileLvl6WhenPlayerIsLessAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-6});
    var expected = true;
    var actual = c0.isHostile(5);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureIsVeryHostileLvl10WhenPlayerIsLessAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-10});
    var expected = true;
    var actual = c0.isHostile(0);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureIsNotHostileWhenPlayerIsAsAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-2});
    var expected = false;
    var actual = c0.isHostile(2);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureWillFleeWhenPlayerIsAsAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-2, canTravel:true});
    var expected = true;
    var actual = c0.willFlee(2);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureWillFleeIfNearlyDeadRegardlessOfHostility', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:15, maxHealth:150, affinity:-2, canTravel:true});
    var expected = true;
    var actual = c0.willFlee(0);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

// Jest conversions of the selected nodeunit tests

test('newCreatureWith50PercentHealthIsCreatedBleeding', () => {
    //creatures start bleeding at 50% health or lower.
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var expected = true;
    var actual = c0.getCurrentAttributes().bleeding;
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('newCreatureWithMoreThan50PercentHealthIsNotBleeding', () => {
    //creatures start bleeding at 50% health or lower.
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:76, maxHealth:150, affinity:-2, canTravel:true});
    var expected = false;
    var actual = c0.getCurrentAttributes().bleeding;
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureWillNotFleeWhenPlayerIsMoreAggressiveButCreatureIsNotMobile', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-2, canTravel:false});
    var expected = false;
    var actual = c0.willFlee(3);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureWillFleeWhenPlayerIsMoreAggressive', () => {
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-2, canTravel:true});
    var expected = true;
    var actual = c0.willFlee(3);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('friendlyCreatureWillFindForPlayer', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = "It says 'He's somewhere around the poppy meeting room area at the moment.'";
    var playerAggression = 1; //1 point of aggression should be acceptable
    var actual = c0.find("stephen g", playerAggression, m);
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('friendlyCreatureWillNotFindForAggresivePlayer', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:1});
    var expected = "It says 'I'm a bit busy at the moment, can you come back in a while?'<br>'It looks like you could do with walking off some of your tension anyway.'";
    var playerAggression = 2;
    var actual = c0.find("stephen g", playerAggression, m);
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('unfriendlyCreatureWillNotFindForPlayer', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:-1});
    var expected = "It doesn't like your attitude and doesn't want to talk to you at the moment.";
    var playerAggression = 0;
    var actual = c0.find("stephen g", playerAggression, m);
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('neutralCreatureWillNotFindForPlayer', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, affinity:0});
    var expected = "When was the last time you did something for it?<br>It pays to be nice to others.<br>";
    var playerAggression = 0;
    var findResult = c0.find("stephen g", playerAggression, m)
    var actual = findResult.substr(findResult.indexOf("<br>")+8); //exclude initial random reply
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('neutralCreatureWillNotFindForPlayerAndGivesRandomReply', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 150, affinity: 0 });
    var expected = ["Sorry $player, I don't have time to help you right now.", "I'm too busy at the moment.", "I've got more important things to do right now."];
    var playerAggression = 0;
    var findResult = c0.find("stephen g", playerAggression, m)
    var actual = findResult.substr(9,findResult.indexOf("'<br>")-9); //include initial random reply only
    console.debug("expected: " + expected);
    console.debug("actual: " + actual);
    expect(expected.indexOf(actual) > -1).toBeTruthy();
});

// Jest conversion of nodeunit tests

test('deadCreatureWillNotFindForPlayer', () => {
    var m = mb.buildMap();
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:0, affinity:0});
    var expected = "It's dead. I don't think it can help you.";
    var playerAggression = 0;
    var actual = c0.find("stephen g", playerAggression, m);
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('weakUnarmedCreatureWillCollectWeapon', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:10, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);

    l.addObject(weakWeapon);
    l.addObject(lightWeapon);
    var expected = "<br>The creature picked up the light weapon. Watch out!";
    var actual = c0.collectBestAvailableWeapon();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('strongUnarmedCreatureWillNotCollectWeapon', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var weakWeapon = new artefact.Artefact("weak", "a weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "a light weapon", "not heavy, not strong", lightWeaponAttributes);

    l.addObject(weakWeapon);
    l.addObject(lightWeapon);
    var expected = "";
    var actual = c0.collectBestAvailableWeapon();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('armedCreatureWillCollectBestWeaponAndDropCurrentOne', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var mediumWeaponAttributes = {weight: 4, attackStrength: 25, type: "weapon", subType: "blunt", canCollect: true};
    var heavyWeaponAttributes = {weight: 6, attackStrength: 50, type: "weapon", subType: "blunt", canCollect: true};

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);
    var heavyWeapon = new artefact.Artefact("heavy", "heavy weapon", "heavy and strong", heavyWeaponAttributes);

    c0.receive(weakWeapon);

    l.addObject(mediumWeapon);
    l.addObject(heavyWeapon);
    l.addObject(lightWeapon);
    var expected = "<br>The creature dropped its weak weapon and picked up the heavy weapon. Watch out!";
    var actual = c0.collectBestAvailableWeapon();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('armedCreatureWillCollectBestWeaponAndDropCurrentOneAndRepotItToPlayerInSameLocation', () => {
    var l = new location.Location("room", "a room", false, true, 0);
    var m1 = new map.Map();
    m1.addLocation(l);
    var p0 = new player.Player({ username: "player" }, m1);
    p0.setLocation(l);
    p0.setAggression(2);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a small beastie', { weight: 120, attackStrength: 15, gender: 'unknown', type: 'creature', carryWeight: 50, health: 120, affinity: -10 });
    c0.go("n", l);

    var mediumWeaponAttributes = { weight: 4, attackStrength: 25, type: "weapon",subType: "blunt", canCollect: true };
    var heavyWeaponAttributes = { weight: 6, attackStrength: 50, type: "weapon", subType: "blunt", canCollect: true };

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);
    var heavyWeapon = new artefact.Artefact("heavy", "heavy weapon", "heavy and strong", heavyWeaponAttributes);

    c0.receive(weakWeapon);

    l.addObject(mediumWeapon);
    l.addObject(heavyWeapon);
    l.addObject(lightWeapon);
    var expected = "<br>The creature dropped its weak weapon and picked up the heavy weapon. Watch out!<br>It attacks you. ";
    var actual = c0.tick(1, m1, p0).substr(0,expected.length);
    console.debug("expected: " + expected);
    console.debug("actual: " + actual);
    expect(actual).toBe(expected);
});

test('armedCreatureWillCollectBestWeaponAndDropCurrentOneCheckLocationContentsAreCorrect', () => {
    var l = new location.Location("room","room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var mediumWeaponAttributes = {weight: 4, attackStrength: 25, type: "weapon", subType: "blunt", canCollect: true};
    var heavyWeaponAttributes = {weight: 6, attackStrength: 50, type: "weapon", subType: "blunt", canCollect: true};

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);
    var heavyWeapon = new artefact.Artefact("heavy", "heavy weapon", "heavy and strong", heavyWeaponAttributes);

    c0.receive(weakWeapon);

    l.addObject(mediumWeapon);
    l.addObject(heavyWeapon);
    l.addObject(lightWeapon);

    c0.collectBestAvailableWeapon();

    var expected = "a room<br><br>You can see a beastie, a medium weapon, a light weapon, and a weak weapon.<br>There are no visible exits.<br>";
    var actual = l.describe();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});
test('armedCreatureWillCollectBestWeaponAndDropCurrentOneCheckLocationContentsAreCorrect', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var mediumWeaponAttributes = {weight: 4, attackStrength: 25, type: "weapon", subType: "blunt", canCollect: true};
    var heavyWeaponAttributes = {weight: 6, attackStrength: 50, type: "weapon", subType: "blunt", canCollect: true};

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);
    var heavyWeapon = new artefact.Artefact("heavy", "heavy weapon", "heavy and strong", heavyWeaponAttributes);

    c0.receive(weakWeapon);

    l.addObject(mediumWeapon);
    l.addObject(heavyWeapon);
    l.addObject(lightWeapon);

    c0.collectBestAvailableWeapon();

    var expected = "a small beastie<br>It seems to like you.<br>It's carrying an heavy weapon.";
    var actual = c0.getDetailedDescription();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('armedCreatureWillCollectBestWeaponAndDropCurrentOneCheckInventoryContentsAreCorrect', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var mediumWeaponAttributes = {weight: 4, attackStrength: 25, type: "weapon", subType: "blunt", canCollect: true};
    var heavyWeaponAttributes = {weight: 6, attackStrength: 50, type: "weapon", subType: "blunt", canCollect: true};

    var weakWeapon = new artefact.Artefact("weak", "weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);
    var heavyWeapon = new artefact.Artefact("heavy", "heavy weapon", "heavy and strong", heavyWeaponAttributes);

    c0.receive(weakWeapon);

    l.addObject(mediumWeapon);
    l.addObject(heavyWeapon);
    l.addObject(lightWeapon);

    c0.collectBestAvailableWeapon();

    var expected = "a small beastie<br>It seems to like you.<br>It's carrying an heavy weapon.";
    var actual = c0.getDetailedDescription();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('armedCreatureWillIgnoreWeakerWeapons', () => {
    var l = new location.Location("room","a room", false, true, 0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:15, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0});
    c0.go("n", l);

    var mediumWeaponAttributes = {weight: 4, attackStrength: 25, type: "weapon", subType: "blunt", canCollect: true};

    var weakWeapon = new artefact.Artefact("weak", "a weak weapon", "pretty much pointless", weakWeaponAttributes);
    var lightWeapon = new artefact.Artefact("light", "a light weapon", "not heavy, not strong", lightWeaponAttributes);
    var mediumWeapon = new artefact.Artefact("medium", "a medium weapon", "moderately heavy, moderately strong", mediumWeaponAttributes);

    c0.receive(mediumWeapon);

    l.addObject(weakWeapon);
    l.addObject(lightWeapon);
    var expected = "";
    var actual = c0.collectBestAvailableWeapon();
    console.debug("expected: "+expected);
    console.debug("actual: "+actual);
    expect(actual).toBe(expected);
});

test('creatureCanHealAnotherBleedingCreature', () => {
    var medikitAttributes =  {"defaultAction": "heal","weight": 1,"type": "medical","canCollect": true,"isBreakable": true,"charges": 5};
    var medikit = new artefact.Artefact("medikit", "first aid kit", "heals many wounds", medikitAttributes);

    //creatures start bleeding at 50% health or lower.
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var c1 = new creature.Creature('creature 2','another beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:150, maxHealth:150, affinity:-2, canTravel:true});
    var inv = c1.getInventoryObject();
    inv.add(medikit);

    var expected = "The creature 2 uses a first aid kit to heal the creature.";
    var actual = c0.heal(medikit, c1);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creaturesCanHealThemselves', () => {
    var medikitAttributes =  {"defaultAction": "heal","weight": 1,"type": "medical","canCollect": true,"isBreakable": true,"charges": 5};
    var medikit = new artefact.Artefact("medikit", "first aid kit", "heals many wounds", medikitAttributes);

    //creatures start bleeding at 50% health or lower.
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var inv = c0.getInventoryObject();
    inv.add(medikit);

    var expected = "The creature uses a first aid kit to heal itself.";
    var actual = c0.heal(medikit, c0);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('creatureCanFindPathToGoal', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var m = mb.buildMap();
    removeAllDoorsInMap(m);
    var destination = 'machine-room-east';
    c0.go(null, m.getLocation('atrium'));

    var expected = ["e","e","n","e","n","u","s","e","s","s","u","n","n","n","w","w","n","w","s","e","n"];
    var actual = c0.findPath(false, destination, m, c0.getCurrentLocation());
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toStrictEqual(expected);
});

test('creatureCanFindAlternatePathToGoalAvoidingALocation', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true, avoiding:["reception", "office-front", "northwest-corridor-ground-floor"]});
    var m = mb.buildMap();
    removeAllDoorsInMap(m);
    var destination = 'machine-room-east';
    c0.go(null, m.getLocation('atrium'));

    var expected = ["e","e","n","e","n","u","s","e","s","s","u","w"];
    var actual = c0.findPath(false, destination, m, c0.getCurrentLocation());
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toStrictEqual(expected);
});

test('ensureFindPathWorksEvenWhenStartingFromLocationWithSingleExit', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true });
    var m = mb.buildMap();
    removeAllDoorsInMap(m);
    var destination = 'atrium';
    c0.go(null, m.getLocation('machine-room-east'));

    var expected = ["e","n","n","e","s","s","s","d","n","n","n","w","s","w","s","w","w","w","n","n","n","e","n","d","s","e","s","s","w","w","w","n","w","w"];
    var actual = c0.findPath(false, destination, m, c0.getCurrentLocation());
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toStrictEqual(expected);
});
// Jest conversion of nodeunit tests

test('creatureCanFindBestPathToGoal', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var m = mb.buildMap();
    removeAllDoorsInMap(m);
    var destination = 'machine-room-east';
    c0.go(null, m.getLocation('atrium'));

    var path = c0.findBestPath(destination, m, 120);
    var targetLength = 12; //"best" path is actually 11 but we will set to 12 for improved tolerance as findPath has some small randomisation in it. 
    var expected = true;
    var actual = false;
    if (path.length <= targetLength) {actual = true};
    console.debug("Target path length="+targetLength+". Selected path length="+path.length+". Path: "+path);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(true);
});

test('creatureWillAvoidEmergencyExitsWhenSeekingDestination', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var m = mb.buildMap();
    var destination = 'smoking-area';
    
    var keyfob = mb.buildArtefact({ object: "artefact", name: "keyfob", template: "keyfob" });
    console.debug(c0.receive(keyfob));
    c0.go(null, m.getLocation('east-end-south-corridor-ground-floor')); 

    var path = c0.findBestPath(destination, m);
    var targetLength = 2;
    var expected = true;
    var actual = false;
    if (path.length > targetLength) { actual = true };
    console.debug("Path: " + path);
    console.debug("Avoid path length=" + targetLength + ". Selected path length=" + path.length + ". Path: " + path);
    console.debug("Avoiding door, path length should ="+targetLength+". Selected path length="+path.length+". Path: "+path);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(true);
});

test('johnCanFindPathToPlantRoom', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var peacock = m.getLocation("peacock");
    p0.setLocation(peacock, true); //move player out of the way
    var joseph = m.getCreature("Joseph Baxter");
    joseph.clearDestination();
    joseph.clearDestination();
    var destinations = joseph.getDestinations();
    console.debug(destinations);
    
    var path = joseph.findBestPath(joseph.getNextDestination(), m);
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    var pathLength = path.length;
    joseph.tick(pathLength, m, p0);
    console.debug("Loc = " + joseph.getCurrentLocationName());
    console.debug("Dest: "+destinations);
    path = joseph.getPath();
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    pathLength = path.length;
    joseph.tick(pathLength, m, p0);
    console.debug("Loc = " + joseph.getCurrentLocationName());
    console.debug("Dest: " + destinations);
    path = joseph.getPath();
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    pathLength = path.length;
    joseph.tick(pathLength, m, p0);
    var expected = "plant-room";
    var actual = joseph.getCurrentLocationName();
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    destinations = joseph.getDestinations();
    console.debug(destinations);
    console.debug(joseph.getPath());
    expect(actual).toBe(expected);
});

test('animalCannotFindPathToPlantRoomDueToDoors', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var peacock = m.getLocation("peacock");
    p0.setLocation(peacock, true); //move player out of the way
    var cat = m.getCreature("cat");
    cat.setDestination("plant room");
    var destinations = cat.getDestinations();
    console.debug("Destinations:"+destinations);
    
    var path = cat.findBestPath(cat.getNextDestination(), m);
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    var pathLength = path.length;
    cat.tick(pathLength, m, p0);
    console.debug("Loc = " + cat.getCurrentLocationName());
    console.debug("Dest: " + destinations);
    console.debug("Wander for 12 ticks ");
    cat.tick(12, m, p0);
    console.debug("Loc = " + cat.getCurrentLocationName());
    console.debug("Dest: " + destinations);
    path = cat.getPath();
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    pathLength = path.length;
    cat.tick(pathLength, m, p0);
    var expected = "plant-room";
    var actual = cat.getCurrentLocationName();
    console.debug("Selected path length=" + path.length + ". Path: " + path);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    destinations = cat.getDestinations();
    console.debug(destinations);
    console.debug(cat.getPath());
    expect(actual).not.toBe(expected);
});

test('creatureCanFindDirectPathToGoalThroughADoor', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true});
    var m = mb.buildMap();
    removeAllDoorsInMap(m);
    var destination = 'smoking-area';
    c0.go(null, m.getLocation('east-end-south-corridor-ground-floor'));

    var path = c0.findBestPath(destination, m);
    var targetLength = 1;
    var expected = true;
    var actual = false;
    if (path.length <= targetLength) {actual = true};
    console.debug("Target path length="+targetLength+". Selected path length="+path.length+". Path: "+path);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(true);
});

test('creatureWithKeyCanFindDirectPathToGoalThroughALockedDoor', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true }, [keyfob]);
    var m = mb.buildMap();
    //removeAllDoorsInMap(m);
    var destination = 'machine-room-west';
    c0.go(null, m.getLocation('second-floor-landing-east'));
    
    var path = c0.findBestPath(destination, m);
    var targetLength = 2;
    var expected = true;
    var actual = false;
    if (path.length == targetLength) { actual = true };
    console.debug("Target path length=" + targetLength + ". Selected path length=" + path.length + ". Path: " + path);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(true);
});

test('creatureWithoutKeyCanFindDirectPathToGoalThroughALockedDoor', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true });
    var m = mb.buildMap();
    //removeAllDoorsInMap(m);
    var destination = 'machine-room-west';
    c0.go(null, m.getLocation('second-floor-landing-east'));
    
    var path = c0.findBestPath(destination, m);
    var targetLength = 1;
    var expected = true;
    var actual = false;
    if (path.length <= targetLength) { actual = true };
    console.debug("Target path length=" + targetLength + ". Selected path length=" + path.length + ". Path: " + path);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(true);
});

test('creatureWithKeyWillRelockLinkedDoor', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var destination = 'machine-room-west';    
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { destinations:[destination], weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true }, [keyfob]);
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    //removeAllDoorsInMap(m);
    var landing = m.getLocation('second-floor-landing-east');
    var corridor = m.getLocation('second-floor-east-corridor');
    
    var doorOut = corridor.getAllObjectsOfType("door")[0];
    var doorIn = landing.getAllObjectsOfType("door")[0];
    //disable auto-locks
    doorOut.setAutoLock(-1);
    doorIn.setAutoLock(-1);

    c0.go(null, landing);
    console.debug("Creature is before door");
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());

    c0.tick(1, m, p0);
    console.debug("Creature is at: " + c0.getCurrentLocation().getName());
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());
    
    c0.tick(1, m, p0);
    console.debug("Creature is at: " + c0.getCurrentLocation().getName());
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());
  
    var expected = true;
    var actual = doorOut.isLocked() && doorIn.isLocked();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(true);
});
// Jest conversions of the selected nodeunit tests

test('unlockedTimedDoorWillRelockAfterTicks', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    //removeAllDoorsInMap(m);
    var corridor = m.getLocation('second-floor-east-corridor');
    
    var doorOut = corridor.getAllObjectsOfType("door")[0];
    
    doorOut.unlock(keyfob, corridor.getName());
    
    console.debug("Door is locked? " + doorOut.isLocked());
    
    console.debug("Environment ticks");
    corridor.tick(3, m, p0);

    console.debug("Door is locked? " + doorOut.isLocked());
    
    var expected = true;
    var actual = doorOut.isLocked();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(true);
});

test('unlockedTimedDoorWillRelockAfterTicksAndReportCorrectMessage', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    //removeAllDoorsInMap(m);
    var corridor = m.getLocation('second-floor-east-corridor');
    p0.setLocation(corridor);
    
    var doorOut = corridor.getAllObjectsOfType("door")[0];
    
    doorOut.unlock(keyfob, corridor.getName());
    
    console.debug("Door is locked? " + doorOut.isLocked());
    
    console.debug("Environment ticks");
    
    var expected = "<br>The office door closes and locks shut.<br>";
    var actual = corridor.tick(3, m, p0);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('unlockedTimedDoorWillStayOpenFor1Tick', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    //removeAllDoorsInMap(m);
    var corridor = m.getLocation('second-floor-east-corridor');
    
    var doorOut = corridor.getAllObjectsOfType("door")[0];
    
    doorOut.unlock(keyfob, corridor.getName());
    
    console.debug("Door is locked? " + doorOut.isLocked());
    
    console.debug("Environment ticks");
    corridor.tick(1, m, p0);
    
    console.debug("Door is locked? " + doorOut.isLocked());
    
    var expected = false;
    var actual = doorOut.isLocked();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureHealOnTickConsumesAllOfMedicalKitProperly', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    p0.setLocation(m.getLocation('customer-delight-south-west'));
    var aileen = m.getCreature("aileen emerson");
    aileen.wait(null, 10);
    
    var expected = '<br>Aileen Emerson uses up the last of her first aid kit to heal herself.';
    var actual = "";
    var attempts = 0;
    aileen.hurt(90);
    while (actual != expected && attempts < 6) {
        actual = aileen.tick(1, m, p0);
        console.debug(actual);
        aileen.hurt(40);
        attempts++;
    }
    
    console.debug("Total ticks: " + attempts);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('ensureCreatureCanByPassAvoidRestrictionsWhenStuckWithSingleExit', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true, traveller: true,  avoiding:['machine-room-west'] });
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    c0.go(null, m.getLocation('machine-room-east'));

    var expected = 'machine-room-west';
    var actual = "";
    var attempts = 0;
    while (actual != expected && attempts < 25) {
        //as creature may occasionally hang around in a dead-end (deliberate) keep trying
        c0.tick(1, m, p0);
        attempts++;
        actual = c0.getCurrentLocation().getName();
    }

    console.debug("Total ticks: " + attempts);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureWithKeyWillNotRelockLinkedDoorIfAutoLock', () => {
    var keyfob = new artefact.Artefact("keyfob", "keyfob", "keyfob", { "weight": 0.1, "type": "key", "canCollect": true, "unlocks": "office door" });
    var destination = 'machine-room-west';
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { destinations: [destination], weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true }, [keyfob]);
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    //removeAllDoorsInMap(m);
    var landing = m.getLocation('second-floor-landing-east');
    var corridor = m.getLocation('second-floor-east-corridor');
    
    var doorOut = corridor.getAllObjectsOfType("door")[0];
    var doorIn = landing.getAllObjectsOfType("door")[0];
    
    c0.go(null, landing);
    console.debug("Creature is before door");
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());
    
    c0.tick(1, m, p0);
    console.debug("Creature is at: " + c0.getCurrentLocation().getName());
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());
    
    c0.tick(1, m, p0);
    console.debug("Creature is at: " + c0.getCurrentLocation().getName());
    console.debug("Door out is locked? " + doorOut.isLocked());
    console.debug("Door in is locked? " + doorIn.isLocked());
    
    var expected = false;
    var actual = doorOut.isLocked() && doorIn.isLocked();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('ensureSettingDestinationForMobileNonTravellerAddsReturnHome', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true, traveller: false});
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    c0.go(null, m.getLocation('machine-room-east'));
    c0.setDestination('atrium');

    var expected = 2;
    var actual = c0.getDestinations().length;
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('ensureSettingDestinationForTravellerAddsToList', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true, traveller: true});
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    c0.go(null, m.getLocation('machine-room-east'));
    c0.setDestination('atrium');
    c0.setDestination('smoking-area');

    var expected = ["smoking-area","atrium"];
    var actual = c0.getDestinations();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toStrictEqual(expected);
});

test('ensureSettingDestinationFromAvoidListDoesNotAddDestination', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: -2, canTravel: true, traveller: true, avoiding:["atrium"],destinations:["reception", "office-front"]});
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    c0.setDestination('atrium');
    var expected = ["reception","office-front"];
    var actual = c0.getDestinations();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toStrictEqual(expected);
});

test('addingNewAvoidLocationRemovesMatchingDestinations', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true, destinations:["reception", "office-front", "northwest-corridor-ground-floor", "reception", "atrium", "reception"]});
    c0.setAvoiding("reception");
    var expected = ["office-front","northwest-corridor-ground-floor","atrium"];
    var actual = c0.getDestinations();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toStrictEqual(expected);
});

test('addingNewAvoidLocationIsCorrectlyStored', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true, avoiding:["reception", "office-front", "northwest-corridor-ground-floor"]});
    c0.setAvoiding("atrium");
    var expected = ["reception","office-front","northwest-corridor-ground-floor","atrium"];
    var actual = c0.getAvoiding();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toStrictEqual(expected);
});
// Jest conversions of the selected nodeunit tests

test('cannotAddDuplicateAvoidLocations', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'unknown', type:'creature', carryWeight:50, health:75, maxHealth:150, affinity:-2, canTravel:true, avoiding:["reception", "office-front", "northwest-corridor-ground-floor", "atrium"]});
    c0.setAvoiding("atrium");
    var expected = ["reception","office-front","northwest-corridor-ground-floor","atrium"];
    var actual = c0.getAvoiding();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toStrictEqual(expected);
});

test('creatureRefusesToTravelToAvoidedLocation', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var atrium = m.getLocation("atrium");
    p0.setLocation(atrium); 
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: 2, canTravel: true, avoiding: ["reception"] });
    var expectedReplyArray = ["Sorry $player, I can't go there at the moment.", "I'm too busy at the moment, give me a shout later.", "I've got more important things to do right now.", "I'd rather not if it's all the same to you."];
    var actual = c0.goTo("reception", p0, m);
    actual = actual.replace("the creature says '", "");
    actual = actual.replace(".'",".")
    var expected = "Expected a refusal result from 'random' list of refusals."
    var resultIndex = expectedReplyArray.indexOf(actual);
    if (resultIndex > -1) {
        expected = actual;  
    };
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureWillAcceptTravelToLocation', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var atrium = m.getLocation("atrium");
    p0.setLocation(atrium);
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 75, maxHealth: 150, affinity: 2, canTravel: true });
    var expectedReplyArray = ["OK.", "Okay. See you there?", "I'm on my way.", "I'll be over there shortly."];
    var actual = c0.goTo("reception", p0, m);
    actual = actual.replace("the creature says '", "");
    actual = actual.replace(".'", ".")
    actual = actual.replace("?'", "?")
    var expected = "Expected an acceptance result from 'random' list of acceptances."
    var resultIndex = expectedReplyArray.indexOf(actual);
    if (resultIndex > -1) {
        expected = actual;
    }    ;
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureWillNotFollowPlayerToAvoidedLocation', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var atrium = m.getLocation("atrium");
    p0.setLocation(atrium);
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 150, maxHealth: 150, affinity: 7, canTravel: true, avoiding: ["reception"] });
    c0.go("", atrium);
    
    var expected = "Current location: Reception<br>You're standing by the big red reception desk in the Porta Rossa office atrium.<br><br>You can see a big red desk, Violet the receptionist, and an office door.<br>There are exits to the East and West.<br>";
    var actual = p0.go("", "e", m);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('highAffinityCreatureWillFollowPlayerToAvoidedLocation', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var atrium = m.getLocation("atrium");
    p0.setLocation(atrium);
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 150, maxHealth: 150, affinity: 8, canTravel: true, avoiding: ["reception"] });
    c0.go("", atrium);
    
    var expected = "The creature follows you.<br>Current location: Reception<br>You're standing by the big red reception desk in the Porta Rossa office atrium.<br><br>You can see a big red desk, Violet the receptionist, an office door, and a beastie.<br>There are exits to the East and West.<br>";
    var actual = p0.go("", "e", m);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('friendlyCreatureWillFollowPlayer', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({ username: "player" }, m);
    var atrium = m.getLocation("atrium");
    p0.setLocation(atrium);
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 50, gender: 'unknown', type: 'creature', carryWeight: 50, health: 150, maxHealth: 150, affinity: 15, canTravel: true});
    c0.go("", atrium);
    
    var expected = "The creature follows you.<br>Current location: Reception<br>You're standing by the big red reception desk in the Porta Rossa office atrium.<br><br>You can see a big red desk, Violet the receptionist, an office door, and a beastie.<br>There are exits to the East and West.<br>";
    var actual = p0.go("", "e", m);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('receivingSmallFoodItemWhenAnimalIsHungryConsumesAllFoodRegardlessOfCharges', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, charges: 3, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'an animal',{weight:120, attackStrength:50, gender:'male', type:'animal', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var expected = "He grabs the slab of sugary goodness with his teeth, scurries into a corner and rapidly devours your entire offering.<br>Wow! Where did it all go?";
    var actual = c0.receive(food, p0);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingLargeFoodItemWithMultipleChargesWhenAnimalIsHungryLeavesSomeBehind', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 11, nutrition: 5, charges: 3, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'an animal',{weight:10, attackStrength:50, gender:'male', type:'animal', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var expected = "He pulls at the slab of sugary goodness, chews a small piece off to eat and leaves the remainder on the floor for later.";
    var actual = c0.receive(food, p0);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingLargeFoodItemWithSingleChargesWhenAnimalIsHungryConsumesItAll', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 11, nutrition: 5, charges: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'an animal',{weight:10, attackStrength:50, gender:'male', type:'animal', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var expected = "He pulls at the slab of sugary goodness and devours it all noisily in front of you.";
    var actual = c0.receive(food, p0);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingLargeFoodItemWhenAnimalIsNotHungryLeavesFood', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 11, nutrition: 5, charges: 3, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'an animal',{weight:10, attackStrength:50, gender:'male', type:'animal', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    var expected = "He sniffs at the slab of sugary goodness, makes a disgruntled snort and turns away.<br>You leave it on the ground in case he comes back later.";
    var actual = c0.receive(food, p0);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingFoodWhenFriendlyCreatureIsHungryConsumesFood', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'a friendly beastie',{weight:120, attackStrength:50, gender:'male', type:'friendly', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var expected = "He eats the slab of sugary";
    var actual = c0.receive(food, m, p0).substr(0,26);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingFoodWithChargesWhenFriendlyCreatureIsHungryConsumesFood', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, charges: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'a friendly beastie',{weight:120, attackStrength:50, gender:'male', type:'friendly', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var expected = "He eats some slab of sugar";
    var actual = c0.receive(food, m, p0).substr(0,26);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingMultipleChargeFoodWhenFriendlyCreatureIsHungryConsumesSomeFood', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, charges: 2, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'a friendly beastie',{weight:120, attackStrength:50, gender:'male', type:'friendly', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    c0.tick(6, m, p0); //increase time since eating
    var resultString = c0.receive(food, m, p0);
    var expected = "He eats some slab of sugary He holds onto the remainder for later.";
    var actual = resultString.substr(0,28)+resultString.substr(-38);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingFoodWhenFriendlyCreatureIsNotHungryKeepsFood', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, charges: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'a friendly beastie',{weight:120, attackStrength:50, gender:'male', type:'friendly', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room", "a room", false, true, 0);
    p0.setLocation(l);
    c0.go(null,l); 
    var expected = "The creature takes the slab of sugary goodness.";
    var actual = c0.receive(food, p0);
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('receivingFoodWhenFriendlyCreatureIsNotHungryKeepsFoodInInventory', () => {
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);
    var foodAttributes = {weight: 1, nutrition: 5, charges: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom',foodAttributes, null);
    var c0 = new creature.Creature('creature','beastie', 'a friendly beastie',{weight:120, attackStrength:50, gender:'male', type:'friendly', carryWeight:50, health:100, maxHealth:150});
    var l = new location.Location("room","a room", false, true, 0);
    c0.go(null, l);
    p0.setLocation(l);
    c0.receive(food, p0)
    var expected = true;
    var actual = c0.check(food.getName());
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('feedingBleedingCreatureDoesNotIncreaseHealthBeyond50Percent', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'male', type:'creature', carryWeight:50, health:75, maxHealth:150});
    c0.feed(50);
    var expected = "He's really not in good shape.<br>It looks like He's bleeding. He's likely to die without some first aid.";
    var actual = c0.health();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});
// Jest conversions of the selected nodeunit tests

test('feedingNearlyDeadCreatureMarginallyIncreasesHealth', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'male', type:'creature', carryWeight:50, health:5, maxHealth:150});
    c0.feed(500);
    var expected = "He's really not in good shape.<br>It looks like He's bleeding. He's likely to die without some first aid.";
    var actual = c0.health();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('feedingInjuredCreatureIncreaseHealth', () => {
    var c0 = new creature.Creature('creature','beastie', 'a big beastie with teeth',{weight:120, attackStrength:50, gender:'male', type:'creature', carryWeight:50, health:77, maxHealth:150});
    c0.feed(100);
    var expected = "He's generally the picture of health.";
    var actual = c0.health();
    console.debug("expected:"+expected);
    console.debug("actual:"+actual);
    expect(actual).toBe(expected);
});

test('healthyCreatureDoesFullDamageWhenHittingOthers', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 55, gender: 'unknown', type: 'creature', carryWeight: 50, health: 78, maxHealth: 150, affinity: -2, canTravel: true, traveller: true,  avoiding:['machine-room-west'] });
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);

    var hitcount = 0;
    while (hitcount < 1) {
        var actualResult = c0.hit(p0, 1);
        if (!(actualResult == "")) { //"" means creature missed.
            hitcount++;
        };
    };  

    var expected = "You're really not in good shape. It looks like you're bleeding. You might want to get that seen to.";
    var actual = p0.health();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureOccasionallyMissesPlayerWhenHitting', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 55, gender: 'unknown', type: 'creature', carryWeight: 50, health: 78, maxHealth: 150, affinity: -2, canTravel: true, traveller: true, avoiding: ['machine-room-west'] });
    var m = new map.Map();
    var p0 = new player.Player({ username: "player" }, m);

    var misscount = 0;
    var attempts = 0;
    while (misscount < 1 && attempts < 25) {
        attempts++;
        var actualResult = c0.hit(p0, 1);
        if (actualResult == "") { //"" means creature missed.
            misscount++;
        };
    };

    var expected = 25;
    var actual = attempts;
    var success = false;
    var achieved = expected - actual;
    if (achieved >= 0) {
        success = true;
    };
    console.debug("expected: <25");
    console.debug("actual:" + actual + " success? "+success);
    expect(success).toBeTruthy();
});

test('bleedingCreatureDoesReducedDamageWhenHittingOthers', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 55, gender: 'unknown', type: 'creature', carryWeight: 50, health: 73, maxHealth: 150, affinity: -2, canTravel: true, traveller: true,  avoiding:['machine-room-west'] });
    var m = new map.Map();
    var p0 = new player.Player({username:"player"}, m);

    var hitcount = 0;
    while (hitcount < 1) {
        var actualResult = c0.hit(p0, 1);
        if (!(actualResult == "")) { //"" means creature missed.
            hitcount++;
        };
    };  

    var expected = "You've taken a fair beating.";
    var actual = p0.health();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('nearlyDeadCreatureDoesDoubleDamageWhenHittingOthers', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 45, gender: 'unknown', type: 'creature', carryWeight: 50, health: 7, maxHealth: 150, affinity: -2, canTravel: true, traveller: true,  avoiding:['machine-room-west'] });
    var m = new map.Map();
    var p0 = new player.Player({ username: "player" }, m);

    var hitcount = 0;
    while (hitcount < 1) {
        var actualResult = c0.hit(p0, 1);
        if (!(actualResult == "")) { //"" means creature missed.
            hitcount++;
        };
    };  

    var expected = "You're almost dead. It looks like you're bleeding. You might want to get that seen to.";
    var actual = p0.health();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('killingCreatureLeavesBloodInLocation', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 45, gender: 'unknown', type: 'creature', carryWeight: 50, health: 7, maxHealth: 150, affinity: -2, canTravel: true, traveller: true, avoiding: ['machine-room-west'] });
    var l0 = new location.Location('home', 'Home', "You're home", {});
    l0.addObject(c0);
    c0.go(null, l0); 
    c0.kill();
    var blood = l0.getObject("blood");

    var expected = "some blood";
    var actual = blood.getDescription();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('killingCreatureWithInventoryReportsCorrectMessage', () => {
    var c0 = new creature.Creature('creature', 'beastie', 'a big beastie with teeth', { weight: 120, attackStrength: 45, gender: 'unknown', type: 'creature', carryWeight: 50, health: 7, maxHealth: 150, affinity: -2, canTravel: true, traveller: true, avoiding: ['machine-room-west'] });
    var l0 = new location.Location('home', 'Home', "You're home", {});
    var inv = c0.getInventoryObject();
    inv.add(a0);
    l0.addObject(c0);
    c0.go(null, l0);

    var expected = "<br>The creature is dead. Now you can steal all its stuff.";
    var actual = c0.kill();
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('CreatureCanSlipOnWetFloor', () => {
    var l0 = new location.Location('home','home','a home location');
    var l1 = new location.Location('new','new','a new location');
    var p0 = new player.Player({username:"user"});
    l1.addExit("N", "new", "home");
    var m1 = new map.Map();
    m1.addLocation(l0);
    m1.addLocation(l1);
    p0.setLocation(l0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName,'beastie', 'a small beastie',{weight:120, attackStrength:10, gender:'unknown', type:'creature', carryWeight:50, health:120, affinity:0, canTravel: true, traveller: true, homeLocation: l0});

    //add enough liquids to guarantee slipping...
    l0.addLiquid("blood");
    l0.addLiquid("custard");
    l0.addLiquid("water");
    l0.addLiquid("liquid4");
    l0.addLiquid("liquid5");
    l0.addLiquid("liquid6");
    l0.addLiquid("liquid7");
    l0.addLiquid("liquid8");
    l0.addLiquid("liquid9");
    l0.addLiquid("liquid10");
    l0.addLiquid("liquid11");
    l0.addLiquid("liquid12");
    l0.addLiquid("liquid13");
    l0.addLiquid("liquid14");
    l0.addLiquid("liquid15");

    console.debug(p0.examine("look"));
    //console.debug(c0.tick(15, m1, p0));

    var expectedResult = "<br>A beastie wanders in and slips in the mess on the floor. It's injured. ";
    var attempts = 1;
    var actualResult;
    while (actualResult != expectedResult && attempts < 10) {
        //a 0 from the random slip algorithm will still not slip so try again
        console.debug("Fail: slip did not occur - attempting try# "+attempts+"...");
        c0.go("n", l1);
        actualResult = c0.tick(5, m1, p0);
        console.debug(actualResult);
        attempts++;
    };
    console.debug("Expected: "+expectedResult);
    console.debug("Actual  : "+actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('CreatureCanSlipAndDieOnWetFloor', () => {
    var l0 = new location.Location('home','home','a home location');
    var l1 = new location.Location('new','new','a new location');
    var p0 = new player.Player({username:"user"});
    l1.addExit("N", "new", "home");
    var m1 = new map.Map();
    m1.addLocation(l0);
    m1.addLocation(l1);
    p0.setLocation(l0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a small beastie', { weight: 120, attackStrength: 10, gender: 'unknown', type: 'creature', carryWeight: 50, health: 20, affinity: 0, canTravel: true, traveller: true, homeLocation: l0 });
    var inv = c0.getInventoryObject();
    inv.add(a0);
    c0.go("n", l1);

    //add enough liquids to guarantee slipping...
    l0.addLiquid("blood");
    l0.addLiquid("custard");
    l0.addLiquid("water");
    l0.addLiquid("liquid4");
    l0.addLiquid("liquid5");
    l0.addLiquid("liquid6");
    l0.addLiquid("liquid7");
    l0.addLiquid("liquid8");
    l0.addLiquid("liquid9");
    l0.addLiquid("liquid10");

    //*note* - occasionaly - even with this much liquid, they might still not slip.
    //this matches player behaviour for fairness.
    var expectedResult = "<br>A beastie wanders in, slips in the mess on the floor and dies from its injuries. Now you can steal all its stuff. ";
    var attempts = 1;
    var actualResult;
    while (actualResult != expectedResult && attempts < 10) {
        //a 0 from the random slip algorithm will still not slip so try again
        console.debug("Fail: slip did not occur - attempting try# "+attempts+"...");
        c0.go("n", l1);
        actualResult = c0.tick(5, m1, p0);
        console.debug(actualResult);
        attempts++;
    };
    console.debug("Expected: "+expectedResult);
    console.debug("Actual  : "+actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('CreatureWillEnactContagion', () => {
    var con = new contagion.Contagion("death", "deathness", { "communicability": 1, "transmission": "bite", "symptoms": [{ "action": "hurt", "health": "3", "frequency": 1 }, { "action": "bite", "frequency": 1 }], "duration": -1 });
    var l0 = new location.Location('home', 'home', 'a home location');
    var p0 = new player.Player({ username: "user" });
    var m1 = new map.Map();
    m1.addLocation(l0);
    p0.setLocation(l0);
    var creatureName = 'creature';
    var c0 = new creature.Creature(creatureName, 'beastie', 'a small beastie', { weight: 120, attackStrength: 10, gender: 'unknown', type: 'creature', carryWeight: 50, health: 20, affinity: 0, canTravel: true, traveller: true, homeLocation: l0 });
    c0.setContagion(con);    
    var inv = c0.getInventoryObject();
    inv.add(a0);
    c0.go(null, l0);

    var expectedResult = " The creature lurches in a spasm of pain and bites you. <br>";
    var fullResult = c0.tick(2, m1, p0);
    var actualResult = fullResult.substr(0, expectedResult.length);
    console.debug(fullResult);
    var attempts = 1;
    while (actualResult != expectedResult && attempts < 5) {
        console.debug("Fail: expected contagion did not match - attempting try# " + attempts + "...");
        fullResult = c0.tick(2, m1, p0);
        actualResult = fullResult.substr(0, expectedResult.length);
        console.debug(fullResult);
        attempts++;
    }
    console.debug("Expected: " + expectedResult);
    console.debug("Actual  : " + actualResult);
    expect(actualResult).toBe(expectedResult);
});

test('derekWontEatMissionChocolateEvenWhenHungry', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    var c0 = m.getCreature("derek benson");
    c0.go(null, m.getLocation('machine-room-east'));
    c0.tick(6, m, p0); //ensure he's hungry
    var foodAttributes = {weight: 1, nutrition: 5, charges: 3, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var chocolate = new artefact.Artefact('chocolate', 'chocolate', 'nom nom nom',foodAttributes, null);

    var expected = "Derek takes the chocolate.";
    var actual = c0.receive(chocolate, m, p0);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('otherCreatureWillStillEatChocolate', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    var c0 = m.getCreature("michael weston");
    c0.go(null, m.getLocation('machine-room-east'));
    c0.tick(6, m, p0); //ensure he's hungry
    var foodAttributes = {weight: 1, nutrition: 5, charges: 3, plural: true, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var chocolate = new artefact.Artefact('chocolate', 'chocolate', 'nom nom nom',foodAttributes, null);

    var expected = "He eats some chocolate"; // items with multiple charges and no charge unit need to be plural in order to be "some"
    var actual = c0.receive(chocolate, m, p0).substr(0,22);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});


test('otherCreatureWillEatAPieceOfChocolate', () => {
    var m = mb.buildMap();
    var p0 = new player.Player({username:"player"}, m);
    var c0 = m.getCreature("michael weston");
    c0.go(null, m.getLocation('machine-room-east'));
    c0.tick(6, m, p0); //ensure he's hungry
    var foodAttributes = {weight: 1, nutrition: 5, charges: 3, chargeUnit: "piece", plural: true, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false};
    var chocolate = new artefact.Artefact('chocolate', 'chocolate', 'nom nom nom',foodAttributes, null);

    var expected = "He eats a piece of chocolate"; // items with multiple charges and no charge unit need to be plural in order to be "some"
    var actual = c0.receive(chocolate, m, p0).substr(0,28);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creature Description Includes Sales Inventory and active dialogue request', () => {
    var m0 = new map.Map();
    var seller = mb.buildCreature({ "file": "ice-cream-man" });
    var missions = seller.getMissions(true);
    missions[0].clearParent();

    var expected = "A random guy who occasionally has ice cream for sale.<br>He has 15 99 flake ice creams (price: &pound;3.50 each) for sale.<br><br>He wants to <i>talk</i> to you about something.$imageicecreamman.jpg/$image";
    var actual = seller.getDetailedDescription(0, m0, 0);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureCanSellItemToPlayer', () => {
    var m0 = new map.Map();
    var l0 = new location.Location('home', 'home', 'a home location');
    m0.addLocation(l0);

    var seller = mb.buildCreature({ "file": "ice-cream-man" });
    var p0 = new player.Player({ username: "player" }, m0, mb);
    p0.setStartLocation(l0);
    p0.setLocation(l0);    
    seller.go(null, m0.getLocation('home'));

    var expected = "The ice cream man sells you a 99 flake ice cream.$imageice-cream.jpg/$image";
    var actual = seller.sell("ice cream", p0);
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});

test('creatureSellingItemReducesInventory', () => {
    var m0 = new map.Map();
    var l0 = new location.Location('home', 'home', 'a home location');
    m0.addLocation(l0);

    var seller = mb.buildCreature({ "file": "ice-cream-man" });
    var p0 = new player.Player({ username: "player" }, m0, mb);
    p0.setStartLocation(l0);
    p0.setLocation(l0);    
    seller.go(null, m0.getLocation('home'));

    var salesInventory = seller.getSalesInventoryObject();
    var originalInventorySize = salesInventory.getWeight();
    seller.sell("ice cream", p0);
    var newInventorySize = salesInventory.getWeight();
    var expected = 1;
    var actual = originalInventorySize - newInventorySize;
    console.debug("expected:" + expected);
    console.debug("actual:" + actual);
    expect(actual).toBe(expected);
});


/*
Methods needing testing:
getName, 
getDescription, 
getAffinityDescription (with 3 different outcomes), 
getDetailedDescription (with, without inventory and affinity), 
getType, 
getWeight, 
getInventory, 
getInventoryWeight, 
canCarry, 
removeFromInventory, 
give (impacts affinity unless can't carry), 
take (refusal vs success based on affinity), 
checkInventory, 
getObject, 
go, 
getLocation, 
hit(varying health and killing), 
heal, 
feed, 
eat, 
kill, 
health, 
moveOrOpen, 
isCollectable, 
isEdible
*/