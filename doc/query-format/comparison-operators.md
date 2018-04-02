@typedef {Object} can-query-logic/comparison-operators Comparison Operators
@parent can-query-logic/query-format 1

@description The comparison operators available to the default [can-query-logic/query].

@signature `{ $eq: <value> }`

The `$eq` operator behaves like the [$eq MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/eq/)

@signature `{ $ne: <value> }`

The `$ne` operator behaves like the [$eq MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/ne/)

@signature `{ $in: [value,...] }`

The `$in` operator behaves like the [$in MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/in/)

@signature `{ $nin: [value,...] }`

The `$nin` operator behaves like the [$nin MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/nin/)

@signature `{ $gt: <value> }`

The `$gt` operator behaves like the [$gt MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/gt/)

@signature `{ $gte: <value> }`

The `$gte` operator behaves like the [$gte MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/gte/)

@signature `{ $lt: <value> }`

The `$lt` operator behaves like the [$lt MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/lt/)

@signature `{ $lte: <value> }`

The `$lte` operator behaves like the [$lte MongoDB equivalent](https://docs.mongodb.com/manual/reference/operator/query/lte/)
