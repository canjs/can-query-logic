@function can-query-logic.prototype.union union
@parent can-query-logic.prototype

@description Perform a union of two queries.

@signature `queryLogic.union(a, b)`

Returns a query that represents the union of queries _A_ and _B_. In set theory, an intersection is
represented by `A ∪ B`.

```js
queryLogic.union(
  { filter: {age: {$gt}} },
  { filter: {completed: true, type: "critical"} }
) //-> {filter: {completed: true, due: "tomorrow", type: "critical"}}
```

  @param  {can-query-logic/query} a A query.
  @param  {can-query-logic/query} b A query.
  @return {can-query-logic/query} Returns a query object, or one of the special sets:
  - [can-query-logic.UNDEFINABLE] - An intersection exists, but it can not be represented with the current logic.
  - [can-query-logic.UNKNOWABLE] - The logic is unable to determine if an intersection exists or not.
