/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Context from 'src/libs/Context';

export default function(config, components) {
    let self = new Context(config, components);

    self.title = config.title;

    self.rows = [];

    self.init = function(config) {
        for (let i = 0, l = config.layout.length; i < l; i++) {
            self.rows.push(self.init_row(config.layout[i]));
        }
    };

    self.init_row = function(config) {
        let row = {
            template: `tpl_row_${config.length}`,
            components: [],
        };

        for (let i = 0, l = config.length; i < l; i++) {
            if (Object.isArray(config[i])) {
                row.components.push(self.init_row(config[i]));
            } else {
                row.components.push(self.components[config[i]]);
            }
        }

        return row;
    };

    self.init(config);

    return self;
}
