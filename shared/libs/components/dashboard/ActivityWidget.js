/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import config from 'config';
import pager from 'pager';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import DataThing from 'src/libs/DataThing';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.template = opts.template || 'tpl_activity_widget_report';

    self.dfd = self.new_deferred();

    self.title = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.title) {
            return data.title;
        }
    });

    self.title_css = ko.pureComputed(() => {
        let data = self.data();

        let default_css = {'text-success': true};

        if (data) {
            return data.title_css || default_css;
        }

        return default_css;
    });

    self.description = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.description) {
            return data.description;
        }
    });

    self.time = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.time) {
            return data.time;
        }
    });

    self.url = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.url) {
            return data.url;
        }
    });
    self.navigate_to_url = function() {
        let url = self.url();
        if (url) {
            pager.navigate(url);
        }
    };

    self.enable_download = ko.pureComputed(() => {
        let data = self.data();
        if (data) {
            return data.download_uid;
        }
    });

    self._prepare_fund_modeler_pdf = DataThing.backends.useractionhandler({
        url: 'prepare_fund_modeler_pdf',
    });

    self.download_fund_modeler_pdf = function() {
        let data = self.data();

        if (data && data.download_uid) {
            self._prepare_fund_modeler_pdf({
                data: {
                    uid: data.download_uid,
                },
                success: DataThing.api.XHRSuccess(key => {
                    DataThing.form_post(config.download_file_base + key);
                }),
                error: DataThing.api.XHRError(() => {}),
            });
        }
    };

    self.alert = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.alert) {
            return data.alert;
        }
    });

    self.alert_glyphicon = ko.pureComputed(() => {
        let data = self.data();

        if (data && data.alert_glyphicon) {
            return data.alert_glyphicon;
        }
    });

    self.dfd.resolve();

    return self;
}
