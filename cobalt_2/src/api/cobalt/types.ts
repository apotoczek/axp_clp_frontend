export interface CobaltBackend {
    get<R = any>(url: string): Promise<R>;
    post<R = any>(url: string, data?: any): Promise<R>;
}

export type SerializableParamKey = string | number;
export type SerializableParamValue = string | number | boolean;
export type CobaltAPIParams = {[field in SerializableParamKey]: SerializableParamValue};
