import config from 'config';
import Context from 'src/libs/Context';

class PublicPage extends Context {
    constructor() {
        super({id: 'public_page'});

        this.dfd = this.new_deferred();

        this.logo_urls = config.logo_urls;
        this.logo_style = config.public_logo_style;
        this.error_page_class = 'public-error-page';
        this.support_email_reversed = config.support_email.reverse();
        this.support_phone = config.support_phone;

        this.dfd.resolve();
    }
}

export default PublicPage;
