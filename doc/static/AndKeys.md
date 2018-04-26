@function can-query-logic.KeysAnd KeysAnd
@parent can-query-logic.static-types

Create a logical AND of keys and their values.

@signature `new QueryLogic.KeysAnd(values)`

Creates a logical AND of the keys and values in `values`. The following
creates a representation of the set of objects whose `first` property is `"Justin"`
and `age` property is `35`:

```js
var isJustinAnd35 = new QueryLogic.KeysAnd({
    first: "Justin",
    age: 35
})
```

@param {Object} values An object of key-value pairs.  The values of keys might be set representations like
`GreaterThan`.

@body

## Use

Instances of `KeysAnd` can be used to compare to other `KeysAnd` `set.intersection`, `set.difference`, and
`set.union`.  For example:

```js
var isJustinAnd35 = new QueryLogic.KeysAnd({
    first: "Justin",
    age: 35
});

var isChicago = new QueryLogic.KeysAnd({
    location: "Chicago"
});

QueryLogic.set.intersection(isJustinAnd35, isChicago)
//-> new QueryLogic.KeysAnd({ first: "Justin", age: 35, location: "Chicago"})
```

`KeysAnd` can also be used to test if an object belongs to the set:

```js
var isJustinAnd35 = new QueryLogic.KeysAnd({
    first: "Justin",
    age: 35
});

isJustinAnd35.isMember({
    first: "Justin",
    age: 35,
    location: "Chicago"
}) //-> true

isJustinAnd35.isMember({
    first: "Payal",
    age: 35,
    location: "Chicago"
}) //-> false
```

`KeysAnd` can be used recursively to test membership.  For example:

```js
var isJustinPostCollege = new QueryLogic.KeysAnd({
    name: {first: "Justin"},
    age: new QueryLogic.GreaterThan(22)
});

isJustinPostCollege.isMember({
    name: {first: "Justin", last: "Meyer"},
    age: 36
}) //-> true
```
