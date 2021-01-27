import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import ExtraPropTypes from 'utils/extra-prop-types';

import {Flex, Box} from '@rebass/grid';
import {partition} from 'src/libs/Utils';
import genFormatter from 'utils/formatters';

import {Table, TableBody, Cell, Row} from 'components/basic/table';

const LabelCell = styled(Cell)`
    vertical-align: middle;

    font-weight: 600;
    color: ${({theme}) => theme.metricTable.labelFg};
    background-color: ${({theme}) => theme.metricTable.bg};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 0;
`;

const ValueCell = styled(Cell)`
    vertical-align: middle;

    text-align: right;
    font-weight: 300;
    font-size: 1.1em;
    color: ${({theme}) => theme.metricTable.valueFg};
    background-color: ${({theme}) => theme.metricTable.bg};
    letter-spacing: 0.5px;
    padding: 4px 0;
`;

const MetricTableRow = styled(Row)`
    border-top: 1px solid ${({theme}) => theme.metricTable.border};
    background-color: transparent;

    &:last-child {
        border-bottom: 1px solid ${({theme}) => theme.metricTable.border};
    }
`;

const Column = styled(Box)`
    padding: 0 8px;

    &:first-child {
        padding-left: 0;
    }

    &:last-child {
        padding-right: 0;
    }
`;

class MetricTable extends React.Component {
    static propTypes = {
        rows: PropTypes.arrayOf(
            PropTypes.shape({
                key: PropTypes.string,
                label: PropTypes.string.isRequired,
                value: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.number,
                    ExtraPropTypes.uuid,
                ]),
                format: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
            }),
        ).isRequired,
        numColumns: PropTypes.number,
    };

    static defaultProps = {
        numColumns: 1,
    };

    render() {
        const {rows, numColumns} = this.props;

        const columns = partition(rows, numColumns);
        const width = 1 / numColumns;

        return (
            <Flex>
                {columns.map((rows, idx) => (
                    <Column key={idx} width={width}>
                        <Table>
                            <TableBody>
                                {rows.map(({key, label, value, format}) => (
                                    <MetricTableRow key={key || label}>
                                        <LabelCell>{label}</LabelCell>
                                        <ValueCell>{genFormatter(format)(value)}</ValueCell>
                                    </MetricTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Column>
                ))}
            </Flex>
        );
    }
}

export default MetricTable;
