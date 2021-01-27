import React, {useCallback, useEffect, useMemo} from 'react';
import {useBackendEndpoint, useBackendData} from 'utils/backendConnect';
import {callActionEndpoint, formPost} from 'api';

import NewCompany from 'components/datamanager/company/NewCompany';
import * as Utils from 'src/libs/Utils';
import {ScrollableContent} from 'components/layout';
import CPanel from 'components/basic/cpanel/base';
import config from 'config';
import {conditional_element} from 'src/libs/Utils';
import auth from 'auth';
import {flattenMembers} from 'bison/utils/attributes';
import Loader from 'components/basic/Loader';
import Toolbar from 'components/basic/Toolbar';
import {Content, Page, Viewport} from 'components/layout';
import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import NewDeal from 'components/datamanager/company/NewDeal';
import * as api from 'api';
import CompanyModeToggle from 'components/datamanager/company/CompanyModeToggle';

import CompanyOverview from 'containers/analytics/CompanyOverview';
import CompanyMetricSets from 'containers/analytics/CompanyMetricSets';
import CompanyCalculatedMetricSet from 'containers/analytics/CompanyCalculatedMetricSet';
import CompanyMetricSet from 'containers/analytics/CompanyMetricSet';
import CompanyDataUpload from 'containers/reporting/CompanyDataUpload';
import SupportingDocumentsList from 'components/reporting/sender/SupportingDocumentsList';
import Valuations from 'components/datamanager/company/Valuations';
import TextValues from 'components/datamanager/company/TextValues';
import CompanyReportingComponents from 'containers/analytics/CompanyReportingComponents';
import CompanyContacts from 'containers/analytics/CompanyContacts';

import {LightTheme} from 'themes';
import NotificationManager from 'components/NotificationManager';
import history from 'utils/history';
import {Router, Switch, Route} from 'react-router-dom';

function useCompanyOptions() {
    const {data: _currencies, hasData: hasCurrencies} = useBackendData(
        'dataprovider/currency_markets',
        {},
        {initialData: []},
    );
    const currencies = useMemo(() => {
        const currencies = {};
        for (const currency of _currencies) {
            currencies[currency.id] = `${currency.symbol} - ${currency.name}`;
        }
        return currencies;
    }, [_currencies]);

    const {data: _funds, hasData: hasFunds} = useBackendData('dataprovider/vehicles', {
        target: 'vehicles',
        results_per_page: 'all',
        filters: {
            entity_type: 'user_fund',
            cashflow_type: 'gross',
            permission: ['write', 'share'],
            exclude_portfolio_only: true,
        },
    });
    const funds = useMemo(() => {
        const funds = {};
        for (const vehicle of _funds?.results ?? []) {
            funds[vehicle.user_fund_uid] = vehicle.name;
        }
        return funds;
    }, [_funds]);

    const {data: _attributes, hasData: hasAttributes} = useBackendData('dataprovider/attributes', {
        target: 'attributes',
        include_members: true,
        include_public_attributes: true,
        results_per_page: 'all',
    });
    const attributes = useMemo(() => {
        const attributes = {};
        for (const attribute of _attributes?.results ?? []) {
            attributes[attribute.uid] = {
                uid: attribute.uid,
                name: attribute.name,
                members: flattenMembers(attribute.members),
                scope: attribute.scope,
            };
        }
        return attributes;
    }, [_attributes]);

    return {
        isLoading: !hasAttributes || !hasCurrencies || !hasFunds,
        currencies,
        funds,
        attributes,
    };
}

