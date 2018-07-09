var set = require("../set");
var makeRealNumberRangeInclusive = require("./make-real-number-range-inclusive");
var assign = require("can-assign");
var canReflect = require("can-reflect");
var andOrNot = require("./and-or-not");
var helpers = require("../helpers");
var defineLazyValue = require("can-define-lazy-value");
var canSymbol = require("can-symbol");
var isMemberSymbol = canSymbol.for("can.isMember");

// TYPES FOR FILTERING
var KeysAnd = andOrNot.KeysAnd,
	Or = andOrNot.ValuesOr,
	Not = andOrNot.ValuesNot;

// TYPES FOR PAGINATION
var RecordRange = makeRealNumberRangeInclusive(0, Infinity);

// WILL MAKE A TYPE FOR SORTING
function makeSort(schemaKeys, hydrateAndValue){
	// Makes gt and lt functions that `helpers.sorter` can use
	// to make a `compare` function for `Array.sort(compare)`.`
	var sorters = {};
    canReflect.eachKey(schemaKeys, function(schemaProp, key){

        sorters[key] = {
            // valueA is GT valueB
            $gt: function(valueA, valueB) {
                var $gt = hydrateAndValue({$gt: valueB}, key, schemaProp,
									helpers.valueHydrator);
                return $gt[isMemberSymbol](valueA);
            },
            $lt: function( valueA, valueB ){
                var $lt = hydrateAndValue({$lt: valueB}, key, schemaProp,
									helpers.valueHydrator);
                return $lt[isMemberSymbol](valueA);
            }
        };
    });

	function Sort(key) {
		this.key = key;
		this.compare = helpers.sorter(key, sorters);
	}

	function identityIntersection(v1, v2) {
		return v1.key === v2.key ? v1 : set.EMPTY;
	}
	function identityDifference(v1, v2) {
		return v1.key === v2.key ? set.EMPTY : v1;
	}
	function identityUnion(v1, v2) {
		return v1.key === v2.key ? v1 : set.UNDEFINABLE;
	}
	set.defineComparison(Sort, Sort, {
		intersection: identityIntersection,
		difference: identityDifference,
		union: identityUnion
	});
	return Sort;
}

var DefaultSort = makeSort({});


// Define the BasicQuery type
function BasicQuery(query) {
	assign(this, query);
	if (!this.filter) {
		this.filter = set.UNIVERSAL;
	}
	if (!this.page) {
		this.page = new RecordRange();
	}
	if (!this.sort) {
		this.sort = "id";
	}
	if(typeof this.sort === "string") {
		this.sort = new DefaultSort(this.sort);
	}
}

// BasicQuery's static properties
BasicQuery.KeysAnd = KeysAnd;
BasicQuery.Or = Or;
BasicQuery.Not = Not;
BasicQuery.RecordRange = RecordRange;
BasicQuery.makeSort = makeSort;

