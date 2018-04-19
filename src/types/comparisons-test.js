var compare = require("./comparisons");
var set = require("../set");
var is = compare;

QUnit.module("can-query-logic/types/comparisons")

var tests = {
    // In
    In_In: {
        union: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.union(isIn5, isIn6),
                new is.In([5,6])
            );
        },
        intersection: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.intersection(isIn5, isIn6),
                set.EMPTY
            );

            var in13 = new is.In([1,2,3]),
                in24 = new is.In([2,3,4]);
            assert.deepEqual(
                set.intersection(in13, in24),
                new is.In([2,3])
            );
        },
        difference: function(assert){
            var isIn5 = new is.In([5]),
                isIn6 = new is.In([6]);
            assert.deepEqual(
                set.difference(isIn5, isIn6),
                isIn5
            );

            var in13 = new is.In([1,2,3]),
                in24 = new is.In([2,3,4]);
            assert.deepEqual(
                set.difference(in13, in24),
                new is.In([1])
            );
        }
    },
    In_isMember: function(assert){
        assert.ok( new is.In([5]).isMember(5) );
        assert.notOk( new is.In([5]).isMember(6) );
        assert.ok( new is.In([5,-1]).isMember(-1) );
    },
    UNIVERSAL_In: {
        difference: function(assert){
            var isIn5 = new is.In([5]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, isIn5),
                new is.NotIn([5])
            );

            var in13 = new is.In([1,2,3]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, in13),
                new is.NotIn([1,2,3])
            );
        }
    },
    In_NotIn: {
        union: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.NotIn([6,7]);

            assert.deepEqual(
                set.union(a, b),
                new is.NotIn([7])
            );

            a = new is.In([5,6]);
            b = new is.NotIn([5,6]);

            assert.deepEqual(
                set.union(a, b),
                set.UNIVERSAL
            );
        },
        intersection: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.NotIn([6,7]);

            assert.deepEqual(
                set.intersection(a, b),
                new is.In([5])
            );

            a = new is.In([5,6]);
            b = new is.NotIn([5,6]);

            assert.deepEqual(
                set.intersection(a, b),
                set.EMPTY
            );
        },
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.NotIn([6,7]);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([6])
            );

            a = new is.In([5,6]);
            b = new is.NotIn([5,6]);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([5,6])
            );

            a = new is.In([5,6]);
            b = new is.NotIn([8,9]);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );
        }
    },
    NotIn_In: {
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.NotIn([6,7]);

            assert.deepEqual(
                set.difference(b, a),
                new is.NotIn([6,7,5])
            );

            a = new is.In([5,6]);
            b = new is.NotIn([5,6]);

            assert.deepEqual(
                set.difference(b, a),
                new is.NotIn([5,6])
            );

        }
    },

    In_GreaterThan: {
        union: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThan(3);

            assert.deepEqual(
                set.union(a, b),
                b
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(3);

            assert.deepEqual(
                set.union(a, b),
                // OR( {$in: [2,4]}, {$gt: 3} )
                new is.Or([new is.In([2]), b])
                // set.UNDEFINABLE
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(2);

            // TODO: this could actually just be new is.GreaterThan(2)
            assert.deepEqual(
                set.union(a, b),
                new is.Or([new is.In([2]), b])
            );
        },
        intersection: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThan(3);

            assert.deepEqual(
                set.intersection(a, b),
                a
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(3);

            assert.deepEqual(
                set.intersection(a, b),
                new is.In([4])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(8);

            assert.deepEqual(
                set.intersection(a, b),
                set.EMPTY
            );
        },
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThan(3);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(8);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2,4])
            );

            a = new is.In([null,undefined]);
            b = new is.GreaterThan(8);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([null,undefined]),
                "handles weird types"
            );
        }
    },
    GreaterThan_In: {
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThan(3);

            var difference = set.difference(b, a);

            assert.deepEqual(
                difference,
                new is.And([new is.NotIn([5,6]), b])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(3);

            assert.deepEqual(
                set.difference(b, a),
                new is.And([new is.NotIn([4]), b])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThan(8);

            assert.deepEqual(
                set.difference(b, a),
                b
            );
        }
    },

    In_GreaterThanEqual: {
        union: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.union(a, b),
                b
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.union(a, b),
                new is.Or([new is.In([2]), b])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(2);

            assert.deepEqual(
                set.union(a, b),
                b
            );
        },
        intersection: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.intersection(a, b),
                a
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.intersection(a, b),
                new is.In([4])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(8);

            assert.deepEqual(
                set.intersection(a, b),
                set.EMPTY
            );
        },
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(8);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2,4])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(2);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );
        }
    },
    GreaterThanEqual_In: {
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.GreaterThanEqual(3);

            var difference = set.difference(b, a);

            assert.deepEqual(
                difference,
                new is.And([new is.NotIn([5,6]), b])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(3);

            assert.deepEqual(
                set.difference(b, a),
                new is.And([new is.NotIn([4]), b])
            );

            a = new is.In([2,4]);
            b = new is.GreaterThanEqual(8);

            assert.deepEqual(
                set.difference(b, a),
                b
            );
        }
    },

    In_LessThan: {
        union: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThan(7);

            assert.deepEqual(
                set.union(a, b),
                b
            );

            a = new is.In([2,4]);
            b = new is.LessThan(3);

            assert.deepEqual(
                set.union(a, b),
                new is.Or([new is.In([4]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(4);

            // TODO: this can be new is.LessThanEqual(4)
            assert.deepEqual(
                set.union(a, b),
                new is.Or([new is.In([4]), b])
            );
        },
        intersection: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThan(7);

            assert.deepEqual(
                set.intersection(a, b),
                a
            );

            a = new is.In([2,4]);
            b = new is.LessThan(3);

            assert.deepEqual(
                set.intersection(a, b),
                new is.In([2])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(1);

            assert.deepEqual(
                set.intersection(a, b),
                set.EMPTY
            );
        },
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThan(7);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            a = new is.In([5,6]);
            b = new is.LessThan(6);
            assert.deepEqual(
                set.difference(a, b),
                new is.In([6])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([4])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(1);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2,4])
            );

        }
    },
    LessThan_In: {
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThan(7);

            var difference = set.difference(b, a);

            assert.deepEqual(
                difference,
                new is.And([new is.NotIn([5,6]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(3);

            assert.deepEqual(
                set.difference(b, a),
                new is.And([new is.NotIn([2]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThan(1);

            assert.deepEqual(
                set.difference(b, a),
                b
            );
        }
    },

    In_LessThanEqual: {
        union: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThanEqual(7);

            assert.deepEqual(
                set.union(a, b),
                b
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.union(a, b),
                new is.Or([new is.In([4]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(4);

            assert.deepEqual(
                set.union(a, b),
                b
            );
        },
        intersection: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThanEqual(7);

            assert.deepEqual(
                set.intersection(a, b),
                a
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.intersection(a, b),
                new is.In([2])
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(1);

            assert.deepEqual(
                set.intersection(a, b),
                set.EMPTY
            );
        },
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThanEqual(7);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            a = new is.In([5,6]);
            b = new is.LessThanEqual(6);
            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([4])
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(1);

            assert.deepEqual(
                set.difference(a, b),
                new is.In([2,4])
            );

        }
    },
    LessThanEqual_In: {
        difference: function(assert) {
            var a = new is.In([5,6]);
            var b = new is.LessThanEqual(7);

            var difference = set.difference(b, a);

            assert.deepEqual(
                difference,
                new is.And([new is.NotIn([5,6]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.difference(b, a),
                new is.And([new is.NotIn([2]), b])
            );

            a = new is.In([2,4]);
            b = new is.LessThanEqual(1);

            assert.deepEqual(
                set.difference(b, a),
                b
            );
        }
    },

    // NotIn
    NotIn_NotIn: {
        // if there's some intersection ... then that's ok
        union: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);
            assert.deepEqual(
                set.union(isNotIn5, isNotIn6),
                set.UNIVERSAL
            );


            var a = new is.NotIn([4,5]),
                b = new is.NotIn([5,6]);
            assert.deepEqual(
                set.union(a, b),
                new is.NotIn([5])
            );
        },
        intersection: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);

            assert.deepEqual(
                set.intersection(isNotIn5, isNotIn6),
                new is.NotIn([5,6])
            );

            var in13 = new is.NotIn([1,2,3]),
                in24 = new is.NotIn([2,3,4]);
            assert.deepEqual(
                set.intersection(in13, in24),
                new is.NotIn([1,2,3,4])
            );
        },
        difference: function(assert){
            var isNotIn5 = new is.NotIn([5]),
                isNotIn6 = new is.NotIn([6]);
            assert.deepEqual(
                set.difference(isNotIn5, isNotIn6),
                new is.In([5])
            );

            var a = new is.NotIn([2,3]),
                b = new is.NotIn([3,4]);
            assert.deepEqual(
                set.difference(a, b),
                new is.In([2])
            );
        }
    },
    UNIVERSAL_NotIn: {
        difference: function(assert){
            var a = new is.NotIn([5]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, a),
                new is.In([5])
            );

            var b = new is.NotIn([1,2,3]);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, b),
                new is.In([1,2,3])
            );
        }
    },

    NotIn_GreaterThan: {},
    GreaterThan_NotIn: {},

    NotIn_GreaterThanEqual: {},
    GreaterThanEqual_NotIn: {},

    NotIn_LessThan: {},
    LessThan_NotIn: {},

    NotIn_LessThanEqual: {
        difference: function(assert){
            var a = new is.NotIn([5,6]);
            var b = new is.LessThanEqual(7);

            assert.deepEqual(
                set.difference(a, b),
                new is.GreaterThan(7)
            );

            a = new is.NotIn([5,6]);
            b = new is.LessThanEqual(6);
            assert.deepEqual(
                set.difference(a, b),
                new is.GreaterThan(6)
            );

            a = new is.NotIn([2,4]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.And([new is.NotIn([4]), new is.GreaterThan(3)])
            );

            a = new is.NotIn([2,4]);
            b = new is.LessThanEqual(1);

            assert.deepEqual(
                set.difference(a, b),
                new is.And([new is.NotIn([2,4]), new is.GreaterThan(1)])
            );

            a = new is.NotIn([undefined]);
            b = new is.LessThanEqual(3);

            assert.deepEqual(
                set.difference(a, b),
                new is.And([new is.NotIn([undefined]), new is.GreaterThan(3)])
            );
        }
    },
    LessThanEqual_NotIn: {},

    // GreaterThan
    GreaterThan_GreaterThan: {
        union: function(assert) {
            var a = new is.GreaterThan(5),
                b = new is.GreaterThan(6);
            assert.deepEqual(
                set.union(a, b),
                a
            );

            a = new is.GreaterThan("foo");
            b = new is.GreaterThan("bar");
            assert.deepEqual(
                set.union(a, b),
                b
            );
        },
        intersection: function(assert){
            var a = new is.GreaterThan(5),
                b = new is.GreaterThan(6);
            assert.deepEqual(
                set.intersection(a, b),
                b
            );

            a = new is.GreaterThan("foo");
            b = new is.GreaterThan("bar");
            assert.deepEqual(
                set.intersection(a, b),
                a
            );
        },
        difference: function(assert){
            var a = new is.GreaterThan(5),
                b = new is.GreaterThan(6);

            assert.deepEqual(
                set.difference(a, b),
                // AND( {$gt:5}, {$lte: 6} )
                new is.And([a, new is.LessThanEqual(6)])
                //set.UNDEFINABLE
            );

            a = new is.GreaterThan(5);
            b = new is.GreaterThan(6);

            assert.deepEqual(
                set.difference(b, a),
                set.EMPTY
            );
        }
    },
    UNIVERSAL_GreaterThan: {
        difference: function(assert){
            var a = new is.GreaterThan(5);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, a),
                new is.LessThanEqual(5)
            );
        }
    },
	GreaterThan_GreaterThanEqual: {
		union: function(assert) {
			var a = new is.GreaterThan(5),
				b = new is.GreaterThanEqual(6);
			assert.deepEqual(
				set.union(a, b),
				a
			);

			a = new is.GreaterThan("foo");
			b = new is.GreaterThanEqual("bar");
			assert.deepEqual(
				set.union(a, b),
				b
			);
		},
		intersection: function(assert){
			var a = new is.GreaterThan(5),
				b = new is.GreaterThanEqual(6);
			assert.deepEqual(
				set.intersection(a, b),
				b
			);

			a = new is.GreaterThan("foo");
			b = new is.GreaterThanEqual("bar");
			assert.deepEqual(
				set.intersection(a, b),
				a
			);
		},
		difference: function(assert){
			var a = new is.GreaterThan(5),
				b = new is.GreaterThanEqual(6);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$gt:5}, {$lt: 6} )
				new is.And([a, new is.LessThan(6)])
				//set.UNDEFINABLE
			);

			a = new is.GreaterThan(6);
			b = new is.GreaterThanEqual(5);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);

			a = new is.GreaterThan(5);
			b = new is.GreaterThanEqual(5);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);
		}
	},
	GreaterThanEqual_GreaterThan: {
		union: function(assert) {
			var a = new is.GreaterThanEqual(5),
				b = new is.GreaterThan(6);
			assert.deepEqual(
				set.union(a, b),
				a
			);

			a = new is.GreaterThanEqual("foo");
			b = new is.GreaterThan("bar");
			assert.deepEqual(
				set.union(a, b),
				b
			);
		},
		intersection: function(assert){
			var a = new is.GreaterThanEqual(5),
				b = new is.GreaterThan(6);
			assert.deepEqual(
				set.intersection(a, b),
				b
			);

			a = new is.GreaterThanEqual("foo");
			b = new is.GreaterThan("bar");
			assert.deepEqual(
				set.intersection(a, b),
				b
			);
		},
		difference: function(assert){
			var a = new is.GreaterThanEqual(5),
				b = new is.GreaterThan(6);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$gte:5}, {$lte: 6} )
				new is.And([a, new is.LessThanEqual(6)])
				//set.UNDEFINABLE
			);

			a = new is.GreaterThanEqual(6);
			b = new is.GreaterThan(5);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);

			a = new is.GreaterThanEqual(5);
			b = new is.GreaterThan(5);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$gte:5}, {$lte: 5} )
				new is.In([5])
				//set.UNDEFINABLE
			);
		}
	},

    GreaterThan_LessThan: {},
    LessThan_GreaterThan: {},

    GreaterThan_LessThanEqual: {},
    LessThanEqual_GreaterThan: {},

    // GreaterThanEqual
    GreaterThanEqual_GreaterThanEqual: {
        union: function(assert) {
            var a = new is.GreaterThanEqual(5),
                b = new is.GreaterThanEqual(6);
            assert.deepEqual(
                set.union(a, b),
                a
            );

            a = new is.GreaterThanEqual("foo");
            b = new is.GreaterThanEqual("bar");
            assert.deepEqual(
                set.union(a, b),
                b
            );
        },
        intersection: function(assert){
            var a = new is.GreaterThanEqual(5),
                b = new is.GreaterThanEqual(6);
            assert.deepEqual(
                set.intersection(a, b),
                b
            );

            a = new is.GreaterThanEqual("foo");
            b = new is.GreaterThanEqual("bar");
            assert.deepEqual(
                set.intersection(a, b),
                a
            );
        },
        difference: function(assert){
            var a = new is.GreaterThanEqual(5),
                b = new is.GreaterThanEqual(6);

            assert.deepEqual(
                set.difference(a, b),
                // AND( {$gte:5}, {$lt: 6} )
                new is.And([ a, new is.LessThan(6) ])
                // set.UNDEFINABLE
            );

            a = new is.GreaterThanEqual(5);
            b = new is.GreaterThanEqual(6);

            assert.deepEqual(
                set.difference(b, a),
                set.EMPTY
            );
        }
    },
    UNIVERSAL_GreaterThanEqual: {
        difference: function(assert){
            var a = new is.GreaterThanEqual(5);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, a),
                new is.LessThan(5)
            );
        }
    },

    GreaterThanEqual_LessThan: {},
    LessThan_GreaterThanEqual: {},

    GreaterThanEqual_LessThanEqual: {},
    LessThanEqual_GreaterThanEqual: {},

    // LessThan
    LessThan_LessThan: {
        union: function(assert) {
            var a = new is.LessThan(5),
                b = new is.LessThan(6);
            assert.deepEqual(
                set.union(a, b),
                b
            );

            a = new is.LessThan("foo");
            b = new is.LessThan("bar");
            assert.deepEqual(
                set.union(a, b),
                a
            );
        },
        intersection: function(assert){
            var a = new is.LessThan(5),
                b = new is.LessThan(6);
            assert.deepEqual(
                set.intersection(a, b),
                a
            );

            a = new is.LessThan("foo");
            b = new is.LessThan("bar");
            assert.deepEqual(
                set.intersection(a, b),
                b
            );
        },
        difference: function(assert){
            var a = new is.LessThan(5),
                b = new is.LessThan(6);

            assert.deepEqual(
                set.difference(a, b),
                set.EMPTY
            );

            assert.deepEqual(
                set.difference(b, a),
                // AND({lt: 6}, {gte: 5})
                new is.And([ b, new is.GreaterThanEqual(5) ])
                // set.UNDEFINABLE
            );
        }
    },
    UNIVERSAL_LessThan: {
        difference: function(assert){
            var a = new is.LessThan(5);
            assert.deepEqual(
                set.difference(set.UNIVERSAL, a),
                new is.GreaterThanEqual(5)
            );
        }
    },

	LessThan_LessThanEqual: {
		union: function(assert) {
			var a = new is.LessThan(5),
				b = new is.LessThanEqual(6);
			assert.deepEqual(
				set.union(a, b),
				b
			);

			a = new is.LessThan("foo");
			b = new is.LessThanEqual("bar");
			assert.deepEqual(
				set.union(a, b),
				a
			);
		},
		intersection: function(assert){
			var a = new is.LessThan(5),
				b = new is.LessThanEqual(6);
			assert.deepEqual(
				set.intersection(a, b),
				a
			);

			a = new is.LessThan("foo");
			b = new is.LessThanEqual("bar");
			assert.deepEqual(
				set.intersection(a, b),
				b
			);
		},
		difference: function(assert){
			var a = new is.LessThan(5),
				b = new is.LessThanEqual(6);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);

			a = new is.LessThan(6);
			b = new is.LessThanEqual(5);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$lt:6}, {$gt: 5} )
				new is.And([a, new is.GreaterThan(5)])
			);

			a = new is.LessThan(7);
			b = new is.LessThanEqual(5);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$lte:7}, {$gt: 5} )
				new is.And([a, new is.GreaterThan(5)])
				// set.UNDEFINABLE
			);

			a = new is.LessThan(5);
			b = new is.LessThanEqual(5);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);
		}
	},
	LessThanEqual_LessThan: {
		union: function(assert) {
			var a = new is.LessThanEqual(5),
				b = new is.LessThan(6);
			assert.deepEqual(
				set.union(a, b),
				b
			);

			a = new is.LessThanEqual("foo");
			b = new is.LessThan("bar");
			assert.deepEqual(
				set.union(a, b),
				a
			);
		},
		intersection: function(assert){
			var a = new is.LessThanEqual(5),
				b = new is.LessThan(6);
			assert.deepEqual(
				set.intersection(a, b),
				a
			);

			a = new is.LessThanEqual("foo");
			b = new is.LessThan("bar");
			assert.deepEqual(
				set.intersection(a, b),
				b
			);
		},
		difference: function(assert){
			var a = new is.LessThanEqual(5),
				b = new is.LessThan(6);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);

			a = new is.LessThanEqual(6);
			b = new is.LessThan(5);

			assert.deepEqual(
				set.difference(a, b),
				// AND( {$lte:6}, {$gte: 5} )
				new is.And([a, new is.GreaterThanEqual(5)])
			);

			a = new is.LessThanEqual(5);
			b = new is.LessThan(5);

			assert.deepEqual(
				set.difference(a, b),
				new is.In([5])
			);
		}
	},

    // LessThanEqual
	LessThanEqual_LessThanEqual: {
		union: function(assert) {
			var a = new is.LessThanEqual(5),
				b = new is.LessThanEqual(6);
			assert.deepEqual(
				set.union(a, b),
				b
			);

			a = new is.LessThanEqual("foo");
			b = new is.LessThanEqual("bar");
			assert.deepEqual(
				set.union(a, b),
				a
			);
		},
		intersection: function(assert){
			var a = new is.LessThanEqual(5),
				b = new is.LessThanEqual(6);
			assert.deepEqual(
				set.intersection(a, b),
				a
			);

			a = new is.LessThanEqual("foo");
			b = new is.LessThanEqual("bar");
			assert.deepEqual(
				set.intersection(a, b),
				b
			);
		},
		difference: function(assert){
			var a = new is.LessThanEqual(5),
				b = new is.LessThanEqual(6);

			assert.deepEqual(
				set.difference(a, b),
				set.EMPTY
			);

			assert.deepEqual(
				set.difference(b, a),
				// AND( { $lte: 6 }, { $gt:  5} )
				new is.And([ b, new is.GreaterThan(5) ])
			);
		}
	},
	UNIVERSAL_LessThanEqual: {
		difference: function(assert){
			var a = new is.LessThanEqual(5);
			assert.deepEqual(
				set.difference(set.UNIVERSAL, a),
				new is.GreaterThan(5)
			);
		}
	}
};

