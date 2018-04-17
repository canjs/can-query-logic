var is = require("../types/comparisons");
var Serializer = require("../serializer");

function makeNew(Constructor) {
    return function(value){
        return new Constructor(value);
    };
}
var hydrateMap = {};
function addHydrateFrom(key, hydrate) {
    hydrateMap[key] = function(value, unknownHydrator) {
        return hydrate( unknownHydrator ? unknownHydrator(value[key]) : value[key]);
    };
    Object.defineProperty(hydrateMap[key], "name", {
		value: "hydrate "+key,
		writable: true
	});
}

function addHydrateFromValues(key, hydrate) {
    hydrateMap[key] = function(value, unknownHydrator) {
        var clones = value[key];
        if(unknownHydrator) {
            clones = clones.map(function(value){
                return unknownHydrator(value);
            });
        }
        return hydrate( clones );
    };
    Object.defineProperty(hydrateMap[key], "name", {
		value: "hydrate "+key,
		writable: true
	});
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
addHydrateFromValues("$in", makeNew(is.In));
addHydrateFrom("$lt", makeNew(is.LessThan));
addHydrateFrom("$lt", makeNew(is.LessThanEqual));
addHydrateFromValues("$nin", makeNew(is.GreaterThan));





var serializer = new Serializer([
    [is.In,function(isIn, serialize){
        return isIn.values.length === 1 ?
            serialize(isIn.values[0]) :
            {$in: isIn.values.map(serialize)};
    }],
    [is.NotIn,function(notIn, serialize){
        return notIn.values.length === 1 ?
            {$ne: serialize(notIn.values[0])} : {$nin: notIn.values.map(serialize)};
    }],
    [is.GreaterThan, function(gt, serialize){ return {$gt: serialize(gt.value) }; }],
    [is.GreaterThanEqual, function(gte, serialize){ return {$gte: serialize(gte.value) }; }],
    [is.LessThan, function(lt, serialize){ return {$lt: serialize(lt.value) }; }],
    [is.LessThanEqual, function(lt, serialize){ return {$lte: serialize(lt.value) }; }],
    /*[is.Or, function(or, serialize){
        return {
            $or: or.values.map(function(value){
                return serialize(value, serialize);
            })
        };
    }]*/
]);

module.exports = {
    hydrate: function(value, hydrateUnknown){
        if(!hydrateUnknown) {
            hydrateUnknown = function(){
                throw new Error("can-query-logic doesn't recognize operator: "+JSON.stringify(value));
            }
        }
        if(Array.isArray(value)) {
            return new is.In(value);
        }
        else if(value && typeof value === "object") {
            var keys = Object.keys(value);
            if(keys.length === 1) {
                var first = keys[0];
                var hydrator = hydrateMap[first];
                if(!hydrator) {
                    return hydrateUnknown(value);
                } else {
                    return hydrator(value, hydrateUnknown);
                }
            } else {
                return hydrateUnknown(value);
            }
        } else {
            return new is.In([value]);
        }
    },
    serializer: serializer
};
