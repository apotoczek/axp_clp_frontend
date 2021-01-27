import {PageFormat} from 'src/libs/Enums';

const Default = {
    ColumnCount: 168,
    RowCount: 180,
    DashboardRowHeight: 6,
    GridItemPadding: 12,
    GridItemMargin: 0,
    PageFormat: PageFormat.DASHBOARD,
    ContainerPadding: 4,
};

/**
    We need some standard sizes for paper formats.
    US-LETTER: 8.5/11
    A4: 8.3/11.7

    SRC: https://www.papersizes.org
*/

const PAGE_DIMENSION = {
    [PageFormat.LETTER]: {width: 8.5, height: 11},
    [PageFormat.LETTER_LANDSCAPE]: {width: 11, height: 8.5},
    [PageFormat.A4]: {width: 8.3, height: 11.7},
    [PageFormat.A4_LANDSCAPE]: {width: 11.7, height: 8.3},
    [PageFormat.DASHBOARD]: null,
};

const DPI = 96;

export default class DashboardLayout {
    constructor(
        containerWidth,
        gridItemPadding,
        pageFormat = Default.PageFormat,
        editMode = false,
    ) {
        this._editMode = editMode;
        this.pageFormat = pageFormat;
        this.containerWidth = containerWidth;
        this.gridItemPadding = gridItemPadding ?? Default.GridItemPadding;
        this.containerPadding = Default.ContainerPadding;
        this.gridItemMargin = Default.GridItemMargin;
    }

    get scalingFactor() {
        const dimensions = PAGE_DIMENSION[this.pageFormat];

        return dimensions.width / dimensions.height;
    }

    get pageWidth() {
        if (this.pageFormat === PageFormat.DASHBOARD) {
            return this.containerWidth;
        }

        return PAGE_DIMENSION[this.pageFormat].width * DPI;
    }

    get pageHeight() {
        if (this.pageFormat === PageFormat.DASHBOARD) {
            return Infinity;
        }

        if (!this.pageWidth) {
            return 0;
        }

        return this.pageWidth / this.scalingFactor;
    }

    get columnCount() {
        return Default.ColumnCount;
    }

    get rowCount() {
        if (this.pageFormat === PageFormat.DASHBOARD) {
            return undefined;
        }

        return Default.RowCount;
    }

    innerWidth(itemWidthInColumns) {
        const columnWidth = this.columnWidth();
        return (
            itemWidthInColumns * columnWidth +
            (itemWidthInColumns - 1) * this.gridItemMargin - // Add margins between items
            2 * this.gridItemPadding - // Remove item padding
            (this._editMode ? 2 : 0) // Remove left and right border in edit mode
        );
    }

    innerHeight(itemHeightInRows) {
        const rowHeight = this.rowHeight();
        return (
            itemHeightInRows * rowHeight +
            (itemHeightInRows - 1) * this.gridItemMargin - // Add margins between items
            2 * this.gridItemPadding + // Remove item padding
            (this._editMode ? -2 : 0) // Remove left and right border in edit mode
        );
    }

    columnWidth() {
        if (!this.pageWidth) {
            return 0;
        }

        return (
            (this.pageWidth -
            2 * this.containerPadding - // Remove container padding
                this.gridItemMargin * (this.columnCount + 1)) / // Remove margin between items
            this.columnCount
        );
    }

    rowHeight() {
        if (this.pageFormat === PageFormat.DASHBOARD) {
            return Default.DashboardRowHeight;
        }

        const height =
            (this.pageHeight -
            2 * this.containerPadding - // Remove container padding
                this.gridItemMargin * (this.rowCount + 1)) / // Remove margin between items
            this.rowCount;

        return height;
    }

    itemOffsetToPage(pageY, itemY) {
        // If item is within page vertically, return 0 otherwise return number of pixels
        // item is outside of page.
        if (itemY < pageY) {
            return itemY - pageY;
        }

        const yMax = pageY + this.pageHeight;
        if (itemY > yMax) {
            return itemY - yMax;
        }

        return 0;
    }

    relativeFontSize(width) {
        return Math.min(Math.max(width / 20, 10), 25);
    }
}
