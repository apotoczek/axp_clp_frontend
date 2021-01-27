import $ from 'jquery';
import ko from 'knockout';
import pager from 'pager';
import config from 'config';

import * as Utils from 'src/libs/Utils';

import TieredRadiolist from 'src/libs/components/basic/TieredRadiolist';
import PopoverChecklistCustomValue from 'src/libs/components/popovers/PopoverChecklistCustomValue';
import PopoverSort from 'src/libs/components/popovers/PopoverSort';
import Radiolist from 'src/libs/components/basic/Radiolist';
import EventButton from 'src/libs/components/basic/EventButton';
import PopoverInputRange from 'src/libs/components/popovers/PopoverInputRange';
import Checklist from 'src/libs/components/basic/Checklist';
import AttributeFilters from 'src/libs/components/AttributeFilters';
import BooleanButton from 'src/libs/components/basic/BooleanButton';
import NewPopoverBody from 'src/libs/components/popovers/NewPopoverBody';
import NewPopoverButton from 'src/libs/components/popovers/NewPopoverButton';
import Aside from 'src/libs/components/basic/Aside';
import HTMLContent from 'src/libs/components/basic/HTMLContent';
import MetaInfo from 'src/libs/components/MetaInfo';
import CpanelExtract from 'src/libs/components/basic/CpanelExtract';
import BreadcrumbHeader from 'src/libs/components/basic/BreadcrumbHeader';
import Breadcrumb from 'src/libs/components/basic/Breadcrumb';
import ModeToggle from 'src/libs/components/reports/visual_reports/ModeToggle';
import ActionHeader from 'src/libs/components/basic/ActionHeader';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import EventRegistry from 'src/libs/components/basic/EventRegistry';
import Hooks from 'src/libs/components/basic/Hooks';
import Observer from 'src/libs/Observer';
import DataThing from 'src/libs/DataThing';
import DataSource from 'src/libs/DataSource';

