import {createSelector} from 'reselect';

export const siteCustomizations = state => state.siteCustomizations;

export const customColors = createSelector([siteCustomizations], customizations => {
    if (customizations.custom_colors) {
        return [...customizations.custom_colors, 'transparent'];
    }

    return undefined;
});
