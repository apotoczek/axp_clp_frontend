/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import ActivityWidget from 'src/libs/components/dashboard/ActivityWidget';
import DataSource from 'src/libs/DataSource';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <!-- ko foreach: widgets -->
                <!-- ko renderComponent: $data --><!-- /ko -->
            <!-- /ko -->
        `);

    self.dfd = self.new_deferred();

    self.notifications = opts.notifications || [];

    self.templates = {
        information: 'tpl_activity_widget_information',
        report: 'tpl_activity_widget_report',
        update: 'tpl_activity_widget_update',
        benchmark: 'tpl_activity_widget_benchmark',
    };

    self.recent_modeler_reports = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'recent_modeler_reports_for_user',
            },
        },
    });

    self.global_activity_feed = self.new_instance(DataSource, {
        datasource: {
            type: 'dynamic',
            query: {
                target: 'global_activity_feed',
            },
        },
    });

    self.gen_report_url = function(opts) {
        return `#!/fund-modeler/view/${opts.entity_type}/${opts.user_fund_uid}/${opts.comp_entity_uid}`;
    };

    self.entity_type_to_sub_type = function(entity_type) {
        switch (entity_type) {
            case 'investor':
                return 'lp_insider_report';
            case 'fund':
                return 'peer_report';
        }
    };

    self.init_widget = function(opts) {
        return self.new_instance(ActivityWidget, {
            template: self.templates[opts.type],

            data: {
                title: opts.title,
                title_css: opts.title_css,
                description: opts.description,
                time: opts.time,
                created: opts.created,
                alert: opts.alert,
                alert_glyphicon: opts.alert_glyphicon,
                url: opts.url,
                download_uid: opts.download_uid,
            },
        });
    };

    self.init_report_widget = function(data) {
        let sub_type = data.sub_type || self.entity_type_to_sub_type(data.params.entity_type);

        return self.init_widget({
            type: 'report',
            title: Formatters.entity_type(sub_type),
            description: data.name,
            time: Formatters.backend_local_datetime(data.created),
            created: data.created,
            url: self.gen_report_url(data.params),
            download_uid: data.can_download ? data.uid : undefined,
        });
    };

    self.report_urls = {
        fund: '#!/funds',
        investor: '#!/investors',
        investment: '#!/investments',
    };

    self.benchmark_published_title = function(activity) {
        let preliminary = activity.data.preliminary;
        let provider = activity.data.provider;
        let as_of_date = Formatters.backend_date_quarterly(activity.data.as_of_date);
        let prel_str = preliminary ? 'Preliminary' : '';

        return `${as_of_date} ${prel_str} ${provider} Benchmark was published`;
    };

    self.init_update_widget = function(res) {
        switch (res.activity_type_str) {
            case 'BENCHMARK_PUBLISHED':
                return self.init_widget({
                    type: 'update',
                    title: self.benchmark_published_title(res),
                    time: Formatters.backend_local_datetime(res.created),
                    created: res.created,
                    url: '#!/benchmark/fund_level_benchmark:browse',
                });
            case 'DATA_ADDED':
                return self.init_widget({
                    type: 'update',
                    title: `Enrichment Data Update: ${res.data.count} new ${res.data.entity_type}${
                        res.data.count > 1 ? 's' : ''
                    } uploaded to Bison's Market Data Set.`,
                    time: Formatters.backend_local_datetime(res.created),
                    created: res.created,
                    url: self.report_urls[res.data.entity_type],
                });
            case 'CUSTOM':
                return self.init_widget({
                    type: 'information',
                    title: res.data.title,
                    description: res.data.body,
                    time: Formatters.backend_local_datetime(res.created),
                    created: res.created,
                    url: res.data.url,
                });
            case 'HL_FUND_BENCHMARK_PUBLISHED':
                // HL_FUND_BENCHMARK_PUBLISHED - !! untested
                return self.init_widget({
                    type: 'update',
                    title: 'placeholder',
                    time: Formatters.backend_local_datetime(res.created),
                    created: res.created,
                    url: '#',
                });
            case 'HL_DEAL_BENCHMARK_PUBLISHED':
                // HL_DEAL_BENCHMARK_PUBLISHED - !! untested
                return self.init_widget({
                    type: 'update',
                    title: 'placeholder',
                    time: Formatters.backend_local_datetime(res.created),
                    created: res.created,
                    url: '#',
                });
        }
    };

    self.reports = ko.pureComputed(() => {
        let reports = self.recent_modeler_reports.data();

        if (reports) {
            return reports.map(self.init_report_widget);
        }

        return [];
    });

    self.updates = ko.pureComputed(() => {
        let updates = self.global_activity_feed.data();

        if (updates) {
            return updates.map(self.init_update_widget);
        }

        return [];
    });

    self.widgets = ko.pureComputed(() => {
        let all_widgets = self.reports().concat(self.updates());
        all_widgets.sort((a, b) => {
            return a.opts.data.created < b.opts.data.created;
        });
        return all_widgets;
    });

    self.dfd.resolve();

    return self;
}
