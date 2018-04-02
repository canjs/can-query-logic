var canReflect = require("can-reflect");

module.exports = function updateExceptId(algebra, obj, data) {
    algebra.identityKeys().forEach(function(key){
        var id= canReflect.getKeyValue(obj, key);
        if(id!== undefined) {
            canReflect.setKeyValue(data, key, id );
        }
    });

    canReflect.updateDeep(obj, data);
};
