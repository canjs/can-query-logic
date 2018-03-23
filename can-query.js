var set = require("./src/set");
var canSymbol = require("can-symbol");
var makeBasicQueryConvert = require("./src/serializers/basic-query");
var schemaSymbol = canSymbol.for("can.schema");



module.exports = function(Type, passedHydrator, passedSerializer){
    var schema = Type[schemaSymbol]();

    var converter = makeBasicQueryConvert(schema),
        hydrate,
        serialize;

    if(passedHydrator) {
        hydrate = function(query){
            return converter.hydrate(passedHydrator(query));
        };
    } else {
        hydrate = converter.hydrate;
    }

    if(passedSerializer) {
        serialize = function(query){
            return passedSerializer(converter.serializer.serialize(query));
        };
    } else {
        serialize = converter.serializer.serialize;
    }

    function makeNewSet(prop){
        return function(qA, qB){
            var queryA = hydrate(qA),
                queryB = hydrate(qB);
            var unionQuery = set[prop](queryA , queryB );
            return serialize( unionQuery );
        };
    }
    function makeReturnValue(prop) {
        return function(qA, qB){
            var queryA = hydrate(qA),
                queryB = hydrate(qB);
            return set[prop](queryA , queryB );
        };
    }


    return {
        count: function(a){
            var queryA = hydrate(a);
            return queryA.page.end - queryA.page.start + 1;
        },
        difference: makeNewSet("difference"),
        equal: makeReturnValue("isEqual"),
        getSubset: function(a, b, bData){
            var queryA = hydrate(a),
                queryB = hydrate(b);
            return queryA.filterFrom(bData, queryB);
        },
        getUnion: function(a, b, aData, bData) {
            var queryA = hydrate(a),
                queryB = hydrate(b);

            return queryA.merge(queryB, aData, bData, this.id.bind(this));
        },
        has: function(query, props) {
            return hydrate(query).isMember(props);
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
        index: function(query, items, props){
            return hydrate(query).index(props, items);
        },
        // index
        intersection: makeNewSet("intersection"),
        properSubset: makeReturnValue("isProperSubset"),
        subset: makeReturnValue("isSubset"),
        union: makeNewSet("union")
    };
};
