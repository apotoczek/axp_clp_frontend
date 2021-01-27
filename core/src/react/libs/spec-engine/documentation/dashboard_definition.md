# 1.1 Dashboard
A dashboard as seen by the user is a bit different when you look at it through spec engine. Even though at the time of writing this, the UX for dashboards does not support having "Dashboard Templates" and "Dashboard Instances" the underlying specs do. This is achieved by splitting a dashboard into multiple different parts, where some parts define a template, and adding the remainder of the parts, will get you an instance based on that template. The different parts of a dashboard are called **specifications** and the available specifications (specs) are as follows.

1. Data specifciation
2. Layout data specification
3. Component data specification

Follows are more thorough descriptions of these.

## Data Spec
The data spec is easily the most complicated specification. So lets start with that! The data spec is responsible for describing the data that each component relies on from the backend. The complete data specification is an object where each component is the value under it's own key -- The id of the component. Each components description involves a few different aspects to "describe". There are 3 main parts to understand here, lets go through then one by.

**Value descriptions** is the part of the data description that describes what values are actually used inside of the component. For each value, we have indications such as what "format" the value has (e.g. currency, date, time interval etc), the "type" that the value has (more about this in **1.3**) and a label which is the human readable format of the value. It's important to note that a component can have multiple values assigned to it, we're not restricted to one value per component, for example a metric table might list the name, IRR and TVPI of a fund. Here would be the value description for that.

```javascript
{
    'd75da2d9-a44b-42b2-bdfc-9c68278fd539': {
        entityType: 'userFund',
        values: {
            name: {type: 'raw', label: 'Name'},
            irr: {type: 'raw', label: 'IRR', format: 'percentage'},
            tvpi: {type: 'raw', label: 'TVPI', format: 'multiple'},
        },
        // ...rest of the data spec for this component
    },
    //...rest of the data spec
}
```

Here we have a new field `entityType` that we did not talk about yet, lets discuss that next.

**Relative descriptions** describe the relation between multiple components. Specifically, this part of the spec describes the relationship between a parent and it's children in the specification. This allows us to define the value for a component relative to another entity. To understand this properly, we first need to go through how the different components describe what entities to fetch their data from.

In each data specification, we have an optional field called `entityType`. This field describes the entity that the content of the `values` object in the specification is relative to. Say for example that `values` contains IRR and `entityType` is `userFund`. Then that IRR value is the IRR of a user fund. However if the `entityType` was as portfolio, that IRR value would be the IRR of a portfolio instead.

