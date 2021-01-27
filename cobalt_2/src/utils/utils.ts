import {isPlainObject, isString, isNumber, sortBy} from 'lodash';
import md5 from 'spark-md5';

export function isSet<T>(
    value: T | undefined | null,
    considerCollections: boolean = false,
): value is T {
    if (value === undefined) {
        return false;
    }

    if (value === null) {
        return false;
    }

    if (considerCollections) {
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }

        if (isPlainObject(value) && Object.keys(value).length == 0) {
            return false;
        }

        if (isString(value) && value.length === 0) {
            return false;
        }
    }

    return true;
}

type SerializableObject = {[key in string | number]: Serializable};
type Serializable = string | number | boolean | Serializable[] | SerializableObject;

export function serialize(subject: Serializable): string {
    if (!isSet(subject, true)) {
        return '';
    }

    if (isString(subject) || isNumber(subject) || typeof subject === 'boolean') {
        return String(subject);
    }

    if (Array.isArray(subject)) {
        const array = sortBy(subject);
        const values = [];

        for (let i = 0, l = array.length; i < l; i++) {
            values.push(serialize(array[i]));
        }

        return `[${values.join(',')}]`;
    }

    const keys = sortBy(Object.keys(subject));
    const values = [];

    for (let i = 0, l = keys.length; i < l; i++) {
        let value = subject[keys[i]];
        if (!isSet(value, true)) {
            continue;
        }

        values.push([keys[i], serialize(value)].join(':'));
    }

    return `{${values.join(',')}}`;
}

export function hashed(params: Serializable) {
    return md5.hash(serialize(params));
}

export function objectFromArray<T, R = any>(
    array: T[],
    mapFn: (val: T) => [string | number, R] | null,
) {
    const map: {[key in string | number]: R} = {};

    for (const item of array) {
        const result = mapFn(item);
        if (!result) {
            continue;
        }

        const [key, value] = result;
        map[key] = value;
    }

    return map;
}

export function identity<T>(value: T): T {
    return value;
}
