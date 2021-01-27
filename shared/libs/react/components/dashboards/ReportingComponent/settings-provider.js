import {formattedDateSelectionValue} from 'src/helpers/dashboards';
import {BaseSettingsProvider} from 'providers/base-provider';

export default class ReportingComponentSettingsProvider extends BaseSettingsProvider {
    static fromSelector = BaseSettingsProvider.fromSelector(ReportingComponentSettingsProvider);

    getDeal(deals) {
        if (!deals) {
            return null;
        }

        for (const deal of deals) {
            if (deal.entity_uid !== this.componentData.base.entity.uid) {
                continue;
            }

            return deal;
        }
    }

    getReportingComponent(reportingComponents) {
        for (const reportingComponent of reportingComponents) {
            if (reportingComponent.uid !== this.componentData.base.reportingComponentId) {
                continue;
            }

            return reportingComponent;
        }
    }

    getAsOfDate() {
        return this.componentData.base.asOfDate;
    }

    getFormattedAsOfDate(globalDate) {
        return formattedDateSelectionValue(
            this.getAsOfDate(this.componentData),
            globalDate,
            '{M}/{d}/{yy}',
        );
    }
}
