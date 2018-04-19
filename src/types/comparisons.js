
var set = require("../set");
var arrayUnionIntersectionDifference = require("../array-union-intersection-difference");

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
		// TODO: change this to store as `Set` later.
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
	LessThanEqual: function LessThanEqual(value) {
		this.value = value;
	},
	// This is used to And something like `GT(3)` n `LT(4)`.
	// These are all value comparisons.
	And: function ValueAnd(ands) {
	    this.values = ands;
	},
	// This is used to OR something like `GT(4)` n `LT(3)`.
	// These are all value comparisons.
	Or: function ValueOr(ors) {
	    this.values = ors;
	}
};

comparisons.Or.prototype.orValues = function(){
    return this.values;
};


comparisons.In.test = function(values, b) {
	return values.some(function(value){
		var values = set.ownAndMemberValue(value, b)
		return values.own === values.member;
	});
};

comparisons.NotIn.test = function(values, b) {
	return !comparisons.In.test(values, b);
};
comparisons.NotIn.testValue = function(value, b) {
	return !comparisons.In.testValue(value, b);
};

function nullIsFalse(test) {
	return function(arg1, arg2) {
		if(arg1 == null || arg2 == null) {
			return false;
		} else {
			return test(arg1, arg2);
		}
	};
}
function nullIsFalseTwoIsOk(test) {
	return function(arg1, arg2) {
		if(arg1 === arg2) {
			return true;
		} else if(arg1 == null || arg2 == null) {
			return false;
		} else {
			return test(arg1, arg2);
		}
	};
}

comparisons.GreaterThan.test = nullIsFalse(function(a, b) {
	return a > b;
});
comparisons.GreaterThanEqual.test = nullIsFalseTwoIsOk(function(a, b) {
	return a >= b;
});
comparisons.LessThan.test = nullIsFalse(function(a, b) {
	return a < b;
});
comparisons.LessThanEqual.test = nullIsFalseTwoIsOk(function(a, b) {
	return a <= b;
});



function isMemberThatUsesTest(value) {
	var values = set.ownAndMemberValue(this.value, value);
	return this.constructor.test(values.member, values.own);
}
[comparisons.GreaterThan, comparisons.GreaterThanEqual, comparisons.LessThan, comparisons.LessThanEqual, comparisons.LessThan].forEach(function(Type){
	Type.prototype.isMember = isMemberThatUsesTest;
});
function isMemberThatUsesTestOnValues(value) {
	return this.constructor.test(this.values, value);
}
[comparisons.In, comparisons.NotIn].forEach(function(Type){
	Type.prototype.isMember = isMemberThatUsesTestOnValues;
});

comparisons.And.prototype.isMember = function(value){
	return this.values.every(function(and){
		return and.isMember(value);
	});
};
comparisons.Or.prototype.isMember = function(value){
	return this.values.some(function(and){
		return and.isMember(value);
	});
};



function makeNot(Type) {
	return {
		test: function(vA, vB){
			return !Type.test(vA, vB);
		}
	}
}


function makeEnum(type, Type, emptyResult) {
	return function(a, b) {
		var result = arrayUnionIntersectionDifference(a.values, b.values);
		if (result[type].length) {
			return new Type(result[type]);
		} else {
			return emptyResult || set.EMPTY;
		}
	};
}



function swapArgs(fn){
	return function(a, b) {
		return fn(b, a)
	};
}


function makeSecondValue(Type, prop) {
	return function(universe, value) {
		return new Type(value[prop || "value"]);
	};
}

function returnBiggerValue(gtA, gtB) {
	if (gtA.value < gtB.value) {
		return gtB;
	} else {
		return gtA;
	}
}

function returnSmallerValue(gtA, gtB) {
	if (gtA.value > gtB.value) {
		return gtB;
	} else {
		return gtA;
	}
}

function makeAndIf(Comparison, Type) {
	return function(ltA, ltB) {
		if (Comparison.test(ltA.value, ltB.value)) {
			return makeAnd([ltA, new Type(ltB.value)]);
		} else {
			return set.EMPTY;
		}
	};
}

function make_InIfEqual_else_andIf(Comparison, Type) {
	var elseCase = makeAndIf(Comparison, Type);
	return function(a, b) {
		if (a.value === b.value) {
			return new is.In([a.value]);
		} else {
			return elseCase(a, b);
		}
	};
}

function make_filterFirstValueAgainstSecond(Comparison, Type, defaultReturn) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return Comparison.test(gt, value);
		});
		return values.length ?
			new Type(values) : defaultReturn || set.EMPTY ;
	};
}

