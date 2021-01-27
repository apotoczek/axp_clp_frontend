import React from 'react';

import {withKnobs, text, boolean, number} from '@storybook/addon-knobs';
import DataTable from './DataTable';

export default {
    title: 'DataTable',
    component: DataTable,
    decorators: [withKnobs],
};

const dataRows = [
    {name: 'Simon', role: 'Software Engineer'},
    {name: 'Viktor', role: 'VP of Engineering'},
    {name: 'Marcus', role: 'Software Engineer'},
    {name: 'Jonathan', role: 'Software Engineer'},
    {name: 'Renee', role: 'Software Engineer'},
    {name: 'Belmin', role: 'Software Engineer'},
    {name: 'Sanna', role: 'UX Engineer'},
    {name: 'Mike', role: 'VP of Product'},
];

export const Normal = () => (
    <DataTable
        pushHeight
        enableSelection={boolean('Enable Selection', false)}
        enableRowClick={boolean('Enable Row Click', false)}
        selectOnRowClick={boolean('Select On Row Click', true)}
        enableColumnToggle={boolean('Enable Column Toggle', true)}
        enableSorting={boolean('Enable Sorting', true)}
        enableHeaderRow={boolean('Enable Header Row', true)}
        enableHorizontalScrolling={boolean('Enable Horizontal Scrolling', true)}
        enableContextHeader={boolean('Enable Context Header', false, 'Context Header')}
        label={text('Label', 'Table Label', 'Context Header')}
        enablePagination={boolean('Enable Pagination', false, 'Pagination')}
        resultsPerPage={number('Results Per Page', 5, {}, 'Pagination')}
        rowKey='name'
        columns={[
            {
                key: 'name',
                label: 'Name',
            },
            {
                key: 'role',
                label: 'Role',
            },
        ]}
        rows={dataRows}
    />
);
