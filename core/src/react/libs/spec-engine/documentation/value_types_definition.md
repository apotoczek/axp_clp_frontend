# 1.3 Value Types
Value types describe the way in which data can be formatted in the data spec. The parser of the data spec understands these formats and know where to fetch these from the backend. Furthermore, different component types have different formats they support. For example, the `MetricTable` supports `Raw` since it only takes a set of key value pairs. The `TimeseriesChart` however takes a `Span`, since it takes some value over the "span" time. While a `PieChart` takes the `Grouped` format, since the values in a pie chart are grouped into a set of categories.

The supported value formats as of now are the following set:

| Type     | Description                                                                   |
|----------|-------------------------------------------------------------------------------|
| Grouped  | A grouped format, groups data into different groups. Geographies for example. |
| Span     | A format that spans data over something, time for example.                    |
| Raw      | Raw data, such as a single IRR or TVPI value for example.                     |
