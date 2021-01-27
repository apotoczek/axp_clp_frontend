/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import PortfolioCharacteristicsForm from 'src/libs/components/datamanager/PortfolioCharacteristicsForm';
import FundDataStatsWidget from 'src/libs/components/datamanager/FundDataStatsWidget';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_characteristics';

    self.vehicle_uid_event = opts.vehicle_uid_event || {};
    self.vehicle_uid = ko.observable();

    self.cashflow_type = opts.cashflow_type || 'net';

    self.upload_success_event = opts.upload_success_event;

    self.is_remote_entity = opts.is_remote_entity;

    self.form = self.new_instance(PortfolioCharacteristicsForm, {
        id: 'portfolio_characteristics_form',
        vehicle_uid_event: self.vehicle_uid_event,
        cashflow_type: self.cashflow_type,
        is_remote_entity: self.is_remote_entity,
    });

    self.metadata = self.new_instance(FundDataStatsWidget, {
        id: 'metadata',
        entity_type: 'portfolio',
        cashflow_type: self.cashflow_type,
        datasource: {
            type: 'dynamic',
            query: {
                target: 'vehicle:data_stats',
                portfolio_uid: {
                    type: 'observer',
                    event_type: self.vehicle_uid_event,
                    required: true,
                },
            },
        },
    });

    self.strings = {
        form_title: 'Portfolio Attributes', // Not sure about this one, not really attributes
        metadata_title: 'Portfolio Summary',
    };

    self.when(self.form, self.metadata).done(() => {
        Observer.register(self.vehicle_uid_event, uid => {
            self.vehicle_uid(uid);
        });

        _dfd.resolve();
    });

    return self;
}
