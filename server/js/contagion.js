"use strict";
//contagion object
exports.Contagion = function Contagion(name, displayName, attributes) {
    try {
        //module deps
        var tools = require('./tools.js');
        var self = this; //closure so we don't lose this reference in callbacks

        var _name = name;
        var _displayName = displayName;
        var _incubationPeriod = 0;
        var _originalIncubationPeriod = 0;
        var _communicability = 0;
        var _transmission = "bite";
        var _mutate = false;
        var _symptoms = [];
        var _originalSymptoms = [];
        var _duration = -1;
        var _originalDuration = -1;
        
        var _previousContagionString = "";


        var _objectName = "Contagion";
        //console.debug(_objectName + ' created: ' + _name);

        var processAttributes = function (contagionAttributes) {
            if (!contagionAttributes) { return null; };
            if (contagionAttributes.incubationPeriod != undefined) { _incubationPeriod = contagionAttributes.incubationPeriod; };
            if (contagionAttributes.communicability != undefined) { _communicability = contagionAttributes.communicability; };
            if (contagionAttributes.transmission != undefined) { _transmission = contagionAttributes.transmission; };
            if (contagionAttributes.mutate != undefined) { _mutate = contagionAttributes.mutate; };
            if (contagionAttributes.symptoms != undefined) {
                for (var i = 0; i < contagionAttributes.symptoms.length; i++) {
                    _symptoms.push(contagionAttributes.symptoms[i]);
                };
            };

            if (contagionAttributes.originalSymptoms != undefined) {
                for (var i = 0; i < contagionAttributes.originalSymptoms.length; i++) {                    
                    _originalSymptoms.push(contagionAttributes.originalSymptoms[i]);
                };
            } else {
                for (var i = 0; i < contagionAttributes.symptoms.length; i++) {
                    //note, the symptoms object is passed by reference so we need to create a new copy of the symptoms.
                    var newSymptom = {}
                    for (var k in contagionAttributes.symptoms[i]) {
                        newSymptom[k] = contagionAttributes.symptoms[i][k];
                    };
                    _originalSymptoms.push(newSymptom);
                };
            };

            if (contagionAttributes.duration != undefined) { _duration = contagionAttributes.duration; };

            if (contagionAttributes.originalDuration != undefined) {
                _originalDuration = contagionAttributes.originalDuration;
            } else {
                _originalDuration = contagionAttributes.duration;
            };

            if (contagionAttributes.originalIncubationPeriod != undefined) {
                _originalIncubationPeriod = contagionAttributes.originalIncubationPeriod;
            } else {
                _originalIncubationPeriod = contagionAttributes.incubationPeriod;
            };
        };

        processAttributes(attributes);

        ////public methods
        self.toString = function() {
            //var _synonyms = [];
            var resultString = '{"object":"'+_objectName+'","name":"'+_name+'","displayName":"'+_displayName+'"';
            resultString += ',"attributes":' + JSON.stringify(self.getAttributesToSave()); //should use self.getCurrentAttributes()
            resultString += '}';
            return resultString;
        };
        
        self.getType = function () {
            return "contagion";
        };

        self.getCurrentAttributes = function () {
            var currentAttributes = {};
            currentAttributes.incubationPeriod = _incubationPeriod;
            currentAttributes.originalIncubationPeriod = _originalIncubationPeriod;          
            currentAttributes.communicability = _communicability;
            currentAttributes.transmission = _transmission;
            currentAttributes.mutate = _mutate;
            currentAttributes.symptoms = _symptoms;
            currentAttributes.originalSymptoms = _originalSymptoms;
            currentAttributes.duration = _duration;
            currentAttributes.originalDuration = _originalDuration;
            return currentAttributes;
        };

        self.getSymptoms = function () {
            return _symptoms
        };

        self.getCloneAttributes = function () {
            var cloneAttributes = {};

            //randomly start or stop mutating (33% chance it *will* mutate)
            let randomInt = Math.floor(Math.random() * 3);
            if (randomInt == 0) {
                cloneAttributes.mutate = true;
            } else {
                cloneAttributes.mutate = false;
            };
            if (_mutate) { 
                cloneAttributes.incubationPeriod = Math.round((Math.random() * _originalIncubationPeriod+1)); //something similar to or shorter than original
                cloneAttributes.communicability = Math.round(Math.random()*100)/100 //somewhere between 0 and 1
                cloneAttributes.symptoms = self.mutateSymptoms(_originalSymptoms); //mutate from original.         
                if (_originalDuration > -1) {//if duration is permanent, don't alter it
                    cloneAttributes.duration = Math.round(Math.random() * (_originalDuration * 2)); //between 0 and 2*original
                };                
            } else {
                cloneAttributes.incubationPeriod = _originalIncubationPeriod;
                cloneAttributes.communicability = _communicability;
                cloneAttributes.symptoms = _originalSymptoms;
                cloneAttributes.duration = _originalDuration;
            };

            cloneAttributes.transmission = _transmission;
            return cloneAttributes;
        };

        
        self.clone = function () {
            return new Contagion(_name, _displayName, self.getCloneAttributes());
        };

        self.getAttributesToSave = function () {
            var saveAttributes = {};
            var contagionAttributes = self.getCurrentAttributes();

            if (contagionAttributes.incubationPeriod > 0) { saveAttributes.incubationPeriod = contagionAttributes.incubationPeriod; };
            if (contagionAttributes.incubationPeriod != contagionAttributes.originalIncubationPeriod) { saveAttributes.originalIncubationPeriod = contagionAttributes.originalIncubationPeriod; };
            if (contagionAttributes.communicability > 0) { saveAttributes.communicability = contagionAttributes.communicability; };
            if (contagionAttributes.transmission != "bite") { saveAttributes.transmission = contagionAttributes.transmission; };
            if (contagionAttributes.mutate) { saveAttributes.mutate = contagionAttributes.mutate; };
            if (contagionAttributes.symptoms.length > 0) { saveAttributes.symptoms = contagionAttributes.symptoms; };
            if (contagionAttributes.duration > -1) { saveAttributes.duration = contagionAttributes.duration; };
            if (contagionAttributes.duration != contagionAttributes.originalDuration) { saveAttributes.originalDuration = contagionAttributes.originalDuration; };

            //have symptoms changed?
            var saveOriginalAttributes = false;
            for (var i = 0; i < contagionAttributes.symptoms.length; i++) {
                if (contagionAttributes.symptoms[i].escalation) {
                    if (contagionAttributes.symptoms[i].escalation > 0) {
                        for (var j = 0; j < contagionAttributes.originalSymptoms.length; j++) {
                            if (contagionAttributes.originalSymptoms[j].action && contagionAttributes.symptoms[i].action) {
                                if (contagionAttributes.originalSymptoms[j].action == contagionAttributes.symptoms[i].action) {
                                    if (contagionAttributes.symptoms[i].frequency != contagionAttributes.originalSymptoms[j].frequency) {
                                        saveOriginalAttributes = true;
                                    };
                                };
                            };
                        };
                    };
                }
            };
            if (saveOriginalAttributes) { saveAttributes.originalSymptoms = contagionAttributes.originalSymptoms; };

            return saveAttributes;
        };

        self.getName = function () {
            return _name;
        };

        self.getDisplayName = function () {
            return _displayName;
        };

        self.transmit = function (carrier, receiver, transmissionMethod) {
            if (_transmission == transmissionMethod) {
                if ((!(receiver.hasContagion(self.getName()))) && (!(receiver.hasAntibodies(self.getName())))) {
                    //if active or ~50% through incubation period
                    if ((_incubationPeriod <= 0) || (_incubationPeriod <= _originalIncubationPeriod / 2)) {
                        var randomInt = Math.random() * (_communicability * 10);
                        if (randomInt > 0) {
                            receiver.setContagion(self.clone());
                        };
                    };
                };
                if (receiver.hasAntibodies(self.getName())) {
                    var randomInt = Math.random() * (_communicability * 15); //~50% higher chance of antibody success than original
                    if (randomInt > 0) {
                        carrier.setAntibody(self.getName());
                    };
                };
            };
        };
        
        self.deduplicateContagionStrings = function (contagionString, carrier) {
            if (_previousContagionString.length > 0) {
                //contagion has happened before

                if (_previousContagionString.indexOf("bites you") > -1 && carrier.getName() != "player") {
                    //identical result (surprisingly common)
                    var randomReplies = ["bites you again", "sinks " + carrier.getPossessiveSuffix() + " teeth into your shoulder", "gnaws on your arm", "gnashes at your throat"];
                    var randomIndex = Math.floor(Math.random() * randomReplies.length);
                    contagionString = contagionString.replace("bites you", randomReplies[randomIndex]);
                
                } else if (_previousContagionString.indexOf("bites") > -1 && carrier.getName() != "player") {
                    //identical result (surprisingly common)
                    var randomReplies = ["sinks " + carrier.getPossessiveSuffix() + " teeth into", "chomps on"];
                    var randomIndex = Math.floor(Math.random() * randomReplies.length);
                    contagionString = contagionString.replace("bites", randomReplies[randomIndex]);
                };

                if (_previousContagionString.indexOf("lurches in a spasm of pain") > -1) {
                    //identical result (surprisingly common)
                    var randomReplies = ["moans in distress", "wails in anguish", "shivers in discomfort", "shudders in pain"];
                    var randomIndex = Math.floor(Math.random() * randomReplies.length);
                    contagionString = contagionString.replace("lurches in a spasm of pain", randomReplies[randomIndex]);
                };
            };
            
            _previousContagionString = contagionString;
            return contagionString;
        };

        self.mutateSymptoms = function(symptoms) {
            //note - because the calculated values generally round *up*...
            //even though there's an equal chance of negative values, 
            //over 100 iterations we see a fair rise in escalation and frequency and nominal changes in hp.
            let newSymptoms = [];
            if (Array.isArray(symptoms)) {
                newSymptoms = [...symptoms];            
            } else {
                newSymptoms.push(symptoms);
            };

            for (let s = 0; s < newSymptoms.length; s++) {
                let symptom = newSymptoms[s];
                let newSymptom = {};
                for(const [name, value] of Object.entries(symptom)) {
                    if (typeof value === "number") {
                        let changeBy = 1;
                        let newValue = 0;
                        let percentChange = 0;
                        let integerChange = 0
                        let increaseOrDecrease = (Math.floor(Math.random() * 3) - 1)// 0 to 2 minus one :) 
                        if (Number.isInteger (value)) {
                            integerChange = (Math.floor(Math.random() * 5))+1 //1-5
                            percentChange = ((value - integerChange) / value) * 100
                        } else {
                            //increase or decrease each attribute by +/- by 10-20%
                            percentChange = (Math.floor(Math.random() * 11)+10); //11 options - therefore 0..10 + 10
                        };
                        changeBy = 1+((percentChange*increaseOrDecrease)/100);
                        if (Number.isInteger (value)) {
                            newValue = Math.ceil(value*changeBy); // round up to whole value
                        } else {
                            newValue = Math.ceil((value*changeBy)*100)/100; // round up to 2dp
                        };
                        if (newValue <= 0) {newValue = value}
                        newSymptom[name] = newValue;
                    } else {
                        newSymptom[name] = value;
                    };
                };
                newSymptoms.splice(s,1,newSymptom);
            };
            return newSymptoms;
        };
        
        self.enactSymptoms = function (carrier, location, player) {
            //example: "symptoms": [{ "action":"bite", "frequency":0.3,"escalation":0},{ "action":"hurt", "health":5, "frequency":0.1,"escalation":0.1}],
            if (carrier.isDead()) { return ""; }; //do nothing
            var resultString = "";
            if (_duration == 0) { return resultString; }; //contagion should no longer exist
            if (_incubationPeriod > 0) {
                _incubationPeriod--; //reduce incubation, do nothing else yet
                //console.debug("contagion dormant for " + _incubationPeriod+" more ticks.");
                return resultString;
            };
            
            var biteCount = 0;
            var hurtCount = 0;
            for (var i = 0; i < _symptoms.length; i++) {
                //set symptom defaults
                var frequency = 1;
                var escalation = 0;
                var hp = 0;
                //set actual symptom values if available
                if (_symptoms[i].health) {
                    hp = parseInt(_symptoms[i].health);
                };
                if (_symptoms[i].escalation) {
                    escalation = parseFloat(_symptoms[i].escalation);
                };
                if (_symptoms[i].frequency) {
                    frequency = (1-parseFloat(_symptoms[i].frequency)) * 10;
                };

                //console.debug("freq:" + _symptoms[i].frequency + " esc:" + escalation + " hp:" + hp);
                //perform actions
                if (_symptoms[i].action) {
                    switch (_symptoms[i].action) {
                        case "bite":
                            if (carrier.healthPercent() < 25) {
                                //don't bite if too weak
                                break;
                            };
                            //console.debug("bite symptom firing.");
                            var initialVictims = [];
                            if (location) { initialVictims = location.getCreatures() };
                            var victims = [];

                            //splice out dead creatures
                            for (var j = 0; j < initialVictims.length; j++) {
                                if (!(initialVictims[j].isDead())) {
                                    victims.push(initialVictims[j]);
                                };
                            };

                            //splice out carrier
                            if (carrier.getType() == "creature") {
                                for (var j = 0; j < victims.length; j++) {
                                    if (victims[j].getName() == carrier.getName()) {
                                        victims.splice(j, 1);
                                        break;
                                    };
                                };
                            };

                            if (player) { victims.unshift(player); };//add player to list of victims

                            if (victims.length == 0) {
                                break;
                            };

                            //partially randomise order victims will be processed in.
                            victims.sort(function () { return .5 - Math.random(); });
                            //% chance of biting a given creature decreases the more creatures there are in a location.
                            //(a bit like getting tired or running out of time)
                            //we shuffle the creatures array beforehand so that the selected creature to be bitten first may vary.
                            if (carrier.getType() == "player") {
                                var randomMessage = ["You seem to have been infected with something nasty", "", "You don't seem fully in control of your actions", "", "You're really not feeling right", "You twitch and jerk uncontrollably"];
                                var randomIndex = Math.floor(Math.random() * randomMessage.length);
                                if (randomMessage[randomIndex].length > 0) {
                                    resultString += "<br>" + randomMessage[randomIndex] + "."
                                } else {
                                    resultString += "<br>";
                                };
                                //bite a random creature (just one)
                                randomIndex = Math.floor(Math.random() * victims.length);
                                resultString += " " + carrier.eat("bite", victims[randomIndex].getName(), null, null); //customAction won't work for much without map and player
                            } else {
                                for (var c = 0; c < victims.length; c++) {
                                    var randomAttack = Math.floor(Math.random() * (Math.ceil(c / 2) * frequency));
                                    if (randomAttack == 0 && biteCount < 2) {
                                        //limit to maximum of 2 bites
                                        var biteString = carrier.bite(victims[c]);
                                        if (hurtCount > 0 && biteCount == 0) {
                                            biteString = biteString.replace(tools.initCap(carrier.getDisplayName()), "and");
                                            resultString = resultString.replace(".", "");
                                        };
                                        resultString += biteString;
                                        biteCount++;
                                    };
                                };
                            };

                            break;
                        case "hurt":
                            var rand = Math.floor(Math.random() * frequency);
                            //console.debug("health symptom firing. Rand = "+rand);
                            if (rand == 0) {
                                var hurtString = carrier.hurt(hp, self);
                                if (biteCount > 0) {
                                    hurtString = hurtString.replace(tools.initCap(carrier.getDisplayName()), "and");
                                    hurtString += "<br>";
                                    resultString = resultString.replace(". <br>", " ");
                                };
                                resultString += hurtString;
                                hurtCount++;
                                //escalate hp damage
                                if (parseFloat(_symptoms[i].escalation) > 0) {
                                    _symptoms[i].health += Math.ceil(_symptoms[i].health*(_symptoms[i].escalation/2))
                                };
                            };
                            break;
                        case "violence":
                            //@todo eventually - perform a random violent action on any object (or player) in current location
                            break;
                        case "weaken":
                            //@todo eventually - reduce carrier's carry limit and attack strength. (may or may not be recoverable)
                            break;
                        // see #579 for all these...
                        case "vomiting":
                        case "hunger":
                        case "dehydration":
                        case "confusion":
                        case "bleed":
                            break;
                    };
                };
                //escalate
                if (_symptoms[i].frequency) {
                    if (_symptoms[i].frequency < 1) {
                        //console.debug("original frequency " + _symptoms[i].frequency)
                        _symptoms[i].frequency = Math.round((parseFloat(_symptoms[i].escalation) + parseFloat(_symptoms[i].frequency)) * 100) / 100;
                        if (_symptoms[i].frequency > 1) { _symptoms[i].frequency = 1; };
                        //console.debug("new frequency " + _symptoms[i].frequency);
                    };
                };

                if (parseFloat(_symptoms[i].escalation) > parseFloat(0.0)) {
                    _symptoms[i].escalation += (_symptoms[i].escalation * (_symptoms[i].escalation/2));
                };

                if (_duration > 0) { _duration-- };
                //console.debug("freq:" + _symptoms[i].frequency + " esc:" + escalation + " hp:" + hp);
            };
            
            resultString = self.deduplicateContagionStrings(resultString, carrier);
            return resultString;
        };

        ////end public methods
    }
    catch (err) {
        console.error('Unable to create Contagion object: ' + err);
        throw err;
    };
};
