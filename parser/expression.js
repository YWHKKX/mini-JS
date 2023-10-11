const { getNextToken } = require("../init/init");
const { putBackToken } = require("../lexer/scanner");
const { gData, tokenTypes, precedenceList, ASTNodeTypes, Token } = require("../lexer/token");
const { printErr } = require("../utils/err");
const { ASTNode } = require("./astnode");

const prefixParserMap = {
    [tokenTypes.T_IDENT]:identifier,
    [tokenTypes.T_INT]:int,
    [tokenTypes.T_STRING]:str,
    [tokenTypes.T_LPT]:group,
    [tokenTypes.T_LMBR]:array,
    [tokenTypes.T_NOT]:prefix.bind(null,tokenTypes.T_NOT),
    [tokenTypes.T_SUB]:prefix.bind(null,tokenTypes.T_SUB),
};

const infixParserMap = {
    [tokenTypes.T_LPT]:{parser:funCall,precedence:precedenceList.call},
    [tokenTypes.T_QST]:{parser:condition,precedence:precedenceList.condition},

    [tokenTypes.T_ASSIGN]:{parser:assign,precedence:precedenceList.assign},

    [tokenTypes.T_AND]:{parser:infix.bind(null,precedenceList.and),precedence:precedenceList.and},
    [tokenTypes.T_OR]:{parser:infix.bind(null,precedenceList.and),precedence:precedenceList.and},
    [tokenTypes.T_ADD]:{parser:infix.bind(null,precedenceList.sum),precedence:precedenceList.sum},
    [tokenTypes.T_SUB]:{parser:infix.bind(null,precedenceList.sum),precedence:precedenceList.sum},
    [tokenTypes.T_MUL]:{parser:infix.bind(null,precedenceList.product),precedence:precedenceList.product},
    [tokenTypes.T_DIV]:{parser:infix.bind(null,precedenceList.product),precedence:precedenceList.product},

    [tokenTypes.T_GT]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
    [tokenTypes.T_GE]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
    [tokenTypes.T_LT]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
    [tokenTypes.T_LE]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
    [tokenTypes.T_EQ]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
    [tokenTypes.T_NEQ]:{parser:infix.bind(null,precedenceList.compare),precedence:precedenceList.compare},
};

function getPrecedence(){
    let {token} = gData;
    let infix = infixParserMap[token.type];
    return infix.precedence;
}

function parseExpression(precedenceValue) {
    let {token} = gData;
    let prefixParser = prefixParserMap[token.type];
    if(!prefixParser){
        printErr(`unknown token : ${token.value}(${token.type})`)
    }
    let left = prefixParser();
    getNextToken();
    if(token.type === tokenTypes.T_SEMI
        || token.type === tokenTypes.T_RPT
        || token.type === tokenTypes.T_EOF
        || token.type === tokenTypes.T_COMMA
        || token.type === tokenTypes.T_COL
        || token.type === tokenTypes.T_RMBR
    ){
        return left;
    }
    let value = getPrecedence();
    while (value>precedenceValue){
        let type = token.type;
        if(token.type === tokenTypes.T_SEMI
            || token.type === tokenTypes.T_RPT
            || token.type === tokenTypes.T_EOF
            || token.type === tokenTypes.T_COMMA
            || token.type === tokenTypes.T_RMBR
        ){
            return left;
        }
        
        let infix = infixParserMap[type];
        getNextToken();
        left = infix.parser(left,type);

        if(infixParserMap[token.type]){
            value = getPrecedence();
        }
    }

    return left;
}

function identifier(){
    let {token} = gData;
    let indent = new ASTNode().initLeafNode(ASTNodeTypes.T_IDENT,token.value);
    getNextToken();
    var tokenBack = new Token(token.type,token.value);
    if(token.type === tokenTypes.T_LMBR){
        getNextToken();
        let left = parseExpression(0);
        indent.op = ASTNodeTypes.T_VISIT;
        indent.left = left;
        return indent;
    }
    putBackToken(tokenBack);
    return indent;
}

function int() {
    let {token} = gData;
    return new ASTNode().initLeafNode(ASTNodeTypes.T_INT,token.value);
}

function str() {
    let {token} = gData;
    return new ASTNode().initLeafNode(ASTNodeTypes.T_STRING,token.value);
}

function assign(left){
    let right = parseExpression(0);
    left = new ASTNode().initUnaryNode(ASTNodeTypes.T_LVALUE,left,left.value);
    return new ASTNode().initTwoNode(ASTNodeTypes.T_ASSIGN,right,left,null);
}

function condition(left){
    let  trueBody = parseExpression(0);
    match(tokenTypes.T_COL,":");
    let  falseBody = parseExpression(precedenceList.condition-1);
    return new ASTNode().initThreeNode(ASTNodeTypes.T_IF,left,trueBody,falseBody,null);
}

function group(){
    getNextToken();
    return parseExpression(0);
}

function funCall(left,type){
    let { token } = gData;
    let args = [];
    let astNode = new ASTNode().initLeafNode(ASTNodeTypes.T_FUNARGS,args);

    while (token.type !== tokenTypes.T_RPT){
        let tree = parseExpression(0);
        args.push(tree);

        if(token.type !== tokenTypes.T_COMMA && token.type !== tokenTypes.T_RPT){
            printErr(`unknown Syntax token : ${token.type} : value : ${token.value}`);
        }
        if(token.type === tokenTypes.T_RPT){
            getNextToken();
            break;
        }else{
            getNextToken();
        }
    }
    if(token.type === tokenTypes.T_RPT){
        getNextToken();
    }
    return new ASTNode().initUnaryNode(ASTNodeTypes.T_FUNCALL,astNode,left.value);
}

function prefix(type){
    getNextToken();
    let right = parseExpression(precedenceList.prefix);
    putBackToken(gData.token);
    return new ASTNode().initUnaryNode(type,right,null);
}

function infix(precedence,left,type){
    let right = parseExpression(precedence);
    return new ASTNode().initTwoNode(type,left,right,null);
}

function array() {
    let { token } = gData;
    getNextToken();
    let arr = [];
    do{
        if(token.type === tokenTypes.T_RMBR){
            getNextToken();
            break;
        }
        let exp = parseExpression() || undefined;
        arr.push(exp);
    }while (token.type === tokenTypes.T_COMMA && getNextToken());
    return new ASTNode().initLeafNode(ASTNodeTypes.T_ARRAY,arr);
}


function nul(){

}

function undef(){
    
}

module.exports = {
    parseExpression,
    prefixParserMap
}