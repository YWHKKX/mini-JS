const { time } = require("console");
const { lexList, getNextToken, showNextToken } = require("../init/init");
const {match,
    scan,
    leftBrace,
    rightBrace,
    leftPt,
    rightPt,
    semicolon,
    putBackToken,
} = require("../lexer/scanner");
const { gData, tokenTypes, ASTNodeTypes, Token } = require("../lexer/token");
const { printErr } = require("../utils/err");
const { ASTNode } = require("./astnode");
const { parseExpression,prefixParserMap} = require("./expression");

function varDeclaration() {
    let {token} = gData;
    let tree=null,left=null,lastTokenValue;
    let type = token.type === tokenTypes.T_ARGUMENT ? ASTNodeTypes.T_ARGUMENT : ASTNodeTypes.T_VAR;
    let index = 0;
    getNextToken();
    do{
        if(token.type === tokenTypes.T_IDENT){
            left = new ASTNode().initLeafNode(type,token.value);
            lastTokenValue = left;
            if(type === tokenTypes.T_ARGUMENT){
                left.option = index;
                ++index;
            }
            getNextToken();
            if(tree === null){
                tree = left;
            }else{
                tree = new ASTNode().initTwoNode(ASTNodeTypes.T_GLUE,tree,left,null);
            }
            if(token.type === tokenTypes.T_SEMI){
                break;
            }
        }else {
            printErr(`unknown error : token type: ${token.type}`);
        }
    }while (token.type === tokenTypes.T_COMMA && getNextToken());

    if(token.type === tokenTypes.T_ASSIGN){
        getNextToken();
        let right = new ASTNode().initLeafNode(ASTNodeTypes.T_LVALUE,lastTokenValue.value);
        let left = normalStatement();
        let assignTree = new ASTNode().initTwoNode(ASTNodeTypes.T_ASSIGN,left,right,null);
        tree = new ASTNode().initTwoNode(ASTNodeTypes.T_GLUE,tree,assignTree,null);
    }
    if(token.type === tokenTypes.T_SEMI){
        semicolon();
    }
    return tree;
}

function ifStatement() {
    let {token}  = gData;
    let condition=null,trueBody=null,falseBody=null;
    match(tokenTypes.T_IF,"if");
    leftPt();
    condition = parseExpression(0);
    rightPt();
    leftBrace();
    trueBody = statement();
    rightBrace();
    if(token.type === tokenTypes.T_ELSE){
        getNextToken();
        leftBrace();
        falseBody = statement();
        rightBrace();
    }
    return new ASTNode().initThreeNode(ASTNodeTypes.T_IF,condition,trueBody,falseBody,null);
}

function whileStatement() {
    let condition=null,body=null;
    match(tokenTypes.T_WHILE,"while");
    leftPt();
    condition = parseExpression(0);
    rightPt();
    leftBrace();
    body = statement();
    rightBrace();
    return new ASTNode().initTwoNode(ASTNodeTypes.T_WHILE,condition,body,null);
}

function funStatement(){
    let {token} = gData;
    match(tokenTypes.T_FUN,"function");
    let funName = token.value;
    let tokenBack = new Token(tokenTypes.T_ARGUMENT,token.value);
    match(tokenTypes.T_IDENT,"identifier");

    let left = null;
    if(showNextToken().type !== tokenTypes.T_RPT){
        putBackToken(tokenBack);
        left = statement();
    }
    else{
        getNextToken();
    }
    rightPt();
    leftBrace();
    let funBody = statement();
    rightBrace();
    return new ASTNode().initTwoNode(ASTNodeTypes.T_FUN,left,funBody,funName);
}


function returnStatement(){
    match(tokenTypes.T_RETURN,"return");
    let returnTree = parseExpression(0);
    semicolon();
    return new ASTNode().initUnaryNode(ASTNodeTypes.T_RETURN,returnTree,null);
}

function normalStatement() {
    let tree =  parseExpression(0);
    semicolon();
    return tree;
}

function statement(){
    let tree=null,left=null;
    let {token} = gData;
    getNextToken();
    while(true){
        switch(token.type){
            case tokenTypes.T_VAR:
            case tokenTypes.T_ARGUMENT:
                left = varDeclaration();
                break;
            case tokenTypes.T_IF:
                left = ifStatement();
                break;
            case tokenTypes.T_WHILE:
                left = whileStatement();
                break; 
            case tokenTypes.T_FUN:
                left = funStatement();
                break;
            case tokenTypes.T_RETURN:
                left = returnStatement();
                break;
            case tokenTypes.T_EOF:
            case tokenTypes.T_RBR:
            case tokenTypes.T_RPT:
                return tree;
            default:
                if(prefixParserMap[token.type]){
                    left = normalStatement();
                }else{
                    printErr(`unknown Syntax:${token.type} , at ${gData.line} line`);
                }
        }
        if(left !== null){
            if(tree === null){
                tree = left;
            }else{
                tree = new ASTNode().initTwoNode(ASTNodeTypes.T_GLUE,tree,left,null);
            }
        }
    }
}

module.exports = {
    statement,
}