var BasicQuery = require("./src/types/basic-query");
var set = require("./src/set");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

var setTypeSymbol = canSymbol.for("can.SetType"),
    schemaSymbol = canSymbol.for("can.schema");


var toBasicQuery = function(schema, data){
    // convert filter
    var filter = canReflect.assignDeep({}, data.filter || {});

    canReflect.eachKey(filter, function(value, prop){
        var type = schema.properties[prop];
        if(type) {
            var SetType = type[setTypeSymbol];
            if(SetType) {
                filter[prop] = new SetType(value);
            } else {
                filter[prop] = value;
            }
        } else {
            filter[prop] = value;
        }

    });
    return new BasicQuery({
        filter: new BasicQuery.And(filter)
    });

    // Color.set
};
var basicQueryToParams = function(basicQuery){
    return canReflect.serialize(basicQuery);
};

module.exports = function(Type){
    var schema = Type[schemaSymbol]();
    return {
        union: function(qA, qB){
            var queryA = toBasicQuery(schema, qA),
                queryB = toBasicQuery(schema, qB);
            var unionQuery = set.union(queryA , queryB );
            return basicQueryToParams( unionQuery );
        }
    };
};
