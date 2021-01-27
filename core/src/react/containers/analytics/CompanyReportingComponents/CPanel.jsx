import React, {useMemo} from 'react';

import CPanelModeButton, {NonRouterLink} from 'components/basic/cpanel/CPanelModeButton';

import {NavigationHelper} from './helpers';

export function CPanelModes({companyId}) {
    const modes = useMemo(() => {
        return [
            {
                key: 'overview',
                label: 'Overview',
                toUrl: NavigationHelper.companyOverviewLink(companyId),
                linkComponent: NonRouterLink,
            },
            {
                key: 'metrics',
                label: 'Metrics',
                toUrl: NavigationHelper.companyMetricsLink(companyId),
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
        <>
            {modes.map(({key, label, toUrl, linkComponent}) => (
                <CPanelModeButton
                    key={key}
                    isActive={key === 'reporting_components'}
                    to={toUrl}
                    linkComponent={linkComponent}
                >
                    {label}
                </CPanelModeButton>
            ))}
        </>
    );
}
