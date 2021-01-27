import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

class BaseModal extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.template = opts.template;
        this.close_on_url_change = opts.close_on_url_change;

        /********************************************************************
         * Modal functionality
         *******************************************************************/
        this.show = () => {
            bison.helpers.modal(this.template, this, this.get_id());
        };

        this.reset = () => {
            bison.helpers.close_modal(this.get_id());
            this.loading(false);
        };
    }
}

export default BaseModal;
