var QUnit = require("steal-qunit");

var makeEnum = require("./make-enum");
var set = require("../set");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

QUnit.module("can-query-logic/types/make-enum");


QUnit.test(".isMember", function(){
    var Status = makeEnum(function(){},["assigned","complete"]);

    var status = new Status(["assigned"]);

    QUnit.ok( status[canSymbol.for("can.isMember")]("assigned"), "assigned is member");
});
