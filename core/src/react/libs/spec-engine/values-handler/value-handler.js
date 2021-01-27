/* eslint-disable */

export default class ValueHandler {
    /**
     * Takes a value object and returns all the entities that are contained
     * within that value.
     *
     * @param {object} value The value object to find the entities from.
     */
    static valueEntities(value) {
        throw `NotImplemented: ${this.constructor.name}.valueEntities`;
    }

    /**
     * Takes a value object and should modify that object such that each entity
     * id provided is contained within the value object.
     *
     * @param {object} value The value object to fill entity ids in.
     * @param {Array} fillers The array of entity ids to insert into the value
     * object.
     */
    static insertValueEntityFillers(value, entityIds) {
        throw `NotImplemented: ${this.constructor.name}.insertValueEntityFillers`;
    }

    /**
     * Takes a value object and modifies that value such that it is repeated
     * over all the given repeaters.
     *
     * @param {object} value The value object to modify.
     * @param {object} repeaters A map between entity types and entity ids. The
     * ids are the entities that the given value should be repeated for.
     */
    static deriveRepeaters(value, repeaters) {
        throw `NotImplemented: ${this.constructor.name}.deriveRepeaters`;
    }

    /**
     * Takes a value object and modifies it such that the repetitions of the
     * value is reset. Basically the reverse of `ValueHandler.deriveRepeaters`.
     *
     * @param {object} value The value object to reset.
     */
    static resetRepeated(value) {
        throw `NotImplemented: ${this.constructor.name}.resetRepeated`;
    }

    /**
     * Takes a value object and finds the entity information contained within that value.
     *
     * @param {object} value The value object to extract the fillers from.
     * @returns {Array} An array containting the entity ids that were inserted
     * into this value on deriving the fillers.
     */
    static getFillers(value) {
        throw `NotImplemented: ${this.constructor.name}.extractFillers`;
    }

    /**
     * Takes a value object and modifies it such that it no longer contains any
     * entity information about entities.
     *
     * @param {object} value The value object to extract the fillers from.
     * @returns {Array} An array containting the entity ids that were inserted
     * into this value on deriving the fillers.
     */
    static resetFillers(value) {
        throw `NotImplemented: ${this.constructor.name}.extractFillers`;
    }

    static extractRepeaterRoots(dataSpec) {
        throw `NotImplemented:  ${this.constructor.name}.extractRepeaterRoots`;
    }

    /**
     * Takes a value object and finds the entries in the value-map that
     * correspond to the data points that we need to fulfill the given value.
     *
     * @param {object} value The value object to find the value map entries for.
     * @param {object} componentEntity The entity defined on the component where
     * the value is defined.
     * @param {object} componentEntityPath The entity path to the component
     * where the value is defined.
     * @param {str}: valueId the valueId of the value
     * @returns {object} An arbtrirary object that will be provided into
     * `formatProviderData`. This object should contain all value map entries
     * for the all data points that are required to properly send all the data
     * to a provider.
     */
    static getValueMapEntriesForValue(value, componentEntity, valueMap, valueId) {
        throw `NotImplemented: ${this.constructor.name}.getValueMapEntriesForValue`;
    }

    /**
     * Takes a value object and calculates what endpoints need to be called to
     * fetch all the information required for the component to display that
     * value.
     *
     * @param {object} value The value object to calculate the required
     * endpoints for.
     * @returns {Array} An array of strings representing the endpoints that need
     * to be called to fetch all the required information for the given value
     * object.
     */
    static endpointsByValue(value) {
        throw `NotImplemented: ${this.constructor.name}.endpointsByValue`;
    }
}
