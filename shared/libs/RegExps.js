/* Automatically transformed from AMD to ES6. Beware of code smell. */

let self = {};

self.uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
self.example_uuid = /1[0]{7}(-[0]{4}){3}.+/;
self.any = /.*/;
self.one_of = function(...options) {
    return new RegExp(`^(${options.join('|')})$`);
};

export default self;
