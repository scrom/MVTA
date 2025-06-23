// actions.js
  // To reference any of the functions in this file from within another function -  inside any function, we can call another function like: actions.help();
module.exports.Actions = function Actions(parser) {
  const self = this; //closure so we don't lose this reference in callbacks
  const lp = parser; //so we can re-parse inputs when needed before returning to engine.
  const dialogueModule = require('./dialogueparser.js');
  const dp = new dialogueModule.DialogueParser();
  const tools = require('./tools.js');
  const customAction = require('./customaction.js');

  const _baseTickSize = tools.baseTickSize; //default base measure of time //assume a move passes time. Some won't - for these, ticks will be 0.
  let _failCount = 0; //count the number of consecutive user errors

  try{
  /*
  po = parsedObject
        category: verbs[verb].category,
        originalVerb: tokens[0],
        originalInput: input,
        action: verb,
        adverb: adverb,
        subject: objects[0] || null,
        object: objects[1] || null,
        preposition: preposition || null,
        target: rest || null
  */

        self.processResponse = function (response, player, map, po, ticks) {
          if (response) {
            if (response.includes("$inactive$")) {
              response = response.replace("$inactive$", "Thanks for playing.<br>There's nothing more you can do here for now.<br><br>You can either <i>quit</i> and start a fresh game or <i>load</i> a previously saved game.");
              return {response: response, ticks: 0};
            };
            if (response.includes("$dead$")) {
              response = response.replace("$dead$", "You're dead. Game over.<br>There's nothing more you can do here.<br><br>You either need to <i>quit</i> and restart a game or <i>load</i> a previously saved game.");
              return {response: response, ticks: 0};
            };
          };
          if (po) {
            if (po.category != "dialogue") {
              player.setLastCreatureSpokenTo("");
            };
          }
          if (tools.stringIsEmpty(response)) {
            return self.null(null, player, map, po);
          };
          if (response.includes("$fail$")) {
            response = response.replace("$fail$", "");
            _failCount ++;
          } else {
            _failCount = 0;
          };

          if (response.includes("$result$")) {
            response = response.replace("$result$", "");
          };

          //if response redirects to another action...
          if (response.includes("$action$")) {
            //handle cases where $action does or doesn't have a second $
            response = response.replace("$action$","$action").trim();
          };
          if (response.includes("$action")) {
            //strip out any instances of $action
            //we already don't have $result$ so has to be an action already
            response = response.replace("$action","").trim();
                  
            if (response == 'use') {response = 'examine'}; //avoid infinite loop

            let replaceAll = false;
            //if default action is more than just a single word verb, overwrite the entire original action.
            if (response.includes(" ")) {
              replaceAll = true;
            };    
                          
            //replace verb but keep original object
            return self.reconstructInputAndRecallSelftWithNewVerb(response, player, map, po, replaceAll);  
          };

          if (response.includes("?")) {
            parser.setAwaitingPlayerAnswer(true);
          } else {
            parser.setAwaitingPlayerAnswer(false);
          };

          if (ticks) {ticks = ticks * _baseTickSize;}
          else { ticks = 0; };

          return {response: response, ticks: ticks}
        };

        self.reconstructInputAndRecallSelftWithNewVerb = function(verb, player, map, po, replaceAll) {
          //reconstruct sentence without "try/attempt" - second verb usually ends up as part of subject...
          console.debug ("Input: "+ po.originalInput);
          console.debug ("Subject: "+po.subject);
          console.debug ("Object: "+po.object);
          console.debug ("Preposition: "+po.preposition);
          console.debug ("Adverb: "+po.adverb);

          let newInputString ="";
          if (replaceAll) {newInputString = verb; } 
          else { newInputString = po.adverb+" "+po.subject+" "+po.preposition+" "+po.object; };

          let newParsedInput = lp.parseInput(newInputString);
          if (newParsedInput.error) { return newParsedInput.error; };
          const {action} = newParsedInput;
          const handler = self[action];
          if (!handler) { 
            return self.null(verb, player, map, po);
            //`Nothing happens. (No logic for "${action}")`; 
            
            };
          return handler(action, player, map, newParsedInput);

        };

        self.say = function (verb, player, map, po) {
          return self.processResponse(player.say(verb, po.subject, po.object, map), player, map, po, 1);
          //return dp.parseDialogue(verb, player, map, po);
        };

        self.null = function(verb, player, map, po) {
          //console.debug("fail count: "+_failCount);
          if (_failCount >3) { //help on 4 or more fails
            _verb = "help";
            _failCount = 0;
            return self.help(verb, player, map, po);
          };
          if (_failCount == 2) { //hint on second failure
            return self.processResponse("$fail$It looks like you're struggling to be understood.<br>If you need some assistance, try typing <i>help</i>.", player, map, po, 0);
          };
          const randomReplies = ["Can you try again?", "It's probably my fault for not listening to you properly.", "Can you try something else?", "I'm sensing that we have a communication problem here.", "Is everything ok?"];
          let randomIndex = Math.floor(Math.random() * randomReplies.length);
          let notUnderstood = "hear"
          if (po) {
            if (po.originalInput) {
              if (!(tools.stringIsEmpty(po.originalInput))) {
                notUnderstood = "quite understand";
              };
            };
          };
          return  self.processResponse("$fail$Sorry, I didn't "+notUnderstood+" you there. " + randomReplies[randomIndex], player, map, po, 0);
        };

        self.customaction = function(verb, player, map, po) {
          let result = player.customAction(po.originalVerb, po.subject, po.object);
          if (!tools.stringIsEmpty(result)) {
            if (typeof (result) == 'object') {
              //normal type is "string" so this is something else.
              result = customAction.processCustomAction(map, result, player);
            };
          };

          return self.processResponse(result, player, map, po, 1);
        };

        self.try = function(verb, player, map, po) {
          return self.reconstructInputAndRecallSelftWithNewVerb(verb, player, map, po)
        };

        self.use = function (verb, player, map, po) {
          let actionResult = player.use(verb, po.subject);
          if (actionResult) { actionResult = actionResult.trim(); }
          else { actionResult = ""; }; //just in case it comes back undefined.
          return self.processResponse(actionResult, player, map, po,1);
        };
        
        self.cheat = function(verb, player, map, po) {
           return self.processResponse("Hmmm. I'm sure I heard about some cheat codes somewhere...<br><br>...Nope, I must have imagined it.<br>Looks like it's just you and your brain for now.", player, map, po,1);
        };

        self.eat = function(verb, player, map, po) {
          return  self.processResponse(player.eat(po.originalVerb, po.subject), player, map, po,1);
        };

        self.help = function(verb, player, map, po) {
          return  self.processResponse(
                  "<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i> etc.<br>" +
                 "You can interact with objects and creatures by supplying a <i>verb</i> and the <i>name</i> of the object or creature. e.g. <i>'get sword'</i> or <i>'eat apple'</i>.<br>" +
                 "You can also <i>'use'</i> objects on others (and creatures) e.g. <i>'give sword to farmer'</i>, <i>'hit door with sword'</i> or <i>'put key in box'</i>.<br>" +
                 "<br>Two of the most useful verbs to remember are <i>'look'</i> and <i>'examine'</i>.<br>" +
                 "In general I understand a fairly limited set of interactions (and I won't tell you them all, that'd spoil the fun) but hopefully they'll be enough for you to enjoy something more than a minimum viable adventure.<br>" +
                  "<br>To find out more about how you're doing, try <i>'stats'</i> or <i>'status'</i><br>" +
                  "In many cases, your positive or negative interactions within the game may impact how others respond to you, use this knowledge wisely.<br>" +
                  "<br>You can save your progress by entering <i>'save'</i>.<br>You can return to a previously saved point from <i>this</i> session by simply typing <i>restore</i><br>You can load a previously saved game by entering '<i>load filename-x</i>' (where <i>filename-x</i> is the name of your previously saved game file.)<br>" +
                  "If you've really had enough of playing, you can enter <i>quit</i> to exit the game (without saving).<br>"
                  ,player, map, po ,0);
        };

        self.map = function (verb, player, map, po) {
          return  self.processResponse("Oh dear, are you lost? This is a text adventure you know.<br>Time to get some graph paper, a pencil and start drawing!", player, map, po ,0);
        };

        self.health  = function (verb, player, map, po) {
          return  self.processResponse(player.health(po.subject), player, map, po ,0);
        };

        self.heal  = function (verb, player, map, po) {
          return  self.processResponse(player.healCharacter(po.subject), player, map, po ,2);
        };

        self.stats = function (verb, player, map, po) {
          return  self.processResponse(player.stats(map), player, map, po ,0);
        };

        self.status  = function (verb, player, map, po){
          return  self.processResponse(player.status(map.getMaxScore()), player, map, po ,0);
        };

        self.visits  = function (verb, player, map, po) {
          return  self.processResponse(player.getVisits(), player, map, po ,0);
        };

        self.inventory  = function (verb, player, map, po) {
          return  self.processResponse(player.describeInventory(), player, map, po ,1);
        };

        self.examine  = function (verb, player, map, po) {
          let actionTicks = 2;
          //trap a few junk words - will return "look" with no object. 
          const junkWords = ["exits", "objects", "artefacts", "creatures", "artifacts"]
          if (junkWords.includes(po.subject)) { po.subject = null; };

          //not examining anything in particular - just looking around.
          if (!po.subject && !po.object) {
                actionTicks = 1;
          };

          if (po.subject == "inventory" || po.subject == "inv") {
                return self.inventory(verb, player, map, po);
          };

          let keepVerbs = ["check", "peer", "browse", "stare", "look"]
          if (keepVerbs.includes(po.originalVerb)) {verb = po.originalVerb};
          if (["look", "peer", "stare"].includes(po.originalVerb) && po.preposition == "at") {
            verb = po.originalVerb+" at"
            po.preposition = "";
          };
          
          var positionIndex = tools.positions.indexOf(po.preposition);
          var searchAdverbs = ["closely", "carefully", "carefuly", "thoroughly", "meticulously"];

          //support "look under", "look behind" and "look in" as well as "look carefully at" etc.
          if ((positionIndex > 3) ||(searchAdverbs.includes(po.adverb))) {
              return self.search(verb, player, map, po);
          };

          return self.processResponse(player.examine(verb, po.subject, po.object, map, po.adverb, po.preposition), player, map, po ,actionTicks);
        };

        self.search = function (verb, player, map, po) {
          return self.processResponse(player.search(verb, po.subject, po.adverb, po.preposition), player, map, po ,3)
        };
        self.find = function (verb, player, map, po) {
          return self.processResponse(player.hunt(verb, po.subject, map), player, map, po ,2);
        };
        self.follow = function() {
          return self.processResponse(player.follow(verb, po.subject, map), player, map, po ,1);
        };
        self.put = function (verb, player, map, po) {
          return self.processResponse(player.put(verb, po.subject, po.preposition, po.object), player, map, po ,1);
        };
        self.take = function (verb, player, map, po) {
          //player.take(_verb, _object0, _object1);
          return self.processResponse(player.take(verb, po.subject, po.object), player, map, po ,1);
        };
        self.throw  = function (verb, player, map, po) {
          //player.hit (_verb, _object1, _object0);
          if (po.preposition === "at" && po.object != null) {
            return self.processResponse(player.hit(verb, po.subject, po.object), player, map, po ,1);
          } else if (po.preposition === "in" && po.object != null) {
            return self.processResponse(player.put(verb, po.subject, po.preposition, po.object), player, map, po ,1);
          } else {
            //_player.drop(_verb, _object0, _map);
            return self.processResponse(player.drop(verb, po.subject, po.object), player, map, po ,1);
          };
        };
        self.wait = function (verb, player, map, po) {
          return self.processResponse(player.wait(1, map), player, map, po ,1);
        };
  }  catch(err) {
	    console.error('Unable to create Actions object: '+err.stack);
        throw err;
  };
};