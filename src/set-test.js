var set = require("./set");
var QUnit = require("steal-qunit");

QUnit.module("can-query-logic/set");

QUnit.test(".ownAndMemberValue", function(){
	QUnit.deepEqual( set.ownAndMemberValue(1, "1"), {
		own: 1,
		member: 1
	}, "1 and '1'");

	QUnit.deepEqual( set.ownAndMemberValue({
		valueOf: function(){ return null; }
	}, "1"), {
		own: null,
		member: "1"
	}, "{null} and '1'");
});

QUnit.test(".isDefinedAndHasMembers", function(){
	QUnit.equal(set.isDefinedAndHasMembers({}), true);
	QUnit.equal(set.isDefinedAndHasMembers(set.UNIVERSAL), true);
	QUnit.equal(set.isDefinedAndHasMembers(set.UNDEFINABLE), false);
});
