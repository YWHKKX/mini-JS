/*
function printTree(ast,index) {
    if (!ast) {
      return;
    }
    console.log("%s || [%s] (%s)", Array(index+1).join("-"),ast.op,ast.value);
    index+=3;
    printTree(ast.left,index);
    printTree(ast.mid,index);
    printTree(ast.right,index);
} 
*/

const { gData } = require("../lexer/token");
const { findVar } = require("../semantic/data");

let printTree = function (ast, pre=[" ──"]) {
    if (!ast) {
        return;
    }
    for (var i = 0; i < pre.length; i++) {
        process.stdout.write(pre[i]);
    }
    console.log("[%s] (%s)", ast.op,ast.value);
    
  
    var bac = pre[pre.length - 1];
    if (pre[pre.length - 1] === " ├──") {
        pre[pre.length - 1] = " │  ";
    } else {
        pre[pre.length - 1] = "    ";
    }
    
    for (var i = 0; i < pre.length; i++) {
        process.stdout.write(pre[i]);
    }
    if(ast.left || ast.mid || ast.right)
        process.stdout.write(" │  ");
    console.log();

    pre.push(" ├──");
    
    if(!ast.mid && !ast.right){
        pre[pre.length - 1] = " └──";
    }
    printTree(ast.left,pre);
    if(!ast.right){
        pre[pre.length - 1] = " └──";
    }
    printTree(ast.mid,pre);
    pre[pre.length - 1] = " └──";
    printTree(ast.right,pre);
    
    pre.pop();
    pre[pre.length - 1] = bac;
}

function logIn(...argument){
    let arr = [];
    let i=0;
    while (typeof argument[i] !== "undefined"){
        arr.push(argument[i] ? argument[i].value : argument[i]);
        ++i;
    }
    console.log(...arr);
}

function showIn(argument){
    console.log(argument);
}

function treeIn(argument){
    printTree(argument.astnode);
}

module.exports = {
    showIn,
    logIn,
    treeIn,
    printTree,
}