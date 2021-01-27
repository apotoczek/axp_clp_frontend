import React from 'react';
import PropTypes from 'prop-types';
import styled, {css} from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import {is_set} from 'src/libs/Utils';

import Modal, {ModalContent} from 'components/basic/Modal';
import UploadArea from 'components/upload/UploadArea';
import Button from 'components/basic/forms/Button';
import {H1, H2, H3, H4, Description} from 'components/basic/text';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Loader from 'components/basic/Loader';
import DataTable from 'components/basic/DataTable';
import {gen_formatter} from 'src/libs/Formatters';

// TODO(Simon) Move this somewhere else.
export const sheetType = PropTypes.shape({
    identifier: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    nextAction: PropTypes.shape({
        type: PropTypes.string.isRequired,
        data: PropTypes.object,
    }),
});

const UploadState = {
    WAITING_FOR_FILE: 'waiting_for_file',
    SELECT_TYPE: 'select_type',
    SHEET_ERRORS: 'error',
    UPLOAD_ERROR: 'upload_error',
    VALIDATE_DEALS: 'validate_deals',
    CONFIRM_DEALS: 'confirm_deals',
    VALIDATE_AND_COMPARE_CASHFLOWS: 'validate_and_compare_cashflows',
    CONFIRM_CASHFLOW_SPREADSHEET: 'confirm_cashflow_spreadsheet',
    PARSING: 'parsing',
};

const formatActionType = nextAction => {
    switch (nextAction.type) {
        case 'select_type':
            return 'Select spreadsheet type';
        case 'restart':
            return 'Failed';
        case 'completed':
            return 'Completed';
        case 'confirm_deals':
        case 'confirm_cashflow_spreadsheet':
            return 'Confirm data';
        default:
            return 'N/A';
    }
};

const SheetRowContainer = styled(Flex)`
    padding: 16px;
    background: ${({theme}) => theme.uploadModal.sheetRow.bg};
    border: 1px solid ${({theme}) => theme.uploadModal.sheetRow.border};
    margin-bottom: 8px;
    color: ${({theme}) => theme.uploadModal.sheetRow.fg};
    opacity: ${({disabled}) => (disabled ? 0.5 : null)};
    cursor: ${({disabled}) => (disabled ? null : 'pointer')};

    ${({disabled}) =>
        !disabled &&
        css`
            &:hover {
                border: 1px solid ${({theme}) => theme.uploadModal.sheetRow.hoverBorder};
                box-shadow: 2px 2px 3px ${({theme}) => theme.uploadModal.sheetRow.hoverBoxShadow};
            }
        `}
`;

const ModalHeader = styled(Flex)`
    border-bottom: 1px solid ${({theme}) => theme.modal.header.bottomBorder};
`;

const Title = styled.div`
    font-weight: 700;
    text-transform: uppercase;
    margin-right: 4px;
`;

const Value = styled.div`
    margin-right: 32px;
    color: ${({failed, success, theme}) => {
        if (failed) {
            return theme.text.error;
        }

        if (success) {
            return theme.text.success;
        }

        return null;
    }};
`;

const UploadSheetRowActions = styled(Box)`
    color: ${({theme}) => theme.text.error};
`;

const RemoveSheetButton = styled.button`
    color: ${({theme}) => theme.textButton.fg};
    cursor: pointer;
    border: none;
    background: transparent;
    padding: 0;

    &:hover {
        border-bottom: 1px dotted ${({theme}) => theme.textButton.dottedUnderline};
    }
`;

const UploadedSheetRow = ({
    filename,
    nextAction,
    onClick,
    onRemoveSheet,
    sheetName,
    failed,
    success,
}) => {
    return (
        <SheetRowContainer onClick={onClick} disabled={failed || success}>
            <Flex flex='1'>
                <Flex flex='1'>
                    <Title>Filename</Title>
                    <Value>{filename}</Value>
                </Flex>
                <Flex flex='1'>
                    <Title>Sheet</Title>
                    <Value>{sheetName}</Value>
                </Flex>
                <Flex flex='1'>
                    <Title>Status</Title>
                    <Value failed={failed} success={success}>
                        {nextAction}
                    </Value>
                </Flex>
            </Flex>
            <UploadSheetRowActions alignSelf='center'>
                <RemoveSheetButton onClick={onRemoveSheet}>Remove</RemoveSheetButton>
            </UploadSheetRowActions>
        </SheetRowContainer>
    );
};

UploadedSheetRow.propTypes = {
    filename: PropTypes.string.isRequired,
    nextAction: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onRemoveSheet: PropTypes.func.isRequired,
    sheetName: PropTypes.string.isRequired,
};

