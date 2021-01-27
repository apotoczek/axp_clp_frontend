/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.template = opts.template || 'tpl_how_to_modal';

    self.title = 'Tips for Using Data Manager';

    self.tips = [
        {
            tip_title: 'Upload your Data',
            tip_text:
                'Upload cash flows; company, fund, and manager attributes; as well as financial metrics, all in one place. Your data will be encrypted and you will control access to it.',
            tip_img: require('src/img/secure.png'),
            img_width: '80px',
        },
        {
            tip_title: 'Customize Attributes',
            tip_text: 'Set attributes for your data for easy searching and defining of peer sets.',
            tip_img: require('src/img/how_to_datamanager1.png'),
            img_width: '160px',
        },
        {
            tip_title: "Archive Vehicles you don't need",
            tip_text:
                'Use the button in the toolbar to archive selected vehicles. These vehicles will no longer show up anywhere on Cobalt. You can restore them here at any time.',
            tip_img: require('src/img/how_to_archive1.jpg'),
            img_width: '140px',
        },
    ];

    self.got_it = function() {
        self.reset();
    };

    return self;
}
