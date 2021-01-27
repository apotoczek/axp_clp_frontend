import styled from 'styled-components';
import {Box} from '@rebass/grid';

const InfoBox = styled(Box)`
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    margin: 20px;
    padding: 12px;
    > p {
        font-size: 13px;
    }
    ${({theme, error}) => {
        const status = error ? 'error' : 'default';

        return `
            background-color: ${theme.infoBox[status].bg};
            color: ${theme.infoBox[status].fg};
        `;
    }}
`;

export default InfoBox;
