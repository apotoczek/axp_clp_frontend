/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    let _dfd = self.new_deferred();

    self.template = 'tpl_button_list';

    self.list = ko.computed(() => {
        let data = self.data() ? self.data().results : [];

        let _list = [];
        for (let i = 0, l = data.length; i < l; i++) {
            let link = Formatters.finished_report(data[i], undefined, {
                base_url: '#!/visual-reports',
                label_key: 'name',
                published_key: 'is_frozen',
            });
            _list.push(link);
        }

        return _list;
    });

    _dfd.resolve();

    return self;
}
