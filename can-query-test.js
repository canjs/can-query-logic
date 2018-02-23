require("./src/comparators/enum-test");
require("./src/comparators/not-test");
require("./src/comparators/and-or-test");
require("./src/types/make-real-number-range-inclusive-test");
require("./src/types/basic-query-sorting-test");

var QUnit = require("steal-qunit");
var Query = require("can-query");

/*
QUnit.module("can-query");

QUnit.test("building a query", function(){


    var isJustinAnd35 = new And({name: "Justin", age: 35});
    var algebra = new query.Algebra({ .... });

    var q1 = new algebra.Query({
        filter: isJustinAnd35,
        page: new RealNumberRange(1,5),
        sort:
    })
})

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

    var query = new Query({
        logic: {
            And: And,
            Or: Or,
            Not: Not
        },
        schema: {

        }
    });
    new Query({
    filter: {foo: []}[{},{}]
})

    var query = {
        filter: {color: ["red"], complete: true},
        page: {},
        sort: {

        }
    }
}
    query.
});
*/
