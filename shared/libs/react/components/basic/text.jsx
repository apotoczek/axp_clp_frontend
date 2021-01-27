import styled, {css} from 'styled-components';

export const TextBase = css`
    font-family: Lato, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
`;

export const H1 = styled.h1`
    ${TextBase}

    margin: 0 0 8px;

    font-family: Lato, Helvetica, Arial, sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 25px;
    color: ${({theme}) => theme.text.h1};
`;

export const H2 = styled.h2`
    ${TextBase}

    margin: 0 0 8px;

    font-weight: 500;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${({theme}) => theme.text.h2};
`;

export const H3 = styled.h3`
    ${TextBase}

    margin: 0 0 8px;

    text-transform: uppercase;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    color: ${({theme}) => theme.text.h3};
`;

export const H4 = styled.h4`
    ${TextBase}

    margin: 0 0 8px;

    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    color: ${({theme}) => theme.text.h4};
`;

export const H5 = styled.h5`
    ${TextBase}

    margin: 0 0 8px;

    text-transform: uppercase;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    color: ${({theme}) => theme.text.h5};
`;

export const Description = styled.span`
    ${TextBase}

    margin: 0 0 8px;

    font-family: Lato, Helvetica, Arial, sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    line-height: 18px;

    color: ${({theme}) => theme.text.description};
`;

export const Bold = styled.span`
    ${TextBase}

    font-weight: 700;
`;

export const HelpText = styled.div`
    margin-top: -8px;
    margin-bottom: 6px;
    font-size: 11px;
    color: #999999;
`;

export const Italic = styled.span`
    ${TextBase}

    font-style: oblique;
`;

export const Link = styled.span`
    color: ${props => props.color || 'rgb(107, 164, 255)'};
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;
