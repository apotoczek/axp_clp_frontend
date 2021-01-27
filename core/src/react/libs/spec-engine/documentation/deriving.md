# 2.1 Deriving the specs
When we've talked about the specifications that make up a dashboard, we've been talking about the specifications and how they look when you interact with them in the inner parts of the spec engine
and the structures that you get back when you ask for specific parts of the specs from the engine. However, these structures are not the same when we store them for saving a dashboard for later use. On load and save, we do some modifications to the specs, both for ease of use in the engine and to make sure that we don't store larger amounts of data than we require.

This section aims to walk you through more specifically what we're doing during this process that we call "deriving". Note that this document does not go through everything that happens. Only the most significant parts.

## Before and after we derive?
Lets start by showing you an example of how a spec looks before we start deriving it and what the result is after we are done deriving. We'll then walk through the most important steps that are taken in this process.

### Before we derive the spec
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
        repeaterIds: ['43b69065-ce42-4e7a-827c-279f517c9fd3']
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        x: 0,
        y: 9,
        w: 12,
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
        repeaterIds: ['43b69065-ce42-4e7a-827c-279f517c9fd3']
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
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

### After we derive the spec
Ignore the comments, they are there to make the description of what happened easier in the next section.
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
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10', // 1.a
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
    // 1.b
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
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10', // 2.a
        ]
    },
    '43b69065-ce42-4e7a-827c-279f517c9fd3': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
    // 2.b
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '98feddee-b778-4369-9cb5-0d21e6373953',
    },
},
dataSpec: {
    'f73ac887-532c-4bd2-ae41-964b3a69c120': {
        parent: null,
        uid: '4dab83b2-3e54-457b-b64a-598b1a96ed33', // 5
        entityType: 'portfolio'
        children: [
            '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8',
            '98feddee-b778-4369-9cb5-0d21e6373953',
            '834fbb94-3cdd-4ce9-b72b-1f7cb847df10', // 3.a
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
        entityType: 'company', // 4.a
        repeatFor: 'companies', // 4.b
        uid: '4319d6df-4ba7-4633-94c3-d3932c412c58', // 6
        value: {
            key: 'revenue',
            span: 'time',
            format: 'span',
        },
    },
    // 3.b
    '834fbb94-3cdd-4ce9-b72b-1f7cb847df10': {
        parent: 'f73ac887-532c-4bd2-ae41-964b3a69c120',
        entityType: 'company', // 4.c
        uid: '8ee2e51e-6a8c-44fc-8091-35706e4df730', // 6
        value: {
            key: 'revenue',
            span: 'time',
            format: 'span',
        },
    },
},
```

## What happens?
So what happens here, and why does it happen? Lets walk it through together.

First of, we need to know what happened to the data since the last time we saved the dashboard, this will become important. So, when someone created this dashboard, the portfolio with the uid `4dab83b2-3e54-457b-b64a-598b1a96ed33` had one company in it. That company had the uid `4319d6df-4ba7-4633-94c3-d3932c412c58`. Now this portfolio instead has two companies in it, the additional one has a uid of `8ee2e51e-6a8c-44fc-8091-35706e4df730`.

### Layout & Component spec
Lets start with the layout and component spec this time. The same thing happens in both of these, and what we're doing is taking care of adding / removing repeated elements. As noted above, since the last time someone saved this dashboard, there has been an additional company added to the portfolio. The specifications before we derive them only contain spec definitions for the first company, since that was the only one that existed when the dashboard was last saved. What the deriving of these specs do, is to make sure that there are definitions for any entities that have been added to the repeating elements as well. In the same manner, if we had 2 companies on the last save, but only one company now, the deriving would remove one definition from the spec.

#### 1.a & 1.b
These two uids are added because a new company has been added to the portfolio as mentioned above. Essentially a new dashboard component has been generated and the definition of the new component has been copied from the component with the uid `98feddee-b778-4369-9cb5-0d21e6373953`, since that is the root of the repeaters.

Furthermore, the coordinates for the new components were originally copied from the root, but they have been resolved automatically by react-grid-layout (This is not really part of the spec deriviation, but is a side effect of the react-grid-layout library resolving collisions).

#### 2.a & 2.b
Essentially the same thing happens here in the component-data spec. But instead the definition has been
copied from `98feddee-b778-4369-9cb5-0d21e6373953`.

### Data spec
#### 3.a & 3.b
Now, the result here looks very similar to 1A/B and 2A/B, however the reasoning behind why we get this result is different. In the case of the data specification, we always have only one component before starting the repetition (meaning we only have the repeat root). Meaning that even if there instead were 2 companies the last time we saved, and there were 3 instead, we'd still only have the entry with uid `98feddee-b778-4369-9cb5-0d21e6373953` in the spec before deriving, but we would have two additional entries after deriving instead of only one additional.

But either way, we create the entries in the spec that we need to specify exactly what data we require for each component in the dashboard here as well.

#### 4.a, 4.b & 4.c
Here we see that the `entityType` field was added to the two components that are being repeated for some entity, and the repeat root still has the `repeatFor` field, but the non-repeat-root component does not. This is simply for convenience in the remaining part of the spec engine; Instead of looking at `entityType` or `repeatFor` to determine what we are fetching data for, we can simply look at the `entityType` field.

#### 5
We see that the final derived data spec has a uid filled out for the upper most parent (the component with the `parent = null` field). This has been fetched from the `dataSpecFillers` from the spec prior to deriving. We simply take the `dataSpecFillers` and insert the respective uids into all components that have `parent = null`.

#### 6
Here are some additional uids that have been filled out, but they have not been taken from `dataSpecFillers`, instead they have been filled out because these are the uids of the company entities from the backend that we are repeating this component over.