const UploadFileState = ({
    sheets,
    toggleModal,
    onUploadSuccess,
    onUploadError,
    onSelectSheet,
    onRemoveSheet,
    onRemoveAllSheets,
}) => {
    return (
        <>
            <ModalHeader pb={2} mb={3}>
                <H1>Upload Sheets</H1>
            </ModalHeader>
            <UploadArea
                endpoint='commander/upload_market_data'
                onSuccess={onUploadSuccess}
                onError={onUploadError}
            />
            <Flex flexDirection='column' mt={2} mb={4}>
                <Flex justifyContent='space-between' mb={2}>
                    <H2>Sheets</H2>
                    <RemoveSheetButton onClick={onRemoveAllSheets}>Clear all</RemoveSheetButton>
                </Flex>
                {is_set(sheets, true) ? (
                    Object.values(sheets).map(sheet => (
                        <UploadedSheetRow
                            filename={sheet.filename}
                            key={sheet.identifier}
                            nextAction={formatActionType(sheet.next_action)}
                            onClick={() => onSelectSheet(sheet.identifier)}
                            onRemoveSheet={onRemoveSheet(sheet.identifier)}
                            sheetName={sheet.sheetname}
                            failed={sheet.next_action.type === 'restart'}
                            success={sheet.next_action.type === 'completed'}
                        />
                    ))
                ) : (
                    <Flex alignSelf='center' alignItems='center' flexDirection='column'>
                        <H3>No sheets have been uploaded.</H3>
                        <H4>You can upload sheets by selecting a file above</H4>
                    </Flex>
                )}
            </Flex>
            <Flex alignSelf='flex-end'>
                <Button onClick={() => toggleModal(false)} primary>
                    OK
                </Button>
            </Flex>
        </>
    );
};

UploadFileState.propTypes = {
    sheets: PropTypes.objectOf(sheetType),
    toggleModal: PropTypes.func.isRequired,
    onUploadSuccess: PropTypes.func.isRequired,
    onUploadError: PropTypes.func.isRequired,
    onSelectSheet: PropTypes.func.isRequired,
    onRemoveSheet: PropTypes.func.isRequired,
    onRemoveAllSheets: PropTypes.func.isRequired,
};

class SelectTypeState extends React.PureComponent {
    static propTypes = {
        availableTypes: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                description: PropTypes.string.isRequired,
            }),
        ),
        onSelectSheetType: PropTypes.func.isRequired,
        toggleModal: PropTypes.func.isRequired,
    };

    state = {
        selectedType: undefined,
        selectedName: undefined,
    };

    handleSelectType = type =>
        this.setState({
            selectedType: type.name,
            selectedName: type.description,
        });

    render() {
        const {availableTypes, onSelectSheetType, toggleModal} = this.props;
        const {selectedName, selectedType} = this.state;

        return (
            <>
                <ModalHeader pb={2} mb={3}>
                    <H1>Select Sheet Type</H1>
                </ModalHeader>
                <Flex flexDirection='column' mt={2} mb={4}>
                    <Description>
                        We could not determine the type of the spreadsheet. Please help us out and
                        select the type of data you are trying to upload.
                    </Description>
                    <DropdownList
                        label='Spreadsheet Type'
                        options={availableTypes}
                        keyKey='name'
                        valueKey='name'
                        labelKey='description'
                        manualValue={selectedName}
                        placeholder='Select the spreadsheet type'
                        broadcastFullOption
                        onValueChanged={this.handleSelectType}
                    />
                </Flex>
                <Flex alignSelf='flex-end'>
                    <Button onClick={() => toggleModal(false)} small mr={2}>
                        Close
                    </Button>
                    <Button
                        onClick={() => onSelectSheetType(selectedType)}
                        primary
                        small
                        disabled={!selectedType}
                    >
                        Next
                    </Button>
                </Flex>
            </>
        );
    }
}

const GreenText = styled.span`
    color: ${({theme}) => theme.text.success};
`;

const MutedText = styled.span`
    opacity: 0.5;
`;

const confirmCellRenderer = ({cellData, columnData, rowData}) => {
    if (!is_set(cellData)) {
        return <MutedText>N/A</MutedText>;
    }

    let formatted;
    const format = {
        date: 'backend_date',
        amount: 'money',
        'Investment Amount': 'money',
    }[columnData.key];
    if (format) {
        const formatter = gen_formatter(format);
        formatted = formatter(cellData);
    } else {
        formatted = String(cellData);
    }

    if (rowData.update_keys && rowData.update_keys.includes(columnData.key)) {
        return <GreenText>{formatted}</GreenText>;
    }

    return formatted;
};

