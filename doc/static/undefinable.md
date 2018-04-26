@property {Object} can-query-logic.UNDEFINABLE UNDEFINABLE
@parent can-query-logic.static-types

Represents a set that contains values, but can not be defined and is not the [can-query-logic.UNIVERSAL] set.

@type {Object} Use `QueryLogic.UNDEFINABLE` to represent that a set exists, but
it can not be represented by the available set types.  For example, consider performing
a difference of people in Chicago compared to people named Justin who are 35:

```js
var inChicago = new QueryLogic.KeysAnd({location: "Chicago"})
var isJustinAnd35 = new QueryLogic.KeysAnd({name: "Justin", age: 35})

QueryLogic.difference(inChicago, isJustinAnd35) //-> ???
```

If `QueryLogic` supported a `Not` and an expanded `ValueAnd` type, the difference could be described as:

```js
new QueryLogic.ValueAnd([
    inChicago,
    new QueryLogic.Not(isJustinAnd35)
])
```

Currently, as `QueryLogic` does not fully support `Not` and `ValueAnd` used this way, it
returns `QueryLogic.UNDEFINABLE`.  This indicates a difference exists (the existence of a difference is important for determining superset and subset), but we aren't able to express it.

Use [can-query-logic.UNKNOWABLE] to represent