function useCompanyData(companyUid) {
    // This method fetches all the data that company analytics views expect to be passed as props. Long-term this
    // should be refactored to be fetched further down the component tree. For now this is equivalent to what the
    // knockout container does, which I'm hoping will help avoid breaking things. - Renee

    const {data: company, hasData: hasCompany} = useBackendData('dataprovider/company_data', {
        company_uid: companyUid,
    });
    const {
        data: fiscalQuarters,
        hasData: hasFiscalQuarters,
    } = useBackendData('dataprovider/fiscal_quarters', {company_uid: companyUid});

    const {data: deals, hasData: hasDeals} = useBackendData('dataprovider/deals', {
        results_per_page: 'all',
        company_uid: companyUid,
        attribute_uid_mapping: true,
        include_company_attributes: false,
    });

    const {data: uploadPermission} = useBackendData(
        'reporting/has-upload-permission',
        {company_uid: companyUid},
        {initialData: null},
    );
    const modes = [
        {label: 'Overview', key: 'overview'},
        {label: 'Operating Metrics', key: 'metrics'},
        ...conditional_element([{label: 'Data Upload', key: 'data_upload'}], uploadPermission),
        ...conditional_element(
            [{label: 'Documents', key: 'supporting_documents'}],
            auth.user_has_feature('data_collection'),
        ),
        {label: 'Valuations', key: 'valuations'},
        {label: 'Text Values', key: 'text_values'},
        ...conditional_element(
            [{label: 'Reporting Components', key: 'reporting_components'}],
            auth.user_has_feature('dashboards_beta'),
        ),
        {label: 'Contacts', key: 'contacts'},
    ];

    const {isLoading: isLoadingOptions, attributes, currencies, funds} = useCompanyOptions();

    const hasAllData = [hasCompany, hasFiscalQuarters, hasDeals, !isLoadingOptions].every(v => v);

    return {
        isLoading: !hasAllData,
        companyData: {
            company: company,
            fiscalQuarters,
            attributes,
            options: {
                currencies: currencies,
                funds: funds,
            },
            modes,
            deals: deals?.results ?? [],
        },
    };
}

function NewDealPage(childProps) {
    const {triggerEndpoint: _newDeal} = useBackendEndpoint('useractionhandler/new_deal');
    const newDeal = useCallback(
        ({company_uid, user_fund_uid, ...data}) =>
            _newDeal({
                company_uid,
                user_fund_uid,
                data,
            }).then(() => api.dataThing.statusCheck()),
        [_newDeal],
    );

    return (
        <>
            <Page>
                <CPanel>
                    <CompanyModeToggle
                        activeMode={childProps.activeMode}
                        setMode={childProps.setMode}
                        modes={childProps.modes}
                    />
                </CPanel>
                <NewDeal {...childProps} newDeal={newDeal} />
            </Page>
        </>
    );
}

function CompanyDocumentsPage(childProps) {
    return (
        <>
            <Page>
                <CPanel>
                    <CompanyModeToggle
                        activeMode={childProps.activeMode}
                        setMode={childProps.setMode}
                        modes={childProps.modes}
                    />
                </CPanel>
                <Content>
                    <Toolbar />
                    <SupportingDocumentsList companyUid={childProps?.company?.uid} needsCompany />
                </Content>
            </Page>
        </>
    );
}

function ValuationsPage(props) {
    const {companyUid, isLoading} = props;
    const {data: derivedValuations, hasData: hasDerivedValuations} = useBackendData(
        'dataprovider/derived_valuations',
        {company_uid: companyUid},
        {initialData: []},
    );

    const {data: valuations, hasData: hasValuations} = useBackendData(
        'dataprovider/derived_valuations',
        {
            results_per_page: 'all',
            company_uid: companyUid,
        },
        {initialData: []},
    );

    const downloadValuations = useCallback(() => {
        return callActionEndpoint('useractionhandler/prepare_valuations_template', {
            entity_type: 'company',
            entity_uid: companyUid,
        }).then(key => formPost(`${config.download_file_base}${key}`));
    }, [companyUid]);

    return (
        <Valuations
            {...props}
            isLoading={isLoading || !hasDerivedValuations || !hasValuations}
            downloadValuations={downloadValuations}
            derivedValuations={derivedValuations}
            valuations={valuations}
            upload={props.showUploadWizard}
        />
    );
}

