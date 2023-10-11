const { lexList, init } = require("./init/init");
const { scanAll } = require("./lexer/scanner");
const { gData } = require("./lexer/token");
const { statement } = require("./parser/parse");
const { printTree, showIn, logIn, treeIn } = require("./parser/showtree");
const { addBuildInMethod } = require("./semantic/buildlnFn");
const { interpretAST } = require("./semantic/interpreter");


function main(){
    addBuildInMethod("log",logIn);
    addBuildInMethod("show",showIn);
    addBuildInMethod("tree",treeIn);
    console.log("start compiling");
    console.log("------------- Get Source Code --------------------------");
    init();
    console.log("------------- Start Lexical analysis -------------------");
    scanAll();
    console.log(lexList);
    lexList.reverse();
    console.log("------------- Start Syntax analysis --------------------");
    let astNodeTree = statement();
    printTree(astNodeTree);
    console.log("------------- Start Semantic analysis ------------------");
    interpretAST(astNodeTree,null,gData.gScope);
    console.log("compiled finished");
}

main();