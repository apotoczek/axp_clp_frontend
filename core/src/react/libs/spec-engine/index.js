/**
 * @module spec-engine
 */
import {calculateEndpoints} from 'libs/spec-engine/endpoints';
import {
    cleanRepeaters,
    deriveDataSpec,
    deriveSpecRepeaters,
    insertEntityFillers,
    extractRepeaterRoots,
    extractReportingComponentDefinitions,
    cleanReportingComponents,
    deriveReportingComponents,
} from 'libs/spec-engine/derivers';
import {
    asReactGridLayout,
    formatLayout,
    recalculateLayout,
    swapFiller,
    removeFiller,
    getSpecFillers,
} from 'libs/spec-engine/utils';
import {
    addNewComponent,
    componentValues,
    duplicateComponent,
    entityTypeForComponent,
    extractComponentRepeaters,
    removeComponent,
    changeComponentPage,
    setEntityCashflowType,
    setComponentType,
    setComponentValues,
    setComponentData,
    setEntityId,
    setEntityType,
    setRepeatFor,
    entitiesForComponent,
    entitiesForDataSpec,
} from 'libs/spec-engine/component-utils';
import {getValueParameters} from 'libs/spec-engine/params';

export default {
    // ENDPOINTS
    calculateEndpoints,

    // DERIVERS
    cleanRepeaters,
    getSpecFillers,
    deriveDataSpec,
    deriveSpecRepeaters,
    insertEntityFillers,
    extractRepeaterRoots,
    extractReportingComponentDefinitions,
    cleanReportingComponents,
    deriveReportingComponents,

    // UTILS
    asReactGridLayout,
    formatLayout,
    recalculateLayout,
    swapFiller,
    removeFiller,

    // COMPONENT UTILS
    addNewComponent,
    componentValues,
    duplicateComponent,
    entityTypeForComponent,
    extractComponentRepeaters,
    removeComponent,
    changeComponentPage,
    setEntityCashflowType,
    setComponentType,
    setComponentValues,
    setComponentData,
    setEntityId,
    setEntityType,
    setRepeatFor,
    entitiesForComponent,
    entitiesForDataSpec,

    // PARAMETERS
    getValueParameters,
};
