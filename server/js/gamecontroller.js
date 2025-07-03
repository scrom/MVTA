"use strict";
//game controller object - manages set of games and communication with interpreter
exports.GameController = function GameController(mapBuilder, fileManager) {
    try {
	    var self = this; //closure so we don't lose thisUi refernce in callbacks
        var _games = [];
        var _inactiveGames = [];
        var _savedGames = [];
        var _savedGamesDataKey = "mvta.savedGames";
        var _mapBuilder = mapBuilder; //
        var _map;
	    var _objectName = "GameController";

        //module deps
        const gameObjectModule = require('./game');
        var _fm = fileManager;

        var readSavedGamesListAsync = async function() {
            var data = await _fm.readGameDataAsync(_savedGamesDataKey);
            if (data) {
                for (var i=0;i<data.length;i++) {
                    _savedGames.push(data[i]);
                    //console.debug(data[i]);
                };
            console.info("Expired game data retrieved on startup - "+_savedGames.length+" references.");
            };
        };

        var writeSavedGamesListAsync = async function() {

            //'{"username":"'+savedGame.getUsername()+'","id":'+savedGame.getId()+', "filename":"'+savedGame.getFilename()+'"}'
            var saveDataStringArray = [];

            //if we've built up too many expired games, just salvage the last 500.
            if (_savedGames.length > 1000) {
                _savedGames = _savedGames.slice(-500);
            };
            for (var i=0;i<_savedGames.length;i++) {
                saveDataStringArray.push('{"username":"'+_savedGames[i].username+'", "id":'+_savedGames[i].id+',"filename":"'+_savedGames[i].filename+'"}');
            };
            await _fm.writeGameDataAsync(_savedGamesDataKey, saveDataStringArray, true); //fileName, data, overwrite
            console.info("expired game data saved - "+_savedGames.length+" references.");
            return null;
        };

        //retrieve stored data
        readSavedGamesListAsync();

        console.info(_objectName + ' created');

        //// public methods   
        self.checkForExpiredGames = async function(gameTimeOut) {
            console.info("Checking for expired games...");
            for (var g=0;g<_games.length;g++) {
                var now = parseInt(new Date().getTime());
                if (typeof _games[g] == "object") {
                    //if not active for the last hour, kill the game
                    if (_games[g].getTimeStamp() < now-gameTimeOut) {
                        
                        var savedResult = await _games[g].saveAsync();

                        //savedGame originally returned as full game object
                            var saved;
                            if (savedResult) {
                                try {
                                    saved = JSON.parse(savedResult);
                                } catch (e) {console.error("Error parsing JSON for save game result: error = "+e+": "+savedResult);};
                                   
                                //console.debug("saved");  username id saveid
                                if (saved.description) {
                                    //console.debug("saved.description");
                                    if (saved.description.substring(0,10) == "Game saved") {
                                        if (saved.username && saved.id && saved.saveid) {
                                            //avoid writing nulls etc - will cause data corruption and problems with loading.
                                            _savedGames.push({"username":saved.username,"id":saved.id,"filename":saved.saveid});
                                            await writeSavedGamesListAsync();
                                            console.info("Timed out game saved as id:"+saved.id+", username:"+saved.username+", filename:"+saved.saveid+" removing from gameController.");
                                            
                                            //remove game from controller, store its ID and push into inactiv egames list
                                            _games[g] = g; //set just ID into game slot
                                            _inactiveGames.push(g);
                                        };
                                    };
                                };
                            };
                            //console.debug(_inactiveGames); 
                          
                    }; 
                };
            }; 
        };
        
        self.monitor = async function(pollFrequencyMinutes, gameTimeOutMinutes) {
            //convert inputs to millis
            var pollFrequency = pollFrequencyMinutes*60000; 
            var gameTimeOut = gameTimeOutMinutes*60000; 
            setInterval(function(){self.checkForExpiredGames(gameTimeOut);}, pollFrequency);
        }; 

        self.findSavedGame = function(username, gameId) {
            var filename;
            for (var i=0;i<_savedGames.length;i++) {
                if (_savedGames[i].username == username && _savedGames[i].id == gameId) {
                    filename = _savedGames[i].filename;
                    //console.debug("saved game found");
                    break;
                };
            };

            var resultString = "<b>Sorry, your game has timed out and is no longer active.</b>"
            if (filename) {
                resultString+= "<br>Fortunately we were able to save it for you!<br>You can recover your game by loading the game file "+filename+".<br>Oh, by the way - thanks for coming back :D";
            } else {
               resultString+= "<br>Unfortunately we weren't able to save your game this time - sorry about that.<br>Hopefully you're still willing to give it another shot.<br>If you'd like to play again, please reload this page in your browser."; 
            };
            return '{"username":"","id":'+gameId+',"description":"'+resultString+'"}';
        };

        self.getNextAvailableGame = function() {
            var gameId;

            //try an old inactive game id first
            if (_inactiveGames.length >1) { //want at least 2 "old" games.
                gameId = _inactiveGames.unshift(); //take ID from oldest "retired" game.
            } else {
                _games.push(_games.length); //reserve placeholder!
                gameId = _games.length-1;
            };
            return gameId;
        };

        self.getInactiveGames = function() {
            return _inactiveGames;
        };
         
        self.addGame = function(aUsername, sessionLimit) {
            //prevent too many active games
            if (!(sessionLimit)) {sessionLimit = 10;}; //extreme throttling if not set
            if (_games.length >= sessionLimit) {return -1;};

            var newMap = _mapBuilder.buildMap();
            var startLocation = newMap.getStartLocation();
            if (!(startLocation)) {console.error('Error: Cannot determine start location for map.');};
            var startLocationName = startLocation.getName();
            var playerAttributes = {"username":aUsername, "startLocation": startLocationName, "currentLocation": startLocationName};

            var newGameId = self.getNextAvailableGame();
            var game = new gameObjectModule.Game(playerAttributes,newGameId, newMap, _mapBuilder, null, _fm);           
            
            //add new game into appropriate placeholder
            _games[newGameId] = game;


            //console.debug('new game: '+game.toString());  
            
            console.info('game ID: '+newGameId+' added to controller. Open games: '+(_games.length-_inactiveGames.length));

            return newGameId;
        };

        //adding games into the controller from outside shouldn't be possible - but needed for testing. Probably a code smell!
        self.addPreMadeGame = function(aGameObject) {
            var sessionLimit = 10; //minimise the number of games via this route.
            if (_games.length >= sessionLimit) {return -1;}; //prevent too many active games
            var gameId = aGameObject.getId();
            if (gameId in _games) {
                console.error("Error: Game ID already in use.");
                return -1;
            } else {
                _games[gameId] = aGameObject;
                console.info('game ID: '+gameId+' added to controller. Open games: '+(_games.length-_inactiveGames.length));
                return gameId;
            };

        };

        self.loadGameAsync = async function(originalGameId, filename, username) {
            if (filename == "") {
                if (_games[originalGameId]) {
                    if (_games[originalGameId].getUsername() == username) {
                        filename = _games[originalGameId].getFilename();
                    }
                };
            };
            
            console.info("requested game: filename: '"+filename+"' originalGameId: "+originalGameId+" username: '"+username+"'");   

            const gameData = await _fm.readGameDataAsync(filename);
            //console.debug("Game Data: "+gameData);
            var game;
            //if game file not found, return null.
            if (!(gameData)) {
                return null;
            } else {
                //remove from pool of expired games we're tracking
                var expiredGamesToKeep = [];
                for (var s=0;s<_savedGames.length;s++) {
                    if (_savedGames[s].filename != filename) {expiredGamesToKeep.push(_savedGames[s]);};
                };
                    _savedGames = expiredGamesToKeep;
                    await writeSavedGamesListAsync();

                    var playerAttributes = gameData[0];
                    var newMap = _mapBuilder.buildMap(gameData);
                    console.info ("game file "+filename+" loaded.");

                    console.debug("originalGameId:"+originalGameId);
                    //if loading from within an active game, we want to replace the existing game rather than adding another
                    if (originalGameId >= 0) {
                        game = new gameObjectModule.Game(playerAttributes,originalGameId, newMap, _mapBuilder, filename, _fm);
                        _games[originalGameId] = game;
                        console.info('game ID: '+originalGameId+' replaced. Open games: '+_games.length);
                        return (originalGameId);
                    } else {
                    //if (originalGameId == "" || originalGameId == null || originalGameId == undefined || originalGameId == "undefined") {
                        var newGameId = self.getNextAvailableGame(); //note we don't use the original game Id at the moment (need GUIDS)
                        game = new gameObjectModule.Game(playerAttributes,newGameId, newMap, _mapBuilder, filename, _fm);
                        _games[newGameId] = game; 
                        console.info('game ID: '+newGameId+' added to controller. Open games: '+_games.length);
                        return (newGameId);
                    };
                };

        };

        ////used when quitting
        self.removeGame = function (aUsername, aGameId) {
            var description = "If you\'d like to play again, please either <i>load</i> an old game (if you have one) or type in your name to start a new one.";
            if ((typeof _games[aGameId] != "object")) { return '{"username":"","id":-1,"description":"Sorry, this game is no longer active."}'; }            ;
            if (_games[aGameId].checkUser(aUsername, aGameId)) {
                _games[aGameId] = aGameId; //remove game object and replace with just ID.
                console.info(aGameId + ' removed from games list');
                return '{"username":"","id":-1,"description":"Thanks for playing!<br>'+description+'"}';
            } else {
                console.debug(aGameId + ' not found');
            };
            return '{"username":"","id":-1,"description":"It looks like the game you\'re trying to quit isn\'t active anyway<br>' + description + '"}';
        };

        ////not yet in use
        self.getGame = function(aUsername, aGameId) {
            return _games[aGameId];
        };

        self.getUsernameForGameID = function(gameId) {
            var game = _games[gameId];
            if (game){
                var username = game.getUsername();
                return username;
            };
            return null;
        };

        self.getGameState = function(aUsername, aGameId) {
            if ((typeof _games[aGameId] != "object")) {return '{"username":"","id":aGameId,"description":"Sorry, this game is no longer active."}';};
            if (_games[aGameId].checkUser(aUsername, aGameId)) {return _games[aGameId].state();};
        };

        self.listGames = function() {
            var gamelist ='{"games":[';

            for (var i = 0; i < _games.length; i++) {
                if (i>0) {gamelist +=','};
                var aGame = self.getGame(null, i).getNameAndId();
                gamelist += aGame;
                //console.debug('game: '+i+' details: '+self.getGame(null, i).getNameAndId());//+' toString: '+self.getGame(i).toString());
            };

            gamelist += ']}';
            //console.debug(gamelist);
            return gamelist; //@todo enhance in future to include more game details beyond name and id
        };

        self.userAction = function(aUsername, aGameId,anAction) {
            //console.debug(_games[aGameId]);
            if (_games[aGameId] == undefined) {
                console.debug('invalid gameId:'+aGameId);
                return self.findSavedGame(aUsername, aGameId);
            };

            if (!(typeof _games[aGameId] == "object")) {
                console.info('expired game hit:'+aUsername);
                return self.findSavedGame(aUsername, aGameId);
            };

            if (!(_games[aGameId].checkUser(aUsername, aGameId))) {
                console.debug('invalid user:'+aUsername);
                return '{"username":"","id":-1,"description":"Sorry, it looks like you\'re trying to play a game that we don\'t have.<br>Please refresh this page in your browser and either <i>load</i> an old game (if you have one) or start a new one (if you don\'t)."}';
            };

            //if (_games.length >= sessionLimit) {return -1;};
            return _games[aGameId].userAction(anAction);

        };

        self.getRootMap = function() {
            if (!_map) {
                //cache map the first time we ask for it.
                _map = _mapBuilder.buildMap();
            };
            return _map.getLocationsJSON();
        };

        //// end public methods

    }
    catch(err) {
	    console.error('Unable to create GameController object: '+err);
        throw err;
    };	

};
