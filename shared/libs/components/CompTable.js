/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';
import * as Utils from 'src/libs/Utils';
import CompSet from 'src/libs/components/CompSet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <table class="table table-bison metric-table table-light">
                <tbody data-bind="foreach: rows">
                    <tr>
                        <td data-bind="html: label" class="table-lbl"></td>
                        <td data-bind="html: value" class="table-data numeric"></td>
                    </tr>
                </tbody>
            </table>
        `);

    self.value_key = opts.value_key || 'value';
    self.label_key = opts.label_key || 'label';

    if (opts.comps) {
        self.comps = opts.comps;
    } else if (opts.compset) {
        self.compset = new CompSet(opts.compset);
        self.comps = self.compset.comps;

        self._loading = self.loading;

        self.loading = ko.computed({
            write: function(val) {
                self._loading(val);
            },
            read: function() {
                return self._loading() || self.compset.loading();
            },
        });
    }

    self.formatter = opts.formatter || Formatters.gen_formatter(opts);

    self.rows = ko.pureComputed(() => {
        let rows = [];

        let comps = self.comps();

        for (let i = 0, l = comps.length; i < l; i++) {
            let value = comps[i][self.value_key];
            let label = comps[i][self.label_key];
            if (Utils.is_set(label)) {
                rows.push({
                    label: label,
                    value: self.formatter(value),
                });
            }
        }
        return rows;
    });

    return self;
}
