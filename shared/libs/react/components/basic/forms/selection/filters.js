export class ObjectFilterer {
    constructor(key) {
        this.key = key;
    }

    validQuery(query) {
        return query !== null;
    }

    filter(query, options) {
        if (this.validQuery(query)) {
            return options.filter(o => this.qualify(query, o));
        }

        return options;
    }

    preprocess(obj) {
        return obj[this.key];
    }

    qualify(query, obj) {
        return query === this.preprocess(obj);
    }
}

export class TextFilterer extends ObjectFilterer {
    preprocess(obj) {
        return super.preprocess(obj).toLowerCase();
    }

    isValidQuery(query) {
        return query.length > 0;
    }

    qualify(query, obj) {
        let text = this.preprocess(obj);
        return text.includes(query.toLowerCase());
    }
}

export class EnumFilterer extends ObjectFilterer {}
