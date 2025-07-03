"use strict";
//exit object - manage exists from locations
module.exports.Exit = function Exit(aDirection, aSourceName, aDestinationName, aDescription, isHidden, requiredAction) {
    try{
        const tools = require('./tools.js');
	    var self = this; //closure so we don't lose this reference in callbacks
        var _name = aDirection;
        var _direction = aDirection;
        //var _description = aDescription;
        
        //long names are in an array with short names, just 1 index later - pretty crappy but does the job
        var _longName = tools.directions[tools.directions.indexOf(_name)+1];
        if (_name == 'n' || _name == 's' || _name== 'e'|| _name == 'w') {
            _longName = tools.initCap(_longName);
        };

        //self.visits = 0;
        var _hidden = false;
        if (isHidden == true || isHidden == "true") { _hidden = true;};

        var _possibleActions = ["run", "climb", "jump", "crawl", "drive", "sail", "fly", "ride", "swim","",undefined];
        var _requiredAction = requiredAction; //"run", "climb", "jump", "crawl", "drive", "sail", "fly", "ride", ""

        if (_possibleActions.indexOf(_requiredAction) == -1) { throw "'" + requiredAction + "' is not a valid action.";}; 

        var _destinationName = aDestinationName;
        var _sourceName = aSourceName;
        var _description = aDescription;

	    var _objectName = "exit";
        //console.debug(_objectName + ' created: '+_name+', '+_destinationName+' visible? '+(!(_hidden)));

        ////public methods
        self.toString = function() {
            var resultString = '{"object":"'+_objectName+//'","name":"'+_name+
            '","longname":"'+_longName+'","direction":"'+_direction+'","source":"'+_sourceName+'","destination":"'+_destinationName+'"';
            if (_description) { resultString += ', "description":"'+_description+'"'; };
            if (_hidden) { resultString += ', "hidden":'+_hidden; };
            if (_requiredAction) { resultString += ', "requiredAction":"'+_requiredAction+'"'; };
            resultString += '}';
            return resultString;
        };

        self.getDescription = function() {
            return _description;
        };

        self.setDescription = function(description) {
            _description = description;
        };

        self.getDirection = function() {
            return _direction;
        };

        self.getLongName = function() {
            return _longName;
        };

        self.setDestinationName = function(destinationName) {
            _destinationName = destinationName;
            return _destinationName;
        };

        self.getDestinationName = function() {
            return _destinationName;
        };

        self.getSourceName = function() {
            return _sourceName;
        };

        self.isVisible = function() {
            return (!(_hidden));
        };
        
        
        self.setRequiredAction = function (action) {
            //used for test support only
            _requiredAction = action;
        };        

        self.getRequiredAction = function() {
            return _requiredAction;
        };

        self.requiredAction = function(verb) {
            if (!(_requiredAction)) { return true;};
            if (verb == _requiredAction) {
                return true;
            };

            if (_requiredAction == "crawl" && verb == "climb") {
                return true; //special case for climbing into something small
            };

            return false;
        };

        self.hide = function() {
            _hidden = true;
            var directionString = ": '"+_longName+"'";
            if (tools.directions.indexOf(_name) < 12){directionString = " to the "+_longName;};
            return "You close the exit"+directionString+"." 
        };

        self.show = function() {
            _hidden = false;
            var directionString = " '"+_longName+"'";
            if (tools.directions.indexOf(_name) < 12){directionString = " to the "+_longName;};
            return "You reveal a new exit"+directionString+".";
        };

        ////end public methods
    }
    catch(err) {
	    console.error('Unable to create Exit object: '+err);
        throw err;
    };	
};