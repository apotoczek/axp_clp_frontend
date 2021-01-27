/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ErrorHandler from 'bison/net/response/ErrorHandler';
import SuccessHandler from 'bison/net/response/SuccessHandler';

export default function() {
    if (arguments[1] == 'error') {
        return ErrorHandler.handle.apply(this, arguments);
    }
    return SuccessHandler.handle.apply(this, arguments);
}
