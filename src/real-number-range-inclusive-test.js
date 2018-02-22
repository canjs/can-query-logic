var QUnit = require("steal-qunit");
var set = require("./set");
var RealNumberRangeInclusive = require("./real-number-range-inclusive");

QUnit.module("can-type");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("real-number-range-inclusive", function(){

    QUnit.equal(
        set.isSubset(
            new RealNumberRangeInclusive(1,4),
            new RealNumberRangeInclusive(0,5)
        ),
        true,
        "1-4 subset of 0-5");

    QUnit.equal(
        set.isSubset(
            new RealNumberRangeInclusive(0,5),
            new RealNumberRangeInclusive(1,4)

        ),
        false,
        "0-5 subset of 1-4 subset");

});
