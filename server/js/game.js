"use strict";
//game object
module.exports.Game = function Game(playerAttributes,aGameID, aMap, mapBuilder, fileName, fileManager) {
    try{
        //module deps
        var playerObjectModule = require('./player');
        const createEngine = require('./engine.js');

	    var self = this; //closure so we don't lose this reference in callbacks
        var _fm = fileManager;
        var _filename = fileName;
        var _map = aMap; //map of game locations
        var _player = new playerObjectModule.Player(playerAttributes, _map, mapBuilder);
        var _id = aGameID;
        var _log = ''; //log of game script - not currently used
        var _currentLocation; //id of current location
        var _engine = null; //player action object (sort of singleton)
        var _timeStamp = parseInt(new Date().getTime()); //track when last action ocurred

	    var _objectName = "Game";
        
        var locationDescription = _player.setLocation(_player.getCurrentLocation());
        var locationImage = _player.getCurrentLocation().getImageName();

        //log game created
        console.info(_objectName+' id: '+_id+' created for '+_player.getUsername());	

        ////public methods
        self.getUsername = function() {
            return _player.getUsername();
        };

        self.checkUser = function(aUsername, anId) {
            if ((_player.getUsername() == aUsername) && (anId == _id)) {return true};
            return false;
        };	

        self.getTimeStamp = function() {
            return _timeStamp;
        };

        self.setTimeStamp = function(timestamp) {
            if (!(timestamp)) {
                timestamp = new Date().getTime();
            };
            _timeStamp = parseInt(timestamp);
        };

        self.getFilename = function() {
            return _filename;
        };

        self.saveAsync = async function() {
            self.setTimeStamp();
            var newSave = false;
            //console.debug("attempting to save game using async call");
            if (!(_player.canSaveGame())) {
                return('{"username":"'+_player.getUsername()+ '","id":"'+_id+'","description":"'+'You\'ve not achieved enough to be worth saving yet."}');
            };

            var fileId = Math.floor(parseInt((parseInt(new Date().getTime()).toString()).substring(5))/137);

            if (_filename == undefined|| _filename == null ||_filename == ""||_filename == "undefined") {
                //want to save this filename as a player attribute so that it's visible in their status file.
                _filename = _player.getUsername()+"-"+fileId;
                newSave = true;
            }; 

            //this is the first time a player is saving, don't overwrite existing files...
            var dataExists = await _fm.gameDataExistsAsync(_filename);
            var newIndex = 0;
            while (dataExists && newSave) {
                //if the file already exists, we need to find a new filename
                newIndex++;
                if (newIndex>=25) {
                        return( '{"username":"'+_player.getUsername()+ '","id":"'+_id+'","description":"'+'Unable to save game. It looks like we\'ve got too many previous games saved with your name already.<br>Try loading one of your old games or playing under a different name instead.","saveid":"'+_filename+'"}');
                    } else {
                        _filename = _player.getUsername()+"-"+fileId+newIndex;
                        dataExists = await _fm.gameDataExistsAsync(_filename);
                    };
            };

            //track how many times they've saved/loaded/
            _player.incrementSaveCount();
            await _fm.writeGameDataAsync(_filename, self.fullState(), true);
            console.info("game saved as "+_filename);
            return ('{"username":"'+_player.getUsername()+ '","id":"'+_id+'","description":"'+"Game saved as <b>"+_filename+'</b>.<br>Please make a note of your saved game filename.<br><i>(You\'ll need it if you want to <i>load</i> or recover this game later.)</i>","attributes":'+JSON.stringify(_player.getClientAttributes())+',"saveid":"'+_filename+'"}');
        };

        self.state = function() {
            var resultString = '{"username":"'+_player.getUsername()+ '","id":"'+_id+'","description":"'+locationDescription+'","saveid":"'+_filename+'"';
            resultString += ',"attributes":'+JSON.stringify(_player.getClientAttributes());
            if (locationImage) {
                resultString += ',"image":"'+locationImage+'"';
            };
            resultString += '}';
            return resultString;
        };

        self.fullState = function() {
            var stateData = [];
            try {
                stateData.push(_player.toString());
            } catch (e) {console.error("Error parsing JSON for player: error = "+e+": "+_player.toString());};
            
            stateData = stateData.concat(_map.getLocationsAsString());
            return stateData;
        };

        self.userAction = function(actionString) {
            //create single instance of player actions is not previously set
            if (!(_engine)) {
                _engine = createEngine(_player, _map);
            };
            var responseJson = JSON.stringify(_engine(actionString));
            self.setTimeStamp();
            console.info('responseJson: '+responseJson); 
            return responseJson;
        };

        self.getId = function() {
            //console.debug("retrieving game ID:"+_id);
            return _id;
        };

        self.getNameAndId = function() {
            return '{"username":"'+_player.getUsername()+'","id":"'+_id+'"}';
        };
    
        self.toString = function() {
            return '{"Username": "'+_player.getUsername()+'"}';
        };

        ////end public methods
    }
    catch(err) {
	    console.error('Unable to create Game object: '+err);
        throw err;
    };
};