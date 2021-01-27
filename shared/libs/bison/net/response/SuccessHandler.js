/* Automatically transformed from AMD to ES6. Beware of code smell. */
import $ from 'jquery';
import DirectiveHandler from 'bison/net/response/DirectiveHandler';
import ErrorHandler from 'bison/net/response/ErrorHandler';

let self = {
    handle: function(response, status, jqxhr) {
        response = response || {};
        self.handle_directives(response, jqxhr);

        if (typeof response.body !== 'undefined') {
            return response.body;
        }

        if (typeof response.error !== 'undefined') {
            jqxhr.status = response.error.code;
            jqxhr.responseText = JSON.stringify(response);
            return ErrorHandler.handle(jqxhr);
        }
    },
    handle_directives: function(response) {
        $.when(
            $.when(...DirectiveHandler.execute_directives(response.directives, 'track')),
            $.when(...DirectiveHandler.execute_directives(response.directives, 'set_cookies')),
            $.when(...DirectiveHandler.execute_directives(response.directives, 'notify')),
            $.when(...DirectiveHandler.execute_directives(response.directives, 'confirm')),
        ).done(() => {
            DirectiveHandler.execute_directives(response.directives, 'redirect');
            DirectiveHandler.execute_directives(response.directives, 'reload');
        });
    },
};

export default self;
