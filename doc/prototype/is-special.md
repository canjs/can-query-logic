@function can-query-logic.prototype.isSpecial isSpecial
@parent can-query-logic.prototype

Return if a query is a special query.

@signature `queryLogic.isSpecial(query)`

Returns `true` if query is not
[can-query-logic.UNIVERSAL], [can-query-logic.EMPTY], [can-query-logic.UNDEFINABLE], or [can-query-logic.UNKNOWABLE].

```js
import QueryLogic from "can-query-logic";
var queryLogic = new QueryLogic();
queryLogic.isDefinedAndHasMembers({}) //-> true
queryLogic.isDefinedAndHasMembers(QueryLogic.UNIVERSAL) //-> false
queryLogic.isDefinedAndHasMembers(QueryLogic.UNDEFINABLE) //-> false
```

  @param  {can-query-logic/query} a A query.
  @return {Boolean}
