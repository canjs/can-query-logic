If you are unable to make it match, or you need special
query logic, this section describes how to change it in the following ways:

There are a variety of different ways to configure your `QueryLogic`:

- Easy mode configuration
-

The `can-query` package provides methods that
perform data queries and compare queries against
each other.

For example, the following gets all completed
tasks from a list of tasks:

```js
import {QueryLogic} from "can";

const tasks = [
  {
      id: 1,
      attributes: {
          name: "do the dishes",
          complete: true
      }
  },
  {
      id: 2,
      attributes: {
          name: "wash the car",
          complete: false
      }
  }
];

const query = new QueryLogic();
const result = query.filterMembers({
  where: {complete: true}
}, tasks);

console.log( result ); //-> [
//   {
//       id: 1,
//       attributes: {
//           name: "do the dishes",
//           complete: true
//       }
//   }
// ]
```
@codepen

`can-query` is most unique in that it can
can compare queries themselves.  For example,
the returns a query that represents the
combination of two other queries:

```js
import {QueryLogic} from "can";

const queryLogic = new QueryLogic();

const result = queryLogic.union({
  where: {complete: true}
},{
  where: {complete: false}
});

console.log( result ); //-> {}
```
@codepen

`can-query` uses a [can-query/types/query standard query format] that
looks like:

```js
{
  where: {name: {$ne: null}},
  page: {skip: 20, limit: 10},
  sort: {name: 1}
}
```

`can-query` assumes data in a [JSON API format](http://jsonapi.org/format/).

There are packages that provide functions used to
translate between different query and
data formats.  These are used to configure
your application's [can-service].
