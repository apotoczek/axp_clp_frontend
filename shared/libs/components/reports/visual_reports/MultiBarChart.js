/* Automatically transformed from AMD to ES6. Beware of code smell. */
import MultiBarChart from 'src/libs/components/charts/MultiBarChart';

export default function(opts, components) {
    let self = new MultiBarChart(opts, components);

    let _dfd = self.new_deferred();

    self.restore_dynamic_data = function(snapshot) {
        self.data(snapshot.data);
        self.comps(snapshot.comps);
    };

    self.extract_dynamic_data = function() {
        return {
            data: self.data(),
            comps: self.comps(),
        };
    };

    _dfd.resolve();

    return self;
}
