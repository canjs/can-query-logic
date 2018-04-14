var set = require("../set");
var is = require("./comparisons");
var canReflect = require("can-reflect");


function splitByRangeAndEnum(inUniverse, rangeToBeSplit) {
    var rangeSet,
        enumSet;

    if(rangeToBeSplit instanceof is.And) {
        var sets = rangeToBeSplit.values.map(function(setInAnd){
            return splitByRangeAndEnum(inUniverse, setInAnd);
        });
        return sets.reduce(function(last, maybe){
            return {
                range: set.intersection(last.range, maybe.range),
                enum: set.intersection(last.enum, maybe.enum)
            };
        },{
            range: set.UNIVERSAL,
            enum: inUniverse
        });

    } else if(rangeToBeSplit instanceof is.In) {
        var shouldBeInValues = inUniverse.values.filter(function(inValue){
            return rangeToBeSplit.values.indexOf(inValue) !== -1;
        });
        if(shouldBeInValues.length) {
            var valuesCopy = rangeToBeSplit.values.slice(0);
            canReflect.removeValues(valuesCopy,shouldBeInValues);

            enumSet = new is.In(shouldBeInValues);
            rangeSet = valuesCopy.length ? new is.In(valuesCopy) : set.EMPTY;
        } else {
            rangeSet = rangeToBeSplit;
            enumSet = set.EMPTY;
        }
    } else if(rangeToBeSplit instanceof is.NotIn) {
        // find the inValues not in isNotIn ...
        enumSet = set.intersection(inUniverse, rangeToBeSplit);
        // we should remove all the values within $in matching an in values.
        var rangeValues = rangeToBeSplit.values.filter(function(value){
            return !inUniverse.isMember(value);
        });
        rangeSet = rangeValues.length ? new is.NotIn(rangeValues) : set.UNIVERSAL;
    } else {
        rangeSet = rangeToBeSplit;
        enumSet = set.EMPTY;
    }
    return {
        enum: enumSet,
        range: rangeSet
    };
}

// REPRESENTS AN OR
module.exports = function makeMaybe(inValues){


    var inUniverse = new is.In(inValues);

    function Maybe(values){



        var result = splitByRangeAndEnum(inUniverse, values.range);
        this.range = result.range || set.EMPTY;
        if(values.enum) {
            if(result.enum !== set.EMPTY) {
                this.enum = set.union(result.enum, values.enum);
            } else {
                this.enum = values.enum;
            }
        } else {
            this.enum = result.enum;
        }
    }


    set.defineComparison(Maybe,Maybe,{
        union: function(maybeA, maybeB){
            var enumSet = set.union(maybeA.enum, maybeB.enum);
            var range = set.union(maybeA.range, maybeB.range);

            return new Maybe({
                enum: enumSet,
                range: range
            });
        },
        difference: function(maybeA, maybeB) {
            var enumSet = set.difference(maybeA.enum, maybeB.enum);
            var range = set.difference(maybeA.range, maybeB.range);

            return new Maybe({
                enum: enumSet,
                range: range
            });
        },
        intersection: function(maybeA, maybeB) {
            var enumSet = set.intersection(maybeA.enum, maybeB.enum);
            var range = set.intersection(maybeA.range, maybeB.range);

            return new Maybe({
                enum: enumSet,
                range: range
            });
        }
    });

    set.defineComparison(set.UNIVERSAL, Maybe,{
        difference: function(universe, maybe){
            var primary,
                secondary;

            if(maybe.range === set.UNIVERSAL) {
                // there is only the enum
                return new Maybe({
                    range: maybe.range,
                    enum: set.difference(inUniverse,  maybe.enum)
                });
            }
            // there is only a primary
            if(maybe.enum === set.EMPTY) {
                var rangeSet = set.difference(set.UNIVERSAL, maybe.range);
                var notPresent = set.difference(inUniverse,  maybe.range);
                // make sure they are included
                var enumSet = set.difference(notPresent, rangeSet);


                return new Maybe({
                    range: rangeSet,
                    enum: enumSet
                });
                // check enum things that aren't included in primary

            } else {
                primary = set.difference(universe, maybe.range);
                secondary = set.difference(inUniverse,  maybe.enum);
            }
            return new Maybe({
                enum: secondary,
                range: primary
            });
        }
    });

    return Maybe;
};
