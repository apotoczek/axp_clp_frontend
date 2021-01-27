import {combineReducers} from 'redux';

import dashboards from 'reducers/view/dashboards';
import modal from 'reducers/view/modal';

export default combineReducers({
    dashboards,
    modal,
});
