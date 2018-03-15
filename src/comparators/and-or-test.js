var QUnit = require("steal-qunit");
var set = require("../set");
var addAddOrComparators = require("./and-or");
var addNotComparitor = require("./not");
var makeEnum = require("../types/make-enum");

function justAnd(){
    function And(values) {
        this.values = values;
    }
    addAddOrComparators(And);
    return {
        And: And
    };
}

function AndOrNot(){
    function And(values) {
        this.values = values;
    }
    function Or(values) {
        this.values = values;
    }
    function Not(value) {
        this.value = value;
    }
    addNotComparitor(Not);
    addAddOrComparators(And, Or, Not);
    return {
        And: And,
        Or: Or,
        Not: Not
    };
}


QUnit.module("can-query/and-or");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("AND intersection basics", function(){
    var types = AndOrNot();
    var AndObject = types.And;

    var isJustin = new AndObject({
        name: "Justin"
    });
    var is35 = new AndObject({
        age: 35
    });

    var is35AndJustin = set.intersection(is35, isJustin);
    QUnit.deepEqual(is35AndJustin.values,{
        name: "Justin",
        age: 35
    },"35 and justin");

    var isJustinAnd35 = set.intersection(isJustin, is35);
    QUnit.deepEqual(isJustinAnd35.values,{
        name: "Justin",
        age: 35
    },"justin and 34");

    var is34 = new AndObject({
        age: 34
    });
    is35 = new AndObject({
        age: 35
    });

    var is34and35 = set.intersection(is35, is34);
    QUnit.equal(is34and35,set.EMPTY,"can't be 34 and 35");

});

QUnit.test("AND union basics", function(){
    var types = justAnd();
    var AndObject = types.And;

    var isJustin = new AndObject({
        name: "Justin"
    });
    var is35 = new AndObject({
        age: 35
    });
    var is35OrJustin = set.union(is35, isJustin);
    QUnit.deepEqual(is35OrJustin,set.UNDEFINABLE,"35 and justin");
});

QUnit.test("AND / OR / NOT union", function(){
    var types = AndOrNot();

    var isJustin = new types.And({name: "Justin"}),
        isNotJustin = new types.And({name: new types.Not("Justin")});

    QUnit.equal( set.union(isJustin,isNotJustin), set.UNIVERSAL, "{name: 'j'} U {name: NOT('j')}");
});

QUnit.test("AND / OR / NOT difference", function(){

    var types = AndOrNot();

    // CASE: prop in A not in B
    //  `{name: "Justin"} \ {age: 35} -> {name: "justin", age: NOT(35)}`
    var is35 = new types.And({age: 35}),
        isJustin = new types.And({name: "Justin"}),
        isJustinAnd35 = new types.And({name: "Justin", age: 35}),
        isJustinAndNot35 = new types.And({
            name: "Justin",
            age: new types.Not(35)
        }),
        result;

    result = set.difference(isJustin, is35);

    // CASE: overlaping sets
    QUnit.deepEqual(result, isJustinAndNot35, 'OVERLAP: {name: "Justin"} \\ {age: 35} -> {name: "justin", age: NOT(35)}');

    // CASE: same set
    QUnit.deepEqual( set.difference(is35, is35), set.EMPTY, 'SAME SET: {age: 35} \\ {age: 35} -> EMPTY');

    // CASE: subset
    QUnit.deepEqual( set.difference(isJustinAnd35, is35), set.EMPTY,
        'SUPERSET: {age: 35, name: "Justin"} \\ {age: 35} -> EMPTY');

    // CASE: superset
    QUnit.deepEqual( set.difference(isJustin, isJustinAnd35), isJustinAndNot35,
        '{name: "Justin"} \\ {age: 35, name: "Justin"} -> {name: "justin", age: NOT(35)}');


    // CASE: DISJOINT - same prop different values
    //  `{age: 35} \ {age: 32} -> {age: 35}`
    result = set.difference(is35, new types.And({age: 32}));

    QUnit.deepEqual(result, new types.And({age: 35}),
        'DISJOINT: {age: 35} \\ {age: 32} -> {age: 35}');


    // CASE: DISJOINT - completely disjoint - no intersection of values
    //  `{age: 34, name: "Justin"} \ {age: 35}  -> {age: 34, name: "Justin"}`
    result = set.difference(new types.And({age: 34, name: "Justin"}), is35);

    QUnit.deepEqual(result, new types.And({age: 34, name: "Justin"}),
        'DISJOINT: {age: 34, name: "Justin"} \\ {age: 35} -> {age: 34, name: "Justin"}');

    // CASE: DISJOINT - can't peform -> double NOT of props
    // {foo: "bar"} \ {name: "Justin", age: 35}  -> {foo: "bar", NOT(And(name: "J", age: 35)) }
    // this kind of property based and can not be done.
    result = set.difference(
        new types.And({foo: "bar"}),
        isJustinAnd35
        );
    QUnit.deepEqual(result,set.UNDEFINABLE,
        'DISJOINT: {foo: "bar"} \\ {name: "Justin", age: 35} -> UNDEFINABLE');

    // CASE:
    //  {} \ {name: "Justin", age: 35} -> OR[ AND(name: NOT("Justin")), AND(age: NOT(35)) ]

    result = set.difference(set.UNIVERSAL, isJustinAnd35);
    var compare =  new types.Or([
        new types.And({name: new types.Not("Justin")}),
        new types.And({age: new types.Not(35)})
    ]);

    QUnit.deepEqual(result,compare,
        'UNIVESAL: {} \\ {name: "Justin", age: 35} -> OR[ AND(name: NOT("Justin")), AND(age: NOT(35)) ]');


    // FUTURE CASES:
    // {color: [r, g]} \ {color: [r]} -> {color: [g]}
    // {color: [r, g], status: [a, c]} \ {color: [r], status: [a]} -> OR( {g X a}, {g X c}, {r X c} )
});

QUnit.test("AND / OR / NOT isSubset", function(){

    var types = AndOrNot();

    var res;
	res = set.isSubset( new types.And({ type: 'FOLDER' }), new types.And({ type: 'FOLDER' }) );
	QUnit.ok(res, 'equal sets');

	res = set.isSubset( new types.And({ type: 'FOLDER', parentId: 5 }), new types.And({ type: 'FOLDER' }));
	QUnit.ok(res, 'sub set');

	res = set.isSubset( new types.And({ type: 'FOLDER' }), new types.And({ type: 'FOLDER', parentId: 5 }) );
	QUnit.notOk(res, 'wrong way');

	res = set.isSubset(
		new types.And({ type: 'FOLDER', parentId: 7 }),
		new types.And({ type: 'FOLDER', parentId: 5 })
	);
	QUnit.ok(!res, 'different values');

});

QUnit.test("union AND with ENUM", function(){
    var types = AndOrNot();

    function Color(){}

    var ColorSet = makeEnum(Color, ["red","green","blue"]);

    var qA = new types.And({ type: 'FOLDER', status: new ColorSet("red") }),
        qB = new types.And({ type: 'FOLDER', status: new ColorSet("green") });


    var res = set.union(qA, qB);

    QUnit.deepEqual(res,
        new types.And({
            type: 'FOLDER',
            status: new ColorSet(["red","green"])
        }),
        "able to do a union"
    );
});
