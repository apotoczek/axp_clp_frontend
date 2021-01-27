/* Automatically transformed from AMD to ES6. Beware of code smell. */
/* global google */
import ko from 'knockout';
import $ from 'jquery';
import GoogleMapsLoaderUtil from 'googleMapsLoaderUtil';
import 'infobox';

export default function(data) {
    let self = this;
    // Internal deferred
    self.dfd = $.Deferred();

    self.data = data;

    self.map = ko.observable();

    self.visible = ko.observable(false);

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

    self.watcher = ko.computed(() => {
        let map = self.map();
        let data = ko.unwrap(self.data);

        self.visible(false);

        if (data && data.latitude && data.longitude && data.full_address && map) {
            let location = {lat: data.latitude, lng: data.longitude};
            let content = self.get_info_html(data.name, data.full_address.replace(/\n/g, '<br />'));
            self.clearMarkers();
            map.setCenter(location);
            self.place_marker(map, location, content).view_info();

            self.visible(true);
        }
    });

    self.gmaps_success = function() {
        self.dfd.resolve();
    };

    self.gmaps_error = function() {
        self.dfd.resolve();
    };

    GoogleMapsLoaderUtil.waitForGoogleMaps(self.gmaps_success, self.gmaps_error, 500, 20);
}
