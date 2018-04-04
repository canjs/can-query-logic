var set = require("./set");
function indexOf(arr, value) {
    for(var i = 0, len = arr.length; i < len; i++) {
        if(set.isEqual(arr[i], value)) {
            return i;
        }
    }
    return -1;
}

function getValue(value){
    return value == null ? value : value.valueOf();
}

module.exports = function arrayUnionIntersectionDifference(arr1, arr2){
    var set = new Set();

    var intersection = [];
    var union = [];
    var difference = arr1.slice(0);


    arr1.forEach(function(value){
        set.add(getValue(value));
        union.push(value);
    });

    arr2.forEach(function(value){
        if(set.has(getValue(value))) {
            intersection.push(value);
            var index = indexOf(difference, value);
            if(index !== -1) {
                difference.splice(index, 1);
            }
        } else {
            union.push(value);
        }
    });

    return {
        intersection: intersection,
        union: union,
        difference: difference
    };
};
