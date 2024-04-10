const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

// Get arguments from CLI
const { recordsFilePath, totalScores } = getCLIArgs();

const sortedFile = "./sorted_score_recs.data"
// sort -rn sorts in reverse numerical order
execSync(`sort -rn ${recordsFilePath} -o ${sortedFile}`, (err) => {
    if (err) {
        console.error(`Error creating sort file: ${err}`);
        process.exit(1);
    }
});

const sortedFileStream = fs.createReadStream(sortedFile);
const sortedFileLines  =  readline.createInterface({
    input: sortedFileStream,
    crlfDelay: Infinity
});
const scoreToId = {};

sortedFileLines.on('line', (row) => {
    const data = processRowString(row);
     // Note re: requirement:
     // "Scores can repeat, but you should only count the `id` of the _last_ line processed as the "winning" `id`."
     // Here I am simply choosing to overwrite at the `score` index, mapping to the object id
     // Because we used coreutils sort command, we cannot guarantee that the "correct" order of the identical scores was preserved in the output file
     // In a real application, I would seek clarification on this requirement and perhaps use the `date` field in the object to determine which gets selected as the winner
     scoreToId[data.score] = data.id;

     // Once our map reaches the desired number of scores, output as an array, cleanup, and exit
     if (Object.keys(scoreToId).length == totalScores) {
        output(scoreToId);
        cleanupAndExit();
     };
});

// Helper functions

// Returns and validates CLI arguments
function getCLIArgs() {
    if (process.argv.length < 4) {
        console.error("Insufficient arguments.\nExpected usage: node highest.js <path-to-records-file> <total-scores>");
        process.exit(1);
    }
    const recordsFilePath = process.argv[2];
    const totalScores     = process.argv[3];

    // Validate file exists and is readable
    try {
        fs.accessSync(recordsFilePath, fs.constants.F_OK | fs.constants.R_OK);
    } catch (err) {
        console.error(`Error accessing file: ${recordsFilePath}\n${err}`);
        process.exit(1);     
    }

    // Validate total scores argument is a valid integer
    if (!Number.isInteger(parseInt(totalScores))) {
        console.error(`Invalid value for total scores: ${totalScores}`);
        process.exit(1);
    }

    return {
        recordsFilePath,
        totalScores
    };
}

// Returns object with score and object payload from raw string input 
function processRowString(row) {
    // Splits line by first :, leaving JSON string intact
    const splitRow = row.split(new RegExp('\:(.*)'), 2);
    const score = splitRow[0];
    const json  = splitRow[1];
    // Validate JSON, throw error if invalid
    try {
        const id = JSON.parse(json).id;
        if (id === undefined) {
            console.error(`Invalid JSON format. JSON object is missing id attribute.\n${json}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`Invalid JSON format. No JSON object could be decoded.\n${json}\n${error}`);
        process.exit(1);
    }

    return { score, id: JSON.parse(json).id };
}

// Outputs scores and IDs and exits on successful execution
function output(scoreToId) {
    const result = [];
    Object.keys(scoreToId).forEach((score) => result.push({score, id: scoreToId[score]}));
    // Sort array so higher scores are indexed first
    result.sort((score1, score2) => score2.score - score1.score);
    console.log(result);
}

// Deletes sorted data file
function cleanupAndExit() {
    execSync(`rm ${sortedFile}`);
    process.exit(0);
}