require("./src/comparators/enum-test");
require("./src/comparators/not-test");
require("./src/comparators/and-or-test");
require("./src/types/make-real-number-range-inclusive-test");
require("./src/types/comparisons-test");
require("./src/types/basic-query-sorting-test");
require("./src/types/basic-query-filter-from-test");
require("./src/types/basic-query-merge-test");
require("./src/serializers/basic-query-test");

var QUnit = require("steal-qunit");
var Query = require("can-query");
var canReflect = require("can-reflect");
var makeEnum = require("./src/types/make-enum");


function Color(){}
makeEnum(Color, ["red","green","blue"]);

// var Todo = DefineMap.extend({
//     id: {identity: true, type: "number"},
//     status: Colors,
//     complete: "boolean",
//     name: String
// });

// union (Number|String)
// application Array<String> Object<string, number>
// record {foo: String}
var TODO = canReflect.assignSymbols({},{
    "can.schema": function(){
        return {
            kind: "record",
            identity: ["id"],
            properties: {
                id: Number,
                points: Number,
                status: Color,
                complete: Boolean,
                name: String
            }
        };
    }
});

var algebra = new Query(TODO);


QUnit.module("can-query");

QUnit.test("union - enum", function(){

    var unionResult = algebra.union({
        filter: {
            name: "Justin",
            status: "red"
        }
    },{
        filter: {
            name: "Justin",
            status: "green"
        }
    });

    QUnit.deepEqual(unionResult, {
        filter: {
            name: "Justin",
            status: ["red","green"]
        }
    });
});

QUnit.test("union without enum", function(){
    var unionResult = algebra.union({
        filter: {
            name: "Ramiya"
        }
    },{
        filter: {
            name: "Bohdi"
        }
    });

    QUnit.deepEqual(unionResult, {
        filter: {
            name: {$in: ["Ramiya", "Bohdi"]},
        }
    });
});

QUnit.test("difference without enum", function(){
    var differenceResult = algebra.difference({
        filter: {
            name: {$in: ["Ramiya", "Bohdi"]}
        }
    },{
        filter: {
            name: "Bohdi"
        }
    });

    QUnit.deepEqual(differenceResult, {
        filter: {
            name: "Ramiya",
        }
    });
});

QUnit.test("subset without enum", function(){
    var subsetResult = algebra.subset({
        filter: {
            name: "Bohdi"
        }
    },{
        filter: {
            name: {$in: ["Ramiya", "Bohdi"]}
        }
    });

    QUnit.deepEqual(subsetResult,true);
});

QUnit.test("has without enum", function(){
    var hasResult = algebra.has({
        filter: {
            name: "Bohdi"
        }
    },{
        name: "Bohdi"
    });

    QUnit.deepEqual(hasResult,true);
});

QUnit.test("getSubset basics", function(){
    var subset = algebra.getSubset({
        filter: {
            name: {$in: ["Bohdi","Ramiya"]}
        }
    },{}, [
        {name: "Bohdi"},
        {name: "Ramiya"},
        {name: "Payal"},
        {name: "Justin"}
    ]);

    QUnit.deepEqual(subset,[
        {name: "Bohdi"},
        {name: "Ramiya"}
    ]);
});


QUnit.test("getUnion basics", function(){
    var union = algebra.getUnion({
        filter: {
            name: "Bohdi"
        }
    },{
        filter: {
            name: "Ramiya"
        }
    }, [
        {name: "Bohdi", id: 1},
    ],[
        {name: "Ramiya", id: 2},
    ]);

    QUnit.deepEqual(union,[
        {name: "Bohdi", id: 1},
        {name: "Ramiya", id: 2}
    ]);
});

QUnit.test("count basics", function(){

    QUnit.equal(algebra.count({}), Infinity);
    QUnit.equal(algebra.count({page: {start: 1, end: 2}}), 2);


});

QUnit.test('index basics', function(){

	var index = algebra.index(
		{sort: "name"},
		[{id: 1, name:"g"}, {id: 2, name:"j"}, {id: 3, name:"m"}, {id: 4, name:"s"}],
		{name: "k"});
	equal(index, 2);

    index = algebra.index(
		{},
		[{id: 1, name:"g"}, {id: 2, name:"j"}, {id: 3, name:"m"}, {id: 4, name:"s"}],
		{id: 0, name: "k"});

	equal(index, 0);


	index = algebra.index(
		{},
		[{id: 1, name:"g"}, {id: 2, name:"j"}, {id: 3, name:"m"}, {id: 4, name:"s"}],
		{name: "k"});

	equal(index, undefined, "no value if no id");
    

	//var algebra = new set.Algebra(set.props.id("id"));


});

/*

QUnit.test("union - MustBeNumber", function(){

    var unionResult = algebra.union({
        filter: {
            points: {$gt: 5}
        }
    },{
        filter: {
            points: {$gt: 3}
        }
    });

    QUnit.deepEqual(unionResult, {
        filter: {
            points: {$gt: 3}
        }
    });
});

QUnit.test("query basics", function(){

    // count(set, member)
    // has(set, member)
    //
    //
    // getSubset(a,b, bData) //-> both sets are needed if pagination is being performed
    // getUnion(a,b, aItems, bItems)
    //
    //
    // id(member)
    // index(set, items, item) //-> really about sort
    //
    // query.index()
    //
    //
    // set.union()
    // set.member()
    //
    // properSubset


});*/
