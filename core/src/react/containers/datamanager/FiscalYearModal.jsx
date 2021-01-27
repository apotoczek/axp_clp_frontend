import React from 'react';
import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import {H2, H4} from 'components/basic/text';
import {LightTheme} from 'themes';
import DatePickerDropdown from 'components/basic/forms/dropdowns/DatePickerDropdown';
import Button from 'components/basic/forms/Button';
import Modal, {ModalContent, ModalHeader} from 'components/basic/Modal';
import TextInput from 'components/basic/forms/input/TextInput';
import Icon from 'components/basic/Icon';

const SaveButton = styled(Button)`
    border-radius: 0;
    padding: 4px 20px;
`;

const StyledIcon = styled(Icon)`
    color: #96a5a6;
    padding-top: 6px;
    cursor: pointer;
`;

const CancelButton = styled(Button)`
    border-radius: 0;
    padding: 4px 15px;
    margin-right: 10px;
`;

const StyledH4 = styled(H4)`
    padding-top: 40px;
    color: #000000;
`;
const StyledH2 = styled(H2)`
    color: #000000;
    padding-left: 20px;
`;

const WarningText = styled(Box)`
    color: #000000;
    background-color: rgba(224, 32, 32, 0.6);
    font-size: 11px;
    position: relative;
    top: -28px;
    padding: 10px 15px;
    width: 95%;
`;

const currentYear = () => new Date().getFullYear();

export default function FiscalYearModal({
    toggleModal,
    modalKey,
    handleQuarterSave,
    clearFiscalModal,
    formatFiscalYear,
    companyFiscalYearEnd,
    setCompanyFiscalYearEnd,
    quarterOne,
    setQuarterOne,
    quarterTwo,
    setQuarterTwo,
    quarterThree,
    setQuarterThree,
    quarterFour,
    setQuarterFour,
    errors = {},
}) {
    const alignedDates = () =>
        formatFiscalYear(companyFiscalYearEnd) === formatFiscalYear(quarterFour);

    const validateAndHandleQuarterSave = () => {
        if (alignedDates()) {
            handleQuarterSave();
        }
    };

    return (
        <LightTheme>
            <Modal isOpen={modalKey == 'fiscalYear'} openStateChanged={toggleModal}>
                <ModalContent flexDirection='column' style={{width: '550px'}}>
                    <ModalHeader>
                        <StyledH2>Set Fiscal Year End</StyledH2>
                    </ModalHeader>
                    <Box p={10}>
                        <Flex>
                            <Box px={1} width={19 / 20}>
                                <TextInput
                                    topLabel='Fiscal Year End'
                                    value={formatFiscalYear(companyFiscalYearEnd)}
                                    onValueChanged={setCompanyFiscalYearEnd}
                                />
                            </Box>
                            <Box p={1} width={1 / 20}>
                                <DatePickerDropdown
                                    value={companyFiscalYearEnd}
                                    formatter={formatFiscalYear}
                                    fromMonth={new Date(currentYear() - 1, 0)}
                                    toMonth={new Date(currentYear() + 1, 11)}
                                    onChange={setCompanyFiscalYearEnd}
                                    error={errors.fiscal_year_end}
                                >
                                    <StyledIcon name='calendar' />
                                </DatePickerDropdown>
                            </Box>
                        </Flex>
                    </Box>
                    <Box p={3}>
                        <StyledH4>Automatic Quarter Intervals</StyledH4>
                        <Flex>
                            <Box width={19 / 20} marginBottom='40px'>
                                <TextInput
                                    topLabel='Q1'
                                    value={formatFiscalYear(quarterOne)}
                                    onValueChanged={setQuarterOne}
                                />
                            </Box>
                            <Box p={1} width={1 / 20}>
                                <DatePickerDropdown
                                    value={quarterOne}
                                    formatter={formatFiscalYear}
                                    fromMonth={new Date(currentYear() - 1, 0)}
                                    toMonth={new Date(currentYear() + 1, 11)}
                                    onChange={setQuarterOne}
                                    error={errors.fiscal_year_end}
                                >
                                    <StyledIcon name='calendar' />
                                </DatePickerDropdown>
                            </Box>
                        </Flex>
                        <Flex>
                            <Box width={19 / 20} marginBottom='40px'>
                                <TextInput
                                    topLabel='Q2'
                                    value={formatFiscalYear(quarterTwo)}
                                    onValueChanged={setQuarterTwo}
                                />
                            </Box>
                            <Box p={1} width={1 / 20}>
                                <DatePickerDropdown
                                    value={quarterTwo}
                                    formatter={formatFiscalYear}
                                    fromMonth={new Date(currentYear() - 1, 0)}
                                    toMonth={new Date(currentYear() + 1, 11)}
                                    onChange={setQuarterTwo}
                                    error={errors.fiscal_year_end}
                                >
                                    <StyledIcon name='calendar' />
                                </DatePickerDropdown>
                            </Box>
                        </Flex>
                        <Flex>
                            <Box width={19 / 20} marginBottom='40px'>
                                <TextInput
                                    topLabel='Q3'
                                    value={formatFiscalYear(quarterThree)}
                                    onValueChanged={setQuarterThree}
                                />
                            </Box>
                            <Box p={1} width={1 / 20}>
                                <DatePickerDropdown
                                    value={quarterThree}
                                    formatter={formatFiscalYear}
                                    fromMonth={new Date(currentYear() - 1, 0)}
                                    toMonth={new Date(currentYear() + 1, 11)}
                                    onChange={setQuarterThree}
                                    error={errors.fiscal_year_end}
                                >
                                    <StyledIcon name='calendar' />
                                </DatePickerDropdown>
                            </Box>
                        </Flex>
                        <Flex>
                            <Box width={19 / 20} marginBottom='40px'>
                                <TextInput
                                    topLabel='Q4'
                                    value={formatFiscalYear(quarterFour)}
                                    onValueChanged={setQuarterFour}
                                    invalidValue={!alignedDates()}
                                />
                            </Box>
                            <Box p={1} width={1 / 20}>
                                <DatePickerDropdown
                                    value={quarterFour}
                                    formatter={formatFiscalYear}
                                    fromMonth={new Date(currentYear() - 1, 0)}
                                    toMonth={new Date(currentYear() + 1, 11)}
                                    onChange={setQuarterFour}
                                    error={errors.fiscal_year_end}
                                >
                                    <StyledIcon name='calendar' />
                                </DatePickerDropdown>
                            </Box>
                        </Flex>
                        {!alignedDates() && (
                            <Flex>
                                <WarningText>
                                    Your Quarter End Dates do not line up correctly with your Fiscal
                                    Year End Date!
                                </WarningText>
                            </Flex>
                        )}
                        <Flex>
                            <Box width={7 / 10} />
                            <Box width={3 / 10}>
                                <Flex>
                                    <CancelButton onClick={() => clearFiscalModal()}>
                                        Cancel
                                    </CancelButton>
                                    <SaveButton
                                        primary
                                        onClick={() => validateAndHandleQuarterSave()}
                                    >
                                        Save
                                    </SaveButton>
                                </Flex>
                            </Box>
                        </Flex>
                    </Box>
                </ModalContent>
            </Modal>
        </LightTheme>
    );
}
