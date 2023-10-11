const {gData,tokenTypes, Token} = require("./token");
const {regVar,regNumber,regBlank} = require("../utils/reg");
const { printErr } = require("../utils/err");
const { lexList, getNextToken } = require("../init/init");

const defineKeywords = {
    "let":tokenTypes.T_VAR,
    "var":tokenTypes.T_VAR,
    "const":tokenTypes.T_VAR,

    "if":tokenTypes.T_IF,
    "else":tokenTypes.T_ELSE,
    "while":tokenTypes.T_WHILE,

    "function":tokenTypes.T_FUN,
    "return":tokenTypes.T_RETURN,
};

function nextChar(){
    let {
        content,
        charBack,
    } = gData;

    if(charBack !== null){
        let c = charBack;
        gData.charBack = null;
        return c;
    }
    gData.index +=1;
    if(gData.index <= content.length-1){
        let value = content[gData.index];
        if(value.indexOf("\r\n")>-1 || value.indexOf("\n")>-1){
            gData.line+=1;
        }
        return value;
    }
    return null;
}

function scanKeyword(str){
    if(defineKeywords[str]){
        return defineKeywords[str];
    }
    return tokenTypes.T_IDENT;
}

function scanStr(endStr){
    let s = "";
    let c = nextChar();
    while(true){
        if(c === endStr){
            break;
        }
        if(c === "\\"){
            c = nextChar();
        }
        s += c;
        c = nextChar();
    }
    return s;
}

function scanIdent(s) {
    let str = s;
    let c = nextChar();
    if(c !== null){
        while (typeof c !== "undefined" && !regBlank(c) &&
        (regNumber(c) || regVar((c)))){
            if(str.length > gData.KEYWORD_MAX_LENGTH){
                printErr(`Identifier too long : ${str}`);
                return;
            }
            str += c;
            c = nextChar();
        }
        putBack(c);
    }
    return str;
}

function scanInt(s) {
    let n = Number(s);
    let c = nextChar();
    while (regNumber(c)){
        n = n*10 + Number(c);
        c = nextChar();
    }
    putBack(c);
    return n;
}

function skipBlank() {
    while (true){
        let value = nextChar();
       if(value === null){
           return;
       }
        if(value !== " " &&
            value.indexOf("\r\n") === -1 &&
            value.indexOf("\n") === -1 &&
            value.indexOf("\r") === -1
        ){
            putBack(value);
            return;
        }
    }
}

function skipOneLine() {
    let line = gData.line;
    while (line === gData.line){
        if(!nextChar()){
            break;
        }
    }
}

function putBack(char){
    gData.charBack = char;
}
function putBackToken(token) {
    lexList.push(token);
}

function scan(){
    skipBlank();
    let {
        content,
        index,
        token,
        tokenBack
    } = gData;
    token.value = null;
    
    if(tokenBack !== null){
        let token = tokenBack;
        gData.tokenBack = null;
        gData.token.type = token.type;
        gData.token.value = token.value;
        return token;
    }
    if(index >= content.length){
        token.type = tokenTypes.T_EOF;
        return;
    }
    let value = nextChar();
    let next;

    switch (value) {
        case "+":
            token.type = tokenTypes.T_ADD;
            break;
        case "-":
            token.type = tokenTypes.T_SUB;
            break;
        case "*":
            next = nextChar();
            if(next === "/"){
                token.type = tokenTypes.T_RCMT;
            }else{
                putBack(next);
                token.type = tokenTypes.T_MUL;
            }

            break;
        case "/":
            next = nextChar();
            if(next === "*"){
                token.type = tokenTypes.T_LCMT;
            }
            else if(next === "/"){
                token.type = tokenTypes.T_LINE_CMT;
            }
            else{
                putBack(next);
                token.type = tokenTypes.T_DIV;
            }
            break;

        case ",":
            token.type = tokenTypes.T_COMMA;
            break;
        case "=":
            next = nextChar();
            if(next === "="){
                token.type = tokenTypes.T_EQ;
                next = nextChar();
                if(next !== "="){
                    putBack(next);
                }
            }else{
                token.type = tokenTypes.T_ASSIGN;
                putBack(next);
            }
            break;
        case ";":
            token.type = tokenTypes.T_SEMI;
            break;
        case "!":
            next = nextChar();
            if(next === "="){
                token.type = tokenTypes.T_NEQ;
            }
            putBack(next);
            token.type = tokenTypes.T_NOT;
            break;
        case ">":
             next = nextChar();
            if(next === "="){
                token.type = tokenTypes.T_GE;
            }else {
                token.type = tokenTypes.T_GT;
                putBack(next);
            }
            break;
        case "<":
             next = nextChar();
            if(next === "="){
                token.type = tokenTypes.T_LE;
            }else {
                token.type = tokenTypes.T_LT;
                putBack(next);
            }
            break;
        case "&":
            next = nextChar();
            if(next === "&"){
                token.type = tokenTypes.T_AND;
            }else {
                putBack(next);
            }
            break;
        case "|":
            next = nextChar();
            if(next === "|"){
                token.type = tokenTypes.T_OR;
            }else {
                putBack(next);
            }
            break;
        case "(":
            token.type = tokenTypes.T_LPT;
            break;
        case ")":
            token.type = tokenTypes.T_RPT;
            break;
        case "{":
            token.type = tokenTypes.T_LBR;
            break;
        case "}":
            token.type = tokenTypes.T_RBR;
            break;
        case "[":
            token.type = tokenTypes.T_LMBR;
            break;
        case "]":
            token.type = tokenTypes.T_RMBR;
            break;
        case "?":
            token.type = tokenTypes.T_QST;
            break;
        case ":":
            token.type = tokenTypes.T_COL;
            break;
        case "\"":
            token.type = tokenTypes.T_STRING;
            token.value = scanStr("\"");
            break;
        case "\'":
            token.type = tokenTypes.T_STRING;
            token.value = scanStr("\'");
            break;

        default:
            if(regNumber(value)){
                token.value = scanInt(value);
                token.type = tokenTypes.T_INT;
                break;
            }
            else if(regVar(value)){
                value = scanIdent(value);
                token.type = scanKeyword(value);
                token.value = value;
                break;
            }
            printErr(`Unrecognised char : (${value})`)
        }
    if(token.type === tokenTypes.T_LINE_CMT){
        skipOneLine();
        scan();
    }
    return true;
}

function scanAll(){
    let {
        content,
        index,
        token,
        tokenBack
    } = gData;
    while(scan()){
        var tmp = new Token(token.type,token.value);
        lexList.push(tmp);
    }
}

function match(type,text){
    if(gData.token.type === type){
        if(type !== tokenTypes.T_LBR)
            getNextToken();
        return true
    }else{
        console.log(`Exception : ${gData.token.type}(${gData.token.value}) !== ${type}(${text})`);
        printErr(`Uncaught SyntaxError: Invalid or unexpected token`);
    }
}

function leftBrace(){
    return match(tokenTypes.T_LBR,"{");
}

function rightBrace(){
    return match(tokenTypes.T_RBR,"}");
}

function leftPt(){
    return match(tokenTypes.T_LPT,"(");
}

function rightPt(){
    return match(tokenTypes.T_RPT,")");
}

function semicolon(){
    return match(tokenTypes.T_SEMI,";");
}

module.exports = {
    scan,
    scanAll,
    match,
    leftBrace,
    rightBrace,
    leftPt,
    rightPt,
    semicolon,
    putBackToken,
}
