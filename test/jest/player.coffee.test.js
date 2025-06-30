"use strict";
const player = require('../../server/js/player.js');
const creature = require('../../server/js/creature.js');
const location = require('../../server/js/location.js');
const artefact = require('../../server/js/artefact.js');
const inventory = require('../../server/js/inventory.js');
const mapBuilder = require('../../server/js/mapbuilder.js');
const map = require('../../server/js/map.js');
const mb = new mapBuilder.MapBuilder('../../data/', 'root-locations');

//these are used in setup and teardown - need to be accessible to all tests
let junkAttributes;
let breakableJunkAttributes;
let weaponAttributes;
let foodAttributes;
let bedAttributes;
let iceCreamAttributes;
let containerAttributes;
let playerName;
let playerAttributes;
let p0; // player object.
let l0; //location object.
let a0; //artefact object.
let a1; //artefact object.
let c0; //creature object.
let c1; //creature object
let m0; //map object
let weapon; //weapon object
let food; //food object
let bed; //chair object
let iceCream; //a bribe
let container; //container object
let breakable; //breakable object

beforeEach(() =>
{
    foodAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false };
    food = new artefact.Artefact('cake', 'slab of sugary goodness', 'nom nom nom', foodAttributes, null);
    bedAttributes = { weight: 10, carryWeight: 0, attackStrength: 0, type: "bed", canCollect: true };
    bed = new artefact.Artefact('bed', 'somewhere to rest', 'rest rest rest', bedAttributes, null);
    playerName = 'player';
    playerAttributes = { "username": playerName, "consumedObjects": [JSON.parse(food.toString())] };
    m0 = new map.Map();
    p0 = new player.Player(playerAttributes, m0, mb);
    l0 = new location.Location('home', 'home', 'a home location');
    l0.addExit("s", "home", "new");
    p0.setStartLocation(l0);
    p0.setLocation(l0);
    junkAttributes = { weight: 3, carryWeight: 3, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false };
    breakableJunkAttributes = { weight: 3, carryWeight: 3, attackStrength: 5, affinityModifier: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
    weaponAttributes = { weight: 4, carryWeight: 0, attackStrength: 25, type: "weapon",subType: "sharp", canCollect: true, canOpen: false, isEdible: false, isBreakable: false };
    iceCreamAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, affinityModifier: 5, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false };
    containerAttributes = { weight: 2, carryWeight: 25, attackStrength: 2, type: "container", canCollect: true, canOpen: true, isEdible: false, isBreakable: true };
    a0 = new artefact.Artefact('artefact', 'artefact of little consequence', 'not much to say really', junkAttributes, null);
    weapon = new artefact.Artefact('sword', 'mighty sword', 'chop chop chop', weaponAttributes, null);
    iceCream = new artefact.Artefact('ice cream', 'great bribe', 'nom nom nom', iceCreamAttributes, null);
    container = new artefact.Artefact('container', 'container', 'hold hold hold', containerAttributes, null);
    a1 = new artefact.Artefact('box', 'box', 'just a box', breakableJunkAttributes, null);
    breakable = new artefact.Artefact('glass', 'drinking glass', 'a somewhat fragile drinking vessel', breakableJunkAttributes, null);
    c0 = new creature.Creature('creature', 'creature', "Super-friendly.", { weight: 140, attackStrength: 12, gender: 'male', type: 'creature', carryWeight: 51, health: 100, affinity: 5, canTravel: true }, [a1]);
    c0.go(null, l0);
    c1 = new creature.Creature('evil', 'Mr Evil', "Very shifty. I'm sure nobody would notice if they disappeared.", { weight: 140, attackStrength: 12, type: 'creature', carryWeight: 51, health: 215, affinity: -5, canTravel: true }, [a1]);
    c1.go(null, l0);

    l0.addObject(a0);
    l0.addObject(weapon);
    l0.addObject(breakable);
    l0.addObject(food);
    l0.addObject(container);
});

