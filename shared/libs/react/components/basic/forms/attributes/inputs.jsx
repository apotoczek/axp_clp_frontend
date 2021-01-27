import styled from 'styled-components';

export const Input = styled.input`
    border: ${({hasError}) => (hasError ? '1px solid red' : '1px solid #E5E5E5')};
    padding: 9px;
    outline: none;
    border-radius: 4px;
    font-size: 12px;
    flex-grow: 1;
    &:hover {
        border: 1px solid #cccccc;
    }
    &:focus {
        border: 1px solid #cccccc;
    }
`;
