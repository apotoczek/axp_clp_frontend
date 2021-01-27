import React from 'react';
import PropTypes from 'prop-types';
import {Flex} from '@rebass/grid';
import styled from 'styled-components';

import Checkbox from 'components/basic/forms/Checkbox';
import Input from 'components/basic/forms/input/Input';
import {Label} from 'components/basic/forms/base';

const CollapsibleWrapper = styled(Flex)`
    background: ${({theme}) => theme.input.wrapperBg};
    cursor: pointer;
`;

const Row = styled(Flex)`
    border-bottom: 1px solid ${({theme}) => theme.collapsibleList.rowBorder};
`;

const SpecialLabel = styled(Label)`
    color: ${({highlight, theme}) => highlight && theme.input.validValueFg};
`;

export default class CollapsibleList extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.any,
                label: PropTypes.string,
                selectable: PropTypes.bool,
                disableCollapse: PropTypes.bool,
                children: PropTypes.any,
                selected: PropTypes.bool,
            }),
        ),
        onSelect: PropTypes.func,
    };

    static defaultProps = {
        items: [],
        onSelect: () => {},
    };

    /*
        Initialize a state where all collapsibles are closed. Structure is an object with
        item keys referencing a boolean. {itemA: false, itemB: false}
    */
    state = {
        isOpen: this.props.items.reduce(
            (accumulator, current) => ({[current]: false, ...accumulator}),
            {},
        ),
    };

    handleSelect(value, checked) {
        this.props.onSelect(value, checked);
    }

    handleToggleCollapsible = value => {
        this.setState(state => ({
            isOpen: {
                ...state.isOpen,
                [value]: !state.isOpen[value],
            },
        }));
    };

    renderCollapsible = ({
        value,
        label,
        children,
        highlight,
        selected = false,
        selectable = false,
        disableCollapse = false,
    }) => {
        const isOpen = this.state.isOpen[value];

        return (
            <CollapsibleWrapper key={value} flexDirection='column'>
                <Row highlight={highlight}>
                    <Input
                        highlight={highlight}
                        noBorder
                        leftGlyphicon
                        flex='1 1 auto'
                        leftIcon={
                            disableCollapse ? undefined : isOpen ? 'chevron-down' : 'chevron-right'
                        }
                        label={<SpecialLabel highlight={highlight}>{label}</SpecialLabel>}
                        onClick={
                            disableCollapse
                                ? selectable
                                    ? () => this.handleSelect(value, !selected)
                                    : undefined
                                : () => this.handleToggleCollapsible(value)
                        }
                    />
                    {selectable && (
                        <Checkbox
                            noBorder
                            checked={selected}
                            onValueChanged={() => this.handleSelect(value, !selected)}
                        />
                    )}
                </Row>
                {isOpen && <Flex flexDirection='column'>{children}</Flex>}
            </CollapsibleWrapper>
        );
    };

    render() {
        return <Flex flexDirection='column'>{this.props.items.map(this.renderCollapsible)}</Flex>;
    }
}
