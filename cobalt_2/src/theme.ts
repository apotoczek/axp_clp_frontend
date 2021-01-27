import React from 'react';
import {createMuiTheme} from '@material-ui/core/styles';

// import {Theme} from '@material-ui/core/styles/createMuiTheme';
// import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import {PaletteColor, PaletteColorOptions} from '@material-ui/core/styles/createPalette';

export type FontWeight =
    | 'initial'
    | 'inherit'
    | 'very-light'
    | 'light'
    | 'semi-light'
    | 'normal'
    | 'semi-bold'
    | 'bold'
    | 'very-bold';

export type ThemeColor =
    | 'initial'
    | 'inherit'
    | 'primary.very-dark'
    | 'primary.dark'
    | 'primary.semi-dark'
    | 'primary.main'
    | 'primary.semi-light'
    | 'primary.light'
    | 'primary.very-light'
    | 'secondary.very-dark'
    | 'secondary.dark'
    | 'secondary.semi-dark'
    | 'secondary.main'
    | 'secondary.semi-light'
    | 'secondary.light'
    | 'secondary.very-light'
    | 'error.very-dark'
    | 'error.dark'
    | 'error.semi-dark'
    | 'error.main'
    | 'error.semi-light'
    | 'error.light'
    | 'error.very-light'
    | 'warning.very-dark'
    | 'warning.dark'
    | 'warning.semi-dark'
    | 'warning.main'
    | 'warning.semi-light'
    | 'warning.light'
    | 'warning.very-light'
    | 'info.very-dark'
    | 'info.dark'
    | 'info.semi-dark'
    | 'info.main'
    | 'info.semi-light'
    | 'info.light'
    | 'info.very-light'
    | 'success.very-dark'
    | 'success.dark'
    | 'success.semi-dark'
    | 'success.main'
    | 'success.semi-light'
    | 'success.light'
    | 'success.very-light'
    | 'text.primary'
    | 'text.secondary';

export function getColor(color: ThemeColor): React.CSSProperties['color'] {
    if (color === 'initial' || color === 'inherit') {
        return color;
    }

    const colorPath = color.split('.');
    let colorCode: any = theme.palette;
    for (const path of colorPath) {
        colorCode = colorCode[path];
    }

    if (typeof colorCode !== 'string') {
        throw `Invalid color '${color}' supplied to getColor`;
    }

    return colorCode;
}

export function getFontWeight(fontWeight: FontWeight): number | string {
    const fontWeightMapping: Record<FontWeight, number | null> = {
        'very-light': 200,
        light: 200,
        'semi-light': 300,
        normal: 400,
        'semi-bold': 500,
        bold: 600,
        'very-bold': 600,
        initial: null,
        inherit: null,
    };

    const mappedFontWeight = fontWeightMapping[fontWeight];

    if (mappedFontWeight === null) {
        return fontWeight;
    }

    return fontWeightMapping[fontWeight] as number;
}

declare module '@material-ui/core/styles/createPalette' {
    interface PaletteColor {
        'very-dark': string;
        'semi-dark': string;
        'semi-light': string;
        'very-light': string;
    }

    interface SimplePaletteColorOptions {
        'very-dark'?: string;
        'semi-dark'?: string;
        'semi-light'?: string;
        'very-light'?: string;
    }
}

const theme = createMuiTheme({
    palette: {
        primary: {
            'very-dark': '#0A2F76',
            dark: '#16459D',
            'semi-dark': '#1B56C5',
            main: '#216FDD',
            'semi-light': '#3D92FF',
            light: '#3D92FF',
            'very-light': '#B3D4FF',
            contrastText: '#FFFFFF',
        },
        secondary: {
            'very-dark': '#2A1E75',
            dark: '#3E2E9E',
            'semi-dark': '#4845C9',
            main: '#5B58DA',
            'semi-light': '#8482E3',
            light: '#C0B6F2',
            'very-light': '#EAE6FF',
            contrastText: '#FFFFFF',
        },
        error: {
            'very-dark': '#BF2600',
            dark: '#DE350B',
            'semi-dark': '#EC3E13',
            main: '#ED6240',
            'semi-light': '#F28C73',
            light: '#FFBDAD',
            'very-light': '#FFEBE6',
            contrastText: '#FFFFFF',
        },
        warning: {
            'very-dark': '#FF8B00',
            dark: '#FF991F',
            'semi-dark': '#FFAB00',
            main: '#F4AD3D',
            'semi-light': '#F7C26E',
            light: '#FFF0B3',
            'very-light': '#FFFAE6',
            contrastText: '#FFFFFF',
        },
        info: {
            'very-dark': '#008DA6',
            dark: '#00A3BF',
            'semi-dark': '#00B8D9',
            main: '#00C7E6',
            'semi-light': '#79E2F2',
            light: '#B3F5FF',
            'very-light': '#E6FCFF',
            contrastText: '#FFFFFF',
        },
        success: {
            'very-dark': '#006644',
            dark: '#00875A',
            'semi-dark': '#36B37E',
            main: '#62D0A1',
            'semi-light': '#89DCB9',
            light: '#ABF5D1',
            'very-light': '#E3FCEF',
            contrastText: '#FFFFFF',
        },
        text: {
            primary: '#1F222F',
            secondary: '#FFFFFF',
            disabled: '#D1D7E0',
            hint: '#EDEFF2',
        },
    },
    typography: {
        h1: {
            fontFamily: 'Lato',
            fontSize: '96px',
            letterSpacing: '-1.5px',
            fontWeight: 300,
        },
        h2: {
            fontFamily: 'Barlow',
            fontWeight: 500,
            fontSize: '60px',
        },
        h3: {
            fontFamily: 'Lato',
            fontWeight: 400,
            fontSize: '48px',
        },
        h4: {
            fontFamily: 'Barlow',
            fontWeight: 500,
            fontSize: '34px',
            letterSpacing: '0.25px',
        },
        h5: {
            fontFamily: 'Barlow',
            fontWeight: 500,
            fontSize: '24px',
        },
        h6: {
            fontFamily: 'Barlow',
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: '0.15px',
        },
        body1: {
            fontFamily: 'Lato',
            fontSize: '16px',
            letterSpacing: '0.44px',
            fontWeight: 'inherit',
        },
        subtitle1: {
            fontFamily: 'Lato',
            fontSize: '16px',
            letterSpacing: '0.1px',
            fontWeight: 'inherit',
        },
        body2: {
            fontFamily: 'Barlow',
            fontSize: '16px',
            letterSpacing: '0.44px',
            fontWeight: 'inherit',
        },
        subtitle2: {
            fontFamily: 'Lato',
            fontSize: '14px',
            letterSpacing: '0.1px',
            fontWeight: 'inherit',
        },
        button: {
            fontFamily: 'Barlow',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.75px',
        },
        caption: {
            fontFamily: 'Lato',
            fontSize: '12px',
            letterSpacing: '0.4px',
            fontWeight: 'inherit',
        },
        overline: {
            fontFamily: 'Lato',
            fontSize: '10px',
            letterSpacing: '1.5px',
            fontWeight: 400,
        },
    },
});

export default theme;
