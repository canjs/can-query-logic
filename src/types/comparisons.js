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
	}
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

comparisons.GreaterThan.test = function(a, b) {
	return a > b;
};
comparisons.GreaterThanEqual.test = function(a, b) {
	return a >= b;
};
comparisons.LessThan.test = function(a, b) {
	return a < b;
};
comparisons.LessThanEqual.test = function(a, b) {
	return a <= b;
};



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

function make_filterFirstValues(Comparison, Type, defaultReturn) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return Comparison.test(value, gt.value);
		});
		return values.length ?
			new Type(values) : defaultReturn || set.EMPTY ;
	};
}


function combineFilterFirstValues(options) {
	return function(inSet, gt) {
		var values = inSet.values.filter(function(value) {
			return options.values.test(value, gt.value);
		});
		return values.length ?
			options.combinedUsing([new options.arePut(values), gt]) : gt;
	};
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

	In_NotIn: {
		union: swapArgs( makeEnum("difference", is.NotIn, set.UNIVERSAL) ),
		// what does In have on its own
		intersection: makeEnum("difference", is.In),
		difference: makeEnum("intersection", is.In)
	},
	NotIn_In: {
		difference: makeEnum("union", is.NotIn)
	},

	In_GreaterThan: {
		union: combineFilterFirstValues({
			values: is.LessThanEqual,
			arePut: is.In,
			combinedUsing: makeOr
		}),
		intersection: make_filterFirstValues(is.GreaterThan, is.In, set.EMPTY),
		difference: make_filterFirstValues(is.LessThanEqual, is.In, set.EMPTY)
	},
	GreaterThan_In: {
		difference: swapArgs(combineFilterFirstValues({
			values: is.GreaterThan,
			arePut: is.NotIn,
			combinedUsing: makeAnd
		}))
	},

	In_GreaterThanEqual: {
		union: combineFilterFirstValues({
			values: is.LessThan,
			arePut: is.In,
			combinedUsing: makeOr
		}),
		intersection: make_filterFirstValues(is.GreaterThanEqual, is.In, set.EMPTY),
		difference: make_filterFirstValues(is.LessThan, is.In, set.EMPTY)
	},
	GreaterThanEqual_In: {
		difference: swapArgs(combineFilterFirstValues({
			values: is.GreaterThanEqual,
			arePut: is.NotIn,
			combinedUsing: makeAnd
		}))
	},

	In_LessThan: {
		union: combineFilterFirstValues({
			values: is.GreaterThanEqual,
			arePut: is.In,
			combinedUsing: makeOr
		}),
		intersection: make_filterFirstValues(is.LessThan, is.In, set.EMPTY),
		difference: make_filterFirstValues(is.GreaterThanEqual, is.In, set.EMPTY)
	},
	LessThan_In: {
		difference: swapArgs(combineFilterFirstValues({
			values: is.LessThan,
			arePut: is.NotIn,
			combinedUsing: makeAnd
		}))
	},

	In_LessThanEqual: {
		union: combineFilterFirstValues({
			values: is.GreaterThan,
			arePut: is.In,
			combinedUsing: makeOr
		}),
		intersection: make_filterFirstValues(is.LessThanEqual, is.In, set.EMPTY),
		difference: make_filterFirstValues(is.GreaterThan, is.In, set.EMPTY)
	},
	LessThanEqual_In: {
		difference: swapArgs(combineFilterFirstValues({
			values: is.LessThanEqual,
			arePut: is.NotIn,
			combinedUsing: makeAnd
		}))
	},

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

	GreaterThan_LessThanEqual: {},
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
