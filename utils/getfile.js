const fs = require("fs");

function readJSCode(fileName) {
    let data = fs.readFileSync(fileName).toString();
    return data;
}

module.exports = {
    readJSCode,
}