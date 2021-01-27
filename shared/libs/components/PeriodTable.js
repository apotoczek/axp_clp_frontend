/* Automatically transformed from AMD to ES6. Beware of code smell. */
import DataTable from 'src/libs/components/basic/DataTable';

export default function(opts) {
    let defaults = {
        inline_data: true,
        results_per_page: 15,
        enable_clear_order: true,
        row_key: 'start',
        columns: [
            {
                label: 'Holding Period',
                sort_key: 'start',
                type: 'string',
                format: 'backend_date_range',
            },
            {
                label: 'Start NAV',
                key: 'start_nav',
                format: 'usd',
                type: 'numeric',
            },
            {
                label: 'End NAV',
                key: 'end_nav',
                format: 'usd',
                type: 'numeric',
            },
            {
                label: 'Paid In',
                key: 'contrib',
                format: 'usd',
                type: 'numeric',
            },
            {
                label: 'Distributed',
                key: 'distrib',
                format: 'usd',
                type: 'numeric',
            },
            {
                label: 'Rate of Return',
                key: 'hpr',
                format: 'percent_highlight_delta',
                type: 'numeric',
            },
        ],
    };

    return new DataTable({...defaults, ...opts});
}
