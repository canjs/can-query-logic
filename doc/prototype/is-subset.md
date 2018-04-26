@function can-query-logic.prototype.isSubset isSubset
@parent can-query-logic.prototype

Return if a query is a subset of another set.

@signature `queryLogic.isSubset(a, b)`

Returns true if _a_ is a subset of _b_.  Equal sets are considered subsets of each other. In set theory, subset is
represented by `A ⊆ B`.

```js
queryLogic.isSubset({filter: {type: "critical"}}, {}) //-> true
queryLogic.isSubset({}, {}) //-> true
```

  @param  {can-query-logic/query} a A query.
  @param  {can-query-logic/query} b A query.
  @return {Boolean} `true` if `a` is a subset of `b`.
