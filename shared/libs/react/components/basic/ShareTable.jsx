import React, {Component} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import Icon from 'components/basic/Icon';

import {Table, TableHead, TableBody, Row, Cell} from 'components/basic/table';

const ColoredBooleanText = styled.span`
    color: ${props => (props.value ? 'green' : 'red')};
`;

const BooleanText = props => {
    return (
        <ColoredBooleanText value={props.value}>{props.value ? 'Yes' : 'No'}</ColoredBooleanText>
    );
};

export default class ShareTable extends Component {
    static propTypes = {
        rows: PropTypes.arrayOf(PropTypes.object),
        onDeleteShare: PropTypes.func.isRequired,
    };

    static defaultProps = {
        rows: [],
    };

    handleDeleteShare(shareUid, entityUid) {
        const {onDeleteShare} = this.props;

        onDeleteShare({shareUid, entityUid});
    }

    renderHeaderRow() {
        return (
            <TableHead>
                <Row header>
                    <Cell>Shared with</Cell>
                    <Cell>Read</Cell>
                    <Cell>Write</Cell>
                    <Cell>Share</Cell>
                </Row>
            </TableHead>
        );
    }

    renderRow(row) {
        return (
            <Row key={row.uid}>
                <Cell>{row.display_name}</Cell>
                <Cell>
                    <BooleanText value={row.read} />
                </Cell>
                <Cell>
                    <BooleanText value={row.write} />
                </Cell>
                <Cell>
                    <BooleanText value={row.share} />
                </Cell>
                <Cell>
                    <Icon
                        name='trash'
                        glyphicon
                        button
                        right
                        onClick={() => this.handleDeleteShare(row.uid, row.dashboard_uid)}
                    />
                </Cell>
            </Row>
        );
    }

    render() {
        const {rows} = this.props;

        return (
            <Table striped dark>
                {this.renderHeaderRow()}
                <TableBody>{rows.map(this.renderRow.bind(this))}</TableBody>
            </Table>
        );
    }
}