class Report extends BaseComponent {
    constructor(opts = {}, components = {}) {
        super(opts, components);

        this.freeze_and_download = opts.freeze_and_download || false;

        this.events = this.new_instance(EventRegistry, {});
        this.hooks = this.new_instance(Hooks, {});

        /*********************************************************
         *                    Templates                          *
         *********************************************************/

        // this.define_default_template(`
        //     <!-- ko if: active_instance -->
        //         <!-- ko renderComponent: active_instance --><!-- /ko -->
        //     <!-- /ko -->
        // `);

        this.define_default_template(`
            <div class="layout-hbox stretch" data-bind="
                visible: active_mode() === 'edit',
                renderComponent: editor
            "></div>
            <div class="layout-hbox stretch" data-bind="
                visible: active_mode() === 'view',
                renderComponent: viewer
            "></div>
            <div class="layout-hbox stretch" data-bind="
                visible: active_mode() === 'wizard',
                renderComponent: wizard
            "></div>
        `);

        /*********************************************************
         *                    Variables                          *
         *********************************************************/

        let _dfd = this.new_deferred();

        // this.active_instance = ko.observable();
        this.active_mode = ko.observable();

        this.report = ko.observable();

        this.initial_state = opts.initial_state;
        this.sub_type = opts.sub_type;

        this.base_url = opts.base_url || '#!/visual-reports';

        /*********************************************************
         *                     Base Queries                      *
         *********************************************************/

        this._prepare_report_pdf = DataThing.backends.download({
            url: 'prepare_report_pdf',
        });

        this._freeze_and_prepare_report_pdf = DataThing.backends.download({
            url: 'freeze_copy_and_prepare_report_pdf',
        });

        this._update_visual_report = DataThing.backends.useractionhandler({
            url: 'update_visual_report',
        });

        this._create_visual_report = DataThing.backends.useractionhandler({
            url: 'create_visual_report',
        });

        this._publish_visual_report = DataThing.backends.useractionhandler({
            url: 'publish_visual_report',
        });

        this.attribute_filter_configs = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                query: {
                    target: 'filter_configs',
                    public_taxonomy: true,
                },
            },
        });

        this.lists_query = this.new_instance(DataSource, {
            datasource: {
                type: 'dynamic',
                key: 'results',
                query: {
                    target: 'user:lists',
                    results_per_page: 'all',
                },
            },
        });

        /*********************************************************
         *                     Functions                         *
         *********************************************************/

        this.navigate = (mode, report) => {
            if (report) {
                this.active_mode(mode);
                pager.navigate(`${this.base_url}/${this.sub_type}/${mode}/${report.uid}`);
            }
        };

        this.broadcast_uid = report => {
            if (report) {
                let params = report.params || {};
                let entity_uid = report.entity_uid || params.entity_uid;
                let entity_type = params.entity_type || 'user_fund';
                entity_type = entity_type === 'bison_fund' ? 'user_fund' : entity_type;
                Observer.broadcast(this.events.get(`${entity_type}_uid`), entity_uid);
            }
        };

        this.gen_report_name = function(entity_name) {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1; //Indexed from 0
            let day = date.getDate();

            return `${entity_name} - ${year}/${month}/${day}`;
        };

        this.create_report = (entity, callback) => {
            let {entity_uid, entity_type, name} = entity;

            this._create_visual_report({
                data: {
                    name: this.gen_report_name(name),
                    report_type: 'visual_report',
                    sub_type: this.sub_type,
                    params: {entity_uid, entity_type},
                },
                success: DataThing.api.XHRSuccess(callback),
            });
        };

        this.publish_report = callback => {
            let report = this.report();
            let content_id = this.viewer.body.layout.body.html_id();
            let $content = $(`#${content_id}`);

            $.each($content.find('.layout-engine-wrapper'), function() {
                $(this).height($(this).height());
            });

            if (report) {
                this._publish_visual_report({
                    data: {
                        uid: report.uid,
                        html: $(`#${content_id}`).html(),
                        width: $(`#${content_id}`).width(),
                        height: $(`#${content_id}`).height(),
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        $content.find('.layout-engine-wrapper').each(function() {
                            $(this).height('auto');
                        });

                        report.is_frozen = true;
                        this.report(report);
                        callback(report);
                        DataThing.status_check();
                    }),
                });
            }
        };

        this.update_report = function(updates, callback) {
            let report = this.report();

            if (report) {
                updates.params = Object.assign({}, report.params, updates.params);
                this._update_visual_report({
                    data: {
                        uid: report.uid,
                        updates: updates,
                    },
                    success: DataThing.api.XHRSuccess(() => {
                        let updated_report = Object.assign(report, updates, {
                            modified: Utils.epoch() / 1000,
                        });

                        this.report(updated_report);

                        callback(updated_report);

                        DataThing.status_check();
                    }),
                });
            }
        };

        this.download_pdf = (html_id, callback = null) => {
            let report = this.report();
            let content_id = this.viewer.body.layout.body.html_id();
            let $content = $(`#${content_id}`);

            $.each($content.find('.layout-engine-wrapper'), function() {
                $(this).height($(this).height());
            });

            if (report) {
                if (this.freeze_and_download) {
                    this._freeze_and_prepare_report_pdf({
                        data: {
                            uid: report.uid,
                            html: $(`#${content_id}`).html(),
                            width: $(`#${content_id}`).width(),
                            height: $(`#${content_id}`).height(),
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            $content.find('.layout-engine-wrapper').each(function() {
                                $(this).height('auto');
                            });
                            DataThing.form_post(config.download_pdf_base + key);
                            report.is_frozen = true;
                            this.report(report);
                            DataThing.status_check();
                            if (typeof callback === 'function') {
                                callback();
                            }
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                } else {
                    this._prepare_report_pdf({
                        data: {
                            uid: report.uid,
                            html: $(`#${content_id}`).html(),
                            width: $(`#${content_id}`).width(),
                            height: $(`#${content_id}`).height(),
                        },
                        success: DataThing.api.XHRSuccess(key => {
                            DataThing.form_post(config.download_pdf_base + key);

                            if (typeof callback === 'function') {
                                callback();
                            }
                        }),
                        error: DataThing.api.XHRError(() => {}),
                    });
                }
            } else {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        };

        this._get_report = (uid, callback) => {
            let report = this.report();

            if (report && report.uid == uid) {
                return callback(report, false);
            }
            DataThing.get({
                params: {
                    target: 'visual_report',
                    uid: uid,
                },
                success: report => {
                    callback(report, true);
                },
                error: () => {},
            });
        };

        this.reset_state = () => {
            this.set_state({});
        };

        this.set_state = ({state, uid}) => {
            if (state === 'wizard') {
                this.report(undefined);
                this.active_mode('wizard');
            } else if (uid && Utils.valid_uid(uid)) {
                this._get_report(uid, (report, changed) => {
                    if (changed) {
                        this.report(report);
                    }

                    let active_mode = this.active_mode();

                    if (report.is_frozen || state === 'view') {
                        if (!active_mode || active_mode !== 'view') {
                            this.active_mode('view');
                        }

                        this.viewer.restore_data(report);
                    } else {
                        this.editor.toggle_loading();

                        if (!active_mode || active_mode !== 'edit') {
                            this.active_mode('edit');
                        }

                        this.editor.restore_data(report);
                    }
                });
            } else {
                this.report(undefined);
                this.active_mode(undefined);
            }

            this.hooks.run('after_set_state', {
                args: {state, uid},
                delay: 1000,
            });
        };

        /*********************************************************
         *                     Helpers                           *
         *********************************************************/

        this.helpers = {
            init: {},
            misc: {
                year_options: (...years) => {
                    return years.map(y => {
                        if (y === null) {
                            return {value: null, label: 'Since Inception'};
                        }

                        let suffix = y > 1 ? 'years' : 'year';

                        return {value: y, label: `${y} ${suffix}`};
                    });
                },
            },
            body: {
                viewer_toolbar: ({
                    edit_event,
                    report,
                    id = 'toolbar',
                    disable_export_until_frozen = false,
                    register_export_alias = 'register_export',
                }) => {
                    let is_editable = ko.pureComputed(() => {
                        let _report = report();

                        if (_report) {
                            return !_report.is_frozen;
                        }

                        return false;
                    });

                    return {
                        component: ActionHeader,
                        id: id,
                        template: 'tpl_action_toolbar',
                        export_id_callback: this.events.register_alias(register_export_alias),
                        disable_export: disable_export_until_frozen ? is_editable : undefined,
                        buttons: [
                            {
                                component: ModeToggle,
                                last_button: true,
                                id: 'mode_toggle',
                                on_click: function() {
                                    Observer.broadcast(edit_event);
                                },
                                visible: is_editable,
                                css: {
                                    editMode: false,
                                    previewMode: true,
                                },
                            },
                        ],
                    };
                },
                editor_toolbar: ({
                    preview_event,
                    id = 'toolbar',
                    save_draft_alias = 'save_draft',
                    disable_event = null,
                    start_disabled = false,
                }) => {
                    return {
                        component: ActionHeader,
                        id: id,
                        template: 'tpl_action_toolbar',
                        disable_export: true,
                        buttons: [
                            {
                                component: ModeToggle,
                                id: 'mode_toggle',
                                on_click: function() {
                                    Observer.broadcast(preview_event);
                                },
                                disable_event: disable_event,
                                start_disabled: start_disabled,
                                css: {
                                    editMode: true,
                                    previewMode: false,
                                },
                            },
                            {
                                id: 'update',
                                label:
                                    'Save as draft <span class="glyphicon glyphicon-edit"></span>',
                                action: 'save_draft',
                                id_callback: this.events.register_alias(save_draft_alias),
                            },
                        ],
                    };
                },
                breadcrumb_header: ({
                    report,
                    user_fund_uid_event,
                    market_data_fund_uid_event,
                    market_data_family_uid_event,
                    id = 'header',
                    css = {},
                }) => {
                    let breadcrumb = {
                        id: 'breadcrumb',
                        component: Breadcrumb,
                        items: [
                            {
                                label: 'Reports',
                                link: '#!/reports',
                            },
                            {
                                label: 'Visual Reports',
                            },
                            {
                                label_key: 'name',
                                data: report,
                            },
                        ],
                    };

                    return {
                        component: BreadcrumbHeader,
                        id: id,
                        template: 'tpl_breadcrumb_header',
                        layout: {
                            breadcrumb: 'breadcrumb',
                        },
                        css: css,
                        components: [breadcrumb],
                        datasource: {
                            type: 'dynamic',
                            one_required: [
                                'user_fund_uid',
                                'market_data_fund_uid',
                                'market_data_family_uid',
                            ],
                            query: {
                                target: 'vehicle:meta_data',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                market_data_fund_uid: {
                                    type: 'observer',
                                    event_type: market_data_fund_uid_event,
                                },
                                market_data_family_uid: {
                                    type: 'observer',
                                    event_type: market_data_family_uid_event,
                                },
                            },
                        },
                    };
                },
            },
            cpanel: {
                wrapper: ({id, components = []}) => {
                    return {
                        id: id,
                        component: CpanelExtract,
                        template: 'tpl_analytics_cpanel',
                        extract_keys: this._get_cpanel_extract_keys(components),
                        layout: {
                            body: components.map(component => component.id),
                        },
                        components: components,
                    };
                },
                meta_info: ({id, label, datasource, format = 'number'}) => {
                    return {
                        id: id,
                        component: MetaInfo,
                        template: 'tpl_meta_info',
                        label: label,
                        format: format,
                        datasource: datasource,
                    };
                },
                label: ({id, label}) => {
                    return {
                        component: HTMLContent,
                        id: id,
                        html: `<h5>${label}</h5>`,
                    };
                },
                settings_aside: ({id, components}) => {
                    return {
                        id: id,
                        component: Aside,
                        template: 'tpl_aside_body',
                        layout: {
                            body: components.map(component => component.id),
                        },
                        components: components,
                    };
                },
                settings_popover: ({id, label, components}) => {
                    return {
                        component: NewPopoverButton,
                        id: id,
                        id_callback: this.events.register_alias(id),
                        icon_css: 'glyphicon glyphicon-plus',
                        label: label,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: label,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            id: 'settings',
                            component: NewPopoverBody,
                            template: 'tpl_popover_new_body',
                            style: {
                                width: '250px',
                            },
                            layout: {
                                body: components.map(component => component.id),
                            },
                            components: components,
                        },
                    };
                },
                boolean_button: ({id, label, default_state = true, alias = id}) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: BooleanButton,
                        template: 'tpl_cpanel_boolean_button',
                        default_state: default_state,
                        label: label,
                    };
                },
                peer_filters: ({
                    id,
                    label,
                    prefix = id,
                    user_fund_uid_event = null,
                    portfolio_uid_event = null,
                    market_data_fund_uid_event = null,
                    market_data_family_uid_event = null,
                    include_lists = true,
                    return_aside = false,
                    restrict_default_filters = null,
                }) => {
                    let clear_btn_alias = this.events.new_alias();
                    let clear_event = this.events.resolve_event(clear_btn_alias, 'EventButton');

                    let select_vintage_year = restrict_default_filters
                        ? restrict_default_filters.includes('vintage_year')
                        : true;

                    let components = [
                        {
                            id: 'enums',
                            component: AttributeFilters,
                            wait_for_filters: true,
                            clear_event: clear_event,
                            id_callback: this.events.register_alias(`${prefix}:enums`),
                            data: this.attribute_filter_configs.data,
                            selected_datasource:
                                user_fund_uid_event ||
                                portfolio_uid_event ||
                                market_data_fund_uid_event ||
                                market_data_family_uid_event
                                    ? {
                                          type: 'dynamic',
                                          mapping: restrict_default_filters ? 'filter' : undefined,
                                          mapping_args: restrict_default_filters
                                              ? {
                                                    filter_fn: enum_obj => {
                                                        return restrict_default_filters.includes(
                                                            enum_obj.uid,
                                                        );
                                                    },
                                                }
                                              : undefined,

                                          query: {
                                              // Attributes for market currently not supported as of Nov 20 2019, will be revisited
                                              target: 'entity:attribute_values',
                                              public_taxonomy: true,
                                              only_root_members: true,
                                              entity_uid: {
                                                  type: 'observer',
                                                  event_type:
                                                      user_fund_uid_event || portfolio_uid_event, //|| market_data_fund_uid_event || market_data_family_uid_event,
                                                  required: true,
                                              },
                                              entity_type: 'user_fund',
                                          },
                                      }
                                    : undefined,
                        },
                        {
                            id: 'vintage_year',
                            id_callback: this.events.register_alias(`${prefix}:vintage_year`),
                            component: NewPopoverButton,
                            label: 'Vintage Year',
                            clear_event: clear_event,
                            icon_css: 'glyphicon glyphicon-plus',
                            css: {
                                'btn-block': true,
                                'btn-cpanel-primary': true,
                                'btn-sm': true,
                            },
                            popover_options: {
                                title: 'Vintage Year',
                                placement: 'right',
                                css_class: 'popover-cpanel',
                            },
                            popover_config: {
                                component: Checklist,
                                datasource: {
                                    type: 'dynamic',
                                    mapping: 'list_to_string_options',
                                    mapping_default: [],
                                    query: {
                                        target: 'market_data:vintage_years',
                                    },
                                },
                                selected_datasource:
                                    select_vintage_year &&
                                    (user_fund_uid_event ||
                                        portfolio_uid_event ||
                                        market_data_fund_uid_event ||
                                        market_data_family_uid_event)
                                        ? {
                                              key: 'vintage_year',
                                              type: 'dynamic',
                                              mapping: String,
                                              one_required: [
                                                  'user_fund_uid',
                                                  'portfolio_uid',
                                                  'market_data_fund_uid',
                                                  'market_data_family_uid',
                                              ],
                                              query: {
                                                  target: 'vehicle:meta_data',
                                                  user_fund_uid: {
                                                      type: 'observer',
                                                      event_type: user_fund_uid_event,
                                                  },
                                                  portfolio_uid: {
                                                      type: 'observer',
                                                      event_type: portfolio_uid_event,
                                                  },
                                                  market_data_fund_uid: {
                                                      type: 'observer',
                                                      event_type: market_data_fund_uid_event,
                                                  },
                                                  market_data_family_uid: {
                                                      type: 'observer',
                                                      event_type: market_data_family_uid_event,
                                                  },
                                              },
                                          }
                                        : undefined,
                            },
                        },
                        {
                            id: 'fund_size',
                            id_callback: this.events.register_alias(`${prefix}:fund_size`),
                            component: NewPopoverButton,
                            label: 'Fund Size',
                            clear_event: clear_event,
                            css: {
                                'btn-sm': true,
                                'btn-block': true,
                                'btn-cpanel-primary': true,
                            },
                            icon_css: 'glyphicon glyphicon-plus',
                            popover_options: {
                                title: 'Fund Size',
                                placement: 'right',
                                css_class: 'popover-cpanel',
                            },
                            popover_config: {
                                component: PopoverInputRange,
                                placement: 'right',
                                title: 'Range',
                                mode: 'amount',
                                min: {
                                    placeholder: 'Min (USD MM)',
                                    in_cpanel: true,
                                },
                                max: {
                                    placeholder: 'Max (USD MM)',
                                    in_cpanel: true,
                                },
                            },
                        },
                        {
                            id: 'clear_button',
                            id_callback: this.events.register_alias(clear_btn_alias),
                            component: EventButton,
                            template: 'tpl_cpanel_button',
                            css: {'btn-sm': true, 'btn-default': true},
                            label: 'Clear Filters',
                        },
                    ];

                    if (include_lists) {
                        components.unshift({
                            id: 'lists',
                            id_callback: this.events.register_alias(`${prefix}:lists`),
                            component: NewPopoverButton,
                            label: 'Lists',
                            icon_css: 'glyphicon glyphicon-plus',
                            clear_event: clear_event,
                            css: {
                                'btn-block': true,
                                'btn-cpanel-primary': true,
                                'btn-sm': true,
                            },
                            popover_options: {
                                title: 'Filter by Lists',
                                placement: 'right',
                                css_class: 'popover-cpanel',
                            },
                            popover_config: {
                                component: Checklist,
                                enable_filter: true,
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
                    }

                    if (return_aside) {
                        return this.helpers.cpanel.settings_aside({
                            id: id,
                            components: components,
                        });
                    }

                    return this.helpers.cpanel.settings_popover({
                        id: id,
                        label: label,
                        components: components,
                    });
                },
                benchmark_provider: ({
                    id,
                    label = 'Provider',
                    hidden_callback = null,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        label_track_selection: true,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        visible_callback: popover => {
                            if (typeof hidden_callback === 'function' && hidden_callback(popover)) {
                                return false;
                            }

                            let options = popover.data();

                            if (options && options.length > 1) {
                                return true;
                            }

                            return false;
                        },
                        popover_config: {
                            component: Radiolist,
                            datasource: {
                                type: 'dynamic',
                                mapping: 'list_to_options',
                                query: {
                                    target: 'benchmark:providers',
                                },
                            },
                        },
                    };
                },
                benchmark: ({
                    id,
                    label = 'Benchmark',
                    hidden_callback = null,
                    provider_event = null,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        label_track_selection: true,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        visible_callback: popover => {
                            if (typeof hidden_callback === 'function') {
                                return !hidden_callback(popover);
                            }

                            return true;
                        },
                        popover_config: {
                            component: Radiolist,
                            datasource: {
                                type: 'dynamic',
                                query: {
                                    provider: provider_event
                                        ? {
                                              type: 'observer',
                                              mapping: 'get_value',
                                              event_type: provider_event,
                                              required: true,
                                          }
                                        : undefined,
                                    target: 'benchmarks',
                                },
                            },
                        },
                    };
                },
                order_by: ({id, label, datasource, alias = id}) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        popover_options: {
                            placement: 'right',
                            css_class: 'popover-cpanel',
                            title: label,
                        },
                        label: label,
                        hide_icon: true,
                        label_track_selection: true,
                        ellipsis: true,
                        popover_config: {
                            component: PopoverSort,
                            template: 'tpl_popover_sort',
                            single_selection: true,
                            datasource: datasource,
                        },
                    };
                },
                start_date: ({
                    id,
                    user_fund_uid_event,
                    portfolio_uid_event,
                    market_data_fund_uid_event,
                    market_data_family_uid_event,
                    as_of_date_event,
                    clear_event,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        popover_options: {
                            placement: 'right',
                            css_class: 'popover-cpanel',
                            title: 'Select Horizon',
                        },
                        clear_event: clear_event,
                        label: 'Horizon',
                        label_track_selection: true,
                        hide_icon: true,
                        popover_config: {
                            component: PopoverChecklistCustomValue,
                            custom_value_placeholder: 'Custom Date',
                            custom_value_mapping: 'date_to_epoch',
                            single_selection: true,
                            disable_untoggle: true,
                            empty_text: 'Insufficient cash flows',
                            selected_idx: 0,
                            datasource: {
                                mapping: 'to_options',
                                mapping_default: [],
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'markter_data_family_uid',
                                ],
                                query: {
                                    target: 'vehicle:start_date_options',
                                    as_of_date: {
                                        type: 'observer',
                                        event_type: as_of_date_event,
                                        required: true,
                                        mapping: 'get_value',
                                    },
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: user_fund_uid_event,
                                    },
                                    portfolio_uid: {
                                        type: 'observer',
                                        event_type: portfolio_uid_event,
                                    },
                                    market_data_fund_uid: {
                                        type: 'observer',
                                        event_type: market_data_fund_uid_event,
                                    },
                                    market_data_family_uid: {
                                        type: 'observer',
                                        event_type: market_data_family_uid_event,
                                    },
                                    inception_last: false,
                                },
                            },
                        },
                    };
                },
                as_of_date: ({
                    id,
                    user_fund_uid_event,
                    portfolio_uid_event,
                    market_data_fund_uid_event,
                    market_data_family_uid_event,
                    clear_event,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        icon_css: 'glyphicon glyphicon-plus',
                        popover_options: {
                            placement: 'right',
                            css_class: 'popover-cpanel',
                            title: 'Select As of Date',
                        },
                        clear_event: clear_event,
                        label: 'As of',
                        label_track_selection: true,
                        hide_icon: true,
                        popover_config: {
                            component: PopoverChecklistCustomValue,
                            custom_value_placeholder: 'Custom Date',
                            custom_value_mapping: 'date_to_epoch',
                            single_selection: true,
                            disable_untoggle: true,
                            selected_idx: 0,
                            empty_text: 'Insufficient cash flows',
                            datasource: {
                                mapping: 'backend_dates_to_options',
                                mapping_default: [],
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                query: {
                                    target: 'vehicle:as_of_dates',
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: user_fund_uid_event,
                                    },
                                    portfolio_uid: {
                                        type: 'observer',
                                        event_type: portfolio_uid_event,
                                    },
                                    market_data_fund_uid: {
                                        type: 'observer',
                                        event_type: market_data_fund_uid_event,
                                    },
                                    market_data_family_uid: {
                                        type: 'observer',
                                        event_type: market_data_family_uid_event,
                                    },
                                },
                            },
                        },
                    };
                },
                index_radiolist: ({
                    id,
                    user_fund_uid_event,
                    market_data_fund_uid_event,
                    market_data_family_uid_event,
                    clear_event,
                    label = 'Index',
                    track_selection = true,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        clear_event: clear_event,
                        label_track_selection: track_selection,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                            listen_to: ['checklists'],
                        },
                        popover_config: {
                            component: TieredRadiolist,
                            parent_key: 'parent',
                            value_key: 'value',
                            label_key: 'label',
                            sub_label_key: 'sub_label',
                            option_disabled_key: 'invalid',
                            enable_filter: true,
                            max_tier: 2,
                            min_height: '350px',
                            filter_value_keys: ['sub_label', 'label'],
                            datasource: {
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                query: {
                                    target: 'vehicle:index_options',
                                    tree_mode: true,
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: user_fund_uid_event,
                                    },
                                    market_data_fund_uid: {
                                        type: 'observer',
                                        event_type: market_data_fund_uid_event,
                                    },
                                    market_data_family_uid: {
                                        type: 'observer',
                                        event_type: market_data_family_uid_event,
                                    },
                                },
                            },
                            selected_datasource: {
                                key: 'market_id',
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                query: {
                                    target: 'vehicle:meta_data',
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: user_fund_uid_event,
                                    },
                                    market_data_fund_uid: {
                                        type: 'observer',
                                        event_type: market_data_fund_uid_event,
                                    },
                                    market_data_family_uid: {
                                        type: 'observer',
                                        event_type: market_data_family_uid_event,
                                    },
                                },
                            },
                        },
                    };
                },
                index_checklist: ({
                    id,
                    user_fund_uid_event,
                    portfolio_uid_event,
                    market_data_fund_uid_event,
                    market_data_family_uid_event,
                    max_date_event,
                    min_date_event,
                    label = 'Indexes',
                    track_selection = true,
                    alias = id,
                    default_market_id = undefined,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        label_track_selection: track_selection,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            component: Checklist,
                            value_key: 'value',
                            label_key: 'label',
                            sub_label_key: 'sub_label',
                            option_disabled_key: 'invalid',
                            enable_filter: true,
                            filter_value_keys: ['parent', 'sub_label', 'label'],
                            datasource: {
                                type: 'dynamic',
                                one_required: [
                                    'user_fund_uid',
                                    'portfolio_uid',
                                    'market_data_fund_uid',
                                    'market_data_family_uid',
                                ],
                                query: {
                                    target: 'vehicle:index_options',
                                    user_fund_uid: {
                                        type: 'observer',
                                        event_type: user_fund_uid_event,
                                    },
                                    portfolio_uid: {
                                        type: 'observer',
                                        event_type: portfolio_uid_event,
                                    },
                                    market_data_fund_uid: {
                                        type: 'observer',
                                        event_type: market_data_fund_uid_event,
                                    },
                                    market_data_family_uid: {
                                        type: 'observer',
                                        event_type: market_data_family_uid_event,
                                    },
                                    max_date: max_date_event
                                        ? {
                                              type: 'observer',
                                              event_type: max_date_event,
                                          }
                                        : undefined,
                                    min_date: min_date_event
                                        ? {
                                              type: 'observer',
                                              event_type: min_date_event,
                                          }
                                        : undefined,
                                },
                            },
                            selected_datasource_default_only: true,
                            selected_datasource:
                                user_fund_uid_event ||
                                portfolio_uid_event ||
                                market_data_fund_uid_event ||
                                market_data_family_uid_event
                                    ? {
                                          key: 'market_id',
                                          type: 'dynamic',
                                          mapping_default: default_market_id,
                                          one_required: [
                                              'user_fund_uid',
                                              'portfolio_uid',
                                              'market_data_fund_uid',
                                              'market_data_family_uid',
                                          ],
                                          query: {
                                              target: 'vehicle:meta_data',
                                              user_fund_uid: {
                                                  type: 'observer',
                                                  event_type: user_fund_uid_event,
                                              },
                                              portfolio_uid: {
                                                  type: 'observer',
                                                  event_type: portfolio_uid_event,
                                              },
                                              market_data_fund_uid: {
                                                  type: 'observer',
                                                  event_type: market_data_fund_uid_event,
                                              },
                                              market_data_family_uid: {
                                                  type: 'observer',
                                                  event_type: market_data_family_uid_event,
                                              },
                                          },
                                      }
                                    : undefined,
                        },
                    };
                },
                checklist: ({
                    id,
                    label,
                    datasource,
                    clear_event,
                    visible_callback,
                    strings,
                    selected_datasource = false,
                    single_selection = false,
                    track_selection = true,
                    alias = id,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        clear_event: clear_event,
                        visible_callback: visible_callback,
                        label_track_selection: track_selection,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            component: Checklist,
                            strings: strings,
                            datasource: datasource,
                            single_selection: single_selection,
                            selected_datasource: selected_datasource,
                        },
                    };
                },
                radiolist: ({
                    id,
                    label,
                    datasource,
                    selected_datasource = false,
                    track_selection = true,
                    alias = id,
                    default_selected_value = undefined,
                }) => {
                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        label: label,
                        component: NewPopoverButton,
                        label_track_selection: track_selection,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: {
                            component: Radiolist,
                            datasource: datasource,
                            default_selected_value: default_selected_value,
                            selected_datasource: selected_datasource,
                        },
                    };
                },
                currency_radiolist: ({
                    id,
                    user_fund_uid_event = null,
                    portfolio_uid_event = null,
                    market_data_fund_uid_event = null,
                    market_data_family_uid_event = null,
                    label = 'Currency',
                    track_selection = true,
                    extra_options = [],
                    visible_callback = null,
                    alias = id,
                }) => {
                    let popover_config = {
                        component: Radiolist,
                        option_disabled_key: 'invalid',
                        datasource: {
                            mapping: 'to_options',
                            mapping_args: {
                                value_key: 'id',
                                label_keys: ['symbol', 'name'],
                                additional_keys: ['symbol', 'invalid'],
                                extra_options: extra_options,
                            },
                            type: 'dynamic',
                            query: {
                                target: 'currency:markets',
                            },
                        },
                    };

                    if (
                        user_fund_uid_event ||
                        portfolio_uid_event ||
                        market_data_fund_uid_event ||
                        market_data_family_uid_event
                    ) {
                        popover_config.selected_datasource = {
                            key: 'base_currency',
                            type: 'dynamic',
                            one_required: [
                                'user_fund_uid',
                                'portfolio_uid',
                                'market_data_fund_uid',
                                'market_data_family_uid',
                            ],
                            query: {
                                target: 'vehicle:currency_id',
                                user_fund_uid: {
                                    type: 'observer',
                                    event_type: user_fund_uid_event,
                                },
                                portfolio_uid_event: {
                                    type: 'observer',
                                    event_type: portfolio_uid_event,
                                },
                                market_data_fund_uid_event: {
                                    type: 'observer',
                                    event_type: market_data_fund_uid_event,
                                },
                                market_data_family_uid_event: {
                                    type: 'observer',
                                    event_type: market_data_family_uid_event,
                                },
                            },
                        };
                        popover_config.datasource.one_required = [
                            'user_fund_uid',
                            'portfolio_uid',
                            'market_data_fund_uid',
                            'market_data_family_uid',
                        ];
                        popover_config.datasource.query.user_fund_uid = {
                            type: 'observer',
                            event_type: user_fund_uid_event,
                        };
                        popover_config.datasource.query.portfolio_uid = {
                            type: 'observer',
                            event_type: portfolio_uid_event,
                        };
                        popover_config.datasource.query.market_data_fund_uid = {
                            type: 'observer',
                            event_type: market_data_fund_uid_event,
                        };
                        popover_config.datasource.query.market_data_family_uid = {
                            type: 'observer',
                            event_type: market_data_family_uid_event,
                        };
                    }

                    return {
                        id: id,
                        id_callback: this.events.register_alias(alias),
                        component: NewPopoverButton,
                        label: label,
                        label_track_selection: track_selection,
                        css: {
                            'btn-block': true,
                            'btn-cpanel-primary': true,
                            'btn-sm': true,
                        },
                        popover_options: {
                            title: `Select ${label}`,
                            placement: 'right',
                            css_class: 'popover-cpanel',
                        },
                        popover_config: popover_config,
                        visible_callback: visible_callback || undefined,
                    };
                },
                j_curve_filters: ({
                    id,
                    label,
                    prefix = id,
                    extra_components = [],
                    default_selected_value = undefined,
                    time_zero_default_enabled = true,
                }) => {
                    return this.helpers.cpanel.settings_popover({
                        id: id,
                        label: label,
                        components: [
                            this.helpers.cpanel.radiolist({
                                id: 'horizon_years',
                                label: 'Horizon',
                                datasource: this.helpers.misc.year_options(1, 3, 5, 10, null),
                                default_selected_value: default_selected_value || 1,
                                alias: `${prefix}:horizon_years`,
                            }),
                            this.helpers.cpanel.radiolist({
                                id: 'range_method',
                                label: 'Method',
                                datasource: [
                                    {label: 'Quartiles', value: 'quartiles'},
                                    {label: 'Extremities', value: 'extremities'},
                                ],
                                alias: `${prefix}:range_method`,
                            }),
                            this.helpers.cpanel.boolean_button({
                                id: 'time_zero',
                                label: 'Time Zero',
                                default_state: time_zero_default_enabled,
                                alias: `${prefix}:time_zero`,
                            }),
                        ].concat(extra_components),
                    });
                },
            },
            datasource: {
                peer_filters: ({prefix, extra_filters = {}, exclude_fund_uid_event = null}) => {
                    let query = {
                        enums: {
                            type: 'observer',
                            event_type: this.events.resolve_event(
                                `${prefix}:enums`,
                                'AttributeFilters.state',
                            ),
                        },
                        vintage_year: {
                            type: 'observer',
                            event_type: this.events.resolve_event(
                                `${prefix}:vintage_year`,
                                'PopoverButton.value',
                            ),
                        },
                        fund_size: {
                            type: 'observer',
                            event_type: this.events.resolve_event(
                                `${prefix}:fund_size`,
                                'PopoverButton.value',
                            ),
                        },
                        lists: {
                            type: 'observer',
                            event_type: this.events.resolve_event(
                                `${prefix}:lists`,
                                'PopoverButton.value',
                            ),
                        },
                    };

                    if (exclude_fund_uid_event) {
                        query.exclude_fund_uid = {
                            type: 'observer',
                            event_type: exclude_fund_uid_event,
                        };
                    }

                    for (let [key, config] of Object.entries(extra_filters)) {
                        query[key] = config;
                    }

                    return {
                        type: 'dynamic',
                        query: query,
                    };
                },
            },
        };

        _dfd.resolve();
    }
}

export default Report;