function make_filterFirstValues(Comparison, Type, defaultReturn) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return Comparison.test(value, gt.value);
		});
		return values.length ?
			new Type(values) : defaultReturn || set.EMPTY ;
	};
}

var isMemberTest = {
	test: function isMemberTest(set, value){
		return set.isMember(value);
	}
};

// `value` - has a test function to check values
// `with` - the type we use to combined with the "other" value.
// `combinedUsing` - If there are values, how do we stick it together with `with`
function combineFilterFirstValues(options) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return options.values.test(value, gt.value);
		});
		var range = options.with ? new options.with(gt.value) : gt;
		return values.length ?
			options.combinedUsing([new options.arePut(values),range]) : range;
	};
}
function combineFilterFirstValuesAgainstSecond(options) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return options.values.test(gt, value);
		});
		var range
		if(options.complement) {
			range = set.difference(set.UNIVERSAL, gt);
		} else if(options.with) {
			range = new options.with(gt.value);
		} else {
			range = gt;
		}
		return values.length ?
			options.combinedUsing([new options.arePut(values),range]) : range;
	};
}

function makeAnd(ands) {
	return comparisons.And ? new comparisons.And(ands) : set.UNDEFINABLE;
}

function makeOr(ors) {
	return comparisons.Or ? new comparisons.Or(ors) : set.UNDEFINABLE;
}

var is = comparisons;

var In_RANGE = {
	union: combineFilterFirstValuesAgainstSecond({
		values: makeNot( isMemberTest ),
		arePut: is.In,
		combinedUsing: makeOr
	}),
	intersection: make_filterFirstValueAgainstSecond(isMemberTest, is.In, set.EMPTY),
	difference: make_filterFirstValueAgainstSecond(makeNot(isMemberTest), is.In, set.EMPTY)
};
var RANGE_IN = {
	difference: swapArgs(combineFilterFirstValuesAgainstSecond({
		values: isMemberTest,
		arePut: is.NotIn,
		combinedUsing: makeAnd
	}))
};

