var QueryLogic = require("../can-query-logic");
var QUnit = require("steal-qunit");
var canReflect = require("can-reflect");

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

    canReflect.assignSymbols(SearchableStringSet.prototype,{
        // Returns if the name on a todo is actually a member of the set.
        "can.isMember": function(value){
            return value.includes(this.value);
        },
        "can.serialize": function(){
            return this.value;
        }
    });

    // Specify how to do the fundamental set comparisons.
    QueryLogic.defineComparison(SearchableStringSet,SearchableStringSet,{
        union(searchA, searchB){
            if(searchA.value.includes(searchB.value)) {
                return searchB;
            }
            if(searchB.value.includes(searchA.value)) {
                return searchA;
            }
            return new QueryLogic.ValuesOr([searchA, searchB]);
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
            return QueryLogic.UNDEFINABLE;
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

    var hydrated = todoQueryLogic.hydrate({
        filter: {name: "eat"}
    });

    QUnit.deepEqual(hydrated.filter, new QueryLogic.KeysAnd({
        name: new SearchableStringSet("eat")
    }), "hydrated right");

    res = todoQueryLogic.union({
        filter: {name: "eat"}
    },{
        filter: {name: "foo"}
    });

    QUnit.deepEqual(res, {
        filter: {
            name: ["eat","foo"]
        }
    });

    QUnit.ok(
        todoQueryLogic.isMember({
            filter: {name: "eat"}
        },{id: 1, name: "eat beans"}),
        "isMember true");

    QUnit.notOk(
        todoQueryLogic.isMember({
            filter: {name: "eat"}
        },{id: 1, name: "foo bar"}),
        "isMember false");

});

QUnit.test("value type", function(){



    function DateStringSet(dateStr){

        this.dateStr = dateStr;
    }

    DateStringSet.prototype.valueOf = function(){
        return new Date(this.dateStr).valueOf();
    };
    canReflect.assignSymbols(DateStringSet,{
        "can.serialize": function(){
            return this.dateStr;
        }
    });

    function DateString(){

    }

    canReflect.assignSymbols(DateString,{
        "can.SetType": DateStringSet
    });



    var queryLogic = new QueryLogic({
        keys: {
            date: DateString
        }
    });

    var oct20_1982 = new Date(1982,9,20),
        date90s = new Date(1990,0,1);

    // new And({
    //   date: new GT( new DateStringSet("string") )
    // })
    // The problem is that GT is going to test
    //    `new DateStringSet("10-20") > "10-20"
    // How do we indicate that these tests should use the underlying type "converter"?
    //  - seems like not a great idea to use the `this.value` type to wrap the property value.
    //  - Can't really call `isMember` b/c
    //  - could just pass a serialize / hydrate thing ..
    //
    var result = queryLogic.filterMembers({
        filter: {date: {$gt: oct20_1982.toString()}}
    },[
        {id: 1, date: new Date(1981,9,20).toString()},
        {id: 2, date: new Date(1982,9,20).toString()},
        {id: 3, date: new Date(1983,9,20).toString()},
        {id: 4, date: new Date(1984,9,20).toString()},
    ]);

    QUnit.deepEqual(
        result.map(function(item){ return item.id;}),
        [3,4],
        "filtered correctly");


    var union = queryLogic.union({
        filter: {date: [oct20_1982.toString()]}
    },{
        filter: {date: [date90s.toString()]}
    });

    QUnit.deepEqual(union,
        {
            filter: {date: {$in: [oct20_1982.toString(), date90s.toString()]}}
        }
    );

    var result = queryLogic.filterMembers({
        sort: "date"
    },[
        {id: 2, date: new Date(1982,9,20).toString()},
        {id: 1, date: new Date(1981,9,20).toString()},
        {id: 4, date: new Date(1984,9,20).toString()},
        {id: 3, date: new Date(1983,9,20).toString()}
    ]);

    var ids = result.map(function(item){ return item.id});
    QUnit.deepEqual(ids,[1,2,3,4], "sorted correctly");

    var index = queryLogic.index({
            sort: "date"
        },
        [
            {id: 1, date: new Date(2018,4,20).toString()}, // M
            {id: 2, date: new Date(2018,4,21).toString()}, // Tu
            {id: 3, date: new Date(2018,4,22).toString()}, // We
            {id: 4, date: new Date(2018,4,23).toString()}  // Thurs
        ],
        {id: 4, date: new Date(2018,4,24).toString()}); //F

    QUnit.equal(index, 4, "added at the end")
});
