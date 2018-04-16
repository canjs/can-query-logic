
var set = require("../set");
var types = require("./types");

// this is intended to be used for $or ... it
// ors expected key values
// `{age: 22}` U `{name: "Justin"}`
function OrValues(values) {
    // the if values can be unioned into a single value
    this.values = values;
}
// TODO:
// This needs to unify:
// [
//    { foo: "bar", age: {$gt: 3}},
//    { foo: "bar", age: null}
// ]
// Either with ValueOr, or MaybeOr if key supports it ...
// This can only really happen in serialization.
// We'd have to do some pre-processing always with OR
// create each child, see if they match ... actually that can happen here as
// `age` would be created as the `Maybe` I think
OrValues.prototype.isMember = function(props){
    return this.values.some(function(value){
            return value && value.isMember ?
                value.isMember( props ) : value === props;
    });
};
OrValues.prototype.orValues = function(){
    return this.values;
};

// Or comparisons
set.defineComparison(set.UNIVERSAL, OrValues,{
    difference: function(){
        return set.UNDEFINABLE;
    }
});


module.exports = types.OrValues = OrValues;
