var QUnit = require("steal-qunit");
var comparisons = require("./comparisons");
var canReflect = require("can-reflect");

QUnit.module("can-query-logic/serializers/comparisons");

QUnit.test("hydrate and serialize", function(){
    var Type = function(value){
        this.value = value;
    };

    canReflect.assignSymbols(Type.prototype,{
		"can.serialize": function(){
			return this.value;
		}
	})

    var hydrated = comparisons.hydrate({$in: [1,2]}, function(value){
        return new Type(value);
    });

    QUnit.deepEqual(hydrated.values, [
        new Type(1),
        new Type(2)
    ], "hydrated");

    var serialized = comparisons.serializer.serialize(hydrated);

    QUnit.deepEqual(serialized,{
        $in: [1,2]
    }, "serialized");
});
