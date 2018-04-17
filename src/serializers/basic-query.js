var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var BasicQuery = require("../types/basic-query");
var set = require("../set");
var comparisonsConverter = require("../serializers/comparisons");
var Serializer = require("../serializer");
var is = require("../types/comparisons");

var setTypeSymbol = canSymbol.for("can.SetType");
var schemaSymbol = canSymbol.for("can.schema");

var defaultQuery = new BasicQuery({});


function getSchemaProperties(value) {
    var constructor = value.constructor;
    if(constructor && constructor[schemaSymbol]) {
        var schema = constructor[schemaSymbol]();
        return schema.keys || {};
    } else {
        return {};
    }
}

function hydrateFilter(values, schemaProperties, hydrateUnknown) {
    if(values && typeof values === "object" && ("$or" in values)) {
        return hydrateOrs(values.$or, schemaProperties, hydrateUnknown);
    } else {
        return hydrateAndValues(values, schemaProperties, hydrateUnknown);
    }
}

function hydrateAndValues(values, schemaProperties, hydrateUnknown) {
    schemaProperties = schemaProperties || {};

    function hydrateChild(value) {
        if(value) {
            if(Array.isArray(value)) {
                return value.map(hydrateUnknown);
            } else if(canReflect.isPlainObject(value)) {
                // lets try to get the schema ...
                return hydrateAndValues(value, getSchemaProperties(value));
            }
        }
        if(hydrateUnknown) {
            return hydrateUnknown(value);
        } else {
            return value;
        }
    }
    var clone = {};
    canReflect.eachKey(values, function(value, prop){
        var type = schemaProperties[prop];
        if(type) {
            var SetType = type[setTypeSymbol];
            if(SetType) {
                if(SetType.hydrate) {
                    clone[prop] = SetType.hydrate(value, comparisonsConverter.hydrate);
                }
                else if(set.hasComparisons(SetType)) {
                    // Todo ... canReflect.new
                    clone[prop] = new SetType(value);
                } else {
                    // inner types
                    clone[prop] = comparisonsConverter.hydrate(value, function(value){
                        return new SetType(value);
                    });
                }

            } else {
                // HERE
                clone[prop] = comparisonsConverter.hydrate(value, hydrateChild);
            }
        } else {
            // HERE {$gt: 1} -> new is.GreaterThan(1)
            clone[prop] = comparisonsConverter.hydrate(value, hydrateChild);
        }
    });

    return new BasicQuery.AndKeys(clone);

}
// This tries to combine a bunch of OR-ed ANDS into a single AND.
// Example: [{name: "j", age: 3},{name: "j", age: 4}] //-> {name: "j", age: in[3,4]}
function combineAnds(ands) {
    var firstKeys = Object.keys(ands[0].values);
    var keys = {};

    var keysCompare = new is.In(firstKeys);

    firstKeys.map(function(key){
        keys[key] = [];
    });

    var sameKeys = ands.every(function(and){
        // have to have the same keys
        if(!set.isEqual(keysCompare, new is.In(Object.keys(and.values))) ) {
            return false;
        }
        canReflect.eachKey(and.values, function(value, key){
            keys[key].push(value);
        });
        return true;
    });
    if(!sameKeys) {
        return;
    }
    // now try to union everything and see if it simplifies ...
    var unequalKeys = [];
    firstKeys.forEach(function(key){
        var isEqual = keys[key].reduce(function(newSet, lastSetOrFalse){
            if(lastSetOrFalse === false) {
                return false;
            }
            if(lastSetOrFalse === undefined) {
                return newSet;
            }
            var res = set.isEqual(newSet,lastSetOrFalse);
            return res ? newSet : false;
        });
        if(!isEqual) {
            unequalKeys.push(key);
        }
    });

    if(unequalKeys.length !== 1) {
        return;
    }
    var unionKey = unequalKeys[0];
    // lets see if we can union that one value
    var unioned = keys[unionKey].reduce(function(cur, last){
        return set.union(cur, last);
    }, set.EMPTY);

    var result = {};
    firstKeys.map(function(key){
        result[key] = keys[key][0];
    });
    result[unionKey] = unioned;
    return new BasicQuery.AndKeys(result);
}

function hydrateOrs(values, schemaProperties, hydrateUnknown ) {
    var comparisons = values.map(function(value){
        return hydrateAndValues(value, schemaProperties, hydrateUnknown);
    });
    var combined = combineAnds(comparisons);
    if(combined) {
        return combined;
    }
    return new BasicQuery.Or(comparisons);
}



module.exports = function(schema) {

    var id = schema.identity && schema.identity[0];
    var keys = schema.keys;

    var serializeMap = [
        [BasicQuery.Or, function(or, serializer){
            return or.values.map(function(value){
                return serializer(value);
            });
        }],
        // this destructures ANDs with OR-like clauses
        [BasicQuery.AndKeys, function(and, serializer){
            var ors = [];
            var result = {};
            canReflect.eachKey(and.values, function(value, key){
                // is value universal ... if not, we don't need to add anything
                if(typeof value.orValues === "function") {
                    canReflect.addValues( ors, value.orValues().map(function(orValue){
                        var result = {};
                        result[key] = serializer(orValue);
                        return result;
                    }) );
                } else {
                    result[key] = serializer(value);
                }
            });
            if(ors.length) {
                return {
                    $or: ors.map(function(orPart){
                        return canReflect.assign( canReflect.serialize(result), orPart);
                    })
                };
            } else {
                return result;
            }

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

            if(basicQuery.sort !== id) {
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
            var filterAnd = hydrateFilter(filter, keys, function(value){
                if(canReflect.isBuiltIn(value)) {
                    return value;
                } else {
                    throw new Error("can-query-logic doesn't support comparison operator: "+JSON.stringify(value));
                }
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
                query.sort = id;
            }
            return new BasicQuery(query);
        },
        serializer: serializer
    };
};
