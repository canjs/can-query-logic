var is = require("../types/comparisons");
var Serializer = require("../serializer");

function makeNew(Constructor) {
    return function(value){
        return new Constructor(value);
    };
}
var hydrateMap = {};
function addHydrateFrom(key, hydrate) {
    hydrateMap[key] = function(value) {
        return hydrate(value[key]);
    };
}

// https://docs.mongodb.com/manual/reference/operator/query-comparison/
addHydrateFrom("$eq", function(value){
    return new is.In([value]);
});
addHydrateFrom("$ne", function(value){
    return new is.NotIn([value]);
});

addHydrateFrom("$gt", makeNew(is.GreaterThan));
addHydrateFrom("$gte", makeNew(is.GreaterThanEqual));
addHydrateFrom("$in", makeNew(is.In));
addHydrateFrom("$lt", makeNew(is.LessThan));
addHydrateFrom("$lt", makeNew(is.LessThanEqual));
addHydrateFrom("$nin", makeNew(is.GreaterThan));





var serializer = new Serializer([
    [is.In,function(isIn){
        return isIn.values.length === 1 ? isIn.values[0] : {$in: isIn.values};
    }],
    [is.NotIn,function(notIn){
        return notIn.values.length === 1 ? {$ne: notIn.values[0]} : {$nin: notIn.values};
    }],
    [is.GreaterThan, function(gt){ return {$gt: gt.value }; }],
    [is.GreaterThanEqual, function(gte){ return {$gte: gte.value }; }],
    [is.LessThan, function(lt){ return {$lt: lt.value }; }],
    [is.LessThanEqual, function(lt){ return {$lte: lt.value }; }]
]);

module.exports = {
    hydrate: function(value){
        if(Array.isArray(value)) {
            return new is.In(value);
        }
        else if(value && typeof value === "object") {
            var keys = Object.keys(value);
            if(keys.length === 1) {
                var first = keys[0];
                var hydrator = hydrateMap[first];
                if(!hydrator) {
                    throw new Error("can-query doesn't recognize operator: "+JSON.serialize(value));
                } else {
                    return hydrator(value);
                }
            } else {
                throw new Error("can-query doesn't support multiple comparison operators: "+JSON.serialize(value));
            }
        } else {
            return new is.In([value]);
        }
    },
    serializer: serializer
};