var set = require("../set");
var arrayUnionIntersectionDifference = require("../comparators/array-union-intersection-difference");

var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

var setTypeSymbol = canSymbol.for("can.SetType"),
    isMemberSymbol = canSymbol.for("can.isMember");

module.exports = function(Type, allValues, hydrate){

    function Enum(values){
        this.values = hydrate? hydrate(values) : (
            Array.isArray(values) ? values : [values]
        );
    }
    canReflect.assignSymbols(Enum.prototype,{
        "can.serialize": function(){
            return this.values.length === 1 ? this.values[0] : this.values;
        }
    });

    Type[setTypeSymbol] = Enum;
    Type[isMemberSymbol] = function(value){
        return allValues.some(function(val){
            return set.equal( val, value);
        });
    };
    Enum[isMemberSymbol] = function(value){
        return this.values.some(function(val){
            return set.equal( val, value);
        });
    };

    Enum.UNIVERSAL = new Enum(allValues);

    var difference = function(enum1, enum2){
        var result = arrayUnionIntersectionDifference(enum1.values, enum2.values);
        if(result.difference.length) {
            return new Enum(result.difference);
        } else {
            return set.EMPTY;
        }
    };

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
        difference: difference
    });

    set.defineComparison(Enum, set.UNIVERSAL, {
        difference: function(enumA){
            return difference(enumA, {values: allValues.slice(0)});
        }
    });

    set.defineComparison(set.UNIVERSAL,Enum, {
        difference: function(universe, enumB){
            return difference({values: allValues.slice(0)}, enumB);
        }
    });

    return Enum;
};
