// engine.js
const lpModule = require('./lexerparser.js');
const actionsModule = require('./actions.js');
const fileManagerModule = require('./filemanager.js');
var lp;
const fm = new fileManagerModule.FileManager(true);
var a;


function createEngine(player, map) {
  let dictionary = {};
  if (map) {
    dictionary = map.getDictionary();
  };
  lp = new lpModule.LexerParser(dictionary);
  a = new actionsModule.Actions(lp, fm);

  return function handle(input) {
    try {
      if (input == "+parser" && process.env.NODE_ENV != "production") {return lp;};
      
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
      if (err.toString().includes("not implemented")) {
        return a.buildResultJSON("I'm afraid I don't <i>quite</i> understand you. Try using a different verb.<br><br><i>(This action hasn't been implemented yet. It's logged for review though, thanks for trying!)</i>", null, player, {originalInput:input});
      };
      return a.buildResultJSON("Something bad happened on the server. We've logged it for review. If this happens again, you've probably found a bug. (Thanks for finding it!)", null, player, {originalInput:input});
    };
  } ;
};

module.exports = createEngine;