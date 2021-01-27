import React from 'react';
import styled from 'styled-components';
import ListItem from 'components/basic/forms/selection/ListItem';
import PropTypes from 'prop-types';

let Wrapper = styled.div`
    position: relative;
    display: inline-block;
    border: 1px solid ${({theme}) => theme.multiSelect.listBoxBorder};
    color: ${({theme}) => theme.multiSelect.listBoxFg};
    height: 300px;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
    background-color: ${({theme}) => theme.multiSelect.listBoxBg};
`;

export default class ListBox extends React.Component {
    wrapper = React.createRef();

    static propTypes = {
        onSelect: PropTypes.func.isRequired,
        onMove: PropTypes.func,
        options: PropTypes.array.isRequired,
        action: PropTypes.shape({
            color: PropTypes.string.isRequired,
            symbol: PropTypes.string.isRequired,
        }).isRequired,
        labelKey: PropTypes.string.isRequired,
        disabledKeys: PropTypes.arrayOf(PropTypes.string),
        metaKey: PropTypes.string,
        listItem: PropTypes.func,
    };

    static defaultProps = {
        labelKey: 'name',
        keyKey: 'key',
        disabledKeys: [],
        listItem: ListItem,
    };

    componentDidUpdate(prevProps) {
        const {scrollOnUpdate, options} = this.props;

        if (scrollOnUpdate && options.length !== prevProps.options.length) {
            this.wrapper.current.scrollTop = this.wrapper.current.scrollHeight;
        }
    }

    render() {
        const {
            options,
            action,
            onSelect,
            onMove,
            height,
            metaKey,
            labelKey,
            keyKey,
            disabledKeys,
            listItem: TheListItem,
        } = this.props;

        return (
            <Wrapper height={height} ref={this.wrapper}>
                {options.map((option, index) => (
                    <TheListItem
                        index={index}
                        disabled={disabledKeys.indexOf(option.key) > -1}
                        key={option[keyKey]}
                        labelKey={labelKey}
                        metaKey={metaKey}
                        actionColor={action.color}
                        actionSym={action.symbol}
                        item={option}
                        onClick={onSelect}
                        onMove={onMove}
                    />
                ))}
            </Wrapper>
        );
    }
}
