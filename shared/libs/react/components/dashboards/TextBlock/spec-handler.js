export function changeText(payload, dataSpec = {}, componentData = {}, layoutData = {}) {
    return {
        dataSpec,
        layoutData,
        componentData: {
            ...componentData,
            settings: {
                ...componentData.settings,
                text: payload.text,
            },
        },
    };
}

export function changeSettings(payload, dataSpec = {}, componentData = {}, layoutData = {}) {
    return {
        dataSpec,
        layoutData,
        componentData: {
            ...componentData,
            settings: {
                ...componentData.settings,
                ...payload,
            },
        },
    };
}
