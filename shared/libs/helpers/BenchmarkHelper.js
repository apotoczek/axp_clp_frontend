/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseHelper from 'src/libs/helpers/BaseHelper';

let self = new BaseHelper({});

self.fund_table_columns = [
    {
        label: 'Fund Name',
        sort_key: 'fund_name',
        format: 'entity_link',
        format_args: {
            url: 'funds.fund_uid',
            name_key: 'fund_name',
        },
    },
    {
        label: 'IRR',
        key: 'irr',
        first_sort: 'desc',
        type: 'numeric',
        format: 'irr',
    },
    {
        label: 'TVPI',
        key: 'tvpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'DPI',
        key: 'dpi',
        first_sort: 'desc',
        type: 'numeric',
        format: 'multiple',
    },
    {
        label: 'Momentum',
        key: 'momentum',
        first_sort: 'desc',
        type: 'numeric',
        format: 'percent',
    },
];

export default self;
