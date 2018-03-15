var set = require("../set");
var arrayUnionIntersectionDifference = require("../comparators/array-union-intersection-difference");

// $ne	Matches all values that are not equal to a specified value.
// $eq	Matches values that are equal to a specified value.
//
// $gt	Matches values that are greater than a specified value.
// $gte	Matches values that are greater than or equal to a specified value.

// $lt	Matches values that are less than a specified value.
// $lte	Matches values that are less than or equal to a specified value.

// $in	Matches any of the values specified in an array.
// $nin	Matches none of the values specified in an array.



var comparisons = {
    In: function In(values) {
        this.values = values;
    },
    NotIn: function NotIn(values) {
        this.values = values;
    },
    GreaterThan: function GreaterThan(value) {
        this.value = value;
    },
    GreaterThanEqual: function GreaterThanEqual(value) {
        this.value = value;
    },
    LessThan: function LessThan(value) {
        this.value = value;
    },
    LessThanEqual: function LessThanEqual(value){
        this.value = value;
    }
};


function makeEnum(type, Type, emptyResult) {
    return function(a, b){
        var result = arrayUnionIntersectionDifference(a.values, b.values);
        if(result[type].length) {
            return new Type(result[type]);
        } else {
            return emptyResult || set.EMPTY;
        }
    };
}


function makeSecondValue(Type, prop) {
    return function(universe, value) {
        return new Type(value[prop || "value"]);
    };
}


var is = comparisons;
var comparators = {
    // In
    In_In: {
        union: makeEnum("union", is.In),
        intersection: makeEnum("intersection", is.In),
        difference: makeEnum("difference", is.In)
    },
    UNIVERSAL_In: {
        difference: makeSecondValue(is.NotIn, "values")
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
        union: makeEnum("intersection", is.NotIn, set.UNIVERSAL),
        intersection: makeEnum("union", is.NotIn),
        difference: makeEnum("difference", is.In)
    },
    UNIVERSAL_NotIn: {
        difference: makeSecondValue(is.In, "values")
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

var names = Object.keys(comparisons);
names.forEach(function(name1, i){
    if(!comparators[name1+"_"+name1]) {
        console.warn("no "+name1+"_"+name1);
    } else {
        set.defineComparison(comparisons[name1], comparisons[name1], comparators[name1+"_"+name1]);
    }

    if(!comparators["UNIVERSAL_"+name1]) {
        console.warn("no UNIVERSAL_"+name1);
    } else {
        set.defineComparison(set.UNIVERSAL, comparisons[name1], comparators["UNIVERSAL_"+name1]);
    }

    for(var j=i+1; j < names.length; j++) {
        var name2 = names[j];
        if(!comparators[name1+"_"+name2]) {
            console.warn("no "+name1+"_"+name2);
        } else {
            set.defineComparison(comparisons[name1], comparisons[name2], comparators[name1+"_"+name2]);
        }
        if(!comparators[name2+"_"+name1]) {
            console.warn("no "+name2+"_"+name1);
        } else {
            set.defineComparison(comparisons[name2], comparisons[name1], comparators[name2+"_"+name1]);
        }
    }
});

module.exports= comparisons;
