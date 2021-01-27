/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import * as Utils from 'src/libs/Utils';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    // Specifies the list name in the form.
    self.name = opts.name || ko.observable();

    // Specifies the list description in the form.
    self.description = opts.description || ko.observable();

    // Specifies the text in the header of the modal.
    self.modal_title = opts.modal_title;

    // Specifies the text on the submit button in the form.
    self.submit_label = opts.submit_label;

    self.define_template(`
            <div class="modal fade" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button
                                type="button"
                                class="close"
                                data-dismiss="modal"
                                aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 class="modal-title" data-bind="text: modal_title"></h4>
                        </div>
                        <div class="modal-body">
                            <form data-bind="submit: on_submit">
                                <div
                                    class="form-group"
                                    data-bind="css: { 'has-error': name_has_error }">
                                    <label class="control-label" for="list-name">List name*</label>
                                    <input
                                        id="list-name"
                                        data-bind="
                                            textInput: name
                                        "
                                        class="form-control" />
                                </div>
                                <div class="form-group">
                                    <label
                                        class="control-label"
                                        for="list-description">List description</label>
                                    <textarea
                                        id="list-description"
                                        data-bind="textInput: description"
                                        class="form-control"
                                        rows="5"></textarea>
                                    <small class="form-text form-muted">
                                        A short summary that describes the entities in
                                        the list.
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-ghost-default"
                                    data-dismiss="modal"
                                    data-bind="css: { disabled: loading }">
                                    Cancel
                                </button>
                                <button
                                    type="submit" class="btn btn-success"
                                    data-bind="
                                        css: { disabled: disable_submit },
                                        disable: disable_submit
                                    ">
                                    <!-- ko if: loading -->
                                        <span class="glyphicon glyphicon-cog animate-spin"></span>
                                        Loading...
                                    <!-- /ko -->
                                    <!-- ko ifnot: loading -->
                                        <span data-bind="text: submit_label"></span>
                                    <!-- /ko -->
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.disable_submit = ko.pureComputed(
        () => !Utils.is_set(self.name()) || self.name().length == 0 || self.loading(),
    );

    self.name_has_error = ko.pureComputed(
        () => Utils.is_set(self.name()) && self.name().length == 0,
    );

    self.on_submit = function() {
        throw 'On submit needs to be implemented in a subclass to ListModalBase';
    };

    /********************************************************************
     * Modal functionality
     *******************************************************************/

    self.show = function() {
        bison.helpers.modal(self.template, self, self.get_id());
    };

    self.reset = function() {
        bison.helpers.close_modal(self.get_id());
        self.name('');
        self.description('');
        self.loading(false);
    };

    _dfd.resolve();

    return self;
}
