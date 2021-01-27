/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import IndexCharacteristicsForm from 'src/libs/components/datamanager/IndexCharacteristicsForm';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_data_manager_characteristics';

    self.market_uid_event = opts.market_uid_event || {};
    self.market_uid = ko.observable();

    self.market_id_event = opts.market_id_event || {};
    self.market_id = ko.observable();

    self.form = self.new_instance(IndexCharacteristicsForm, {
        id: 'charateristics_form',
        market_uid_event: self.market_uid_event,
        market_id_event: self.market_id_event,
    });

    self.strings = {
        form_title: 'Index Characteristics',
        metadata_title: 'Index Summary',
    };

    self.when(
        self.form,
        //self.metadata
    ).done(() => {
        _dfd.resolve();
    });

    return self;
}
