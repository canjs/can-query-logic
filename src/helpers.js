var canReflect = require("can-reflect");
var defaultCompare = {
    $gt: function(valueA, valueB) {
        return valueA > valueB;
    },
    $lt: function(valueA, valueB) {
        return valueA < valueB;
    }
};

var helpers =  {
    // given two arrays of items, combines and only returns the unique ones
    uniqueConcat: function(itemsA, itemsB, getId) {
        var ids = new Set();
        return itemsA.concat(itemsB).filter(function(item){
            var id = getId(item);
            if(!ids.has(id)) {
                ids.add(id);
                return true;
            } else {
                return false;
            }
        });
    },
    //
    getIndex: function(compare, items, props){
        if(!items || !items.length) {
            return undefined;
        }
        // check the start and the end
        if( compare(props, items[0]) === -1 ) {
            return 0;
        }
        else if(compare(props, items[items.length -1] ) === 1 ) {
            return items.length;
        }
        var low = 0,
            high = items.length;

        // From lodash lodash 4.6.1 <https://lodash.com/>
        // Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
        while (low < high) {
            var mid = (low + high) >>> 1,
                item = items[mid],
                computed = compare(props, item);
            if ( computed === -1 ) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
        // bisect by calling sortFunc
    },
    sortData: function (sortPropValue) {
        if(sortPropValue[0] === "-") {
            return {prop: sortPropValue.slice(1), desc: true};
        } else {
            return {prop: sortPropValue, desc: false};
        }
    },
    defaultCompare: defaultCompare,
    sorter: function (sortPropValue, sorters) {
        var data = helpers.sortData(sortPropValue);
        var compare;
        if(sorters && sorters[data.prop]) {
            compare = sorters[data.prop];
        } else {
            compare = defaultCompare;
        }
        return function(item1, item2){
            var item1Value = canReflect.getKeyValue(item1, data.prop);
            var item2Value = canReflect.getKeyValue(item2, data.prop);
            var temp;

            if(data.desc) {
                temp = item1Value;
                item1Value = item2Value;
                item2Value = temp;
            }

            if( compare.$lt( item1Value, item2Value) ) {
                return -1;
            }

            if( compare.$gt( item1Value, item2Value)) {
                return 1;
            }

            return 0;
        };
    },
		valueHydrator: function(value){
				if(canReflect.isBuiltIn(value)) {
						return value;
				} else {
						throw new Error("can-query-logic doesn't support comparison operator: "+JSON.stringify(value));
				}
		}
};
module.exports = helpers;
