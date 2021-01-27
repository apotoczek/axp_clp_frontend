/* Automatically transformed from AMD to ES6. Beware of code smell. */
/* global google */

import $ from 'jquery';
import GoogleMapsLoaderUtil from 'googleMapsLoaderUtil';
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import 'src/libs/bindings/typeahead';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
        <div class="popover-location-search" data-bind="event_horizon:true">
            <div class="form-group">
                <input type="text" class="form-control input-sm" data-bind="
                typeahead:{
                    datasets:datasets,
                    on_select:on_select
                }
                " placeholder="Find Location...">
            </div>
            <ul class="force-scrollable-y selected-locations" data-bind="foreach:locations">
                <li class="btn btn-cpanel-ghost btn-block btn-xs clearfix" data-bind="click:$parent.remove_location"><span  data-bind="text:name" class="btn-label name pull-left"></span><span class="btn-icon pull-right glyphicon glyphicon-remove text-default"></span></li>
            </ul>
            <div class="google-attribution-img">
                <img src="${require('src/img/powered-by-google-on-non-white.png')}">
            </div>
            <div class="hr hr-padded"></div>
            <button type="button" class="btn btn-block btn-sm btn-default close-popover">Done</button>
            <button type="button" class="btn btn-block btn-sm btn-cpanel-ghost-strong clear-popover" data-bind="click:clear">Clear</button>
        </div>
    `);

    self.dfd = self.new_deferred();

    self.waiting = ko.observable(false);
    self.enabled = ko.observable(true);
    self.pause_bindings = ko.observable(false);

    self.placement = opts.placement;

    self.locations = ko.observableArray([]);

    self.predict_location = function(query, callback) {
        self.autocomplete.getPlacePredictions(
            {input: query, types: ['geocode']},
            (predictions, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    let results = predictions.map(e => {
                        return {value: e.id, text: e.description, reference: e.reference};
                    });
                    callback(results);
                } else {
                    callback([]);
                }
            },
        );
    };

    self.datasets = {
        source: self.predict_location,
        displayKey: 'text',
    };

    self.add_selection = function(place) {
        let id = place.id;
        if (typeof place.geometry !== 'undefined') {
            let lat = place.geometry.location.lat();
            let lng = place.geometry.location.lng();
            let viewport = place.geometry.viewport;
            let name = place.name;
            let box;

            if (typeof viewport !== 'undefined') {
                let ne = place.geometry.viewport.getNorthEast();
                let sw = place.geometry.viewport.getSouthWest();
                box = {
                    max: {lat: ne.lat(), lng: ne.lng()},
                    min: {lat: sw.lat(), lng: sw.lng()},
                };
            }

            let item = {
                id: id,
                lat: lat,
                lng: lng,
                box: box,
                name: name,
            };

            if (
                self.locations().findIndex(n => {
                    return n.id == item.id;
                }) === -1
            ) {
                self.locations.push(item);
            }
        }
    };

    self.remove_location = function(location) {
        self.locations.remove(location);
    };

    self.on_select = function(event, suggestion) {
        self.places.getDetails({reference: suggestion.reference}, self.add_selection);
    };

    self.clear = function() {
        self.locations([]);
    };

    self.get_state = function() {
        return ko.toJS(self.locations);
    };

    self.state = ko.pureComputed(() => {
        return self.get_state();
    });

    self.set_state = function(state) {
        self.locations(state || []);
    };

    self.get_value = ko.computed(() => {
        return self.locations();
    });

    self.modified = ko.computed(() => {
        return self.locations().length > 0;
    });

    self.gmaps_success = function() {
        self.autocomplete = new google.maps.places.AutocompleteService();
        self.places = new google.maps.places.PlacesService($('<div></div>')[0]);

        self.dfd.resolve();
    };

    self.gmaps_error = function() {
        self.dfd.resolve();
    };

    GoogleMapsLoaderUtil.waitForGoogleMaps(self.gmaps_success, self.gmaps_error, 500, 20);

    return self;
}
