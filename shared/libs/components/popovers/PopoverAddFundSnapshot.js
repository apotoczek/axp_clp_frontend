/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import bison from 'bison';
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    self.template = opts.template || 'tpl_popover_add_fund_snapshot_2col';
    let _dfd = self.new_deferred();

    self.waiting = ko.observable(false);
    self.enabled = ko.observable(true);
    self.pause_bindings = ko.observable(false);
    self.compset = opts.compset;

    self.fund = {
        name: ko.observable(),
        irr: ko.observable(),
        multiple: ko.observable(),
        dpi: ko.observable(),
        rvpi: ko.observable(),
        pme_alpha: ko.observable(),
    };

    self.add = function() {
        let value = self.get_value();
        if (value) {
            self.compset.push(value);
            self.clear_form();
        } else {
            bison.utils.Notify(
                'Heads up!',
                'You have to enter a name and at least one valid value.',
                'alert-info',
            );
        }
    };

    self.remove_comp = function(comp) {
        self.compset.remove(comp);
    };

    self.clear_form = function() {
        self.fund.name(undefined);
        self.fund.irr(undefined);
        self.fund.multiple(undefined);
        self.fund.dpi(undefined);
        self.fund.rvpi(undefined);
        self.fund.pme_alpha(undefined);
    };

    self.clear = function() {
        self.fund.name(undefined);
        self.fund.irr(undefined);
        self.fund.multiple(undefined);
        self.fund.dpi(undefined);
        self.fund.rvpi(undefined);
        self.fund.pme_alpha(undefined);
        self.compset([]);
    };

    self.get_state = function() {
        return self.get_value();
    };

    self.set_state = function(state) {
        self.fund = state;
    };

    self.get_value = ko.computed(() => {
        let fund = {
            uid: self.fund.name(),
            entity_type: 'custom',
            name: self.fund.name(),
            irr: parseFloat(self.fund.irr()) / 100,
            multiple: parseFloat(self.fund.multiple()),
            tvpi: parseFloat(self.fund.multiple()),
            dpi: parseFloat(self.fund.dpi()),
            rvpi: parseFloat(self.fund.rvpi()),
            bison_pme_alpha: parseFloat(self.fund.pme_alpha()) / 100,
            color: '#61C38C',
        };

        if (!fund.name || fund.name.length == 0) {
            return false;
        }

        if (isNaN(fund.multiple)) {
            fund.multiple = undefined;
        }

        if (isNaN(fund.tvpi)) {
            fund.tvpi = undefined;
        }

        if (isNaN(fund.dpi)) {
            fund.dpi = undefined;
        }

        if (isNaN(fund.irr)) {
            fund.irr = undefined;
        }

        if (isNaN(fund.rvpi)) {
            fund.rvpi = undefined;
        }

        if (isNaN(fund.bison_pme_alpha)) {
            fund.bison_pme_alpha = undefined;
        }

        if (
            fund.irr === undefined &&
            fund.multiple === undefined &&
            fund.dpi === undefined &&
            fund.rvpi === undefined &&
            fund.bison_pme_alpha === undefined
        ) {
            return false;
        }

        return fund;
    });

    self.modified = ko.computed(() => {
        return Object.values(ko.toJS(self.fund)).compact().length > 0;
    });

    _dfd.resolve();
    return self;
}
