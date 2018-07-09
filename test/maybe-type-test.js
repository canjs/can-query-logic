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

    var query = todoQueryLogic.hydrate({filter: {age: 21}});

    var serialized = todoQueryLogic.serialize(query);
    QUnit.deepEqual( serialized, {filter: {age: 21}}, "can serialize back to what was provided" );

    res = todoQueryLogic.difference({},{
        filter: {
            age: {
                $gt: 3,
                $lt: 7
            }
        }
    });

    QUnit.deepEqual(res.filter,
        {$or: [
            {age: {$gte: 7} },
            {age: {$lte: 3} },
            {age: {$in: [undefined, null]}}
        ]});

});


QUnit.test("MaybeDate", function(){
    // Goal here is so the type doesn't have to know about `can-query-logic`,
    // but when passed to can-query-logic, it knows what to do.
    function toDate(str) {
        var type = typeof str;
        if (type === 'string') {
            str = Date.parse(str);
            return isNaN(str) ? null : new Date(str);
        } else if (type === 'number') {
            return new Date(str);
        } else {
            return str;
        }
    }

    function DateStringSet(dateStr){
        this.setValue = dateStr;
        var date = toDate(dateStr);
        this.value = date == null ? date : date.getTime();
    }

    DateStringSet.prototype.valueOf = function(){
        return this.value;
    };
    canReflect.assignSymbols(DateStringSet.prototype,{
        "can.serialize": function(){
            return this.setValue;
        }
    });

    var MaybeDate = canReflect.assignSymbols({},{
        "can.new": toDate,
        "can.getSchema": function(){
            return {
                type: "Or",
                values: [Date, undefined, null]
            };
        },
        "can.ComparisonSetType": DateStringSet
    });

    var res;

    var todoQueryLogic = new QueryLogic({
        keys: {
            due: MaybeDate
        }
    });

    var date1982_10_20 = new Date(1982,9,20).toString();

    res = todoQueryLogic.difference(
        {},
        {filter: {due: {$gt: date1982_10_20}}});

    QUnit.deepEqual(res.filter,
        {$or: [
            {due: {$lte: date1982_10_20} },
            {due: {$in: [undefined, null]}}
        ]},
        "difference works");

    var gt1982 = {filter: {due: {$gt: date1982_10_20}}};

    QUnit.ok( todoQueryLogic.isMember(gt1982,{
        id: 0,
        due: new Date(2000,0,1)
    }), "works with a date object");

    QUnit.ok( todoQueryLogic.isMember(gt1982,{
        id: 0,
        due: new Date(2000,0,1).toString()
    }), "works with a string date");

    QUnit.ok( todoQueryLogic.isMember(gt1982,{
        id: 0,
        due: new Date(2000,0,1).getTime()
    }), "works with a integer date");

    QUnit.notOk( todoQueryLogic.isMember(gt1982,{
        id: 0,
        due: new Date(1970,0,1).getTime()
    }), "doesn't fail if falsey");

    QUnit.notOk( todoQueryLogic.isMember(gt1982,{
        id: 0,
        due: null
    }), "doesn't fail if falsey");

    QUnit.ok( todoQueryLogic.isMember({filter: {due: {$in: [null,undefined]}}},{
        id: 0,
        due: null
    }), "works if using in");

});
