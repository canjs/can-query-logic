@typedef {Object} can-query-logic/query Query
@parent can-query-logic/query-format 0

@description The default structure of objects used to represent
queries.  

@signature `{filter: FILTER, sort: SORT, page: PAGE}`


The following is an example query:

```js
{
    // Selects only the todos that match.
    filter: {
        complete: false
    },
    // Sort the results of the selection
    sort: "name desc",
    // Selects a range of the sorted result
    page: {start: 0, end: 19}
}
```

@param {Object} [filter] The `filter` property is an object of property names to values like:

```js
{
    filter: {
        age: {$gt: 21},
        name: ["Justin","Ramiya"]
    }
}
```

The [can-query-logic/comparison-operators] (`$eq`, `$gt`, `$gte`, `$in`, `$lt`, `$lte`, `$ne`, `$nin`)
are available within `filter`.


@param {String} [sort] The `sort` property is an optional value specifying:
- the property used to sort the results of a query, and
- the direction of the sort (`asc` for ascending or `desc` for descending).

The sort property is specified as a string like `"age desc"`.  If there is no space,
the sort is assumed to be `asc`.

The `sort` property defaults to `"ID_PROPERTY asc"` where `ID_PROPERTY` is the first
id returned by [can-query-logic.prototype.identityKeys].

@param {{start: Number, end: Number}} [page] The optional `page` property selects a range of the sorted result. It's values are inclusive and begin at `0`.  This means that:

 - `{start: 0, end: 1}` - Selects the first two records in the result.
 - `{start: 10, end: 19}` - Selects 10 records after the first 10 records.

The `start` value defaults to `0` and the `end` value defaults to `Infinity`.  This means that:

- `{end: 99}` - Selects the first 100 records.
- `{start: 100}` - Selects all records after the first 100.
