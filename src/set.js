var canSymbol = require("can-symbol");

var emptySymbol = {name: "EMPTY"}; //canSymbol.for("can.emptySet");
var setComparisonsSymbol = canSymbol.for("can.setComparisons");

//.count
//.equal
//.properSubset
//.subset
//.union
//.intersection
//.difference
//.getSubset
//.getUnion
//.has
//.index
//.identity

function reverseArgs(fn){
    return function(first, second){
        return fn.call(this, second, first);
    };
}

function addComparitors(type1, type2, comparitors) {
    var comparisons = type1[setComparisonsSymbol];
    if(!type1[setComparisonsSymbol]) {
        comparisons = type1[setComparisonsSymbol] = new Map();
    }
    var subMap = comparisons.get(type1);

    if(!subMap) {
        subMap = new Map();
        comparisons.set(type1, subMap);
    }
    subMap.set(type2, comparitors);
}

function Identity(){}

var typeMap = {
    "number": Identity,
    "string": Identity,
    "undefined": Identity,
    "boolean": Identity
};

var get = {};

var set = {
    UNIVERSAL: {name: "UNIVERSAL"}, //canSymbol.for("can.UNIVERSAL_SET"),
    EMPTY: emptySymbol,
    UNDEFINABLE: {name: "UNDEFINABLE"}, //canSymbol.for("can.UNDEFINABLE_SET"),
    Identity: Identity,
    getType: function(value){
        if(value === set.UNIVERSAL) {
            return set.UNIVERSAL;
        }
        if(value === set.EMPTY) {
            return set.EMPTY;
        }
        if(value === null) {
            return Identity;
        }
        if(typeMap.hasOwnProperty(typeof value)) {
            return typeMap[typeof value];
        }
        return value.constructor;
    },
    getComparisons: function(Type1, Type2){
        var comparisons = Type1[setComparisonsSymbol];
        if(comparisons) {
            var subMap = comparisons.get(Type1);

            if(subMap) {
                return subMap.get(Type2);
            }
        }
    },
    defineComparison: function(type1, type2, comparitors) {
        addComparitors(type1, type2, comparitors);
        if(type1 !== type2) {
            var reverse = {};
            for(var prop in comparitors) {
                // difference can not be reversed
                if(prop !== "difference") {
                    reverse[prop] = reverseArgs(comparitors[prop]);
                }

            }
            addComparitors(type2, type1, reverse);
        }
    },
    /**
     * Checks if A is a subset of B.  If A is a subset of B if:
     * - A \ B = EMPTY (A has nothing outside what's in B)
     * - A ∩ B = defined
     */
    isSubset: function(value1, value2){
        // check primary direction

        var Type1 = set.getType(value1),
            Type2 = set.getType(value2);
        var forwardComparitors = set.getComparisons(Type1, Type2);
        var reverseComparitors = set.getComparisons(Type2, Type1);
        if(forwardComparitors && reverseComparitors) {

            var intersection = get.intersection(forwardComparitors, value1, value2);
            // [a, b] \ [a, b, c]
            var difference = get.difference(forwardComparitors, value1, value2);
            // they intersect, but value2 has nothing value1 outside value2
            if(intersection !== set.EMPTY && difference === set.EMPTY) {
                //var reverseIntersection = get.intersection(reverseComparitors, value1, value2);
                //return reverseIntersection !== set.EMPTY;
                return true;
            } else {
                return false;
            }
        } else {
            throw new Error("Unable to perform subset comparison between "+Type1.name+" and "+Type2.name);
        }
    },
    isEqual: function(value1, value2) {
        var Type1 = set.getType(value1),
            Type2 = set.getType(value2);
        if(Type1 === Identity && Type2 === Identity) {
            return value1 === value2;
        }
        var forwardComparitors = set.getComparisons(Type1, Type2);
        var reverseComparitors = set.getComparisons(Type2, Type1);
        if(forwardComparitors && reverseComparitors) {
            var intersection = get.intersection(forwardComparitors, value1, value2);
            var difference = get.difference(forwardComparitors, value1, value2);
            if(intersection !== set.EMPTY && difference === set.EMPTY) {
                var reverseIntersection = get.intersection(reverseComparitors, value1, value2);
                var reverseDifference = get.difference(reverseComparitors, value1, value2);
                return reverseIntersection !== set.EMPTY && reverseDifference === set.EMPTY;
            } else {
                return false;
            }
        } else {
            throw new Error("Unable to perform equal comparison between "+Type1.name+" and "+Type2.name);
        }
    },

    union: function(value1, value2) {
        if(value1 === set.UNIVERSAL || value2 === set.UNIVERSAL) {
            return set.UNIVERSAL;
        }
        if(value1 === set.EMPTY) {
            return value2;
        } else if(value2 === set.EMPTY) {
            return value1;
        }
        var Type1 = set.getType(value1),
            Type2 = set.getType(value2);
        var forwardComparitors = set.getComparisons(Type1, Type2);
        return get.union(forwardComparitors, value1, value2);
    },

    intersection: function(value1, value2){
        if(value1 === set.UNIVERSAL) {
            return value2;
        }
        if(value2 === set.UNIVERSAL) {
            return value1;
        }
        if(value1 === set.EMPTY || value2 === set.EMPTY) {
            return set.EMPTY;
        }
        var Type1 = set.getType(value1),
            Type2 = set.getType(value2);
        var forwardComparitors = set.getComparisons(Type1, Type2);
        if(forwardComparitors) {
            return get.intersection(forwardComparitors, value1, value2);
        } else {
            throw new Error("Unable to perform intersection comparison between "+Type1.name+" and "+Type2.name);
        }
    },
    difference: function(value1, value2){
        if(value1 === set.EMPTY || value2 === set.EMPTY) {
            return set.EMPTY;
        }
        var Type1 = set.getType(value1),
            Type2 = set.getType(value2);
        var forwardComparitors = set.getComparisons(Type1, Type2);
        if(forwardComparitors) {
            return get.difference(forwardComparitors, value1, value2);
        } else {
            throw new Error("Unable to perform difference comparison between "+Type1.name+" and "+Type2.name);
        }
    }

};

var algebraSymbol = {
    "intersection": "∩",
    "union": "∪",
    "difference": "\\"
};

["intersection","difference","union"].forEach(function(prop){
    get[prop] = function(forwardComparitors, value1, value2){
        //var name1 = set.getType(value1).name,
        //    name2 = set.getType(value2).name;
        if(forwardComparitors && forwardComparitors[prop]) {
            var result = forwardComparitors[prop](value1, value2);
            console.log("",/*name1,*/ value1, algebraSymbol[prop], /*name2,*/ value2,"=", result);
            if(result === undefined && forwardComparitors.undefinedIsEmptySet === true) {
                return set.EMPTY;
            } else {
                return result;
            }
        } else {
            throw new Error("Unable to perform "+prop+" between "+set.getType(value1).name+" and "+set.getType(value2).name);
        }

    };
});

function identityIntersection(v1, v2) {
    return v1 === v2 ? v1 : set.EMPTY;
}
function identityDifference(v1, v2){
    return v1 === v2 ? set.EMPTY : v1;
}
function identityUnion(v1, v2) {
    return v1 === v2 ? v1 : set.UNDEFINABLE;
}
var identityComparitor = {
    mustReturnEmptySet: true,
    intersection: identityIntersection,
    difference: identityDifference,
    union: identityIntersection
};
set.defineComparison(Identity,Identity, identityComparitor);


module.exports = set;
