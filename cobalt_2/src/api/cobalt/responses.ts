type CobaltResponseValue = string | number | boolean | string;
export interface CobaltResponse {
    [key: string]: CobaltResponse | CobaltResponseValue | CobaltResponseValue[];
    [key: number]: CobaltResponse | CobaltResponseValue | CobaltResponseValue[];
}

export interface IsAuthenticatedResponse extends CobaltResponse {
    is_authenticated: boolean;
}

export interface CurrentUserResponse extends CobaltResponse {
    client_name: string;
    client_uid: string;
    email: string;
    features: string[];
    mfa_enabled: string;
    name: string;
    title: string;
    uid: string;
}
