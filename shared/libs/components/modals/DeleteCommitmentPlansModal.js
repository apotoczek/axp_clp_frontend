import DeleteModalBase from 'src/libs/components/modals/DeleteModalBase';
import DataThing from 'src/libs/DataThing';

class DeleteCommitmentPlansModal extends DeleteModalBase {
    constructor(opts, components) {
        opts.to_delete_table_columns = [
            {
                label: 'Name',
                key: 'name',
            },
            {
                label: '# of Commitments',
                key: 'count',
            },
        ];
        super(opts, components);

        this._remove_funds_from_portfolio = DataThing.backends.useractionhandler({
            url: 'delete_commitment_plans',
        });

        this.delete_entities = () => {
            const data = this.data_to_delete();
            const uids = data.map(obj => obj.uid);
            this._remove_funds_from_portfolio({
                data: {
                    commitment_plan_uids: uids,
                },
                success: DataThing.api.XHRSuccess(() => {
                    this.reset();
                    DataThing.status_check();
                }),
            });
        };
    }
}
export default DeleteCommitmentPlansModal;
