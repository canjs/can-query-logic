@function can-query-logic.prototype.isMember isMember
@parent can-query-logic.prototype

@description Return if a record belongs to a query.

@signature `queryLogic.isMember(query, record)`

 Used to tell if the `set` contains the instance object `record`.

 ```js
 queryLogic.isMember(
   {filter: {playerId: 5}},
   {id: 5, type: "3pt", playerId: 5, gameId: 7}
 ) //-> true
 ```

 Use [can-query-logic.prototype.index] to know where to insert the `record` into a list of
 records.  

 `isMember` ignores the query's `page` values and will return `true` if the query's `filter` matches
 the data.  For example, "Zebra" might be the last record if all _animals_ were sorted by name. However,
 `isMember` will still return true:

 ```js
 animalQueryLogic.isMember(
   {sort: "name", page: {start: 0, end: 0}},
   {id: 1, name: "Zebra"}
 ) //-> true
 ```

 This is a limitation of QueryLogic when used with paginated sets of data.

   @param  {can-query-logic/query} set A set.
   @param  {Object} record A JavaScript object of key-value pairs.
   @return {Boolean} Returns `true` if `record` belongs in `set` and
   `false` it not.


@body

## Dealing with paginated sets

If you have paginated data, and you would like to build a real-time application that knows if some newly created
data belongs within that paginated set, you will need to build a custom real time [can-connect] behavior.

If you are encountering this problem, please post a question on the forums and Justin will detail how to solve this problem.
