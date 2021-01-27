import React from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {backend_date} from 'src/libs/Formatters';

const defaultMargin = 16;

const widthCalc = props => {
    const columnCount = props.columnCount || 1;
    const margin = props.margin || defaultMargin;

    const baseWidth = 100 / columnCount;
    const marginDiff = (margin * (columnCount - 1)) / columnCount;

    return `${baseWidth}% - ${marginDiff}px`;
};

const Wrapper = styled.div`
    &::after {
        content: '';
        display: block;
        clear: both;
    }
`;

export const Table = styled.div`
    width: calc(${props => widthCalc(props)});

    float: left;
    margin-right: ${props => props.margin || defaultMargin}px;

    &:nth-child(${props => props.columnCount}n) {
        margin-right: 0;
    }

    &:nth-child(n + ${props => props.columnCount + 1}) {
        margin-top: ${props => props.margin || defaultMargin}px;
    }
`;

export const Header = styled.div`
    width: 100%;
    background: ${({theme}) => theme.metaDataTable.labelBg};
    padding: 12px;
    color: ${({theme}) => theme.metaDataTable.labelFg};
    font-weight: 700;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 1px;
    border: 1px solid #bec2d5;
    border-radius: 2px;
`;

export const Row = styled.div`
    width: 100%;
    overflow: auto;
    background: ${({theme}) => theme.metaDataTable.evenRowBg};

    :nth-child(odd) {
        background: ${({theme}) => theme.metaDataTable.oddRowBg};
    }

    border: 1px solid #bec2d5;
    border-top: 0;
`;

const Cell = styled.div`
    padding: 10px 12px;
    color: ${({theme}) => theme.metaDataTable.cellFg};
    width: ${props => (props.stack ? '100%' : '50%')};
    float: ${props => (props.stack ? 'none' : 'left')};
`;

export const Value = styled(Cell)`
    ${props =>
        props.stack &&
        css`
            padding-top: 5px;
        `}
`;

export const Label = styled(Cell)`
    ${props =>
        props.stack &&
        css`
            padding-bottom: 0;
        `}

    font-weight: 700;
`;

export const convertReportingMeta = data => {
    if (!data || !data.meta_data) {
        return [];
    }

    return data.meta_data.map(item => {
        const as_of = item.date || data.as_of;

        const subLabel = as_of ? backend_date(as_of) : undefined;

        return {
            label: item.label,
            values: item.fields,
            subLabel,
        };
    });
};

export default class MetaDataTable extends React.Component {
    static propTypes = {
        metaData: PropTypes.arrayOf(
            PropTypes.shape({
                label: PropTypes.string.isRequired,
                subLabel: PropTypes.string,
                values: PropTypes.arrayOf(
                    PropTypes.shape({
                        label: PropTypes.string.isRequired,
                        value: PropTypes.node.isRequired,
                    }),
                ),
            }),
        ),
        stackLength: PropTypes.number,
    };

    static defaultProps = {
        stackLength: 60,
        metaData: [],
    };

    render() {
        const {metaData, stackLength} = this.props;
        return (
            <Wrapper>
                {metaData.map(({label: tableLabel, subLabel, values}) => (
                    <Table
                        key={subLabel ? `${tableLabel}-${subLabel}` : tableLabel}
                        columnCount={Math.min(metaData.length, 3)}
                    >
                        <Header>
                            {tableLabel}
                            {subLabel && ` - ${subLabel}`}
                        </Header>
                        {values.map(({label, value}) => (
                            <Row key={label}>
                                <Label stack={value.length > stackLength}>{label}</Label>
                                <Value stack={value.length > stackLength}>{value}</Value>
                            </Row>
                        ))}
                    </Table>
                ))}
            </Wrapper>
        );
    }
}
