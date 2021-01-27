/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import $ from 'jquery';
import * as Utils from 'src/libs/Utils';
import 'moment';
import 'daterangepicker';

ko.bindingHandlers.dateRangePicker = {
    init: (element, valueAccessor) => {
        let args = ko.utils.unwrapObservable(valueAccessor());
        let start = args.start;
        let end = args.end;

        $(element).daterangepicker(
            {
                locale: {format: args.localeFormat || 'MMM D, YYYY'},
                startDate: start,
                endDate: end,
                opens: args.opens,
                showWeekNumbers: args.showWeekNumbers || true,
                ranges: args.ranges,
                showCustomRangeLabel: args.ranges && args.showCustomRangeLabel,
                alwaysShowCalenders: args.alwaysShowCalenders || true,
                autoUpdateInput: false,
                autoApply: true,
            },
            (newStart, newEnd) => {
                start(Utils.date_to_epoch(newStart.toDate()));
                end(Utils.date_to_epoch(newEnd.toDate()));
            },
        );
    },
};