var makeTests = function(test, name1, name2, reversed){
    if(reversed) {
        if(test.difference) {
            QUnit.test(name1+" difference "+name2, test.difference);
        } else {
            QUnit.skip(""+name1+" difference "+name2, function(){});
        }
    } else {
        ["union","intersection","difference"].forEach(function(prop){
            if(test[prop]) {
                QUnit.test(name1+" "+prop+" "+name2, test[prop]);
            } else {
                QUnit.skip(""+name1+" "+prop+" "+name2, function(){});
            }
        });
    }
};

var names = Object.keys(compare);
names.forEach(function(name1, i){
    if(!tests[name1+"_"+name1]) {
        QUnit.skip(""+name1+"_"+name1+"", function(){});
    } else {
        makeTests(tests[name1+"_"+name1], name1, name1);
    }

    if(!tests[name1+"_isMember"]) {
        QUnit.skip(""+name1+"_isMember", function(){});
    } else {
        QUnit.test(name1+"_isMember", tests[name1+"_isMember"]);
    }

    if(!tests["UNIVERSAL_"+name1]) {
        QUnit.skip("UNIVERSAL_"+name1+"", function(){});
    } else {
        makeTests(tests["UNIVERSAL_"+name1], "UNIVERSAL", name1, true);
    }

    for(var j=i+1; j < names.length; j++) {
        var name2 = names[j];
        if(!tests[name1+"_"+name2]) {
            QUnit.skip(""+name1+"_"+name2+"", function(){});
        } else {
            makeTests(tests[name1+"_"+name2], name1, name2);
        }
        if(!tests[name2+"_"+name1]) {
            QUnit.skip(""+name2+"_"+name1+"", function(){});
        } else {
            makeTests(tests[name2+"_"+name1], name2, name1, true);
        }
    }
});



