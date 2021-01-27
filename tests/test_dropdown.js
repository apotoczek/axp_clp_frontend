import Helper from 'tests/helper';
import NewDropdown from 'src/libs/components/basic/NewDropdown';

describe('NewDropdown', () => {
    beforeEach(function() {
        this.options = [
            {value: 1, label: 'Value 1'},
            {value: 2, label: 'Value 2'},
        ];

        this.component = new NewDropdown({options: this.options});

        this.element = Helper.render(this.component, 'component');
    });

    afterEach(function() {
        Helper.cleanup(this.element);
    });

    it('options are rendered', function() {
        const nodes = this.element.querySelectorAll('span[class=option-label]');

        for (let i = 0; i < this.options.length; i++) {
            expect(nodes[i].innerHTML).toBe(this.options[i].label);
        }
    });

    it('value is selected on click', function() {
        this.element.querySelector('a[title="Value 2"]').click();

        const selected = this.component.selected();

        expect(selected.value).toBe(2);
        expect(selected.label).toBe('Value 2');
    });
});
