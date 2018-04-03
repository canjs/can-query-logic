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
