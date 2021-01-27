/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.template = opts.template || 'tpl_how_to_modal';

    self.title = 'Tips for Using Lists';

    self.tips = [
        {
            tip_title: 'What are they?',
            tip_text:
                'Lists help you organize data into groups that make sense to you. Anything can go into a list; use them to compare against other data or just to keep track of things.',
            tip_img: '',
            img_width: '',
        },
        {
            tip_title: 'Create Lists Here',
            tip_text: 'Create a list by naming it to get started.',
            tip_img: require('src/img/how_to_lists1.png'),
            img_width: '120px',
        },
        {
            tip_title: 'Add to your lists',
            tip_text:
                'Add your own data or data from Market Research into your already-created lists.',
            tip_img: require('src/img/how_to_lists2.png'),
            img_width: '120px',
        },
    ];

    self.got_it = function() {
        self.reset();
    };

    return self;
}
