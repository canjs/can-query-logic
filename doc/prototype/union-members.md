@function can-query-logic.prototype.unionMembers unionMembers
@parent can-query-logic.prototype

@description Unifies records from two queries.

@signature `queryLogic.unionMembers(queryA, queryB, aRecords, bRecords)`

Unifies records from `queryA` and `queryB` into a single array of records.

```js
const queryLogic = new QueryLogic({
    identity: ["id"]
});
queryLogic.unionMembers(
  {page: {start: 1, end: 2} },
  {page: {start: 2, end: 4} },
  [{id: 1},{id: 2}],
  [{id: 2},{id: 3},{id: 4}]);
  //-> [{id: 1},{id: 2},{id: 3},{id: 4}]
```

  @param  {can-query-logic/query} queryA A query.
  @param  {can-query-logic/query} queryb A query.
  @param  {Array<Object>} aRecords Set `a`'s records.
  @param  {Array<Object>} bRecords Set `b`'s records.
  @return {Array<Object>} Returns records in both set `a` and set `b`.
