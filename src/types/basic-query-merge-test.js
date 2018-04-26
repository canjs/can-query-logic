var BasicQuery = require("./basic-query");
var QUnit = require("steal-qunit");

QUnit.module("can-query-logic/types/basic-query merge");


var getId = function(d){ return d.id; };
var items = [
	{ id: 0, note: 'C', type: 'eh' },
	{ id: 1, note: 'D', type: 'critical' },
	{ id: 2, note: 'E', type: 'critical' },
	{ id: 3, note: 'F', type: 'eh' },
	{ id: 4, note: 'G', type: 'critical' },
	{ id: 5, note: 'A' },
	{ id: 6, note: 'B', type: 'critical' },
	{ id: 7, note: 'C', type: 'critical' }
];

var everything = new BasicQuery({});

QUnit.test("basics", function(){

    var fooBar = new BasicQuery({
        filter: new BasicQuery.KeysAnd({ foo: "bar" })
    });
    var res = everything.merge(fooBar,items, items.slice(0, 3), getId );
	deepEqual(res, items);
});

QUnit.test("unionMembers against ranged sets", function(){
    var a = new BasicQuery({
        page: new BasicQuery.RecordRange(10,13)
    });
    var b = new BasicQuery({
        page: new BasicQuery.RecordRange(10,13)
    });
    var union = a.merge(b,items.slice(0,4), items.slice(4,8), getId );

    a = new BasicQuery({
        page: new BasicQuery.RecordRange(14,17)
    });


    union = a.merge(b,items.slice(4,8),items.slice(0,4), getId );
	deepEqual(union, items, "disjoint after");

});

QUnit.test("unionMembers against overlapping ranged sets", function(){
    var a = new BasicQuery({
        page: new BasicQuery.RecordRange(10,13)
    });
    var b = new BasicQuery({
        page: new BasicQuery.RecordRange(13,17)
    });
    var union = a.merge(b,items.slice(0,5),items.slice(3,8), getId );

	deepEqual(union, items);

    // BREAK
    a = new BasicQuery({
        page: new BasicQuery.RecordRange(10,11)
    });
    b = new BasicQuery({
        page: new BasicQuery.RecordRange(11,17)
    });
    union = a.merge(b,
        items.slice(0,2),
        items.slice(1,8), getId );

	deepEqual(union, items);

    // BREAK

    a = new BasicQuery({
        page: new BasicQuery.RecordRange(10,11)
    });
    b = new BasicQuery({
        page: new BasicQuery.RecordRange(11,17)
    });
    union = b.merge(a,
        items.slice(1,8),
		items.slice(0,2), getId );

	deepEqual(union, items);
});

QUnit.test("unionMembers filters for uniqueness", function(){
	var aItems = items.filter(function(a) {
		return a.type === "critical";
	});
	var bItems = items.filter(function(b) {
		return b.note === "C";
	});
	var unionItems = [bItems[0]].concat(aItems); // bItems[1] is already in aItems

    var a = new BasicQuery({
        page: new BasicQuery.KeysAnd({type: "critical"})
    });
    var b = new BasicQuery({
        page: new BasicQuery.KeysAnd({note: "C"})
    });
    var union = a.merge(b,aItems, bItems, getId );
    deepEqual(union, unionItems);

    // BREAK
    var union = b.merge(a,bItems,aItems, getId );
	deepEqual(union, unionItems);

});
