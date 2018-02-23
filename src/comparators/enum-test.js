var QUnit = require("steal-qunit");
var set = require("../set");
var Enum = require("./enum");

QUnit.module("can-type/enum");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("basics", function(){

    QUnit.equal(
        set.isSubset(
            new Enum(["a","c"]),
            new Enum(["a","b","c"])
        ),
        true,
        "isSubset");

    QUnit.equal(
        set.isSubset(
            new Enum(["a","b","c"]),
            new Enum(["a","c"])
        ),
        false,
        "NOT isSubset");

    var union = set.union(
        new Enum(["a","b"]),
        new Enum(["a","c"])
    );
    QUnit.ok(union instanceof Enum, "is enum")
    QUnit.deepEqual(
        union.values,
        ["a","b","c"],
        "union");

});
