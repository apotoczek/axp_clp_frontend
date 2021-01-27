import React from 'react';
import PropTypes from 'prop-types';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import BaseSpecHandler from 'component-spec-handlers/base-spec-handler';

import styled from 'styled-components';

import BaseIcon from 'components/basic/Icon';

import {VerticalAlign} from 'components/layout';

const Container = styled.div`
    width: 100%;
    height: 100%;

    position: relative;

    padding-top: ${props => props.paddingY ?? 0}px;
    padding-bottom: ${props => props.paddingY ?? 0}px;
    padding-left: ${props => props.paddingX ?? 0}px;
    padding-right: ${props => props.paddingX ?? 0}px;
`;

const Input = styled.input`
    display: none;
    &[type='file'] {
        display: none;
    }
`;

const Label = styled.label`
    width: 100%;
    height: 100%;
    font-size: 24px;
    background: #efefef;
    color: #666666;
    font-weight: 300;
    text-align: center;
    cursor: pointer;

    display: inline-block;

    &:hover {
        background: #e8e8e8;
    }
`;

const CroppedImage = styled.img`
    max-width: ${props => props.width}px;
    max-height: ${props => props.height}px;

    width: ${props => (props.height >= props.width ? '100%' : 'auto')};
    height: ${props => (props.width > props.height ? '100%' : 'auto')};

    border: 0;
`;

const Toolbar = styled.div`
    z-index: 5;
    position: absolute;
    top: 0;
    right: 0;
    text-align: right;
    padding: 3px;
    user-select: none;
`;

const Button = styled.button`
    display: inline-block;

    border-radius: 2px;
    outline: none;

    color: #ffffff;
    line-height: 1.5;
    font-size: 12px;
    padding: 3px 5px;

    border: none;

    background: #555555;

    &:hover {
        background: #777777;
    }
`;

const Icon = styled(BaseIcon)`
    display: block;
    font-size: 48px;
    margin-bottom: 10px;
`;

const Placeholder = ({onSelect}) => (
    <Label>
        <VerticalAlign>
            <Icon glyphicon name='picture' />
            Select Image
        </VerticalAlign>
        <Input type='file' onChange={onSelect} accept='.jpg, .png, .gif' />
    </Label>
);
Placeholder.propTypes = {
    onSelect: PropTypes.func.isRequired,
};

class ImagePicker extends React.PureComponent {
    static propTypes = {
        isEditing: PropTypes.bool.isRequired,
    };

    state = {
        crop: {},
        pixelCrop: null,
        isCropping: false,
    };

    cropperStyle = {
        width: '100%',
        height: '100%',
    };

    imageStyle = {
        width: '100%',
        height: '100%',
    };

    parseMimeType = dataUrl =>
        dataUrl && dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));

    /**
     * @param {File} image - Image File Object
     * @param {Object} pixelCrop - pixelCrop Object provided by react-image-crop
     */
    cropImage = (dataUrl, pixelCrop) => {
        return new Promise(resolve => {
            if (!pixelCrop) {
                resolve(dataUrl);
                return;
            }

            const canvas = document.createElement('canvas');

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            const ctx = canvas.getContext('2d');
            const image = new Image();

            const mimeType = this.parseMimeType(dataUrl);

            image.addEventListener(
                'load',
                () => {
                    ctx.drawImage(
                        image,
                        pixelCrop.x,
                        pixelCrop.y,
                        pixelCrop.width,
                        pixelCrop.height,
                        0,
                        0,
                        pixelCrop.width,
                        pixelCrop.height,
                    );

                    resolve(canvas.toDataURL(mimeType));
                },
                false,
            );

            image.src = dataUrl;
        });
    };

    readFile = file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.addEventListener('load', () => resolve(reader.result));
            reader.addEventListener('error', error => reject(error));

            reader.readAsDataURL(file);
        });
    };

    onCrop = (crop, pixelCrop) => {
        this.setState({crop, pixelCrop});
    };

    onSelect = e => {
        this.readFile(e.target.files[0]).then(original => {
            this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {src: original});
            this.setState({isCropping: true});
        });
    };

    onFinish = () => {
        this.cropImage(this.props.src, this.state.pixelCrop).then(cropped => {
            this.props.onSettingsChanged(BaseSpecHandler.changeSettings, {src: cropped});
            this.setState({crop: {}, pixelCrop: null, isCropping: false});
        });
    };

    render() {
        const imageSrc = this.props.dataProvider.settingsValueForComponent(['src']);

        if (imageSrc) {
            if (this.props.isEditing && this.state.isCropping) {
                return (
                    <Container
                        className='noDrag'
                        overflow='hidden'
                        paddingX={this.props.dataProvider.settingsValueForComponent(['paddingX'])}
                        paddingY={this.props.dataProvider.settingsValueForComponent(['paddingY'])}
                    >
                        <Toolbar>
                            <Button onClick={this.onFinish}>Finish</Button>
                        </Toolbar>
                        <ReactCrop
                            imageStyle={this.imageStyle}
                            style={this.cropperStyle}
                            onChange={this.onCrop}
                            src={this.props.src}
                            crop={this.state.crop}
                        />
                    </Container>
                );
            }

            return (
                <Container
                    overflow='hidden'
                    paddingX={this.props.dataProvider.settingsValueForComponent(['paddingX'])}
                    paddingY={this.props.dataProvider.settingsValueForComponent(['paddingY'])}
                >
                    <CroppedImage
                        width={this.props.width}
                        height={this.props.height}
                        src={imageSrc}
                        draggable='false'
                    />
                </Container>
            );
        }

        return (
            <Container
                className='noDrag'
                paddingX={this.props.dataProvider.settingsValueForComponent(['paddingX'])}
                paddingY={this.props.dataProvider.settingsValueForComponent(['paddingY'])}
            >
                <Placeholder onSelect={this.onSelect} />
            </Container>
        );
    }
}

export default ImagePicker;
