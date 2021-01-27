import React, {Component} from 'react';
import {withRouter} from 'react-router';

import * as api from 'api';

import {Container, Content, Page, Viewport} from 'components/layout';

import DocumentBrowser, {shortUid} from 'components/documents/DocumentBrowser';
import Breadcrumbs from 'components/Breadcrumbs';

function makeUidMap({children}, map = {}) {
    Object.entries(children).forEach(([k, v]) => {
        map[shortUid(k)] = k;
        if (v.children) {
            makeUidMap(v, map);
        }
    });
    return map;
}

const actions = {
    addReportToDirectory: api.addReportToDirectory,
    createDirectory: api.createDirectory,
    deleteDirectory: api.deleteDirectory,
    deleteReport: api.deleteReport,
    duplicateReport: api.duplicateReport,
    moveDirectory: api.moveDirectory,
    moveReport: api.moveReport,
    removeReportFromDirectory: api.removeReportFromDirectory,
    renameDirectory: api.renameDirectory,
    exportReport: api.exportReport,
    exportDirectory: api.exportDirectory,
};

class DocumentsIndexContainer extends Component {
    state = {
        isLoading: true,
    };

    fetchUserDirectoryRoot() {
        this.setState({isLoading: true});
        api.callEndpoint('directory/get_user_root')
            .then(({root}) => {
                this.setState({
                    isLoading: false,
                    directoryRoot: root,
                    uidMap: makeUidMap(root),
                });
                api.dataThing.statusCheck();
            })
            .catch(() => {
                this.setState({isLoading: false});
            })
            .expired.then(() => this.fetchUserDirectoryRoot());
    }

    componentDidMount() {
        this.fetchUserDirectoryRoot();
    }

    render() {
        const {history, match} = this.props;
        const {directoryRoot, isLoading, uidMap} = this.state;

        const path = (match.params.dir || '').split('/').filter(v => !v.isEmpty());
        const selectedPath = uidMap ? path.map(v => uidMap[v]) : [];

        return (
            <Container ref={this.containerRef}>
                <Viewport>
                    <Breadcrumbs path={['Reports']} />
                    <Page>
                        <Content>
                            <DocumentBrowser
                                history={history}
                                root={directoryRoot}
                                actions={actions}
                                isLoading={isLoading}
                                selectedPath={selectedPath}
                            />
                        </Content>
                    </Page>
                </Viewport>
            </Container>
        );
    }
}

export default withRouter(DocumentsIndexContainer);
