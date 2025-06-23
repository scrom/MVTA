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

    let result = {};

    if (action != "stats") {
      //explicitly test for false - supports stub testability          
      if (player.gameIsActive() == false) {
        result = a.processResponse ("$inactive$", player, map, parsedObject, 0);
        return result.response;
      };
                
      //explicitly test for true - supports stub testability          
      if (player.isDead() == true) {
        result = a.processResponse ("$dead$", player, map, parsedObject, 0);
        return result.response;
      };
    };

    result = handler(action, player, map, parsedObject);
    return result.response;
  };
}

module.exports = createEngine;