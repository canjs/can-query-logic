var set = require("./src/set");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var makeBasicQueryConvert = require("./src/serializers/basic-query");
var schemaSymbol = canSymbol.for("can.schema");


// Creates an algebra used to convert primitives to types and back
function Query(Type, options){
    var passedHydrator = options && options.toQuery;
    var passedSerializer = options && options.toParams;
    var schema;
    if(Type[schemaSymbol]) {
        schema = Type[schemaSymbol]();
    } else {
        schema = Type;
    }

    // check that the basics are here

    var id = schema.identity && schema.identity[0];
    if(!id) {
        console.warn("can-query given a type without an identity schema.  Using `id` as the identity id.");
        schema.identity = ["id"];
    }


    var properties = schema.properties;

    if(!properties) {
        console.warn("can-query given a type without a properties schema.  Using an empty schema.");
        schema.properties = {};
    }

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
    this.hydrate = hydrate;
    this.serialize = serialize;
    this.schema = schema;

}

function makeNewSet(prop){
    return function(qA, qB){
        var queryA = this.hydrate(qA),
            queryB = this.hydrate(qB);
        var unionQuery = set[prop](queryA , queryB );
        return this.serialize( unionQuery );
    };
}

function makeReturnValue(prop) {
    return function(qA, qB){
        var queryA = this.hydrate(qA),
            queryB = this.hydrate(qB);
        return set[prop](queryA , queryB );
    };
}

canReflect.assign(Query.prototype,{
    union: makeNewSet("union"),
    difference: makeNewSet("difference"),
    intersection: makeNewSet("intersection"),

    isEqual: makeReturnValue("isEqual"),
    isProperSubset: makeReturnValue("isProperSubset"),
    isSubset: makeReturnValue("isSubset"),

    isSpecial: set.isSpecial,
    isDefinedAndHasMembers: set.isDefinedAndHasMembers,

    // identity keys
    identityKeys: function(){
        return this.schema.identity;
    },
    count: function(a){
        var queryA = this.hydrate(a);
        return queryA.page.end - queryA.page.start + 1;
    },


    filterMembers: function(a, b, bData){
        var queryA = this.hydrate(a),
            queryB = this.hydrate(b);
        return queryA.filterFrom(bData, queryB);
    },
    // filterMembersAndGetCount
    filterMembersAndGetCount: function(a, b, bData) {
        var queryA = this.hydrate(a),
            queryB = this.hydrate(b);
        return queryA.filterMembersAndGetCount(bData, queryB);
    },
    // unionMembers
    unionMembers: function(a, b, aData, bData) {
        var queryA = this.hydrate(a),
            queryB = this.hydrate(b);

        return queryA.merge(queryB, aData, bData, this.memberIdentity.bind(this));
    },
    // isMember
    isMember: function(query, props) {
        return this.hydrate(query).isMember(props);
    },

    memberIdentity: function(props) {
        var identity = this.schema.identity;
        if(!identity || identity.length === 0) {
            throw new Error("Provide an an identity property to your schema.");
        } else if(identity.length === 1) {
            return canReflect.getKeyValue(props, identity[0]);
        } else {
            var id = {};
            identity.forEach(function(key){
                id[key] = canReflect.getKeyValue(props, key);
            });
            return JSON.stringify(id);
        }
    },
    index: function(query, items, props){
        return this.hydrate(query).index(props, items);
    }

});

Query.UNIVERSAL = set.UNIVERSAL;
// Nothing
Query.EMPTY = set.EMPTY;
// The set exists, but we lack the language to represent it.
Query.UNDEFINABLE = set.UNDEFINABLE;

// We don't know if this exists. Intersection between two paginated sets.
Query.UNKNOWABLE = set.UNKNOWABLE;

Query.defineComparison = set.defineComparison;

module.exports = Query;
