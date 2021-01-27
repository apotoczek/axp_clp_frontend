import DataSource from 'src/libs/DataSource';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import MultiSelect from 'components/basic/forms/selection/MultiSelect';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {array_move} from 'src/libs/Utils';

import ko from 'knockout';

import 'src/libs/bindings/react';

export default class MetricSelector extends BaseComponent {
    constructor(opts, components) {
        super(opts, components);

        this.MultiSelect = DragDropContext(HTML5Backend)(MultiSelect);

        this.selectedKeys = ko.observableArray([]);
        this.disabledKeys = ko.observableArray([]);

        this.metricIdKey = opts.metricIdKey || 'uid';
        this.theme = opts.theme;

        this.lockDefaults = opts.lockDefaults || false;

        this.datasource = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'all_metrics_for_user',
                },
            },
        });

        this.options = ko.pureComputed(() => {
            let data = this.datasource.data();

            const options = [];

            if (data) {
                for (const item of data) {
                    const option = {
                        ...item,
                        key: item[this.metricIdKey],
                    };

                    options.push(option);
                }
            }

            return options;
        });

        this.selected = ko.pureComputed(() => {
            const options = this.options();

            const selectedOptions = [];
            for (const key of this.selectedKeys()) {
                const option = options.find(o => o[this.metricIdKey] === key);

                if (option) {
                    selectedOptions.push(option);
                }
            }

            return selectedOptions;
        });

        this.props = ko.pureComputed(() => ({
            keyKey: this.metricIdKey,
            options: this.options(),
            disabledKeys: this.lockDefaults ? this.disabledKeys() : [],
            selectedKeys: this.selectedKeys(),
            labelKey: 'base_metric_name',
            metaKey: 'reporting_period',
            leftLabel: 'Select Metrics',
            rightLabel: 'Included Metrics',
            onItemSelect: this.handleItemSelect,
            onItemUnselect: this.handleItemUnselect,
            onItemMove: this.handleItemMove,
        }));

        this.define_template(`
            <div data-bind="
                renderReactComponent: MultiSelect,
                props: props,
                dark: theme === 'dark'
            " />
        `);
    }

    handleItemSelect = uid => {
        const keys = this.selectedKeys();

        this.selectedKeys([...keys, uid]);
    };

    handleItemUnselect = uid => {
        const keys = this.selectedKeys();

        const newKeys = [...keys];

        newKeys.splice(newKeys.indexOf(uid), 1);

        this.selectedKeys(newKeys);
    };

    handleItemMove = (oldIdx, newIdx) => {
        this.selectedKeys(array_move(this.selectedKeys(), oldIdx, newIdx));
    };

    setDefaults(keys = []) {
        this.selectedKeys(keys);
        this.disabledKeys(keys);
    }
}
