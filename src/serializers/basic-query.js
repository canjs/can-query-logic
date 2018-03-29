var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var BasicQuery = require("../types/basic-query");
var set = require("../set");
var comparisonsConverter = require("../serializers/comparisons");
var Serializer = require("../serializer");

var setTypeSymbol = canSymbol.for("can.SetType");
var schemaSymbol = canSymbol.for("can.schema");

var defaultQuery = new BasicQuery({});


function getSchemaProperties(value) {
    var constructor = value.constructor;
    if(constructor && constructor[schemaSymbol]) {
        var schema = constructor[schemaSymbol]();
        return schema.properties || {};
    } else {
        return {};
    }
}

function hydrateAndValues(values, schemaProperties, hydrateUnknown) {
    schemaProperties = schemaProperties || {};
    
    function hydrateChild(value) {
        if(value) {
            if(Array.isArray(value)) {
                throw new Error("this should not happen");
            } else if(canReflect.isPlainObject(value)) {
                // lets try to get the schema ...
                return hydrateAndValues(value, getSchemaProperties(value));
            }
        }
        hydrateUnknown && hydrateUnknown(value);
    }

    canReflect.eachKey(values, function(value, prop){
        var type = schemaProperties[prop];
        if(type) {
            var SetType = type[setTypeSymbol];
            if(SetType) {
                values[prop] = new SetType(value);
            } else {
                // HERE
                values[prop] = comparisonsConverter.hydrate(value, hydrateChild);
            }
        } else {
            // HERE {$gt: 1} -> new is.GreaterThan(1)
            values[prop] = comparisonsConverter.hydrate(value, hydrateChild);
        }
    });

    return new BasicQuery.And(values);

}

module.exports = function(schema) {

    var id = schema.identity && schema.identity[0];
    var properties = schema.properties;

    var serializeMap = [
        [BasicQuery.Or, function(or, serializer){
            return or.values.map(function(value){
                return serializer(value);
            });
        }],
        [BasicQuery.And, function(and, serializer){
            var result = {};
            canReflect.eachKey(and.values, function(value, key){
                // is value universal ... if not, we don't need to add anything
                result[key] = serializer(value);
            });
            return result;
        }],
        [BasicQuery.RecordRange, function(range){
            return {start: range.start, end: range.end};
        }],
        [BasicQuery, function(basicQuery, childSerializer){

            var filter = set.isEqual(basicQuery.filter, set.UNIVERSAL) ? {} : childSerializer(basicQuery.filter);

            var res = {
                filter: filter
            };
            if(!set.isEqual(basicQuery.page, defaultQuery.page)) {
                // we always provide the start, even if it's 0
                res.page = {
                    start: basicQuery.page.start
                };
                if(basicQuery.page.end !== defaultQuery.page.end) {
                    res.page.end = basicQuery.page.end;
                }
            }

            if(basicQuery.sort !== id+" ASC") {
                res.sort = basicQuery.sort;
            }
            return res;

        }]
    ];





    var serializer = new Serializer(serializeMap);
    serializer.add(comparisonsConverter.serializer);

    return {
        hydrate: function(data){
            var filter = canReflect.serialize(data.filter);

            // this mutates
            var filterAnd = hydrateAndValues(filter, properties, function(value){
                throw new Error("can-query doesn't support comparison operator: "+JSON.stringify(value));
            });

            // Conver the filter arguments

            var query = {
                filter: filterAnd
            };
            if(data.page) {
                query.page = new BasicQuery.RecordRange(data.page.start, data.page.end);
            }
            if(data.sort) {
                query.sort = data.sort;
            } else {
                query.sort = id+" ASC";
            }
            return new BasicQuery(query);
        },
        serializer: serializer
    };
};
