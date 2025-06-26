"use strict";
const lexpar = require('../../server/js/lexerparser.js');

const lp = new lexpar.LexerParser();

test('can parse verb', () => {
    const input = 'eat an artefact of little consequence';
    const expectedResult =  {
      category: 'food_drink',
      originalVerb: 'eat',
      originalInput: 'eat an artefact of little consequence',
      action: 'eat',
      adverb: null,
      subject: 'artefact of little consequence',
      object: null,
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('can parse verb using alias', () => {
    const input = 'x an artefact of little consequence';
    const expectedResult =     {
      category: 'examination',
      originalVerb: 'x',
      originalInput: input,
      action: 'examine',
      adverb: null,
      subject: 'artefact of little consequence',
      object: null,
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('parsing unknown verb return custom action', () => {
    const input = 'skibidee an artefact of little consequence';
    const expectedResult = {
      "action": "customaction",
      "adverb": null,
      "category": "system",
      "object": null,
      "originalInput": input,
      "originalVerb": null,
      "preposition": null,
      "subject": "skibidee an artefact of little consequence",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can parse string into relevant multiple objects via preposition', () => {
    const input = 'pour water over the barbecue';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
      adverb: null,
      subject: 'water',
      object: 'barbecue',
      preposition: 'over'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can parse object when preposition is at start', () => {
    const input = 'pour water over the barbecue';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
      adverb: null,
      subject: 'water',
      object: 'barbecue',
      preposition: 'over'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can parse object when preposition is 2 words at end', () => {
    const input = 'pour water on to';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
      adverb: null,
      subject: 'water',
      object: null,
      preposition: 'on to'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('can parse single object when preposition is 3 words at beginning', () => {
    const input = 'on top of water';
    const expectedResult =     {
      category: 'system',
      originalVerb: null,
      originalInput: input,
      action: 'customaction',
      adverb: null,
      subject: 'water',
      object: null,
      preposition: 'on top of'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('can parse pair of objects with 2 word preposition', () => {
    const input = 'pour water on to barbecue';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
      adverb: null,
      subject: 'water',
      object: 'barbecue',
      preposition: 'on to'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('what happens with a complex sentence?', () => {
    const input = 'please carefully pour the water on to the smoking hot barbecue';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
      adverb: 'carefully',
      subject: 'water',
      object: 'smoking hot barbecue',
      preposition: 'on to'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('what happens with a complex sentence?', () => {
    const input = 'please try very hard to carefully pour the water on to the smoking hot barbecue';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'try',
      originalInput: input,
      action: 'pour',
      adverb: 'carefully',
      subject: 'water',
      object: 'smoking hot barbecue',
      preposition: 'on to'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('what happens with a complex sentence?', () => {
    const input = 'please carefully take the barbecue and put it quickly in to the swimming pool';
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'take',
      originalInput: input,
      action: 'put',
      adverb: 'quickly',
      subject: 'it',
      object: 'swimming pool',
      preposition: 'in to'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('what happens with another complex sentence?', () => {
    const input = 'wave to boy in the house and take a bowl';
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'wave',
      originalInput: input,
      action: 'get',
      adverb: null,
      subject: "bowl",
      object: null,
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('what happens with another complex sentence?', () => {
    const input = 'put the bowl in the dishwasher';
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'put',
      originalInput: input,
      action: 'put',
      adverb: null,
      subject: "bowl",
      object: 'dishwasher',
      preposition: 'in'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('what happens with another complex sentence?', () => {
    const input = "please friend please attempt very carefully to eat a tiny tin of dog food with a spoon";
    const expectedResult =  {
      category: 'food_drink',
      originalVerb: 'attempt',
      originalInput: input,
      action: 'eat',
      adverb: 'carefully',
      subject: "tiny tin of dog food",
      object: 'spoon',
      preposition: 'with'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can we handle "all" in a sentence?', () => {
    //parser should treat this as part of subject - game internals will have to translate "all".
    const input = "throw all of the books on the bonfire";
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'throw',
      originalInput: input,
      action: 'throw',
      adverb: null,
      subject: "all of books",
      object: 'bonfire',
      preposition: 'on'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('check for confusion over subject and object', () => {
    const input = "collect the bottle into a box";
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'collect',
      originalInput: input,
      action: 'get',
      adverb: null,
      subject: "bottle",
      object: 'box',
      preposition: 'into'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('check for confusion over subject and object', () => {
    //current parser will just see "collect a bottle"
    const input = "use the box to collect a bottle"; //use is a special case
    const expectedResult =  {
      category: 'inventory',
      originalVerb: 'use',
      originalInput: input,
      action: 'get',
      adverb: null,
      subject: "bottle",
      object: null, //@todo- should be box
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('can handle "say"', () => {
    const input = "say hi dave how are you please can you go and get me a bottle of water"; 
    const expectedResult =  {
      category: 'dialogue',
      originalVerb: "say",
      originalInput: input,
      action: 'say',
      adverb: null,
      subject: "hi dave how are you please can you go and get bottle of water",
      object: null,
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can handle other dialogue words', () => {
    const input = "try really hard to persuade dave to go and get me a bottle of water and pick up some lemonade on the way back"; 
    const expectedResult =  {
      category: 'dialogue',
      originalVerb: "try",
      originalInput: input,
      action: 'persuade',
      adverb: null,
      subject: "dave",
      object: "go and get bottle of water and pick up lemonade on way back",
      preposition: "to"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('can handle "in" as a direction', () => {
    const input = "try to go in the front door and push over the lampshade"; 
    const expectedResult =  {
      category: 'movement',
      originalVerb: "try",
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: "front door and push over lampshade", //we have no context on object names so player part of game will need to identify object from this and decide what to do with the remainder. "push pop" could be a valid object for example
      object: null,
      preposition: "in"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('what does "it" mean in a follow up sentence - fail case?', () => {
    //when previous sentence has 2 objects we don't know which to choose
    const firstInput = 'please carefully pour the water on to the smoking hot barbecue';
    lp.parseInput(firstInput);
    const input = "put it in the bin";

    const expectedResult = {
      category: 'inventory',
      originalVerb: 'put',
      originalInput: input,
      action: 'put',
      adverb: null,
      subject: 'it',
      object: 'bin',
      preposition: 'in'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('ensure we dont lose "up"/"down"', () => {
    const input = 'up';

    const expectedResult = {
      category: 'movement',
      originalVerb: 'up',
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: null,
      object: null,
      preposition: "up"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('ensure we dont lose "up"/"down"', () => {
    const input = 'go up';

    const expectedResult = {
      category: 'movement',
      originalVerb: 'go',
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: null,
      object: null,
      preposition: "up"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('ensure we dont lose "up"/"down"', () => {
    const input = 'go up the staircase';
    //this will need some handling by player - it's the equivalent of "go object"
    const expectedResult = {
      category: 'movement',
      originalVerb: 'go',
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: 'staircase',
      object: null,
      preposition: 'up'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('ensure we dont lose "in"/"out"', () => {
    const input = 'go in';

    const expectedResult = {
      category: 'movement',
      originalVerb: 'go',
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: null,
      object: null,
      preposition: "in"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('ensure we dont lose "in"/"out"', () => {
    const input = 'go in house';

    const expectedResult = {
      category: 'movement',
      originalVerb: 'go',
      originalInput: input,
      action: 'go',
      adverb: null,
      subject: 'house',
      object: null,
      preposition: "in"
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('ensure we dont lose "in"/"out"', () => {
    const input = 'in';

    const expectedResult = {
      category: 'movement',
      originalVerb: 'in',
      originalInput: input,
      action: 'enter',
      adverb: null,
      subject: null,
      object: null,
      preposition: null
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('can we handle "pick up"', () => {
    const input = 'pick up the smoking hot barbecue';

    const expectedResult = {
      category: 'inventory',
      originalVerb: 'pick',
      originalInput: input,
      action: 'pick',
      adverb: null,
      subject: 'smoking hot barbecue',
      object: null,
      preposition: 'up'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('what does "it" mean in a follow up sentence - fail case?', () => {
    //when previous sentence has 1 object we *do* know which to choose
    const firstInput = 'pick up the smoking hot barbecue';
    lp.parseInput(firstInput);
    const input = "put it in the bin";

    const expectedResult = {
      category: 'inventory',
      originalVerb: 'put',
      originalInput: input,
      action: 'put',
      adverb: null,
      subject: 'smoking hot barbecue',
      object: 'bin',
      preposition: 'in'
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('greetings are regognised and handled', () => {
    const input = "hi there dave how are you today";

    const expectedResult = {
      "action": "say",
      "adverb": null,
      "category": "dialogue",
      "object": null,
      "originalInput": input,
      "originalVerb": "hi",
      "preposition": null,
      "subject": "hi there dave how are you today",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('greetings are regognised and handled', () => {
    const input = "ahoy";

    const expectedResult = {
      "action": "say",
      "adverb": null,
      "category": "dialogue",
      "object": null,
      "originalInput": input,
      "originalVerb": "ahoy",
      "preposition": null,
      "subject": "ahoy",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('greetings are regognised and handled', () => {
    const input = "ahoy there";

    const expectedResult = {
      "action": "say",
      "adverb": null,
      "category": "dialogue",
      "object": null,
      "originalInput": input,
      "originalVerb": "ahoy",
      "preposition": null,
      "subject": "ahoy there",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('greetings are regognised and handled', () => {
    const input = "say ahoy there";

    const expectedResult = {
      "action": "say",
      "adverb": null,
      "category": "dialogue",
      "object": null,
      "originalInput": input,
      "originalVerb": 'say',
      "preposition": null,
      "subject": "ahoy there",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('greetings are regognised and handled', () => {
    const input = "say hi there dave how are you today";

    const expectedResult = {
      "action": "say",
      "adverb": null,
      "category": "dialogue",
      "object": null,
      "originalInput": input,
      "originalVerb": 'say',
      "preposition": null,
      "subject": "hi there dave how are you today",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('have a... rest regognised and handled', () => {
    const input = "have a rest";

    const expectedResult = {
      "action": "rest",
      "adverb": null,
      "category": "resting",
      "object": null,
      "originalInput": input,
      "originalVerb": 'have',
      "preposition": null,
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('put down x', () => {
    const input = "put down bottle";

    const expectedResult = {
      "action": "put",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": 'put',
      "preposition": "down",
      "subject": "bottle",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('put x down', () => {
    const input = "put bottle down";

    const expectedResult = {
      "action": "put",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": 'put',
      "preposition": "down",
      "subject": "bottle",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('put x out', () => {
    const input = "put candle out";

    const expectedResult = {
      "action": "put",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": 'put',
      "preposition": "out",
      "subject": "candle",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('put out x', () => {
    const input = "put out candle";

    const expectedResult = {
      "action": "put",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": 'put',
      "preposition": "out",
      "subject": "candle",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('put x in y', () => {
    const input = "put candle in bottle";

    const expectedResult = {
      "action": "put",
      "adverb": null,
      "category": "inventory",
      "object": "bottle",
      "originalInput": input,
      "originalVerb": 'put',
      "preposition": "in",
      "subject": "candle",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('water plants', () => {
    const input = "water plants";

    const expectedResult = {
      "action": "water",
      "adverb": null,
      "category": "item_use",
      "object": null,
      "originalInput": input,
      "originalVerb": "water",
      "preposition": null,
      "subject": "plants",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('water plants', () => {
    const input = "water plants with gatorade";

    const expectedResult = {
      "action": "water",
      "adverb": null,
      "category": "item_use",
      "object": "gatorade",
      "originalInput": input,
      "originalVerb": "water",
      "preposition": "with",
      "subject": "plants",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('water plants', () => {
    const input = "water plants with can full of gatorade";

    const expectedResult = {
      "action": "water",
      "adverb": null,
      "category": "item_use",
      "object": "can full of gatorade",
      "originalInput": input,
      "originalVerb": "water",
      "preposition": "with",
      "subject": "plants",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('make sure we can still handle water as a noun as well as a verb', () => {
    const input = "drink water";

    const expectedResult = {
      "action": "drink",
      "adverb": null,
      "category": "food_drink",
      "object": null,
      "originalInput": input,
      "originalVerb": "drink",
      "preposition": null,
      "subject": "water",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('make sure we can still handle water as a noun as well as a verb', () => {
    const input = "throw holy water at demon";

    const expectedResult = {
      "action": "throw",
      "adverb": null,
      "category": "inventory",
      "object": "demon",
      "originalInput": input,
      "originalVerb": "throw",
      "preposition": "at",
      "subject": "holy water",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('make sure we can still handle water as a noun as well as a verb', () => {
    const input = "cool down plants with water";

    const expectedResult = {
      "action": "cool",
      "adverb": null,
      "category": "manipulation",
      "object": "water",
      "originalInput": input,
      "originalVerb": "cool",
      "preposition": "with",
      "subject": "down plants",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('more fun with nouns that are also verbs', () => {
    const input = "please throw the water over the fire";

    const expectedResult = {
      "action": "throw",
      "adverb": null,
      "category": "inventory",
      "object": "fire",
      "originalInput": input,
      "originalVerb": "throw",
      "preposition": "over",
      "subject": "water",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('feeding - x with y', () => {
    const input = "feed cat with cake";

    const expectedResult = {
      "action": "feed",
      "adverb": null,
      "category": "item_use",
      "object": "cake",
      "originalInput": input,
      "originalVerb": "feed",
      "preposition": "with",
      "subject": "cat",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('feeding - x with y', () => {
    const input = "feed cake to cat";

    const expectedResult = {
      "action": "feed",
      "adverb": null,
      "category": "item_use",
      "object": "cat",
      "originalInput": input,
      "originalVerb": "feed",
      "preposition": "to",
      "subject": "cake",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('throwing', () => {
    const input = "throw teddybear in to the bin";

    const expectedResult = {
      "action": "throw",
      "adverb": null,
      "category": "inventory",
      "object": "bin",
      "originalInput": input,
      "originalVerb": "throw",
      "preposition": "in to",
      "subject": "teddybear",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - head west to kitchen', () => {
    const input = "head west to kitchen";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "head",
      "preposition": "west",
      "subject": "kitchen",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - go north', () => {
    const input = "go north";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "go",
      "preposition": "north",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - e', () => {
    const input = "e";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "e",
      "preposition": "east",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - up', () => {
    const input = "up";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "up",
      "preposition": "up",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - go in house', () => {
    const input = "go in house";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "go",
      "preposition": "in",
      "subject": "house",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - get into car', () => {
    const input = "get into car";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "get",
      "preposition": "into",
      "subject": "car",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - get on car', () => {
    const input = "get on car";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "get",
      "preposition": "on",
      "subject": "car",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - get off car', () => {
    const input = "get off car";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "get",
      "preposition": "off",
      "subject": "car",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - get in car', () => {
    const input = "get in car";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "get",
      "preposition": "in",
      "subject": "car",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - get out of car', () => {
    const input = "get out of car";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "get",
      "preposition": "out of",
      "subject": "car",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - climb tree', () => {
    const input = "climb tree";

    const expectedResult = {
      "action": "climb",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "climb",
      "preposition": null,
      "subject": "tree",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});


test('directions - crawl in', () => {
    const input = "crawl in";

    const expectedResult = {
      "action": "crawl",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "crawl",
      "preposition": "in",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - climb down ladder', () => {
    const input = "climb down ladder";

    const expectedResult = {
      "action": "climb",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "climb",
      "preposition": "down",
      "subject": "ladder",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('directions - swim across lake', () => {
    const input = "swim across lake";

    const expectedResult = {
      "action": "swim",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "swim",
      "preposition": "across",
      "subject": "lake",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('give - as a request', () => {
    const input = "please give me your ice cream";

    const expectedResult = {
      "action": "give",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": "give",
      "preposition": null,
      "subject": "your ice cream",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('have a break', () => {
    const input = "have a break";

    const expectedResult = {
      "action": "rest",
      "adverb": null,
      "category": "resting",
      "object": null,
      "originalInput": input,
      "originalVerb": "have",
      "preposition": null,
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('move + direction translates to "go"', () => {
    const input = "move east";

    const expectedResult = {
      "action": "go",
      "adverb": null,
      "category": "movement",
      "object": null,
      "originalInput": input,
      "originalVerb": "move",
      "preposition": "east",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test cheat code handling', () => {
    const input = "+heal 25";

    const expectedResult = {
      "action": "cheatcode",
      "adverb": null,
      "category": "system",
      "object": null,
      "originalInput": input,
      "originalVerb": "+heal",
      "preposition": "25",
      "subject": null,
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test cheat code handling', () => {
    const input = "+affinity 25 aaron";

    const expectedResult = {
      "action": "cheatcode",
      "adverb": null,
      "category": "system",
      "object": null,
      "originalInput": input,
      "originalVerb": "+affinity",
      "preposition": "25",
      "subject": "aaron",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test "open my..."', () => {
    const input = "open my present";

    const expectedResult = {
      "action": "open",
      "adverb": null,
      "category": "manipulation",
      "object": null,
      "originalInput": input,
      "originalVerb": "open",
      "preposition": null,
      "subject": "present",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test "hit person"', () => {
    const input = "hit aaron";

    const expectedResult = {
      "action": "attack",
      "adverb": null,
      "category": "combat",
      "object": null,
      "originalInput": input,
      "originalVerb": "hit",
      "preposition": null,
      "subject": "aaron",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});

test('test "take apart"', () => {
    const input = "take radio apart";

    const expectedResult = {
      "action": "get",
      "adverb": null,
      "category": "inventory",
      "object": null,
      "originalInput": input,
      "originalVerb": "take",
      "preposition": "apart",
      "subject": "radio",
    };
    const actualResult = lp.parseInput(input);
    console.log(actualResult);
    expect(actualResult).toStrictEqual(expectedResult);
});