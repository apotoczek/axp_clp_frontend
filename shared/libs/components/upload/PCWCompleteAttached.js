/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.attached_name = opts.attached_name || 'Attributes';

    self.define_default_template(`
            <div class="upload-status upload-status-success">
                <div class="row">
                    <table class="callout-table callout-success">
                        <tr>
                            <td class="callout-icon">
                                <span class="glyphicon" data-bind="css: {
                                    'glyphicon-ok': success(),
                                    'glyphicon-remove': !success()
                                }"/>
                            </td>
                            <td>
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <span data-bind="text: message"></span>
                                        </td>
                                    </tr>
                                </table>
                                <!-- ko if: has_alerts -->
                                <table style="width: 100%;">
                                    <tr>
                                        <td>
                                            <strong>Details</strong>
                                            <ul class="list-unstyled" data-bind="foreach: alerts">
                                                <li data-bind="text: $data"></li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>
                                <!-- /ko -->
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.data = ko.observable(opts.data ? opts.data.data : undefined);

    self.success = ko.pureComputed(() => {
        let data = self.data();

        return data && data.success;
    });

    self.message = ko.pureComputed(() => {
        if (self.success()) {
            return `${self.attached_name} updated successfully!`;
        }

        return 'An error occurred!';
    });

    self.alerts = ko.pureComputed(() => {
        let data = self.data();

        if (data) {
            return data.alerts;
        }

        return [];
    });

    self.has_alerts = ko.pureComputed(() => {
        return self.alerts().length > 0;
    });

    _dfd.resolve();

    return self;
}
