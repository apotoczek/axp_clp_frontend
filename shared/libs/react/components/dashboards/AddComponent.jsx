import React, {useState, useCallback, PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Flex} from '@rebass/grid';
import memoize from 'lodash.memoize';

import Button from 'components/basic/forms/Button';
import TextInput from 'components/basic/forms/input/TextInput';
import Icon from 'components/basic/Icon';
import {BarButton} from 'components/dashboards/buttons';
import TopBar from 'components/dashboards/TopBar';
import {ScrollableContent} from 'components/layout';

import {Column, Columns} from 'containers/dashboards/EditReportContainer/shared';

AddComponent.propTypes = {
    columnRef: PropTypes.shape({
        current: PropTypes.instanceOf(Element),
    }),
    onAddComponent: PropTypes.func.isRequired,
};
export default function AddComponent({
    columnRef,
    onAddComponent,
    onChangeColumn,
    availableComponents,
}) {
    const [showingForm, setShowingForm] = useState(false);

    const selectComponent = useCallback(
        componentKey => {
            if (!availableComponents[componentKey].newComponentForm) {
                onAddComponent({componentData: {componentKey}});
                setShowingForm(false);
                return;
            }
            setShowingForm(componentKey);
            columnRef.current.scrollTo(0, 0);
        },
        [availableComponents, columnRef, onAddComponent],
    );

    const addComponent = useCallback(
        component => {
            onAddComponent(component);
            setShowingForm(false);
            onChangeColumn(Columns.EDITOR);
        },
        [onAddComponent, onChangeColumn],
    );

    const cancelForm = useCallback(() => setShowingForm(false), []);

    const NewComponentForm = (availableComponents[showingForm] || {}).newComponentForm;

    return (
        <Column
            ref={columnRef}
            flex={`1 0 ${showingForm ? '100%' : '325px'}`}
            justifyContent='flex-end'
            flexDirection='row'
        >
            {showingForm && <NewComponentForm onConfirm={addComponent} onCancel={cancelForm} />}
            <ComponentSearch
                onSelectComponent={selectComponent}
                onChangeColumn={onChangeColumn}
                availableComponents={availableComponents}
            />
        </Column>
    );
}

const Wrapper = styled(Flex)`
    flex: 0 0 325px;

    border-radius: 3px;
    color: #f5f5f5;
`;

const CategoryButton = styled(Button)`
    overflow: hidden;
    margin: 0 2px;
    width: 20%;
    padding: 10px 0;
    text-align: center;
    background: ${({theme}) => theme.dashboard.addComponent.categoryButton.bg};
    color: ${({theme}) => theme.dashboard.addComponent.categoryButton.fg};
    border: 1px solid ${({theme}) => theme.dashboard.addComponent.categoryButton.border};

    transition: border 150ms ease-out, padding 150ms ease-out;

    &:hover {
        background: ${({theme}) => theme.dashboard.addComponent.categoryButton.bg};
        border: 1px solid ${({theme}) => theme.dashboard.addComponent.categoryButton.border};
        border-bottom: 2px solid ${({theme}) => theme.dashboard.addComponent.categoryButton.fgHover};
        padding-bottom: 9px;
        color: ${({theme}) => theme.dashboard.addComponent.categoryButton.fgHover};
    }

    ${props =>
        props.highlighted &&
        css`
            background: ${({theme}) => theme.dashboard.addComponent.categoryButton.activeBg};
            color: ${({theme}) => theme.dashboard.addComponent.categoryButton.activeFg};
            border-bottom: 2px solid
                ${({theme}) => theme.dashboard.addComponent.categoryButton.activeBorder};
            padding: 10px 0 9px 0;
        `};
`;

const GridItem = styled(Flex)`
    background: ${({theme}) => theme.dashboard.addComponent.gridItem.bg};
    max-width: 140px;
    min-width: 140px;
    height: 140px;
    margin: 6px 0;
    border-radius: 3px;

    cursor: pointer;

    transition: all 300ms ease-in-out;

    border: 1px solid ${({theme}) => theme.dashboard.addComponent.gridItem.border};

    &:hover {
        background: ${({theme}) => theme.dashboard.addComponent.gridItem.hoverBg};
        color: ${({theme}) => theme.dashboard.addComponent.gridItem.hoverFg};
        box-shadow: ${({theme}) => theme.dashboard.addComponent.gridItem.hoverDropShadow};
    }

    opacity: 1;
    color: ${({theme}) => theme.dashboard.addComponent.gridItem.fg};
    ${props =>
        props.active &&
        css`
            background: ${({theme}) => theme.dashboard.addComponent.gridItem.activeBg};
            color: ${({theme}) => theme.dashboard.addComponent.gridItem.activeFg};
            box-shadow: ${({theme}) => theme.dashboard.addComponent.gridItem.activeDropShadow};
        `}

    ${props =>
        props.disabled &&
        css`
            opacity: 0.3;
        `}
`;

const SearchInput = styled(TextInput)`
    width: 100%;

    &:focus-within {
        width: 100%;
    }

    transition: width 300ms ease-in-out;
`;

