# Spec Engine Documentation
The spec engine is one of the core parts behind the dashboards in Cobalt. It enables the dashboards to fetch data from all other parts of Cobalt, instead of having to write new endpoints specifically for the dashboards. It also puts a layer of abstraction between calling backend endpoints and specifying which data each component relies on. This layer of abstraction allows us to avoid specifying endpoint logic inside of components, and drive multiple components of off the same endpoint and / or request.

This document aims to do a basic walkthrough of the internals of the spec engine. We'll talk about the general flow, important notations, concepts and functionality.

# Table of Contents
* [Notations & Definitions](notations_definitions.md)
    * [Dashboard](dashboard_definition.md)
        * [Data Spec](dashboard_definition.md#data-spec)
        * [Layout Data](dashboard_definition.md#layout-data)
        * [Component Data](dashboard_definition.md#component-data)
        * [Important Notes](dashboard_definition.md#important-notes)
    * [Value Map](value_map_definition.md)
    * [Value Types](value_types_definition.md)
    * [Providers](providers_definition.md)
* [Flow](flow.md)
    * [Deriving The Specs](deriving.md)
        * [Before and after we derive?](deriving.md#before-and-after-we-derive)
        * [What happens?](deriving.md#what-happens)
        * [Layout & Component Spec](deriving.md#layout--component-spec)
        * [Data Spec](deriving.md#data-spec)
    * [Calling endpoints](endpoints.md)
    * [Mapping to Providers](mapping_providers.md) (TODO)
    * [Interacting with the specs](interaction_with_specs.md) (TODO)
    * [Cleaning the spec](cleaning.md)
* [Examples](examples.md) (TODO)
    * [Adding a new value from the backend](adding_new_values.md)
