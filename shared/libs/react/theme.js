import {lighten, darken, transparentize} from 'polished';

import bisonColors from 'bison-colors';
import hlColors from 'hl-colors';

const colors = __DEPLOYMENT__ == 'hl' ? hlColors : bisonColors;

const defaultTheme = {
    breakpoints: ['640px', '768px', '1024px', '1280px', '1440px'],

    page: {
        bg: colors.white,
    },

    modal: {
        bg: colors.white,
        headerBorder: colors.lightBlueGray6,
    },

    loader: {
        fg: '#AAAAAA',
        cube: '#AAAAAA',
    },

    //
    // CPANEL
    //
    cPanel: {
        bg: colors.lightBlueGray2,
        fg: colors.white,
        buttonBg: colors.lightBlueGray4,
        buttonBgHover: darken(0.1, colors.lightBlueGray4),
        buttonFg: colors.white,

        modeButtonBg: colors.lightBlueGray3,
        modeButtonFg: '#A6AFBD',
        modeButtonBorder: colors.orange,
        modeButtonActiveFg: '#E2E5EA',

        inputPlaceholderFg: colors.lightBlueGray5,
        inputBg: colors.darkBlueGray4,
        inputBgAlt: darken(0.02, colors.darkBlueGray4),
        inputFg: colors.lightBlueGray5,
        inputBorder: colors.darkBlueGray5,
        insetShadow: transparentize(0.925, colors.black),
        activeInputBg: colors.darkBlueGray5,
        activeInputFg: colors.green,
        focusedInputDropShadow: transparentize(0.4, colors.lightBlue1),

        popoverBg: colors.darkBlueGray4,
        popoverFg: colors.lightBlueGray5,
        popoverBorder: colors.darkBlueGray5,
        popoverItemBorder: colors.lightBlueGray2,
        popoverItemSelectedBg: colors.darkGray,
        popoverItemSelectedFg: colors.green,
        popoverItemSelectedBorder: colors.darkGray2,
        popoverTabNavHoverBg: colors.darkGray,
        popoverTabNavBorder: colors.darkGray2,
        popoverTabNavBg: colors.darkBlueGray4,
        popoverTabNavFg: colors.lightBlueGray5,
        popoverTabNavActiveBg: colors.darkBlueGray5,
        popoverTabNavActiveFg: colors.green,
    },
    multiLevelSelector: {
        actionHoverBg: colors.white,
        attributeWrapperBg: colors.lightBlueGray5,
        attributeWrapperBorder: darken(0.08, colors.darkWhite),
        checkboxIconFg: colors.grayGreen,
        checkboxIconHoverFg: colors.green,
        clearButtonBg: colors.lightBlueGray4,
        clearButtonFg: colors.white,
        clearButtonHoverBg: darken(0.1, colors.lightBlueGray4),
        dropdownButtonBg: colors.white,
        dropdownButtonFg: colors.black,
        dropdownButtonNAFg: '#BBBBBB',
        expandButtonBorder: colors.lightBlueGray5,
        expandButtonDescendantActiveHighlight: colors.green,
        expandButtonFg: darken(0.1, colors.lightBlueGray5),
        expandButtonHighlight: colors.green,
        expandButtonHoverBg: colors.green,
        expandButtonHoverFg: colors.white,
        footerBg: darken(0.04, colors.darkWhite),
        memberBoxFg: colors.black,
        memberBoxActiveBorder: colors.green,
        memberBoxActiveBg: lighten(0.55, colors.lightBlueGray3),
        memberBoxHoverBg: darken(0.04, colors.darkWhite),
        memberNameFg: colors.lightBlueGray4,
        memberNameActiveFg: colors.green,
        memberNameActiveNotLeafBg: colors.green,
        saveButtonBg: colors.green,
        saveButtonFg: colors.white,
        saveButtonHoverBg: darken(0.04, colors.green),
        titleBg: darken(0.04, colors.darkWhite),
        titleBorder: darken(0.1, colors.darkWhite),
        titleFg: colors.lightBlueGray3,
        titleHoverBg: darken(0.08, colors.darkWhite),
        wrapperBg: colors.darkWhite,
    },
    breadcrumbBg: colors.lightBlue2,
    breadcrumbFg: colors.white,
    toolBarBg: colors.lightBlue,
    toolBarFg: colors.white,
    toolBarHover: colors.lightBlue2,

    dashboard: {
        fg: '#000000',
        componentBar: {
            fg: '#5F6369',
            hoverFg: '#006FF1',
            bg: '#FFFFFF',
            separator: '#DBDCE0',
            dropdown: {
                bg: '#FFFFFF',
                border: '#E1E1E1',
            },
        },
        componentPreview: {
            headerBg: '#EFF1F9',
            bg: '#FFFFFF',
            dropShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        },
        pageIndicator: {
            bg: 'rgba(0, 0, 0, 0.5)',
            fg: colors.darkWhite,
        },
        dashboardSettings: {
            bg: colors.white,
        },
        settings: {
            collapsible: {
                headerBg: '#eff1f9',
                headerHoverBg: '#eff1f9',
                bg: '#FFFFFF',
                fg: '#000000',
                border: '#DBDCE0',
            },
            sectionTitleFg: '#444444',
            sectionSubTitleFg: '#444444',
            value: {
                bg: 'rgba(0, 0, 0, 0.11)',
                fg: colors.darkWhite,
            },
            iconHoverBg: '#212428',
            iconHoverFg: '#F5F5F5',
            iconActiveFg: '#3AC376',
            table: {
                newCellButton: {
                    border: '#DBDCE0',
                    fg: '#000000',
                    bg: '#FFFFFF',
                    hoverBg: '#eff1f9',
                },
                columnSelector: {
                    bg: '#EEEFF3',
                    hoverBg: '#f5f5f5',
                    border: '#DBDCE0',
                    selectedFg: '#3AC376',
                    selectedBorder: '#3AC376',
                },
                rowSelector: {
                    bg: '#EEEFF3',
                    hoverBg: '#f5f5f5',
                    border: '#DBDCE0',
                    selectedFg: '#3AC376',
                    selectedBorder: '#3AC376',
                },
                cell: {
                    bg: '#ffffff',
                    border: '#DBDCE0',
                    hoverBg: '#f5f5f5',
                    headerFg: '#95a5a6',
                    headerBg: '#d8d8d8',
                    selectedBorder: '#3AC376',
                },
                highlight: '#3ac376',
            },
        },
        pagesContainer: {
            bg: '#F8F9FA',
        },
        page: {
            dropShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
        },
        addComponent: {
            categoryButton: {
                bg: '#FFFFFF',
                fg: '#5F6369',
                fgHover: '#006FF1',
                border: '#BEC2D5',
                activeBg: '#FFFFFF',
                activeFg: '#3AC376',
                activeBorder: '#3AC376',
            },
            gridItem: {
                bg: '#FCFCFD',
                fg: '#5F6369',
                border: '#BEC2D5',
                activeBg: '#EFF1F9',
                activeFg: '#5F6369',
                activeDropShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
                hoverBg: '#EFF1F9',
                hoverFg: '#5F6369',
                hoverDropShadow: 'rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
            },
        },
    },

    // Cobalt spreadsheet
    cobaltSpreadsheet: {
        toolbar: {
            selectedFg: 'rgba(102, 175, 233, 0.6)',
            sectionBorder: colors.darkBlueGray,
        },
    },

    textBlock: {
        bg: '#FFFFFF',
        border: '#dbdce0',
        fg: '#5F6369',
        placeholder: transparentize(0.5, colors.lightGray),
        sectionBorder: colors.darkBlueGray,
        explainVariableFg: colors.grayGreen,
    },

    reportingComponents: {
        component: {
            disabledBg: '#e9e9e9',
        },
    },

    attributeModalForm: {
        firstBoxBg: colors.lightGray2,
        secondBoxBg: colors.darkWhite,
        noSelectedValuesBg: '#F5F5F5',
        noSelectedValuesText: '#888888',
    },

    expandedTableRow: {
        bg: '#F6F8FF',
        fg: colors.white,
    },

    memberLabelBoxTooltip: {
        evenBg: colors.darkWhite,
        oddBg: colors.white,
    },
    //
    // CALLOUT
    //
    calloutLabelFg: colors.darkGray,
    calloutValueFg: colors.lightBlue2,

    //
    // CHARTS
    //
    colors: colors,

    basicTable: {
        bg: colors.white,
        bgAlt: '#F8F8F9',
        fg: colors.lightGray,
        headerFg: colors.darkGray,
        headerBg: '#EEEFF3',
        headerBorder: colors.lightBlueGray6,
        exportBg: colors.darkGray,
        exportHoverBg: colors.lightGray,
    },

    text: {
        h1: '#111111',
        h2: colors.lightBlueGray,
        h3: colors.darkBlueGray,
        h4: colors.darkBlueGray5,
        h5: colors.lightBlueGray4,
        description: '#444444',
        warning: colors.warning,
        error: colors.red,
        success: colors.green,
    },

    button: {
        table: {
            bgHover: colors.darkBlueGray3,
            bg: colors.darkBlueGray,
            fgHover: 'rgba(102, 175, 233, 0.6)',
            fg: colors.lightBlueGray6,
        },
    },

    radioButton: {
        checked: colors.green,
        unchecked: colors.white,
        border: colors.gray,
    },

    metaDataTable: {
        labelBg: '#D9DCEC',
        labelFg: '#000000',
        evenRowBg: '#FCFCFD',
        oddRowBg: '#F6F8FF',
        cellFg: '#252525',
    },

    metricTable: {
        bg: 'transparent',
        labelFg: colors.darkGray,
        valueFg: colors.lightGray,
        border: colors.lightGray2,
    },

    multiSelect: {
        wrapperBg: 'transparent',
        badgeFg: '#1BA1CC',
        headerFg: 'rgb(130, 130, 130)',
        enumItemBorder: 'rgba(220, 220, 220)',
        enumItemBgActive: '#DDE0E7',
        enumItemFgActive: '#6662222',
        enumItemFg: '#222222',
        enumItemBg: '#FFFFFF',
        enumItemBgHover: '#EDEFF3',
        listBoxBorder: 'rgb(220, 220, 220)',
        listBoxFg: 'rgba(1, 1, 1, 0.7)',
        listBoxBg: '#FFFFFF',
        listItemBorder: 'rgba(242, 242, 242, 1)',
        listItemBgOdd: 'rgb(248, 248, 249)',
        listItemFadedFg: 'rgb(180, 180, 180)',
        searchBoxBg: '#FFFFFF',
        searchBoxBgFocus: 'rgb(248, 248, 249)',
        searchBoxBorder: 'rgb(230, 230, 230)',
        searchBoxFg: 'rgb(100, 100, 100)',
        searchBoxPlaceholderFg: '#888',
    },

    collapsibleList: {
        rowBorder: 'rgba(255, 255, 255, 0.2)',
    },

    dataTable: {
        mutedFg: '#BBBBBB',
        rowFg: colors.lightGray,
        oddRowBg: colors.white,
        evenRowBg: '#F8F8F9',

        headerRowFg: colors.darkGray,
        headerRowBg: '#EDEFF3',
        headerRowBorder: '#E2E5ED',
        clickableRowHover: '#D6EFE1',

        activeRowBg: '#D9EEEF',

        columnToggleFg: '#6D83A3',
        columnToggleBg: colors.white,
        columnToggleHover: '#3a589f',

        headerBg: colors.darkWhite,
        headerLabelFg: '#555555',
        headerPageInfoFg: '#999999',

        controlsActiveFg: colors.white,
        controlsFg: colors.black,
        controlsActiveBg: '#555555',
        controlsBg: '#DDDDDD',
        controlsIconHover: colors.darkGray,
        controlsIconFg: '#555555',

        emptyBg: '#F8F8F9',
        emptyFg: '#555555',

        columnChecklistDropdown: {
            fg: colors.lightBlueGray4,
            bg: colors.darkWhite,
            border: colors.darkBlueGray5,
            itemBorder: colors.darkWhite,
            itemBgSelected: colors.lightBlueGray6,
            itemFgSelected: colors.lightBlueGray4,
            itemBorderSelected: colors.lightBlueGray5,
        },
    },

    input: {
        wrapperBg: lighten(0.03, colors.darkWhite),
        labelFg: colors.lightBlueGray3,
        errorBorder: colors.red,
        hoverBorder: darken(0.15, colors.lightBlueGray5),
        validValueFg: colors.blue,
        invalidValueFg: colors.red,
        border: colors.lightBlueGray5,
        placeholderFg: lighten(0.3, colors.lightGray),
    },

    confirmDropdown: {
        fg: colors.darkGray,
        bg: colors.darkWhite,
        border: 'transparent',
        mutedFg: colors.lightGray,
    },

    textDropdown: {
        fg: colors.black,
        bg: colors.darkWhite,
        border: colors.lightGray2,
    },

    cPanelPopover: {
        fg: colors.lightBlueGray4,
        bg: colors.darkWhite,
        border: colors.darkBlueGray4,
    },

    cPanelPopoverItem: {
        selectedBg: colors.lightBlueGray6,
        selectedFg: colors.lightBlueGray3,
        selectedBorder: colors.lightBlueGray4,
        border: colors.lightBlueGray5,
    },

    dropdownOption: {
        fg: colors.lightBlueGray4,
        bg: colors.darkWhite,
        selectedFg: colors.lightBlueGray3,
        hoveredBg: colors.lightBlueGray6,
        border: transparentize(0.8, colors.lightBlueGray5),
    },

    datePicker: {
        selectedDayBg: colors.blue,
        selectedDayFg: colors.darkWhite,
        todayFg: colors.red,
        disabledDayFg: colors.lightBlueGray,
        dayHoverBg: colors.lightBlueGray6,
        dayHoverFg: colors.lightBlueGray4,
        dayFg: colors.lightBlueGray4,
        outsideDayFg: colors.lightBlueGray5,
        weekDayFg: colors.gray,
        captionFg: colors.lightBlueGray3,
        weekNumberFg: colors.gray,
    },

    dateBox: {
        headBg: 'rgb(239, 241, 249)',
        headFg: 'rgb(102, 102, 102)',
        valueBg: 'rgb(246, 248, 255)',
        valueFg: 'rgb(34, 34, 34)',
    },

    reportingMandates: {
        tableHeaderBg: colors.lightBlueGray3,
        tableHeaderFg: colors.white,
        tableHeaderBorder: colors.lightBlueGray3,
        tableRowBorder: colors.lightBlueGray3,
        tableRowDisabledFg: lighten(0.4, colors.darkBlueGray),
        tableRowFg: colors.darkBlueGray,
        tableRowBg: colors.white,
        badgeBg: colors.darkBlueGray,
        badgeDisabledBg: lighten(0.4, colors.darkBlueGray),
        badgeFg: colors.white,
    },

    reportingWizard: {
        fg: colors.lightBlueGray3,
    },

    segmentedTable: {
        headerBg: '#545B68',
        headerFg: colors.white,
        rowFg: '#4A4A4A',
        rowBg: colors.white,
        oddRowBg: '#F6F8FF',
        tooltipBg: '#f5f5f5',
        tooltipFg: colors.white,
    },

    reportingDataRequest: {
        cardBg: '#F6F8FF',
        cardBorder: '#BEC2D5',
        cardHeaderBg: '#D9DCEC',
        cardHeaderFg: colors.black,
    },

    reportingDataUpload: {
        requestedFileBg: colors.darkWhite,
        requestedFileErrorBg: lighten(0.4, colors.red),
        requestedFileBorder: colors.lightBlueGray5,
        requestedFileDescriptionFg: colors.gray,
        uploadedFileFg: colors.blue,
    },

    infoBox: {
        default: {
            bg: '#e8f5fc',
            fg: '#3c7390',
        },
        error: {
            bg: lighten(0.4, colors.red),
            fg: colors.red,
        },
    },

    slideInSidePanel: {
        bg: colors.darkWhite,
        border: colors.lightGray2,
    },

    notifications: {
        error: {
            bg: lighten(0.4, colors.red),
            fg: colors.red,
            darkBg: colors.red,
        },
        warning: {
            bg: lighten(0.4, colors.warning),
            fg: colors.warning,
            darkBg: colors.warning,
        },
        info: {
            bg: lighten(0.4, colors.lightBlue3),
            fg: colors.lightBlue3,
            darkBg: colors.lightBlue3,
        },
        success: {
            bg: lighten(0.4, colors.green),
            fg: colors.green,
            darkBg: colors.green,
        },
    },

    directoryIndex: {
        tableBg: '#FCFCFD',
        tableFg: '#333333',
        headerBg: '#EEEFF3',
        headerFg: '#000000',
        headerBorder: '#BEC2D5',
        tableBorder: '#BEC2D5',

        rowSeparator: '#BEC2D5',
        rowBg: '#F6F8FF',
        rowAltBg: '#F5F5F5',
        rowActiveBg: '#F6F8FF',
        rowFg: '#333333',
        rowActiveFg: '#333333',
        rowDotsHover: colors.lightGray,
        systemOwnedFg: colors.lightGray,
        searchResultPathFg: colors.lightGray,

        contextMenuBg: '#FFFFFF',
        contextMenuFg: '#545B68',
        contextMenuHoverBg: '#F6F8FF',
        contextMenuBorder: '#E1E1E1',

        breadcrumbFg: '#222222',
        breadcrumbSeparatorFg: '#BEC2D5',
        modalInfoFg: colors.white,
    },

    formulaBuilder: {
        // A "tag" is an element in the formula: an operator, a metric, etc.
        tagBg: colors.white,
        tagFg: colors.black,
        operatorFg: colors.lightGray,
        tagBorder: colors.lightGray,
        removedTagBorder: colors.red,
        removedValueText: colors.red,

        dragOverTagOutline: colors.lightGray2,

        // Colors for the parenthesis rows
        rowBg: lighten(0.04, colors.lightBlueGray6),
        rowBorder: lighten(0.5, colors.lightGray),

        // The little buttons around tags, for deleting and moving
        valueActionButtonFg: colors.black,
        valueActionButtonBg: colors.lightBlueGray5,
        valueActionButtonBgHover: colors.lightBlueGray3,

        // The little buttons around rows, for deleting and moving
        rowActionButtonFg: colors.gray,
        rowActionButtonActiveFg: colors.lightGray,

        // The little pop-up when you click an operator
        editOperatorBg: colors.white,
        editOperatorBgHover: colors.lightGray2,
        editOperatorBorder: colors.black,

        // The buttons on the far ends of rows in edit mode
        newTagFg: colors.white,
        newTagBg: lighten(0.1, colors.green),
        newTagFgHover: colors.white,
        // The little target highlight when you hover when dragging a tag
        newTagDragOver: transparentize(0.8, colors.green),

        // The amodal modal that pops up when you press one of the plus buttons
        newTagMenuBg: colors.white,
        newTagMenuBorder: colors.gray,

        // The tab nav on the above modal
        tabNavBorder: colors.gray,
        tabNavBg: colors.white,
        tabNavFg: colors.lightBlueGray3,
        tabNavActiveFg: colors.white,
        tabNavActiveBg: colors.lightBlueGray4,
    },

    dataCollectionReviewRemainingSheetsBg: '#fff3c9',

    bulkImport: {
        warningBoxBg: lighten(0.4, colors.red),
        warningLabelFg: colors.red,
        disabledDownloadButtonBg: colors.lightGray2,
        disabledUploadButtonBg: colors.lightYellow,
    },
};

