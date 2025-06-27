// engine.js
const lpModule = require('./lexerparser.js');
const actionsModule = require('./actions.js');
lp = new lpModule.LexerParser();
a = new actionsModule.Actions(lp);

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

      if (action != "stats") {
        //explicitly test for false - supports stub testability          
        if (player.gameIsActive() == false) {
          result = a.processResponse ("$inactive$", player, map, parsedObject, 0);
          if (result.error) throw new Error(result.error);
          return result.response;
        };
                  
        //explicitly test for true - supports stub testability          
        if (player.isDead() == true) {
          result = a.processResponse ("$dead$", player, map, parsedObject, 0);
          if (result.error) throw  new Error(result.error);
          return result.response;
        };
      };

      result = handler(action, player, map, parsedObject);
      if (result.error) throw new Error(result.error);
      return result.response;

    } catch (err) {
      	console.error('Error: userAction: "'+input+'". Error message/stack: '+err+"/"+err.stack);
      return "Something bad happened on the server. We've logged it for review. If this happens again, you've probably found a bug. (Thanks for finding it!)";
    };
  } ;
};

module.exports = createEngine;