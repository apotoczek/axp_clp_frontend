/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    self.template = opts.template || 'tpl_how_to_modal';

    self.title = 'Tips for Using Data Reports';

    self.tips = [
        {
            tip_title: 'Select a template',
            tip_text: 'Select a template above that matches the type of report you want to run.',
            tip_img: require('src/img/visual_report_tips_001.png'),
            img_width: '120px',
        },
        {
            tip_title: 'Configure your report',
            tip_text: 'Edit the settings to make sure you get what you want.',
            tip_img: require('src/img/how_to_datareport1.png'),
            img_width: '120px',
        },
        {
            tip_title: 'Download your Report',
            tip_text: 'Download a copy or export it in the preview.',
            tip_img: require('src/img/how_to_datareport2.png'),
            img_width: '90px',
        },
    ];

    self.got_it = function() {
        self.reset();
    };

    return self;
}
