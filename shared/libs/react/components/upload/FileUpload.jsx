import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import axios from 'axios';

import config from 'config';

import Loader from 'components/basic/Loader';

const HiddenInput = styled.input`
    display: none !important;
`;

export default class FileUpload extends React.Component {
    static propTypes = {
        endpoint: PropTypes.string.isRequired,
        onSuccess: PropTypes.func,
        onError: PropTypes.func,
        formData: PropTypes.object,
        loader: PropTypes.element,
    };

    static defaultProps = {
        onSuccess: () => {},
        onError: () => {},
        formData: {},
    };

    state = {
        dragOver: false,
    };

    constructor(props) {
        super(props);

        this.dragCounter = 0;
        this.fileInput = React.createRef();

        this.axios = axios.create({
            baseURL: config.api_base_url,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
            xsrfCookieName: config.csrf.cookie_name,
            xsrfHeaderName: config.csrf.header_name,
        });
    }

    handleDragEnter = _event => {
        this.dragCounter++;

        const {dragOver} = this.state;
        if (dragOver) {
            return;
        }
        this.setState({dragOver: true});
    };

    handleDragOver = event => {
        event.stopPropagation();
        event.preventDefault();

        const {dragOver} = this.state;
        if (dragOver) {
            return;
        }

        this.setState({dragOver: true});
    };

    handleDragLeave = event => {
        event.stopPropagation();
        event.preventDefault();

        this.dragCounter--;

        const {dragOver} = this.state;
        if (!dragOver || this.dragCounter != 0) {
            return;
        }

        this.setState({dragOver: false});
    };

    handleDrop = event => {
        event.stopPropagation();
        event.preventDefault();

        const files = event.dataTransfer.files;

        if (files && files.length) {
            this.handleFiles(files);
        }

        this.dragCounter = 0;
        this.setState({dragOver: false});
    };

    handleInputChange = () => {
        this.handleFiles(this.fileInput.current.files);
    };

    handleFiles = files => {
        const {endpoint, onSuccess, onError, formData} = this.props;

        for (const file of files) {
            const data = new FormData();

            for (const [key, value] of Object.entries(formData)) {
                data.append(key, value);
            }

            data.append('file', file);

            const config = {
                onUploadProgress: () => {
                    this.setState({isUploading: true});
                },
            };

            this.axios
                .post(endpoint, data, config)
                .then(response => {
                    this.setState({isUploading: false}, () => {
                        onSuccess(response.data.body);
                        this.clearFiles();
                    });
                })
                .catch(response => {
                    this.setState({isUploading: false}, () => onError(response));
                    this.clearFiles();
                });
        }
    };

    handleClick = () => {
        this.fileInput.current.click();
    };

    clearFiles = () => {
        this.fileInput.current.value = null;
    };

    render() {
        const {isUploading} = this.state;
        const {
            children,
            onSuccess: _onSuccess,
            onError: _onError,
            formData: _formData,
            loader: _loader,
            ...rest
        } = this.props;

        const loader = _loader ?? <Loader />;

        return (
            <div
                onClick={this.handleClick}
                onDrop={this.handleDrop}
                onDragOver={this.handleDragOver}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                {...rest}
            >
                {isUploading ? loader : children}
                <HiddenInput
                    type='file'
                    multiple
                    ref={this.fileInput}
                    onChange={this.handleInputChange}
                />
            </div>
        );
    }
}
