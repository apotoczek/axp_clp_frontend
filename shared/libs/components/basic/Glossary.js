/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import lang from 'lang';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.terms = opts.terms;

    self.definitions = ko.computed(() => {
        let dl = [];
        for (let i = 0, l = self.terms.length; i < l; i++) {
            let key = lang.aliases[self.terms[i]] || self.terms[i];
            dl[i] = {term: key, definition: lang[key].definition};
        }
        return dl;
    });

    return self;
}
