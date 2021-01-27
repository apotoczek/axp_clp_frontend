import React from 'react';
import styled, {css} from 'styled-components';

import Checkbox from 'components/basic/forms/Checkbox';
import TextInput from 'components/basic/forms/input/TextInput';

export const Section = styled.div`
    margin-bottom: 32px;
`;

export const SectionTitle = styled.div`
    font-family: Lato, sans-serif;
    font-size: 12px;
    color: ${({theme}) => theme.dashboard.settings.sectionTitleFg};
    letter-spacing: 1px;
    text-transform: uppercase;

    margin: 0 0 8px;
    padding: 0 8px;

    user-select: none;
`;

export const SectionSubTitle = styled.div`
    font-family: Lato, sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: ${({theme}) => theme.dashboard.settings.sectionSubTitleFg};
    letter-spacing: 0.86px;
    text-transform: uppercase;

    margin: ${props => (props.noTopMargin ? '0px' : '16px')} 0 8px;
    padding: 0 12px;

    user-select: none;
`;

export const Column = styled.div`
    vertical-align: top;
    display: inline-block;
    width: calc(${props => props.pct || 50}% - 16px);
    margin-right: 16px;
    margin-bottom: 10px;

    ${props =>
        props.last &&
        css`
            margin-right: 0;
            width: ${props => props.pct || 50}%;
        `}
`;

export const ChartSettings = ({settings, onChangeSetting}) => {
    return (
        <div>
            <SectionSubTitle>Text</SectionSubTitle>
            <Column>
                <TextInput
                    leftLabel='Title'
                    value={settings.title}
                    onValueChanged={title => onChangeSetting({title})}
                />
            </Column>
            <Column last>
                <Checkbox
                    checked={settings.titleDisabled || false}
                    leftLabel='Disable Title'
                    onValueChanged={titleDisabled => onChangeSetting({titleDisabled})}
                />
            </Column>
            <Column>
                <TextInput
                    leftLabel='Y Axis Label'
                    value={settings.yAxisLabel}
                    onValueChanged={yAxisLabel => onChangeSetting({yAxisLabel})}
                />
            </Column>
            <Column last>
                <TextInput
                    leftLabel='X Axis Label'
                    value={settings.xAxisLabel}
                    onValueChanged={xAxisLabel => onChangeSetting({xAxisLabel})}
                />
            </Column>
            <SectionSubTitle>Chart Components</SectionSubTitle>
            <Column>
                <Checkbox
                    checked={settings.gridDisabled || false}
                    leftLabel='Disable Grid'
                    onValueChanged={gridDisabled => onChangeSetting({gridDisabled})}
                />
            </Column>
            <Column last>
                <Checkbox
                    checked={settings.legendDisabled || false}
                    leftLabel='Disable Legend'
                    onValueChanged={legendDisabled => onChangeSetting({legendDisabled})}
                />
            </Column>
        </div>
    );
};
