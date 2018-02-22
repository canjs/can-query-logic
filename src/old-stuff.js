function Type(NewType, definition){

    Object.defineProperty(NewType,"name",{
        value: name,
        writable: false,
        configurable: true
    });

    Object.setPrototypeOf(NewType.prototype, Object.create(Type.prototype));
    definition = definition || {};
    var subsets = NewType.subsets = new Map();
    var supersets = NewType.supersets = new Map();
    var reverses = [];

    (definition.subsets || []).forEach(function(subsetDef){
        var subsetType, subsetCheck;
        if(Array.isArray(subsetDef)) {
            subsetType = subsetDef[0];
            subsetCheck = subsetDef[1];
        }  else {
            subsetType = subsetDef;
            subsetCheck = function(){ return true; };
        }

        if(subsetType === "self"){
            subsetType = NewType;
        }
        subsets.set(subsetType, subsetCheck);
        reverses.push(function(){
            if(!subsetType.supersets.get(NewType)) {
                subsetType.supersets.set(NewType, function(){
                    return !subsetCheck.apply(this, arguments);
                });
            }
        });

    });
    // Things that are supersets of the current type
    (definition.superset || []).forEach(function(supersetDef){
        var supersetType, supersetCheck;
        if(Array.isArray(supersetDef)) {
            supersetType = supersetDef[0];
            supersetCheck = supersetDef[1];
        }  else {
            supersetType = supersetDef;
            //
            supersetCheck = function(){ return true; };
        }

        if(supersetType === "self"){
            supersetType = NewType;
        }
        supersets.set(supersetType, supersetCheck);
        reverses.push(function(){
            if(!supersetType.subsets.get(NewType)) {
                supersetType.subsets.set(NewType, function(member){
                    return  !supersetCheck.apply(this, arguments);
                });
            }
        });
    });
    reverses.forEach(function(reverse){
        reverse();
    });

    NewType.is = definition.is;


    return NewType;
}

// Create a type that can be both set1 and set2 given the right characteristics
//
Type.intersect = function(IntersectType, set1, set2){
    // NEW TYPE should be "subset" of both set1 and set2
    Type(IntersectType);

    // check that it is a subset of set1
    set1.subsets.set(IntersectType, function(){
        // check that it is a subset of itself
    })
    return Type(name, {
        superset: [
            set1,
            set2 // this might conditionally be supersets based on "internal" values ... should use selfs for both really ...
        ]
    });
};
// new type is a superset of set1 and set2
Type.union = function(name, set1, set2){
    return Type(name, {
        subset: [
            set1, set2
        ]
    });
};

Type.subset = function(set1, set2){
    if(set1 instanceof Type && set2 instanceof Type) {
        var Type1 = set1.constructor,
            Type2 = set2.constructor,
            check;
        if(Type1.subsets.has(Type2)) {
            check = Type1.subsets.get(Type2);
            return check.call(set1, set2);
        }
        if(Type1.supersets.has(Type2)) {
            check = Type1.supersets.get(Type2);
            return check.call(set2, set1);
        }
    } else {
        throw new Error("unable to compare");
    }
};
