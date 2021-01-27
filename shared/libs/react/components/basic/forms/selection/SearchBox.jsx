import React from 'react';
import styled from 'styled-components';

const Input = styled.input`
    box-sizing: border-box;
    width: 100%;
    font-size: 1.2em;
    padding: 4px 6px;
    transition: 200ms;
    border: none;
    background-color: ${({theme}) => theme.multiSelect.searchBoxBg};
    &:focus {
        outline: none;
        background-color: ${({theme}) => theme.multiSelect.searchBoxBgFocus};
    }
    border-width: 1px;
    border-color: ${({theme}) => theme.multiSelect.searchBoxBorder};
    border-style: solid;
    border-bottom-width: 0;
    color: ${({theme}) => theme.multiSelect.searchBoxFg};

    &::placeholder {
        color: ${({theme}) => theme.multiSelect.searchBoxPlaceholderFg};
    }
`;

const SearchBox = ({onChange, placeholder}) => {
    placeholder = placeholder || 'Filter';
    return <Input onChange={query => onChange(query)} placeholder={placeholder} />;
};

export default SearchBox;
