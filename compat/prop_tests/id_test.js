var QUnit = require("steal-qunit");

var set = require('../compat'),
	props = set.props;

QUnit.module("can-set props.id");

test("id set.difference", function(){

  var idProps = props.id("color");
  var res;

  res = set.difference({ color: "red" }, { color: "blue" }, idProps);
  deepEqual(res, { color: "red" }, "id changes always false");

  res = set.difference({ color: "red" }, { }, idProps);
  deepEqual(res, set.EMPTY, "id removal always false");

  res = set.difference({ }, { color: "blue" }, idProps);
  deepEqual(res, set.UNDEFINABLE, "id addition always true");

});

test("id set.difference with where", function() {
  var algebra = new set.Algebra(
    props.id("color"),
    props.enum("type", ["light", "dark"])
  );
  var res;

  res = set.difference({ color: "red", type: ["light", "dark"] }, { color: "blue", type: "light" }, algebra);
  deepEqual(res, { color: "red", type: ["light", "dark"] }, "id changes always false");

  res = set.difference({ color: "red", type: ["light", "dark"] }, { type: "light" }, algebra);
  deepEqual(res, { color: "red", type:  "dark" }, "id removal always false");

  var a2 = new set.Algebra(
    props.enum("color", ["red", "green"])
  );

  res = set.difference({ color: ["red", "green"] }, {  status: "accepted", color: "red" }, a2);
  deepEqual(res, set.UNDEFINABLE, "id addition always true");

  res = set.difference({ type: ["light", "dark"] }, {  type: "light" }, algebra);
  deepEqual(res, { type: "dark" }, "no id clause, fall back to where");

  res = set.difference({ color: "red", type: ["light", "dark"] }, { color: "red", type: "light" }, algebra);
  deepEqual(res, { color: "red", type: "dark" }, "no id change, fall back to where");

});
