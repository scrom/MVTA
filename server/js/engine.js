// engine.js
const lpModule = require('./lexerparser.js');
const actionsModule = require('./actions.js');
lp = new lpModule.LexerParser();
a = new actionsModule.Actions(lp);

function createEngine(player, map) {
  return function handle(input) {

    const parsedObject = lp.parseInput(input, player, map);
    if (parsedObject.error) return parsedObject.error; //we will want to try dialogue here

    const {action} = parsedObject;
    const handler = a[action];

    if (!handler) {
      return `Nothing happens. (No logic for "${action}")`;
    }

    const result = handler(action, player, map, parsedObject);
    return result.response;
  };
}

module.exports = createEngine;