const ExpandedAreaImage = styled.img`
    display: block;
    max-width: 50%;
    max-height: 50%;

    filter: grayscale(100%);
    opacity: 0.8;
`;

const ComponentName = styled.span`
    text-transform: uppercase;
    text-align: center;
`;

const GridContainer = styled(Flex)`
    padding: 0 16px;
    min-height: 160px;
    max-height: 600px;
`;

const CategoryWrapper = styled(Flex)`
    padding: 8px 14px;
`;

class ComponentSearch extends PureComponent {
    static propTypes = {
        onSelectComponent: PropTypes.func.isRequired,
        onChangeColumn: PropTypes.func.isRequired,
        availableComponents: PropTypes.object,
    };

    state = {
        filter: '',
        display: Object.keys(this.props.availableComponents),
        selected_category: 'All',
    };

    onFocusSearch = () => {
        window.addEventListener('keydown', this.onKeyDown);
    };

    onBlurSearch = () => {
        window.removeEventListener('keydown', this.onKeyDown);
    };

    onKeyDown = event => {
        const {filter: filterString, display: componentKeys} = this.state;

        if (event.key === 'Enter' && filterString.length) {
            const filteredKeys = componentKeys.filter(key => !this.isFiltered(key, filterString));

            if (filteredKeys.length === 1) {
                this.setState({filter: ''});
                this.props.onSelectComponent(filteredKeys[0]);
            }
        }
    };

    handleCategoryDisplay = category => {
        let displayed;

        const componentKeys = Object.keys(this.props.availableComponents);

        category == 'All'
            ? (displayed = componentKeys)
            : (displayed = componentKeys.filter(
                  key => this.props.availableComponents[key].category == category,
              ));

        this.setState({display: displayed, selected_category: category});
    };

    isFiltered = (key, text) => {
        return key.toLowerCase().indexOf(text.toLowerCase()) <= -1;
    };

    orderDisplayed = (displayed, filterString) => {
        let reorderedDisplayed = [...displayed];
        if (filterString != '') {
            reorderedDisplayed.sort((left, right) => {
                if (!this.isFiltered(left, filterString) && !this.isFiltered(right, filterString)) {
                    return 0;
                } else if (!this.isFiltered(left, filterString)) {
                    return -1;
                } else if (!this.isFiltered(right, filterString)) {
                    return 1;
                }
                return 0;
            });
        }
        return reorderedDisplayed;
    };

    handleClickGridItem = memoize(componentKey => () => this.props.onSelectComponent(componentKey));

    render() {
        const filterString = this.state.filter;
        const displayed = this.orderDisplayed(this.state.display, filterString);
        const {availableComponents} = this.props;

        const categories = Array.from(
            new Set(Object.values(availableComponents).map(({category}) => category)),
        );

        return (
            <Wrapper flexDirection='column'>
                <TopBar px={16} justifyContent='flex-end' mb={2} borderRight>
                    <BarButton
                        flex='0 1 auto'
                        onClick={() => this.props.onChangeColumn(Columns.EDITOR)}
                        mr={2}
                    >
                        Close
                        <Icon name='chevron-right' glyphicon right />
                    </BarButton>
                </TopBar>
                <Flex px={16}>
                    <SearchInput
                        leftIcon='search'
                        small
                        placeholder='Search for a component'
                        onValueChanged={filter => this.setState({filter})}
                        debounceValueChange={false}
                        value={this.state.filter}
                        onFocus={this.onFocusSearch}
                        onBlur={this.onBlurSearch}
                    />
                </Flex>
                <CategoryWrapper>
                    {['All', ...categories].map(category => (
                        <CategoryButton
                            key={category.toLowerCase()}
                            onClick={() => this.handleCategoryDisplay(category)}
                            highlighted={this.state.selected_category == category}
                            normal
                        >
                            {category}
                        </CategoryButton>
                    ))}
                </CategoryWrapper>
                <ScrollableContent hideScroll>
                    <GridContainer flex='1 1 auto' flexWrap='wrap' justifyContent='space-between'>
                        {displayed.map(componentKey => (
                            <GridItem
                                key={componentKey}
                                flex='1 1 auto'
                                flexDirection='column'
                                disabled={
                                    this.state.filter &&
                                    this.isFiltered(componentKey, this.state.filter)
                                }
                                active={
                                    this.state.filter &&
                                    !this.isFiltered(componentKey, this.state.filter)
                                }
                                onClick={this.handleClickGridItem(componentKey)}
                            >
                                <Flex justifyContent='center' alignItems='center' flex='1 1 auto'>
                                    <ExpandedAreaImage
                                        src={availableComponents[componentKey].icon}
                                    />
                                </Flex>
                                <Flex justifyContent='center' alignItems='flex-end' pb={2}>
                                    <ComponentName>
                                        {(availableComponents[componentKey] || {}).label}
                                    </ComponentName>
                                </Flex>
                            </GridItem>
                        ))}
                    </GridContainer>
                </ScrollableContent>
            </Wrapper>
        );
    }
}
