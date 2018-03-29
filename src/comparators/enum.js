var set = require("../set");
var arrayUnionIntersectionDifference = require("../array-union-intersection-difference");


function Enum(values){
    this.values = values;
}

set.defineComparison(Enum, Enum,{
    union: function(enum1, enum2){
        var result = arrayUnionIntersectionDifference(enum1.values, enum2.values);
        if(result.union.length) {
            return new Enum(result.union);
        } else {
            return set.EMPTY;
        }
    },
    intersection: function(enum1, enum2){
        var result = arrayUnionIntersectionDifference(enum1.values, enum2.values);
        if(result.intersection.length) {
            return new Enum(result.intersection);
        } else {
            return set.EMPTY;
        }
    },
    difference: function(enum1, enum2){
        var result = arrayUnionIntersectionDifference(enum1.values, enum2.values);
        if(result.difference.length) {
            return new Enum(result.difference);
        } else {
            return set.EMPTY;
        }
    }
});

module.exports = Enum;
