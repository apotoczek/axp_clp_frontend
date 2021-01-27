import ko from 'knockout';
import QRCode from 'qrcode-svg';

ko.bindingHandlers.render_qr_code = {
    update: function(element, valueAccessor) {
        const options = ko.unwrap(valueAccessor());

        const content = ko.unwrap(options.value);

        if (!content) {
            element.innerHTML = '';
            return;
        }

        const svg = new QRCode({
            content,
            width: ko.unwrap(options.size),
            height: ko.unwrap(options.size),
            padding: ko.unwrap(options.padding) ?? 0,
        }).svg();

        element.innerHTML = svg;
    },
};
