import bison from 'bison';
import DataThing from 'src/libs/DataThing';
import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';

import Observer from 'src/libs/Observer';

class DeleteCompaniesModal extends DeleteModalBase {
    constructor(opts, components) {
        const to_delete_table_columns = [{label: 'Name', key: 'name'}];
        super({to_delete_table_columns, ...opts}, components);

        this.dfd = this.new_deferred();

        this.warning_text =
            'Are you sure you want to delete these companies? This action can not be undone.';

        this._delete_companies = DataThing.backends.useractionhandler({
            url: 'delete_companies',
        });

        this.dfd.resolve();
    }

    delete_entities = () => {
        let companies = this.data_to_delete();
        if (companies && companies.length > 0) {
            const company_uids = companies.map(({uid}) => uid);
            this.loading(true);

            this._delete_companies({
                data: {
                    company_uids: company_uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    Observer.broadcast('DeleteModal.delete_companies', {
                        company_uids: company_uids,
                    });

                    DataThing.status_check();
                    this.reset();
                }),
                error: DataThing.api.XHRError(e => {
                    bison.utils.Notify('Heads up!', e, 'alert-danger', 0);
                    this.reset();
                }),
            });
        }
    };
}

export default DeleteCompaniesModal;
