/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.template = opts.template || 'tpl_how_to_modal';

    self.title = 'Tips for Using Attributes';

    self.tips = [
        {
            tip_title: 'What are they?',
            tip_text:
                'Custom attributes allow you to define your own attributes for your investment data. Ex: assign a customized geography, date, or list of items to reuse when creating new funds or portfolios.',
            tip_img: '',
            img_width: '',
        },
        {
            tip_title: 'Create Your Own',
            tip_text: 'Name your attribute and give it a type and description.',
            tip_img: require('src/img/how_to_attributes1.png'),
            img_width: '150px',
        },
        {
            tip_title: 'Add to your Data',
            tip_text: 'Assign your custom attributes to your funds, portfolios, and other entities',
            tip_img: require('src/img/how_to_attributes2.png'),
            img_width: '120px',
        },
    ];

    self.got_it = function() {
        self.reset();
    };

    return self;
}