class ConfirmState extends React.PureComponent {
    static propTypes = {
        toggleModal: PropTypes.func.isRequired,
        onConfirmData: PropTypes.func.isRequired,
        uploadedRows: PropTypes.arrayOf(
            PropTypes.shape({
                // NOTE: You can also send in any extra data for each row here. Such as
                // attributes. The component will read them and display them as columns in
                // the table.
                fund_name: PropTypes.string.isRequired,
                company_name: PropTypes.string,
            }),
        ).isRequired,
    };

    getColumnsFromRows = rows => {
        const uniqueColumns = new Set();
        for (const row of rows) {
            const rowColumns = Object.keys(row);
            for (const column of rowColumns) {
                uniqueColumns.add(column);
            }
        }

        const columnBlacklist = ['update_keys'];
        const columns = Array.from(uniqueColumns)
            .filter(column => !columnBlacklist.includes(column))
            .sort((left, right) => {
                if (left === 'company_name' || left === 'fund_name') {
                    return -1;
                }

                if (right === 'company_name' || right === 'fund_name') {
                    return 1;
                }

                return 0;
            });

        return columns.map(column => ({
            label: column.titleize(),
            key: column,
            cellRenderer: confirmCellRenderer,
        }));
    };

    render() {
        const {toggleModal, onConfirmData, uploadedRows} = this.props;

        return (
            <>
                <ModalHeader pb={2} mb={3}>
                    <H1>Confirm Upload</H1>
                </ModalHeader>
                <DataTable
                    columns={this.getColumnsFromRows(uploadedRows)}
                    enablePagination
                    label='Uploads'
                    pushHeight
                    resultsPerPage={30}
                    rows={uploadedRows}
                />
                <Flex alignSelf='flex-end'>
                    <Button onClick={() => toggleModal(false)} small mr={2}>
                        Close
                    </Button>
                    <Button onClick={onConfirmData} primary small>
                        Confirm
                    </Button>
                </Flex>
            </>
        );
    }
}

const ErrorCell = styled.span`
    color: ${({theme}) => theme.text.error};
`;

class SheetErrorsState extends React.PureComponent {
    static propTypes = {
        toggleModal: PropTypes.func.isRequired,
        onRetrySheet: PropTypes.func.isRequired,
        errors: PropTypes.arrayOf(
            PropTypes.shape({
                sheet: PropTypes.string.isRequired,
                index: PropTypes.number.isRequired,
                errors: PropTypes.arrayOf(PropTypes.string),
            }),
        ).isRequired,
    };

    render() {
        const {toggleModal, onRetrySheet, errors} = this.props;
        const columns = [
            {label: 'Sheet', key: 'sheet'},
            {label: 'Row', key: 'index'},
            {
                label: 'Errors',
                key: 'errors',
                cellRenderer: ({cellData}) => <ErrorCell>{cellData.join(', ')}</ErrorCell>,
            },
        ];

        return (
            <>
                <ModalHeader pb={2} mb={3}>
                    <H1>Spreadsheet Errors</H1>
                </ModalHeader>
                <DataTable
                    columns={columns}
                    enablePagination
                    label='Uploads'
                    pushHeight
                    resultsPerPage={30}
                    rows={errors}
                />
                <Flex alignSelf='flex-end'>
                    <Button onClick={() => toggleModal(false)} small mr={2}>
                        Close
                    </Button>
                    <Button onClick={onRetrySheet} danger small>
                        Retry
                    </Button>
                </Flex>
            </>
        );
    }
}

class UploadErrorState extends React.PureComponent {
    handleClose = () => {
        this.props.onReset();
        this.props.toggleModal(false);
    };

    render() {
        const {message, description, onReset} = this.props;

        return (
            <>
                <ModalHeader pb={2} mb={3}>
                    <H1>Upload Error</H1>
                </ModalHeader>
                <Flex alignSelf='center' alignItems='center' flexDirection='column'>
                    <H3>{message}</H3>
                    <H4>{description}</H4>
                </Flex>
                <Flex alignSelf='flex-end'>
                    <Button onClick={this.handleClose} small mr={2}>
                        Close
                    </Button>
                    <Button onClick={onReset} primary small>
                        Retry
                    </Button>
                </Flex>
            </>
        );
    }
}

export default class DealUploadModal extends React.PureComponent {
    static propTypes = {
        toggleModal: PropTypes.func.isRequired,
        sheets: PropTypes.objectOf(sheetType),
        uploadError: PropTypes.shape({
            message: PropTypes.string,
            description: PropTypes.string,
        }),
        onResetUploadError: PropTypes.func.isRequired,
        onUploadSheet: PropTypes.func.isRequired,
        onUploadStep: PropTypes.func.isRequired,
        onRemoveSheet: PropTypes.func.isRequired,
        onRemoveAllSheets: PropTypes.func.isRequired,
        isOpen: PropTypes.bool.isRequired,
        isUploading: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        sheets: {},
    };

