import $ from 'jquery';
import ko from 'knockout';
import 'cropit';

ko.bindingHandlers.image_cropper = {
    init: function(element, valueAccessor) {
        let data = valueAccessor();

        let height = data.preview_height || 100;
        let width = data.preview_width || 200;
        let export_original_size = data.export_original_size || false;

        $(element).cropit({
            smallImage: 'allow',
            allowDragNDrop: false, // CURRENTLY incompatible with jQuery 3.0
            minZoom: 'fit',
            maxZoom: 2,
            width: width,
            height: height,
            freeMove: true,
        });

        $(element)
            .find('.crop-finish')
            .click(() => {
                let imageData = $(element).cropit('export', {
                    originalSize: export_original_size,
                });

                data.chosen_image(imageData);
            });
    },
    update: function(element, valueAccessor) {
        let data = valueAccessor();

        let chosen_image = data.chosen_image();

        if (chosen_image) {
            $(element).cropit('imageSrc', chosen_image);
        } else {
            ko.bindingHandlers.image_cropper.clear(element);
        }
    },
    clear: function(element) {
        $(element)
            .find('.cropit-preview-image')
            .attr('src', '');
    },
};