function TextValuesPage(props) {
    const {companyUid, isLoading} = props;
    const {
        data: {values: textValues},
        hasData: hasTextValues,
    } = useBackendData(
        'text_data/values',
        {
            most_recent_only: false,
            company_uid: companyUid,
        },
        {initialData: {values: []}},
    );

    const {
        data: {specs},
        hasData: hasTextSpecs,
    } = useBackendData('text_data/specs', {}, {initialData: {specs: []}});
    const [textSpecs, textGroups] = useMemo(() => {
        const textGroups = [];
        const textSpecs = {};
        for (const {uid, label, group, attribute = {}} of specs) {
            if (!textSpecs[group.uid]?.length) {
                textGroups.push({value: group.uid, label: group.label});
                textSpecs[group.uid] = [];
            }
            textSpecs[group.uid].push({value: uid, label, attributeUid: attribute.uid});
        }
        return [textSpecs, textGroups];
    }, [specs]);

    const {triggerEndpoint: _addValue} = useBackendEndpoint('text_data/create_value');
    const addValue = useCallback(
        ({specUid, value, asOfDate}) =>
            _addValue({
                company_uid: companyUid,
                spec_uid: specUid,
                value,
                as_of_date: Utils.date_to_epoch(asOfDate),
            }),
        [_addValue, companyUid],
    );

    const {triggerEndpoint: _updateValue} = useBackendEndpoint('text_data/update_value');
    const updateValue = useCallback(
        ({uid, specUid, value, asOfDate}) =>
            _updateValue({
                uid,
                spec_uid: specUid,
                value,
                as_of_date: Utils.date_to_epoch(asOfDate),
            }),
        [_updateValue],
    );

    const {triggerEndpoint: _deleteValues} = useBackendEndpoint('text_data/delete_values');
    const deleteValues = useCallback(
        ({uids}) =>
            _deleteValues({
                value_uids: uids,
            }),
        [_deleteValues],
    );

    return (
        <TextValues
            {...props}
            isLoading={isLoading || !hasTextValues || !hasTextSpecs}
            options={{...props.options, textGroups, textSpecs}}
            textValues={textValues}
            onAddValue={addValue}
            onUpdateValue={updateValue}
            onDeleteValues={deleteValues}
        />
    );
}

function NewCompanyPage({history}) {
    const {isLoading, funds, attributes, currencies} = useCompanyOptions();
    const onCancelNewCompany = () => {
        window.location.hash = '#!/company-analytics';
    };
    const onNewCompany = data =>
        callActionEndpoint('useractionhandler/new_company', data).then(uid =>
            history.push(`/company-analytics/${uid}`),
        );

    return (
        <>
            <Breadcrumbs
                path={['Investments', 'Companies', 'New Company']}
                urls={[null, '#!/company-analytics']}
                linkComponent={NonRouterLink}
            />
            <Page>
                <Content>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <NewCompany
                            options={{funds, currencies}}
                            attributes={attributes}
                            newCompany={onNewCompany}
                            cancel={onCancelNewCompany}
                            contentOnly
                        />
                    )}
                </Content>
            </Page>
        </>
    );
}

function LoadingPage(childProps) {
    return (
        <Page>
            <CPanel>
                <CompanyModeToggle
                    activeMode={childProps.activeMode}
                    setMode={childProps.setMode}
                    modes={childProps.modes}
                />
            </CPanel>
            <Content>
                <Toolbar />
                <ScrollableContent>
                    <Loader />
                </ScrollableContent>
            </Content>
        </Page>
    );
}