QUnit.test("Able to do membership, union, difference with GreaterThan", function(){

    var DateStrSet = function(value){
        this.value = value;
    };
    DateStrSet.prototype.valueOf = function(){
        return new Date(this.value).getTime();
    };
    var date1980 = new Date(1980,0,1);

    var greaterThan1980 = new compare.GreaterThan(
        new DateStrSet( date1980.toString() )
    );
    QUnit.ok( greaterThan1980.isMember( new Date(1982,9,20).toString() ), "is member");

    var greaterThan1990 = new compare.GreaterThan(
        new DateStrSet( new Date(1990,0,1).toString() )
    );

    var union = set.union(greaterThan1980, greaterThan1990);

    QUnit.deepEqual(union,new compare.GreaterThan(
        new DateStrSet( date1980.toString() )
    ), "union");

    var difference = set.difference(greaterThan1980, greaterThan1990);

    var gt1980 = new compare.GreaterThan( new DateStrSet( date1980.toString() ) ),
        lte1990 = new compare.LessThanEqual( new DateStrSet( new Date(1990,0,1).toString() ) );
    QUnit.deepEqual(difference,
        new is.And([gt1980, lte1990]),
        "difference");
});

QUnit.test("Able to do membership, union, difference with $in", function(){

    var DateStrSet = function(value){
        this.value = value;
    };
    DateStrSet.prototype.valueOf = function(){
        return new Date(this.value).getTime();
    };
    var date1980 = new Date(1980,0,1).toString(),
        date1990 = new Date(1990,0,1).toString(),
        date2000 = new Date(2000,0,1).toString();

    var in80or90 = new compare.In([
        new DateStrSet(date1980),
        new DateStrSet(date1990)
    ]);


    QUnit.ok( in80or90.isMember( date1980 ), "is member");

    var in90or00 = new compare.In([
        new DateStrSet(date1990),
        new DateStrSet(date2000)
    ]);

    var union = set.union(in80or90, in90or00);

    QUnit.deepEqual(union,new compare.In([
        new DateStrSet(date1980),
        new DateStrSet(date1990),
        new DateStrSet(date2000)
    ]), "union");
    /*
    var greaterThan1990 = new compare.GreaterThan(
        new DateStrSet( new Date(1990,0,1).toString() )
    );

    var union = set.union(greaterThan1980, greaterThan1990);

    QUnit.deepEqual(union,new compare.GreaterThan(
        new DateStrSet( date1980.toString() )
    ), "union");

    var difference = set.difference(greaterThan1980, greaterThan1990);

    var gt1980 = new compare.GreaterThan( new DateStrSet( date1980.toString() ) ),
        lte1990 = new compare.LessThanEqual( new DateStrSet( new Date(1990,0,1).toString() ) );
    QUnit.deepEqual(difference,
        new is.And([gt1980, lte1990]),
        "difference");*/
});
