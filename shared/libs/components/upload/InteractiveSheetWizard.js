/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import InteractiveSheet from 'src/libs/components/upload/InteractiveSheet';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.define_default_template(`
            <div class="text-center" data-bind="with: active">
                <p class="lead" style='color:#222; padding-bottom:15px;' data-bind="text: text"></p>
                <button type="button" style="width: 100px" class="btn btn-sm btn-ghost-default" data-bind="click: $parent.back, visible: $parent.previous_available">
                    Back
                </button>
                <button type="button"  style="width:100px" class="btn btn-sm btn-ghost-default" data-bind="click: $parent.skip, css: { disabled: !skippable }">
                    Skip
                </button>
                <button type="button" style="width:100px;" class="btn btn-sm btn-confirm" data-bind="click: $parent.next, css: { disabled: !$parent.sheet.has_selection() }">
                    Next
                </button>
            </div>
            <!-- ko if: $parent.uploading -->
                <span class="glyphicon glyphicon-cog animate-spin"></span>
                Re Uploading...
            <!-- /ko -->
            <div style="margin-top:20px;" data-bind="renderComponent: sheet"></div>
        `);

    self.sheet = new InteractiveSheet({
        parent_id: self.get_id(),
        id: 'sheet',
        data: self.data,
        single_selection: true,
        max_height: '350px',
        scrollable: true,
    });

    self.prompts = [];

    self.results = ko.observable({});

    self._active_idx = ko.observable();

    self.active = ko.computed(() => {
        let active_idx = self._active_idx();
        if (active_idx !== undefined && self.prompts[active_idx]) {
            return self.prompts[active_idx];
        }
    });

    self.active.subscribe(active => {
        self.sheet.clear_selection();
        if (active) {
            self.sheet.select_mode(active.select_mode);
        }
    });

    self.reset = function() {
        self._active_idx(undefined);
        self.results({});
        self.sheet.clear_selection();
    };

    self.finish = function() {
        Observer.broadcast_for_id(self.get_id(), 'InteractiveSheetWizard.results', self.results());
        self.reset();
    };

    self.skip = function() {
        self.next(true);
    };

    self.back = function() {
        self.previous();
    };

    self.previous_available = ko.pureComputed(() => {
        return self._active_idx() > 0;
    });

    self.next = function(skip) {
        skip = skip === true;
        let active_idx = self._active_idx();

        let new_idx;

        if (active_idx === undefined) {
            new_idx = 0;
        } else {
            let results = self.results();
            let active = self.prompts[active_idx];

            if (active && active.key && !skip) {
                results[active.key] = self.sheet.get_selected();
                self.results(results);
            }

            new_idx = active_idx + 1;
        }

        if (new_idx === self.prompts.length) {
            self.finish();
        } else {
            self._active_idx(new_idx);
        }
    };

    self.previous = function() {
        let active_idx = self._active_idx();
        if (self.previous_available()) {
            self._active_idx(active_idx - 1);
        }
    };

    self.init = function() {
        if (opts.prompts) {
            for (let i = 0, l = opts.prompts.length; i < l; i++) {
                if (opts.prompts[i]) {
                    let prompt = {...opts.prompts[i]};

                    if (prompt.key === undefined) {
                        throw `Prompt without key in InteractiveSheetWizard (${self.get_id()})`;
                    }

                    if (prompt.select_mode === undefined) {
                        throw `Prompt without select_mode in InteractiveSheetWizard (${self.get_id()})`;
                    }

                    prompt.skippable = prompt.skippable || false;
                    prompt._idx = i;

                    self.prompts.push(prompt);
                }
            }
        } else {
            throw `Trying to initialize InteractiveSheetWizard (${self.get_id()}) without prompts`;
        }
    };

    self.init();

    _dfd.resolve();

    return self;
}
