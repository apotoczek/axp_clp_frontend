import commander from 'src/libs/endpoints/commander';
import dataprovider from 'src/libs/endpoints/dataprovider';
import reporting from 'src/libs/endpoints/reporting';
import text_data from 'src/libs/endpoints/text_data';
import useractionhandler from 'src/libs/endpoints/useractionhandler';

/**
 * Transform a single backend-keyed endpoint config to old-style
 * @param {string} backend - backend identifier (I.e. "dataprovider")
 * @param {object} config - new-style endpoint config to be expanded
 */
const expandSpec = (backend, {targets, ...rest}) => ({
    query: {params: {target: targets}},
    backend,
    ...rest,
});

/**
 * Transform a map of new-style specs into a single old-style endpoint spec.
 * @param {object} endpointSpecs - new-style, backend-keyed endpoint map
 */
const expandMappedSpecs = endpointSpecs => {
    let newSpecs = [];
    for (let [backend, specs] of Object.entries(endpointSpecs)) {
        for (let [path, config] of Object.entries(specs)) {
            newSpecs.push({path, spec: expandSpec(backend, config)});
        }
    }
    return newSpecs;
};

export default expandMappedSpecs({
    commander,
    dataprovider,
    reporting,
    useractionhandler,
    text_data,
});
