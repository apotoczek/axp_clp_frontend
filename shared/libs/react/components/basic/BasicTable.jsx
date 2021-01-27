import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Table, TableBody, Row, Cell} from 'components/basic/table';

export default class BasicTable extends Component {
    static propTypes = {
        table: PropTypes.arrayOf(
            PropTypes.arrayOf(
                PropTypes.shape({
                    colSpan: PropTypes.number,
                    header: PropTypes.bool,
                }),
            ).isRequired,
        ),
        striped: PropTypes.bool,
        stripedBgMain: PropTypes.string,
        stripedBgAlt: PropTypes.string,
    };

    render() {
        const rows = this.props.table || [];

        return (
            <Table
                striped={this.props.striped}
                stripedBgMain={this.props.stripedBgMain}
                stripedBgAlt={this.props.stripedBgAlt}
            >
                <TableBody>
                    {rows.map(column => (
                        <Row key={column.map(cell => cell.id).join('')}>
                            {column.map(cell => (
                                <Cell {...cell} key={cell.id}>
                                    {cell.label}
                                </Cell>
                            ))}
                        </Row>
                    ))}
                </TableBody>
            </Table>
        );
    }
}
