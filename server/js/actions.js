// actions.js
module.exports= {
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
         null: () =>{
          var randomReplies = ["Can you try again?", "It's probably my fault for not listening to you properly.", "Can you try something else?", "I'm sensing that we have a communication problem here.", "Is everything ok?"];
          var randomIndex = Math.floor(Math.random() * randomReplies.length);
          return "Sorry, I didn't hear you there. " + randomReplies[randomIndex];
        },
        cheat: () => {
          return "Hmmm. I'm sure I heard about some cheat codes somewhere...<br><br>...Nope, I must have imagined it.<br>Looks like it's just you and your brain for now.";
        },
        help: () =>{
          return "<br> I accept basic commands to move e.g. <i>'north','south','up','in'</i> etc.<br>" +
                 "You can interact with objects and creatures by supplying a <i>verb</i> and the <i>name</i> of the object or creature. e.g. <i>'get sword'</i> or <i>'eat apple'</i>.<br>" +
                 "You can also <i>'use'</i> objects on others (and creatures) e.g. <i>'give sword to farmer'</i>, <i>'hit door with sword'</i> or <i>'put key in box'</i>.<br>" +
                 "<br>Two of the most useful verbs to remember are <i>'look'</i> and <i>'examine'</i>.<br>" +
                 "In general I understand a fairly limited set of interactions (and I won't tell you them all, that'd spoil the fun) but hopefully they'll be enough for you to enjoy something more than a minimum viable adventure.<br>" +
                  "<br>To find out more about how you're doing, try <i>'stats'</i> or <i>'status'</i><br>" +
                  "In many cases, your positive or negative interactions within the game may impact how others respond to you, use this knowledge wisely.<br>" +
                  "<br>You can save your progress by entering <i>'save'</i>.<br>You can return to a previously saved point from <i>this</i> session by simply typing <i>restore</i><br>You can load a previously saved game by entering '<i>load filename-x</i>' (where <i>filename-x</i> is the name of your previously saved game file.)<br>" +
                  "If you've really had enough of playing, you can enter <i>quit</i> to exit the game (without saving).<br>";
        },
        map: () => {
          return "Oh dear, are you lost? This is a text adventure you know.<br>Time to get some graph paper, a pencil and start drawing!";
        },
        health: (verb, player, map, po) => {
          return player.health(po.subject);
        },
        heal: (verb, player, map, po) => {
          return player.healCharacter(po.subject);
        },

        stats: (verb, player, map, po) => {
          return player.stats(map);
        },
        status: (verb, player, map, po) => {
          return player.status(map.getMaxScore());
        },
        visits: (verb, player, map, po) => {
          return player.getVisits();
        },
        inventory: (verb, player, map, po) => {
          return player.describeInventory();
        },
        examine: (verb, player, map, po) =>{
          let keepVerbs = ["search", "investigate", "inspect", "check", "peer", "browse", "stare", "look"]
          if (keepVerbs.includes(po.originalVerb)) {verb = po.originalVerb};
          if (["look", "peer", "stare"].includes(po.originalVerb) && po.preposition == "at") {
            verb = po.originalVerb+" at"
            po.preposition = "";
          };
          return player.examine(verb, po.subject, po.object, map, po.adverb, po.preposition);
        },
        put: (verb, player, map, po) =>{
          return player.put(verb, po.subject, po.preposition, po.object);
        },
        take: (verb, player, map, po) =>{
          //player.take(_verb, _object0, _object1);
          return player.take(verb, po.subject, po.object);
        },
        throw: (verb, player, map, po) =>{
          //player.hit (_verb, _object1, _object0);
          if (po.preposition === "at" && po.object != null) {
            return player.hit(verb, po.subject, po.object);
          } else if (po.preposition === "in" && po.object != null) {
            return player.put(verb, po.subject, po.preposition, po.object);
          } else {
            //_player.drop(_verb, _object0, _map);
            return player.drop(verb, po.subject, po.object);
          };
        },
        wait: (verb, player, map, po) =>{
          return player.wait(1, map);
        },
};