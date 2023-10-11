function regVar(char){
    if(char != null && typeof char !== "undefined"){
        let reg = /[a-zA-Z0-9_]/;
        return reg.test(char);
    }
}

function regNumber(char){
    let reg = /[0-9]/;
    return reg.test(char);  
}

function regBlank(char){
    if(char !== "" && 
        char.indexOf("\r\n") === -1 && 
        char.indexOf("\n") === -1 && 
        char.indexOf("\r") === -1)
        return false;
    return true;
}

module.exports = {
    regBlank,
    regNumber,
    regVar
}