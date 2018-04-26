@function can-query-logic.prototype.union union
@parent can-query-logic.prototype

@description Perform a union of two queries.

@signature `queryLogic.union(queryA, queryB)`

Returns a query that represents the union `queryA` and `queryB`. In set theory, a union is
represented by `A ∪ B`.

```js
queryLogic.union(
  { filter: {completed: true} },
  { filter: {completed: false} }
) //-> { filter: {completed: {$in: [true, false]}} }
```

  @param  {can-query-logic/query} queryA A query.
  @param  {can-query-logic/query} queryB A query.
  @return {can-query-logic/query} Returns a query object, or one of the special sets:
  - [can-query-logic.UNDEFINABLE] - An intersection exists, but it can not be represented with the current logic.
  - [can-query-logic.UNKNOWABLE] - The logic is unable to determine if an intersection exists or not.
