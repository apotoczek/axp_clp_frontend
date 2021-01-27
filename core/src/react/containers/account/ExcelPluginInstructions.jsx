import React from 'react';
import {Flex, Box} from '@rebass/grid';
import styled from 'styled-components';

import config from 'config';

import {formPost} from 'api';
import {PluginType} from 'src/libs/Enums';

import AppOneTimePasswords from './AppOneTimePasswords';

import {H1, H3, Description, Bold, Italic} from 'components/basic/text';
import InfoBox from 'components/InfoBox';
import Icon from 'components/basic/Icon';

const DownloadBoxWrapper = styled(Flex)`
    background: #fcfcfd;
    border: 1px solid #bfc2d6;
    max-width: 140px;
    min-width: 140px;
    height: 140px;
    margin: 6px 0;
    border-radius: 3px;

    cursor: pointer;

    &:hover {
        background: #f0f1fa;
    }

    color: #222222;
`;

const DownloadText = styled(Flex)`
    text-align: center;
`;

function DownloadBox({onClick}) {
    return (
        <DownloadBoxWrapper onClick={onClick} flexDirection='column'>
            <Flex justifyContent='center' alignItems='center' flex={1}>
                <Icon name='download' size={32} />
            </Flex>
            <DownloadText justifyContent='center' pb={2}>
                Download Excel Plugin
            </DownloadText>
        </DownloadBoxWrapper>
    );
}

const Separator = styled(Box)`
    border-bottom: 1px solid #bfc2d6;
    margin: 8px 0;
`;

export default class ExcelPluginInstructions extends React.Component {
    render() {
        return (
            <>
                <Box>
                    <Flex p={4}>
                        <Flex flex={2} flexDirection='column'>
                            <H1>Excel Plugin</H1>
                            <Description>
                                This is the Cobalt Excel Plugin area. Here you can download the
                                Excel plugin, as well as find information about how the plugin
                                works.
                            </Description>
                            <Separator />
                            <Flex flex={1}>
                                <DownloadBox
                                    onClick={() => formPost(`${config.download_base}excel-plugin`)}
                                >
                                    Download Excel Plugin
                                </DownloadBox>
                            </Flex>
                        </Flex>
                        <Flex flex={2}>
                            <InfoBox>
                                <H3>Installation instructions: </H3>
                                <Description>
                                    <Bold>Before you start:</Bold> Make sure you know if you are
                                    running 32-bit Excel or 64-bit Excel. You can find this
                                    information in the
                                    <Bold> About</Bold> section of Excel. In Office-365, this is
                                    under
                                    <Italic> File -&gt; Account -&gt; About Excel.</Italic>
                                    <br />
                                    <br />
                                    Once you know which version of Excel you are running, extract
                                    the zip file you downloaded from this page by right clicking on
                                    it and selecting
                                    <Bold> Extract All</Bold>. Extract the file into a folder that
                                    you have write access to. Keep in mind not to choose a network
                                    shared folder, as this could cause issues later. We suggest the
                                    folder: <br />
                                    <Italic> C:\Program Files\Cobalt Excel Add In\</Italic>
                                    <br />
                                    <br />
                                    Once the extraction is complete, feel free to remove the
                                    downloaded
                                    <Italic> .zip</Italic> file.
                                    <br />
                                    <br />
                                    Open Excel and perform the following steps:
                                    <ol>
                                        <li>
                                            Click <Bold>File</Bold> in the upper left corner
                                        </li>
                                        <li>
                                            Click <Bold>Options</Bold> in the lower left corner
                                        </li>
                                        <li>
                                            Select <Bold>Add-ins</Bold> in the left column
                                        </li>
                                        <li>
                                            At the bottom, select <Bold>Manage: Excel Add Ins</Bold>{' '}
                                            and hit
                                            <Bold> Go</Bold>
                                        </li>
                                        <li>
                                            Click <Bold>Browse</Bold> and browse to the folder you
                                            extracted the plugin into earlier
                                        </li>
                                        <li>
                                            If you are running 64-bit Excel, select the
                                            <Italic> .xll</Italic> file that ends in 64. If you are
                                            running 32-bit Excel, select the other{' '}
                                            <Italic>.xll</Italic> file.
                                            <Italic>
                                                The .xll file is the one that has an Excel icon
                                            </Italic>
                                        </li>
                                        <li>
                                            Make sure the &quot;CobaltExcelAddIn Add-In&quot; option
                                            is selected in the list
                                        </li>
                                        <li>
                                            Click <Bold>OK</Bold>
                                        </li>
                                    </ol>
                                    Having issues with installation? Please contact support at{' '}
                                    {config.support_email}
                                </Description>
                            </InfoBox>
                        </Flex>
                    </Flex>
                </Box>
                <AppOneTimePasswords pluginType={PluginType.Excel} />
            </>
        );
    }
}
