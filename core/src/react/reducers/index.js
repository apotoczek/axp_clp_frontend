import {combineReducers} from 'redux';

import dashboards from 'reducers/dashboards';
import * as data from 'reducers/data';
import siteCustomizations from 'reducers/siteCustomizations';
import clientUsers from 'reducers/clientUsers';
import view from 'reducers/view';

export default combineReducers({
    ...data,
    dashboards,
    siteCustomizations,
    clientUsers,
    view,
});
