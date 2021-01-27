import React from 'react';

import CPanelModeButton, {NonRouterLink} from 'components/basic/cpanel/CPanelModeButton';

const CompanyModeToggle = ({activeMode, setMode, modes}) => {
    return (
        <div>
            {modes.map(({key, label, url}) => (
                <CPanelModeButton
                    key={key}
                    isActive={key === activeMode}
                    onClick={() => setMode(key)}
                    linkComponent={url && NonRouterLink}
                    to={url}
                >
                    {label}
                </CPanelModeButton>
            ))}
        </div>
    );
};

export default CompanyModeToggle;
