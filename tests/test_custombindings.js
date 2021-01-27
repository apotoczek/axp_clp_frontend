import Helper from 'tests/helper';
import 'custombindings';
import 'src/libs/bindings/render_qr_code';
import ko from 'knockout';

describe('custombindings', () => {
    it('render_qr_code works', done => {
        const options = {
            value: ko.observable('http://www.google.com'),
            size: 50,
            padding: 0,
        };

        // Render and execute the render_qr_code binding
        const element = Helper.render(options, '<div data-bind="render_qr_code: $data"></div>');

        const svg = element.querySelector('svg');

        // Make sure the canvas was rendered with the width/height properties
        expect(svg).toBeDefined();
        expect(svg.attributes.width.value).toBe('50');
        expect(svg.attributes.height.value).toBe('50');

        // Test that it removes the qr code if the value is set to something falsey
        options.value(undefined);

        // Have to do it in callback to allow knockout to rerender
        setTimeout(() => {
            const nothing = element.querySelector('svg');

            expect(nothing).toBeNull();

            // Make sure it renders it again when the value is back
            options.value('123123141231231');

            // Allow rerender again
            setTimeout(() => {
                const svg = element.querySelector('svg');

                expect(svg).toBeDefined();
                expect(svg.attributes.width.value).toBe('50');
                expect(svg.attributes.height.value).toBe('50');

                // Cleanup
                Helper.cleanup(element);

                // Tell jasmine the test is done
                done();
            }, 0);
        }, 0);
    });
});
