import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import FileUpload from 'components/upload/FileUpload';
import Icon from 'components/basic/Icon';

const BasicButton = styled.button`
    display: inline-block;
    margin-bottom: 0;
    font-weight: 400;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    background-image: none;
    border: 1px solid transparent;
    white-space: nowrap;
    padding: 6px 12px;
    font-size: 14px;
    line-height: 1.42857;
    border-radius: 4px;
    user-select: none;
`;

const UploadButton = styled(BasicButton)`
    background-color: #6d83a3;
    color: #ffffff;
    margin-top: 10px;
    vertical-align: middle;
`;

const StyledFileUpload = styled(FileUpload)`
    border: 2px dashed ${props => (props.dragOver ? '#555555' : '#DDDDDD')};
    margin-bottom: 25px;
    padding: 30px;
    text-align: center;
    width: 100%;
    font-weight: 400;
`;

const Label = styled.span`
    margin-left: 5px;
`;

const UploadArea = props => (
    <StyledFileUpload endpoint={props.endpoint} onSuccess={props.onSuccess} onError={props.onError}>
        <div>Drop your files here or click to choose</div>
        <UploadButton>
            <Icon name='upload' glyphicon />
            <Label>Choose file</Label>
        </UploadButton>
    </StyledFileUpload>
);
UploadArea.propTypes = {
    endpoint: PropTypes.string.isRequired,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
};

UploadArea.defaultProps = {
    onSuccess: () => {},
    onError: () => {},
};

export default UploadArea;
