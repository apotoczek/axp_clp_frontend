/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Context from 'src/libs/Context';

export default class NotFound extends Context {
    constructor() {
        super({id: 'notfound'});
        this.dfd = this.new_deferred();

        this.dfd.resolve();
    }
}
