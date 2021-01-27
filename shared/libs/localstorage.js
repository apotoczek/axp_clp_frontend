/* Automatically transformed from AMD to ES6. Beware of code smell. */

let self = {};
let fail, uid;
try {
    uid = new Date();
    (self.storage = window.localStorage).setItem(uid, uid);
    fail = self.storage.getItem(uid) != uid;
    self.storage.removeItem(uid);
    fail && (self.storage = false);
} catch (e) {
    self.storage = false;
}

let get = function(key) {
    if (self.storage) {
        let expire_key = `${key}.expire`;
        let expire = self.storage.getItem(expire_key);
        let now = new Date();

        if (expire === null || expire > now.getTime()) {
            let value = self.storage.getItem(key);
            if (value !== null && value !== undefined) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    return null;
};

let set = function(key, value, ttl) {
    if (self.storage) {
        let expire_key = `${key}.expire`;
        self.storage.removeItem(expire_key);
        if (ttl !== undefined) {
            let now = new Date();
            let expire = now.getTime() + ttl * 1000;
            self.storage.setItem(expire_key, expire);
        }
        self.storage.setItem(key, JSON.stringify(value));
    }
};

let remove = function(key) {
    if (self.storage) {
        self.storage.removeItem(key);
    }
};

let clear = function() {
    if (self.storage) {
        self.storage.clear();
    }
};

export default {
    get: get,
    set: set,
    remove: remove,
    clear: clear,
};
