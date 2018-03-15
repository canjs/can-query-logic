var compare = require("./comparisons");
var set = require("../set");
var is = compare;

QUnit.module("can-query/types/is")

var tests = {
    // In
    In_In: {
        union: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.union(isIn5, isIn6),
                new is.In([5,6])
            );
        },
        intersection: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.intersection(isIn5, isIn6),
                set.EMPTY
            );

            var in13 = new is.In([1,2,3]),
                in24 = new is.In([2,3,4]);
            assert.deepEqual(
                set.intersection(in13, in24),
                new is.In([2,3])
            );
        },
        difference: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.difference(isIn5, isIn6),
                isIn5
            );

            var in13 = new is.In([1,2,3]),
                in24 = new is.In([2,3,4]);
            assert.deepEqual(
                set.difference(in13, in24),
                new is.In([1])
            );
        }
    },
    UNIVERSAL_In: {
        difference: function(assert){
            var isIn5 = new is.In([5]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, isIn5),
                new is.NotIn([5])
            );

            var in13 = new is.In([1,2,3]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, in13),
                new is.NotIn([1,2,3])
            );
        }
    },
    In_NotIn: {},
    NotIn_In: {},

    In_GreaterThan: {},
    GreaterThan_In: {},

    In_GreaterThanEqual: {},
    GreaterThanEqual_In: {},

    In_LessThan: {},
    LessThan_In: {},

    In_LessThanEqual: {},
    LessThanEqual_In: {},

    // NotIn
    NotIn_NotIn: {
        // if there's some intersection ... then that's ok
        union: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);
            assert.deepEqual(
                set.union(isNotIn5, isNotIn6),
                set.UNIVERSAL
            );


            var a = new is.NotIn([4,5]),
                b = new is.NotIn([5,6]);
            assert.deepEqual(
                set.union(a, b),
                new is.NotIn([5])
            );
        },
        intersection: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);

            assert.deepEqual(
                set.intersection(isNotIn5, isNotIn6),
                new is.NotIn([5,6])
            );

            var in13 = new is.NotIn([1,2,3]),
                in24 = new is.NotIn([2,3,4]);
            assert.deepEqual(
                set.intersection(in13, in24),
                new is.NotIn([1,2,3,4])
            );
        },
        difference: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);
            assert.deepEqual(
                set.difference(isNotIn5, isNotIn6),
                new is.In([5])
            );

            var a = new is.NotIn([2,3]),
                b = new is.NotIn([3,4]);
            assert.deepEqual(
                set.difference(a, b),
                new is.In([2])
            );
        }
    },
    UNIVERSAL_NotIn: {
        difference: function(assert){
            var a = new is.NotIn([5]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, a),
                new is.In([5])
            );

            var b = new is.NotIn([1,2,3]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, b),
                new is.In([1,2,3])
            );
        }
    },

    NotIn_GreaterThan: {},
    GreaterThan_NotIn: {},

    NotIn_GreaterThanEqual: {},
    GreaterThanEqual_NotIn: {},

    NotIn_LessThan: {},
    LessThan_NotIn: {},

    NotIn_LessThanEqual: {},
    LessThanEqual_NotIn: {},

    // GreaterThan
    GreaterThan_GreaterThan: {},
    GreaterThan_GreaterThanEqual: {},
    GreaterThanEqual_GreaterThan: {},

    GreaterThan_LessThan: {},
    LessThan_GreaterThan: {},

    GreaterThan_LessThanEqual: {},
    LessThanEqual_GreaterThan: {},

    // GreaterThanEqual
    GreaterThanEqual_GreaterThanEqual: {},

    GreaterThanEqual_LessThan: {},
    LessThan_GreaterThanEqual: {},

    GreaterThanEqual_LessThanEqual: {},
    LessThanEqual_GreaterThanEqual: {},

    // LessThan
    LessThan_LessThan: {},

    LessThan_LessThanEqual: {},
    LessThanEqual_LessThan: {},

    // LessThanEqual
    LessThanEqual_LessThanEqual: {}
};

var makeTests = function(test, name1, name2, reversed){
    if(reversed) {
        if(test.difference) {
            QUnit.test(name1+" difference "+name2, test.difference);
        } else {
            QUnit.skip("no "+name1+" difference "+name2, function(){});
        }
    } else {
        ["union","intersection","difference"].forEach(function(prop){
            if(test[prop]) {
                QUnit.test(name1+" "+prop+" "+name2, test[prop]);
            } else {
                QUnit.skip("no "+name1+" "+prop+" "+name2, function(){});
            }
        });
    }
};

var names = Object.keys(compare);
names.forEach(function(name1, i){
    if(!tests[name1+"_"+name1]) {
        QUnit.skip("no "+name1+"_"+name1+" test", function(){});
    } else {
        makeTests(tests[name1+"_"+name1], name1, name1);
    }

    if(!tests["UNIVERSAL_"+name1]) {
        QUnit.skip("no UNIVERSAL_"+name1+" test", function(){});
    } else {
        makeTests(tests["UNIVERSAL_"+name1], "UNIVERSAL", name1, true);
    }

    for(var j=i+1; j < names.length; j++) {
        var name2 = names[j];
        if(!tests[name1+"_"+name2]) {
            QUnit.skip("no "+name1+"_"+name2+" test", function(){});
        } else {
            makeTests(tests[name1+"_"+name2], name1, name2);
        }
        if(!tests[name2+"_"+name1]) {
            QUnit.skip("no "+name2+"_"+name1+" test", function(){});
        } else {
            makeTests(tests[name2+"_"+name1], name2, name1, true);
        }
    }
});
