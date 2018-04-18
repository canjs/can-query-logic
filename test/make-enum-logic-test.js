var QueryLogic = require("can-query-logic");
var canReflect = require("can-reflect");
var makeEnum = require("../src/types/make-enum");


QUnit.module("can-query-logic with makeEnum");

function Color(){}
makeEnum(Color, ["red","green","blue"]);

var TODO = canReflect.assignSymbols({},{
    "can.schema": function(){
        return {
            kind: "record",
            identity: ["id"],
            keys: {
                id: Number,
                points: Number,
                status: Color,
                complete: Boolean,
                name: String
            }
        };
    }
});

var algebra = new QueryLogic(TODO);

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


QUnit.test("automatic enum", function(){

    var MaybeBoolean = canReflect.assignSymbols({},{
    	"can.new": function(val){
    		if(val == null) {
    			return val;
    		}
    		if (val === 'false' || val === '0' || !val) {
    			return false;
    		}
    		return true;
    	},
    	"can.getSchema": function(){
    		return {
    			type: "Or",
    			values: [true, false, undefined, null]
    		};
    	}
    });

    var queryLogic = new QueryLogic({
        identity: ["id"],
        keys: {
            complete: MaybeBoolean
        }
    });
    var res;

    res = queryLogic.difference({},{
        filter: {
            complete: true
        }
    });
    
    QUnit.deepEqual(res,{
        filter: {
            complete: [false, undefined, null]
        }
    }, "enum works");
});
