var QueryLogic = require("../can-query-logic");
var QUnit = require("steal-qunit");

QUnit.module("can-query-logic special comparison logic");

QUnit.test("where to filter", function(){

    var todoQueryLogic = new QueryLogic({}, {
        toQuery(params){
            var where = params.where;
            delete params.where;
            params.filter = where;
            return params;
        },
        toParams(query){
            var where = query.filter;
            delete query.filter;
            query.where = where;
            return query;
        }
    });
    var q1 = {
            where: {first: "FIRST"}
        },
        q2 = {
            where: {second: "SECOND"}
        };

    var q3 = todoQueryLogic.intersection(q1,q2);

    QUnit.deepEqual(q3,{
        where: {first: "FIRST", second: "SECOND"}
    }, "got intersection");
});

QUnit.test("Searchable string", function(){
    // Create a set type that is used to do comparisons.
    function SearchableStringSet(value) {
        this.value = value;
    }
    // Returns if the name on a todo is actually a member of the set.
    SearchableStringSet.prototype[Symbol.for("can.isMember")] = function(value){
        return value.includes(this.value);
    };

    // Specify how to do the fundamental set comparisons.
    QueryLogic.defineComparison(SearchableStringSet,SearchableStringSet,{
        union(searchA, searchB){
            if(searchA.value.includes(searchB.value)) {
                return searchB;
            }
            if(searchB.value.includes(searchA.value)) {
                return searchA;
            }
            return new QueryLogic.Or(searchA, searchB);
        },
        // a aa
        intersection(searchA, searchB){
            if(searchA.value.includes(searchB.value)) {
                return searchA;
            }
            if(searchB.value.includes(searchA.value)) {
                return searchB;
            }
            return QueryLogic.UNDEFINABLE;
        },
        difference(searchA, searchB){
            // if a is a subset
            if(searchA.value.includes(searchB.value)) {
                return QueryLogic.EMPTY;
            }
            // a is a superset
            if(searchB.value.includes(searchA.value)) {
                return QueryLogic.UNDEFINABLE;
            }
            // foo \ bar
            return QueryLogic.UNKNOWABLE;
        }
    });

    // Alternate comparisons
    /*QueryLogic.defineComparison(SearchableStringSet,SearchableStringSet,{
        isSubset(searchA, searchB){
            return searchA.value.includes(searchB.value);
        }
    });*/

    // The type specified doesn't do anything here.
    // Sometimes it might be used for creating the actual value on
    // a Todo. That's why it's only used for a reference ot the
    // actual set type.
    function SearchableString(){

    }


    SearchableString[Symbol.for("can.SetType")] = SearchableStringSet;

    var todoQueryLogic = new QueryLogic({
        keys: {
            name: SearchableString
        }
    });



    var res = todoQueryLogic.isSubset({
        filter: {name: "beat"}
    },{
        filter: {name: "eat"}
    });

    QUnit.equal(res, true, "is subset");

    res = todoQueryLogic.isSubset({
        filter: {name: "eat"}
    },{
        filter: {name: "beat"}
    });

    QUnit.equal(res, false, "not subset");

});
