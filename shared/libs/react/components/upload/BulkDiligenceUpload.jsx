import {Table, TableHead, TableBody, Row, Cell} from 'components/basic/table';
import Icon from 'components/basic/Icon';
import {processSpreadsheet} from 'api';

import styled from 'styled-components';
import {Box, Flex} from '@rebass/grid';
import React from 'react';
import TextInput from 'components/basic/forms/input/TextInput';
import Button from 'components/basic/forms/Button';
import FileUpload from 'components/upload/FileUpload';

const ChoiceButton = styled(Button)`
    margin-top: 20px;
    display: inline-block;
    padding: 13px 18px;
    font-size: 14px;
`;

const ChoiceUploadButton = styled(ChoiceButton)`
    display: flex;
`;

const ImportButton = styled(Button)`
    text-align: center;
`;

const ImportButtonHidden = styled(ImportButton)`
    display: none;
`;

const StyledRow = styled(Row)`
    border: 1px solid #ccd1df;
`;

const HeaderRow = styled(StyledRow)`
    background-color: #d9ddec;
`;

const LargeIcon = styled(Icon)`
    margin: 0 auto;
    font-size: 5em;
    text-align: center;
    display: block;
`;

export default class BulkDiligenceUpload extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    sheet_types = [
        'net cash flows',
        'gross cash flows',
        'metrics',
        'deal attributes',
        'fund attributes',
    ];

    state = {
        isUploadState: true,
        isCompletedState: false,
        stagerows: [],
        diligenceContext: null,
        projectName: '',
        isUploadButtonDisabled: true,
        isSecondStage: false,
    };

    onUploadSuccess = res => {
        let sheets = res.sheets;
        // let errors = res.errors;
        let stagerows = [];
        for (let i = 0; i < sheets.length; i++) {
            let rowdata = sheets[i];
            rowdata.sheet_type_label = this.sheet_types[rowdata.sheet_type - 1];
            rowdata.isDisabled = false;
            rowdata.displayText = 'Import';
            if (rowdata.sheet_type > 2) {
                rowdata.stageNumber = 2;
            } else {
                rowdata.stageNumber = 1;
            }
            stagerows.push(rowdata);
        }
        this.setState({
            isUploadState: false,
            stagerows: stagerows,
        });
    };

    onUploadError = e => {
        console.log('onUploadError', e);
    };

    downloadWorkbook = () => {
        window.open(require('src/data/cobalt_bulk_import_template.xlsx'));
    };

    projectNameChange = value => {
        let projectName = value;
        this.setState({
            projectName: projectName,
            isUploadButtonDisabled: projectName.length == 0,
        });
    };

    renderRow = (item, rowNum) => {
        if (item.stageNumber == rowNum) {
            return (
                <StyledRow key={item.uid}>
                    <Cell>{item.sheet_name}</Cell>
                    <Cell>{item.sheet_type_label}</Cell>
                    <Cell>
                        <ImportButton
                            data-key={item.uid}
                            onClick={async event => {
                                await this.importSheet(event, item);
                            }}
                            disabled={item.isDisabled}
                        >
                            {item.displayText}
                        </ImportButton>
                        <ImportButtonHidden disabled>Imported</ImportButtonHidden>
                    </Cell>
                </StyledRow>
            );
        }
    };

    async importSheet(event, item) {
        const updateState = shouldDisable =>
            this.setState({
                stagerows: this.state.stagerows.map(stateItem => {
                    if (stateItem.uid == item.uid) {
                        return item;
                    }
                    if (stateItem.stageNumber == 1) {
                        stateItem.isDisabled =
                            stateItem.displayText != 'Import' ? true : shouldDisable;
                    }
                    return stateItem;
                }),
            });

        item.displayText = 'Importing...';
        item.isDisabled = true;
        updateState(true);

        processSpreadsheet({
            sheet_uid: item.uid,
            context: this.state.diligenceContext,
            projectName: this.state.projectName,
        })
            .then(data => {
                this.setState({diligenceContext: data.context});
                // switch from Importing to the disabled "Imported" button
                item.displayText = 'Imported';
                updateState(false);
            })
            .catch(() => {
                item.displayText = 'Import Error';
                updateState(false);
            });
    }

    renderCompletedUpload = () => {
        return (
            <div>
                <Flex flexDirection='column' p={3}>
                    <Flex alignSelf='center'>
                        <Box flex={1}>
                            <LargeIcon mx={2} glyphicon name='ok' success />
                            <h1>You&apos;re all done!</h1>
                            <h3>You can close the modal</h3>
                        </Box>
                    </Flex>
                    <Flex alignSelf='flex-end' mb={3}>
                        <ChoiceButton success onClick={this.props.close}>
                            Close
                        </ChoiceButton>
                    </Flex>
                </Flex>
            </div>
        );
    };

    renderUploadState = () => {
        return (
            <div>
                <div>
                    <p>
                        The bulk import tool will allow you to upload any combination of the
                        following:
                    </p>
                    <ul>
                        <li>Gross Cash Flows</li>
                        <li>Net Cash Flows</li>
                        <li>Deal Attributes</li>
                        <li>Deal Metrics</li>
                        <li>Fund Attributes</li>
                    </ul>
                </div>
                <hr></hr>
                <div>
                    <div>
                        <TextInput
                            leftGlyphicon
                            autoFocus
                            flex='1 1 auto'
                            leftIcon='edit'
                            topLabel='Please enter a project name'
                            type='text'
                            onValueChanged={this.projectNameChange}
                        ></TextInput>
                    </div>
                    <Flex flexDirection='row'>
                        <Flex flex='1'>
                            <ChoiceButton onClick={this.downloadWorkbook} primary>
                                Download Single Upload Workbook
                            </ChoiceButton>
                        </Flex>
                        <Flex flex='1'>
                            {this.state.isUploadButtonDisabled && (
                                <ChoiceButton success disabled>
                                    Upload Single Upload Workbook
                                </ChoiceButton>
                            )}
                            {!this.state.isUploadButtonDisabled && (
                                <FileUpload
                                    loader={
                                        <ChoiceUploadButton disabled>
                                            Uploading Workbook ...
                                            <Icon
                                                mx={2}
                                                glyphicon
                                                name='cog'
                                                className='animate-spin'
                                            />
                                        </ChoiceUploadButton>
                                    }
                                    disabled={this.state.isUploadButtonDisabled}
                                    endpoint='/upload/multi-spreadsheet'
                                    onSuccess={this.onUploadSuccess}
                                    onError={this.onUploadError}
                                >
                                    <ChoiceUploadButton success>
                                        Upload Single Upload Workbook
                                    </ChoiceUploadButton>
                                </FileUpload>
                            )}
                            <br></br>
                        </Flex>
                    </Flex>
                </div>
            </div>
        );
    };

    renderImportCashflows = () => {
        return (
            <div>
                <div>
                    <h3>Stage 1</h3>
                    <p>Import net and gross fund cashflows first.</p>
                    <Table>
                        <TableHead>
                            <HeaderRow>
                                <Cell>SHEET NAME</Cell>
                                <Cell>SHEET TYPE</Cell>
                                <Cell></Cell>
                            </HeaderRow>
                        </TableHead>
                        <TableBody>
                            {this.state.stagerows
                                .map(item => this.renderRow(item, 1))
                                .filter(Boolean)}
                        </TableBody>
                    </Table>
                </div>
                <Flex alignSelf='flex-end' mb={3}>
                    <ChoiceButton
                        success
                        onClick={() => {
                            this.setState({
                                isSecondStage: true,
                            });
                        }}
                    >
                        Next
                    </ChoiceButton>
                </Flex>
            </div>
        );
    };

    renderImportAttributes = () => {
        return (
            <div>
                <div>
                    <h3>Stage 2</h3>
                    <p>Attach attributes and metrics to deals and funds.</p>
                    <Table>
                        <TableHead>
                            <HeaderRow>
                                <Cell>SHEET NAME</Cell>
                                <Cell>SHEET TYPE</Cell>
                                <Cell></Cell>
                            </HeaderRow>
                        </TableHead>
                        <TableBody>
                            {this.state.stagerows
                                .map(item => this.renderRow(item, 2))
                                .filter(Boolean)}
                        </TableBody>
                    </Table>
                </div>
                <Flex alignSelf='flex-end' mb={3}>
                    <ChoiceButton
                        success
                        onClick={() => {
                            this.setState({
                                isCompletedState: true,
                            });
                        }}
                    >
                        Finish
                    </ChoiceButton>
                </Flex>
            </div>
        );
    };

    renderImportState = () => {
        if (!this.state.isSecondStage) {
            return this.renderImportCashflows();
        }
        return this.renderImportAttributes();
    };

    render() {
        if (!this.state.isCompletedState) {
            if (this.state.isUploadState) {
                return this.renderUploadState();
            }
            return this.renderImportState();
        }
        return this.renderCompletedUpload();
    }
}
