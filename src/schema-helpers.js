var canReflect = require("can-reflect");
var set = require("./set");
var canSymbol = require("can-symbol");
module.exports = {

    // Number is a ranged type
    isRangedType: function(Type){
        return Type && canReflect.isConstructorLike(Type) &&
            !set.hasComparisons(Type) &&
            !Type[canSymbol.for("can.SetType")] &&
            Type.prototype.valueOf && Type.prototype.valueOf !== Object.prototype.valueOf;
    }
};
