import Helper from 'tests/helper';
import Checklist from 'src/libs/components/basic/Checklist';

describe('Checklist', () => {
    beforeEach(function() {
        this.options = [
            {value: 1, label: '1 year'},
            {value: 3, label: '3 years'},
            {value: 5, label: '5 years'},
            {value: 10, label: '10 years'},
            {value: null, label: 'Since Inception'},
            {value: 'abc-123', label: 'String A'},
            {value: '2468-13579', label: 'String B'},
            // {value: '2015', label: 'String C'},// we don't support number strings
        ];
        this.component = new Checklist({options: this.options});
        this.element = Helper.render(this.component, 'component');
    });

    afterEach(function() {
        Helper.cleanup(this.element);
    });

    it('default _state is empty', function() {
        expect(this.component._selected()).toEqual({});
        expect(this.component.get_state()).toEqual([]);
    });

    it('set_state accepts a single value', function() {
        this.component.set_state(1);
        expect(this.component._selected()).toEqual({1: true});
        this.component.set_state(null);
        expect(this.component._selected()).toEqual({null: true});
        this.component.set_state('2468-13579');
        expect(this.component._selected()).toEqual({'2468-13579': true});
        this.component.set_state('2015');
        expect(this.component._selected()).toEqual({2015: true});
    });

    it('set_state accepts an array of values', function() {
        this.component.set_state([10, null, 'abc-123']);
        expect(this.component._selected()).toEqual({
            10: true,
            null: true,
            'abc-123': true,
        });
    });

    it('set_state accepts a {value: is_selected} dictionary', function() {
        this.component.set_state({
            1: true,
            5: false,
            null: true,
            'abc-123': true,
        });
        expect(this.component._selected()).toEqual({
            1: true,
            5: false,
            null: true,
            'abc-123': true,
        });
        this.component.set_state({
            '2468-13579': true,
        });
        expect(this.component._selected()).toEqual({
            '2468-13579': true,
        });
    });

    it('get_state returns an array of{value_key: value} objects', function() {
        this.component.set_state([{value: 1}, {value: null}, {value: 'abc-123'}]);
        expect(this.component.get_state()).toEqual([{value: 1}, {value: null}, {value: 'abc-123'}]);
        this.component.set_state([{value: '2468-13579'}]);
        expect(this.component.get_state()).toEqual([{value: '2468-13579'}]);
    });
});
