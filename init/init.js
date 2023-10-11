const { gData, tokenTypes } = require("../lexer/token");
const { readJSCode } = require("../utils/getfile");

const lexList = []; 

function getNextToken(){
    let {token} = gData;
    var tmp = lexList.pop();
    if( tmp !== undefined){
        token.type = tmp.type;
        token.value = tmp.value;
        return true;
    }
    token.type = tokenTypes.T_EOF;
    return false;
}

function showNextToken(){
    return lexList[lexList.length-1];
}

function init(){
    let argv = process.argv.splice(2);
    if(argv[0] !== "-i" || argv[1] === undefined){
        throw new Error("Usage: node index.js -i <input file>");
    }
    let data = readJSCode(argv[1]);
    console.log(data);
    gData.content = data;
}

module.exports = {
    init,
    lexList,
    getNextToken,
    showNextToken,
}