/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Comp from 'src/libs/components/Comp';

export default function(opts) {
    let self = new BaseComponent(opts);

    opts = opts || {};

    self._comps = [];

    if (opts.comps) {
        for (let i = 0, l = opts.comps.length; i < l; i++) {
            let comp = new Comp(opts.comps[i]);
            self._comps.push(comp);
            self.add_dependency(comp);
        }
    }

    self.comps = ko.computed(() => {
        let comps = [];

        for (let i = 0, l = self._comps.length; i < l; i++) {
            let comp_data = self._comps[i].mapped();
            if (comp_data) {
                comps.push(comp_data);
            }
        }

        let data = self.data();

        if (data) {
            comps.push(...data);
        }

        return comps;
    });

    return self;
}
