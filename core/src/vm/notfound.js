/* Automatically transformed from AMD to ES6. Beware of code smell. */
import config from 'config';
import Context from 'src/libs/Context';

export default class NotFound extends Context {
    constructor() {
        super({id: 'notfound'});
        // Internal deferred
        this.dfd = this.new_deferred();

        this.logo_urls = config.logo_urls;
        this.logo_style = config.public_logo_style;

        this.support_email_reversed = config.support_email.reverse();
        this.support_phone = config.support_phone;
        this.error_page_class = 'app-error-page';

        this.dfd.resolve();
    }
}
