var set = require("./src/set");
var canSymbol = require("can-symbol");
var makeBasicQueryConvert = require("./src/serializers/basic-query");
var schemaSymbol = canSymbol.for("can.schema");



module.exports = function(Type){
    var schema = Type[schemaSymbol]();

    var converter = makeBasicQueryConvert(schema);

    function makeNewSet(prop){
        return function(qA, qB){
            var queryA = converter.hydrate(qA),
                queryB = converter.hydrate(qB);
            var unionQuery = set[prop](queryA , queryB );
            return converter.serializer.serialize( unionQuery );
        };
    }
    function makeReturnValue(prop) {
        return function(qA, qB){
            var queryA = converter.hydrate(qA),
                queryB = converter.hydrate(qB);
            return set[prop](queryA , queryB );
        };
    }


    return {
        // count
        difference: makeNewSet("difference"),
        equal: makeReturnValue("isEqual"),
        // getSubset
        // getUnion
        has: function(query, props) {
            return converter.hydrate(query).isMember(props);
        },
        id: function(props) {
            var identity = schema.identity;
            if(!identity || identity.length === 0) {
                throw new Error("Provide an an identity property to your schema.");
            } else if(identity.length === 1) {
    			return props[identity[0]];
    		} else {
    			var id = {};
    			identity.forEach(function(key){
    				id[key] = props[key];
    			});
    			return JSON.stringify(id);
    		}
        },
        // index
        intersection: makeNewSet("intersection"),
        properSubset: makeReturnValue("isProperSubset"),
        subset: makeReturnValue("isSubset"),
        union: makeNewSet("union")
    };
};
