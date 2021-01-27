import React from 'react';
import Handsontable from 'handsontable';
import isEqual from 'lodash.isequal';

function extractSettings(properties) {
    return [Object.entries(properties), Object.entries(properties.settings || {})]
        .flatten(1)
        .reduce((total, [k, v]) => {
            if (k !== 'settings' && k !== 'isLoading') {
                total[k] = v;
            }
            return total;
        }, {});
}

class CobaltSpreadsheet extends React.Component {
    containerRef = React.createRef();
    hotInstance; // The actual HOT instance
    formulasInstance;
    id = null; // Randomly generated component ID
    settings = {}; // Local cache of settings object

    compareNewSettings(props) {
        const newSettings = extractSettings(props);
        const cell0 =
            this.settings &&
            this.settings.data &&
            this.settings.data[0][0] != newSettings.data[0][0];

        let changedSettings = {};
        if (this.settings) {
            Object.entries(newSettings).forEach(([k, v]) => {
                if (!isEqual(v, this.settings[k])) {
                    this.settings[k] = v;
                    changedSettings[k] = v;
                }
            });
        }
        if (Object.keys(changedSettings).length < 1) {
            changedSettings = false;
        }

        return {
            settings: changedSettings,
            cell0,
        };
    }

    componentDidMount() {
        this.compareNewSettings(this.props);
        this.hotInstance = new Handsontable(this.containerRef.current, this.settings);
        this.formulasInstance = this.hotInstance.getPlugin('formulas');
    }

    shouldComponentUpdate(nextProps) {
        // To prevent multiple recalcs as requests for data finish, don't start
        // propagating HotTable state until all variables have data
        if (nextProps.isLoading) {
            return false;
        }

        const changes = this.compareNewSettings(nextProps);

        // There's some room for refactoring here. If the `data` property has
        // changed, we make a call to handsontable's `updateSettings` method
        // with the new data object. This triggers an internal `loadData` event
        // which in turn triggers a full recalc of the spreadsheet formulas.
        // This can be optimized by diffing the `data` properties between the
        // new and old props, and then calling
        // `setDataAtCell([[row,col,newValue],...])` instead of
        // `updateSettings`

        if (changes.cell0) {
            // This is a temporary hack, something causes the spreadsheet
            // to not be recomputed if the datasource has been updated
            // externally, so update the cell manually here if it's been
            // changed to trigger an update. We need to provide a 'source' (in
            // this case populateFromArray) as setData defaults to 'edit',
            // which will trigger our edit hooks
            this.hotInstance.setDataAtCell(0, 0, this.settings.data[0][0], 'populateFromArray');
        }

        if (changes.settings) {
            this.hotInstance.updateSettings(changes.settings);

            if (changes.settings.formulas && changes.settings.formulas.variables) {
                // If formulas have changed, we need to manually set these in
                // the HOT instance. Updating the formulas in the `settings`
                // object is not enough to trigger a recalc. If variables have
                // changed, update them manually here. This should only happen
                // on initial load and on variable edit.
                Object.entries(changes.settings.formulas.variables).forEach(([variable, value]) => {
                    this.formulasInstance.setVariable(variable, value);
                });
                this.formulasInstance.recalculateFull();
            }
        }

        // This can probably also be refactored to only re-render the table if
        // we've changed style properties. We should probably manage styles
        // inside this wrapper in the name of making it self-contained.
        this.hotInstance.render();

        return false;
    }

    componentWillUnmount() {
        this.hotInstance.destroy();
    }

    render() {
        this.id =
            this.props.id ||
            `hot-${Math.random()
                .toString(36)
                .substring(5)}`;
        this.className = this.props.className || '';

        return (
            <div
                ref={this.containerRef}
                id={this.id}
                className={this.className}
                style={this.style || {}}
            ></div>
        );
    }
}

export default CobaltSpreadsheet;
