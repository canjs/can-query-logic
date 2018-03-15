var BasicQuery = require("./basic-query");
var QUnit = require("steal-qunit");
var set = require("../set");
var assign = require("can-assign");

QUnit.module("can-query/types/basic-query sorting");

function legacyToQuery(set) {
    var copy = assign({}, set);

    var page = new BasicQuery.RecordRange(copy.start || 0, copy.end || Infinity);

    delete copy.start;
    delete copy.end;

    return new BasicQuery({
        page: page,
        filter: Object.keys(copy).length ? new BasicQuery.And(copy) : set.UNIVERSAL
    });
}
function queryToLegacy(query) {
    var legacy = {};
    if(query.page) {
        if( set.isEqual( query.page, set.UNIVERSAL) ) {

        } else {
            legacy.start = query.page.start;
            legacy.end = query.page.end;
        }

    }
    return legacy;
}

function legacyIsEqual(setA, setB) {
    var qA = legacyToQuery(setA),
        qB = legacyToQuery(setB);
    return set.isEqual( qA , qB );
}

function legacyDifference(setA, setB) {
    var qA = legacyToQuery(setA),
        qB = legacyToQuery(setB);
    return queryToLegacy( set.difference( qA , qB ) );
}

function legacyIntersection(setA, setB) {
    var qA = legacyToQuery(setA),
        qB = legacyToQuery(setB);
    return queryToLegacy( set.intersection( qA , qB ) );
}

function legacyUnion(setA, setB) {
    var qA = legacyToQuery(setA),
        qB = legacyToQuery(setB);
    return queryToLegacy( set.union( qA , qB ) );
}

function legacySubset(setA, setB) {
    var qA = legacyToQuery(setA),
        qB = legacyToQuery(setB);
    return set.isSubset( qA , qB );
}

// =============================================
// The following tests are taken from can-setB
// =============================================

test('rangeInclusive legacyDifference', function() {
	/*
	 * X = [A0, ..., A99]
	 * Y = [A50, ..., A101]
	 *
	 * X / Y = [A0, ..., A49]
	 */
	var res = legacyDifference({ start: 0, end: 99 }, { start: 50, end: 101 });
	deepEqual(res, { start: 0, end: 49 }, "got a diff");

	/*
	 * let:
	 *   i be the start of set Y
	 *   k be the end of set Y
	 *   0 be the first possible element in X (-infinity)
	 *   n be the last possible element in X (infinity)
	 *
	 * X => universal set
	 * Y = [Ai, ..., Ak]
	 *
	 * X / Y = [A0, ..., A(i-1), Ak, ..., An]
	 * 	more broadly
	 * X / Y = the set of all things not in Y
	 */
	res = legacyDifference({}, { start: 0, end: 10 });
	deepEqual(res, {start: 11, end: Infinity}, 'universal set');

	/*
	 * X = [A0, ..., A49]
	 * Y = [A50, ..., A101]
	 *
	 * X / Y = X
	 */
	res = legacyDifference({ start: 0, end: 49 }, { start: 50, end: 101 });
	deepEqual(res, { start: 0, end: 49 }, "side by side");

	/*
	 * X = [A0, ..., A49]
	 * Y = [A0, ..., A20]
	 *
	 * X / Y = [A21, ..., A49]
	 */
	res = legacyDifference({ start: 0, end: 49 }, { start: 0, end: 20 });
	deepEqual(res, { start: 21, end: 49 }, "first set extends past second");

	/*
	 * X = [A0, ..., A49]
	 * Y = [A20, ..., A49]
	 *
	 * X / Y = [A0, ..., A19]
	 */
	res = legacyDifference({ start: 0, end: 49 }, { start: 20, end: 49 });
	deepEqual(res, { start: 0, end: 19 }, "first set starts before second");
});

test('rangeInclusive legacyIntersection', function(){
	/*
	 * X = [A0, A99]
	 * Y = [A50, A101]
	 *
	 * X ∩ Y = [A50, A99]
	 */
	var res = legacyIntersection({ start: 0, end: 99 }, { start: 50, end: 101 });
	deepEqual(res, { start: 50, end: 99 }, "got a intersection");
});

test('rangeInclusive legacyIsEqual', function(){

	/*
	 * X = [A0, ..., An]
	 * Y = [A0, ..., An]
	 */
	/*ok(
		legacyIsEqual(
			{start: 0, end: 100},
			{start: 0, end: 100}),
		"they are equal" );*/

	/*
	 * X = [A0, ..., An]
	 * Y = [A0, ..., A(n+1)]
	 */
	ok(
		!legacyIsEqual(
			{start: 0, end: 100},
			{start: 0, end: 101}),
		"they are not equal" );

	/*
	 * X = [A0, ..., An]
	 * Y = [A1, ..., An]
	 */
	ok(
		!legacyIsEqual(
			{start: 0, end: 100},
			{start: 1, end: 100}),
		"they are not equal" );
});