// BasicQuery's prototype methods.
// These are "additional" features beyond what `set` provides.
// These typically pertain to actual data results of a query.
canReflect.assignMap(BasicQuery.prototype, {
	count: function() {
		return this.page.end - this.page.start + 1;
	},
	sortData: function(data) {
		return data.slice(0).sort(this.sort.compare);
	},
	filterMembersAndGetCount: function(bData, parentQuery) {
		if (parentQuery) {
			if (!set.isSubset(this, parentQuery)) {
				throw new Error("can-query-logic: Unable to get members from a set that is not a superset of the current set.");
			}
		} else {
			parentQuery = new BasicQuery();
		}

		// reduce response to items in data that meet where criteria
		var aData = bData.filter(function(data) {
			return this.filter.isMember(data);
		}, this);

		var count = aData.length;

		// sort the data if needed
		if (count && (this.sort.key !== parentQuery.sort.key)) {
			aData = this.sortData(aData);
		}

		var thisIsUniversal = set.isEqual(this.page, set.UNIVERSAL),
			parentIsUniversal = set.isEqual(parentQuery.page, set.UNIVERSAL);

		if (parentIsUniversal) {
			if (thisIsUniversal) {
				return {
					data: aData,
					count: count
				};
			} else {
				return {
					data: aData.slice(this.page.start, this.page.end + 1),
					count: count
				};
			}
		}
		// everything but range is equal
		else if (this.sort.key === parentQuery.sort.key && set.isEqual(parentQuery.filter, this.filter)) {
			return {
				data: aData.slice(this.page.start - parentQuery.page.start, this.page.end - parentQuery.page.start + 1),
				count: count
			};
		} else {
			// parent starts at something ...
			throw new Error("can-query-logic: Unable to get members from the parent set for this subset.");
		}
	},
	filterFrom: function(bData, parentQuery) {
		return this.filterMembersAndGetCount(bData, parentQuery).data;
	},
	merge: function(b, aItems, bItems, getId) {
		var union = set.union(this, b);

		if (union === set.UNDEFINABLE) {
			return undefined;
		} else {
			var combined = helpers.uniqueConcat(aItems, bItems, getId);
			return union.sortData(combined);
		}
	},
	index: function(props, items) {
		// make sure we have the property
		var data = helpers.sortData(this.sort.key);
		if (!canReflect.hasOwnKey(props, data.prop)) {
			return undefined;
		}
		// use the passed sort's compare function
		return helpers.getIndex(this.sort.compare, items, props);
	},
	isMember: function(props) {
		// Use the AND type for it's isMember method
		return this.filter.isMember(props);
	},
	removePagination: function(){
		this.page = new RecordRange();
	}
});

// Helpers used for the `set` comparators
var CLAUSE_TYPES = ["filter", "page","sort"];

function getDifferentClauseTypes(queryA, queryB) {
	var differentTypes = [];

	CLAUSE_TYPES.forEach(function(clause) {
		if (!set.isEqual(queryA[clause], queryB[clause])) {
			differentTypes.push(clause);
		}
	});

	return differentTypes;
}

function isSubset(subLetter, superLetter, meta) {
	if (meta[subLetter + "FilterIsSubset"]) {
		if (meta[superLetter + "PageIsUniversal"]) {
			return true;
		} else {
			return meta[subLetter + "PageIsSubset"] && meta.sortIsEqual;
		}
	} else {
		return false;
	}
}

// This type contains a bunch of lazy getters that
// cache their value after being read.
// This helps performance.
function MetaInformation(queryA, queryB) {
	this.queryA = queryA;
	this.queryB = queryB;
}

canReflect.eachKey({
	"pageIsEqual": function() {
		return set.isEqual(this.queryA.page, this.queryB.page);
	},
	"aPageIsUniversal": function() {
		return set.isEqual(this.queryA.page, set.UNIVERSAL);
	},
	"bPageIsUniversal": function() {
		return set.isEqual(this.queryB.page, set.UNIVERSAL);
	},
	"pagesAreUniversal": function() {
		return this.pageIsEqual && this.aPageIsUniversal;
	},
	"sortIsEqual": function() {
		return this.queryA.sort.key === this.queryB.sort.key;
	},
	"aFilterIsSubset": function() {
		return set.isSubset(this.queryA.filter, this.queryB.filter);
	},
	"bFilterIsSubset": function() {
		return set.isSubset(this.queryB.filter, this.queryA.filter);
	},
	"aPageIsSubset": function() {
		return set.isSubset(this.queryA.page, this.queryB.page);
	},
	"bPageIsSubset": function() {
		return set.isSubset(this.queryB.page, this.queryA.page);
	},
	"filterIsEqual": function() {
		return set.isEqual(this.queryA.filter, this.queryB.filter);
	},
	"aIsSubset": function() {
		return isSubset("a", "b", this);
	},
	"bIsSubset": function() {
		return isSubset("b", "a", this);
	}
}, function(def, prop) {
	defineLazyValue(MetaInformation.prototype, prop, def);
});

function metaInformation(queryA, queryB) {
	var meta = new MetaInformation(queryA, queryB);
	return meta;
}


