import * as Formatters from 'src/libs/Formatters';

describe('Formatters', () => {
    it('quartiles format correctly', () => {
        const args = {};

        const qs = [1, 2, 3, 4];
        const qs0 = [0, 1, 2, 3];

        for (const q of qs) {
            expect(Formatters.quartile(q, false, args)).toBe(`Q${q}`);
        }

        args.zero_indexed = true;

        for (const q of qs0) {
            expect(Formatters.quartile(q, false, args)).toBe(`Q${q + 1}`);
        }

        args.inverse = true;

        const expected = [4, 3, 2, 1].map(q => `Q${q}`);

        for (const [i, q] of qs0.entries()) {
            expect(Formatters.quartile(q, false, args)).toBe(expected[i]);
        }

        args.zero_indexed = false;

        for (const [i, q] of qs.entries()) {
            expect(Formatters.quartile(q, false, args)).toBe(expected[i]);
        }
    });

    it('percent works', () => {
        expect(Formatters.percent(0.6787)).toEqual('67.87%');
        expect(Formatters.percent('0.6787')).toEqual('67.87%');
        expect(Formatters.percent(0.67, false, {force_decimals: true})).toEqual('67.00%');
        expect(Formatters.percent(0.678, false, {force_decimals: false})).toEqual('67.8%');
    });

    it('multiple works', () => {
        expect(Formatters.multiple(2)).toEqual('2.00x');
        expect(Formatters.multiple(1.12)).toEqual('1.12x');
        expect(Formatters.multiple(0.5)).toEqual('0.50x');
    });

    // it('usd_delta ', function() {
    //     expect(Formatters.usd_delta()).;
    // }

    it('inverse_quartile works', () => {
        expect(Formatters.inverse_quartile(0)).toBeUndefined();
        expect(Formatters.inverse_quartile(1)).toBe(4);
        expect(Formatters.inverse_quartile(2)).toBe(3);
        expect(Formatters.inverse_quartile(3)).toBe(2);
        expect(Formatters.inverse_quartile(4)).toBe(1);
        expect(Formatters.inverse_quartile(5)).toBeUndefined();
    });

    it('score generates a styled score text', () => {
        expect(Formatters.score(80)).toEqual("<span class='text-success'>80</span>");
        expect(Formatters.score(50)).toEqual("<span class='text-warning'>50</span>");
        expect(Formatters.score(23)).toEqual("<span class='text-danger'>23</span>");
        expect(Formatters.score(null)).toEqual("<span class='text-muted'>N/A</span>");
    });

    // it('money ', function() {
    //     expect(Formatters.money(4, )).;
    // }

    it('usd formats numbers into dollar quantitites, in millions or billions', () => {
        expect(Formatters.usd(13.57)).toEqual('$13.57');
        expect(Formatters.usd(-13.57)).toEqual('($13.57)');
        expect(Formatters.usd(1300000)).toEqual('$1.30 M');
        expect(Formatters.usd(-1300000)).toEqual('($1.30 M)');
        expect(Formatters.usd(1000000000)).toEqual('$1.00 B');
        expect(Formatters.usd(-1000000000)).toEqual('($1.00 B)');
    });

    it('usd_full formats numbers into dollar quantitites', () => {
        expect(Formatters.usd_full(13.57)).toEqual('$13.57');
        expect(Formatters.usd_full(-13.57)).toEqual('($13.57)');
        expect(Formatters.usd_full(1300000)).toEqual('$1,300,000.00');
        expect(Formatters.usd_full(-1300000)).toEqual('($1,300,000.00)');
        expect(Formatters.usd_full(1000000000)).toEqual('$1,000,000,000.00');
        expect(Formatters.usd_full(-1000000000)).toEqual('($1,000,000,000.00)');
    });

    it('round_cents works', () => {
        expect(Formatters.round_cents(13)).toBe(13);
        expect(Formatters.round_cents(13.12345)).toBe(13.12);
        expect(Formatters.round_cents(-13.1234)).toBe(-13.12);
        expect(Formatters.round_cents(13.1)).toBe(13.1);
    });

    it('boolean styles bool values into human-friendly words', () => {
        expect(Formatters.boolean(true)).toEqual('Yes');
        expect(Formatters.boolean(false)).toEqual('No');
        expect(Formatters.boolean('truthy')).toEqual('Yes');
        expect(Formatters.boolean('')).toEqual('No');

        expect(Formatters.boolean(true)).toBe('Yes');
        expect(Formatters.boolean(false)).toBe('No');

        const args = {no: 'Noes', yes: 'Yeah baby'};

        expect(Formatters.boolean(false, false, args)).toBe(args.no);
        expect(Formatters.boolean(true, false, args)).toBe(args.yes);

        expect(Formatters.boolean(true, false, {yes: 'correct!'})).toEqual('correct!');
        expect(Formatters.boolean(false, false, {no: 'nothing'})).toEqual('nothing');
    });

    it('boolean_highlight works', () => {
        expect(Formatters.boolean_highlight(true)).toEqual('<span class="text-success">Yes</span>');
        expect(Formatters.boolean_highlight(false)).toEqual('<span class="text-danger">No</span>');
        expect(Formatters.boolean_highlight(true, true)).toEqual('Yes');
        expect(Formatters.boolean_highlight(false, false)).toEqual(
            '<span class="text-danger">No</span>',
        );
        expect(Formatters.boolean_highlight(true, false, {css: {yes: 'yup'}})).toEqual(
            '<span class="yup">Yes</span>',
        );
        expect(Formatters.boolean_highlight(false, false, {css: {no: 'nope'}})).toEqual(
            '<span class="nope">No</span>',
        );
    });

    // it('warning_count ', function() {
    //     expect(Formatters.warning_count()).;
    // }

    // it('failed_count ', function() {
    //     expect(Formatters.failed_count()).;
    // }

    // it('object_to_string ', function() {
    //     expect(Formatters.object_to_string()).;
    // }

    // it('visible_count ', function() {
    //     expect(Formatters.visible_count()).;
    // }

    // it('delimited ', function() {
    //     expect(Formatters.delimited()).;
    // }

    // it('actions ', function() {
    //     expect(Formatters.actions()).;
    // }

    it('highlight_css generates CSS style for calculated values', () => {
        expect(Formatters.highlight_css(null)).toEqual('text-muted');
        expect(Formatters.highlight_css(undefined)).toEqual('text-muted');
        expect(Formatters.highlight_css(5, {multiplier: 3, threshold: 14})).toEqual('text-success');
        expect(Formatters.highlight_css(5, {multiplier: 3, threshold: 15})).toEqual(
            'text-halfmuted',
        );
        expect(Formatters.highlight_css(5, {multiplier: 3, threshold: 16})).toEqual('text-danger');
    });

    it('irr_highlight ', () => {
        expect(Formatters.irr_highlight(1.23, true)).toEqual('123.00%');
        expect(Formatters.irr_highlight(1.23, false)).toEqual(
            '<span class="text-success">123.00%</span>',
        );
    });

    // it('percent_highlight_delta ', function() {
    //     expect(Formatters.percent_highlight_delta()).;
    // }

    // it('irr_neutral ', function() {
    //     expect(Formatters.irr_neutral()).;
    // }

    // it('irr_neutral_delta ', function() {
    //     expect(Formatters.irr_neutral_delta()).;
    // }

    // it('multiple_highlight_delta ', function() {
    //     expect(Formatters.multiple_highlight_delta()).;
    // }

    // it('multiple_highlight ', function() {
    //     expect(Formatters.multiple_highlight()).;
    // }

    // it('multiple_neutral ', function() {
    //     expect(Formatters.multiple_neutral()).;
    // }

    // it('multiple_neutral_delta ', function() {
    //     expect(Formatters.multiple_neutral_delta()).;
    // }

    // it('_timestamp ', function() {
    //     expect(Formatters._timestamp()).;
    // }

    // it('_date_range ', function() {
    //     expect(Formatters._date_range()).;
    // }

    // it('add_seconds ', function() {
    //     expect(Formatters.add_seconds()).;
    // }

    // it('is_pending ', function() {
    //     expect(Formatters.is_pending()).;
    // }

    // it('weighted_strings ', function() {
    //     expect(Formatters.weighted_strings()).;
    // }

    // it('strings ', function() {
    //     expect(Formatters.strings()).;
    // }

    // it('strings_full ', function() {
    //     expect(Formatters.strings_full()).;
    // }

    // it('titleize ', function() {
    //     expect(Formatters.titleize()).;
    // }

    // it('entity_type ', function() {
    //     expect(Formatters.entity_type()).;
    // }

    // it('market_entity_url ', function() {
    //     expect(Formatters.market_entity_url()).;
    // }

    // it('entity_url ', function() {
    // expect(Formatters.entity_url()).;
    // }

    // it('entity_edit_url ', function() {
    // expect(Formatters.entity_edit_url()).;
    // }

    // it('url ', function() {
    // expect(Formatters.url()).;
    // }

    // it('link ', function() {
    // expect(Formatters.link()).;
    // }

    // it('list_entity_link ', function() {
    // expect(Formatters.list_entity_link()).;
    // }

    // it('highlight_if_update ', function() {
    // expect(Formatters.highlight_if_update()).;
    // }

    // highlighted
    // entity_link
    // contextual_link
    // contextual_entity_link
    // external_link
    // years
    // colored_number
    // maybe_number
    // number
    // no_format
    // abs_abbreviated_number
    // cf_type
    // truncate
    // market_status_highlight
    // activity_title
    // gen_formatter
    // report_draft
    // model_report_link
    // finished_report
    // date_or_pending
});