var NotIn_RANGE = function(){
	return {
		union: make_filterFirstValueAgainstSecond(makeNot(isMemberTest), is.NotIn, set.UNIVERSAL),
		intersection: combineFilterFirstValuesAgainstSecond({
			values:  isMemberTest,
			arePut: is.NotIn,
			combinedUsing: makeAnd
		}),
		difference: combineFilterFirstValuesAgainstSecond({
			values:  makeNot(isMemberTest),
			arePut: is.NotIn,
			combinedUsing: makeAnd,
			complement: true
		})
	}
};
var RANGE_NotIn = {
	difference:  swapArgs(make_filterFirstValueAgainstSecond(isMemberTest, is.In, set.EMPTY))
};


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

	In_NotIn: {
		union: swapArgs( makeEnum("difference", is.NotIn, set.UNIVERSAL) ),
		// what does In have on its own
		intersection: makeEnum("difference", is.In),
		difference: makeEnum("intersection", is.In)
	},
	NotIn_In: {
		difference: makeEnum("union", is.NotIn)
	},

	In_GreaterThan: In_RANGE,
	GreaterThan_In: RANGE_IN,

	In_GreaterThanEqual: In_RANGE,
	GreaterThanEqual_In: RANGE_IN,

	In_LessThan: In_RANGE,
	LessThan_In: RANGE_IN,

	In_LessThanEqual: In_RANGE,
	LessThanEqual_In: RANGE_IN,
	In_And: In_RANGE,
	And_In: RANGE_IN,

	In_Or: In_RANGE,
	Or_In: RANGE_IN,

	// NotIn ===============================
	NotIn_NotIn: {
		union: makeEnum("intersection", is.NotIn, set.UNIVERSAL),
		intersection: makeEnum("union", is.NotIn),
		difference: makeEnum("difference", is.In)
	},
	UNIVERSAL_NotIn: {
		difference: makeSecondValue(is.In, "values")
	},

	NotIn_GreaterThan: NotIn_RANGE(),
	GreaterThan_NotIn: RANGE_NotIn,

	NotIn_GreaterThanEqual: NotIn_RANGE(),
	GreaterThanEqual_NotIn: RANGE_NotIn,

	NotIn_LessThan: NotIn_RANGE(),
	LessThan_NotIn: RANGE_NotIn,

	NotIn_LessThanEqual:  NotIn_RANGE(),
	LessThanEqual_NotIn: RANGE_NotIn,

	NotIn_And: NotIn_RANGE(),
	And_NotIn: RANGE_NotIn,

	NotIn_Or: NotIn_RANGE(),
	Or_NotIn: RANGE_NotIn,

	// GreaterThan ===============================
	GreaterThan_GreaterThan: {
		union: returnSmallerValue,
		intersection: returnBiggerValue,
		// {$gt:5} \ {gt: 6} -> AND( {$gt:5}, {$lte: 6} )
		difference: makeAndIf(is.LessThan, is.LessThanEqual)
	},
	UNIVERSAL_GreaterThan: {
		difference: makeSecondValue(is.LessThanEqual)
	},

	GreaterThan_GreaterThanEqual: {
		union: returnSmallerValue,
		intersection: returnBiggerValue,
		// {$gt:5} \ {gte: 6} -> AND( {$gt:5}, {$lt: 6} )
		difference: makeAndIf(is.LessThan, is.LessThan)
	},
	GreaterThanEqual_GreaterThan: {
		difference: make_InIfEqual_else_andIf(is.LessThan, is.LessThanEqual)
	},

	GreaterThan_LessThan: {},
	LessThan_GreaterThan: {},

	GreaterThan_LessThanEqual: {
		intersection: function(gt, lte) {
			if(gt.value <= lte.value) {
				return set.UNIVERSAL;
			} else {
				return makeAnd([gt, lte]);
			}
		}
	},
	LessThanEqual_GreaterThan: {},

	// GreaterThanEqual
	GreaterThanEqual_GreaterThanEqual: {
		union: returnSmallerValue,
		intersection: returnBiggerValue,
		// {gte: 2} \ {gte: 3} = {gte: 2} AND {lt: 3}
		difference: makeAndIf(is.LessThan, is.LessThan)
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
		difference: makeAndIf(is.GreaterThan, is.GreaterThanEqual)
	},
	UNIVERSAL_LessThan: {
		difference: makeSecondValue(is.GreaterThanEqual)
	},

	LessThan_LessThanEqual: {
		union: returnBiggerValue,
		intersection: returnSmallerValue,
		// {lt: 3} \ {lte: 2} -> {lt: 3} AND {gt: 2}
		difference: makeAndIf(is.GreaterThan, is.GreaterThan)
	},
	LessThanEqual_LessThan: {
		difference: make_InIfEqual_else_andIf(is.GreaterThanEqual, is.GreaterThanEqual)
	},

	// LessThanEqual
	LessThanEqual_LessThanEqual: {
		union: returnBiggerValue,
		intersection: returnSmallerValue,
		difference: function(lteA, lteB) {
			if (lteA.value >= lteB.value) {
				return makeAnd([lteA, new is.GreaterThan(lteB.value)]);
			} else {
				return set.EMPTY;
			}
		}
	},
	UNIVERSAL_LessThanEqual: {
		difference: makeSecondValue(is.GreaterThan)
	},

	UNIVERSAL_Or: {
		difference: function(universe, or){
			var inverseFirst = set.difference(universe, or.values[0]),
				inverseSecond = set.difference(universe, or.values[1]);
			return makeAnd([inverseFirst, inverseSecond]);
		}
	},
	UNIVERSAL_And: {
		difference: function(universe, and){
			var inverseFirst = set.difference(universe, and.values[0]),
				inverseSecond = set.difference(universe, and.values[1]);
			return makeOr([inverseFirst, inverseSecond]);
		}
	}
};

var names = Object.keys(comparisons);
names.forEach(function(name1, i) {
	if (!comparators[name1 + "_" + name1]) {
		console.warn("no " + name1 + "_" + name1);
	} else {
		set.defineComparison(comparisons[name1], comparisons[name1], comparators[name1 + "_" + name1]);
	}

	if (!comparators["UNIVERSAL_" + name1]) {
		console.warn("no UNIVERSAL_" + name1);
	} else {
		set.defineComparison(set.UNIVERSAL, comparisons[name1], comparators["UNIVERSAL_" + name1]);
	}

	for (var j = i + 1; j < names.length; j++) {
		var name2 = names[j];
		if (!comparators[name1 + "_" + name2]) {
			console.warn("no " + name1 + "_" + name2);
		} else {
			set.defineComparison(comparisons[name1], comparisons[name2], comparators[name1 + "_" + name2]);
		}
		if (!comparators[name2 + "_" + name1]) {
			console.warn("no " + name2 + "_" + name1);
		} else {
			set.defineComparison(comparisons[name2], comparisons[name1], comparators[name2 + "_" + name1]);
		}
	}
});

module.exports = comparisons;
