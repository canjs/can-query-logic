# can-query-logic

[![Build Status](https://travis-ci.org/canjs/can-query-logic.svg?branch=master)](https://travis-ci.org/canjs/can-query-logic)

## Purpose

`can-query-logic` is used to give CanJS an _understanding_ of what __the parameters used to
retrieve a list of data__ represent.  This awareness helps other libraries like
[can-connect] and [can-fixture] provide real-time, caching and other behaviors.

__The parameters used to retrieve a list of data?__

In many applications, you request a list of data by making a `fetch` or `XMLHTTPRequest`
to a url like:

```
/api/todos?filter[complete]=true&sort=name
```

The values after the `?` are used to control the data that comes back. Those values are
deserialized into
a query object look like this:

```js
{
    filter: {complete: true},
    sort: "name"
}
```

This object represents a `Query`. This specific query is for requesting completed todos and have the todos sorted by their _name_.  

A `QueryLogic` instance _understands_ what a `Query` represents. For example, it can filter records
that match a particular query:

```js
var todos = [
  { id: 1, name: "learn CanJS",   complete: true  },
  { id: 2, name: "wash the car",  complete: false },
  { id: 3, name: "do the dishes", complete: true  }
]

var queryLogic = new QueryLogic();

var result = queryLogic.filterMembers({
  filter: {complete: true}
}, todos);

result //-> [
//  { id: 3, name: "do the dishes", complete: true  },
//  { id: 1, name: "learn CanJS",   complete: true  }
//]
```

The `filterMembers` method allows `QueryLogic` to be used similar to a database. `QueryLogic` instances methods help solve other problems too:

- __real-time__ - `.isMember` returns if a particular item
belongs to a query and `.index` returns the location where that item belongs.
- __caching__ - `.isSubset` can tell you if you've already loaded
  data you are looking for.  `.difference` can tell you what data
  you need to load that already isn't in your cache.

In fact, `can-query-logic`'s most unique ability is to be able to directly compare
queries that represent sets of data instead of having to compare
the data itself. For example, if you already loaded all completed todos,
`can-query-logic` can tell you how to get all remaining todos:

```js
var completedTodosQuery = {filter: {complete: false}};
var allTodosQuery = {};
var remainingTodosQuery = queryLogic.difference(allTodosQuery, completedTodosQuery);

remainingTodosQuery //-> {filter: {complete: {$ne: false}}}
```


### Matching the default query structure

By default, `can-query-logic` assumes your service layer will match a default query structure
that looks like:

```js
{
    // Selects only the todos that match.
    filter: {
        complete: {$in: [false, null]}
    },
    // Sort the results of the selection
    sort: "-name",
    // Selects a range of the sorted result
    page: {start: 0, end: 19}
}
```

This structures follows the [Fetching Data JSONAPI specification](http://jsonapi.org/format/#fetching).

There's:

- a [filter](http://jsonapi.org/format/#fetching-filtering) property for filtering records,
- a [sort](http://jsonapi.org/format/#fetching-sorting) property for specifying the order to sort records, and
- a [page](http://jsonapi.org/format/#fetching-pagination) property that selects a range of the sorted result. _The range indexes are inclusive_.


If you control the service layer, we __encourage__ you to make it match the default
query structure.  The default query structure also supports the following comparison operators: `$eq`, `$gt`, `$gte`, `$in`, `$lt`, `$lte`, `$ne`, `$nin`.
