import React from 'react';
import {Flex} from '@rebass/grid';
import {Input} from './inputs';
import {ActionButton} from './buttons';
import PropTypes from 'prop-types';

export const ErrorMessage = ({message}) => {
    return (
        <div
            style={{
                fontSize: '12px',
                color: '#F51010',
                padding: message !== '' ? '2px' : 0,
                textAlign: 'left',
            }}
        >
            {message}
        </div>
    );
};

ErrorMessage.propTypes = {message: PropTypes.string};

export const MemberForm = ({value = '', error = '', onSubmit, onChange, onBlur}) => {
    return (
        <form
            onSubmit={e => {
                e.stopPropagation();
                e.preventDefault();
                return onSubmit(e);
            }}
        >
            <Flex flexGrow={1} mb={1}>
                <Input
                    placeholder='New Item Name'
                    onBlur={onBlur}
                    onChange={onChange}
                    hasError={!!error}
                    value={value}
                    style={{marginRight: '6px'}}
                />
                <ActionButton onClick={onSubmit}>+ Add</ActionButton>
            </Flex>
            <ErrorMessage message={error} />
        </form>
    );
};

MemberForm.propTypes = {
    value: PropTypes.string.isRequired,
    error: PropTypes.string,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
};
