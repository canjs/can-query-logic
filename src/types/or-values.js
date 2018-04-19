
var set = require("../set");
var types = require("./types");

// this is intended to be used for $or ... it
// ors expected key values
// `{age: 22}` U `{name: "Justin"}`
function OrValues(values) {
    // the if values can be unioned into a single value
    this.values = values;
}

OrValues.prototype.isMember = function(props){
    return this.values.some(function(value){
            return value && value.isMember ?
                value.isMember( props ) : value === props;
    });
};


// Or comparisons
set.defineComparison(set.UNIVERSAL, OrValues,{
    difference: function(){
        return set.UNDEFINABLE;
    }
});


module.exports = types.OrValues = OrValues;
