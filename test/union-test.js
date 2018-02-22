var Query = require("can-query");
var Schema = require("can-schema");

QUnit.test("union to array", function(){

    // boolean
    // enum
    // id
    new Schema({
        name: String,

    })

    var query = new Query();
    var res = query.union(
        {where: {foo: "bar"}},
        {where: {foo: "zed"}}
    );
    QUnit.deepEqual({where: {foo: ["bar","zed"]}}, res, "union sames into []");


});


or([

])

or(["red","green","blue"].map(is))


schema is needed

    prop: "bar" - matters if an enum, or `null`
    prop: number ?


    gt, lt ... how comparisons work
