import {is_set} from 'src/libs/Utils';

const isRequiredTypeGenerator = function(propTypeValidator) {
    function validate(isRequired, props, propKey, componentName, location, propFullName, ...rest) {
        const prop = props[propKey];
        if (!is_set(prop)) {
            if (isRequired) {
                throw new Error(oneLine`
                    The property '${propKey}' is required for component
                    '${componentName}' but it was not specified.
                `);
            }

            return;
        }

        return propTypeValidator(props, propKey, componentName, location, propFullName, ...rest);
    }

    const checker = validate.bind(null, false);
    checker.isRequired = validate.bind(null, true);

    return checker;
};

const uuid = isRequiredTypeGenerator((props, propKey, componentName, _location, propFullName) => {
    const prop = props[propKey];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(prop)) {
        throw new Error(oneLine`
                The property '${propFullName}' given to '${componentName}' must be a valid UUID.
            `);
    }
});

/**
 * Defines a property that is marked as required, if and only if one of the properties
 * with names in the `propDependencies` array have been defined.
 *
 * @param {PropType} propTypeValidator Any other prop type validator, this is the type
 *  that the prop should have if it's required
 * @param {...string} propDependencies The list of properties that define if the prop in
 *  question should be marked required or not.
 */
function maybeRequired(propTypeValidator, ...propDependencies) {
    return function validator(props, propKey, componentName, location, propFullName, ...rest) {
        const prop = props[propKey];
        if (!prop && propDependencies.some(d => props[d])) {
            throw new Error(oneLine`
                The property '${propFullName}' is required for '${componentName}'
                when either of the props ${propDependencies.join(', ')} are set.
            `);
        }

        return propTypeValidator(props, propKey, componentName, location, propFullName, ...rest);
    };
}

function valueFromEnum(enumType) {
    return isRequiredTypeGenerator((props, propKey, componentName, _location, _propFullName) => {
        const prop = props[propKey];
        if (!Object.values(enumType).includes(prop)) {
            throw new Error(oneLine`
                    The property '${propKey}' given to '${componentName}' isnt in the
                    specified Enum type.
                `);
        }
    });
}

function deprecated(propTypeValidator, message) {
    return function validator(props, propKey, componentName, location, propFullName, ...rest) {
        if (is_set(props[propKey])) {
            console.warn(
                // eslint-disable-line no-console
                oneLine`
                The property '${propKey}' is deprecated. Please check the defined props
                for component '${componentName}' and use another one. Deprecation message:
                ${message}.
            `,
            );
        }

        return propTypeValidator(props, propKey, componentName, location, propFullName, ...rest);
    };
}

export default {
    uuid,
    maybeRequired,
    valueFromEnum,
    deprecated,
};
