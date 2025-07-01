"use strict";
//reusable disctionary object
//in addition to basic lookup...
//we also track number of references so that we know how many of a particular (main) key there are.
//and offer a lookup by type
exports.Dictionary = function Dictionary() {
    const self = this; //closure so we don't lose this reference in callbacks
    var _dictionary = {};
    var _reverseDictionary = {};
    const _objectName = "Dictionary";
    var _typeIndex = {};  // Maintain a type index for fast lookup
    var _refCounts = {}; // Track reference counts for each entry

    //console.info(_objectName + ' created');
    try{
       
        self.getDictionary = function () {
            return _dictionary;
        };

        self.getReverseDictionary = function () {
            return _reverseDictionary;
        };

        self.getRefCount = function(name) {
            return _refCounts[name] || 0;
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
        
        self.getEntriesByType = function(type) {
            if (!type || !_typeIndex[type]) return {};
            const result = {};
            for (const name of _typeIndex[type]) {
                result[name] = _dictionary[name];
            }
            return result;
        };

        self.addEntry = function(name, type, syns) {
            if (!name) {return false;}
            if (!_refCounts[name]) _refCounts[name] = 0;
            _refCounts[name]++;
            // Only add to dictionary if first reference
            if (_refCounts[name] > 1) { return true; };

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
            };
            
            if (type) {
                //maintain type cache
                if (!_typeIndex[type]) {_typeIndex[type] = new Set();};
                _typeIndex[type].add(name);
            };
            return true;
        };

        self.removeEntry = function(name) {
            if (!name || !_dictionary[name]|| !_refCounts[name]) return false;
            _refCounts[name]--;
            if (_refCounts[name] > 0) {
                return true; // Don't remove from dictionary yet
            }
            delete _refCounts[name];

            const entry = _dictionary[name];

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

            //update type index
            if (entry && entry.type && _typeIndex[entry.type]) {
                _typeIndex[entry.type].delete(name);
                if (_typeIndex[entry.type].size === 0) {delete _typeIndex[entry.type];};
            };

            // Finally remove from the main dictionary
            delete _dictionary[name];
            return true;
        };

        self.modifyEntry = function(name, type, syns) {
            if (!name) return false;

            const entry = _dictionary[name];
            const oldType = entry ? entry.type : null;

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

            //maintain type index
            const newEntry = _dictionary[name];
            const newType = newEntry ? newEntry.type : null;

            if (oldType && _typeIndex[oldType]) {
                _typeIndex[oldType].delete(name);
                if (_typeIndex[oldType].size === 0) delete _typeIndex[oldType];
            }
            if (newType) {
                if (!_typeIndex[newType]) _typeIndex[newType] = new Set();
                _typeIndex[newType].add(name);
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