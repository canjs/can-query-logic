var types = require("./and-or-not");
var QUnit = require("steal-qunit");
var set = require("../set");
var makeEnum = require("../types/make-enum");

QUnit.module("can-query-logic/and-or");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("AND intersection basics", function(){
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

    var AndObject = types.And;

    var isJustin = new AndObject({
        name: "Justin"
    });
    var is35 = new AndObject({
        age: 35
    });
    var is35OrJustin = set.union(is35, isJustin);

    QUnit.deepEqual(is35OrJustin,new types.Or([is35, isJustin]),"35 and justin");
});

QUnit.test("AND / OR / NOT union", function(){


    var isJustin = new types.And({name: "Justin"}),
        isNotJustin = new types.And({name: new types.Not("Justin")});

    QUnit.equal( set.union(isJustin,isNotJustin), set.UNIVERSAL, "{name: 'j'} U {name: NOT('j')}");

    var everything = new types.And({});

    QUnit.equal( set.union(isJustin,everything), set.UNIVERSAL, "{name: 'j'} U {}");

    var isJustinAnd21 = new types.And({name: "Justin", age: 22});

    QUnit.equal( set.union(isJustin,isJustinAnd21), isJustin, "super and subset");

    QUnit.equal( set.union(isJustinAnd21,isJustinAnd21), isJustinAnd21, "union with itself");
});

QUnit.test("AND / OR / NOT difference", function(){


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


    // CASE:
    //   {} \ {bar: IS_UNIVERSAL}
    result = set.difference(new types.And({foo: 2}), new types.And({foo: 2, bar : set.UNIVERSAL}));

    QUnit.deepEqual(result,set.EMPTY,
        'UNIVESAL: {foo:2} \ {foo:2, bar: IS_UNIVERSAL} -> set.EMPTY');



    // FUTURE CASES:
    // { color: ["r", "g"] }, {  color: "r", status: a } -> OR( {c: g}, {c:r, NOT: a} )
    // {color: [r, g]} \ {color: [r]} -> {color: [g]}
    // {color: [r, g], status: [a, c]} \ {color: [r], status: [a]} -> OR( {g X a}, {g X c}, {r X c} )
});

QUnit.test("AND / OR / NOT isSubset", function(){


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

QUnit.test("AND isMember", function(){

    var folderAnd35 = new types.And({ type: 'FOLDER', age: 35 });

    QUnit.ok( folderAnd35.isMember({type: 'FOLDER', age: 35}) );
    QUnit.ok( folderAnd35.isMember({type: 'FOLDER', age: 35, extra: "value"}) );
    QUnit.notOk( folderAnd35.isMember({type: 'FOLDER', age: 36}) );
    QUnit.notOk( folderAnd35.isMember({type: 'folder', age: 35}) );
    QUnit.notOk( folderAnd35.isMember({type: 'FOLDER'}) );
    QUnit.notOk( folderAnd35.isMember({age: 35}) );

});

QUnit.test("OR isMember", function(){

    var isFolder =  new types.And({ type: 'FOLDER'}),
        is35 = new types.And({  age: 35 }),
        isFolderOr35 = new types.Or([isFolder, is35]);

    QUnit.ok( isFolderOr35.isMember({type: 'FOLDER', age: 35}), "both" );
    QUnit.notOk( isFolderOr35.isMember({}), "empty" );
    QUnit.ok( isFolderOr35.isMember({type: 'FOLDER', age: 36}) );
    QUnit.ok( isFolderOr35.isMember({type: 'folder', age: 35}) );
    QUnit.notOk( isFolderOr35.isMember({type: 'folder', age: 36}) );
    QUnit.ok( isFolderOr35.isMember({type: 'FOLDER'}) );
    QUnit.ok( isFolderOr35.isMember({age: 35}) );

});

QUnit.test("And nested objects", function(){
    var res;

    var isNameFirstJustin = new types.And({ name: {first: "Justin"}});
    var isNameFirstJustin2 = new types.And({ name: {first: "Justin"}});
    res = set.isEqual(isNameFirstJustin, isNameFirstJustin2);
    QUnit.equal(res, true);

});



QUnit.module("can-query-logic/not");

// There is a need for "subset" and "superset"
// Might have "real numbers"
// But want even and odds and integers
// Can't "build up" to real with all those other combinations
QUnit.test("union basics", function(){



    QUnit.equal( set.union( new types.Not(1), 1), set.UNIVERSAL, "is univesal set");
});

QUnit.test("difference with universal", function(){

    // everything NOT 1, but not the universe
    QUnit.equal( set.difference( new types.Not(1), set.UNIVERSAL), set.EMPTY, "not 1 \\ univesal = 1");

    QUnit.deepEqual( set.difference( set.UNIVERSAL, 1), new types.Not(1), "1 \\ univesal = not 1");
});


QUnit.test("And with nested.properties", function(){

    QUnit.equal(
        set.isSubset(
            new types.And({
                "name.first": "Justin",
                "name.last": "Meyer"
            }),
            new types.And({
                "name.last": "Meyer"
            })
        ),
        true,
        "dot.ed properties work with subset"
    );

    QUnit.equal(
        new types.And({
            "name.first": "Justin",
            "name.last": "Meyer"
        }).isMember({name: {first: "Justin", last: "Meyer"}}),
        true,
        "dot.ed properties isMember match"
    );

    QUnit.equal(
        new types.And({
            "name.first": "Justin",
            "name.last": "Meyer"
        }).isMember({name: {first: "Ramiya", last: "Meyer"}}),
        false,
        "dot.ed properties isMember dont match"
    );

});


QUnit.test("And with nested ands", function(){



    QUnit.equal(
        set.isSubset(
            new types.And({
                name: new types.And({
                    first: "Justin",
                    last: "Meyer"
                })
            }),
            new types.And({
                name: new types.And({
                    last: "Meyer"
                })
            })
        ),
        true,
        "properties work with subset"
    );

    QUnit.deepEqual(
        set.intersection(
            new types.And({
                name: new types.And({
                    first: "Justin"
                })
            }),
            new types.And({
                name: new types.And({
                    last: "Meyer"
                })
            })
        ),
        new types.And({
            name: new types.And({
                first: "Justin",
                last: "Meyer"
            })
        }),
        "properties work with intersection"
    );

    QUnit.equal(
        new types.And({
            name: new types.And({
                first: "Justin",
                last: "Meyer"
            })
        }).isMember({name: {first: "Justin", last: "Meyer"}}),
        true,
        "dot.ed properties isMember match"
    );

    QUnit.equal(
        new types.And({
            name: new types.And({
                first: "Justin",
                last: "Meyer"
            })
        }).isMember({name: {first: "Ramiya", last: "Meyer"}}),
        false,
        "dot.ed properties isMember dont match"
    );

});
