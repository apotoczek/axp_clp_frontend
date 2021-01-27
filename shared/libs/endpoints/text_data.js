/**
 * Endpoint Specifications
 * @module shared/libs/endpoints
 *
 * Endpoint spec, used to resolve what endpoint should be used from the
 * query and options for that endpoint.
 */

export default {
    values: {
        targets: ['company_text_data'],
    },
    as_of_dates: {
        targets: ['company_text_data_as_of_dates'],
    },
    specs: {
        targets: ['text_data_specs'],
    },
    grouped_fields: {
        targets: ['text-data/grouped-fields'],
    },
};
