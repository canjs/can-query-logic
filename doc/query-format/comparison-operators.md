@typedef {Object} can-query-logic/comparison-operators Comparison Operators
@parent can-query-logic/query-format 1

@description The comparison operators available to the default [can-query-logic/query].

@signature `{ $eq: <value> }`

  The `$eq` operator behaves like the [$eq MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/eq/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$eq: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age: 2}]
  );

  console.log( filter ); //-> [{id: 2,age: 3},{id: 3,age: 3}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $ne: <value> }`

  The `$ne` operator behaves like the [$ne MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/ne/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$ne: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age: 2}]
  );

  console.log( filter ); //-> [{id: 1,age: 4},{id: 4,age: 2}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $in: [value,...] }`

  The `$in` operator behaves like the [$in MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/in/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$in: [4, 2]} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age: 2}]
  );

  console.log( filter ); //-> [{id: 1,age: 4},{id: 4,age: 2}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $nin: [value,...] }`

  The `$nin` operator behaves like the [$nin MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/nin/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$nin: [4, 2]} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age: 2}]
  );

  console.log( filter ); //-> [{id: 2,age: 3},{id: 3,age: 3}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $gt: <value> }`

  The `$gt` operator behaves like the [$gt MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/gt/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$gt: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age:2}]
  );

  console.log( filter ); //-> [{id: 1,age: 4}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $gte: <value> }`

  The `$gte` operator behaves like the [$gte MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/gte/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$gte: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age:2}]
  );

  console.log( filter ); //-> [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $lt: <value> }`

  The `$lt` operator behaves like the [$lt MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/lt/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$lt: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age:2}]
  );

  console.log( filter ); //-> [{id: 4,age:2}]
  ```
  @codepen
  @highlight 6,only

@signature `{ $lte: <value> }`

  The `$lte` operator behaves like the [$lte MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/lte/)

  ```js
  import {QueryLogic} from "can";

  const queryLogic = new QueryLogic();

  const filter = queryLogic.filterMembers(
    { filter: { age: {$lte: 3} } },
    [{id: 1,age: 4},{id: 2,age: 3},{id: 3,age: 3},{id: 4,age:2}]
  );

  console.log( filter ); //-> [{id: 2,age: 3},{id: 3,age: 3},{id: 4,age:2}]
  ```
  @codepen
  @highlight 6,only
