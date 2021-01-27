// Available components
import {BarChartFromProvider} from 'components/charts/BarChart';
import {BasicTableFromProvider} from 'containers/BasicTableFromProvider';
import {Circle, Triangle, Rect} from 'components/basic/Shapes';
import {PieChartFromProvider} from 'components/charts/PieChart';
import {ScatterChartFromProvider} from 'components/charts/ScatterChart';
import {TimeseriesChartFromProvider} from 'components/charts/TimeseriesChart';
import {WaterfallChartFromProvider} from 'components/charts/WaterfallChart';
import Callout from 'components/basic/Callout';
import HandsontableComponent from 'components/basic/Handsontable';
import ImagePicker from 'components/ImagePicker';
import TextBlock from 'components/dashboards/TextBlock';

// Settings components
import BarChartSettings from 'components/dashboards/component-settings/BarChartSettings';
import CalloutSettings from 'components/dashboards/component-settings/CalloutSettings';
import HandsontableSettings from 'components/dashboards/component-settings/HandsontableSettings';
import HandsontableToolbar from 'components/dashboards/component-settings/HandsontableToolbar';
import PieChartSettings from 'components/dashboards/component-settings/PieChartSettings';
import ScatterChartSettings from 'components/dashboards/component-settings/ScatterChartSettings';
import ShapeSettings from 'components/dashboards/component-settings/ShapeSettings';
import TableSettings from 'components/dashboards/component-settings/TableSettings';
import TextBlockSettings from 'components/dashboards/TextBlock/Settings';
import TextBlockToolbar from 'components/dashboards/TextBlock/Toolbar';
import TimeseriesChartSettings from 'components/dashboards/component-settings/TimeseriesChartSettings';
import WaterfallChartSettings from 'components/dashboards/component-settings/WaterfallChartSettings';

// Data Providers
import BarChartProvider, {BarChartSettingsProvider} from 'providers/bar-chart-provider';
import CalloutProvider, {CalloutSettingsProvider} from 'providers/callout-provider';
import HandsontableProvider, {HandsontableSettingsProvider} from 'providers/handsontable-provider';
import ImageProvider from 'providers/image-provider';
import PieChartProvider, {PieChartSettingsProvider} from 'providers/pie-chart-provider';
import ReportingComponentProvider from 'components/dashboards/ReportingComponent/provider';
import ReportingComponentSettingsProvider from 'components/dashboards/ReportingComponent/settings-provider';
import ScatterChartProvider, {ScatterChartSettingsProvider} from 'providers/scatter-chart-provider';
import ShapeProvider, {ShapeSettingsProvider} from 'providers/shape-provider';
import TableProvider, {TableSettingsProvider} from 'providers/table-provider';
import TextBlockProvider, {TextBlockSettingsProvider} from 'providers/textblock-provider';
import TimeseriesProvider, {
    TimeseriesChartSettingsProvider,
} from 'providers/timeseries-chart-provider';
import WaterfallChartProvider, {WaterfallSettingsProvider} from 'providers/waterfallchart-provider';

// Component settings / data handlers
import BarChartSpecHandler from 'component-spec-handlers/bar-chart-spec-handler';
import CalloutSpecHandler from 'component-spec-handlers/callout-spec-handler';
import HandsonTableSpecHandler from 'component-spec-handlers/handsontable-spec-handler';
import ImageSpecHandler from 'component-spec-handlers/image-spec-handler';
import PieChartSpecHandler from 'component-spec-handlers/pie-chart-spec-handler';
import ReportingComponentSpecHandler from 'components/dashboards/ReportingComponent/spec-handler';
import ScatterChartSpecHandler from 'component-spec-handlers/scatter-chart-spec-handler';
import ShapeSpecHandler from 'component-spec-handlers/shape-spec-handler';
import TableSpecHandler from 'component-spec-handlers/table-spec-handler';
import TextBlockSpecHandler from 'component-spec-handlers/text-block-spec-handler';
import TimeseriesChartSpecHandler from 'component-spec-handlers/timeseries-chart-spec-handler';
import WaterfallChartSpecHandler from 'component-spec-handlers/waterfall-chart-spec-handler';

import ReportingComponentSettings from 'components/dashboards/ReportingComponent/Settings';
import ReportingComponentNewForm from 'components/dashboards/ReportingComponent/NewForm';

import theme from 'theme';

/**
 * Defines a mapping for all components that are available to use in
 * a dashboard.
 */
