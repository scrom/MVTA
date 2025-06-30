"use strict";
//reusable disctionary object
exports.Dictionary = function Dictionary() {
    const self = this; //closure so we don't lose this reference in callbacks
    var _dictionary = {};
    var _reverseDictionary = {};
    const _objectName = "Dictionary";

    //console.info(_objectName + ' created');
    try{
       
        self.getDictionary = function () {
            return _dictionary;
        };

        self.getReverseDictionary = function () {
            return _reverseDictionary;
        };

        self.lookup = function (string, type = null) {
            const key = string.toLowerCase();
            const entries = _reverseDictionary[key];
            if (!entries) return false;

            const result = {};
            for (const { name, type: entryType } of entries) {
                if (!type || entryType === type) {
                    result[name] = _dictionary[name];
                }
            }

            return result;
        };

        self.getEntry = function(name) {
            return _dictionary[name] || false;
        };

        self.addEntry = function(name, type, syns) {
            if (!name) {return false;}

            //save to main dictionary
            _dictionary[name] = {type: type, synonyms: syns};
        
            // Combine name and synonyms as keys
            const allTerms = [name, ...(syns || [])];
            for (const term of allTerms) {
                const key = term.toLowerCase(); // normalize for consistency
                if (!_reverseDictionary[key]) {
                    _reverseDictionary[key] = [];
                }

                // Optional: check for duplicates before pushing
                const alreadyExists = _reverseDictionary[key].some(entry => entry.name === name);
                if (!alreadyExists) {
                    _reverseDictionary[key].push({ name, type });
                }
            }           
            return true;
        };

        self.removeEntry = function(name) {
            if (!name || !_dictionary[name]) return false;

            const { type, synonyms = [] } = _dictionary[name];
            const allTerms = [name, ...synonyms];

            for (const term of allTerms) {
                const key = term.toLowerCase(); // use same normalization as add
                const entries = _reverseDictionary[key];

                if (entries) {
                    // Remove all matches for this name
                    _reverseDictionary[key] = entries.filter(entry => entry.name !== name);

                    // Clean up if empty
                    if (_reverseDictionary[key].length === 0) {
                        delete _reverseDictionary[key];
                    }
                }
            }

            // Finally remove from the main dictionary
            delete _dictionary[name];
            return true;
        };

        self.modifyEntry = function(name, type, syns) {
            if (!name) return false;

            const entry = _dictionary[name];

            // If entry doesn't exist, add it instead
            if (!entry) {
                return self.addDictionaryEntry(name, type, syns);
            }

            // Remove old synonyms from reverse dictionary
            const oldSynonyms = [name, ...(entry.synonyms || [])];
            for (const term of oldSynonyms) {
                const key = term.toLowerCase();
                if (_reverseDictionary[key]) {
                    _reverseDictionary[key] = _reverseDictionary[key].filter(e => e.name !== name);
                    if (_reverseDictionary[key].length === 0) {
                        delete _reverseDictionary[key];
                    }
                }
            }

            // Modify type if given
            if (type) {
                entry.type = type;
            }

            // Modify synonyms
            if (syns) {
                if (Array.isArray(syns)) {
                    entry.synonyms = syns;
                } else {
                    // Add single synonym to existing array
                    if (!entry.synonyms) {
                        entry.synonyms = [];
                    }
                    entry.synonyms.push(syns);
                }
            }

            // Re-add new synonyms to reverse dictionary
            const newSynonyms = [name, ...(entry.synonyms || [])];
            for (const term of newSynonyms) {
                const key = term.toLowerCase();
                if (!_reverseDictionary[key]) {
                    _reverseDictionary[key] = [];
                }

                const alreadyExists = _reverseDictionary[key].some(e => e.name === name);
                if (!alreadyExists) {
                    _reverseDictionary[key].push({ name, type: entry.type });
                }
            }

            return true;
        };

        function flatten(dict) {
            const wordSet = new Set();
            //no need to convert case or sanitise - that will have been done on creation.
            for (const [name, { synonyms = [] }] of Object.entries(dict)) {
                wordSet.add(name);
                for (const syn of synonyms) {
                    wordSet.add(syn);
                }
            };

            return Array.from(wordSet);
        };

        self.flatDictionary = flatten(_dictionary);
        self.flatDictionary.sort((p1, p2) => p2.split(" ").length - p1.split(" ").length); //sort by number of words - greatest first

    }

    catch(err) {
	    console.error('Unable to create Dictionary object: '+err.stack);
        throw err;
    };
};	