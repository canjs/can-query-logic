var QUnit = require("steal-qunit");
var set = require("../set");
var addNotCompatirors = require("./not");

function justNot(){
    function Not(value) {
        this.value = value;
    }
    addNotCompatirors(Not);
    return {
        Not: Not
    };
}


QUnit.module("can-query/not");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("union basics", function(){

    var types = justNot();

    QUnit.equal( set.union( new types.Not(1), 1), set.UNIVERSAL, "is univesal set");
});

QUnit.test("difference with universal", function(){
    var types = justNot();
    // everything NOT 1, but not the universe
    QUnit.equal( set.difference( new types.Not(1), set.UNIVERSAL), set.EMPTY, "not 1 \\ univesal = 1");

    QUnit.deepEqual( set.difference( set.UNIVERSAL, 1), new types.Not(1), "1 \\ univesal = not 1");
});
