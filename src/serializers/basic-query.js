var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var BasicQuery = require("../types/basic-query");
var set = require("../set");
var comparisonsConverter = require("../serializers/comparisons");
var Serializer = require("../serializer");

var setTypeSymbol = canSymbol.for("can.SetType");

var serializeMap = [
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

        var filter = childSerializer(basicQuery.filter);

        var res = {
            filter: filter
        };
        if(!set.isEqual(basicQuery.page, new BasicQuery.RecordRange())) {
            throw new Error('get this working');
            //res.page = canReflect.serialize(this.page);
        }

        if(basicQuery.sort !== "id ASC") {
            res.sort = basicQuery.sort;
        }
        return res;

    }]
];


module.exports = function(schema) {

    var serializer = new Serializer(serializeMap);
    serializer.add(comparisonsConverter.serializer);

    return {
        hydrate: function(data){
            var filter = canReflect.assignDeep({}, data.filter || {});
            var properties = schema.properties;


            if(!properties) {
                console.warn("can-query given a type without a schema.  Using an empty schema.");
                properties = {};
            }


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
            }
            return new BasicQuery(query);
        },
        serializer: serializer
    };
};