function CompanyAnalyticsDataFetcher({routerProps, koProps}) {
    // Pretty much all the containers in company analytics expect their props at the top level, i.e. they don't
    // fetch it from the router `match` prop, so here we lift them to regular props. Also we handle some of them.
    const {companyUid, activeMode = 'overview', subArgs: _subArgs} = routerProps?.match?.params;
    const subArgs = (_subArgs ?? '').split('/');
    const {isLoading, companyData} = useCompanyData(companyUid);

    const sharedProps = {
        companyUid,
        ...companyData,
        ...koProps,
        isLoading,
        history: routerProps.history,
        // Child components expect snake_case mode from knockout, but routes should be lisp-case, so convert
        activeMode: (activeMode ?? '').replace(/-/g, '_'),
        // They also expect to set the mode for knockout, so convert in other direction here
        setMode: mode => {
            // The metrics page is still managed by knockout, so make sure the hash listener triggers there
            if (mode === 'metrics') {
                window.location.hash = `#!/company-analytics/${companyUid}/${mode?.replace(
                    /_/g,
                    '-',
                ) ?? ''}`;
            } else {
                history.push(`/company-analytics/${companyUid}/${mode?.replace(/_/g, '-') ?? ''}`);
            }
        },
    };

    let ActiveComponent;
    switch (activeMode) {
        case '':
        case 'overview':
            ActiveComponent = CompanyOverview;
            sharedProps.activeMode = 'overview';
            break;
        case 'new-deal':
            ActiveComponent = NewDealPage;
            sharedProps.activeMode = 'overview';
            break;
        case 'valuations':
            ActiveComponent = ValuationsPage;
            break;
        case 'text-values':
            ActiveComponent = TextValuesPage;
            break;
        case 'supporting-documents':
            ActiveComponent = CompanyDocumentsPage;
            break;
        case 'data-upload':
            sharedProps.activeRequestUid = subArgs[0];
            ActiveComponent = CompanyDataUpload;
            break;
        case 'contacts':
            ActiveComponent = CompanyContacts;
            break;
        case 'reporting-components':
            ActiveComponent = CompanyReportingComponents;
            break;
        case 'metric-sets':
            if (subArgs[0]) {
                sharedProps.metricSetUid = subArgs[0];
                ActiveComponent = CompanyMetricSet;
            } else {
                ActiveComponent = CompanyMetricSets;
            }
            // Override the mode here because we're on a subpage we can't have as a sub-route
            sharedProps.activeMode = 'metrics';
            break;
        case 'calculated-metric-sets':
            sharedProps.metricUid = subArgs[0];
            sharedProps.frequency = parseInt(subArgs[1]);
            sharedProps.timeFrame = parseInt(subArgs[2]);
            sharedProps.versionUid = subArgs[3];
            ActiveComponent = CompanyCalculatedMetricSet;
            sharedProps.activeMode = 'metrics';
            break;
    }
    if (isLoading || !ActiveComponent) {
        // If loading, return a loader of course, but also return a loader if we don't have a page for the key. This
        // should only happen when activeMode is 'metrics', or if we're navigating, where we want to avoid calling more
        // expensive component mounts and cause display jitter
        ActiveComponent = LoadingPage;
    }

    return (
        <>
            <Breadcrumbs
                path={['Investments', 'Companies', companyData?.company?.name ?? '...']}
                urls={[null, '#!/company-analytics']}
                linkComponent={NonRouterLink}
            />
            <ActiveComponent {...sharedProps} />
        </>
    );
}

export default function CompanyAnalytics(koProps) {
    useEffect(() => {
        // NOTE: Workaround because we swap between two different routing libraries
        // (one for Knockout and one for React).
        history.push(window.location.hash.replace('#!', ''));
    }, []);

    return (
        <LightTheme>
            <NotificationManager>
                <Viewport>
                    <Router history={history}>
                        {/*
                            We use one handler that acts as an adapter between containers and react-router, letting us
                            have more control over how react-router props get passed to the child containers.

                            We cover any sub-arguments beneath the mode as a variadic route param, leaving
                            it up to the handlers to interpret them how they want, see the calculated-metric handler
                            for an example. You're also free to use sub-routers, see CompanyContacts for an example.
                        */}
                        <Switch>
                            <Route
                                path='/company-analytics/new-company'
                                exact
                                component={NewCompanyPage}
                            />
                            <Route
                                path='/company-analytics/:companyUid/:activeMode?/:subArgs*'
                                render={routerProps => (
                                    <CompanyAnalyticsDataFetcher
                                        routerProps={routerProps}
                                        koProps={koProps}
                                    />
                                )}
                            />
                        </Switch>
                    </Router>
                </Viewport>
            </NotificationManager>
        </LightTheme>
    );
}