test('rangeInclusive legacySubset', function(){
	/*
	 * X = [A0, ..., An]
	 * Y = [A0, ..., An]
	 */
	ok(
		legacySubset(
			{start: 0, end: 100},
			{start: 0, end: 100}),
		"self is a subset" );

	/*
	 * X = [A0, ..., An]
	 * Y = [A0, ..., A(n+1)]
	 */
	ok(
		legacySubset(
			{start: 0, end: 100},
			{start: 0, end: 101}),
		"end extends past subset" );

	/*
	 * X = [A0, ..., An]
	 * Y = [A0, ..., A(n+1)]
	 */
	QUnit.equal(
		legacySubset(
			{start: 0, end: 101},
			{start: 0, end: 100}),false,
		"non-subset extends past end" );

	/*
	 * X = [A1, ..., An]
	 * Y = [A0, ..., An]
	 */
	ok(
		legacySubset(
			{start: 1, end: 100},
			{start: 0, end: 100}),
		"start extends before subset" );

	/*
	 * X = [A1, ..., An]
	 * Y = [A0, ..., An]
	 */
	ok(
		!legacySubset(
			{start: 0, end: 100},
			{start: 1, end: 100}),
		"non-subset extends before start" );
});


test('rangeInclusive legacyUnion', function() {
	/*
	 * X = [A0, ..., A99]
	 * Y = [A50, ..., A101]
	 *
	 * X U Y = [A0, ..., A101]
	 */
	//var res = legacyUnion({ start: 0, end: 99 }, { start: 50, end: 101 });
	//deepEqual(res, { start: 0, end: 101 }, "got a union");

	/*
	 * X = universal set
	 * Y = [A0, ..., A10]
	 *
	 * X U Y = X
	 */
	res = legacyUnion({}, { start: 0, end: 10 });
	deepEqual(res, {}, "universal set");
    return;
	/*
	 * X = [A100, ..., A199]
	 * Y = [A200, ..., A299]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 100, end: 199}, {start: 200, end: 299});
	deepEqual(res, {start:100, end:299}, "no intersection");

	/*
	 * X = [A200, ..., A299]
	 * Y = [A100, ..., A199]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 200, end: 299}, {start: 100, end: 199});
	deepEqual(res, {start:100, end:299}, "no intersection with either argument order");

	/*
	 * X = [A200, ..., A299]
	 * Y = [A100, ..., A209]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 200, end: 299}, {start: 100, end: 209});
	deepEqual(res, {start:100, end:299}, "sets can intersect");

	/*
	 * X = [A200, ..., A299]
	 * Y = [A100, ..., A209]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 100, end: 209}, {start: 200, end: 299});
	deepEqual(res, {start:100, end:299}, "sets can intersect with either argument order");

	/*
	 * X = [A100, ..., A299]
	 * Y = [A103, ..., A209]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 100, end: 299}, {start: 103, end: 209});
	deepEqual(res, {start:100, end:299}, "first set contains second");

	/*
	 * X = [A103, ..., A209]
	 * Y = [A100, ..., A299]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 100, end: 299}, {start: 103, end: 209});
	deepEqual(res, {start:100, end:299}, "second set contains first");

	/*
	 * X = [A100, ..., A299]
	 * Y = [A100, ..., A299]
	 *
	 * X U Y = [A100, ..., A299]
	 */
	res = legacyUnion({start: 100, end: 299}, {start: 100, end: 299});
	deepEqual(res, {start:100, end:299}, "union of identical sets is the same as those sets");
});



QUnit.test('rangeInclusive set.count', function(){
	/*
	 * X = [A0, ..., A99]
	 * |X| = 100
	 */

    var query = new BasicQuery({
        page: new BasicQuery.RecordRange(0, 99),
        filter: set.UNIVERSAL
    });
    var res = query.count({ start: 0, end: 99 });
	equal(res, 100, "count is right");
});



QUnit.skip('rangeInclusive with string numbers (#17)', function(){
	var algebra = new set.Algebra(
		props.rangeInclusive('start','end')
	);
	ok(
		algebra.subset(
			{start: "1", end: "100"},
			{start: "0", end: "100"}
		),
		".subset" );

	var res = algebra.getSubset({start: "2",end: "3"},{start: "1",end: "4"},[{id: 1},{id: 2},{id: 3},{id: 4}]);
	deepEqual(res, [{id: 2},{id: 3}], ".getSubset");

	res = algebra.getUnion(
		{start: "2",end: "3"},
		{start: "1",end: "4"},
		[{id: 2},{id: 3}],
		[{id: 1},{id: 2},{id: 3},{id: 4}]);
	deepEqual(res, [{id: 1},{id: 2},{id: 3},{id: 4}], ".getUnion");

});