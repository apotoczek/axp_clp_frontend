/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ScoringChart from 'src/libs/components/charts/ScoringChart';

export default function(opts, components) {
    let self = new ScoringChart(opts, components);

    let _dfd = self.new_deferred();

    self.restore_dynamic_data = function(snapshot) {
        self.data(snapshot.data);
        self.comps(snapshot.comps);
        self.y_axis_metric(snapshot.y_axis_metric);
        self.x_axis_metric(snapshot.x_axis_metric);
    };

    self.extract_dynamic_data = function() {
        return {
            data: self.data(),
            comps: self.comps(),
            y_axis_metric: self.y_axis_metric(),
            x_axis_metric: self.x_axis_metric(),
        };
    };

    _dfd.resolve();

    return self;
}
