var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var BasicQuery = require("../types/basic-query");
var set = require("../set");
var comparisonsConverter = require("../serializers/comparisons");

var setTypeSymbol = canSymbol.for("can.SetType"),
    serializeSymbol = canSymbol.for("can.serialize");


var serializeMap = new Map([
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
    }]
]);

function childSerializer(value) {
    if(value && value[serializeSymbol]) {
        return value[serializeSymbol]();
    }
    return comparisonsConverter.serialize(value);
}


module.exports = function(schema) {
    return {
        hydrate: function(data){
            var filter = canReflect.assignDeep({}, data.filter || {});

            canReflect.eachKey(filter, function(value, prop){
                var type = schema.properties[prop];
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
            return new BasicQuery({
                filter: new BasicQuery.And(filter)
            });
        },
        serialize: function(basicQuery){

            var filter = serializeMap.get(basicQuery.filter.constructor)(basicQuery.filter, childSerializer);

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

        }
    };
};
