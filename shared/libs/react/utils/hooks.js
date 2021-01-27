import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import memoize from 'lodash.memoize';

import {is_set, object_from_array} from 'src/libs/Utils';

/**
 * Debounces the update of some value. Returns the new value after `delay` milliseconds of
 * no updates. Prior to that, it returns the old value.
 *
 * @param {any} value The initial value of the debounced value.
 * @param {Number} delay Milliseconds to debounce the update
 */
export function useDebounced(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return function() {
            clearTimeout(handle);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useDebouncedCallback(callback, delay) {
    const argRef = useRef([]);
    const callbackTimeoutHandle = useRef();
    const callbackRef = useRef();
    callbackRef.current = callback;

    function cleanup() {
        if (!callbackTimeoutHandle.current) {
            return;
        }

        clearTimeout(callbackTimeoutHandle.current);
    }

    // Cleanup when consuming component unmounts.
    useEffect(() => cleanup, []);

    const debouncedCallback = useCallback(
        (...args) => {
            argRef.current = args;
            cleanup();

            callbackTimeoutHandle.current = setTimeout(() => {
                callbackRef.current(...argRef.current);
            }, delay);
        },
        [delay],
    );

    return debouncedCallback;
}

export function usePartiallyAppliedCallback(nestedCallback, deps) {
    return useCallback(
        memoize((...preArgs) => (...postArgs) => nestedCallback(...preArgs, ...postArgs)),
        [nestedCallback, ...deps],
    );
}

/**
 * Custom hook that wraps the behavior around form state and their related error strings.
 *
 * @param fields The fields that need to be tracked by the hook. Structure in the form
 * of:
 * ```
 * {
 *     fieldName: {
 *         initialValue: '',
 *         validator: fieldNameValue => {},
 *         validatorDeps: [],
 *     }
 * }
 * ```
 * Where `validator` is a function used to validate any error in the field. Returns an error
 * string describing the error when there is one, `null` otherwise. While `validatorDeps`
 * is a list of dependencies that determine when `validator` should be re-defined.
 */
export function useFormState(fields) {
    const initialValues = object_from_array(Object.entries(fields), ([key, field]) => [
        key,
        field.initialValue,
    ]);
    const allValidatorDeps = Object.values(fields).reduce(
        (prev, current) => [...prev, ...(current.validatorDeps || [])],
        [],
    );
    const validateFns = useMemo(
        () =>
            object_from_array(Object.entries(fields), ([key, field]) => [
                key,
                field.validator || (() => null),
            ]),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        allValidatorDeps,
    );

    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const triggerValidation = useCallback(() => {
        const newErrors = {};
        for (const [key, validateFn] of Object.entries(validateFns)) {
            const error = validateFn(values[key]);
            if (error) {
                newErrors[key] = error;
            }
        }
        setErrors(newErrors);
        return !is_set(newErrors, true);
    }, [validateFns, values]);

    const setValue = useCallback(
        key =>
            memoize(value => {
                setValues(oldValues => ({...oldValues, [key]: value}));
                setErrors(oldErrors => ({...oldErrors, [key]: validateFns[key](value)}));
            }),
        [validateFns],
    );

    return [values, errors, setValue, triggerValidation];
}

export function useIsMounted() {
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return isMounted;
}
