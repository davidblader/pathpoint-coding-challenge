const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');
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

let output = [];
rawOutput.split("\n").forEach((row) => {
    const splitRow = row.split(new RegExp('\:(.*)'), 2);
    // console.log(splitRow);
    const score = splitRow[0];
    const json  = splitRow[1];
    try {
        const id = JSON.parse(json).id;
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
// output.forEach((row) => console.log(JSON.))


// Returns and validates CLI arguments
function getCLIArgs() {
    if (process.argv.length < 4) {
        console.error("Insufficient arguments. \nExpected usage: node highest.js <path-to-records-file> <total-scores>");
        process.exit(1);
    }

    return {
        recordsFilePath: process.argv[2],
        totalScores: process.argv[3]
    };
}
