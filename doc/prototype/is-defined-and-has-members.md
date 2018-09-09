@function can-query-logic.prototype.isDefinedAndHasMembers isDefinedAndHasMembers
@parent can-query-logic.prototype

Return if a query can have records.

@signature `queryLogic.isDefinedAndHasMembers(query)`

  Returns `true` if _query_ can have records. It returns `true` if the query is not
  [can-query-logic.EMPTY], [can-query-logic.UNDEFINABLE], or [can-query-logic.UNKNOWABLE].

  ```js
  import QueryLogic from "can";
  const queryLogic = new QueryLogic();

  console.log( queryLogic.isDefinedAndHasMembers({}) ); //-> true
  console.log( queryLogic.isDefinedAndHasMembers(QueryLogic.UNIVERSAL) ); //-> true
  console.log( queryLogic.isDefinedAndHasMembers(QueryLogic.UNDEFINABLE) ); //-> false
  ```
  @codepen

  @param  {can-query-logic/query} a A query.
  @return {Boolean}
