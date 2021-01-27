import config from 'config';
import * as api from 'api';
import {defaultCellDataGetter} from './cellDataGetters';

import {gen_formatter} from 'src/libs/Formatters';

export function dataTableCSVExporter({rows, columns}) {
    const exportRows = [];

    const headerRow = [];
    for (const column of columns) {
        headerRow.push(column.label || column.key);
    }
    exportRows.push(headerRow);

    for (const row of rows) {
        const exportRow = [];
        for (const column of columns) {
            const dataGetter = column.cellDataGetter ?? defaultCellDataGetter;
            let data = dataGetter({rowData: row, dataKey: column.key});

            // This tries to determine if a column is a date, so that we can format the
            // date appropriately. Not 100% fool-proof, but should work fairly well.
            const shouldFormatData =
                column.format?.indexOf('date') > -1 ||
                column.key.indexOf('date') > -1 ||
                column.label?.toLowerCase()?.indexOf('date') > -1;

            if (shouldFormatData) {
                if (column.format) {
                    data = gen_formatter(column.format)(data);
                } else if (column.formatter) {
                    data = column.formatter({
                        rowData: row,
                        columnData: column,
                        cellData: data,
                    });
                }
            }

            exportRow.push(data);
        }
        exportRows.push(exportRow);
    }

    api.callActionEndpoint('useractionhandler/prepare_csv', {rows: exportRows}).then(id =>
        api.formPost(`${config.download_csv_base}${id}`),
    );
}
