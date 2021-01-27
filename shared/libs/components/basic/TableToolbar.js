/* Automatically transformed from AMD to ES6. Beware of code smell. */
import Checklist from 'src/libs/components/basic/Checklist';
import PopoverAddFundSnapshot from 'src/libs/components/popovers/PopoverAddFundSnapshot';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import * as Utils from 'src/libs/Utils';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
        <div style="height: 35px; border: 1px solid #ddd;" data-bind='visible: visible'>
            <div class="action-buttons-container" style="white-space: nowrap;">
                <!-- ko renderComponent: add_compset_popover --><!-- /ko -->
                <!-- ko renderComponent: list_as_compset --><!-- /ko -->
                <!-- ko foreach: buttons -->
                    <a class="btn btn-table-toolbar" role="button" data-bind="html: label, click: action"></a>
                <!-- /ko -->
            </div>
        </div>
    `);

    let dfd = self.new_deferred();

    self.selected_entities = ko.observable();
    Observer.register(opts.data_table_selected_event, self.selected_entities);

    self.enable_compset = ko.computed(() => {
        if (opts.enable_compset && self._charts().length) {
            let chart = self.active_chart_type();

            return chart === 'benchmark' || chart === 'snapshot';
        }
        return false;
    });

    self.fund_performance = opts.fund_performance;

    self.add_compset_popover = self.new_instance(NewPopoverButton, {
        label: 'Add Comparison Fund',
        template: 'tpl_new_popover_button_a',
        css: {
            'btn-table-toolbar': true,
        },
        icon_css: {
            glyphicon: true,
            'glyphicon-plus': true,
        },
        popover_options: {
            placement: 'bottom',
            title: 'Add Comparison Fund',
        },
        popover_config: {
            component: PopoverAddFundSnapshot,
            template: 'tpl_popover_add_fund_snapshot_2col',
            single_selection: true,
            compset: self.fund_performance.active_compset,
        },
    });

    self.list_as_compset = self.new_instance(NewPopoverButton, {
        label: 'Compare to List',
        id: 'list_as_compset',
        template: 'tpl_new_popover_button_a',
        css: {
            'btn-table-toolbar': true,
        },
        icon_css: {
            glyphicon: true,
            'glyphicon-plus': true,
        },
        popover_options: {
            placement: 'bottom',
            title: 'Lists',
            css_class: 'popover-ghost-info',
        },
        popover_config: {
            component: Checklist,
            clear_event: Utils.gen_event('TableToolbar.clear_compset_event', self.get_id()),
            single_selection: true,
            datasource: {
                key: 'results',
                mapping: 'to_options',
                mapping_args: {
                    value_key: 'uid',
                    label_key: 'name',
                },
                type: 'dynamic',
                query: {
                    target: 'user:lists',
                    results_per_page: 'all',
                },
            },
        },
    });

    self.list_compset_event = Utils.gen_event('PopoverButton.value', self.list_as_compset.get_id());

    Observer.register(self.list_compset_event, e => {
        Observer.broadcast(Utils.gen_event('TableToolbar.list_compset_event', self.get_id()), e);
    });

    self.buttons = [
        {
            label:
                '<span class="pull-left">Add to Chart </span><span class="glyphicon glyphicon-plus pull-right"></span>',
            action: () => {
                Observer.broadcast(
                    Utils.gen_event('TableToolbar.set_compset_event', self.get_id()),
                    self.selected_entities(),
                );
            },
            css: {'btn-table-toolbar': true},
        },
        {
            label:
                '<span class="pull-left">Remove Comparison Funds </span><i class="icon icon-cancel pull-right"></i>',
            action: () => {
                Observer.broadcast(
                    Utils.gen_event('TableToolbar.clear_compset_event', self.get_id()),
                );
            },
            css: {'btn-table-toolbar': true},
        },
    ];

    self.when(self.add_compset_popover, self.list_as_compset).done(() => {
        dfd.resolve();
    });

    return self;
}
