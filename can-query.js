var BasicQuery = require("./src/types/basic-query");
var set = require("./src/set");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var makeBasicQueryConvert = require("./src/serializers/basic-query");

var setTypeSymbol = canSymbol.for("can.SetType"),
    schemaSymbol = canSymbol.for("can.schema");



module.exports = function(Type){
    var schema = Type[schemaSymbol]();
    var converter = makeBasicQueryConvert(schema);

    return {
        union: function(qA, qB){
            var queryA = converter.hydrate(qA),
                queryB = converter.hydrate(qB);
            var unionQuery = set.union(queryA , queryB );
            return converter.serialize( unionQuery );
        }
    };
};