Now say we wanted to render three Callout components that show the IRR, TVPI and DPI values for a portfolio; Parent / Child relationships allow us to do this by defining 3 components (the Callout componnets) that all relate to the same parent (A component that is not displayed in the dashboard, it's only used for data specification purposes). Heres the part of the data specification that would describe this situation

```javascript
{
    '189ab991-b385-4102-8023-0610155a6c67': {
        parent: null,
        entityType: 'portfolio',
        children: [
            'a5aff660-bdc8-4620-8985-3eb03bc106e0',
            '1d6c7812-cf12-45e2-ae46-019b08fa241f',
            'c3f80971-00ba-4a63-aac4-da6e40219b3b',
        ],
    },
    'a5aff660-bdc8-4620-8985-3eb03bc106e0': {
        parent: '189ab991-b385-4102-8023-0610155a6c67',
        values: {
            irr: {type: 'raw', label: 'IRR', format: 'percentage'},
        },
    },
    '1d6c7812-cf12-45e2-ae46-019b08fa241f': {
        parent: '189ab991-b385-4102-8023-0610155a6c67',
        values: {
            tvpi: {type: 'raw', label: 'TVPI', format: 'multiple'},
        },
    },
    'c3f80971-00ba-4a63-aac4-da6e40219b3b': {
        parent: '189ab991-b385-4102-8023-0610155a6c67',
        values: {
            dpi: {type: 'raw', label: 'DPI', format: 'multiple'},
        },
    }
    //...rest of the data spec
}
```

**Repeating components** are the last part of the data specification that are important to understand. This is the part thats responsible for handling situations such as "show a Callout component with the IRR value for all funds inside of a portfolio". We handle this by adding yet another field to the spec -- `repeatFor`. At this moment, it is only possible to repeat components over entities, we can't for example repeat a component over all "performance values" in a user fund.

This part of the spec is relatively simple to understand as well. First of all, think about the fact that it does not make sense to repeat a component that is not related to another type of entity. We can't repeat repeat over user funds if we don't have anything to relate "user funds" to for example. In terms of the specification definitions, this means that only components with a `parent` field that is non `null` can be repeated. When this is true, repeating components is done by simply setting the `repeatFor` field on the spec. As an example, let's say we wanted to repeat a component for all companies inside of a user fund. That specification would look something along the lines of this.

```javascript
{
    '189ab991-b385-4102-8023-0610155a6c67': {
        parent: null,
        entityType: 'userFund',
    },
    'a5aff660-bdc8-4620-8985-3eb03bc106e0': {
        parent: '189ab991-b385-4102-8023-0610155a6c67',
        repeatFor: 'companies',
        values: {
            // ... values for this component
        },
    },
    //...rest of the data spec
}
```
This would result in the dashboard fetching data for all companies that belong to the parents user fund.

## Layout Data
The layout specification part of the dashboard specification is responsible for defining how the components are layed out in the dashboard. This spec is fairly simple, and is heavily based on our use of react-grid-layout.

The layout spec object is structured as an object with keys that represent component ids, and values representing the position, size etc of that component. Here we have an example layout spec that contains two
components.
```javascript
{
    '189ab991-b385-4102-8023-0610155a6c67': {
        // position, size etc
    },
    'a5aff660-bdc8-4620-8985-3eb03bc106e0': {
        // position, size etc
    },
}
```
The position and size in this spec is stored exactly as it is in react-grid-layout. This means we use the keys `x`, `y` for positions and `w`, `h` for sizes.

Furthermore, this specification also supports repeating elements. Having the repeated elements in the layout specification allows us to group the components in the dashboard, so that we for example could move all the components at the same time. In this specification (and also in component data), the repeating components works a bit differently compared to data spec. The component that is being repeated, has a key by the name of `repeaterIds`, while all components that exists because they are repeated have a key by the name of `fromRepeatIn`. Here's an example that makes this easier to grasp.

```javascript
{
    '189ab991-b385-4102-8023-0610155a6c67': {
        w: 4,
        h: 4,
        x: 12,
        y: 0,
        repeaterIds: [
            'f0464f51-19a7-49ab-9ab9-b75b49794896',
            '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
        ],
    },
    'f0464f51-19a7-49ab-9ab9-b75b49794896': {
        w: 4,
        h: 4,
        x: 20,
        y: 0,
        fromRepeatIn: '189ab991-b385-4102-8023-0610155a6c67',
    },
    '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
        w: 4,
        h: 4,
        x: 16,
        y: 0,
        fromRepeatIn: '189ab991-b385-4102-8023-0610155a6c67',
    },
}
```
This is pretty much everything there is to layout data. Pretty straight forward.

## Component Data
The component data specification is basically responsible for storing any remaining information that is required for the component. Be this settings for the component or styles for example. The content of the spec for each component is heavily dependent on the type of the component that is currently being described. There is however a couple of things in this specification that are there for every component.

`componentKey` describes the type of the current component. This can have values such as `textBlock`, `metricTable` or `callout` for example. It's simply a string that maps to an actual Component class that we can put in the dashboard.

`repeaterIds` and `fromRepeatIn` are in this specification as well, they work in the exact same way as in the layout spec. The purpose of the keys here is to be able to duplicate the correct component when we specify that we want to repeat a specific component. Meaning that we can get the same settings / styles etc for all of our copies as well.

Here is an example of a basic component data spec.
```javascript
{
    'f0464f51-19a7-49ab-9ab9-b75b49794896': {
        componentKey: 'metricTable',
    },
    '189ab991-b385-4102-8023-0610155a6c67': {
        componentKey: 'rect',
        style: {
            background: 'transparent'
        },
        settings: {
            color: '#F95532'
        },
    },
    '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
        componentKey: 'timeseriesChart',
        repeaterIds: [
            '98feddee-b778-4369-9cb5-0d21e6373953',
            '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8'
        ],
    },
    '98feddee-b778-4369-9cb5-0d21e6373953': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    },
    '57f2887d-f8bd-4e6f-9c86-8539e1ce20f8': {
        componentKey: 'timeseriesChart',
        fromRepeatIn: '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    },
}
```

## Important note about the specs
There is one additional thing we should talk about. It's important to note that these specs are **completely separate**, and as such they are **not dependent on each other**. This means that we can have a set of specs where we have a component in the layout and component specification, but this component does not exist in the data specification (This would imply that the given component does not require any data). We could also have an entry in the data specification that does not exist in layout specification or component data (This describes a situation where we use an additional data spec entry to specify the required data, but we don't add an actual viewable component to the dashboard). All combinations work between the specs, but some makes more sense than others (It'd be hard to justify having a layout specification but no component specification for example, since we wouldn't know which component to place in the dashboard, only where to put that arbitrary component).
