var QUnit = require("steal-qunit");
var makeBasicQueryConvert = require("./basic-query");
var canReflect = require("can-reflect");
var logicTypes = require("../types/and-or-not");
var comparisonTypes = require("../types/comparisons");

QUnit.module("can-query-logic/serializers/basic-query");

var EmptySchema = {
    kind: "record",
    identity: ["id"],
    keys: {}
};




QUnit.test("basics", function(){
    var query = {
        filter: {foo: "bar"}
    };

    var converter = makeBasicQueryConvert(EmptySchema);

    var basicQuery = converter.hydrate(query);

    var returnedQuery = converter.serializer.serialize(basicQuery);

    QUnit.deepEqual(returnedQuery, query, "got back what we give");
});

QUnit.test("nested properties", function(){
    var query = {
        filter: {
            name: {
                first: "justin"
            }
        }
    };

    var converter = makeBasicQueryConvert(EmptySchema);

    var basicQuery = converter.hydrate(query);


    QUnit.deepEqual(basicQuery.filter, new logicTypes.And({
        name: new logicTypes.And({first: new comparisonTypes.In(["justin"])})
    }), "adds nested ands");
});

QUnit.skip("nested properties within ors", function(){
    var query = {
        filter: {
            name: [{ first: "justin" }, { last: "meyer" }]
        }
    };

    var converter = makeBasicQueryConvert(EmptySchema);

    var basicQuery = converter.hydrate(query);

    debugger;
    QUnit.deepEqual(basicQuery.filter, new logicTypes.And({
        name: new logicTypes.And({first: new comparisonTypes.In(["justin"])})
    }), "adds nested ands");
});
