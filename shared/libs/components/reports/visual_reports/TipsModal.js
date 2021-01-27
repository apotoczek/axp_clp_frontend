/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseModal from 'src/libs/components/basic/BaseModal';

export default function(opts, components) {
    let self = new BaseModal(opts, components);

    let visual_report_tips_001_image = require('src/img/visual_report_tips_001.png');
    let visual_report_tips_002_image = require('src/img/visual_report_tips_002.png');
    let visual_report_tips_006_image = require('src/img/visual_report_tips_006.png');
    let visual_report_tips_003_image = require('src/img/visual_report_tips_003.png');
    let visual_report_tips_004_image = require('src/img/visual_report_tips_004.png');
    let visual_report_tips_005_image = require('src/img/visual_report_tips_005.png');
    self.define_default_template(`
            <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4>Tips for Using Visual Reports</h4>
                        </div>
                        <div class="modal-body">
                            <div class="row tip">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_001_image}" style="    margin-top: 35px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <h3>Select a template</h3>
                                    <p class="lead">Select a template above that matches the type of report you want to create.</p>
                                </div>
                            </div>
                            <div class="row tip">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_002_image}" style="    margin-top: 35px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <h3>Configure your report</h3>
                                    <p class="lead">Edit the settings and peer set for the different components of your report.</p>
                                </div>
                            </div>
                            <div class="row tip">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_006_image}" style="    margin-top: 35px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <h3>Customize your report</h3>
                                    <p class="lead">Hide any pieces you don't wish to include.</p>
                                </div>
                            </div>
                            <div class="row tip">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_003_image}" style="    margin-top: 35px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <h3>Preview</h3>
                                    <p class="lead">Preview your report to make sure everything looks the way you want.</p>
                                </div>
                            </div>
                            <div class="row tip">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_004_image}" style="    margin-top: 35px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <h3>Finish</h3>
                                    <p class="lead">Finish your report so that your data won't change next time you want to download the report.</p>
                                </div>
                            </div>
                            <div class="row tip well">
                                <div class="col-xs-4" style="text-align:center;">
                                    <img src="${visual_report_tips_005_image}" style="    margin-top: 20px;"/>
                                </div>
                                <div class="col-xs-8">
                                    <p>Come back and download your report as many times as you want, or make a fresh copy to get more up-to-date data.</p>
                                </div>
                            </div>
                            <div style="height: 34px; text-align: center;">
                                <button class="btn btn-success" data-bind="click: got_it">Got it <span class="glyphicon glyphicon-ok"></span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    self.got_it = function() {
        self.reset();
    };

    return self;
}
