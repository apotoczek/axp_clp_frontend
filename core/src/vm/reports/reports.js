/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Context from 'src/libs/Context';
import * as Utils from 'src/libs/Utils';
import ReportArchive from 'src/libs/components/reports/ReportArchive';

export default class Reports extends Context {
    constructor() {
        super({
            id: 'reports',
        });

        this.dfd = this.new_deferred();

        this.archive = this.new_instance(ReportArchive, {
            progress_update_event: Utils.gen_event('DataReports.progress', 'reports'),
        });

        this.when(this.archive).done(() => {
            this.dfd.resolve();
        });
    }
}
