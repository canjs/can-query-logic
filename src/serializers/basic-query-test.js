var QUnit = require("steal-qunit");
var makeBasicQueryConvert = require("./basic-query");
var canReflect = require("can-reflect");

QUnit.module("can-query/serializers/basic-query");

var EmptySchema = canReflect.assignSymbols({},{
    "can.schema": function(){
        return {
            kind: "record",
            identity: ["id"]
        };
    }
});


QUnit.test("basics", function(){
    var query = {
        filter: {foo: "bar"}
    };

    var converter = makeBasicQueryConvert(EmptySchema)

    var basicQuery = converter.hydrate(query);

    var returnedQuery = converter.serializer.serialize(basicQuery);

    QUnit.deepEqual(returnedQuery, query, "got back what we give");
});
