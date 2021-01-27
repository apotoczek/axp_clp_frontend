/* Automatically transformed from AMD to ES6. Beware of code smell. */
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title">Promote SEC</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                            </div>
                            <hr class="transparent hr-small" />
                            <button type="button" class="btn btn-primary" data-bind='click: test'>Add new Fund</button>
                            <button type="button" class="btn btn-primary" data-bind='click: test'>Add new Firm</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.test = function() {};

    return self;
}
