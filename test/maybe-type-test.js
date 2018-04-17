var QueryLogic = require("../can-query-logic");
var QUnit = require("steal-qunit");
var canReflect = require("can-reflect");

QUnit.module("can-query-logic with maybe type");

QUnit.test("basics", function(){
    // Goal here is so the type doesn't have to know about `can-query-logic`,
    // but when passed to can-query-logic, it knows what to do.
    //

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

    var res;

    var todoQueryLogic = new QueryLogic({
        keys: {
            age: MaybeNumber
        }
    });

    res = todoQueryLogic.difference(
        {},
        {filter: {age: {$gt: 5}}});

    QUnit.deepEqual(res.filter,
        {$or: [
            {age: {$lte: 5} },
            {age: {$in: [undefined, null]}}
        ]},
        "difference works");

});
