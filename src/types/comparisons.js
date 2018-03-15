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

function returnBiggerValue(gtA, gtB) {
    if(gtA.value < gtB.value) {
        return gtB;
    } else {
        return gtA;
    }
}

 function returnSmallerValue(gtA, gtB) {
    if(gtA.value > gtB.value) {
        return gtB;
    } else {
        return gtA;
    }
}


function makeAnd(ands) {
    return comparisons.And ? new comparisons.And(ands) : set.UNDEFINABLE;
}
function makeOr(ors) {
    return comparisons.Or ? new comparisons.Or(ors) : set.UNDEFINABLE;
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

    In_GreaterThan: {
        union: function(inSet, gt){
            var allGt = inSet.values.every(function(value){
                return value > gt.value;
            });
            return allGt ? gt: makeOr([inSet, gt]);
        }
    },
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
    GreaterThan_GreaterThan: {
        union: returnSmallerValue,
        intersection: returnBiggerValue,
        difference: function(gtA, gtB) {
            if(gtA.value < gtB.value) {
                // AND( {$gt:5}, {$lte: 6} )
                return makeAnd([gtA, new is.LessThanEqual(gtB.value)]);
            } else {
                return set.EMPTY;
            }
        }
    },
    UNIVERSAL_GreaterThan: {
        difference: makeSecondValue(is.LessThanEqual)
    },

	GreaterThan_GreaterThanEqual: {
		union: returnSmallerValue,
		intersection: returnBiggerValue,
		difference: function(gt, gte) {
			if(gt.value < gte.value) {
				// AND( {$gt:5}, {$lt: 6} )
				return makeAnd([gt, new is.LessThan(gte.value)]);
			} else {
				return set.EMPTY;
			}
		}
	},
	GreaterThanEqual_GreaterThan: {
		union: returnSmallerValue,
		intersection: returnBiggerValue,
		difference: function(gt, gte) {
			if(gt.value <= gte.value) {
				// AND( {$gt:5}, {$lte: 6} )
				return makeAnd([gt, new is.LessThanEqual(gte.value)]);
			} else {
				return set.EMPTY;
			}
		}
	},

    GreaterThan_LessThan: {},
    LessThan_GreaterThan: {},

    GreaterThan_LessThanEqual: {},
    LessThanEqual_GreaterThan: {},

    // GreaterThanEqual
    GreaterThanEqual_GreaterThanEqual: {
        union: returnSmallerValue,
        intersection: returnBiggerValue,
        difference: function(gtA, gtB) {
            if(gtA.value < gtB.value) {
                return makeAnd([gtA, new is.LessThan(gtB.value)]);
            } else {
                return set.EMPTY;
            }
        }
    },
    UNIVERSAL_GreaterThanEqual: {
        difference: makeSecondValue(is.LessThan)
    },

    GreaterThanEqual_LessThan: {},
    LessThan_GreaterThanEqual: {},

    GreaterThanEqual_LessThanEqual: {},
    LessThanEqual_GreaterThanEqual: {},

    // LessThan
    LessThan_LessThan: {
        union: returnBiggerValue,
        intersection: returnSmallerValue,
        difference: function(ltA, ltB){
            if(ltA.value > ltB.value) {
                return makeAnd([ ltA, new is.GreaterThanEqual(ltB.value) ]);
            } else {
                return set.EMPTY;
            }
        }
    },
	UNIVERSAL_LessThan: {
        difference: makeSecondValue(is.GreaterThanEqual)
	},

	LessThan_LessThanEqual: {
		union: returnBiggerValue,
		intersection: returnSmallerValue,
		difference: function(lt, lte){
			if (lte.value >= lt.value) {
				return set.EMPTY;
			} else {
				return makeAnd([ lt, new is.GreaterThan(lte.value) ]);
			}
		}
	},
	LessThanEqual_LessThan: {
		union: returnBiggerValue,
		intersection: returnSmallerValue,
		difference: function(lte, lt){
			if (lte.value <= lt.value) {
				return set.EMPTY;
			} else {
				return makeAnd([ lte, new is.GreaterThanEqual(lt.value) ]);
			}
		}
	},

    // LessThanEqual
	LessThanEqual_LessThanEqual: {
		union: returnBiggerValue,
		intersection: returnSmallerValue,
		difference: function(lteA, lteB){
			if(lteA.value >= lteB.value) {
				return makeAnd([ lteA, new is.GreaterThan(lteB.value) ]);
			} else {
				return set.EMPTY;
			}
		}
	},
	UNIVERSAL_LessThanEqual: {
		difference: makeSecondValue(is.GreaterThan)
	}
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