    state = {
        uploadStateBySheetId: {},
        activeSheetId: null,
    };

    componentDidUpdate(_prevProps, _prevState) {
        const uploadState = this.getUploadState();

        if (uploadState === UploadState.VALIDATE_AND_COMPARE_CASHFLOWS) {
            this.props.onUploadStep(this.state.activeSheetId);
        }

        if (uploadState === UploadState.VALIDATE_DEALS) {
            this.props.onUploadStep(this.state.activeSheetId);
        }
    }

    resetModal = () => this.setState({activeSheetId: null});

    handleSelectSheet = sheetId => {
        const nextActionType = this.props.sheets[sheetId].next_action.type;
        if (nextActionType === 'restart' || nextActionType === 'completed') {
            return;
        }

        this.setState({activeSheetId: sheetId});
    };

    getUploadState = () => {
        if (this.props.isUploading) {
            return UploadState.PARSING;
        }

        if (this.props.uploadError) {
            return UploadState.UPLOAD_ERROR;
        }

        if (!this.state.activeSheetId) {
            return UploadState.WAITING_FOR_FILE;
        }

        const activeSheet = this.props.sheets[this.state.activeSheetId];
        const activeSheetHasErrors = is_set(activeSheet.data.errors, true);
        if (activeSheetHasErrors) {
            return UploadState.SHEET_ERRORS;
        }

        const nextActionType = activeSheet && activeSheet.next_action.type;
        return nextActionType;
    };

    handleRetrySheet = () => {
        this.setState({activeSheetId: null});
    };

    handleRemoveSheet = sheetId => event => {
        event.stopPropagation();
        const nextActionType = this.props.sheets[sheetId].next_action.type;
        if (nextActionType === 'restart') {
            return;
        }

        this.props.onRemoveSheet(sheetId);
    };

    handleConfirmData = () => {
        this.props.onUploadStep(this.state.activeSheetId);
        this.setState({activeSheetId: null});
    };

    render() {
        const {
            toggleModal,
            sheets,
            onUploadSheet,
            isOpen,
            onSelectSheetType,
            onRemoveAllSheets,
            uploadError,
            onResetUploadError,
        } = this.props;
        const activeSheet = sheets[this.state.activeSheetId];
        const uploadState = this.getUploadState();

        let modalContent;
        if (uploadState === UploadState.WAITING_FOR_FILE) {
            modalContent = (
                <UploadFileState
                    onSelectSheet={this.handleSelectSheet}
                    onUploadSuccess={onUploadSheet(true)}
                    onUploadError={onUploadSheet(false)}
                    onRemoveSheet={this.handleRemoveSheet}
                    onRemoveAllSheets={onRemoveAllSheets}
                    sheets={sheets}
                    toggleModal={toggleModal}
                />
            );
        } else if (uploadState === UploadState.SELECT_TYPE) {
            modalContent = (
                <SelectTypeState
                    availableTypes={activeSheet.next_action.data.types}
                    onSelectSheetType={onSelectSheetType(activeSheet.identifier)}
                    toggleModal={toggleModal}
                />
            );
        } else if (
            uploadState === UploadState.CONFIRM_DEALS ||
            uploadState === UploadState.CONFIRM_CASHFLOW_SPREADSHEET
        ) {
            modalContent = (
                <ConfirmState
                    onConfirmData={this.handleConfirmData}
                    toggleModal={toggleModal}
                    uploadedRows={activeSheet.data.uploads || []}
                />
            );
        } else if (uploadState === UploadState.SHEET_ERRORS) {
            modalContent = (
                <SheetErrorsState
                    errors={activeSheet.data.errors}
                    onRetrySheet={this.handleRetrySheet}
                    toggleModal={toggleModal}
                />
            );
        } else if (uploadState === UploadState.UPLOAD_ERROR) {
            modalContent = (
                <UploadErrorState
                    message={uploadError.message}
                    description={uploadError.description}
                    onReset={onResetUploadError}
                    toggleModal={toggleModal}
                />
            );
        } else {
            modalContent = (
                <Flex alignSelf='center' alignItems='center' flexDirection='column'>
                    <Loader />
                    <H3>Parsing your data.</H3>
                    <H4>Please hold on as we are interpreting the data you uploaded.</H4>
                </Flex>
            );
        }

        return (
            <Modal
                isOpen={isOpen}
                onExitAnimationComplete={this.resetModal}
                openStateChanged={toggleModal}
            >
                <ModalContent flexDirection='column'>{modalContent}</ModalContent>
            </Modal>
        );
    }
}
