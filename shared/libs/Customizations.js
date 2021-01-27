/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import config from 'config';
import auth from 'auth';
import Context from 'src/libs/Context';
import DataThing from 'src/libs/DataThing';

let self = new Context();
self.dfd = self.new_deferred();

self.use_custom_colors = ko.observable();

self.color_names = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
];

self.dash_style_names = [
    'Solid',
    'Dash',
    'DashDot',
    'Dot',
    'LongDash',
    'LongDashDot',
    'LongDashDotDot',
    'ShortDash',
    'ShortDashDot',
    'ShortDashDotDot',
];

self.custom_colors = ko.observable();

self.map_colors = function(colors) {
    let mapped = {};

    for (let i = 0, l = self.color_names.length; i < l; i++) {
        mapped[self.color_names[i]] = colors[i];
    }

    return mapped;
};

self.base_color_set = config.color_set || [
    '#39BEE5',
    '#FF006E',
    '#3AC376',
    '#6D83A3',
    '#F39C12',
    '#C33A3A',
    '#006FF1',
    '#F95532',
    '#BEBEBE',
    '#4A4A4A',
];

// reordered to better match color order of legacy_color_set
self.reordered_base_color_set = ko.observable([
    self.base_color_set[9],
    self.base_color_set[6],
    self.base_color_set[7],
    self.base_color_set[8],
    self.base_color_set[2],
    self.base_color_set[4],
    self.base_color_set[3],
    self.base_color_set[0],
    self.base_color_set[5],
    self.base_color_set[1],
]);

self.legacy_color_set = [
    '#444444',
    '#006ff1',
    '#F39C12',
    '#aaaaaa',
    '#55B9B1',
    '#f7bb5d',
    '#68a5ec',
    '#9cdcd7',
    '#f57921',
    '#eeeeee',
    '#00e2d1',
    '#bed8f7',
    '#f78c41',
    '#dddddd',
];

self.base_colors = self.map_colors(self.base_color_set);

self.get_color_set = function() {
    //returns array of colors
    if (self.use_custom_colors()) {
        return self.reordered_base_color_set();
    }

    return self.legacy_color_set;
};

self.get_colors = function() {
    //returns object with colors
    if (self.use_custom_colors()) {
        return self.custom_colors();
    }

    return self.base_colors;
};

self.get_color_from_int = function(idx) {
    if (self.use_custom_colors()) {
        idx = (idx || 0) % self.reordered_base_color_set().length;
        return self.reordered_base_color_set()[idx];
    }

    idx = (idx || 0) % self.legacy_color_set.length;
    return self.legacy_color_set[idx];
};

// Charts should target this function to get individual colors
self.get_color = function(idx) {
    if (
        self.use_custom_colors() &&
        Object.prototype.hasOwnProperty.call(self.custom_colors(), idx)
    ) {
        // idx = named key string ('first', 'second', etc)
        return self.custom_colors()[idx];
    } else if (Object.prototype.hasOwnProperty.call(self.base_colors, idx)) {
        // idx = named key string ('first', 'second', etc)
        return self.base_colors[idx];
    }

    // assume idx a custom hex code string, ex: '#4D4D4D'
    return idx;
};

self._update_color_settings = DataThing.backends.useractionhandler({
    url: 'update_customizations',
});

self.update_color_settings = function(data) {
    self._update_color_settings({
        data: data,
        success: DataThing.api.XHRSuccess(() => {
            window.location.reload();
        }),
    });
};

self._reset_color_settings = DataThing.backends.useractionhandler({
    url: 'delete_color_customizations',
});

self.reset_color_settings = function() {
    self._reset_color_settings({
        data: {},
        success: DataThing.api.XHRSuccess(() => {
            window.location.reload();
        }),
    });
};

$.when(auth.dfd).done(() => {
    if (auth.is_authenticated()) {
        DataThing.get({
            params: {
                target: 'site_customizations',
            },
            success: function(result) {
                if (result && result.custom_colors) {
                    self.use_custom_colors(true);
                    self.custom_colors(self.map_colors(result.custom_colors));
                    self.reordered_base_color_set([
                        result.custom_colors[9],
                        result.custom_colors[6],
                        result.custom_colors[7],
                        result.custom_colors[8],
                        result.custom_colors[2],
                        result.custom_colors[4],
                        result.custom_colors[3],
                        result.custom_colors[0],
                        result.custom_colors[5],
                        result.custom_colors[1],
                    ]);
                } else {
                    self.use_custom_colors(false);
                }

                self.dfd.resolve();
            },
            error: function() {
                self.use_custom_colors(false);
                self.dfd.resolve();
            },
        });
    } else {
        self.use_custom_colors(false);
        self.dfd.resolve();
    }
});

export default self;
