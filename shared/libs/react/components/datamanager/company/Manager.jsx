import React from 'react';

import Breadcrumbs, {NonRouterLink} from 'components/Breadcrumbs';
import {Viewport} from 'components/layout';

import Loader from 'components/basic/Loader';

import Overview from 'components/datamanager/company/Overview';
import CompanyMetricSets from 'containers/analytics/CompanyMetricSets';
import TextValues from 'components/datamanager/company/TextValues';
import Valuations from 'components/datamanager/company/Valuations';
import NewDeal from 'components/datamanager/company/NewDeal';
import NewCompany from 'components/datamanager/company/NewCompany';

class Manager extends React.Component {
    static defaultProps = {
        activeMode: 'overview',
    };

    renderMode = () => {
        const {
            company,
            attributes,
            activeMode,
            setMode,
            modes,
            isLoading,
            onUpdateCharacteristics,
            onDownloadValuations,
            onAddValue,
            onUpdateValue,
            onDeleteValues,
            onNewDeal,
            onUpload,
            deals,
            textValues,
            valuations,
            derivedValuations,
            fiscalQuarters,
            options,
        } = this.props;

        const sharedProps = {
            company,
            setMode,
            activeMode,
            isLoading,
            options,
            upload: onUpload,
            modes,
        };

        switch (activeMode) {
            case 'overview':
                return (
                    <Overview
                        {...sharedProps}
                        attributes={attributes}
                        updateCharacteristics={onUpdateCharacteristics}
                        deals={deals}
                        fiscalQuarters={fiscalQuarters}
                    />
                );
            case 'metrics':
                return (
                    <CompanyMetricSets
                        {...sharedProps}
                        showUploadWizard={onUpload}
                        linkTarget='data-manager'
                    />
                );
            case 'valuations':
                return (
                    <Valuations
                        {...sharedProps}
                        valuations={valuations}
                        derivedValuations={derivedValuations}
                        downloadValuations={onDownloadValuations}
                    />
                );
            case 'text-values':
                return (
                    <TextValues
                        {...sharedProps}
                        attributes={attributes}
                        textValues={textValues}
                        onAddValue={onAddValue}
                        onUpdateValue={onUpdateValue}
                        onDeleteValues={onDeleteValues}
                    />
                );
            case 'new-deal':
                return <NewDeal {...sharedProps} newDeal={onNewDeal} attributes={attributes} />;
        }
    };

    render = () => {
        const {
            company,
            isLoading,
            createNew,
            onNewCompany,
            onCancelNewCompany,
            attributes,
            options,
        } = this.props;

        if (isLoading) {
            return <Loader />;
        }

        if (createNew) {
            return (
                <NewCompany
                    options={options}
                    attributes={attributes}
                    newCompany={onNewCompany}
                    cancel={onCancelNewCompany}
                />
            );
        }

        if (!company) {
            return <Loader />;
        }

        return (
            <Viewport>
                <Breadcrumbs
                    path={['Data Manager', 'Companies', company.name]}
                    urls={['#!/data-manager', '#!/data-manager/companies']}
                    linkComponent={NonRouterLink}
                />
                {this.renderMode()}
            </Viewport>
        );
    };
}

export default Manager;