export default {
    table: {
        type: BasicTableFromProvider,
        label: 'Table',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 18,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 30,
        },
        provider: TableProvider,
        specHandler: TableSpecHandler,
        settingsComponent: TableSettings,
        settingsProvider: TableSettingsProvider,
        category: 'Tables',
        enableComponentPaddingSetting: true,
        icon: require('src/img/table-icon.png'),
    },
    cobaltSpreadsheet: {
        type: HandsontableComponent,
        hidePreview: true,
        enableToolbar: true,
        label: 'Spreadsheet',
        disableDoubleClick: true,
        requireData: false,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 18,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 48,
        },
        category: 'Tables',
        provider: HandsontableProvider,
        specHandler: HandsonTableSpecHandler,
        settingsComponent: HandsontableSettings,
        settingsProvider: HandsontableSettingsProvider,
        toolbarComponent: HandsontableToolbar,
        icon: require('src/img/cobaltSpreadsheet-icon.png'),
        requiredFeatures: ['spreadsheet_component'],
    },
    timeseriesChart: {
        type: TimeseriesChartFromProvider,
        label: 'Timeseries Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 24,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: TimeseriesProvider,
        specHandler: TimeseriesChartSpecHandler,
        settingsComponent: TimeseriesChartSettings,
        settingsProvider: TimeseriesChartSettingsProvider,
        enableComponentPaddingSetting: true,
        category: 'Charts',
        icon: require('src/img/timeseriesChart-icon.png'),
    },
    barChart: {
        type: BarChartFromProvider,
        label: 'Bar Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 24,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: BarChartProvider,
        specHandler: BarChartSpecHandler,
        settingsComponent: BarChartSettings,
        settingsProvider: BarChartSettingsProvider,
        category: 'Charts',
        icon: require('src/img/barChart-icon.png'),
    },
    scatterChart: {
        type: ScatterChartFromProvider,
        label: 'Scatter Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 24,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: ScatterChartProvider,
        specHandler: ScatterChartSpecHandler,
        settingsComponent: ScatterChartSettings,
        settingsProvider: ScatterChartSettingsProvider,
        category: 'Charts',
        icon: require('src/img/scatter_chart.png'),
    },
    bubbleChart: {
        type: ScatterChartFromProvider,
        label: 'Bubble Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 24,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: ScatterChartProvider,
        specHandler: ScatterChartSpecHandler,
        settingsComponent: ScatterChartSettings,
        settingsProvider: ScatterChartSettingsProvider,
        category: 'Charts',
        icon: require('src/img/bubble_chart.png'),
    },
    pieChart: {
        type: PieChartFromProvider,
        label: 'Pie Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 18,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: PieChartProvider,
        specHandler: PieChartSpecHandler,
        settingsComponent: PieChartSettings,
        settingsProvider: PieChartSettingsProvider,
        category: 'Charts',
        icon: require('src/img/pieChart-icon.png'),
    },
    waterfallChart: {
        type: WaterfallChartFromProvider,
        label: 'Waterfall Chart',
        requireData: true,
        constraints: {
            width: {
                min: 21,
                max: undefined,
            },
            height: {
                min: 18,
                max: undefined,
            },
        },
        defaults: {
            width: 56,
            height: 36,
        },
        provider: WaterfallChartProvider,
        specHandler: WaterfallChartSpecHandler,
        settingsComponent: WaterfallChartSettings,
        settingsProvider: WaterfallSettingsProvider,
        category: 'Charts',
        icon: require('src/img/waterfallChart-icon.png'),
    },
    callout: {
        type: Callout,
        label: 'Callout',
        requireData: true,
        constraints: {
            width: {
                min: 14,
                max: undefined,
            },
            height: {
                min: 18,
                max: undefined,
            },
        },
        defaults: {
            width: 35,
            height: 24,
            settings: {
                labelColor: theme.calloutLabelFg,
                valueColor: theme.calloutValueFg,
                labelSize: 14,
                valueSize: 36,
            },
        },
        provider: CalloutProvider,
        specHandler: CalloutSpecHandler,
        settingsComponent: CalloutSettings,
        settingsProvider: CalloutSettingsProvider,
        category: 'Text',
        icon: require('src/img/callout-icon.png'),
    },
    textBlock: {
        type: TextBlock,
        label: 'Text',
        hidePreview: false,
        requireData: false,
        disableDoubleClick: true,
        constraints: {
            width: {
                min: 14,
                max: undefined,
            },
            height: {
                min: 12,
                max: undefined,
            },
        },
        defaults: {
            width: 35,
            height: 24,
        },
        provider: TextBlockProvider,
        specHandler: TextBlockSpecHandler,
        settingsProvider: TextBlockSettingsProvider,
        settingsComponent: TextBlockSettings,
        toolbarComponent: TextBlockToolbar,
        enableToolbar: true,
        enableComponentPaddingSetting: true,
        category: 'Text',
        icon: require('src/img/textBlock-icon.png'),
    },
    rect: {
        type: Rect,
        label: 'Rectangle',
        requireData: false,
        defaults: {
            width: 35,
            height: 30,
        },
        provider: ShapeProvider,
        specHandler: ShapeSpecHandler,
        settingsComponent: ShapeSettings,
        settingsProvider: ShapeSettingsProvider,
        category: 'Misc',
        icon: require('src/img/rect-icon.png'),
    },
    circle: {
        type: Circle,
        label: 'Circle',
        requireData: false,
        defaults: {
            width: 35,
            height: 30,
        },
        provider: ShapeProvider,
        specHandler: ShapeSpecHandler,
        settingsComponent: ShapeSettings,
        settingsProvider: ShapeSettingsProvider,
        category: 'Misc',
        icon: require('src/img/circle-icon.png'),
    },
    triangle: {
        type: Triangle,
        label: 'Triangle',
        requireData: false,
        defaults: {
            width: 35,
            height: 30,
        },
        provider: ShapeProvider,
        specHandler: ShapeSpecHandler,
        settingsComponent: ShapeSettings,
        settingsProvider: ShapeSettingsProvider,
        category: 'Misc',
        icon: require('src/img/triangle-icon.png'),
    },
    image: {
        type: ImagePicker,
        requireData: false,
        label: 'Image',
        defaults: {
            width: 35,
            height: 30,
        },
        specHandler: ImageSpecHandler,
        settingsProvider: ShapeSettingsProvider,
        provider: ImageProvider,
        category: 'Misc',
        enableComponentPaddingSetting: true,
        icon: require('src/img/image-icon.png'),
    },
    reportingComponent: {
        label: 'Reporting Component',
        requireData: true,
        category: 'Misc',
        icon: require('src/img/reportingComponent-textBlock-icon.png'),
        newComponentForm: ReportingComponentNewForm,
        provider: ReportingComponentProvider,
        settingsComponent: ReportingComponentSettings,
        settingsProvider: ReportingComponentSettingsProvider,
        specHandler: ReportingComponentSpecHandler,
    },
};
