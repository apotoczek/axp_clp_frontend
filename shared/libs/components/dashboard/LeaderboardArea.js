/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.dfd = self.new_deferred();
    self.template = opts.template || 'tpl_leaderboard_area';

    self.model_report_from_comp_entity_url = function(entity) {
        let base_url = '#!/fund-modeler/wizard/';
        let entry_point = `${base_url + entity.entity_type}/` + 'select_fund/';
        let url = entry_point + entity.uid;
        return url;
    };

    self.model_entity = function(entity) {
        pager.navigate(entity.modeler_link);
    };

    self.leaderboards = ko.pureComputed(() => {
        let data = self.data();
        let leaderboards = [];

        if (data) {
            for (let [key, lb] of Object.entries(data)) {
                if (key == 'funds') {
                    lb.title = 'Top GPs being modeled';
                } else if (key == 'investors') {
                    lb.title = 'Top LPs being modeled';
                }

                lb.map((v, i) => {
                    v.modeler_link = self.model_report_from_comp_entity_url(v);
                    return (v.rank = `${i + 1}.&nbsp;`);
                });

                lb.template = 'tpl_leaderboard_table';

                leaderboards.unshift(lb);
            }
        }

        return leaderboards;
    });

    self.dfd.resolve();

    return self;
}
