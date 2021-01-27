import React from 'react';
import {Route, Redirect, RouteProps} from 'react-router-dom';
import {isSet} from 'utils/utils';

import {isAuthenticated, user} from 'auth';

interface PrivateRouteProps extends RouteProps {
    requiredFeatures?: string[];
}

export function PrivateRoute({children, requiredFeatures, ...restProps}: PrivateRouteProps) {
    let shouldRedirect = false;

    if (!isAuthenticated) {
        shouldRedirect = true;
    }

    if (!shouldRedirect && isSet(requiredFeatures)) {
        for (const requiredFeature of requiredFeatures) {
            if (user?.features.indexOf(requiredFeature) == -1) {
                shouldRedirect = true;
            }
        }
    }

    return <Route {...restProps}>{shouldRedirect ? <Redirect to='/' /> : children}</Route>;
}
