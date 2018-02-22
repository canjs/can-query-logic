function Type(NewType, definition){

}
var comparisons = new Map();
function addComparitors(type1, type2, comparitors) {
    var subMap = comparisons.get(type1);

    if(!subMap) {
        subMap = new Map();
        comparisons.set(type1, subMap);
    }
    subMap.set(type2, comparitors);
    // swap comparitors for reverse
}

function reverseArgs(fn){
    return function(first, second){
        return fn.call(second, first);
    };
}

Type.compare = function(type1, type2, comparitors) {
    addComparitors(type1, type2, comparitors);
    if(type1 !== type2) {
        var reverse = {};
        for(var prop in comparitors) {
            reverse[prop] = reverseArgs(comparitors[prop]);
        }
        addComparitors(type2, type1, reverse);
    }
};

var getComparitors = function(Type1, Type2){
    var subMap = comparisons.get(Type1);

    if(subMap) {
        return subMap.get(Type2);
    }
};

Type.EmptySet = {};

var get = {};

["intersection","difference","union"].forEach(function(prop){
    get[prop] = function(forwardComparitors, value1, value2){
        var result = forwardComparitors[prop](value1, value2);
        if(result === undefined && !forwardComparitors.mustReturnEmptySet) {
            return Type.EmptySet;
        } else {
            return result;
        }
    };
});
function Primitive(){};

var typeMap = {
    "number": Primitive,
    "string": Primitive,
    "undefined": Primitive,
    "boolean": Primitive
};
Type.type = function(value){
    if(value === null) {
        return Primitive;
    }
    if(typeMap.hasOwnProperty(typeof value)) {
        return typeMap[typeof value];
    }

    return value.constructor;
};

function identity(v1, v2) {
    return v1 === v2 ? v1 : Type.EmptySet;
}

var identityComparitor = {
    mustReturnEmptySet: true,
    intersection: identity,
    difference: function(v1, v2){
        return v1 === v2 ? Type.EmptySet : v1;
    },
    union: identity
};
Type.compare(null,null, identityComparitor);
for(var prop in typeMap) {
    Type.compare(typeMap[prop], typeMap[prop], identityComparitor);
}

/**
 * Checks if A is a subset of B.  If A is a subset of B if:
 * - A \ B = undefined
 * - A ∩ B = defined
 * - B ∩ A = defined
 */
Type.isSubset = function(value1, value2){
    // check primary direction

    var Type1 = Type.type(value1),
        Type2 = Type.type(value2);
    var forwardComparitors = getComparitors(Type1, Type2);
    var reverseComparitors = getComparitors(Type2, Type1);
    if(forwardComparitors && reverseComparitors) {
        var intersection = get.intersection(forwardComparitors, value1, value2);
        var difference = get.difference(forwardComparitors, value1, value2);
        if(intersection !== Type.EmptySet && difference === Type.EmptySet) {
            var reverseIntersection = get.intersection(reverseComparitors, value1, value2);
            return reverseIntersection !== Type.EmptySet;
        } else {
            return false;
        }
    } else {
        throw new Error("Unable to perform subset comparison");
    }
};

Type.isEqual = function(value1, value2) {
    var Type1 = Type.type(value1),
        Type2 = Type.type(value2);
    var forwardComparitors = getComparitors(Type1, Type2);
    var reverseComparitors = getComparitors(Type2, Type1);
    if(forwardComparitors && reverseComparitors) {
        var intersection = get.intersection(forwardComparitors, value1, value2);
        var difference = get.difference(forwardComparitors, value1, value2);
        if(intersection !== Type.EmptySet && difference === Type.EmptySet) {
            var reverseIntersection = get.intersection(reverseComparitors, value1, value2);
            var reverseDifference = get.difference(reverseComparitors, value1, value2);
            return reverseIntersection !== Type.EmptySet && reverseDifference === Type.EmptySet;
        } else {
            return false;
        }
    } else {
        throw new Error("Unable to perform equal comparison");
    }
};

Type.union = function(value1, value2) {
    var Type1 = Type.type(value1),
        Type2 = Type.type(value2);
    var forwardComparitors = getComparitors(Type1, Type2);
    if(forwardComparitors) {
        return get.union(forwardComparitors, value1, value2);
    } else {
        throw new Error("Unable to perform union comparison");
    }
};

module.exports = Type;
