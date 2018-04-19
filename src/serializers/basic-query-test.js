var QUnit = require("steal-qunit");
var makeBasicQueryConvert = require("./basic-query");
var canReflect = require("can-reflect");
var logicTypes = require("../types/and-or-not");
var is = require("../types/comparisons");
var makeMaybe = require("../types/make-maybe");

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


    QUnit.deepEqual(basicQuery.filter, new logicTypes.AndKeys({
        name: new logicTypes.AndKeys({first: new is.In(["justin"])})
    }), "adds nested ands");
});


QUnit.test("$or with the same types unify into maybe", function(){

    var MaybeSet = makeMaybe([null])

    var converter = makeBasicQueryConvert({
        identity: ["id"],
        keys: {
            age: canReflect.assignSymbols({},{"can.SetType": MaybeSet}),
            foo: String
        }
    });

    var query = {
        filter: {
            $or: [
                { foo: "bar", age: {$gt: 3}},
                { foo: "bar", age: null}
            ]
        }
    };

    var basicQuery = converter.hydrate(query);

    QUnit.deepEqual(basicQuery.filter, new logicTypes.AndKeys({
        foo: new is.In(["bar"]),
        age: new MaybeSet({
            range: new is.GreaterThan(3),
            enum: new is.In([null])
        })
    }));

    var res = converter.serializer.serialize(basicQuery);
    QUnit.deepEqual(res, {
        filter: {
            $or: [
                { foo: "bar", age: {$gt: 3}},
                { foo: "bar", age: null}
            ]
        }
    }, "serialized");
});

QUnit.test("auto-convert or schema into maybe type", function(){
    var MaybeNumber = canReflect.assignSymbols({},{
        "can.new": function(val){
            if (val == null) {
    			return val;
    		}
    		return +(val);
        },
        "can.getSchema": function(){
            return {
                type: "Or",
                values: [Number, undefined, null]
            };
        }
    });

    var converter = makeBasicQueryConvert({
        identity: ["id"],
        keys: {
            age: MaybeNumber,
            foo: String
        }
    });

    var query = {
        filter: {
            $or: [
                { foo: "bar", age: {$gt: "3"}},
                { foo: "bar", age: null}
            ]
        }
    };

    var basicQuery = converter.hydrate(query);

    /*QUnit.deepEqual(basicQuery.filter, new logicTypes.AndKeys({
        foo: new is.In(["bar"]),
        age: new MaybeSet({
            range: new is.GreaterThan(3),
            enum: new is.In([null])
        })
    }));*/

    var res = converter.serializer.serialize(basicQuery);

    QUnit.deepEqual(res, {
        filter: {
            $or: [
                { foo: "bar", age: {$gt: 3}},
                { foo: "bar", age: null}
            ]
        }
    }, "serialized");
});

QUnit.skip("nested properties within ors", function(){
    var query = {
        filter: {
            name: [{ first: "justin" }, { last: "meyer" }]
        }
    };

    var converter = makeBasicQueryConvert(EmptySchema);

    var basicQuery = converter.hydrate(query);

    QUnit.deepEqual(basicQuery.filter, new logicTypes.AndKeys({
        name: new logicTypes.AndKeys({first: new is.In(["justin"])})
    }), "adds nested ands");
});
