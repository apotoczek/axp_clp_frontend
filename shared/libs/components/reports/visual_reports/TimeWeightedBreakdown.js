/* Automatically transformed from AMD to ES6. Beware of code smell. */
import TimeWeightedBreakdown from 'src/libs/components/analytics/TimeWeightedBreakdown';

export default function(opts, components) {
    let self = new TimeWeightedBreakdown(opts, components);

    self.extract_dynamic_data = function() {
        return self.datasource.data();
    };

    self.restore_dynamic_data = function(snapshot) {
        self.datasource.data(snapshot);
    };

    return self;
}
