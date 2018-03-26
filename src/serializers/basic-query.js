var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var BasicQuery = require("../types/basic-query");
var set = require("../set");
var comparisonsConverter = require("../serializers/comparisons");
var Serializer = require("../serializer");

var setTypeSymbol = canSymbol.for("can.SetType");

var defaultQuery = new BasicQuery({});




module.exports = function(schema) {

    var id = schema.identity && schema.identity[0];
    if(!id) {
        console.warn("can-query given a type without an identity schema.  Using `id` as the identity id.");
        id = "id";
    }


    var properties = schema.properties;

    if(!properties) {
        console.warn("can-query given a type without a properties schema.  Using an empty schema.");
        properties = {};
    }

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
            var filter = canReflect.assignDeep({}, data.filter || {});







            canReflect.eachKey(filter, function(value, prop){
                var type = properties[prop];
                if(type) {
                    var SetType = type[setTypeSymbol];
                    if(SetType) {
                        filter[prop] = new SetType(value);
                    } else {
                        // HERE
                        filter[prop] = comparisonsConverter.hydrate(value);
                    }
                } else {
                    // HERE {$gt: 1} -> new is.GreaterThan(1)
                    filter[prop] = comparisonsConverter.hydrate(value);
                }

            });
            var query = {
                filter: new BasicQuery.And(filter)
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
