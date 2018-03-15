require("./src/comparators/enum-test");
require("./src/comparators/not-test");
require("./src/comparators/and-or-test");
require("./src/types/make-real-number-range-inclusive-test");
require("./src/types/basic-query-sorting-test");
require("./src/types/comparisons-test");

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
