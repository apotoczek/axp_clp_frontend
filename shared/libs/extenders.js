/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import 'sugar';

ko.extenders.filter = function(target, filter_fn) {
    return ko.computed({
        read: function() {
            return filter_fn ? filter_fn(target()) : target();
        },
        write: function(value) {
            target(value);
        },
    });
};

ko.extenders.resolve_on_set = function(target, deferred) {
    return ko.computed({
        read: function() {
            return target();
        },
        write: function(value) {
            target(value);
            deferred.resolve();
        },
    });
};

ko.extenders.is = function(target, compval) {
    return ko.computed(() => {
        if (compval instanceof Array) {
            return compval.indexOf(target()) > -1;
        }
        return target() === compval;
    });
};

ko.extenders.isnot = function(target, compval) {
    return ko.computed(() => {
        if (compval instanceof Array) {
            return compval.indexOf(target()) === -1;
        }
        return target() !== compval;
    });
};

ko.extenders.match_order = function(target, data) {
    return ko.computed({
        read: function() {
            let order = data().map(entity => {
                return ko.unwrap(entity.uid);
            });

            let sorted = target().sortBy(n => {
                return order.indexOf(ko.unwrap(n.uid));
            });

            return sorted;
        },
        write: function(value) {
            target(value);
        },
    });
};

ko.extenders.match_compset_order = function(target, compset) {
    return ko.computed({
        read: function() {
            let comporder = compset.list().map(entity => {
                return ko.unwrap(entity.uid);
            });

            let sorted = target().sortBy(n => {
                return comporder.indexOf(ko.unwrap(n.uid));
            });

            return sorted;
        },
        write: function(value) {
            target(value);
        },
    });
};

ko.extenders.numeric = function(target, precision) {
    //create a writeable computed observable to intercept writes to our observable
    let result = ko
        .computed({
            read: target, //always return the original observables value
            write: function(newValue) {
                let current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                    valueToWrite =
                        Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                //only write if it changed
                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    //if the rounded value is the same, but a different value was written, force a notification for the current field
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            },
        })
        .extend({notify: 'always'});

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};
