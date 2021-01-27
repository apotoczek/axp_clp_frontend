import React, {useState} from 'react';

import {Flex, Box} from '@rebass/grid';
import TextInput from 'components/basic/forms/input/TextInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import {EntityMetaScope} from 'src/libs/Enums';
import MultiLevelSelector from 'src/libs/react/components/MultiLevelSelector';
import {DropdownInput} from 'components/basic/forms/dropdowns/base';
import Input from 'components/basic/forms/input/Input';

import {date_to_epoch, epoch_to_date} from 'src/libs/Utils';

import FiscalYearModal from 'src/react/containers/datamanager/FiscalYearModal';

const formatFiscalYear = value => (value ? value.format('{MM}/{date}/{year}') : 'N/A');

const CompanyForm = ({
    onValueChanged,
    onAttrChanged,
    attributes,
    options,
    values = {},
    errors = {},
}) => {
    const fiscalYearEnd = epoch_to_date(values.fiscal_data.year_end);

    const [modalKey, setModalKey] = useState(null);
    const [quarterOne, setQuarterOne] = useState(epoch_to_date(values.fiscal_data.q1));
    const [quarterTwo, setQuarterTwo] = useState(epoch_to_date(values.fiscal_data.q2));
    const [quarterThree, setQuarterThree] = useState(epoch_to_date(values.fiscal_data.q3));
    const [quarterFour, setQuarterFour] = useState(fiscalYearEnd);

    const [companyFiscalYearEnd, setCompanyFiscalYearEnd] = useState(fiscalYearEnd);
    const attributeValues = values.attributes || {};

    const defaultAttributes = Object.values(attributes).filter(
        ({uid, scope}) => uid in attributeValues || scope === EntityMetaScope.Company,
    );

    const clearFiscalModal = () => {
        setModalKey(null);
        setCompanyFiscalYearEnd(fiscalYearEnd);

        // Resetting the values
        setQuarterOne(epoch_to_date(values.fiscal_data.q1));
        setQuarterTwo(epoch_to_date(values.fiscal_data.q2));
        setQuarterThree(epoch_to_date(values.fiscal_data.q3));
        setQuarterFour(fiscalYearEnd);
    };

    return (
        <>
            <FiscalYearModal
                modalKey={modalKey}
                toggleModal={clearFiscalModal}
                formatFiscalYear={formatFiscalYear}
                setCompanyFiscalYearEnd={setCompanyFiscalYearEnd}
                companyFiscalYearEnd={companyFiscalYearEnd}
                quarterOne={quarterOne}
                setQuarterOne={setQuarterOne}
                quarterTwo={quarterTwo}
                setQuarterTwo={setQuarterTwo}
                quarterThree={quarterThree}
                setQuarterThree={setQuarterThree}
                quarterFour={quarterFour}
                setQuarterFour={setQuarterFour}
                handleQuarterSave={() => {
                    setModalKey(null);
                    onValueChanged('fiscal_data', {
                        year_end: date_to_epoch(companyFiscalYearEnd),
                        q1: date_to_epoch(quarterOne),
                        q2: date_to_epoch(quarterTwo),
                        q3: date_to_epoch(quarterThree),
                        q4: date_to_epoch(quarterFour),
                    });
                }}
                clearFiscalModal={clearFiscalModal}
            />
            <Flex flexWrap='wrap'>
                <Box width={1 / 3} p={1}>
                    <TextInput
                        leftLabel='Name'
                        value={values.name}
                        onValueChanged={value => onValueChanged('name', value)}
                        error={errors.name}
                    />
                </Box>
                <Box width={1 / 3} p={1}>
                    <FilterableDropdownList
                        label='Currency'
                        manualValue={options.currencies[values.base_currency_id]}
                        options={Object.entries(options.currencies).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        onValueChanged={value => onValueChanged('base_currency_id', value)}
                        error={errors.base_currency_id}
                    />
                </Box>
                <Box width={1 / 3} p={1}>
                    <Input
                        label='Fiscal Year End'
                        value={fiscalYearEnd.format('{MM}/{date}/{year}')}
                        rightIcon='calendar'
                        onClick={() => setModalKey('fiscalYear')}
                    />
                    {/* <DatePickerDropdown
                        label='Fiscal Year End'
                        value={values.fiscal_year_end}
                        formatter={formatFiscalYear}
                        onChange={value => onValueChanged('fiscal_year_end', value)}
                        fromMonth={new Date(currentYear(), 0)}
                        toMonth={new Date(currentYear(), 11)}
                        error={errors.fiscal_year_end}
                    /> */}
                </Box>
                {defaultAttributes.map(attribute => {
                    return (
                        <Box width={[1 / 2, null, null, null, 1 / 3]} key={attribute.uid} p={1}>
                            <MultiLevelSelector
                                members={attribute.members}
                                selectedItem={
                                    (
                                        attribute.members.find(
                                            a => a.uid == attributeValues[attribute.uid],
                                        ) || {}
                                    ).uid
                                }
                                onSelect={value => onAttrChanged(attribute.uid, value)}
                            >
                                {selectedValue => (
                                    <DropdownInput
                                        leftLabel={attribute.name}
                                        value={selectedValue}
                                    />
                                )}
                            </MultiLevelSelector>
                        </Box>
                    );
                })}
            </Flex>
        </>
    );
};

export default CompanyForm;
