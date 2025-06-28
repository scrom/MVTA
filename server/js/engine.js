// engine.js
const lpModule = require('./lexerparser.js');
const actionsModule = require('./actions.js');
const fileManagerModule = require('./filemanager.js');
const lp = new lpModule.LexerParser();
const fm = new fileManagerModule.FileManager(true);
const a = new actionsModule.Actions(lp, fm);


function createEngine(player, map) {
  return function handle(input) {
    try {
      const parsedObject = lp.parseInput(input, player, map);
      if (parsedObject.error) throw parsedObject.error; //we may want to try dialogue here

      const {action} = parsedObject;
      const handler = a[action];

      if (!handler) {
        throw `("${action}" not implemented.)`;
      }

      let result = {};

      let gameOver = a.catchGameOver(player, parsedObject);

      if (gameOver) {
        result = a.processResponse (gameOver, player, map, parsedObject, 0);
        if (result.error) throw new Error(result.error);
        return result;      
      }

      result = handler(action, player, map, parsedObject);
      if (result.error) throw new Error(result.error);
      return result;

    } catch (err) {
      	console.error('Error: userAction: "'+input+'". Error message/stack: '+err+"/"+err.stack);
      return a.buildResultJSON("Something bad happened on the server. We've logged it for review. If this happens again, you've probably found a bug. (Thanks for finding it!)", null, player, {originalInput:input});
    };
  } ;
};

module.exports = createEngine;