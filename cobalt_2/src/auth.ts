import {backend} from 'api/cobalt';
import {IsAuthenticatedResponse, CurrentUserResponse} from 'api/cobalt/responses';

interface User {
    client_name: string;
    client_uid: string;
    email: string;
    features: string[];
    mfa_enabled: string;
    name: string;
    title: string;
    uid: string;
}

let user: User | undefined;
let isAuthenticated: boolean = false;

function checkIsAuthenticated(onAuthCheckComplete: () => void) {
    backend
        .post<IsAuthenticatedResponse>('auth/is_authenticated')
        .then(response => {
            isAuthenticated = response.is_authenticated;

            if (!isAuthenticated) {
                onAuthCheckComplete();
                return;
            }

            backend
                .post<CurrentUserResponse>('dataprovider/get_current_user')
                .then(response => {
                    user = response;
                    onAuthCheckComplete();
                })
                .catch(response => {
                    onAuthCheckComplete();
                });
        })
        .catch(response => {
            onAuthCheckComplete();
        });
}

export {isAuthenticated, checkIsAuthenticated, user};
