/* Automatically transformed from AMD to ES6. Beware of code smell. */
import APIEndpoint from 'bison/net/APIEndpoint';

export default function() {
    let self = this;

    self.endpoint = function(conf) {
        return new APIEndpoint(conf);
    };
}
