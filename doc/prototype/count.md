@function can-query-logic.prototype.count count
@parent can-query-logic.prototype

@description Return the number of records in a query.

@signature `queryLogic.count(query)` Returns the number of records that might be loaded by the `query`. This returns infinity unless
a `page` is provided

```js
var queryLogic =  new QueryLogic();
queryLogic.count({page: {start: 10, end: 19}}) //-> 10
```

@param  {can-query-logic/query} query
@return {Number} The number of records in the query if known, `Infinity`
if unknown.