afterEach(() =>
{
    playerName = null;
    playerAttributes = null;
    p0 = null;
    l0 = null;
    m0 = null;
    junkAttributes = null;
    breakableJunkAttributes = null;
    weaponAttributes = null;
    foodAttributes = null;
    iceCreamAttributes = null;
    containerAttributes = null;
    a0 = null;
    a1 = null;
    weapon = null;
    breakable = null;
    food = null;
    iceCream = null;
    container = null;
    c0 = null;
    c1 = null;
});
describe('Sweet Coffee Combination Tests', () =>
{
    test('can make sweet coffee by adding sugar to cup', () =>
    {
        var openBreakableContainerAttributes = { weight: 2, carryWeight: 1.1, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        var cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);

        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 0.5, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar' };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee' };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        var _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        _inventory.add(sugar);

        cup.receive(coffee);

        var expectedResult = "You add the sugar to the coffee.<br>Your cup now contains sweet coffee.";
        var actualResult = p0.put('put', 'sugar', "into", 'cup');
        expect(actualResult).toBe(expectedResult);
    });

    test('player can make sweet coffee by adding sugar to coffee when cup is in inventory', () =>
    {
        var openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true, extendedInventoryDescription: "There's $inventory in it.", };
        var cup = new artefact.Artefact('cup', 'a coffee cup', "Just the right size for a decent brew.", openBreakableContainerAttributes, null);

        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, plural: true, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0.addObject(sugar);
        l0.addObject(cup);
        cup.receive(coffee);
        p0.get('get', 'cup');
        p0.put('add', 'sugar', "in", 'coffee');

        var expectedResult = "Just the right size for a decent brew.<br>There's some sweet coffee in it.";
        var actualResult = p0.examine('examine', 'cup');
        expect(actualResult).toBe(expectedResult);
    });

    test('player can make sweet coffee by adding sugar to cup containing coffee when cup is in location', () =>
    {
        var openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true, extendedInventoryDescription: "There's $inventory in it.", };
        var cup = new artefact.Artefact('cup', 'a coffee cup', "Just the right size for a decent brew.", openBreakableContainerAttributes, null);

        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, plural: true, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0.addObject(sugar);
        l0.addObject(cup);
        cup.receive(coffee);

        var expectedResult = "You add the sugar to the coffee to produce sweet coffee.";
        var actualResult = p0.put('add', 'sugar', "in", 'cup');
        expect(actualResult).toBe(expectedResult);
    });

    test('can make sweet coffee by adding coffee to sugar in a cup', () =>
    {
        var openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        var cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);

        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, plural: true, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0.addObject(cup);
        l0.addObject(coffee);
        cup.receive(sugar);
        p0.get('get', 'cup');
        p0.put('add', 'coffee', "to", 'sugar');

        var expectedResult = 'Some coffee in here would be great.<br>It contains some sweet coffee.';
        var actualResult = p0.examine('examine', 'cup');
        expect(actualResult).toBe(expectedResult);
    });

    test("sweet coffee doesn't lose synonyms on delivery", () =>
    {
        var openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        var cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);

        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0.addObject(cup);
        l0.addObject(coffee);
        cup.receive(sugar);
        p0.get('get', 'cup');
        p0.put('add', 'coffee', "to", 'sugar');

        var deliveredSweetCoffee = cup.getInventoryObject().getObject("sweet coffee");

        var expectedResult = true;
        var actualResult = deliveredSweetCoffee.syn("coffee");
        expect(actualResult).toBe(expectedResult);
    });


    test('canCreateCoffeeMachineInKitchen', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, coffee);

        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        const expectedResult = 'kitchen-ground-floor now contains a coffee vending machine.';
        const actualResult = bottomkitchen.addObject(coffeeMachine);
        expect(actualResult).toBe(expectedResult);
    });

    test('canVendCoffeeIntoCarriedCup', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const p0 = new player.Player({ carryWeight: 25 }, null, null);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = 'You now have a cup of coffee.';
        const actualResult = coffeeMachine.relinquish('coffee', null, p0);
        expect(actualResult).toBe(expectedResult);
    });
  
    test('playerCannotDrinkCoffeeWithoutVendingFirstEvenIfBroken', () =>
    {
        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(m0.getLocation("kitchen-ground-floor"));

        const expectedResult = "You'll need to get coffee from the coffee vending machine or elsewhere before you can drink any."
        const actualResult = p0.drink('drink', 'coffee');
        expect(actualResult).toBe(expectedResult);
    });

    test('playerCannotDrinkCoffeeWithoutVendingFirst', () =>
    {
        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(m0.getLocation("kitchen-ground-floor"));

        const coffeeMachine = m0.getObject("coffee machine", true, true);
        coffeeMachine.forceRepair();
        //ensure beans are in machine
        const beans = m0.getObject("beans", true, true)
        coffeeMachine.receive(beans);

        const expectedResult = "You'll need to get coffee from the coffee vending machine or elsewhere before you can drink any."
        const actualResult = p0.drink('drink', 'coffee');
        expect(actualResult).toBe(expectedResult);
    });

    test('canVendCoffeeIntoLocationCup', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        const p0 = new player.Player({ carryWeight: 25 }, null, null);
        p0.setLocation(bottomkitchen);
        const _inventory = bottomkitchen.getInventoryObject();
        _inventory.add(cup);
        _inventory.add(coffeeMachine);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = 'You collect coffee into a nearby cup.<br>';
        const actualResult = p0.get('get', 'coffee');
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotVendCoffeeIntoBrokenCup', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 0, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        bottomkitchen.addObject(coffeeMachine);
        const m0 = new map.Map();
        m0.addLocation(bottomkitchen);
        const p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(bottomkitchen);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        cup.break();
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = 'It looks like the only available cup around here has seen better days.';
        const actualResult = p0.get("get", "coffee");
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotVendCoffeeIntoFullCup', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const tea = new artefact.Artefact('tea', 'tea', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 1.5, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        cup.receive(tea);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        bottomkitchen.addObject(coffeeMachine);
        const m0 = new map.Map();
        m0.addLocation(bottomkitchen);
        const p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(bottomkitchen);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        console.debug("Coffee machine description: " + coffeeMachine.getDetailedDescription());
        const expectedResult = "The only available cup already has some tea in it. There isn't room for coffee as well.";
        const actualResult = p0.get("get", "coffee");
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotVendCoffeeIntoFullCupContainingCoffeeAlready', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 1.5, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        cup.receive(coffee);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        bottomkitchen.addObject(coffeeMachine);
        const m0 = new map.Map();
        m0.addLocation(bottomkitchen);
        const p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(bottomkitchen);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = "The only available cup already has some coffee in it. There isn't room for any more.";
        const actualResult = p0.get("get", "coffee");
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotVendCoffeeIntoCupThatIsTooSmall', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 0.1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        bottomkitchen.addObject(coffeeMachine);
        const m0 = new map.Map();
        m0.addLocation(bottomkitchen);
        const p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(bottomkitchen);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = 'You need a cup that can hold coffee. None here seem to fit the bill.';
        const actualResult = p0.get("get", "coffee");
        expect(actualResult).toBe(expectedResult);
    });

    test('cannotVendCoffeeWithoutACup', () =>
    {
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 0.1, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const mug = new artefact.Artefact('mug', 'a coffee mug', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        bottomkitchen.addObject(coffeeMachine);
        const m0 = new map.Map();
        m0.addLocation(bottomkitchen);
        const p0 = new player.Player({ carryWeight: 25 }, m0, null);
        p0.setLocation(bottomkitchen);
        const _inventory = p0.getInventoryObject();
        _inventory.add(mug);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        const expectedResult = "Sorry. You can't collect the coffee without something suitable to carry it in.";
        const actualResult = p0.get("get", "coffee");
        expect(actualResult).toBe(expectedResult);
    });

    test('canMakeSweetCoffeeByAddingSugarToCoffee', () =>
    {
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        const sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);
        const coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar' };
        const sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee' };
        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);
        const sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);
        const _inventory = new inventory.Inventory(25);
        _inventory.add(cup);
        cup.receive(coffee);
        const newCoffee = coffee.combineWith(sugar);
        const expectedResult = "sweet coffee";
        const actualResult = newCoffee.getName();
        expect(actualResult).toBe(expectedResult);
    });

    test('canMakeSweetCoffeeByAddingCoffeeToSugar', () =>
    {
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        const sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);
        const coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar' };
        const sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee' };
        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);
        const sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);
        const _inventory = new inventory.Inventory(25);
        _inventory.add(cup);
        cup.receive(sugar);
        const newCoffee = sugar.combineWith(coffee);
        const expectedResult = "sweet coffee";
        const actualResult = newCoffee.getName();
        expect(actualResult).toBe(expectedResult);
    });

    test('canMakeSweetCoffeeFromVendedCoffee', () =>
    {
        const sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        const sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);
        const sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee' };
        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);
        const sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);
        const drinkAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, isBreakable: false, requiresContainer: true, isLiquid: true, requiredContainer: 'cup', combinesWith: 'sugar' };
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", drinkAttributes, null, [sweetCoffee]);
        const componentAttributes = { weight: 3, carryWeight: 0, attackStrength: 5, type: "junk", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, charges: 10, componentOf: ["machine"], requiresContainer: true };
        const coffeeBeans = new artefact.Artefact('beans', 'coffee beans', "Development fuel. Almost enough to last a day here.", componentAttributes, null);
        const lockedStaticMachineAttributes = { weight: 151, carryWeight: 3, attackStrength: 0, type: "container", canCollect: false, canOpen: true, isEdible: false, isBreakable: true, lockable: true, locked: true, requiredComponentCount: 1 };
        const coffeeMachine = new artefact.Artefact('machine', 'a coffee vending machine', "When it works it uses coffee beans to make coffee.", lockedStaticMachineAttributes, null, [coffee]);
        const coffeeMachineKeyAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "key", canCollect: true, canOpen: false, isEdible: false, isBreakable: false, unlocks: "machine" };
        const key = new artefact.Artefact('key', 'a vending machine key', "Just a plain key.", coffeeMachineKeyAttributes);
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", holdsLiquid: true, canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const bottomkitchen = new location.Location('kitchen-ground-floor', "You're in the atrium kitchen.");
        const p0 = new player.Player({ carryWeight: 25 }, null, null);
        const _inventory = p0.getInventoryObject();
        _inventory.add(cup);
        coffeeMachine.unlock(key);
        coffeeMachine.receive(coffeeBeans);
        coffeeMachine.relinquish('coffee', null, p0);
        const newCoffee = coffee.combineWith(sugar);
        const expectedResult = "sweet coffee";
        const actualResult = newCoffee.getName();
        expect(actualResult).toBe(expectedResult);
    });

    test('cantMakeSweetCoffeeByAddingJunkToCoffee', () =>
    {
        const openBreakableContainerAttributes = { weight: 2, carryWeight: 2, attackStrength: 2, type: "container", canCollect: true, canOpen: false, isEdible: false, isBreakable: true };
        const cup = new artefact.Artefact('cup', 'a coffee cup', "Some coffee in here would be great.", openBreakableContainerAttributes, null);
        const sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        const sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);
        const coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar' };
        const junkAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false };
        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);
        const coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, sweetCoffee);
        coffee.addSyns(['brew', 'drink']);
        const junk = new artefact.Artefact('junk', 'junk', "junk.", junkAttributes, null);
        const _inventory = new inventory.Inventory(25);
        _inventory.add(cup);
        cup.receive(coffee);
        const expectedResult = null;
        const actualResult = coffee.combineWith(junk);
        expect(actualResult).toBe(expectedResult);
    });

    test("can't make sweet coffee without a cup", () =>
    {
        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0.addObject(coffee);
        l0.addObject(sugar);

        var expectedResult = "Sorry, you'll need something suitable to carry it in.";
        var actualResult = p0.put('add', 'coffee', "to", 'sugar');
        expect(actualResult).toBe(expectedResult);
    });

    test('failing to make sweet coffee does not modify ingredients', () =>
    {
        var sweetCoffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", canCollect: true, canOpen: false, isEdible: true, nutrition: 15, isBreakable: false, requiresContainer: true, requiredContainer: 'cup' };
        var sweetCoffee = new artefact.Artefact('sweet coffee', 'sweet coffee', "Development fuel with added sugar!", sweetCoffeeAttributes, null);

        var coffeeAttributes = { weight: 1, carryWeight: 0, attackStrength: 0, type: "food", plural: true, canCollect: true, canOpen: false, isEdible: true, nutrition: 10, isBreakable: false, requiresContainer: true, requiredContainer: 'cup', combinesWith: 'sugar', delivers: [sweetCoffee] };
        var sugarAttributes = { weight: 0.1, carryWeight: 0, attackStrength: 0, type: "food", plural: true, canCollect: true, canOpen: false, isEdible: true, nutrition: 5, isBreakable: false, combinesWith: 'coffee', delivers: [sweetCoffee] };

        sweetCoffee.addSyns(['brew', 'drink', 'coffee', 'sugary coffee']);

        var coffee = new artefact.Artefact('coffee', 'coffee', "Development fuel.", coffeeAttributes, null, [sweetCoffee]);
        coffee.addSyns(['brew', 'drink']);

        var sugar = new artefact.Artefact('sugar', 'sugar', "Not so good for the waistline but sugary, sweet and tasty.", sugarAttributes, null, [sweetCoffee]);

        l0 = new location.Location('home', 'home', 'a home location');
        p0.setLocation(l0);

        l0.addObject(coffee);
        l0.addObject(sugar);
        p0.put('add', 'coffee', "to", 'sugar');

        var expectedResult = "a home location<br><br>You can see some coffee and some sugar.<br>There are no visible exits.<br> Coffee weight: 1, Sugar weight: 0.1";
        var actualResult = p0.examine('look') + " Coffee weight: " + coffee.getWeight() + ", Sugar weight: " + sugar.getWeight();
        expect(actualResult).toBe(expectedResult);
    });
});

    test('playerCanGetLatte', () =>
    {
        const fileManager = require('../../server/js/filemanager.js');
        const dataDir = '../../data/';
        const imageDir = '../../images/';
        const fm = new fileManager.FileManager(true, dataDir, imageDir);

        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, null);
        l0 = m0.getLocation("kitchen-ground-floor")
        p0.setLocation(l0);

        const coffeeMachine = l0.getObject("coffee machine", true, true);
        coffeeMachine.forceRepair();
        //ensure beans are in machine
        let beansJSON = fm.readFile("artefacts/beans.json");
        let beans = mb.buildArtefact(beansJSON);
        coffeeMachine.receive(beans);

        let milkJSON = fm.readFile("artefacts/milk.json");
        let milk = mb.buildArtefact(milkJSON);
        coffeeMachine.receive(milk);

        console.debug("Coffee machine description: " + coffeeMachine.getDetailedDescription());

        coffeeMachine.switchOnOrOff("switch", "on");

        const expectedResult = "You collect latte into a nearby cup.<br>$imagemug.jpg/$image";
        const actualResult = p0.get('get', 'latte');
        expect(actualResult).toBe(expectedResult);
    });


    test('player Can Complete Latte Mission Chain', () =>
    {
        const fileManager = require('../../server/js/filemanager.js');
        const dataDir = '../../data/';
        const imageDir = '../../images/';
        const fm = new fileManager.FileManager(true, dataDir, imageDir);

        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, mb);
        const atrium = m0.getLocation("atrium");
        console.debug(p0.setLocation(atrium));
        l0 = m0.getLocation("kitchen-ground-floor")
        console.debug(p0.setLocation(l0));
        const coffeeMachine = l0.getObject("coffee machine", true, true);
        coffeeMachine.forceRepair();
        
        var firstResult = m0.updateMissions(5, p0);    
        var expectedFirstResult = "<br>That's a start at least. You still need to get <i>your</i> coffee though.<br>";
        expect(firstResult).toBe(expectedFirstResult);


        //ensure beans are in machine
        let beansJSON = fm.readFile("artefacts/beans.json");
        let beans = mb.buildArtefact(beansJSON);
        coffeeMachine.receive(beans);

        let milkJSON = fm.readFile("artefacts/milk.json");
        let milk = mb.buildArtefact(milkJSON);
        coffeeMachine.receive(milk);
        
        var secondResult = m0.updateMissions(5, p0);
        var expectedSecondResult = "<br>Congratulations, you got the coffee machine working!<br>";
        expect(secondResult).toBe(expectedSecondResult);

        var workingCoffeeMachineDescription = coffeeMachine.getDetailedDescription();
        var expectedDescription = "It's stocked up with some coffee beans and some milk.<br>It's switched off.$imagecoffeemachine.jpg/$image";
        expect(workingCoffeeMachineDescription).toBe(expectedDescription);


        console.debug("Coffee machine description: " + workingCoffeeMachineDescription);
        coffeeMachine.switchOnOrOff("switch", "on");
        p0.get('get', 'latte');

        const expectedResult = "<br><br>Congratulations, you managed to get your coffee. That was somewhat more effort than expected though.<br><br>Still... no time to linger. Drink up, wake up and start doing your bit to help your colleagues out.<br>(Or not - it's up to you.)<br><br>If you've not done so already, now might be a good time to <i>save</i> your achievements so far.<br>";
        const actualResult = m0.updateMissions(5, p0);
        expect(actualResult).toBe(expectedResult);
    });


    test('playerCanCompleteAnyCoffeeMission', () =>
    {
        const fileManager = require('../../server/js/filemanager.js');
        const dataDir = '../../data/';
        const testDataDir = '../../test/testdata/';

        const imageDir = '../../images/';
        const fm = new fileManager.FileManager(true, dataDir, imageDir);
        const testDatafm = new fileManager.FileManager(true, testDataDir, imageDir);


        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, mb);

        let anyCoffeeJSON = testDatafm.readFile("mission-anycoffee.json");
        let anyCoffeeMission = mb.buildMission(anyCoffeeJSON);
        p0.addMission(anyCoffeeMission);
        anyCoffeeMission.startTimer(); //activate mission

        l0 = m0.getLocation("kitchen-ground-floor")
        console.debug(p0.setLocation(l0));
        const coffeeMachine = l0.getObject("coffee machine", true, true);
        coffeeMachine.forceRepair();
        //ensure beans are in machine
        let beansJSON = fm.readFile("artefacts/beans.json");
        let beans = mb.buildArtefact(beansJSON);
        coffeeMachine.receive(beans);

        let milkJSON = fm.readFile("artefacts/milk.json");
        let milk = mb.buildArtefact(milkJSON);
        coffeeMachine.receive(milk);

        console.debug("Coffee machine description: " + coffeeMachine.getDetailedDescription());
        console.debug("Status: " + p0.status());

        coffeeMachine.switchOnOrOff("switch", "on");
        p0.get('get', 'coffee');

        const expectedResult = "<br>Congratulations, you managed to get your coffee. And it's not a latte!";
        const actualResult = m0.updateMissions(5, p0).substring(0, expectedResult.length);
        expect(actualResult).toBe(expectedResult);
    });


    test('playerCanCompleteTwoDifferentCoffeesMission', () =>
    {
        const fileManager = require('../../server/js/filemanager.js');
        const dataDir = '../../data/';
        const testDataDir = '../../test/testdata/';

        const imageDir = '../../images/';
        const fm = new fileManager.FileManager(true, dataDir, imageDir);
        const testDatafm = new fileManager.FileManager(true, testDataDir, imageDir);


        m0 = mb.buildMap();
        p0 = new player.Player({ carryWeight: 25 }, m0, mb);

        let anyCoffeeJSON = testDatafm.readFile("mission-twocoffees.json");
        let anyCoffeeMission = mb.buildMission(anyCoffeeJSON);
        p0.addMission(anyCoffeeMission);
        anyCoffeeMission.startTimer(); //activate mission

        l0 = m0.getLocation("kitchen-ground-floor")
        console.debug(p0.setLocation(l0));
        const coffeeMachine = l0.getObject("coffee machine", true, true);
        coffeeMachine.forceRepair();
        //ensure beans are in machine
        let beansJSON = fm.readFile("artefacts/beans.json");
        let beans = mb.buildArtefact(beansJSON);
        coffeeMachine.receive(beans);

        let milkJSON = fm.readFile("artefacts/milk.json");
        let milk = mb.buildArtefact(milkJSON);
        coffeeMachine.receive(milk);

        console.debug("Coffee machine description: " + coffeeMachine.getDetailedDescription());
        console.debug("Status: " + p0.status());

        coffeeMachine.switchOnOrOff("switch", "on");
        p0.get('get', 'coffee');

        //ensure it doesn't complete early...
        console.debug(m0.updateMissions(5, p0)); //first time it will catch fixing the coffee machine

        //need another cup!
        let cupJSON = fm.readFile("artefacts/cup.json");
        let cup = mb.buildArtefact(cupJSON);
        p0.acceptItem(cup);

        console.debug(p0.get('get', 'latte'));

        const expectedResult = "<br>Congratulations, you managed to get two different coffees.<br>";
        const actualResult = m0.updateMissions(5, p0).substring(0, expectedResult.length);
        expect(actualResult).toBe(expectedResult);
    });