@property {Object} can-query-logic.UNKNOWABLE UNKNOWABLE
@parent can-query-logic.static-types

Represents a non-answer.

@type {Object} Use `QueryLogic.UNKNOWABLE` to signal that __no__ answer to the problem
can be figured out.  

Consider the following difference:

```js
queryLogic.difference({
    filter: {age: 35},
    sort: "name"
},{
    filter: {name: "Justin"},
    sort: "age"
}) //-> {filter: {age: 35, name: {$not: "Justin"}}, sort: "name"}
```

There might be records in the first set that are not in the second set. So there is a result.

Now consider a similar example, but with pagination added:

```js
queryLogic.difference({
    filter: {age: 35},
    sort: "name",
    page: {start: 0, end: 10}
},{
    filter: {name: "Justin"},
    sort: "age",
    page: {start: 0, end: 12}
}) //-> QueryLogic.UNKNOWABLE
```

Because we added pagination,
the answer should paginated data in the result. This means we would have to know
what the actual data set looked like to make a determination if the value
was `EMPTY` or `UNDEFINABLE`. Because we don't have the actual data set, we return `UNKNOWABLE`.

Think of:

- `UNDEFINABLE` as representing a set between `EMPTY` and `UNIVERSAL`
- `UNKNOWABLE` as a set that could be `EMPTY`, `UNIVERSAL` or anywhere between.
