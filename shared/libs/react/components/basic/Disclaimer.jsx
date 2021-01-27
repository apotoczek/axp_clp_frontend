import React, {Component} from 'react';
import styled from 'styled-components';

const DisclaimerWrapper = styled.div`
    background-color: #fcf8e3;
    padding: 24px 16px;

    overflow: auto;
`;

const DisclaimerText = styled.p`
    color: #8a6d3b;
    font-size: 14px;
    width: 90%;
    display: inline-block;
    margin: 0 16px 0 0;
`;

const OKButton = styled.button`
    display: inline-block;
    width: calc(10% - 16px);
    vertical-align: top;
    background: #c87f0c;
    color: #ffffff;
    font-weight: 700;

    &:hover {
        background: #976008;
        color: #ffffff;
    }
`;

class Disclaimer extends Component {
    handleConfirmClick = () => {
        const {onConfirm} = this.props;
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    renderConfirmButton() {
        return (
            <OKButton className='btn btn-sm btn-confirm' onClick={() => this.handleConfirmClick()}>
                OK
            </OKButton>
        );
    }

    render() {
        const {header, message, onConfirm} = this.props;

        return (
            <DisclaimerWrapper>
                <DisclaimerText>
                    <strong>{header}</strong> {message}
                </DisclaimerText>
                {typeof onConfirm === 'function' && this.renderConfirmButton()}
            </DisclaimerWrapper>
        );
    }
}

export default Disclaimer;
