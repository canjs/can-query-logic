var set = require("../set");
var makeRealNumberRangeInclusive = require("./make-real-number-range-inclusive");
var assign = require("can-assign");
var canReflect = require("can-reflect");

var addAddOrComparators = require("../comparators/and-or");
var addNotComparitor = require("../comparators/not");

function And(values) {
    this.values = values;
}

function Or(values) {
    this.values = values;
}
function Not(value) {
    this.value = value;
}

addNotComparitor(Not);
addAddOrComparators(And, Or, Not);


var RecordRange = makeRealNumberRangeInclusive(0, Infinity);

function BasicQuery(query) {
    assign(this, query);
    if(!this.filter) {
        this.filter = set.UNIVERSAL;
    }
    if(!this.page) {
        this.page = new RecordRange();
    }
    if(!this.sort) {
        this.sort = "id ASC";
    }
}

BasicQuery.prototype.count = function(){
    return this.page.end - this.page.start + 1;
};
BasicQuery.prototype.getSubset = function(){

};


BasicQuery.And = And;
BasicQuery.Or = Or;
BasicQuery.Not = Not;
BasicQuery.RecordRange = RecordRange;


var CLAUSE_TYPES = ["filter","page","sort"];

function getDifferentClauseTypes(queryA, queryB){
	var differentTypes = [];

	CLAUSE_TYPES.forEach(function(clause) {
        if( !set.isEqual(queryA[clause], queryB[clause]) ) {
            differentTypes.push(clause);
        }
	});

	return differentTypes;
}

set.defineComparison(BasicQuery, BasicQuery,{
    union: function(queryA, queryB){

        var pageIsEqual = set.isEqual(queryA.page, queryB.page);
        var pagesAreUniversal = pageIsEqual && set.isEqual( queryA.page, set.UNIVERSAL);

        var filterUnion = set.union(queryA.filter, queryB.filter);

        var sortIsEqual = set.isEqual(queryA.sort, queryB.sort);

        if(pagesAreUniversal) {
            // We ignore the sort.
            return new BasicQuery({
                filter: filterUnion,
                sort: sortIsEqual ? queryA.sort : undefined
            });
        }

        var aFilterIsSubset = set.isSubset(queryA.filter, queryB.filter),
            bFilterIsSubset = set.isSubset(queryA.filter, queryB.filter),
            filterIsEqual = set.isEqual(queryA.filter, queryB.filter);

        if(filterIsEqual) {
            if(sortIsEqual) {
                return new BasicQuery({
                    filter: queryA.filter,
                    sort: queryA.sort,
                    page: set.union(queryA.page, queryB.page)
                });
            } else {
                throw new Error("same filter, different sorts, non universal pages");
            }
        } else {
            throw new Error("different filters, non-universal pages");
        }
    },
    intersection: function(queryA, queryB){

        // {age: 35} U {name: "JBM"} -> {age: 35, name: "JBM"}

        // { filter: {age: 35},
        //   page: {0, 10},
        //   sort: "foo" }
        // U
        // { filter: {name: "JBM"},
        //   page: {0, 10},
        //   sort: "foo" }

        var pageIsEqual = set.isEqual(queryA.page, queryB.page),
            pagesAreUniversal = pageIsEqual && queryA.page === set.UNIVERSAL,
            filterIntersection = set.intersection(queryA.filter, queryB.filter),
            sortIsEqual = set.isEqual(queryA.sort, queryB.sort);

        if(pagesAreUniversal) {
            // We ignore the sort.
            return new BasicQuery({
                filter: filterIntersection,
                sort: sortIsEqual ? queryA.sort : undefined
            });
        }

        var aFilterIsSubset = set.isSubset(queryA.filter, queryB.filter),
            bFilterIsSubset = set.isSubset(queryA.filter, queryB.filter),
            filterIsEqual = set.isEqual(queryA.filter, queryB.filter);

        if(filterIsEqual) {
            if(sortIsEqual) {
                return new BasicQuery({
                    filter: queryA.filter,
                    sort: queryA.sort,
                    page: set.intersection(queryA.page, queryB.page)
                });
            } else {
                throw new Error("same filter, different sorts, non universal pages");
            }
        } else {
            throw new Error("different filters, non-universal pages");
        }

    },
    difference: function(queryA, queryB){
        var differentClauses = getDifferentClauseTypes(queryA, queryB);
        var clause;
        if(differentClauses.length > 1) {
			return set.UNDEFINABLE;
		} else {
			switch(clause = differentClauses[0]) {
				case undefined :
					// if all the clauses are the same, then there can't be a difference
				case "sort" : {
					// if order is the only difference, then there can't be a difference
					// if items are paged but the order is different, though, the sets are not comparable
					// Either way, the result is false
					return set.EMPTY;
				}
				case "page" :
				case "filter" : {
					// if there's only one clause to evaluate or the clauses are where + id,
					// then we can try to determine the difference set.
					// Note that any difference in the ID clause will cause the result to be
					// true (if A has no ID but B has ID) or false (any case where A has ID)
					var result = set.difference(queryA[clause],
						queryB[clause]);

                    if(set.isSpecial(result)) {
                        return result;
                    } else {
                        var query = assign({}, queryA);
                        query[clause] = result;
                        return new BasicQuery(query);
                    }
				}
			}
		}
    }
});


module.exports = BasicQuery;
