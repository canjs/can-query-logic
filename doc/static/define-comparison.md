@function can-query-logic.defineComparison defineComparison
@parent can-query-logic.static


@signature `QueryLogic.defineComparison(TypeA, TypeB, comparisons)`

This registers comparison operators between the `TypeA` and `TypeB`
types. For example, the following might define how to compare
the `GreaterThan` type to the `LessThan` type:

```js
QueryLogic.defineComparison(GreaterThan, LessThan, {
    union(greaterThan, lessThan){
        if(greaterThan.value < lessThan.value) {
            return QueryLogic.UNIVERSAL
        } else {
            return new QueryLogic.ValueOr([greaterThan, lessThan]);
        }
    },
    intersection(greaterThan, lessThan){
        if(greaterThan.value < lessThan.value) {
            return new QueryLogic.ValueAnd([greaterThan, lessThan]);
        } else {
            return QueryLogic.EMPTY;
        }
    },
    difference(greaterThan, lessThan){
        if(greaterThan.value < lessThan.value) {
            return new QueryLogic.GreaterThanEqual(lessThan.value)
        } else {
            return greaterThan;
        }
    }
})
```

Note, for comparisons of two different types, you will also want to
define the reverse `difference` like:

```js
QueryLogic.defineComparison(LessThan, GreaterThan, {
    difference(lessThan, greaterThan) {
        if(greaterThan.value < lessThan.value) {
            return new QueryLogic.LessThanEqual(lessThan.value);
        } else {
            return lessThan;
        }
    }
})
```

`union` and `intersection` isn't necessary because they are symmetrical (Ex: `a U b = b U a`).

Also, for many types you will want to define the difference between the
[can-query-logic.UNIVERSAL] set and the type:

```js
QueryLogic.defineComparison(QueryLogic.UNIVERSAL, GreaterThan, {
    difference(universe, greaterThan) {
        return new QueryLogic.LessThanEqual(greaterThan.value);
    }
})
```


@param {function} TypeA A constructor function.
@param {function} TypeB A constructor function.
@param {Object} comparisons An object of one or more of the following comparison functions:

 - `union(typeAInstance, typeBInstance)` - Returns a representation of the union of the two sets.
 - `intersection(typeAInstance, typeBInstance)` - Returns a representation of the intersection of the two sets.
 - `difference(typeAInstance, typeBInstance)` - Returns a representation of the difference of the two sets.

 The special sets can be returned from these functions to indicate:

 - [can-query-logic.EMPTY] - The empty set.
 - [can-query-logic.UNDEFINABLE] - A representation of the result of the operation exists, but there is no way to express it.
 - [can-query-logic.UNKNOWABLE] - It is unknown if a representation of the operations result exists.


@body

## Use

If you want total control over filtering logic, you can create a `SetType` that
provides the following:

- methods:
  - `can.isMember` - A function that returns if an object belongs to the query.
  - `can.serialize` - A function that returns the serialized form of the type for the query.
- comparisons:
  - `union` - The result of taking a union of two `SetType`s.
  - `intersection` - The result of taking an intersection of two `SetType`s.
  - `difference` - The result of taking a difference of two `SetType`s.

The following creates a `SearchableStringSet` that is able to perform searches that match
the provided text like:

```js
var recipes = [
    {id: 1, name: "garlic chicken"},
    {id: 2, name: "ice cream"},
    {id: 3, name: "chicken kiev"}
];

var result = queryLogic.filterMembers({
    filter: {name: "chicken"}
}, recipes);

result //-> [
       // {id: 1, name: "garlic chicken"},
       // {id: 3, name: "chicken kiev"}
       // ]
```

Notice how all values that match `chicken` are returned.


```js
// Takes the value of `name` (ex: `"chicken"`)
function SearchableStringSet(value) {
    this.value = value;
}

canReflect.assignSymbols(SearchableStringSet.prototype,{
    // Returns if the name on a todo is actually a member of the set.
    "can.isMember": function(value){
        return value.includes(this.value);
    },
    // Converts back to a value that can be in a query.
    "can.serialize": function(){
        return this.value;
    }
});

// Specify how to do the fundamental set comparisons.
QueryLogic.defineComparison(SearchableStringSet,SearchableStringSet,{
    // Return a set that would load all records in searchA and searchB.
    union(searchA, searchB){
        // If searchA's text contains searchB's text, then
        // searchB will include searchA's results.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` ∪ B:`foo` => `foo`
            return searchB;
        }
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` ∪ B:`food` => `foo`
            return searchA;
        }
        // A:`ice` ∪ B:`cream` => `ice` || `cream`
        return new QueryLogic.ValueOr([searchA, searchB]);
    },
    // Return a set that would load records shared by searchA and searchB.
    intersection(searchA, searchB){
        // If searchA's text contains searchB's text, then
        // searchA is the shared search results.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` ∩ B:`foo` => `food`
            return searchA;
        }
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` ∩ B:`food` => `food`
            return searchB;
        }
        // A:`ice` ∩ B:`cream` => `ice` && `cream`
        // But there is no `QueryLogic.AndValues`,
        // So we return `UNDEFINABLE`.
        return QueryLogic.UNDEFINABLE;
    },
    // Return a set that would load records in searchA that are not in
    // searchB.
    difference(searchA, searchB){
        // if searchA's text contains searchB's text, then
        // searchA has nothing outside what searchB would return.
        if(searchA.value.includes(searchB.value)) {
            // A:`food` \ B:`foo` => ∅
            return QueryLogic.EMPTY;
        }
        // If searchA has results outside searchB's results
        // then there are records, but we aren't able to
        // create a string that represents this.
        if(searchB.value.includes(searchA.value)) {
            // A:`foo` \ B:`food` => UNDEFINABLE
            return QueryLogic.UNDEFINABLE;
        }

        // A:`ice` \ B:`cream` => `ice` && !`cream`
        // If there's another situation, we
        // aren't able to express the difference
        // so we return UNDEFINABLE.
        return QueryLogic.UNDEFINABLE;
    }
});
```

## Testing

To test `SearchableStringSet`, you can use `QueryLogic.set.union`, `QueryLogic.set.intersection`
and `QueryLogic.set.difference` as follows:


```js
test("SearchableStringSet", function(assert){

    assert.deepEqual(
        QueryLogic.set.union(
            new SearchableStringSet("foo"),
            new SearchableStringSet("food")
        ),
        new SearchableStringSet("foo"),
        "union works"
    );
})
```
