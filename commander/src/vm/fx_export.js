/* Automatically transformed from AMD to ES6. Beware of code smell. */
import config from 'config';
import DataThing from 'src/libs/DataThing';
import Context from 'src/libs/Context';
import Observer from 'src/libs/Observer';
import EventButton from 'src/libs/components/basic/EventButton';
import NumberInput from 'src/libs/components/basic/NumberInput';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

export default function() {
    let self = new Context({
        id: 'fx-export',
    });

    self.dfd = self.new_deferred();

    self._csv_export = DataThing.backends.commander({
        url: 'monthly_fx_rates',
    });
    self.year_input = self.new_instance(NumberInput, {
        id: 'year',
        placeholder: 'Year',
        format: 'no_format',
        allow_empty: false,
    });

    let date = new Date();

    self.month_input = self.new_instance(NewDropdown, {
        id: 'month',
        label: 'Month',
        allow_empty: false,
        default_selected_index: date.getMonth(),
        data: [
            {
                label: 'January',
                value: 1,
            },
            {
                label: 'February',
                value: 2,
            },
            {
                label: 'March',
                value: 3,
            },
            {
                label: 'April',
                value: 4,
            },
            {
                label: 'May',
                value: 5,
            },
            {
                label: 'June',
                value: 6,
            },
            {
                label: 'July',
                value: 7,
            },
            {
                label: 'August',
                value: 8,
            },
            {
                label: 'September',
                value: 9,
            },
            {
                label: 'October',
                value: 10,
            },
            {
                label: 'November',
                value: 11,
            },
            {
                label: 'December',
                value: 12,
            },
        ],
        btn_css: {'btn-ghost-default': true},
        selected: 0,
    });

    self.new_instance(NumberInput, {
        id: 'amount',
        label: 'Amount',
        allow_empty: false,
    });
    self.download_button = self.new_instance(EventButton, {
        id: 'download',
        label: 'Export Rates',
        template: 'tpl_cpanel_button',
    });

    self.export_csv = () => {
        self._csv_export({
            data: {
                month: self.month_input.value(),
                year: self.year_input.value(),
            },
            success: DataThing.api.XHRSuccess(key => {
                DataThing.form_post(config.download_file_base + key);
            }),
            error: DataThing.api.XHRError(() => {}),
        });
    };

    self.when(self.download_button, self.year_input, self.month_input).done(() => {
        self.year_input.value(date.getFullYear());

        Observer.register_for_id(self.download_button.get_id(), 'EventButton', self.export_csv);
        self.dfd.resolve();
    });

    return self;
}
