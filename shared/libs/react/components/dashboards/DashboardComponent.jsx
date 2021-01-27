import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';

import {LightTheme} from 'themes';

import * as componentActions from 'actions/dashboards/components';

import {H3, H5} from 'components/basic/text';
import Loader from 'components/basic/Loader';
import Icon from 'components/basic/Icon';

import Button from 'components/basic/forms/Button';

const ComponentWrapper = styled.div`
    font-size: ${props => props.relativeFontSize}px;
    height: 100%;
    width: 100%;
    overflow: auto;
    box-sizing: border-box;
`;

const Error = styled(Flex)`
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    border: 1px dashed rgb(200, 200, 200);
    padding: 16px;
`;

const MoveButton = styled(Flex)`
    position: absolute;
    top: 0;
    left: 0;
    width: 18px;
    height: 18px;
    justify-content: center;
    align-items: center;

    background: rgba(255, 255, 255);
    border: 1px solid rgba(0, 0, 0, 0.6);
    border-radius: 3px;

    line-height: normal;

    transform: translate(-60%, -60%);
    z-index: 9000;
`;

const BottomToolbar = styled(Flex)`
    position: absolute;
    bottom: -6px;
    left: 0;

    background: #6d83a3;
    border-radius: 3px;

    transform: translateY(100%);
`;

class DashboardComponent extends React.PureComponent {
    static propTypes = {
        dataProvider: PropTypes.object,
        componentId: PropTypes.string,
        componentSpec: PropTypes.shape({
            requireData: PropTypes.bool.isRequired,
            type: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
        }),
        width: PropTypes.number,
        height: PropTypes.number,
        onSettingsChanged: PropTypes.func,
        isEditing: PropTypes.bool,
        settings: PropTypes.object,
    };

    handleClickRemoveButton = () => this.props.removeComponent();
    handleClickDuplicateButton = () => this.props.duplicateComponent();
    handleClickSettingsButton = () => this.props.toggleComponentSettings();

    render() {
        const {
            dataProvider,
            componentSpec,
            width,
            height,
            relativeFontSize,
            isEditing,
            innerRef,
            isSelected,
            sharedState,
            onSharedStateChange,
            onSettingsChanged,
            ...restProps
        } = this.props;

        const isReportingComponent = dataProvider && dataProvider.isReportingComponent();
        const foundReportingComponent = dataProvider && dataProvider.foundReportingComponent();
        const showSettings =
            isSelected && (isReportingComponent || componentSpec.settingsComponent);

        let content;
        if (isReportingComponent && !foundReportingComponent) {
            content = (
                <Error>
                    <H3>Could not find the specified reporting component</H3>
                    <H5>Please check your settings</H5>
                </Error>
            );
        } else if (dataProvider && dataProvider.isLoading()) {
            content = <Loader />;
        } else if (dataProvider && dataProvider.hasError()) {
            content = (
                <Error>
                    <H3>{dataProvider.getErrorMessage()}</H3>
                    <H5>Please check your settings</H5>
                </Error>
            );
        } else {
            const Component = componentSpec.type;
            content = (
                <LightTheme>
                    <Component
                        ref={innerRef}
                        dataProvider={dataProvider}
                        width={width}
                        height={height}
                        isEditing={isEditing && !isReportingComponent}
                        isSelected={isSelected}
                        sharedState={sharedState}
                        onSharedStateChange={onSharedStateChange}
                        onSettingsChanged={onSettingsChanged}
                        {...restProps}
                    />
                </LightTheme>
            );
        }

        return (
            <ComponentWrapper relativeFontSize={relativeFontSize}>
                {!isSelected ? null : (
                    <MoveButton>
                        <Icon name='move' glyphicon size={12} />
                    </MoveButton>
                )}
                {content}
                {!isSelected ? null : (
                    <BottomToolbar>
                        <Button onClick={this.handleClickRemoveButton}>
                            <Icon name='trash' glyphicon size={12} />
                        </Button>
                        <Button onClick={this.handleClickDuplicateButton}>
                            <Icon name='duplicate' glyphicon size={12} />
                        </Button>
                        <Button onClick={this.handleClickSettingsButton} disabled={!showSettings}>
                            <Icon name='cog' glyphicon size={12} />
                        </Button>
                    </BottomToolbar>
                )}
            </ComponentWrapper>
        );
    }
}

const mapStateToProps = (state, props) => {
    let dataProvider = props.componentSpec && props.componentSpec.provider;

    if (props.dataProvider) {
        dataProvider = props.dataProvider;
    } else if (dataProvider && dataProvider.fromSelector && props.componentId) {
        dataProvider = dataProvider.fromSelector(state, props.componentId);
    }

    return {dataProvider};
};

const mapActionsToProps = {
    removeComponent: componentActions.removeComponent,
    duplicateComponent: componentActions.duplicateComponent,
};

export default connect(mapStateToProps, mapActionsToProps)(DashboardComponent);
