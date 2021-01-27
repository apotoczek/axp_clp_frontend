# 1.2 Value Map
The value map is a map that goes from entity types and their values into a structure that describes the type, format and label of that value, and all the possible endpoints on the backend where you can obtain this data. It's a lot easier to explain this with an example.

Here is a sub part of the value map, we'll use this part to explain how it works.
```javascript
userFund: {
    irr: [{
        type: 'raw',
        format: 'percentage',
        value: {key: 'irr', label: 'IRR'},
        endpoints: ['dataprovider/vehicle_analysis']
    }],
    irr_year_to_date: [{
        type: 'raw',
        format: 'percentage',
        value: {key: 'irr_year_to_date', label: 'IRR Year to Date'},
        endpoints: ['dataprovider/vehicle_analysis']
    }],
},
portfolio: {
    irr: [{
        type: 'raw',
        format: 'percentage',
        value: {key: 'irr', label: 'IRR'},
        endpoints: ['dataprovider/vehicle_analysis']
    }],
    navs: [{
        type: 'span',
        format: 'currency',
        value: {key: 'navs', label: 'NAVs'},
        span: [{key: 'time', label: 'Time'}],
        endpoints: ['dataprovider/vehicle_analysis'],
    }],
},
```

In this example, we have told the spec engine where to fetch the following values.

1. IRR and IRR Year to Date (for user funds)
2. IRR and NAVs over Time (for portfolios)

Looking at this example, it's fairly straight forward to grasp the basic concept, but there are some details that we should go through. First, note that for each value there is an array of objects describing the value. This is because there might be multiple formats in which we can obtain this format. For example, we could fetch IRR both as a raw value, and as a value spanning over time. The following modifications could be made if we wanted to allow this:
```javascript
userFund: {
    irr: [{
        type: 'raw',
        format: 'percentage',
        value: {key: 'irr', label: 'IRR'},
        endpoints: ['dataprovider/vehicle_analysis']
    },
    // ADDITION START
    {
        type: 'span',
        format: 'percentage',
        value: {key: 'irr', label: 'IRR'},
        span: [{key: 'time', label: 'Time'}],
        endpoints: ['dataprovider/vehicle_analysis']
    }
    // ADDITION END
    ],
}
// ... the rest of the value map from above
```

Also noteworthy is that we have an array that describes the endpoints for the value. This allows us to specify all endpoints that we can call to fetch the described information in that object. The more we specify, the better; Spec engine is capable of combining endpoints for different values, meaning that if we can fetch two values from the same endpoint, the endpoint will only be called once.

One last thing when it comes to the span type definition here. We can also specify multiple different values under the `span` key. This allows us to span a value over multiple different things. A perfect example is the following, where we use grouping instead of span, but it works the same exact way. Here we can fetch the allocations of a user fund grouped by Geography, Sector and Year.
```javascript
userFund: {
    allocations: [{
        type: 'grouping',
        format: 'percentage',
        value: {key: 'allocations', label: 'Allocations'},
        grouping: [
            {key: 'geography', label: 'Geography'},
            {key: 'sector', label: 'Sector'},
            {key: 'year', label: 'Year'},
        ],
        endpoints: ['dataprovider/vehicle_analysis'],
    }],
}
```
