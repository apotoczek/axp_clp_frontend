import React from 'react';
import PropTypes from 'prop-types';

import CPanel, {
    CPanelSection,
    CPanelSectionTitle,
    CPanelButton,
} from 'components/basic/cpanel/base';
import CPanelInput from 'components/basic/cpanel/CPanelInput';

export default class DashboardListCPanel extends React.Component {
    static propTypes = {
        searchFilterValue: PropTypes.string,
        onFilterChange: PropTypes.func.isRequired,
    };

    render() {
        return (
            <CPanel>
                <CPanelSection>
                    <CPanelSectionTitle>Search</CPanelSectionTitle>
                    <CPanelInput
                        placeholder='Name...'
                        value={this.props.searchFilterValue}
                        onChange={e => this.props.onFilterChange(e.target.value)}
                    />
                    <CPanelButton>Clear All</CPanelButton>
                </CPanelSection>
            </CPanel>
        );
    }
}
