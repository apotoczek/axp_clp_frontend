# 1.6 Providers
Provieders are classes that are responsible for taking data from the redux store and formatting it in a way such that components can use it properly. The way in which providers are going to be structured is yet to be fully determined as of now (5 April 2018), but for now there are a set of base providers and one provider for each component on top of that.

Essentially, the providers are responsible for exposing a reasonable and well formatted API that the components can use to get the data that they should be showing. This keeps the data formatting / fetching logic out of the components.
