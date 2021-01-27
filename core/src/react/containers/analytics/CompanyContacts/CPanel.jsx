import React, {useMemo} from 'react';

import CPanel from 'components/basic/cpanel/base';
import CPanelModeButton, {NonRouterLink} from 'components/basic/cpanel/CPanelModeButton';

export default function CompanyReportingComponentsCPanel({companyId}) {
    const CPanelModes = useMemo(() => {
        return [
            {
                key: 'overview',
                label: 'Overview',
                toUrl: `#!/company-analytics/${companyId}`,
                linkComponent: NonRouterLink,
            },
            {
                key: 'metrics',
                label: 'Metrics',
                toUrl: `#!/company-analytics/${companyId}/metrics`,
                linkComponent: NonRouterLink,
            },
            {
                key: 'reporting_components',
                label: 'Reporting Components',
                toUrl: `#!/company-analytics/${companyId}/reporting-components`,
                linkComponent: NonRouterLink,
            },
            {
                key: 'contacts',
                label: 'Contacts',
                toUrl: `#!/company-analytics/${companyId}/contacts`,
                linkComponent: NonRouterLink,
            },
        ];
    }, [companyId]);

    return (
        <CPanel>
            {CPanelModes.map(({key, label, toUrl, linkComponent}) => (
                <CPanelModeButton
                    key={key}
                    isActive={key === 'contacts'}
                    to={toUrl}
                    linkComponent={linkComponent}
                >
                    {label}
                </CPanelModeButton>
            ))}
        </CPanel>
    );
}
