# 2.5 Cleaning the spec
This part of the spec engine is very straight forward to understand once you understand the part about ![Deriving the DataSpec](deriving.md). Please read that first before going here.

This part of the engine is essentially the reverse of the deriving part. It a takes a derived specification and turns it into something that we can properly save on the backend. Again, we use the example from the chapter "Deriving the DataSpec". This time however, we start with the derived spec, and go backwards to the savable "cleaned up" spec.

**Remember how** the entities on the backend changed and there was now one extra company for the portfolio? This caused the deriving part to add an extra component in `layoutData` and `componentData` to the derived spec. The cleanup process **WILL NOT** remove these again.

## Before cleaning up
```javascript
layoutData: {
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        x: 0,
        y: 0,
        w: 5,
        h: 8,
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        x: 6,
        y: 0,
        w: 6,
        h: 8,
        componentKey: 'timeseriesChart',
        repeaterIds: [
            '43b69065-ce42-4e7a-827c-279f517c9fd3',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10',
        ]
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        x: 0,
        y: 17,
        w: 12,
        h: 8,
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        x: 0,
        y: 9,
        w: 6,
        h: 8,
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
},
componentData: {
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        componentKey: 'metricTable',
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        componentKey: 'timeseriesChart',
        repeaterIds: [
            '43b69065-ce42-4e7a-827c-279f517c9fd3',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10',
        ]
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
},
dataSpec: {
    'f73ac887-532c-4bd2-ae41-964b3a69c120': {
        parent: null,
        uid: '4dab83b2-3e54-457b-b64a-598b1a96ed33',
        entityType: 'portfolio'
        children: [
            '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8',
            '98feddee-b778-4369-9cb5-0d21e6373953',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10',
        ],
    },
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        value: {
            keys: ['irr', 'tvpi', 'dpi', 'rvpi'],
            format: 'raw',
        }
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        entityType: 'company',
        repeatFor: 'companies',
        uid: '4319d6df-4ba7-4633-94c3-d3932c412c58',
        value: {
            key: 'revenue',
            span: 'time',
            format: 'span',
        },
    },
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        entityType: 'company',
        uid: '8ee2e51e-6a8c-44fc-8091-35706e4df730',
        value: {
            key: 'revenue',
            span: 'time',
            format: 'span',
        },
    },
},
```

## After cleaning up
```javascript
dataSpecFillers: {
    'f73ac887-532c-4bd2-ae41-964b3a69c120': '4dab83b2-3e54-457b-b64a-598b1a96ed33',
},
layoutData: {
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        x: 0,
        y: 0,
        w: 5,
        h: 8,
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        x: 6,
        y: 0,
        w: 6,
        h: 8,
        componentKey: 'timeseriesChart',
        repeaterIds: [
            '43b69065-ce42-4e7a-827c-279f517c9fd3',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10',
        ],
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        x: 0,
        y: 9,
        w: 12,
        h: 8,
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        x: 0,
        y: 9,
        w: 6,
        h: 8,
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
},
componentData: {
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        componentKey: 'metricTable',
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        componentKey: 'timeseriesChart',
        repeaterIds: [
            '43b69065-ce42-4e7a-827c-279f517c9fd3',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10',
        ]
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
},
dataSpec: {
    'f73ac887-532c-4bd2-ae41-964b3a69c120': {
        parent: null,
        entityType: 'portfolio'
        children: [
            '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8',
            '98feddee-b778-4369-9cb5-0d21e6373953',
        ],
    },
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        value: {
            keys: ['irr', 'tvpi', 'dpi', 'rvpi'],
            format: 'raw',
        }
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        repeatFor: 'companies',
        value: {
            key: 'revenue',
            span: 'time',
            format: 'span',
        },
    },
},
```
