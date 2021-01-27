/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts = {}, components = {}) {
    let self = new BaseComponent(opts, components);

    self._hooks = {};

    self.run = function(name, {args, delay = 0}) {
        let run_hooks = function() {
            if (name in self._hooks) {
                for (let hook of self._hooks[name]) {
                    hook(args);
                }
            }
        };

        if (delay) {
            setTimeout(run_hooks, delay);
        } else {
            run_hooks();
        }
    };

    self.push = function(name, fn) {
        if (!(name in self._hooks)) {
            self._hooks[name] = [];
        }

        self._hooks[name].push(fn);
    };

    return self;
}
