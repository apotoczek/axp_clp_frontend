import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {composeWithDevTools} from 'redux-devtools-extension';

import rootReducer from './reducers';

const configureLogger = () =>
    createLogger({
        predicate: () => __ENV__ === 'development' && __DEV__.reduxLogger,
    });

export default createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk, configureLogger())),
);
