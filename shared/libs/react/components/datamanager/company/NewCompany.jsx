import React from 'react';
import styled from 'styled-components';

import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import {Viewport, Page, Content, Section} from 'components/layout';

import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import Checkbox from 'components/basic/forms/Checkbox';
import {Box} from '@rebass/grid';
import {is_set, date_to_epoch} from 'src/libs/Utils';

import {H1, H2, Description} from 'components/basic/text';

// import SpreadsheetWizard from 'containers/SpreadsheetWizard';
import {LightTheme} from 'themes';

import DealForm from 'components/datamanager/DealForm';
import CompanyForm from 'components/datamanager/CompanyForm';

const toEpoch = d => (d ? date_to_epoch(d) : null);
const currentYear = () => new Date().getFullYear();

const DealFormContainer = styled.div`
    margin-top: 8px;
    padding: 10px;
    background-color: #fcfcfd;
    border: 1px solid #bec2d5;
    border-radius: 3px;
`;

class NewCompany extends React.Component {
    state = {
        createDeal: false,

        dealData: {},
        dealAttributes: {},
        dealErrors: {},

        companyData: {
            fiscal_data: {
                year_end: date_to_epoch(new Date(currentYear(), 11, 31)),
                q1: date_to_epoch(new Date(currentYear(), 2, 31)),
                q2: date_to_epoch(new Date(currentYear(), 5, 30)),
                q3: date_to_epoch(new Date(currentYear(), 8, 30)),
                q4: date_to_epoch(new Date(currentYear(), 11, 31)),
            },
        },
        companyAttributes: {},
        companyErrors: {},
    };

    handleSave = () => {
        const {newCompany} = this.props;

        const {companyData, companyAttributes, dealData, dealAttributes, createDeal} = this.state;

        if (!is_set(companyData.name)) {
            this.setState({
                companyErrors: {
                    ...this.state.companyErrors,
                    name: 'Name is required',
                },
            });

            return;
        }

        const data = {
            company: {
                ...companyData,
                attributes: companyAttributes,
            },
        };

        if (createDeal) {
            if (!is_set(dealData.user_fund_uid)) {
                this.setState({
                    companyErrors: {},
                    dealErrors: {
                        ...this.state.dealErrors,
                        user_fund_uid: 'Fund is required',
                    },
                });

                return;
            }

            data.deal = {
                ...dealData,
                attributes: dealAttributes,
                acquisition_date: toEpoch(dealData.acquisition_date),
                exit_date: toEpoch(dealData.exit_date),
            };
        }

        newCompany(data);
    };

    handleCancel = () => {
        this.props.cancel();
    };

    handleValueChanged = scope => (key, value) => {
        const {[scope]: scopeData} = this.state;

        this.setState({[scope]: {...scopeData, [key]: value}});
    };

    handleAttrChanged = scope => (uid, value) => {
        const {[scope]: scopeData} = this.state;

        this.setState({[scope]: {...scopeData, [uid]: value}});
    };

    renderDealForm = () => {
        const {attributes, options} = this.props;

        const {dealData, dealAttributes, dealErrors} = this.state;

        const dealValues = {...dealData, attributes: dealAttributes};

        return (
            <DealFormContainer>
                <H2>Deal Information</H2>
                <DealForm
                    values={dealValues}
                    onValueChanged={this.handleValueChanged('dealData')}
                    onAttrChanged={this.handleAttrChanged('dealAttributes')}
                    attributes={attributes}
                    errors={dealErrors}
                    options={options}
                />
            </DealFormContainer>
        );
    };

    render = () => {
        const {attributes, options, contentOnly = false} = this.props;

        const {companyData, companyAttributes, createDeal, companyErrors} = this.state;

        const companyValues = {...companyData, attributes: companyAttributes};

        const content = (
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
                        <H1>New Company</H1>
                        <Description>Create a new company.</Description>
                    </Box>
                    <CompanyForm
                        values={companyValues}
                        onValueChanged={this.handleValueChanged('companyData')}
                        onAttrChanged={this.handleAttrChanged('companyAttributes')}
                        attributes={attributes}
                        errors={companyErrors}
                        options={options}
                    />
                    <Box p={1} mt={20}>
                        <Box width={1 / 3}>
                            <Checkbox
                                label='Create Deal'
                                placeholder='Fill out additional information to create deal'
                                checked={createDeal}
                                onValueChanged={value => this.setState({createDeal: value})}
                            />
                        </Box>
                        {createDeal && this.renderDealForm(this.props)}
                    </Box>
                </Section>
            </Content>
        );

        if (contentOnly) {
            return content;
        }
        return (
            <Viewport>
                <Breadcrumbs
                    path={['Data Manager', 'Companies', 'New Company']}
                    urls={['#!/data-manager', '#!/data-manager/companies']}
                    linkComponent={NonRouterLink}
                />
                <LightTheme>
                    <Page>{content}</Page>
                </LightTheme>
            </Viewport>
        );
    };
}

export default NewCompany;
