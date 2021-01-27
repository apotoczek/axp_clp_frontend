/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import 'src/libs/bindings/image_cropper';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    let _dfd = self.new_deferred();

    self.template = opts.template || 'tpl_image_cropper';

    self.preview_height = opts.preview_height || 100;
    self.preview_width = opts.preview_width || 200;
    self.export_original_size = opts.export_original_size || false;

    self.save_event = opts.save_event || false;

    self.chosen_image = ko.observable();

    self.save = function() {
        if (self.save_event) {
            Observer.broadcast(self.save_event);
        }
    };

    self.chosen_image.subscribe(src => {
        Observer.broadcast_for_id(self.get_id(), 'ImageCropper.chosen_image', src);
    });

    _dfd.resolve();

    return self;
}
