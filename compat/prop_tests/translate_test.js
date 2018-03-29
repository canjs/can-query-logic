require("steal-qunit");
var querySet = require("../../src/set");

var set = require('../compat');

var ignoreProp = function(){ return true; };

QUnit.module("can-set set.Translate - nested where");

QUnit.test('set.equal', function(){

	var algebra = new set.Algebra(
		new set.Translate("where","$where"),
        set.props.ignore("count")
	);

	var res;

	res = algebra.equal(
		{$where: {type: 'FOLDER' } },
		{$where: { type: 'FOLDER', count: 5 }}
	);
	ok(res, 'count ignored');

	res = algebra.equal(
		{$where: { type: 'FOLDER' }},
		{$where: { type: 'FOLDER' }}
	);

	ok(res, 'folder case ignored');

});


QUnit.test('set.subset', function(){

	var algebra = new set.Algebra(
		new set.Translate("where","$where"),
        set.props.ignore("foo"),
        set.props.ignore("bar"),
        set.props.ignore("kind"),
        set.props.ignore("count")
	);

	var res;

	res = algebra.subset({$where:{ type: 'FOLDER' }}, {$where:{ type: 'FOLDER' }});
	ok(res, 'equal sets');

	res = algebra.subset({$where:{ type: 'FOLDER', parentId: 5 }}, {$where:{ type: 'FOLDER' }});
	ok(res, 'sub set');

	res = algebra.subset({$where:{ type: 'FOLDER' }}, {$where:{ type: 'FOLDER', parentId: 5 }});
	ok(!res, 'wrong way');

	res = algebra.subset(
		{$where:{ type: 'FOLDER', parentId: 7 }},
		{$where:{ type: 'FOLDER', parentId: 5 }}
	);
	ok(!res, 'different values');

	res = algebra.subset(
		{$where:{ type: 'FOLDER', count: 5 }},
		{$where:{ type: 'FOLDER' }}
	);
	ok(res, 'count ignored');

	res = algebra.subset(
		{$where:{ type: 'FOLDER', category: 'tree' }},
		{$where:{ type: 'FOLDER', foo: true, bar: true }}
	);
	ok(res, 'understands a subset');

	res = algebra.subset(
		{$where:{ type: 'FOLDER', foo: true, bar: true }},
		{$where:{ type: 'FOLDER', kind: 'tree' }}
	);
	ok(res,	'ignores nulls');

});

test('set.properSubset', function(){
	var algebra = new set.Algebra(
		new set.Translate("where","$where")
	);

	equal( algebra.properSubset( {$where:{foo: "bar"}}, {$where:{}}), true );
	equal( algebra.properSubset({$where:{}},{$where:{}}), false );
	equal( algebra.properSubset({$where:{}},{$where:{foo: "bar"}}), false );
});


test('set.difference', function(){

	var algebra = new set.Algebra(
		new set.Translate("where","$where")
	);

	var res = algebra.difference({$where:{}}, {$where:{ completed: true }});
	equal(res, querySet.UNDEFINABLE, "diff should be true");


	res = algebra.difference({$where:{ completed: true }}, {$where:{ completed: true }});
	equal(res, querySet.EMPTY);

	res = algebra.difference({$where:{ completed: true }}, {$where:{}});
	equal(res,  querySet.EMPTY);

	res = algebra.difference({$where:{ completed: true }}, {$where:{ userId: 5 }});
	equal(res, querySet.UNDEFINABLE); // TODO: probably should be undefined

});



test('set.union', function(){

	var algebra = new set.Algebra( new set.Translate("where","$where") );

	// set / subset
	var res = algebra.union({$where:{}}, {$where:{ completed: true }});
	deepEqual(res , {$where:{}}, "set / subset");

	res = algebra.union({$where:{ completed: true }}, {$where:{}});
	deepEqual(res , {$where:{}}, "subset / set");

	res = algebra.union({$where:{foo: "bar"}},{$where:{foo: "bar"}});
	deepEqual(res, {$where:{foo: "bar"}}, "equal");

	res = algebra.union({$where:{foo: "bar"}},{$where:{foo: "zed"}});
	deepEqual(res, {$where:{foo: ["bar","zed"]}}, "values not equal");

	res = algebra.union({$where:{foo: "bar"}},{$where:{name: "A"}});
	deepEqual(res,querySet.UNDEFINABLE, "values not equal");
});

test('set.union Array', function(){
	var algebra = new set.Algebra( new set.Translate("where","$where") );

	// set / subset
	var res = algebra.union({$where:{foo: ["a","b"]}}, {$where:{ foo: ["a","c"] }});
	deepEqual(res , {$where:{foo: ["a","b","c"]}}, "set / subset");

});



test('set.intersection', function(){
	var algebra = new set.Algebra(
		new set.Translate("where","$where")), res;

	res = algebra.intersection({$where:{}}, {$where:{ completed: true }});
	deepEqual(res , {$where:{ completed: true }}, "set / subset");

	res = algebra.intersection({$where:{ completed: true }}, {$where:{}});
	deepEqual(res , {$where:{ completed: true }}, "subset / set");

	res = algebra.intersection({$where:{foo: "bar"}},{$where:{foo: "bar"}});
	deepEqual(res, {$where:{foo: "bar"}}, "equal");

	res = algebra.intersection({$where:{foo: "bar"}},{$where:{foo: "zed"}});
	deepEqual(res,querySet.EMPTY,  "values not equal");

	res = algebra.intersection({$where:{foo: 'bar'}},{$where:{completed: true}});
	deepEqual(res, {$where:{foo: 'bar', completed: true}}, 'intersection should combine definitions');
});


test('set.intersection Array', function(){

	var algebra = new set.Algebra(
		new set.Translate("where","$where"));

	// set / subset
	var res = algebra.intersection({$where:{foo: ["a","b"]}}, {$where:{ foo: ["a","c"] }});
	deepEqual(res , {$where:{foo: "a"}}, "intersection");

});


test('set.has', function(){

	var algebra = new set.Algebra(
		new set.Translate("where","$where"),
        set.props.ignore("count"),
        set.props.ignore("foo"),
        set.props.ignore("bar"),
        set.props.ignore("kind")
	);

	ok( algebra.has({$where: {someId: 5}}, {someId: 5, name: "foo"}), 'contains');

	var res;

	res = algebra.has({$where:{ type: 'FOLDER' }}, { type: 'FOLDER' });
	ok(res, 'equal sets');

	res = algebra.has({$where:{ type: 'FOLDER', parentId: 5 }}, { type: 'FOLDER' });
	equal(res, false, 'doesnt match');

	res = algebra.has({$where:{ type: 'FOLDER' }}, { type: 'FOLDER', parentId: 5 });
	ok(true, 'is a subset');

	res = algebra.has(
		{$where:{ type: 'FOLDER', parentId: 7 }},
		{ type: 'FOLDER', parentId: 5 }
	);
	ok(!res, 'different values');

	res = algebra.has(
		{$where:{ type: 'FOLDER', count: 5 }},
		{ type: 'FOLDER' },
		{ count: ignoreProp }
	);
	ok(res, 'count ignored');

	res = algebra.has(
		{$where:{ type: 'FOLDER', kind: 'tree' }},
		{ type: 'FOLDER', foo: true, bar: true }
	);
	ok(res, 'understands a subset');

	res = algebra.has(
		{$where:{ type: 'FOLDER', foo: true, bar: true }},
		{ type: 'FOLDER', kind: 'tree' }
	);
	ok(res,	'ignores nulls');
});
