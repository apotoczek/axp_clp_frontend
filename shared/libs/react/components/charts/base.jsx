import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';

import {is_set} from 'src/libs/Utils';

HighchartsExporting(Highcharts);
HighchartsExportData(Highcharts);

// Bug in highcharts 8.1.1: https://github.com/highcharts/highcharts/issues/13710
// Remove after upgrade with fix
window.Highcharts = Highcharts;

export const Title = styled(Flex)`
    color: #666666;
    font-size: 15px;
    padding: 8px 0;
    justify-content: center;
    align-items: center;
`;

const Wrapper = styled.div`
    .highcharts-contextbutton {
        opacity: 0;
        transition: opacity 300ms ease-out;
    }

    &:hover {
        .highcharts-contextbutton {
            transition: opacity 300ms ease-out;
            opacity: 1;
        }
    }
`;

export class Chart extends React.PureComponent {
    static propTypes = {
        config: PropTypes.object.isRequired,
        title: PropTypes.string,
    };

    static defaultProps = {
        title: 'Chart Title',
    };

    render() {
        return (
            <Wrapper>
                {is_set(this.props.title) && <Title>{this.props.title}</Title>}
                <HighchartsReact highcharts={Highcharts} options={this.props.config} immutable />
            </Wrapper>
        );
    }
}
