var compare = require("./comparisons");
var set = require("../set");
var is = compare;

QUnit.module("can-query-logic/types/is")

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
    In_NotIn: {},
    NotIn_In: {},

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
                new is.Or([a, b])
                // set.UNDEFINABLE
            );

        }
    },
    GreaterThan_In: {},

    In_GreaterThanEqual: {},
    GreaterThanEqual_In: {},

    In_LessThan: {},
    LessThan_In: {},

    In_LessThanEqual: {},
    LessThanEqual_In: {},

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

    NotIn_LessThanEqual: {},
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
            QUnit.skip("no "+name1+" difference "+name2, function(){});
        }
    } else {
        ["union","intersection","difference"].forEach(function(prop){
            if(test[prop]) {
                QUnit.test(name1+" "+prop+" "+name2, test[prop]);
            } else {
                QUnit.skip("no "+name1+" "+prop+" "+name2, function(){});
            }
        });
    }
};

var names = Object.keys(compare);
names.forEach(function(name1, i){
    if(!tests[name1+"_"+name1]) {
        QUnit.skip("no "+name1+"_"+name1+" test", function(){});
    } else {
        makeTests(tests[name1+"_"+name1], name1, name1);
    }

    if(!tests[name1+"_isMember"]) {
        QUnit.skip("no "+name1+"_isMember test", function(){});
    } else {
        QUnit.test(name1+"_isMember", tests[name1+"_isMember"]);
    }

    if(!tests["UNIVERSAL_"+name1]) {
        QUnit.skip("no UNIVERSAL_"+name1+" test", function(){});
    } else {
        makeTests(tests["UNIVERSAL_"+name1], "UNIVERSAL", name1, true);
    }

    for(var j=i+1; j < names.length; j++) {
        var name2 = names[j];
        if(!tests[name1+"_"+name2]) {
            QUnit.skip("no "+name1+"_"+name2+" test", function(){});
        } else {
            makeTests(tests[name1+"_"+name2], name1, name2);
        }
        if(!tests[name2+"_"+name1]) {
            QUnit.skip("no "+name2+"_"+name1+" test", function(){});
        } else {
            makeTests(tests[name2+"_"+name1], name2, name1, true);
        }
    }
});

is.And = function(ands) {
    this.values = ands;
};
is.Or = function(ors) {
    this.values = ors;
};
