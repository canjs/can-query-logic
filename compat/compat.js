// for can-set compat
var Query = require("../can-query");
var canReflect = require("can-reflect");
var transform = require("can-get/transform/transform");
var makeEnum = require("../src/types/make-enum");
var SET = require("../src/set");

var IsBoolean = function(){

};
makeEnum(IsBoolean,[true, false], function(data) {
    var values = Array.isArray(data) ? data : [data];
    return values.map(function(value){
        if(value === "true") {
            return true;
        } else if(value === "false") {
            return false;
        } else {
            return value;
        }
    });
});

function hasKey(obj, keys) {
    if(obj && typeof obj === "object") {
        for(var key in obj) {
            if(keys[key]) {
                return true;
            } else {
                return hasKey(obj[key], keys);
            }
        }
    }
    return false;
}

var defaultAlgebra;

var set = {
    Algebra: function(){
        var mutators = {
            schema: [],
            hydrate: [],
            serialize: []
        };
        canReflect.eachIndex(arguments, function(value){
            for(var prop in value) {
                mutators[prop].push(value[prop]);
            }
        });
        var obj = canReflect.assignSymbols({},{
            "can.schema": function(){
                var schema = {
                    kind: "record",
                    identity: [],
                    properties: {}
                };
                mutators.schema.forEach(function(updateSchema){
                    updateSchema(schema);
                });

                return schema;
            }
        });
        return new Query(obj, function(data){

            return mutators.hydrate.reduce(function(last, hydrator){
                return hydrator(last);
            }, {filter: data});
        }, function(data){

            if(data === SET.EMPTY) {
                return false;
            }
            if(data === SET.UNDEFINABLE) {
                return true;
            }
            if(Array.isArray(data.filter)){
                // OR is not supported ...
                return true;
            }
            var out = mutators.serialize.reduce(function(last, serializer){
                return serializer(last);
            }, data);

            var filter = out.filter;
            if(hasKey(filter, {"$ne": true})) {
                return true;
            }
            delete out.filter;
            return canReflect.assign(out, filter);
        });
    },
    props: {

        boolean: function(prop){
            // create boolean or enum
            return {
                schema: function(schema) {
                    schema.properties[prop] = IsBoolean;
                }
            };
        },
        dotNotation: function(){
            // This will be supported by default
            return {};
        },
        enum: function(property, propertyValues) {
            function Enum(){}
            makeEnum(Enum, propertyValues);
            return {
                schema: function(schema) {
                    schema.properties[property] = Enum;
                }
            };
        },
        id: function(id){
            return {
                "schema": function(schema){
                    schema.identity.push(id);
                }
            };
        },
        rangeInclusive: function(start, end){
            var hydrateTransfomer = {};
            hydrateTransfomer["filter."+start] = "page.start";
            hydrateTransfomer["filter."+end] = "page.end";

            var serializeTransformer = {
                "page.start": start,
                "page.end": end
            };
            return {
                // taking what was given and making it a raw query look
                // start -> page.start
                // end -> page.end
                hydrate: function(raw){
                    return transform(raw, hydrateTransfomer);
                },
                // taking the normal format and putting it back
                // page.start -> start
                // page.end -> end
                serialize: function(raw){
                    return transform(raw, serializeTransformer);
                }
            };
        },
        sort: function(prop, sortFunc){
            if(sortFunc) {
                throw new Error("can-query/compat.sort - sortFunc is not supported");
            }
            if(prop === "sort") {
                return {};
            }
            var hydrateTransfomer = {};
            hydrateTransfomer[prop] = "sort";

            var serializeTransformer = {
                "sort": prop
            };
            return {
                hydrate: function(raw){
                    return transform(raw, hydrateTransfomer);
                },
                serialize: function(raw){
                    return transform(raw, serializeTransformer);
                }
            };
        }
    }
};

function makeFromTwoQueries(prop) {
    set[prop] = function( a, b, algebra ){
        if(!algebra) {
            algebra = defaultAlgebra;
        }
        else if(!(algebra instanceof Query) ) {
            algebra = new set.Algebra(algebra);
        }

        return algebra[prop](a, b);
    };
}
makeFromTwoQueries("difference");
makeFromTwoQueries("union");
makeFromTwoQueries("intersection");
makeFromTwoQueries("subset");
makeFromTwoQueries("equal");
makeFromTwoQueries("properSubset");

defaultAlgebra = new set.Algebra();

module.exports = set;
