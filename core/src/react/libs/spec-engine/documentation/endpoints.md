# 2.2 Calling endpoints
Now that we've derived the specs, and we have something thats a bit more convenient to work with, we need to determine what data we from the backend to display the dashboard properly. There are a few steps to this process. The outline goes as follows.

1. For each value in each component, determine what endpoints we can call to obtain this data.
2. Merge all value endpoints for all components together to get the minimum set of endpoints we need to call.
3. Determine what parameters we need to send to each endpoint.
4. Call the endpoints

Doesn't sound to complicated, does it? It's not.

I'm not going to go through in depth exactly how this is done, the code explains that faily well in my opinion. However, I'll go through the most important parts. All the code is available in `spec-engine/endpoints.js`.

## Determine endpoints per value
We determine the endpoints that can be called to fetch each value by indexing in the value map. This means that support fetching of a new value in the dashboards, we need to add new values to the value map.

## Determine parameters
When we've determined the endpoints that need to be called to fetch all the information for our components, we need to determine what parameters should be sent to each enpoint. It might turn out that one call to the endpoint is not enough. Say we need the IRR value of two funds, and we can only get them from an endpoint that returns the IRR for one fund only. It's impossible to get both values with only one call to the endpoint. In this scenario, we simply let the engine know what there are multiple sets of parameters, and it will execute one endpoint call be parameter object.

In the code, this is being done in `endpoints.js -> paramsForXXX(...)` where `XXX` is the name of the endpoint that is being called in camel case name convention.