const darkTheme = {
    ...defaultTheme,

    radioButton: {
        checked: colors.green,
        unchecked: colors.white,
        border: colors.gray,

        fgColor: colors.white,
        bgColor: colors.darkBlueGray4,
    },

    textBlock: {
        bg: colors.darkBlueGray4,
        fg: colors.grayGreen,
        placeholder: transparentize(0.5, colors.lightGray),
        sectionBorder: colors.darkBlueGray,
        explainVariableFg: colors.grayGreen,
    },

    page: {
        bg: colors.blueGray,
    },

    modal: {
        bg: colors.darkBlueGray,
        headerBorder: colors.lightBlueGray3,
    },

    basicTable: {
        bg: colors.darkBlueGray4,
        bgAlt: darken(0.03, colors.darkBlueGray4),
        fg: colors.lightBlueGray5,
        headerFg: colors.darkWhite,
        headerBg: colors.darkBlueGray5,
        headerBorder: colors.darkGray2,
    },

    text: {
        h1: colors.darkWhite,
        h2: colors.lightBlueGray6,
        h3: colors.lightBlueGray4,
        h4: colors.darkWhite,
        h5: colors.darkBlueGray5,
        description: lighten(0.05, colors.lightBlueGray5),
        warning: colors.warning,
        error: colors.red,
        success: colors.green,
    },

    metaDataTable: {
        labelBg: colors.darkBlueGray5,
        labelFg: colors.white,
        evenRowBg: colors.blueGray3,
        oddRowBg: colors.blueGray2,
        cellFg: colors.white,
    },

    metricTable: {
        labelFg: colors.darkWhite,
        valueFg: colors.white,
        border: colors.lightGray,
    },

    multiSelect: {
        wrapperBg: 'transparent',
        badgeFg: colors.lightBlue3,
        headerFg: colors.darkWhite,
        enumItemBorder: colors.blueGray,
        enumItemBgActive: colors.blueGray,
        enumItemFgActive: '#EDEFF3',
        enumItemFg: colors.white,
        enumItemBg: colors.blueGray2,
        enumItemBgHover: colors.blueGray3,
        listBoxBorder: colors.blueGray,
        listBoxFg: colors.white,
        listBoxBg: colors.darkBlueGray4,
        listItemBorder: colors.darkBlueGray5,
        listItemBgOdd: colors.blueGray3,
        listItemFadedFg: '#EDEDED',
        searchBoxBg: colors.darkBlueGray5,
        searchBoxBgFocus: colors.darkBlueGray4,
        searchBoxBorder: colors.blueGray,
        searchBoxFg: colors.darkWhite,
        searchBoxPlaceholderFg: colors.blueGray2,
    },

    collapsibleList: {
        rowBorder: 'rgba(255, 255, 255, 0.2)',
    },

    dataTable: {
        mutedFg: '#BBBBBB',
        rowFg: '#FEFEFE',
        oddRowBg: colors.blueGray3,
        evenRowBg: colors.blueGray2,

        headerRowFg: colors.white,
        headerRowBg: colors.darkBlueGray4,
        headerRowBorder: colors.blueGray,
        clickableRowHover: colors.darkGray,

        activeRowBg: '#D9EEEF',

        columnToggleFg: colors.white,
        columnToggleHover: colors.white,
        columnToggleBg: colors.darkBlueGray4,

        headerBg: colors.darkBlueGray5,
        headerLabelFg: colors.white,
        headerPageInfoFg: colors.gray,

        controlsFg: '#FEFEFE',
        controlsBg: colors.darkBlueGray4,
        controlsActiveFg: colors.darkGray,
        controlsActiveBg: '#FEFEFE',
        controlsIconHover: colors.darkGray,
        controlsIconFg: '#555555',

        emptyBg: colors.blueGray2,
        emptyFg: colors.white,

        columnChecklistDropdown: {
            fg: colors.lightBlueGray5,
            bg: colors.darkBlueGray4,
            border: colors.darkBlueGray5,
            itemBorder: colors.lightBlueGray2,
            itemBgSelected: colors.darkGray,
            itemFgSelected: colors.green,
            itemBorderSelected: colors.darkGray2,
        },
    },

    input: {
        wrapperBg: colors.darkBlueGray4,
        labelFg: colors.grayGreen,
        errorBorder: colors.red,
        hoverBorder: colors.lightBlueGray3,
        border: transparentize(0.6, colors.lightBlueGray3),
        validValueFg: colors.green,
        invalidValueFg: colors.red,
        placeholderFg: colors.lightGray,
    },

    confirmDropdown: {
        fg: colors.white,
        bg: colors.blueGray,
        border: '#181a1d',
        mutedFg: '#dedede',
    },

    textDropdown: {
        fg: colors.white,
        bg: colors.blueGray,
        border: '#181a1d',
    },

    cPanelPopover: {
        fg: colors.lightBlueGray5,
        bg: colors.darkBlueGray4,
        border: colors.darkBlueGray5,
    },

    cPanelPopoverItem: {
        selectedBg: colors.darkGray,
        selectedFg: colors.green,
        selectedBorder: colors.darkGray2,
        border: colors.lightBlueGray2,
    },

    dropdownOption: {
        fg: colors.grayGreen,
        bg: colors.darkBlueGray4,
        selectedFg: colors.green,
        hoveredBg: colors.lightBlueGray2,
        border: transparentize(0.8, colors.lightBlueGray3),
    },

    datePicker: {
        selectedDayBg: colors.green,
        selectedDayFg: colors.darkWhite,
        todayFg: colors.red,
        disabledDayFg: colors.lightBlueGray,
    },

    reportingWizard: {
        fg: colors.darkWhite,
    },

    segmentedTable: {
        headerBg: colors.darkBlueGray5,
        headerFg: colors.white,
        rowFg: colors.white,
        rowBg: colors.blueGray3,
        oddRowBg: colors.blueGray2,
        tooltipBg: colors.darkBlueGray4,
        tooltipFg: colors.white,
    },

    reportingDataRequest: {
        cardBg: colors.darkBlueGray4,
        cardBorder: colors.darkBlueGray4,
        cardHeaderBg: colors.blueGray3,
        cardHeaderFg: colors.lightBlue3,
    },

    reportingMandates: {
        tableHeaderBg: colors.darkBlueGray5,
        tableHeaderFg: colors.white,
        tableHeaderBorder: colors.darkBlueGray5,
        tableRowBorder: colors.darkBlueGray5,
        tableRowDisabledFg: colors.lightGray,
        tableRowFg: colors.green,
        tableRowBg: colors.darkBlueGray4,
        badgeBg: darken(0.1, colors.green),
        badgeDisabledBg: colors.lightBlueGray3,
        badgeFg: colors.white,
    },

    slideInSidePanel: {
        bg: colors.darkBlueGray5,
        border: colors.darkBlueGray2,
    },

    directoryIndex: {
        tableBg: colors.darkBlueGray4,
        tableFg: colors.white,
        headerBg: colors.lightBlueGray2,
        headerFg: lighten(0.2, colors.lightBlueGray5),
        headerBorder: colors.darkGray,
        tableBorder: colors.darkGray,

        sidebarBorder: colors.darkGray,
        sidebarBg: colors.darkBlueGray4,

        rowSeparator: colors.lightGray,
        rowBg: colors.darkBlueGray4,
        rowActiveBg: lighten(0.1, colors.darkBlueGray4),
        rowFg: colors.darkWhite,
        rowActiveFg: colors.darkBlueGray4,
        rowDotsHover: colors.lightGray,
        systemOwnedFg: colors.lightGray,
        searchResultPathFg: colors.lightGray,

        contextMenuBg: colors.darkBlueGray,
        contextMenuFg: lighten(0.2, colors.lightBlueGray5),
        contextMenuHoverBg: colors.lightBlueGray4,
        contextMenuBorder: colors.darkGray,

        breadcrumbFg: colors.white,
        breadcrumbSeparatorFg: colors.white,
        modalInfoFg: colors.white,
    },

    formulaBuilder: {
        // A "tag" is an element in the formula: an operator, a metric, etc
        tagBg: colors.darkGray,
        tagFg: colors.white,
        tagBorder: colors.lightBlueGray2,
        dragOverTagOutline: colors.white,

        // Colors for the parenthesis rows
        rowBg: colors.darkBlueGray4,
        rowBorder: colors.darkGray,

        valueActionButtonBg: colors.lightBlueGray,
        editOperatorBg: colors.darkBlueGray,
        editOperatorBorder: colors.darkGray,

        newTagFg: colors.lightBlueGray3,
        newTagFgHover: colors.white,
        newTagMenuBg: colors.darkBlueGray,
        newTagMenuBorder: colors.darkGray,
        newTagDragOver: transparentize(0.8, colors.lightBlue),

        tabNavBorder: colors.darkGray,
        tabNavBg: colors.darkBlueGray4,
        tabNavFg: colors.grayGreen,
        tabNavActiveFg: colors.darkGray,
        tabNavActiveBg: colors.green,
    },
};

