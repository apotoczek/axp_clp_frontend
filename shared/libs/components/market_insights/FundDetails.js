/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import BaseModal from 'src/libs/components/basic/BaseModal';
import DataTable from 'src/libs/components/basic/DataTable';
import Observer from 'src/libs/Observer';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Investors</h4>
                        </div>
                        <div class="modal-body">
                            <!-- ko renderComponent: investors --><!-- /ko -->
                            <div style="height:40px">
                            <button type="button" class="btn btn-success pull-right" data-dismiss="modal">Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    let _dfd = self.new_deferred();

    self.columns = opts.columns;

    self.investors = self.new_instance(DataTable, {
        id: 'investors',
        columns: self.columns,
        auto_get_data: false,
        css: {
            'table-light': true,
            'table-sm': true,
        },
        results_per_page: 15,
        inline_data: true,
        datasource: {
            type: 'dynamic',
            key: 'results',
            results_per_page: 'all',
            query: {
                target: 'market_data:investments',
                filters: {
                    type: 'dynamic',
                    query: {
                        fund_uid: {
                            type: 'observer',
                            required: true,
                        },
                        as_of_date: {
                            type: 'observer',
                            required: true,
                        },
                    },
                },
                fund_fallback: false,
            },
        },
    });

    self._update_query = function(data) {
        data = data || {};

        self.investors.update_query({
            filters: {
                fund_uid: data.uid,
                as_of_date: data.as_of_date,
            },
        });
    };

    self.show = function() {
        self._update_query(self.data());
        self.investors.refresh_data();

        bison.helpers.modal(self.template, self, self.get_id());

        Observer.register_hash_listener('investors', () => {
            self.reset();
        });
    };

    _dfd.resolve();

    return self;
}
