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

test('cannot parse unknown verb', () => {
    const input = 'skibidee an artefact of little consequence';
    const expectedResult = {"error": "Unknown verb: \"skibidee\""};
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
    const input = 'pour on top of water';
    const expectedResult =     {
      category: 'item_use',
      originalVerb: 'pour',
      originalInput: input,
      action: 'pour',
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
      category: 'item_use',
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
      category: 'item_use',
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
      category: 'item_use',
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