function add(a,b){
    return a+b;
}

var a = "a";
var b = "b";
var c = add(a,b);

tree(add);
show(a);
show(b);
log("result is :",c);