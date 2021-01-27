/* Automatically transformed from AMD to ES6. Beware of code smell. */
/* global google */

import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import GoogleMapsLoaderUtil from 'googleMapsLoaderUtil';
import 'infobox';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);
    // Internal deferred

    let _dfd = self.new_deferred();
    self.map = ko.observable();
    self.visible = ko.observable(false);

    /*
            locations format:
            [
                {
                    lat: latitude,
                    lng: longitude,
                    name: name,
                    full_address: full adress
                }
            ]
        */
    self.locations = opts.locations;

    self.template = opts.template || 'tpl_google_map';

    self.icons = {
        dark_blue:
            'https://chart.googleapis.com/chart?chst=d_map_xpin_letter_withshadow&chld=pin|+|00679d|000000|00679d',
        light_blue:
            'https://chart.googleapis.com/chart?chst=d_map_xpin_letter_withshadow&chld=pin|+|008BC7|000000|008BC7',
        dark_green:
            'https://chart.googleapis.com/chart?chst=d_map_xpin_letter_withshadow&chld=pin|+|44a266|000000|44a266',
        light_green:
            'https://chart.googleapis.com/chart?chst=d_map_xpin_letter_withshadow&chld=pin|+|6ac089|000000|6ac089',
    };

    self.markers = [];

    self.info_window = new google.maps.InfoWindow();

    self.place_marker = function(map, location, content) {
        let marker = new google.maps.Marker({
            position: location,
            map: map,
        });

        marker.view_info = function() {
            self.info_window.close();
            self.info_window.setContent(content);
            self.info_window.open(map, marker);
        };

        self.markers.push(marker);

        google.maps.event.addListener(marker, 'click', () => {
            marker.view_info();
        });

        return marker;
    };

    self.clearMarkers = function() {
        for (let i = 0; i < self.markers.length; i++) {
            self.markers[i].setMap(null);
        }
        self.markers = [];
    };

    self.get_info_html = function(title, body) {
        return [
            '<div class="info-window"><div class="title">',
            title,
            '</div><div class="body">',
            body,
            '</div></div>',
        ].join('');
    };

    self.mapOptions = {
        zoom: 13,
        center: {lat: -34.397, lng: 150.644},
    };

    self.defaults = {
        location: {lat: 72.62, lng: 80.31},
        content:
            '<div class="info-window"><div class="title">North Pole</div><div class="body"></div></div>',
    };
    self.watcher = ko.computed(() => {
        let map = self.map();
        let data = ko.unwrap(self.data);

        self.visible(false);
        if (map) {
            self.clearMarkers();
            let set_location_and_show_map = function(location, content, map, callback) {
                //self.clearMarkers();
                map.setCenter(location);
                self.place_marker(map, location, content).view_info();
                if (typeof callback === 'function') {
                    callback(map);
                } else {
                    self.visible(true);
                }
            };

            if (self.locations) {
                if (Array.isArray(self.locations)) {
                    for (let i = 0, j = self.locations.length; i < j; i++) {
                        let location = {
                            lat: self.locations[i].lat,
                            lng: self.locations[i].lng,
                        };
                        let content = self.get_info_html(
                            self.locations[i].name,
                            self.locations[i].full_address.replace(/\n/g, '<br />'),
                        );
                        set_location_and_show_map(location, content, map);
                    }
                }
            } else if (data && data.latitude && data.longitude && data.name && map) {
                let location = {lat: data.latitude, lng: data.longitude};
                let content = '';

                if (data.full_address) {
                    content = self.get_info_html(
                        data.name,
                        data.full_address.replace(/\n/g, '<br />'),
                    );
                } else {
                    content = [
                        '<div class="info-window"><div class="title">',
                        data.name,
                        '</div><div class="body"></div></div>',
                    ].join('');
                }
                set_location_and_show_map(location, content, map);
            } else if (data && (!data.latitude || !data.longitude)) {
                self.visible(false); //Removes map in case the backend doesn't provide proper information
            } else {
                set_location_and_show_map(self.defaults.location, self.defaults.content, map); //Sets a default location due to Google maps being whacky
            }
        }
    });

    self.gmaps_success = function() {
        _dfd.resolve();
    };

    self.gmaps_error = function() {
        _dfd.resolve();
    };

    GoogleMapsLoaderUtil.waitForGoogleMaps(self.gmaps_success, self.gmaps_error, 500, 20);

    return self;
}