// Define comparators
set.defineComparison(BasicQuery, BasicQuery, {
	union: function(queryA, queryB) {

		var meta = metaInformation(queryA, queryB);


		var filterUnion = set.union(queryA.filter, queryB.filter);

		if (meta.pagesAreUniversal) {
			// We ignore the sort.
			return new BasicQuery({
				filter: filterUnion,
				sort: meta.sortIsEqual ? queryA.sort.key : undefined
			});
		}


		if (meta.filterIsEqual) {
			if (meta.sortIsEqual) {
				return new BasicQuery({
					filter: queryA.filter,
					sort: queryA.sort.key,
					page: set.union(queryA.page, queryB.page)
				});
			} else {
				if (meta.aIsSubset) {
					return queryB;
				} else if (meta.bIsSubset) {
					return queryA;
				}
				// we can't specify which pagination would bring in everything.
				// but a union does exist.
				return set.UNDEFINABLE;
			}
		} else {
			throw new Error("different filters, non-universal pages");
		}
	},
	intersection: function(queryA, queryB) {

		// {age: 35} U {name: "JBM"} -> {age: 35, name: "JBM"}

		// { filter: {age: 35},
		//   page: {0, 10},
		//   sort: "foo" }
		// U
		// { filter: {name: "JBM"},
		//   page: {0, 10},
		//   sort: "foo" }

		var meta = metaInformation(queryA, queryB);

		if (meta.pagesAreUniversal) {
			// We ignore the sort.
			var filterResult = set.intersection(queryA.filter, queryB.filter);
			if (set.isDefinedAndHasMembers(filterResult)) {
				return new BasicQuery({
					filter: filterResult,
					sort: meta.sortIsEqual ? queryA.sort.key : undefined
				});

			} else {
				return filterResult;
			}
		}



		// check if disjoint wheres
		if (set.intersection(queryA.filter, queryB.filter) === set.EMPTY) {
			return set.EMPTY;
		}

		if (meta.filterIsEqual) {
			if (meta.sortIsEqual) {
				return new BasicQuery({
					filter: queryA.filter,
					sort: queryA.sort.key,
					page: set.intersection(queryA.page, queryB.page)
				});
			} else {
				if (meta.aIsSubset) {
					return queryA;
				} else if (meta.bIsSubset) {
					return queryB;
				}
				return set.UNKNOWABLE;
				//throw new Error("same filter, different sorts, non universal pages");
			}
		} else {
			if (meta.aIsSubset) {
				return queryA;
			} else if (meta.bIsSubset) {
				return queryB;
			} else {
				// filters are different, both pagination isn't universal
				return set.UNDEFINABLE;
			}

		}

	},
	difference: function(queryA, queryB) {

		var differentClauses = getDifferentClauseTypes(queryA, queryB);
		var meta = metaInformation(queryA, queryB);
		var clause;
		if (differentClauses.length > 1) {
			if (meta.aIsSubset) {
				return set.EMPTY;
			}
			if (meta.pagesAreUniversal) {
				return new BasicQuery({
					filter: set.difference(queryA.filter, queryB.filter),
					sort: queryA.sort.key
				});
			}

			return set.UNDEFINABLE;
		} else {
			switch (clause = differentClauses[0]) {
				// if all the clauses are the same, then there can't be a difference
				case undefined:
					{
						return set.EMPTY;
					}
				case "sort":
					{
						// if order is the only difference, then there can't be a difference
						// if items are paged but the order is different, though, the sets are not comparable
						// Either way, the result is false
						if (meta.pagesAreUniversal) {
							return set.EMPTY;
						} else {
							return set.UNKNOWABLE;
						}


					}
				case "page":
				case "filter":
					{
						// if there's only one clause to evaluate or the clauses are where + id,
						// then we can try to determine the difference set.
						// Note that any difference in the ID clause will cause the result to be
						// true (if A has no ID but B has ID) or false (any case where A has ID)
						var result = set.difference(queryA[clause],
							queryB[clause]);

						if (set.isSpecial(result)) {
							return result;
						} else {
							var query = {
								filter: queryA.filter,
								page: queryA.page,
								sort: queryA.sort.key
							};
							query[clause] = result;
							return new BasicQuery(query);
						}
					}
			}
		}
	}
});


module.exports = BasicQuery;
