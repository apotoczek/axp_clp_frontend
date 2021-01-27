import {recursive_get} from 'src/libs/Utils';

export function defaultCellDataGetter({rowData, dataKey}) {
    let cellData;

    if (dataKey) {
        cellData = recursive_get(rowData, dataKey.split(':'), false);
    } else {
        cellData = rowData;
    }

    return cellData;
}
