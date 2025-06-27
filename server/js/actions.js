// actions.js
  // To reference any of the functions in this file from within another function -  inside any function, we can call another function like: actions.help();
module.exports.Actions = function Actions(parser) {
  const self = this; //closure so we don't lose this reference in callbacks
  const lp = parser; //so we can re-parse inputs when needed before returning to engine.
  const dialogueModule = require('./dialogueparser.js');
  const dp = new dialogueModule.DialogueParser();
  const tools = require('./tools.js');
  const customAction = require('./customaction.js');

  const _baseTickSize = tools.baseTickSize; //default base measure of time //assume a move passes time. Some won't - for these, ticks/time will be 0.
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
        preposition: preposition || null
  */
        self.processResponse = function (response, player, map, po, time) {
          try {

            if (response) {
              if (response.includes("$cheat$")) {
                response = response.replace("$cheat$", "");
                return {response: response, time: 0};
              };
              if (response.includes("$inactive$")) {
                response = response.replace("$inactive$", "Thanks for playing.<br>There's nothing more you can do here for now.<br><br>You can either <i>quit</i> and start a fresh game or <i>load</i> a previously saved game.");
                return {response: response, time: 0};
              };
              if (response.includes("$dead$")) {
                response = response.replace("$dead$", "You're dead. Game over.<br>There's nothing more you can do here.<br><br>You either need to <i>quit</i> and restart a game or <i>load</i> a previously saved game.");
                return {response: response, time: 0};
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
              _failCount++;
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
              return self.reconstructInputAndRecallSelfWithNewVerb(response, player, map, po, replaceAll);  
            };

            if (response.includes("?")) {
              parser.setAwaitingPlayerAnswer(true);
            } else {
              parser.setAwaitingPlayerAnswer(false);
            };

            if (time) {time = Math.floor(time * _baseTickSize);}
            else { time = 0; };

            return {"response": response, "time": time};
          } catch (err) {
              let input = ""
              if (po) {input = po.originalInput}
              console.error('Action processing error. Input: '+input+'. Response: '+response+', ParsedObject: '+po+'. Error: '+err);
              throw err;              
          };
        };

        self.reconstructInputAndRecallSelfWithNewVerb = function(verb, player, map, po, replaceAll) {
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

        self.null = function(verb, player, map, po) {
          //console.debug("fail count: "+_failCount);
          if (_failCount >=3) { //help on 3 or more fails
            verb = "help";
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
          return self.reconstructInputAndRecallSelfWithNewVerb(verb, player, map, po)
        };

        self.use = function (verb, player, map, po) {
          let actionResult = player.use(verb, po.subject);
          if (actionResult) { actionResult = actionResult.trim(); }
          else { actionResult = ""; }; //just in case it comes back undefined.
          return self.processResponse(actionResult, player, map, po,1);
        };

        self.go = function (verb, player, map, po) {
          let time = 1;
          if (tools.directions.includes(verb)) {
            time = 1;
          } else {
            switch (po.originalVerb) {
              case "climb":
              case "crawl":
              case "sneak":
              case "slink":
                time = 2;
                break;
              case "run":
              case "drive":
                time = 0.5;
                break;
              case "jog":
                time = 0.75;
                break;
              case "sprint":
              case "fly":
                time = 0.25;
                break;
              case "teleport":
                time = 0;
              case "go":
              case "explore":
              case "swim":
              case "enter":
              case "leave":
              case "descend":          
              case "travel":
              case "return":
              case "jump":
              case "sail":
              default:
                time = 1;
            }
          };
          if (po.subject) {
            return self.processResponse(player.goObject(po.originalVerb, po.preposition, po.subject, map), player, map, po, time);
          } else {
            return self.processResponse(player.go(po.originalVerb, po.preposition, map), player, map, po, time);
          }
        };
        self.run = function (verb, player, map, po) {
            return self.go(verb, player, map, po);
        };
        self.swim = function (verb, player, map, po) {
            return self.go(verb, player, map, po);
        };
        self.crawl = function (verb, player, map, po) {
            return self.go(verb, player, map, po);
        };
        self.climb = function (verb, player, map, po) {
            return self.go(verb, player, map, po);
        };
        self.descend = function (verb, player, map, po) {
            po.preposition = "down";
            return self.go(verb, player, map, po);
        };
        self.sneak = function (verb, player, map, po) {
            return self.go(verb, player, map, po);
        };
        self.enter = function (verb, player, map, po) {
            po.preposition = "in";
            return self.go(verb, player, map, po);
        };
        self.leave = function (verb, player, map, po) {
            po.preposition = "out";
            return self.go(verb, player, map, po);
        };
        self.follow = function (verb, player, map, po) {
          let time = 0;
          switch (po.originalVerb) {
            case "chase":
            case "pursue":
              time = 0.5;
              break; 
            case "track":
            case "trail":
              time = 2;
            case "follow":
            default:  
              time = 1;
          };
          return self.processResponse(player.follow(po.originalVerb, po.subject, map), player, map, po, time);
        };
      
        self.say = function (verb, player, map, po) {
          return self.processResponse(player.say(verb, po.subject, po.object, map), player, map, po, 1);
          //return dp.parseDialogue(verb, player, map, po);
        };
        self.talk = function (verb, player, map, po) {
            return self.say(po.originalVerb, player, map, po);
        };
        self.reply = function (verb, player, map, po) {
            return self.say(po.originalVerb, player, map, po);
        };
        self.shout = function (verb, player, map, po) {
            return self.say(po.originalVerb, player, map, po);
        };
        self.sing = function (verb, player, map, po) {
            return self.say(po.originalVerb, player, map, po);
        };
      
        self.ask = function (verb, player, map, po) {
          let request = po;
          if (po.object) {
            request = lp.parseInput(po.object); //re-parse now we have subject and "ask" to find what we're asking for
          }
          //if (request.action == "question") {request.action = request.originalVerb};
          return self.processResponse(player.ask(request.verb, po.subject, request.subject, map), player, map, po, 1);
          //return dp.parseDialogue(verb, player, map, po);
        };
              
        self.greet = function (verb, player, map, po) {
          return self.processResponse(player.say(verb, po.subject, po.object, map), player, map, po, 1);
          //return dp.parseDialogue(verb, player, map, po);
        };
        
        self.cheat = function(verb, player, map, po) {
           return self.processResponse("Hmmm. I'm sure I heard about some cheat codes somewhere...<br><br>...Nope, I must have imagined it.<br>Looks like it's just you and your brain for now.", player, map, po,1);
        };

        self.help = function(verb, player, map, po) {
          let stuck = "";
          if (_failCount <3 ) {
            stuck = "Stuck already? Ok...";
          }
          return  self.processResponse(
              stuck+
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
          
          const positionIndex = tools.positions.indexOf(po.preposition);
          const searchAdverbs = ["closely", "carefully", "carefuly", "thoroughly", "meticulously"];

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
          return self.processResponse(player.hunt(po.originalVerb, po.subject, map), player, map, po ,2);
        };
        self.put = function (verb, player, map, po) {
          return self.processResponse(player.put(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };
        self.hide = function (verb, player, map, po) {
          return self.processResponse(player.put(verb, po.subject, po.preposition, po.object), player, map, po ,3);
        };
        self.place = function (verb, player, map, po) {
          return self.processResponse(player.put(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,2);
        };
        self.move = function (verb, player, map, po) {
          return self.processResponse(player.put(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };
        self.empty = function (verb, player, map, po) {
          return self.processResponse(player.empty(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,2);
        };
        self.water = function (verb, player, map, po) {
          return self.processResponse(player.put(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,2);
        };
        self.give = function (verb, player, map, po) {
          return self.processResponse(player.give(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };        
        self.feed = function (verb, player, map, po) {
          return self.processResponse(player.give(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,2);
        };  
        self.get = function (verb, player, map, po) {
          if (po.preposition == "apart") {
            po.originalVerb = "dismantle";
            return self.dismantle(verb, player, map, po);
          };
          if (po.subject && po.object) {
            return self.take(verb, player, map, po);
          }
          return self.processResponse(player.get(po.originalVerb, po.subject), player, map, po ,1);
        };

        self.pick  = function (verb, player, map, po) {
          if (po.preposition == "up" || po.originalVerb == "pick up") {
            return self.take(verb, player, map, po);
          };
          
          return self.processResponse(player.unlock(po.originalVerb, po.subject), player, map, po ,1);
        };

        self.take = function (verb, player, map, po) {
          if (po.preposition == "apart") {
            po.originalVerb = "dismantle";
            return self.dismantle(verb, player, map, po);
          };
      
          return self.processResponse(player.take(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };

        self.hold = function (verb, player, map, po) {
          return self.take(verb, player, map, po);
        };

        self.dismantle = function (verb, player, map, po) {
            return self.processResponse(player.dismantle(po.originalVerb, po.subject), player, map, po ,2);
        };

        self.throw  = function (verb, player, map, po) {
          if (po.preposition === "at" && po.object != null) {
            return self.processResponse(player.hit(verb, po.object, po.subject), player, map, po ,1);
          } else if (["in", "into", "in to", "inside", 'onto', 'on to', 'on top of', 'on'].includes(po.preposition) && po.object != null) {
            return self.processResponse(player.put(verb, po.subject, po.preposition, po.object), player, map, po ,1);
          } else {
            return self.processResponse(player.drop(verb, po.subject, po.object), player, map, po ,1);
          };
        };
        self.drop = function (verb, player, map, po) {
          if (["in", "into", "in to", "inside", 'onto', 'on to', 'on top of', 'on'].includes(po.preposition) && po.object != null) {
            return self.processResponse(player.put(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
          } else {
            return self.processResponse(player.drop(po.originalVerb, po.subject, po.object), player, map, po ,1);
          };
        };

        self.sleep  = function (verb, player, map, po) {
          return self.processResponse(player.rest(po.action, 25, map), player, map, po ,1);
        };        
        self.rest  = function (verb, player, map, po) {
          return self.processResponse(player.rest(po.action, 7, map), player, map, po ,1);
        };

        self.wait = function (verb, player, map, po) {
          return self.processResponse(player.wait(1, map), player, map, po ,1);
        };

        self.push = function (verb, player, map, po) {
          return self.processResponse(player.shove(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };
        self.shove = function (verb, player, map, po) {
          return self.processResponse(player.shove(po.originalVerb, po.subject, po.preposition, po.object), player, map, po ,1);
        };

        self.open = function (verb, player, map, po) {
          ticks = 1;
          let response = player.open(po.originalVerb, po.subject);
          //don't consume time if already open
          if (response.includes("already")) { ticks = 0;};
          return self.processResponse(response, player, map, po ,ticks);
        };
        self.pull = function (verb, player, map, po) {
          return self.open(verb, player, map, po);
        };
        self.raise = function (verb, player, map, po) {
          return self.open(verb, player, map, po);
        };

        self.close = function (verb, player, map, po) {
          ticks = 1;
          let response = player.close(po.originalVerb, po.subject);
          //don't consume time if already open
          if (response.includes("not open")) { ticks = 0;};
          return self.processResponse(response, player, map, po ,ticks);
        };
        self.lower = function (verb, player, map, po) {
          return self.close(verb, player, map, po);
        };
        self.roll = function (verb, player, map, po) {
          return self.close(verb, player, map, po);
        };      
        self.seal = function (verb, player, map, po) {
          return self.close(verb, player, map, po);
        };

        self.drink = function(verb, player, map, po) {
          return  self.processResponse(player.drink(po.originalVerb, po.subject), player, map, po,1);
        };       
        self.eat = function(verb, player, map, po) {
          let response = "";
          if (po.object) {response = player.eat(po.originalVerb+" "+po.preposition,po.object);}
          else {response = player.eat(po.originalVerb, po.subject);};
          return  self.processResponse(response, player, map, po,1);
        };

        self.shake = function(verb, player, map, po) {
          return  self.processResponse(player.shake(po.originalVerb, po.subject), player, map, po,1);
        };   

        self.attack = function(verb, player, map, po) {
          //verb, receiverName, artefactName           
          if (po.subject && po.object && (["on", "onto", "on to", "on top of"].includes(po.preposition))) {
            // handle //smash bottle on floor etc       
            //this isn't 100% reliable but is consistent with current game at least. "hit james on his head" for example won't work 
            let tempString = po.subject;
            po.object = po.subject;
            po.subject = tempString;
          };
                            
          return  self.processResponse(player.hit(po.originalVerb, po.subject, po.object), player, map, po,1);
        };
        self.stab = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.smash = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.whip = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.choke = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.fire = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.blast = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.zap = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.shoot = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.kick = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.punch = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };
        self.slap = function(verb, player, map, po) {
          return self.attack(verb, player, map, po);
        };

        self.steal = function(verb, player, map, po) {
          if (!po.object) {
            //if we're not stealing anything specific = make sure we pass in creature name in correct parameter.
            po.object = po.subject;
            po.subject = null;
          }
          return self.processResponse(player.steal(po.originalVerb, po.subject, po.object), player, map, po,1);
        };

        self.pay = function(verb, player, map, po) {
          return self.processResponse(player.pay(po.originalVerb, po.subject, po.object, map), player, map, po,1);
        };
        self.buy = function(verb, player, map, po) {
          return self.processResponse(player.buy(po.originalVerb, po.subject, po.object), player, map, po,1);
        };
        self.sell = function(verb, player, map, po) {
          return self.processResponse(player.sell(po.originalVerb, po.subject, po.object), player, map, po,1);
        };
        self.wave = function(verb, player, map, po) {
          return self.processResponse(player.wave(po.originalVerb, po.subject, po.object), player, map, po,1);
        };

        self.touch = function(verb, player, map, po) {
          return self.processResponse(player.touch(po.originalVerb, po.subject, po.object), player, map, po,1);
        };          
        self.pat = function(verb, player, map, po) {   
          return self.touch(verb, player, map, po);
        };
        self.stroke = function(verb, player, map, po) {   
          return self.touch(verb, player, map, po);      
        };
        self.hug = function(verb, player, map, po) {   
          return self.touch(verb, player, map, po);      
        };
        self.snuggle = function(verb, player, map, po) {   
          return self.touch(verb, player, map, po);      
        };

        self.rub = function(verb, player, map, po) {
          return self.processResponse(player.rub(po.originalVerb, po.preposition, po.subject, po.object), player, map, po,2);
        }; 
        
        self.think = function(verb, player, map, po) {
          return self.processResponse(player.think(po.originalVerb, po.preposition, po.subject, po.object, po.originalInput), player, map, po,2);
        }; 
        
        self.imagine = function(verb, player, map, po) {
          return self.think(verb, player, map, po);
        }; 

        self.unlock = function(verb, player, map, po) {
          return self.processResponse(player.unlock(po.originalVerb, po.subject), player, map, po,1);
        }; 

        self.lock = function(verb, player, map, po) {
          return self.processResponse(player.lock(po.originalVerb, po.subject), player, map, po,1);
        }; 
        
        self.break = function(verb, player, map, po) {
          return self.processResponse(player.breakOrDestroy(po.originalVerb, po.subject), player, map, po,1);
        }; 
                
        self.destroy = function(verb, player, map, po) {
          return self.processResponse(player.breakOrDestroy(po.originalVerb, po.subject), player, map, po,1);
        }; 

        self.kill  = function(verb, player, map, po) { 
          return self.processResponse("Much as you may like to believe in instant karma. If you <b>have</b> to kill, you'll need to fight it out yourself.", player, map, po,0);
        };

        self.cheatcode = function (verb, player, map, po) {
          let response = "cheat!";
          let ticks = 1; //can't completely cheat for free.
          try {
            //Cheating!
            player.incrementCheatCount();
               
            if (po.originalVerb == '+aggression') {
                response =  "Player Aggression set: "+player.setAggression(parseInt(po.subject));
            };

            if (po.originalVerb  == '+stealth') {
                response =  "Player Stealth set: "+player.setStealth(parseInt(po.subject));
            };

            if (po.originalVerb  == '+heal' || po.originalVerb  == '+health') {
                if (!(Number.isInteger(Number(po.preposition)))) {po.preposition = 0};
                if (!po.subject) {
                  player.updateHitPoints(parseInt(po.preposition));
                  response =  "Player Health set to: "+player.getHitPoints();
                } else {
                  const creature = map.getCreature(po.subject);
                  if (creature) {
                    creature.updateHitPoints(parseInt(po.preposition))
                    response =  "Healed "+creature.getName()+": "+creature.health();
                  } else {
                    response =  "cannot find "+po.subject+" to heal"; 
                  };     
                };
            };
                
            if (po.originalVerb  == '+dead') {
                response =  "Obituaries: " + map.listDead();
            };
                
            if (po.originalVerb  == '+contagion' || po.originalVerb  == '+infected') {
                response =  "Infected: " + map.listInfected();
            };
                
            if (po.originalVerb  == '+immunity' || po.originalVerb  == '+immune') {
                response =  "Immune: " + map.listImmune();
            };

            if (po.originalVerb  == '+kill') {
                const creature = map.getCreature(po.subject);
                if (creature) {
                  response =  "Killing "+creature.getName()+":<br>"+creature.kill();
                } else {
                  response =  "cannot find "+po.subject+" to kill";   
                };            
            };
                
            if (po.originalVerb  == '+hurt') {
                const creature = map.getCreature(po.subject);
                if (creature) {
                  response =  "Hurting " + creature.getName() + ":<br>" + creature.hurt(po.object);
                } else {
                  response =  "cannot find " + po.subject + " to hurt";
                };
            };
                
            if (po.originalVerb  == '+die') {
                response =  player.kill();
            };

            if (po.originalVerb  == '+attrib') {
              let item;
              if (!po.subject) {
                item = player.getCurrentLocation();
              };
              if (po.subject == "player" || po.subject == "self" || po.subject == "me") {
                item = player;
              };
              if (!(item)) {
                item = player.getObject(po.subject);
              };
              if (!(item)) {
                const loc = player.getCurrentLocation();
                if (loc) {
                  item = loc.getObject(po.subject);
                };
              };
              if (!(item)) {
                item = map.getObject(po.subject);
              };
              if (!(item)) {
                item = map.getNamedMission(po.subject, player);
              };
              if (item) {
                let itemString = item.toString();
                itemString = itemString.replace(/<br>/g, '&lt;br>');
                itemString = itemString.replace(/\\/g, '\\\\');
                response =  itemString.replace(/"/g, '\\"');
              } else {
                response =  "cannot find " + po.subject;
              };
            };
                               
            if (po.originalVerb  == '+time') {
              //default 9am
              if (Number.isInteger(Number(po.preposition)))  {po.subject = 9};
              response =  player.time(parseInt(po.preposition), 0); 
            };

            if (po.originalVerb  == '+wait') {
              if (Number.isInteger(Number(po.preposition))) {po.preposition = 1};
              ticks = parseInt(po.preposition);
              player.incrementWaitCount(ticks);
              response =  "Waiting " + po.preposition + " ticks...";       
            };

            if (po.originalVerb  == '+go') {
              const location = map.getLocation(po.subject);
              if (location) {
                response =  "Player teleported:<br> "+player.setLocation(location);
              } else {
                response =  "location '"+po.subject+"' not found.";
              };
            };

            if (po.originalVerb  == '+find'||verb == '+where') {
              if(po.object) { response =  map.find(po.object, true, true);}
              else { response =  map.find(po.subject, true, true); };
            };

            if (po.originalVerb  == '+get') {
              let inventory = player.getInventoryObject();
              if(po.object) { response =  inventory.add(map.getObject(po.object, true, true));}
              else { response =  inventory.add(map.getObject(po.subject, true, true)); };
            };

            if (po.originalVerb  == '+fix') {
              const item = map.getObject(po.subject);
              if (item) {
                response =  item.forceRepair();
              } else {
                response =  "cannot find " + po.subject + " to fix";
              };
            };

            if (po.originalVerb  == '+missions') {
              response =  map.listAllMissions(player);
            };
            
            if (po.originalVerb  == '+activate' || po.originalVerb  == '+start') {
              response =  map.activateNamedMission(po.subject, player);
            };

            if (po.originalVerb  == '+complete') {
              response =  map.completeNamedMission(po.subject, player);
            };
                
            if (po.originalVerb  == '+fail') {
              response =  map.failNamedMission(po.subject, player);
            };

            if (po.originalVerb  == '+destination') {
              const creatures = map.getAllCreatures();
              let resultString = "";
              for (let c=0;c<creatures.length;c++) {
                creatures[c].clearPath();
                resultString+=creatures[c].goTo(po.subject, 0, map)+"<br>";
              };
              response =  resultString;
            };

            if (po.originalVerb  == '+affinity') {
              let creatureName = null;
              let affinity = 1;

              if (po.subject) {
                creatureName = po.subject;
              };

              if (Number.isInteger(Number(po.preposition))) {
                affinity = parseInt(po.preposition);
              };

              let creatures = [];
              if (creatureName) {creatures.push(map.getCreature(creatureName)) }
              else {creatures = map.getAllCreatures();}
              for (let c=0;c<creatures.length;c++) {
                creatures[c].increaseAffinity(affinity)+"<br>";
              };

              if (!creatureName) {creatureName = "Global"};
              if (creatures.length > 0) {
                response =  creatureName+" affinity increased by "+affinity;
              } else {response = "No creatures found"}
            };

            if (po.originalVerb  == '+cash' || po.originalVerb  == '+money') {
              player.updateCash(po.subject);
              response =  "Player cash balance changed by "+po.subject;
            };

          } catch (err) {
            let input = ""
            if (po) {input = po.originalInput}
            console.error('Cheat Action processing error. Input: '+input+'. Response: '+response+', ParsedObject: '+po+'. Error: '+err);
            throw err;              
          };	
          return self.processResponse("$cheat$"+response, player, map, po, ticks);
        };       
  }  catch(err) {
	    console.error('Unable to create Actions object: '+err.stack);
        throw err;
  };
};