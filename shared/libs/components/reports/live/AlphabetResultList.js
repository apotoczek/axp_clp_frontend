/* Automatically transformed from AMD to ES6. Beware of code smell. */
import ko from 'knockout';
import BaseComponent from 'src/libs/components/basic/BaseComponent';
import Observer from 'src/libs/Observer';
import * as Formatters from 'src/libs/Formatters';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_template(`
            <div data-bind="visible: loading, template: {
                name: 'tpl_data_table_default_loading',
                data: $data,
            }"></div>
            <!-- ko if:!loading() -->
                <div class="row" data-bind="css:css">
                    <div class="vr-right-double">
                        <div class="alphabet-list vr-right" data-bind="foreach:alphabet">
                            <div class="pull-right" style="width:100%">
                            <div class="text-center" data-bind="text:letter, click:$parent.scroll_to($data), css:{enabled:enabled}"></div>
                            </div>
                        </div>
                    </div>
                    <div id="alphabet-list-results" class="col-xs-11" data-bind="foreach:list, lazy:{itemHeight:35}" style="height:524px; overflow:scroll;">
                        <div class="clearfix clickable dark-zebra" data-bind="click:$parent.click_row, css:{'odd-dark-zebra':zebra == 'odd', 'even-dark-zebra':zebra == 'even'}">
                            <span data-bind="html: name, css:css"></span>
                            <!--ko if:$data.entity_type && $parent.show_entity_type-->
                                <span class="pull-right" style="font-style:italic" data-bind="text:$parent.titleize(entity_type)"></span>
                            <!-- /ko -->
                        </div>
                    </div>
                </div>
            <!-- /ko -->
        `);

    self.dfd = self.new_deferred();
    self.show_entity_type = opts.show_entity_type || false;
    self.alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
        return {
            letter: letter,
            enabled: ko.observable(false),
        };
    });

    self.scroll_to = function(data) {
        let id = data.letter;
        if (data.enabled) {
            return function() {
                let container = document.getElementById('alphabet-list-results');
                container.scrollTop = self.offsets[id];
            };
        }
    };

    self.count = ko.computed(() => {
        let data = self.data();
        let id = self.get_id();
        if (data && typeof data.count === 'number') {
            Observer.broadcast_for_id(id, 'AlphabetResultList.count', data.count);

            return data.count;
        }

        return 0;
    });

    self.calculate_alphabet_map = ko.computed(() => {
        let alphabet_map = {'#': []};
        self.offsets = {
            '#': 0,
        };
        if (self.data() && self.data().results) {
            let data = self.data().results.sortBy('name');
            let prev_letter = '';
            for (let i = 0, l = data.length; i < l; i++) {
                let result = data[i];
                let letter = result.name[0].toUpperCase();

                if (letter != prev_letter && letter >= 'A') {
                    self.offsets[letter] = i * 35;
                }
                // if(letter == 'A' && prev_letter != 'A')
                //     self.offsets[letter] = i * 35

                if (letter < 'A') {
                    alphabet_map['#'].push(result);
                } else {
                    if (alphabet_map[letter]) {
                        alphabet_map[letter].push(result);
                    } else {
                        alphabet_map[letter] = [result];
                    }
                }

                prev_letter = letter;
            }
        }

        self.alphabet.map(obj => {
            if (alphabet_map[obj.letter] && alphabet_map[obj.letter].length > 0) {
                obj.enabled(true);
            } else {
                obj.enabled(false);
            }
        });

        return alphabet_map;
    });

    self.list = ko.computed(() => {
        let data = self.data();

        if (data && data.results) {
            return data.results.map((n, idx) => {
                if (idx % 2 === 0) {
                    n.zebra = 'even';
                } else {
                    n.zebra = 'odd';
                }
                n.css = n.entity_type == 'fund' ? 'fund-entity' : 'investor-entity';
                return n;
            });
        }

        return [];
    });

    self.titleize = Formatters.titleize;

    self.click_row = function(row) {
        Observer.broadcast_for_id(self.get_id(), 'AlphabetResultList.click_row', row);
    };

    self.dfd.resolve();

    return self;
}
