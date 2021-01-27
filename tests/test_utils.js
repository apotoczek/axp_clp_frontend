import * as Utils from 'src/libs/Utils';
import RegExps from 'src/libs/RegExps';

describe('Utils', () => {
    it('month_to_quarter returns correct quarter', () => {
        for (const i of [1, 2, 3]) {
            expect(Utils.month_to_quarter(i)).toBe(1);
        }
        for (const i of [4, 5, 6]) {
            expect(Utils.month_to_quarter(i)).toBe(2);
        }
        for (const i of [7, 8, 9]) {
            expect(Utils.month_to_quarter(i)).toBe(3);
        }
        for (const i of [10, 11, 12]) {
            expect(Utils.month_to_quarter(i)).toBe(4);
        }

        expect(() => Utils.month_to_quarter(13)).toThrow('Invalid month 13');
        expect(() => Utils.month_to_quarter(0)).toThrow('Invalid month 0');
    });

    it('by_quarter_time_diff returns correct diff', () => {
        let left_date = new Date(2015, 8, 23); // Q3 2015
        let right_date = new Date(2014, 1, 20); // Q1 2014
        expect(Utils.by_quarter_time_diff(left_date, right_date)).toBe(1.5);

        left_date = new Date(2017, 1, 1); // Q1 2017
        right_date = new Date(2017, 1, 15); // Q1 2017
        expect(Utils.by_quarter_time_diff(left_date, right_date)).toBe(0);

        left_date = new Date(2017, 1, 1); // Q1 2017
        right_date = new Date(2018, 1, 15); // Q1 2018
        expect(Utils.by_quarter_time_diff(left_date, right_date)).toBe(1.0);

        left_date = new Date(2017, 1, 1); // Q1 2017
        right_date = new Date(2023, 11, 20); // Q4 2023
        expect(Utils.by_quarter_time_diff(left_date, right_date)).toBe(6.75);
    });

    it('date_to_epoch returns correct epoch', () => {
        // UTC
        expect(Utils.date_to_epoch('Sep 30, 2010')).toBe(1285804800);
        // UTC with time
        expect(Utils.date_to_epoch('Sep 30, 2010 10:00:00')).toBe(1285804800);
        // No utc, we should get Sep 30, 2010 midnight local time
        // expect(Utils.date_to_epoch('Sep 30, 2010 10:00:00', false)).toBe(1285819200);
        // Don't reset the time, we should get Sep 30, 2010 10:00:00 local time
        expect(Utils.date_to_epoch('Sep 30, 2010 10:00:00', true, false)).toBe(1285840800);
    });

    it('epoch_to_date returns correct date', () => {
        expect(Utils.epoch_to_date(1285804800).getTime()).toBe(new Date(2010, 8, 30).getTime());
        expect(Utils.date_to_epoch(Utils.epoch_to_date(1285804800).getTime())).toBe(1285804800);
    });

    it('parse_number works', () => {
        expect(Utils.parse_number('20K')).toBe(20000);
        expect(Utils.parse_number('20M')).toBe(20000000);
        expect(Utils.parse_number('1.6B')).toBe(1600000000);
        expect(Utils.parse_number('$200M')).toBe(200000000);
        expect(Utils.parse_number('(200)')).toBe(-200);
        expect(Utils.parse_number('')).toBeUndefined();
        expect(Utils.parse_number(null)).toBeUndefined();
    });

    it('slugify works', () => {
        expect(Utils.slugify('Testing it like a boss @ work')).toBe('testing-it-like-a-boss-work');
    });

    it('parse_integer converts to int', () => {
        expect(Utils.parse_integer('0')).toBe(0);
        expect(Utils.parse_integer('-6')).toBe(-6);
        expect(Utils.parse_integer('7')).toBe(7);
        expect(Utils.parse_integer('+7')).toBe(7);
        expect(Utils.parse_integer('3.142')).toBe(3);
        expect(Utils.parse_integer('five')).toBe(undefined);
    });

    it('mode gives back mode from an arr', () => {
        const arr_a = [1, 23, 1, 23, 654, 78, 3, 1];
        const arr_b = [];
        const arr_c = [false, 'something', undefined, 'something', true];
        const arr_d = ['apple', 'orange', 'apple', 'orange'];
        expect(Utils.mode(arr_a)).toBe(1);
        expect(Utils.mode(arr_b)).toBe(null);
        expect(Utils.mode(arr_c)).toBe('something');
        expect(Utils.mode(arr_d)).toBe('apple');
    });

    // it('gen_comp_fn ', function() {
    //     expect(Utils.gen_comp_fn()).;
    // });

    it('deep_copy_object creates a new instance of object', () => {
        const obj1 = {};
        const obj2 = {a: 'test'};

        expect(Utils.deep_copy_object(obj1)).not.toBe(obj1);
        expect(Utils.deep_copy_object(obj2)).not.toBe(obj2);
    });

    it('deep_copy_references works', () => {
        const ref = ['alpha', 'beta'];
        const arr = [2, 4, ref, {}];
        const copy_of_arr = Utils.deep_copy_references(arr);

        expect(ref).toBe(arr[2]);
        expect(ref).not.toBe(copy_of_arr[2]);

        expect(copy_of_arr).toEqual(arr);
        expect(copy_of_arr).not.toBe(arr);

        const obj = {a: 'apple', an: ['a', 'r', 'r', 'a', 'y']};
        const copy_of_obj = Utils.deep_copy_references(obj);

        expect(copy_of_obj).toEqual(obj);
        expect(copy_of_obj).not.toBe(obj);

        expect(Utils.deep_copy_references(null)).toEqual(null);
    });

    it('return_and_callback runs callback and then returns original value of first argument', () => {
        const callback = jasmine.createSpy('callback');

        const value = 2;
        const ret = Utils.return_and_callback(value, callback);

        expect(ret).toBe(value);

        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(value);
        expect(callback.calls.count()).toEqual(1);

        expect(Utils.return_and_callback(value)).toBe(value);
    });

    it('identity works', () => {
        expect(Utils.identity(true)).toBe(true);
        expect(Utils.identity('sea shells')).toBe('sea shells');
        expect(Utils.identity([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('recursive_get gets value from obj using an array of keys', () => {
        const test_obj = {
            left: false,
            right: false,
            center: {
                past: false,
                present: true,
                future: false,
            },
        };
        expect(Utils.recursive_get(test_obj, ['center', 'present'])).toEqual(true);
    });

    it('args_to_array generates array with arguments', () => {
        const test_fn = function() {
            expect(Utils.args_to_array(arguments)).toEqual([1, 2, 3, false, undefined, 'string']);
        };
        test_fn(1, 2, 3, false, undefined, 'string');
    });

    it('gen_id works', () => {
        expect(Utils.gen_id('293854', '2348', '938')).toEqual('293854->2348->938');
        expect(Utils.gen_id('she', 'sells', 'sea', 'shells')).toEqual('she->sells->sea->shells');
        expect(() => Utils.gen_id()).toThrow('At least 1 arguments are required for gen_id');
    });

    it('html_id works', () => {
        expect(Utils.html_id('ImaginaryId')).toBe('6ff0b025ca844842d95af91dcc546147');
    });

    it('contextual_url works', () => {
        const obj = {
            id1: 1,
            id2: 2,
        };

        const args = {
            url: '<id1>/hello/<id2>',
        };

        expect(Utils.contextual_url(obj, args)).toEqual('#!/1/hello/2');
    });

    it('ensure_css_object returns object', () => {
        expect(Utils.ensure_css_object('my-class other-class')).toEqual({
            'other-class': true,
            'my-class': true,
        });

        expect(Utils.ensure_css_object({})).toEqual({});
        expect(Utils.ensure_css_object({class: true})).toEqual({class: true});
        expect(Utils.ensure_css_object(undefined)).toEqual({});
    });

    it('valid vintage years returns correct range', () => {
        const d_2015 = Date.create('2015-01-01');

        spyOn(Date, 'create').and.returnValue(d_2015);

        expect(Utils.valid_vintage_years()).toContain(1972);
        expect(Utils.valid_vintage_years()).toContain(2020);
        expect(Utils.valid_vintage_years(2)).not.toContain(2020);
        expect(Utils.valid_vintage_years(2)).toContain(2017);
        expect(Utils.valid_vintage_years()).toContain(2015);
        expect(Utils.valid_vintage_years()).toContain(1980);
        expect(Utils.valid_vintage_years()).not.toContain(2021);
    });

    it('current year returns correct year', () => {
        const d_2015 = Date.create('2015-01-01').setUTC(true);

        spyOn(Date, 'create').and.returnValue(d_2015);

        expect(Utils.current_year()).toEqual(2015);
    });

    it('current month returns correct month', () => {
        const d_2015 = Date.create('2015-01-01').setUTC(true);

        spyOn(Date, 'create').and.returnValue(d_2015);

        expect(Utils.current_month()).toEqual(0);
    });

    // it('epoch returns correct unix timestamp', () => {
    //     let d_2015 = Date.create('2015-01-01').setUTC(true).reset('day');

    //     spyOn(Date, 'create').and.returnValue(d_2015);

    //     expect(Utils.epoch()).toEqual(1420070400000);
    // });

    it('is_str works', () => {
        expect(Utils.is_str('')).toBe(true);
        expect(Utils.is_str('Hello')).toBe(true);

        expect(Utils.is_str(1)).toBe(false);
        expect(Utils.is_str(true)).toBe(false);
        expect(Utils.is_str(1.0)).toBe(false);
        expect(Utils.is_str(undefined)).toBe(false);
        expect(Utils.is_str(null)).toBe(false);
        expect(Utils.is_str({})).toBe(false);
        expect(Utils.is_str([])).toBe(false);
    });

    it('is_set works', () => {
        expect(Utils.is_set(4)).toBe(true);
        expect(Utils.is_set(4, true)).toBe(true);
        expect(Utils.is_set('hello')).toBe(true);
        expect(Utils.is_set(0)).toBe(true);
        expect(Utils.is_set(null)).toBe(false);
        expect(Utils.is_set(undefined)).toBe(false);
        expect(Utils.is_set([])).toBe(true);
        expect(Utils.is_set([], true)).toBe(false);
        expect(Utils.is_set({})).toBe(true);
        expect(Utils.is_set({}, true)).toBe(false);
    });

    it('is_any_set works', () => {
        expect(Utils.is_any_set([4, 2])).toBe(true);
        expect(Utils.is_any_set([])).toBe(false);
        expect(Utils.is_any_set([[], [], []])).toBe(true);
        expect(Utils.is_any_set([[], [], []], true)).toBe(false);
        expect(Utils.is_any_set([[], ['value'], []])).toBe(true);
        expect(Utils.is_any_set([[], ['value'], []], true)).toBe(true);
        expect(Utils.is_any_set([{}, {}])).toBe(true);
        expect(Utils.is_any_set([{}, {}], true)).toBe(false);
    });

    it('unescape_html works', () => {
        expect(Utils.unescape_html('&amp; &gt; &lt; &quot;')).toEqual('& > < "');

        expect(Utils.unescape_html(null)).toBe(null);
        expect(Utils.unescape_html(undefined)).toBe(undefined);

        expect(Utils.unescape_html(1)).toEqual(1);
        expect(Utils.unescape_html(1.0)).toEqual(1.0);
        expect(Utils.unescape_html([])).toEqual([]);
        expect(Utils.unescape_html({})).toEqual({});
    });

    it('match_array matches correctly', () => {
        const match = function(array) {
            return Utils.match_array(
                array,
                [1, 2, (third, fourth) => third + fourth],
                [3, 4, third => third],
                [
                    (...arr) => {
                        throw `Invalid array [${arr}]`;
                    },
                ],
            );
        };

        expect(match([1, 2, 3, 4])).toEqual(7); // 3 + 4
        expect(match([3, 4, 10])).toEqual(10);
        expect(() => match([6, 5])).toThrow('Invalid array [6,5]');

        const match_with_regexp = function(array) {
            return Utils.match_array(
                array,
                [1, /.+/, 3, (second, fourth) => second + fourth],
                [2, /\d/, /\d/, 5, (second, third, sixth) => second + third + sixth],
                [() => 0],
            );
        };

        expect(match_with_regexp([1, 2, 3, 4])).toEqual(6); // 2 + 4
        expect(match_with_regexp([2, 3, 4, 5, 6])).toEqual(13); // 3 + 4 + 6
        expect(match_with_regexp([6, 5])).toEqual(0);

        const match_with_default_passthrough = function(array) {
            return Utils.match_array(array, [1, 3, third => third], [(...args) => args]);
        };

        expect(match_with_default_passthrough([1, 3, 5])).toEqual(5);
        expect(match_with_default_passthrough([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);

        const match_url = function(array) {
            return Utils.match_array(
                array,
                ['analytics', 'bison', id => `/fund/net/${id}`],
                ['analytics', 'fund', (cf_type, id) => `/fund/${cf_type}/${id}`],
                ['analytics', 'portfolio', (cf_type, id) => `/portfolio/${cf_type}/${id}`],
                ['analytics', /.+/, (other, id) => `/${other}/${id}`],
                ['analytics', () => '/search'],
                [() => '/not-found'],
            );
        };

        expect(match_url(['analytics', 'bison', 100])).toEqual('/fund/net/100');
        expect(match_url(['analytics', 'fund', 'net', 'hello'])).toEqual('/fund/net/hello');
        expect(match_url(['analytics', 'fund', 'gross', 200])).toEqual('/fund/gross/200');
        expect(match_url(['analytics', 'portfolio', 'net', 150])).toEqual('/portfolio/net/150');
        expect(match_url(['analytics', 'portfolio', 'gross', 'dat_portfolio'])).toEqual(
            '/portfolio/gross/dat_portfolio',
        );
        expect(match_url(['analytics', 'presentation', 200])).toEqual('/presentation/200');
        expect(match_url(['analytics'])).toEqual('/search');
        expect(match_url([])).toEqual('/not-found');

        const match_with_tricky_wildcards = function(array) {
            return Utils.match_array(
                array,
                [
                    'funds',
                    /.+/,
                    'analytics',
                    (uid, mode) => {
                        return ['analytics', uid, mode];
                    },
                ],
                [
                    'funds',
                    RegExps.uuid,
                    RegExps.uuid,
                    (fund_uid, investor_uid) => {
                        return ['report', fund_uid, investor_uid];
                    },
                ],
                [
                    'funds',
                    /.+/,
                    uid => {
                        return ['entity', uid];
                    },
                ],
                [
                    'funds',
                    () => {
                        return ['search'];
                    },
                ],
            );
        };

        expect(match_with_tricky_wildcards(['funds'])).toEqual(['search']);
        expect(match_with_tricky_wildcards(['funds', '<uid>'])).toEqual(['entity', '<uid>']);
        expect(
            match_with_tricky_wildcards([
                'funds',
                '5ee753c6-fab5-400d-9069-126c18341ff0',
                '2673fed6-706d-4fb0-9b61-cd28846fdb69',
            ]),
        ).toEqual([
            'report',
            '5ee753c6-fab5-400d-9069-126c18341ff0',
            '2673fed6-706d-4fb0-9b61-cd28846fdb69',
        ]);
        expect(match_with_tricky_wildcards(['funds', '<uid>', 'analytics'])).toEqual([
            'analytics',
            '<uid>',
            undefined,
        ]);
        expect(match_with_tricky_wildcards(['funds', '<uid>', 'analytics', 'pme'])).toEqual([
            'analytics',
            '<uid>',
            'pme',
        ]);
    });

    it('enum_filter_mapping maps correctly', () => {
        const filter_map = [
            {
                uid: '0',
                identifier: 'F0',
                members: [
                    {uid: '0-0', name: 'F0-0'},
                    {uid: '0-1', name: 'F0-1'},
                ],
            },
            {
                uid: '1',
                identifier: 'F1',
                members: [{uid: '1-0', name: 'F1-0'}],
            },
            {
                uid: '2',
                identifier: 'F2',
                members: [
                    {uid: '2-0a', name: 'F2-0A'},
                    {uid: '2-1a', name: 'F2-1A'},
                    {uid: '2-0b', name: 'F2-0B'},
                    {uid: '2-1b', name: 'F2-1B'},
                    {uid: '2-2b', name: 'F2-2B'},
                ],
            },
        ];
        let active_filters = [];

        // TEST 1
        active_filters = [
            {uid: '0', value: {root: ['0-0'], children: {'0-0': ['0-1']}}},
            {uid: '1', value: {root: ['1-0'], children: {}}},
        ];
        expect(Utils.enum_filter_mapping(active_filters, filter_map)).toEqual({
            F0: [
                {
                    name: 'F0-0',
                    members: ['F0-1'],
                },
            ],
            F1: [{name: 'F1-0', members: []}],
        });

        // TEST 2
        active_filters = [
            {uid: '0', value: {root: ['0-0'], children: {'0-0': ['0-2']}}},
            {
                uid: '2',
                value: {
                    root: ['2-0a', '2-0b'],
                    children: {
                        '2-0a': ['2-1a'],
                        '2-0b': ['2-1b', '2-2b'],
                    },
                },
            },
        ];
        expect(Utils.enum_filter_mapping(active_filters, filter_map)).toEqual({
            F0: [
                {
                    name: 'F0-0',
                    members: [],
                },
            ],
            F2: [
                {name: 'F2-0A', members: ['F2-1A']},
                {name: 'F2-0B', members: ['F2-1B', 'F2-2B']},
            ],
        });
    });

    it('years_diff calculates number of years correctly', () => {
        const start = new Date(1475675903 * 1000);
        let end = new Date(1507211938 * 1000);

        expect(Utils.years_diff(start, end)).toEqual(0.9993374255972752);
        expect(Utils.years_diff(end, start)).toEqual(-0.9993374255972752);

        end = new Date(1728136738 * 1000);
        expect(Utils.years_diff(start, end)).toEqual(8.000175226288324);
    });

    it('find_first_in_current_trend finds correct trend', () => {
        let base = [];
        let relative_data = [];

        // TEST 1
        base = [
            {time: 0, value: 2},
            {time: 1, value: 5},
            {time: 2, value: 7},
        ];
        relative_data = [
            {time: 0, value: 3},
            {time: 1, value: 4},
            {time: 2, value: 6},
        ];
        expect(Utils.find_first_in_current_trend(base, relative_data)).toEqual({
            trend: 'above',
            value: 5,
            time: 1,
            since_start: false,
        });

        // TEST 2
        base = [
            {time: 0, value: 5},
            {time: 1, value: 3},
            {time: 2, value: 7},
        ];
        relative_data = [
            {time: 0, value: 3},
            {time: 1, value: 6},
            {time: 2, value: 6},
        ];
        expect(Utils.find_first_in_current_trend(base, relative_data)).toEqual({
            trend: 'above',
            value: 7,
            time: 2,
            since_start: false,
        });

        // TEST 3
        base = [
            {time: 0, value: 7},
            {time: 1, value: 2},
            {time: 2, value: 5},
        ];
        relative_data = [
            {time: 0, value: 3},
            {time: 1, value: 6},
            {time: 2, value: 6},
        ];
        expect(Utils.find_first_in_current_trend(base, relative_data)).toEqual({
            trend: 'at or below',
            value: 2,
            time: 1,
            since_start: false,
        });

        // TEST 4
        base = [
            {time: 0, value: 3},
            {time: 1, value: 6},
            {time: 2, value: 6},
        ];
        relative_data = [
            {time: 0, value: 3},
            {time: 1, value: 6},
            {time: 2, value: 6},
        ];
        expect(Utils.find_first_in_current_trend(base, relative_data)).toEqual({
            trend: 'at or below',
            value: 3,
            time: 0,
            since_start: true,
        });

        // TEST 5
        base = [
            {time: 0, value: 4},
            {time: 1, value: 7},
            {time: 2, value: 7},
        ];
        relative_data = [
            {time: 0, value: 3},
            {time: 1, value: 6},
            {time: 2, value: 6},
        ];
        expect(Utils.find_first_in_current_trend(base, relative_data)).toEqual({
            trend: 'above',
            value: 4,
            time: 0,
            since_start: true,
        });
    });

    it('find_moved_above_relative to find correct datapoint', () => {
        let base = [];
        let relative_data = [];

        // TEST 1
        base = [
            {value: 8, time: 8},
            {value: 6, time: 6},
            {value: 3, time: 5},
            {value: 7, time: 4},
        ];
        relative_data = [
            {value: 7, time: 8},
            {value: 5, time: 6},
            {value: 4, time: 5},
            {value: 3, time: 4},
        ];
        expect(Utils.find_moved_above_relative(base, relative_data)).toEqual(1);

        // TEST 2
        base = [
            {value: 8, time: 8},
            {value: 6, time: 6},
        ];
        relative_data = [
            {value: 7, time: 8},
            {value: 5, time: 6},
        ];
        expect(Utils.find_moved_above_relative(base, relative_data)).toEqual(1);

        // TEST 3
        base = [
            {value: 3, time: 8},
            {value: 5, time: 6},
        ];
        relative_data = [
            {value: 7, time: 8},
            {value: 5, time: 6},
        ];
        expect(Utils.find_moved_above_relative(base, relative_data)).toEqual(-1);

        // TEST 3
        base = [
            {value: 8, time: 8},
            {value: 3, time: 6},
        ];
        relative_data = [
            {value: 5, time: 8},
            {value: 5, time: 6},
        ];
        expect(Utils.find_moved_above_relative(base, relative_data)).toEqual(0);
    });

    it('default_value behaves correctly', () => {
        expect(Utils.default_value(undefined, [])).toEqual([]);
        expect(Utils.default_value(null, [])).toEqual(null);
        expect(Utils.default_value(false, true)).toEqual(false);
        expect(Utils.default_value(undefined, true)).toEqual(true);
    });

    it('ensure_array behaves correctly', () => {
        expect(Utils.ensure_array([])).toEqual([]);
        expect(Utils.ensure_array([1, 2, 3])).toEqual([1, 2, 3]);
        expect(Utils.ensure_array(1)).toEqual([1]);
        expect(Utils.ensure_array({})).toEqual([{}]);
        expect(Utils.ensure_array(null)).toEqual([]);
        expect(Utils.ensure_array(undefined)).toEqual([]);
        expect(Utils.ensure_array(false)).toEqual([false]);
    });

    it('joinUrl behaves correctly', () => {
        expect(Utils.joinUrl('a', 'b', 'c')).toEqual('a/b/c');
        expect(Utils.joinUrl('a/', '/b/', '/c')).toEqual('a/b/c');
        expect(Utils.joinUrl('/a/', '/b/', '/c')).toEqual('/a/b/c');
        expect(Utils.joinUrl('/a/', '/b/', '/c/')).toEqual('/a/b/c/');
    });
    it('deepGet', () => {
        expect(Utils.deepGet({}, ['first'])).toEqual(undefined);
        expect(Utils.deepGet({}, ['first'], 5)).toEqual(5);
        expect(Utils.deepGet({first: 'second'}, ['first'])).toEqual('second');
        expect(Utils.deepGet({first: {second: 'third'}}, ['first', 'second'])).toEqual('third');
        expect(Utils.deepGet({first: {second: false}}, ['first', 'second'])).toEqual(false);
        expect(Utils.deepGet({first: {second: null}}, ['first', 'second'])).toEqual(null);
        expect(Utils.deepGet({first: {second: null}}, ['first', 'second'], 5)).toEqual(null);
        expect(
            Utils.deepGet({first: {second: null}}, ['first', 'second'], 5, v => v === null),
        ).toEqual(5);
        expect(Utils.deepGet({first: {second: 'third'}}, ['second'])).toEqual(undefined);
    });

    it('objectId returns same id for same reference', () => {
        expect(Utils.objectId({}) === Utils.objectId({})).toBe(false);

        const a = {};
        const b = {};

        expect(Utils.objectId(a) === Utils.objectId(b)).toBe(false);
        expect(Utils.objectId(a) === Utils.objectId(a)).toBe(true);

        const c = function() {};
        const d = function() {};

        expect(Utils.objectId(c) === Utils.objectId(d)).toBe(false);
        expect(Utils.objectId(c) === Utils.objectId(c)).toBe(true);

        const deep = {a, b};

        expect(Utils.objectId(deep.a) === Utils.objectId(a)).toBe(true);
        expect(Utils.objectId(deep.b) === Utils.objectId(b)).toBe(true);

        expect(Utils.objectId(null) === Utils.objectId(null)).toBe(true);
    });
});
