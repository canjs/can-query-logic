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

function uniqueConcat(itemsA, itemsB, getId) {
    var ids = new Set();
    return itemsA.concat(itemsB).filter(function(item){
        var id = getId(item);
        if(!ids.has(id)) {
            ids.add(id);
            return true;
        } else {
            return false;
        }
    });
}

function getIndex(compare, items, props){
    if(!items || !items.length) {
        return undefined;
    }
    // check the start and the end
    if( compare(props, items[0]) === -1 ) {
        return 0;
    }
    else if(compare(props, items[items.length -1] ) === 1 ) {
        return items.length;
    }
    var low = 0,
        high = items.length;

    // From lodash lodash 4.6.1 <https://lodash.com/>
    // Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
    while (low < high) {
        var mid = (low + high) >>> 1,
            item = items[mid],
            computed = compare(props, item);
        if ( computed === -1 ) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return high;
    // bisect by calling sortFunc
}
function sortData(sortPropValue) {
    var parts = sortPropValue.split(' ');
    return {
        prop: parts[0],
        desc: (parts[1] || '').toLowerCase()	=== 'desc'
    };
}

function sorter(sortPropValue) {
    var data = sortData(sortPropValue);
    return function(item1, item2){
        var item1Value = item1[data.prop];
        var item2Value = item2[data.prop];
        var temp;


        if(data.desc) {
            temp = item1Value;
            item1Value = item2Value;
            item2Value = temp;
        }

        if(item1Value < item2Value) {
            return -1;
        }

        if(item1Value > item2Value) {
            return 1;
        }

        return 0;
    };
}

BasicQuery.prototype.count = function(){
    return this.page.end - this.page.start + 1;
};
BasicQuery.prototype.sortData = function(data){
    var sort = sorter(this.sort);
    return data.slice(0).sort(sort);
};
BasicQuery.prototype.filterFrom = function(bData, parentQuery) {
    parentQuery  = parentQuery || new BasicQuery();

    // if this isn't a subset ... we can't filter
    if(!set.isSubset(this, parentQuery)) {
        return undefined;
    }

    // reduce response to items in data that meet where criteria
    var aData = bData.filter(this.filter.isMember.bind(this.filter));

    // sort the data if needed
    if( aData.length && (this.sort !== parentQuery.sort) ) {
        aData = this.sortData(aData);
    }

    var thisIsUniversal = set.isEqual( this.page, set.UNIVERSAL),
        parentIsUniversal = set.isEqual( parentQuery.page, set.UNIVERSAL);

    if(parentIsUniversal) {
        if( thisIsUniversal ) {
            return aData;
        } else {
            return aData.slice(this.page.start, this.page.end+1);
        }
    }
    // everything but range is equal
    else if(this.sort === parentQuery.sort && set.isEqual(parentQuery.filter,this.filter) ) {
        return aData.slice( this.page.start - parentQuery.page.start, this.page.end - parentQuery.page.start + 1 );
    }
    else {
        // parent starts at something ...
        throw new Error("unable to do right now");
    }

    return aData;
};
BasicQuery.prototype.merge = function(b, aItems, bItems, getId){
    var union = set.union(this,b);

    if(union === set.UNDEFINABLE) {
        return undefined;
    } else {
        var combined = uniqueConcat(aItems,bItems, getId);
        return union.sortData(combined);
    }

    // basically if there's pagination, we might not be able to do this


};

BasicQuery.prototype.index = function(props, items){
    var data = sortData(this.sort);
    if(!Object.prototype.hasOwnProperty.call(props, data.prop)) {
        return undefined;
    }
    var sort = sorter(this.sort);
    return getIndex(sort, items, props);
};

BasicQuery.prototype.isMember = function(props){
    return this.filter.isMember(props);
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

function isSubset(subLetter, superLetter, meta) {
    if(meta[subLetter+"FilterIsSubset"]) {
        if(meta[superLetter+"PageIsUniversal"]) {
            return true;
        } else {
            return meta[subLetter+"PageIsSubset"] && meta.sortIsEqual;
        }
    } else {
        return false;
    }
}

var defineLazyValue = require("can-define-lazy-value");

function MetaInformation(queryA, queryB) {
    this.queryA = queryA;
    this.queryB = queryB;
}
defineLazyValue(MetaInformation.prototype, "pageIsEqual", function(){
    return set.isEqual(this.queryA.page, this.queryB.page);
});
defineLazyValue(MetaInformation.prototype, "aPageIsUniversal", function(){
    return set.isEqual( this.queryA.page, set.UNIVERSAL);
});
defineLazyValue(MetaInformation.prototype, "bPageIsUniversal", function(){
    return set.isEqual( this.queryB.page, set.UNIVERSAL);
});
defineLazyValue(MetaInformation.prototype, "pagesAreUniversal", function(){
    return this.pageIsEqual && this.aPageIsUniversal;
});
defineLazyValue(MetaInformation.prototype, "sortIsEqual", function(){
    return this.queryA.sort === this.queryB.sort;
});
defineLazyValue(MetaInformation.prototype, "aFilterIsSubset", function(){
    return set.isSubset(this.queryA.filter, this.queryB.filter);
});
defineLazyValue(MetaInformation.prototype, "bFilterIsSubset", function(){
    return set.isSubset(this.queryB.filter, this.queryA.filter);
});
defineLazyValue(MetaInformation.prototype, "aPageIsSubset", function(){
    return set.isSubset(this.queryA.page, this.queryB.page);
});
defineLazyValue(MetaInformation.prototype, "bPageIsSubset", function(){
    return set.isSubset(this.queryB.page, this.queryA.page);
});
defineLazyValue(MetaInformation.prototype, "filterIsEqual", function(){
    return set.isEqual(this.queryA.filter, this.queryB.filter);
});
defineLazyValue(MetaInformation.prototype, "aIsSubset", function(){
    return isSubset("a","b", this);
});
defineLazyValue(MetaInformation.prototype, "bIsSubset", function(){
    return isSubset("b","a", this);
});

function metaInformation(queryA, queryB) {
    var meta = new MetaInformation(queryA, queryB);
    return meta;
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

        var meta = metaInformation(queryA, queryB);;

        if(meta.pagesAreUniversal) {
            // We ignore the sort.
            return new BasicQuery({
                filter: set.intersection(queryA.filter, queryB.filter),
                sort: meta.sortIsEqual ? queryA.sort : undefined
            });
        }

        if(meta.filterIsEqual) {
            if(meta.sortIsEqual) {
                return new BasicQuery({
                    filter: queryA.filter,
                    sort: queryA.sort,
                    page: set.intersection(queryA.page, queryB.page)
                });
            } else {
                throw new Error("same filter, different sorts, non universal pages");
            }
        } else {
            if(meta.aIsSubset) {
                return queryA;
            } else if(meta.bIsSubset){
                return queryB;
            }
            throw new Error("different filters, non-universal pagination");
        }

    },
    difference: function(queryA, queryB){

        var differentClauses = getDifferentClauseTypes(queryA, queryB);
        var clause;
        if(differentClauses.length > 1) {
            var meta = metaInformation(queryA, queryB);
            if(meta.aIsSubset) {
                return set.EMPTY;
            }
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
                        var query = {
                            filter: queryA.filter,
                            page: queryA.page,
                            sort: queryA.sort
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
