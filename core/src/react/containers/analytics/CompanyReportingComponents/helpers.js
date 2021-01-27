import {oneLineTrim} from 'common-tags';

export class NavigationHelper {
    static getIdsFromMatch(match) {
        return match.params || {};
    }

    static companyListLink() {
        return '#!/company-analytics';
    }

    static companyReportingComponentsLink(companyId) {
        return oneLineTrim`
            /company-analytics
            /${companyId}
            /reporting-components
        `;
    }

    static newReportingComponentLink(companyId) {
        return oneLineTrim`
            /company-analytics
            /${companyId}
            /reporting-components
            /new
        `;
    }

    static editReportingComponentLink(companyId, instanceId) {
        return oneLineTrim`
            /company-analytics
            /${companyId}
            /reporting-components
            /${instanceId}
            /edit
        `;
    }

    static companyOverviewLink(companyId) {
        return oneLineTrim`
            #!
            /company-analytics
            /${companyId}
        `;
    }

    static companyMetricsLink(companyId) {
        return oneLineTrim`
            #!
            /company-analytics
            /${companyId}
            /metrics
        `;
    }
}
