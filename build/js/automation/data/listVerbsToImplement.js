const fs = require('fs');
const path = require('path');

const sourceCodeDir = path.join(__dirname, '../../../../server/js/');
const dataDir = path.join(__dirname, '../../../../data');
if (!fs.existsSync(dataDir)) {  
    console.error(`Directory does not exist: ${dataDir}`);
    process.exit(1);
};
if (!fs.existsSync(dataDir)) {  
    console.error(`Directory does not exist: ${sourceCodeDir}`);
    process.exit(1);
};

const filePath = path.join(sourceCodeDir, 'actions.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

//const singleQuoteRegex = /'([a-zA-Z_][a-zA-Z0-9_]*)'/g;
const selfDotWordRegex = /^\s*self\.(\w+)/gm;

//const matches = new Set();
//let match;
const matches = [...fileContent.matchAll(selfDotWordRegex)].map(m => m[1]);
//while ((match = singleQuoteRegex.exec(fileContent)) !== null) {
//  matches.add(match[1]);
//}
const sortedMatches = Array.from(matches).sort();

//console.log(sortedMatches);

//
const datafilePath = path.join(dataDir, "verb-lexicon.json");
let verbs = fs.readFileSync(datafilePath, 'utf8');     
verbs = JSON.parse(verbs);  
const topLevelVerbs = Object.keys(verbs);
topLevelVerbs.sort();
       
        /*let allAliases = [];
        for (let key of topLevelVerbs) {
            const aliases = verbs[key].aliases || [];
            if (aliases.length > 0) {
                allAliases.push(...aliases);
            };
        };

        let allVerbs = topLevelVerbs.concat(allAliases); //~400 verbs!
            const emptyValueIndex = allVerbs.indexOf("");
            if (emptyValueIndex >-1) {
                allVerbs.splice(emptyValueIndex,1);
            };

        allVerbs.sort();*/


let missingVerbs = topLevelVerbs.filter((word) => !(sortedMatches.includes(word)));

console.log("Remaining verbs to map/implement: "+missingVerbs.length);
console.log(missingVerbs);

//for (i=0;i<missingVerbs.length;i++) {
 // console.log('"'+missingVerbs[i]+'",');
//};