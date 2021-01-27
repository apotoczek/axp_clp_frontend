import {date_to_epoch} from 'src/libs/Utils';

import {Box} from '@rebass/grid';
import React from 'react';
import {LightTheme} from 'themes';

import {Page, Content, Section} from 'components/layout';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import {H1, H3, Description} from 'components/basic/text';
import {is_set} from 'src/libs/Utils';

import DealForm from 'components/datamanager/DealForm';

const toEpoch = d => (d ? date_to_epoch(d) : null);

class NewDeal extends React.Component {
    state = {
        attributes: {},
        data: {},
        errors: {},
    };

    handleSave = () => {
        const {newDeal, company} = this.props;
        const {data, attributes, errors} = this.state;

        if (!is_set(data.user_fund_uid)) {
            this.setState({
                errors: {
                    ...errors,
                    user_fund_uid: 'Fund is required',
                },
            });

            return;
        }

        newDeal({
            ...data,
            attributes,
            company_uid: company.uid,
            acquisition_date: toEpoch(data.acquisition_date),
            exit_date: toEpoch(data.exit_date),
        });

        this.props.setMode('overview');
    };

    handleCancel = () => {
        this.props.setMode('overview');
    };

    handleValueChanged = (key, value) => {
        this.setState({data: {...this.state.data, [key]: value}});
    };

    handleAttrChanged = (uid, value) => {
        this.setState({attributes: {...this.state.attributes, [uid]: value}});
    };

    render = () => {
        const {company, attributes, options} = this.props;

        const values = {...this.state.data, attributes: this.state.attributes};

        return (
            <LightTheme>
                <Page>
                    <Content>
                        <Toolbar flex>
                            <ToolbarItem onClick={this.handleSave} right>
                                Save
                            </ToolbarItem>
                            <ToolbarItem onClick={this.handleCancel} right>
                                Cancel
                            </ToolbarItem>
                        </Toolbar>
                        <Section p={10}>
                            <Box p={10}>
                                <H1>New Deal</H1>
                                <H3>for {company.name}</H3>
                                <Description>Create a new deal.</Description>
                            </Box>
                            <DealForm
                                values={values}
                                onValueChanged={this.handleValueChanged}
                                onAttrChanged={this.handleAttrChanged}
                                attributes={attributes}
                                errors={this.state.errors}
                                options={options}
                            />
                        </Section>
                    </Content>
                </Page>
            </LightTheme>
        );
    };
}

export default NewDeal;
