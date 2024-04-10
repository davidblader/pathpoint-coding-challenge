const fs = require('fs');
const { execSync } = require('child_process');

// Get arguments from CLI
const { recordsFilePath, totalScores } = getCLIArgs();

// Surprise! The DevOps guy likes using shell commands :-)
// sort -rn sorts in reverse numerical order, head -n limits us to just the top results we're interested in
// We pass both of these to be subshell executed by echo -n to remove annoying newline character appended by head
let rawOutput = execSync(`echo -n "$(sort -rn ${recordsFilePath} | head -n ${totalScores})"`, (err) => {
    if (err) {
        console.error(`Error creating sort file: ${err}`)
    }
}).toString();

// Parse output
let output = [];
rawOutput.split("\n").forEach((row) => {
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
    output.push({
        score,
        id: JSON.parse(json).id
    })
});
console.log(output);

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
