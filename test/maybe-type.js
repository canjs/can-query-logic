var QueryLogic = require("../can-query-logic");
var QUnit = require("steal-qunit");
var canReflect = require("can-reflect");
var makeMaybe = require("../src/types/maybe");

QUnit.module("can-query-logic with maybe type");

QUnit.test("basics", function(){
    // Goal here is so the type doesn't have to know about `can-query-logic`,
    // but when passed to can-query-logic, it knows what to do.
    //

    var type = canReflect.assignSymbols({
        "can.new": function(val){
            if (val == null) {
    			return val;
    		}
    		return +(val);
        }
    })

    var res;


    var MaybeNumberSet = function(value){
        this.value = value;
    };
    MaybeNumberSet.prototype.valueOf = function(){
        return +this.value;
    };
    canReflect.assignSymbols(MaybeNumberSet, {
        "can.maybe": [null]
    });

    var MaybeNumber = function(){};

    canReflect.assignSymbols(MaybeNumber, {
        "can.SetType": MaybeNumberSet
    });

    var todoQueryLogic = new QueryLogic({
        keys: {
            age: MaybeNumber
        }
    });

    res = todoQueryLogic.difference(
        {},
        {filter: {age: {$gt: 5}}});

    QUnit.deepEqual(res,
        {filter: {age: {$or: [{$lte: 5}, null] } }});

});
