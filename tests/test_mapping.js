import * as Mapping from 'src/libs/Mapping';

describe('Mapping', () => {
    it('list_to_options works', () => {
        let options = Mapping.list_to_options(['hello']);

        expect(options[0]).toEqual(
            jasmine.objectContaining({
                value: 'hello',
                label: 'hello',
            }),
        );

        options = Mapping.list_to_options(['one', 'two', 'three'], {format: 'titleize'});

        expect(options[0]).toEqual(
            jasmine.objectContaining({
                value: 'one',
                label: 'One',
            }),
        );

        expect(options[1]).toEqual(
            jasmine.objectContaining({
                value: 'two',
                label: 'Two',
            }),
        );

        expect(options[2]).toEqual(
            jasmine.objectContaining({
                value: 'three',
                label: 'Three',
            }),
        );
    });

    it('keyed_timeseries_to_rows works', () => {
        const timeseries = {
            irr: [
                [1000, 0.35],
                [2000, 0.45],
                [3000, 0.5],
            ],
            tvpi: [
                [2000, 1.3],
                [3000, 1.2],
                [4000, 1.4],
            ],
        };

        const result = Mapping.keyed_timeseries_to_rows(timeseries);

        expect(result).toEqual([
            {
                date: 1000,
                irr: 0.35,
                tvpi: undefined,
            },
            {
                date: 2000,
                irr: 0.45,
                tvpi: 1.3,
            },
            {
                date: 3000,
                irr: 0.5,
                tvpi: 1.2,
            },
            {
                date: 4000,
                irr: undefined,
                tvpi: 1.4,
            },
        ]);

        const result2 = Mapping.keyed_timeseries_to_rows(timeseries, null);

        expect(result2).toEqual([
            {
                date: 1000,
                irr: 0.35,
                tvpi: null,
            },
            {
                date: 2000,
                irr: 0.45,
                tvpi: 1.3,
            },
            {
                date: 3000,
                irr: 0.5,
                tvpi: 1.2,
            },
            {
                date: 4000,
                irr: null,
                tvpi: 1.4,
            },
        ]);
    });
});
