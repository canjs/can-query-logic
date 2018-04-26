@function can-query-logic.prototype.difference difference
@parent can-query-logic.prototype

@description Return a query representing the values that are in one set that are not
in the another set.

@signature `queryLogic.difference(a, b)`

Returns a set that represents the difference of sets _A_ and _B_. In set theory, a difference is
represented by `A \ B`.

```js
var queryLogic = new QueryLogic();


queryLogic.difference({
    filter: { name: {$in: ["Ramiya", "Bohdi"]} }
},{
    filter: { name: "Bohdi" }
}))
//-> {filter: {name: "Ramiya"}}

// A is totally inside B
queryLogic.difference(
    {filter: { name: "Bohdi" }},
    {} )  //-> QueryLogic.EMPTY
```

  @param  {can-query-logic/query} a A query.
  @param  {can-query-logic/query} b A query.
  @return {can-query-logic/query} Returns a query object, or one of the special sets:
  - [can-query-logic.EMPTY] - Query `a` is inside query `b`.
  - [can-query-logic.UNDEFINABLE] - A difference exists, but it can not be represented with the current logic.
  - [can-query-logic.UNKNOWABLE] - The logic is unable to determine if a difference exists or not.