const commanderTheme = {
    ...defaultTheme,

    cPanel: {
        ...defaultTheme.cPanel,
        bg: colors.darkBlueGray3,
        fg: colors.white,
        buttonBg: colors.blueGray3,
        buttonBgHover: lighten(0.1, colors.blueGray3),
        buttonFg: colors.white,

        inputPlaceholderFg: colors.lightBlueGray5,
        inputBg: colors.darkBlueGray3,
        inputBgAlt: lighten(0.02, colors.darkBlueGray3),
        inputFg: colors.lightBlueGray6,
        inputBorder: colors.darkBlueGray2,
        insetShadow: transparentize(0.925, colors.black),
        activeInputBg: colors.darkBlueGray3,
        activeInputFg: colors.lightBlueGray5,
        focusedInputDropShadow: transparentize(0.4, colors.lightBlue1),

        popoverBg: colors.darkBlueGray4,
        popoverFg: colors.lightBlueGray5,
        popoverBorder: colors.darkBlueGray5,
        popoverItemBorder: colors.lightBlueGray2,
        popoverItemSelectedBg: colors.darkGray,
        popoverItemSelectedFg: colors.green,
        popoverItemSelectedBorder: colors.darkGray2,

        metaBg: colors.darkBlueGray2,
        metaFg: colors.white,
    },

    metricTable: {
        ...defaultTheme.metricTable,
        bg: colors.white,
        border: colors.darkWhite,
    },

    modal: {
        ...defaultTheme.modal,
        header: {
            bottomBorder: colors.lightGray2,
        },
    },

    textButton: {
        fg: colors.lightBlue3,
        dottedUnderline: colors.lightGray,
    },

    uploadModal: {
        sheetRow: {
            fg: colors.darkGray,
            bg: colors.darkWhite,
            border: colors.lightGray2,
            hoverBorder: colors.lightGray,
            hoverBoxShadow: colors.lightGray2,
        },
    },
};

export default {
    ...defaultTheme,
    darkTheme,
    commanderTheme,
};
