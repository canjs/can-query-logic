var set = require("./set");
module.exports = function(NotIdentity, Identity){
    Identity = Identity || set.Identity;
    // Only difference is needed w/ universal
    set.defineComparison(Identity,set.UNIVERSAL,{
        // A \ B -> what's in b, but not in A
        difference: function(value){
            return new NotIdentity(value);
        }
    });

    // Only difference is needed w/ universal
    set.defineComparison(NotIdentity,set.UNIVERSAL,{
        // A \ B -> what's in b, but not in A
        difference: function(not){
            return not.value;
        }
    });

    set.defineComparison(NotIdentity, NotIdentity,{
        /*
        // not 5 and not 6
        union: function(obj1, obj2){
            // must unroll the value

        },
        // {foo: zed, abc: d}
        intersection: function(obj1, obj2){

        },
        // A \ B -> what's in b, but not in A
        difference: function(obj1, obj2){

        }
        */
    });



    set.defineComparison(NotIdentity, Identity,{
        // not 5 and not 6
        union: function(not, primitive){
            // NOT(5) U 5
            if( set.isEqual( not.value, primitive) ) {
                return set.UNIVERSAL;
            }
            // NOT(4) U 6
            else {
                throw new Error("Not,Identity Union is not filled out");
            }
        }/*,
        // {foo: zed, abc: d}
        intersection: function(obj1, obj2){

        },
        // A \ B -> what's in b, but not in A
        difference: function(obj1, obj2){

        }*/
    });


};
