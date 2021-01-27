/* Automatically transformed from AMD to ES6. Beware of code smell. */

export const ComponentConfigException = function(message, config) {
    this.id = config.id;
    this.component = config.component;
    this.config = config;
    this.message = message;
    this.toString = () => `Component: ${this.component}, ID: ${this.id}, Error: ${this.message}`;
};
