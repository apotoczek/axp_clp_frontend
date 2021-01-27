import specEngine from 'src/react/libs/spec-engine';

const customMatchers = {
    toEqualSpec: (utils, customEqualityTesters) => ({
        compare: (actual, expected) => {
            function compareCompSpecs(left, right) {
                left = JSON.parse(JSON.stringify(left));
                right = JSON.parse(JSON.stringify(right));
                delete left.children;
                delete left.fromRepeatIn;
                delete left.repeatIds;

                delete right.children;
                delete right.fromRepeatIn;
                delete right.repeatIds;

                return utils.equals(left, right, customEqualityTesters);
            }

            // Just to be sure, we deep copy both the values first since we're
            // modifying them later
            actual = JSON.parse(JSON.stringify(actual));
            expected = JSON.parse(JSON.stringify(expected));

            const res = {};
            if (!actual || !expected) {
                res.pass = actual === expected;
                res.message = !res.pass
                    ? oneLine`
                    Expected both actual and expected to be defined or equal
                `
                    : '';
                return res;
            }

            // Expect there to be the same amount of components in both
            // specifications.
            const actualComponentIds = Object.keys(actual);
            const expectedComponentIds = Object.keys(expected);
            res.pass = actualComponentIds.length === expectedComponentIds.length;
            if (!res.pass) {
                res.message = oneLine`
                    Expected number of components in both specs to be the same
                    (Expected: ${expectedComponentIds.length},
                    Actual: ${actualComponentIds.length})
                `;
                return res;
            }

            const repeatersToCompare = {};
            for (const [expectedCompId, expectedCompSpec] of Object.entries(expected)) {
                // If this component was repeated, the uid is not going to be
                // the same, but we compare them anyway when we add the repeat
                // ids to repeatersToCompare later in this loop for non repeated
                // components
                if (expectedCompSpec.fromRepeatIn) {
                    continue;
                }
                const actualCompSpec = actual[expectedCompId];

                res.pass = compareCompSpecs(expectedCompSpec, actualCompSpec);
                if (!res.pass) {
                    res.message = oneLine`
                        Expected ${JSON.stringify(actualCompSpec)}
                        to be ${JSON.stringify(expectedCompSpec)}
                    `;
                    return res;
                }

                if (expectedCompSpec.repeatIds) {
                    for (const repeatId of expectedCompSpec.repeatIds || []) {
                        repeatersToCompare[repeatId] = new Set([
                            ...(repeatersToCompare[repeatId] || new Set()),
                            ...(actualCompSpec.repeatIds || []),
                        ]);
                    }
                }

                if (actualCompSpec.repeatIds) {
                    for (const repeatId of actualCompSpec.repeatIds || []) {
                        repeatersToCompare[repeatId] = new Set([
                            ...(repeatersToCompare[repeatId] || new Set()),
                            ...(expectedCompSpec.repeatIds || []),
                        ]);
                    }
                }
            }

            for (const [repeaterId, idsToCompareAgainst] of Object.entries(repeatersToCompare)) {
                res.pass = Array.from(idsToCompareAgainst).some(id => {
                    if (id in expected) {
                        return compareCompSpecs(expected[id], actual[repeaterId]);
                    } else if (id in actual) {
                        return compareCompSpecs(expected[repeaterId], actual[id]);
                    }

                    res.message = oneLine`
                        Found a component id ${id} to compare that was not in
                        the actual nor expected specification.
                    `;

                    return false;
                });

                if (!res.pass) {
                    // TODO Proper error messages at this error
                    res.message = oneLine`
                        Found a repeater part of the spec that was not identical
                    `;
                    return res;
                }
            }
            res.pass = true;
            return res;
        },
    }),
    toEqualEndpoints: utils => ({
        compare: (actual, expected) => {
            const res = {pass: true};

            res.pass = actual.length === expected.length;
            if (!res.pass) {
                res.message = oneLine`
                    Different number of endpoints in actual (${actual.length})
                    and expected (${expected.length}).
                `;
                return res;
            }

            for (const [actualEndpoint, expectedEndpoint] of actual.zip(expected)) {
                res.pass = actualEndpoint.endpoint === expectedEndpoint.endpoint;
                if (!res.pass) {
                    res.message = oneLine`
                        Expected ${actualEndpoint.endpoint} to equal ${expectedEndpoint.endpoint}
                    `;
                    return res;
                }

                res.pass = utils.equals(actualEndpoint.params, expectedEndpoint.params);
                if (!res.pass) {
                    res.message = oneLine`
                        Expected ${JSON.stringify(actualEndpoint.params)}
                        to equal ${JSON.stringify(expectedEndpoint.params)}
                    `;
                    return res;
                }
            }

            return res;
        },
    }),
};

describe('specEngine', () => {
    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('swapFiller', () => {
        it('swaps array fillers', () => {
            const fillers = {
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            };

            const swappedFillers = specEngine.swapFiller(
                'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                'e99d3c02-28cb-4742-be10-9667cbe3226d',
                fillers,
            );

            expect(swappedFillers).toEqual({
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        'e99d3c02-28cb-4742-be10-9667cbe3226d', // Replaced
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['e99d3c02-28cb-4742-be10-9667cbe3226d'], // Replaced
                    },
                },
            });
        });

        it('swaps string fillers', () => {
            const fillers = {
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            };

            const swappedFillers = specEngine.swapFiller(
                '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                'e99d3c02-28cb-4742-be10-9667cbe3226d',
                fillers,
            );

            expect(swappedFillers).toEqual({
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: 'e99d3c02-28cb-4742-be10-9667cbe3226d', // Replaced
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            });
        });
    });

    describe('removeFiller', () => {
        it('removes a single uuid from the fillers', () => {
            const fillers = {
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            };

            const swappedFillers = specEngine.removeFiller(
                '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                fillers,
            );

            expect(swappedFillers).toEqual({
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    // entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45', // Removed
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            });
        });

        it('removes multiple instances of the same uuid from the fillers', () => {
            const fillers = {
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: [
                            'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                            'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                        ],
                    },
                },
            };

            const swappedFillers = specEngine.removeFiller(
                'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                fillers,
            );

            expect(swappedFillers).toEqual({
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: [
                        // 'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79', // Removed
                        'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                    ],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: [
                            // 'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79', // Removed
                            'b5a2e6da-7204-4e24-a1ba-3042b1f49846',
                        ],
                    },
                },
            });
        });

        it('removes empty object and arrays', () => {
            const fillers = {
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                    values: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                },
                '038b2aa2-6625-420d-bfad-6410ea26d7a1': {
                    values: {
                        rootEntities: ['ae964bbf-dd85-44f5-b8d4-c4e49ab62c79'],
                    },
                },
            };

            const swappedFillers = specEngine.removeFiller(
                'ae964bbf-dd85-44f5-b8d4-c4e49ab62c79',
                fillers,
            );

            expect(swappedFillers).toEqual({
                'a5c24aae-42ea-4155-95ad-ec036232ab2b': {
                    entityId: '4de96f1d-cebb-48df-8c2a-0b871f17ea45',
                },
            });
        });
    });

    // describe('insertEntityFillers', () => {
    //     it('fills data spec component entity uids properly', () => {
    //         const dataSpecFillers = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 entityId: '7a52463b-d537-4ba3-9e66-14f2951b82fd'
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 entityId: 'c85b576e-972f-4a6c-88e0-1fb20f852db4'
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 entityId: '90b61497-a597-4740-a20b-85edbed92a2b'
    //             },
    //         };
    //         const savedDataSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 parent: null,
    //                 entity: {
    //                     type: 'portfolio',
    //                 }
    //             },
    //             '96234ea7-c52e-4bd8-bc5c-7cca9cd9a529': {
    //                 parent: null,
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 parent: null,
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 values: {
    //                     '8aa05252-cd4b-4457-bb2d-3ac285412160': {
    //                         key: 'allocations',
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };
    //         const expectedResult = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 parent: null,
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '7a52463b-d537-4ba3-9e66-14f2951b82fd',
    //                 }
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 parent: null,
    //                 entity: {
    //                     uid: 'c85b576e-972f-4a6c-88e0-1fb20f852db4',
    //                 },
    //             },
    //             '96234ea7-c52e-4bd8-bc5c-7cca9cd9a529': {
    //                 parent: null,
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 values: {
    //                     '8aa05252-cd4b-4457-bb2d-3ac285412160': {
    //                         key: 'allocations',
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         let filledOutSpec = specEngine.insertEntityFillers(
    //             dataSpecFillers,
    //             savedDataSpec,
    //         );

    //         expect(filledOutSpec).toEqualSpec(expectedResult);
    //     });

    //     it('fills component value entity uids properly', () => {
    //         const dataSpecFillers = {
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 values: {
    //                     '3617cb89-3a27-49f6-a8fc-35da37f307f9': [
    //                         'cb2c9788-e6ee-49cc-a7a0-93a4ffb74465'
    //                     ]
    //                 }
    //             },
    //             '42ea1b8a-23b3-4da4-a7a8-706083eb64c0': {
    //                 values: {
    //                     'f7e4fb0c-3de4-4892-beb3-f732a8a65c89': [
    //                         '2b873129-0413-4328-8e95-d8e17d147a31',
    //                         'a2679680-51ba-4cbc-a2dd-e593a73dfc21',
    //                     ]
    //                 }
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': [
    //                         'eaa91eb8-f1e9-4e97-a2b5-ef6034ca6d51',
    //                         '7c8a2b52-5b87-47d5-bd1b-87a5a1c2107c',
    //                     ],
    //                 }
    //             },
    //             'e10dc073-902c-45b7-8243-39458ca23e3b': {
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': {
    //                         entities: [
    //                             '7683d850-f58b-4539-b605-b670863f90d3',
    //                             'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                         ],
    //                         rootEntities: [
    //                             '7683d850-f58b-4539-b605-b670863f90d3',
    //                             'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                         ],
    //                     },
    //                 }
    //             }
    //         };

    //         const savedDataSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 entity: {type: 'portfolio'}
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 values: {
    //                     '3617cb89-3a27-49f6-a8fc-35da37f307f9': {
    //                         key: 'navs',
    //                         type: 'raw',
    //                         entities: [{type: 'portfolio'}],
    //                     }
    //                 },
    //             },
    //             '42ea1b8a-23b3-4da4-a7a8-706083eb64c0': {
    //                 values: {
    //                     'f7e4fb0c-3de4-4892-beb3-f732a8a65c89': {
    //                         key: 'navs',
    //                         type: 'raw',
    //                         entities: [{type: 'portfolio'}],
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': {
    //                         key: 'allocations',
    //                         entities: [{type: 'userFund'}, {type: 'userFund'}],
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             'e10dc073-902c-45b7-8243-39458ca23e3b': {
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': {
    //                         type: 'tabular',
    //                         values: [
    //                             {key: 'name', format: 'string'},
    //                             {key: 'irr', format: 'multiple'},
    //                             {key: 'commitment', format: 'currency'},
    //                         ],
    //                         entities: [{type: 'userFund'}, {type: 'userFund'}],
    //                         rootEntities: [{type: 'userFund'}, {type: 'userFund'}],
    //                     },
    //                 },
    //             },
    //         };

    //         const expectedResult = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 entity: {type: 'portfolio'},
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 values: {
    //                     '3617cb89-3a27-49f6-a8fc-35da37f307f9': {
    //                         key: 'navs',
    //                         type: 'raw',
    //                         entities: [{
    //                             type: 'portfolio',
    //                             uid: 'cb2c9788-e6ee-49cc-a7a0-93a4ffb74465',
    //                         }],
    //                     }
    //                 },
    //             },
    //             '42ea1b8a-23b3-4da4-a7a8-706083eb64c0': {
    //                 values: {
    //                     'f7e4fb0c-3de4-4892-beb3-f732a8a65c89': {
    //                         key: 'navs',
    //                         type: 'raw',
    //                         entities: [{
    //                             type: 'portfolio',
    //                             uid: '2b873129-0413-4328-8e95-d8e17d147a31',
    //                         }, {
    //                             uid: 'a2679680-51ba-4cbc-a2dd-e593a73dfc21',
    //                         }],
    //                     },
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': {
    //                         key: 'allocations',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: 'eaa91eb8-f1e9-4e97-a2b5-ef6034ca6d51',
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '7c8a2b52-5b87-47d5-bd1b-87a5a1c2107c',
    //                         }],
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             'e10dc073-902c-45b7-8243-39458ca23e3b': {
    //                 values: {
    //                     '55927fba-dfcf-46b2-a273-ac8f19dc6377': {
    //                         type: 'tabular',
    //                         values: [
    //                             {key: 'name', format: 'string'},
    //                             {key: 'irr', format: 'multiple'},
    //                             {key: 'commitment', format: 'currency'},
    //                         ],
    //                         entities: [
    //                             {
    //                                 type: 'userFund',
    //                                 uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                             },
    //                             {
    //                                 type: 'userFund',
    //                                 uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                             },
    //                         ],
    //                         rootEntities: [
    //                             {
    //                                 type: 'userFund',
    //                                 uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                             },
    //                             {
    //                                 type: 'userFund',
    //                                 uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                             },
    //                         ],
    //                     },
    //                 },
    //             },
    //         };

    //         let filledOutSpec = specEngine.insertEntityFillers(
    //             dataSpecFillers,
    //             savedDataSpec,
    //         );

    //         expect(filledOutSpec).toEqualSpec(expectedResult);
    //     });
    // });

    // describe('extractComponentRepeaters', () => {
    //     it('extract component reapeaters properly', () => {
    //         const derivedSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 children: [
    //                     'df02440f-bb19-4ca2-b9f8-e0f788100b1c',
    //                     'cba28962-32af-4271-bce0-19b62ffb6822',
    //                     '3544085d-ec3f-4007-b10e-9470db2ceb86',
    //                     '22e15e03-4a12-457b-be54-10167d6ce994',
    //                 ],
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 repeatFor: 'companies',
    //                 entity: {
    //                     type: 'company',
    //                     uid: '4b966bba-972e-405e-b0b0-7774d3c7874f'
    //                 },
    //                 values: {
    //                     '21046bd8-e9fc-4e85-8d89-c2fba11afe2b': {
    //                         key: 'navs',
    //                         entities: [{type: 'portfolio'}],
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 repeatFor: 'userFunds',
    //                 repeatIds: [
    //                     '3544085d-ec3f-4007-b10e-9470db2ceb86',
    //                     '22e15e03-4a12-457b-be54-10167d6ce994',
    //                 ],
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: 'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                 },
    //                 values: {
    //                     '5872ea29-8457-4c36-929d-a8e2da3ec674': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             '3544085d-ec3f-4007-b10e-9470db2ceb86': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 fromRepeatIn: 'cba28962-32af-4271-bce0-19b62ffb6822',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                 },
    //                 values: {
    //                     '005e08a6-af49-483a-9d4d-62e75e5ad42f': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             '22e15e03-4a12-457b-be54-10167d6ce994': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 fromRepeatIn: 'cba28962-32af-4271-bce0-19b62ffb6822',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '8106b575-b097-4d15-819d-a759f219ec78',
    //                 },
    //                 values: {
    //                     '4ec4b94a-1dda-441d-831e-95727b554a25': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     }
    //                 },
    //             }
    //         };

    //         let expectedResult = {
    //             'cba28962-32af-4271-bce0-19b62ffb6822': [
    //                 '3544085d-ec3f-4007-b10e-9470db2ceb86',
    //                 '22e15e03-4a12-457b-be54-10167d6ce994',
    //             ]
    //         };

    //         let extractedRepeaters = specEngine.extractComponentRepeaters(derivedSpec);
    //         expect(extractedRepeaters).toEqual(expectedResult);
    //     });
    // });

    // describe('deriveDataSpec', () => {
    //     it('derives component repeaters properly', () => {
    //         const repeaters = {
    //             '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4': {
    //                 'cba28962-32af-4271-bce0-19b62ffb6822': [
    //                     'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                     '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                     '8106b575-b097-4d15-819d-a759f219ec78',
    //                 ],
    //             },
    //         };

    //         const filledOutSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: ['cba28962-32af-4271-bce0-19b62ffb6822'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 values: {
    //                     '17ff8cb7-b1db-4f53-8eba-6fb4cd987849': {
    //                         key: 'navs',
    //                         entities: [{type: 'portfolio'}],
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 repeatFor: 'userFunds',
    //                 values: {
    //                     'cb9bdbd9-2bc3-40ba-a558-d5d46ec53a37': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         const expectedResult = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: [
    //                     'cba28962-32af-4271-bce0-19b62ffb6822',
    //                     '5be6dfda-7a22-40e9-838b-aadad4b8f40b',
    //                     'bba1bf7b-60a9-49b5-800d-c6a1d0dc285b',
    //                 ],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 values: {
    //                     '17ff8cb7-b1db-4f53-8eba-6fb4cd987849': {
    //                         key: 'navs',
    //                         entities: [{type: 'portfolio'}],
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 repeatFor: 'userFunds',
    //                 repeatIds: [
    //                     '5be6dfda-7a22-40e9-838b-aadad4b8f40b',
    //                     'bba1bf7b-60a9-49b5-800d-c6a1d0dc285b',
    //                 ],
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: 'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                 },
    //                 values: {
    //                     'cb9bdbd9-2bc3-40ba-a558-d5d46ec53a37': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             '5be6dfda-7a22-40e9-838b-aadad4b8f40b': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 fromRepeatIn: 'cba28962-32af-4271-bce0-19b62ffb6822',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                 },
    //                 values: {
    //                     'cb9bdbd9-2bc3-40ba-a558-d5d46ec53a37': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             'bba1bf7b-60a9-49b5-800d-c6a1d0dc285b': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 fromRepeatIn: 'cba28962-32af-4271-bce0-19b62ffb6822',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '8106b575-b097-4d15-819d-a759f219ec78',
    //                 },
    //                 values: {
    //                     'cb9bdbd9-2bc3-40ba-a558-d5d46ec53a37': {
    //                         key: 'allocations',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         let derivedSpec = specEngine.deriveDataSpec(repeaters, filledOutSpec);
    //         expect(derivedSpec).toEqualSpec(expectedResult);
    //     });

    //     it('derives component value repeaters properly', () => {
    //         const repeaters = {
    //             '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4': {
    //                 'd1beb8bf-c8e5-49c2-8823-43c637da5891': [
    //                     'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                     '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                     '8106b575-b097-4d15-819d-a759f219ec78',
    //                 ],
    //                 'b988195e-829c-4e7c-b207-60e75e301e28': [
    //                     '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                 ],
    //             },
    //         };

    //         const filledOutSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: ['cba28962-32af-4271-bce0-19b62ffb6822'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     'd1beb8bf-c8e5-49c2-8823-43c637da5891': {
    //                         key: 'navs',
    //                         repeatFor: 'userFunds',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         label: 'NAVs',
    //                         format: 'currency',
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 values: {
    //                     'b988195e-829c-4e7c-b207-60e75e301e28': {
    //                         key: 'allocations',
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         const expectedResult = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: ['cba28962-32af-4271-bce0-19b62ffb6822'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     'd1beb8bf-c8e5-49c2-8823-43c637da5891': {
    //                         key: 'navs',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: 'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '8106b575-b097-4d15-819d-a759f219ec78',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }],
    //                         repeatFor: 'userFunds',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         label: 'NAVs',
    //                         format: 'currency',
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     'b988195e-829c-4e7c-b207-60e75e301e28': {
    //                         key: 'allocations',
    //                         entities: [{
    //                             type: 'company',
    //                             uid: '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }],
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         let derivedSpec = specEngine.deriveDataSpec(repeaters, filledOutSpec);
    //         expect(derivedSpec).toEqualSpec(expectedResult);
    //     });

    //     it('successfully removes repeated value repeaters on rederiving', () => {
    //         const repeaters = {
    //             '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4': {
    //                 '57d719d4-7f3f-4fe8-a8d9-1c0db20fa4dc': [
    //                     'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                     '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                     '8106b575-b097-4d15-819d-a759f219ec78',
    //                 ],
    //                 '6a0b8d80-9e50-438b-bb37-cc127d289f80': [
    //                     '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                 ],
    //             },
    //         };

    //         const derivedDataSpec = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: ['cba28962-32af-4271-bce0-19b62ffb6822'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     '57d719d4-7f3f-4fe8-a8d9-1c0db20fa4dc': {
    //                         key: 'navs',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: 'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '8106b575-b097-4d15-819d-a759f219ec78',
    //                         }],
    //                         repeatFor: 'userFunds',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         label: 'NAVs',
    //                         format: 'currency',
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     '6a0b8d80-9e50-438b-bb37-cc127d289f80': {
    //                         key: 'allocations',
    //                         entities: [{
    //                             type: 'company',
    //                             uid: '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                         }],
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             '9313c02c-4d3c-4e26-99fe-f3ccab1c179a': {
    //                 children: ['09c97069-1801-4ce1-a5c9-ef8853380d13'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '118c062d-fb85-4c49-9a44-2eff4360b57d',
    //                 },
    //             },
    //             '09c97069-1801-4ce1-a5c9-ef8853380d13': {
    //                 parent: '9313c02c-4d3c-4e26-99fe-f3ccab1c179a',
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '118c062d-fb85-4c49-9a44-2eff4360b57d',
    //                 },
    //                 values: {
    //                     'ad911d8b-eff1-42bf-aed4-3059a5250d0a': {
    //                         key: 'allocations',
    //                         entities: [{
    //                             type: 'company',
    //                             uid: '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                         }],
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         const expectedResult = {
    //             '3244e8a6-86e0-483d-933b-38e14fb37d39': {
    //                 children: ['cba28962-32af-4271-bce0-19b62ffb6822'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //             },
    //             'df02440f-bb19-4ca2-b9f8-e0f788100b1c': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     '57d719d4-7f3f-4fe8-a8d9-1c0db20fa4dc': {
    //                         key: 'navs',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: 'f97eb0f2-15df-11e8-b642-0ed5f89f718b',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '4c7b86a8-8d20-4824-a269-fc12fdb784a9',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }, {
    //                             type: 'userFund',
    //                             uid: '8106b575-b097-4d15-819d-a759f219ec78',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }],
    //                         repeatFor: 'userFunds',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         label: 'NAVs',
    //                         format: 'currency',
    //                     }
    //                 },
    //             },
    //             'cba28962-32af-4271-bce0-19b62ffb6822': {
    //                 parent: '3244e8a6-86e0-483d-933b-38e14fb37d39',
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                 },
    //                 values: {
    //                     '6a0b8d80-9e50-438b-bb37-cc127d289f80': {
    //                         key: 'allocations',
    //                         entities: [{
    //                             type: 'company',
    //                             uid: '4b966bba-972e-405e-b0b0-7774d3c7874f',
    //                             repeatFrom: {
    //                                 type: 'portfolio',
    //                                 uid: '2b7b623d-9c69-4ad0-bc3d-78ca5317aed4',
    //                             },
    //                         }],
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //             '9313c02c-4d3c-4e26-99fe-f3ccab1c179a': {
    //                 children: ['09c97069-1801-4ce1-a5c9-ef8853380d13'],
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '118c062d-fb85-4c49-9a44-2eff4360b57d',
    //                 },
    //             },
    //             '09c97069-1801-4ce1-a5c9-ef8853380d13': {
    //                 parent: '9313c02c-4d3c-4e26-99fe-f3ccab1c179a',
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '118c062d-fb85-4c49-9a44-2eff4360b57d',
    //                 },
    //                 values: {
    //                     'ad911d8b-eff1-42bf-aed4-3059a5250d0a': {
    //                         key: 'allocations',
    //                         repeatFor: 'companies',
    //                         type: 'grouped',
    //                         grouping: 'geography',
    //                         label: 'Allocations',
    //                         format: 'percentage',
    //                     },
    //                 },
    //             },
    //         };

    //         let rederivedDataSpec = specEngine.deriveDataSpec(repeaters, derivedDataSpec);
    //         expect(rederivedDataSpec).toEqualSpec(expectedResult);
    //     });

    //     it('successfully removes repeated elements on rederiving', () => {
    //         const repeaters = {
    //             '1b9f81ff-1b27-40d7-9727-ad87a33f7c65': {
    //                 '1aa23e4c-22a2-4044-83a6-136629654cf9': [
    //                     'ee104a73-a836-4be4-ab1f-172b26897c5e',
    //                     '1ccf8c4f-bdfb-4849-8689-a57eb0c31aec',
    //                 ]
    //             }
    //         };

    //         const derivedDataSpec = {
    //             '66f73eee-3e47-4a6d-bf03-048811b8b1d0': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '1b9f81ff-1b27-40d7-9727-ad87a33f7c65',
    //                 },
    //                 children: [
    //                     '1aa23e4c-22a2-4044-83a6-136629654cf9',
    //                     'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4',
    //                     '6a60372a-8600-4737-9e02-08e106727a38',
    //                 ],
    //             },
    //             '1aa23e4c-22a2-4044-83a6-136629654cf9': {
    //                 parent: '66f73eee-3e47-4a6d-bf03-048811b8b1d0',
    //                 repeatIds: [
    //                     'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4',
    //                     '6a60372a-8600-4737-9e02-08e106727a38',
    //                 ],
    //                 repeatFor: 'userFunds',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: 'ee104a73-a836-4be4-ab1f-172b26897c5e',
    //                 }
    //             },
    //             'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4': {
    //                 parent: '66f73eee-3e47-4a6d-bf03-048811b8b1d0',
    //                 fromRepeatIn: '1aa23e4c-22a2-4044-83a6-136629654cf9',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '1ccf8c4f-bdfb-4849-8689-a57eb0c31aec',
    //                 }
    //             },
    //             '6a60372a-8600-4737-9e02-08e106727a38': {
    //                 parent: '66f73eee-3e47-4a6d-bf03-048811b8b1d0',
    //                 fromRepeatIn: '1aa23e4c-22a2-4044-83a6-136629654cf9',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '833617f3-aa77-48dd-a9b2-1247da0b9093',
    //                 }
    //             },

    //             // Following components should be removed since they the portfolio
    //             // no longer has any user funds in it according to the repeaters
    //             // above.
    //             '6f1ccb8a-a776-4660-9fab-6e28fb2bcc2a': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: 'fb2b4000-40c9-46ef-9f41-87fa68d0129c',
    //                 },
    //                 children: [
    //                     '6d1eb2aa-6035-4e7f-a625-9d88d353ad94',
    //                     '7a0b5897-b9b6-46a9-8ed5-612f79d7e4bb',
    //                 ],
    //             },
    //             '6d1eb2aa-6035-4e7f-a625-9d88d353ad94': {
    //                 parent: '6f1ccb8a-a776-4660-9fab-6e28fb2bcc2a',
    //                 repeatIds: [
    //                     '7a0b5897-b9b6-46a9-8ed5-612f79d7e4bb',
    //                 ],
    //                 repeatFor: 'userFunds',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: 'a9d0f824-dea9-48ba-a7b6-462efd179d2c',
    //                 }
    //             },
    //             '7a0b5897-b9b6-46a9-8ed5-612f79d7e4bb': {
    //                 parent: '6f1ccb8a-a776-4660-9fab-6e28fb2bcc2a',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '6d590793-66b2-4ddb-b152-51fb6b2ab752',
    //                 }
    //             }
    //         };

    //         const expectedResult = {
    //             '66f73eee-3e47-4a6d-bf03-048811b8b1d0': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '1b9f81ff-1b27-40d7-9727-ad87a33f7c65',
    //                 },
    //                 children: [
    //                     '1aa23e4c-22a2-4044-83a6-136629654cf9',
    //                     'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4',
    //                 ],
    //             },
    //             '1aa23e4c-22a2-4044-83a6-136629654cf9': {
    //                 parent: '66f73eee-3e47-4a6d-bf03-048811b8b1d0',
    //                 repeatIds: [
    //                     'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4',
    //                 ],
    //                 repeatFor: 'userFunds',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: 'ee104a73-a836-4be4-ab1f-172b26897c5e',
    //                 }
    //             },
    //             'a55abaf8-a51f-4eb9-b9c6-dcbe320a44b4': {
    //                 parent: '66f73eee-3e47-4a6d-bf03-048811b8b1d0',
    //                 fromRepeatIn: '1aa23e4c-22a2-4044-83a6-136629654cf9',
    //                 entity: {
    //                     type: 'userFund',
    //                     uid: '1ccf8c4f-bdfb-4849-8689-a57eb0c31aec',
    //                 }
    //             },
    //             '6f1ccb8a-a776-4660-9fab-6e28fb2bcc2a': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: 'fb2b4000-40c9-46ef-9f41-87fa68d0129c',
    //                 },
    //                 children: ['6d1eb2aa-6035-4e7f-a625-9d88d353ad94'],
    //             },
    //             '6d1eb2aa-6035-4e7f-a625-9d88d353ad94': {
    //                 parent: '6f1ccb8a-a776-4660-9fab-6e28fb2bcc2a',
    //                 repeatFor: 'userFunds',
    //                 entity: {type: 'userFund'}
    //             },
    //         };

    //         let rederivedDataSpec = specEngine.deriveDataSpec(repeaters, derivedDataSpec);
    //         expect(rederivedDataSpec).toEqualSpec(expectedResult);
    //     });
    // });

    // describe('deriveSpecRepeaters', () => {
    //     it('derives layout data repeaters properly', () => {
    //         let componentRepeaters = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': [
    //                 'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                 '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                 '58946850-b91a-48d1-9850-74419b60f68e',
    //             ],
    //         };

    //         let savedLayoutData = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     'f6dcb785-40cb-4b19-8eca-22f147c8e249',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             'f6dcb785-40cb-4b19-8eca-22f147c8e249': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let expectedResult = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                     '58946850-b91a-48d1-9850-74419b60f68e',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '58946850-b91a-48d1-9850-74419b60f68e': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let derivedLayoutData = specEngine.deriveSpecRepeaters(
    //             componentRepeaters,
    //             savedLayoutData,
    //         );

    //         expect(derivedLayoutData).toEqualSpec(expectedResult);
    //     });

    //     it('removes layout data repeated elements on rederivation', () => {
    //         let componentRepeaters = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': [
    //                 'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                 '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //             ],
    //         };

    //         let savedLayoutData = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     'f6dcb785-40cb-4b19-8eca-22f147c8e249',
    //                     '58946850-b91a-48d1-9850-74419b60f68e',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             'f6dcb785-40cb-4b19-8eca-22f147c8e249': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '58946850-b91a-48d1-9850-74419b60f68e': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let expectedResult = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
    //                 w: 4,
    //                 h: 4,
    //                 x: 12,
    //                 y: 0,
    //                 moved: false,
    //                 static: false,
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let derivedLayoutData = specEngine.deriveSpecRepeaters(
    //             componentRepeaters,
    //             savedLayoutData,
    //         );

    //         expect(derivedLayoutData).toEqualSpec(expectedResult);
    //     });

    //     it('derives component data repeaters properly', () => {
    //         let componentRepeaters = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': [
    //                 'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                 '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                 '58946850-b91a-48d1-9850-74419b60f68e',
    //             ],
    //         };

    //         let savedLayoutData = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     'f6dcb785-40cb-4b19-8eca-22f147c8e249',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             'f6dcb785-40cb-4b19-8eca-22f147c8e249': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let expectedResult = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                     '58946850-b91a-48d1-9850-74419b60f68e',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '58946850-b91a-48d1-9850-74419b60f68e': {
    //                 componentKey: 'timeseriesChart',
    //                 settings: {backgroundColor: 'red'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let derivedLayoutData = specEngine.deriveSpecRepeaters(
    //             componentRepeaters,
    //             savedLayoutData,
    //         );

    //         expect(derivedLayoutData).toEqualSpec(expectedResult);
    //     });

    //     it('removes component data repeated elements on rederivation', () => {
    //         let componentRepeaters = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': [
    //                 'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                 '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //             ],
    //         };

    //         let savedLayoutData = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     'f6dcb785-40cb-4b19-8eca-22f147c8e249',
    //                     '58946850-b91a-48d1-9850-74419b60f68e',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             'f6dcb785-40cb-4b19-8eca-22f147c8e249': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '58946850-b91a-48d1-9850-74419b60f68e': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let expectedResult = {
    //             'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 repeatIds: [
    //                     'f0464f51-19a7-49ab-9ab9-b75b49794896',
    //                     '2445c50a-2b58-4969-bff8-24c81e5ce5f4',
    //                 ],
    //             },
    //             'f0464f51-19a7-49ab-9ab9-b75b49794896': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //             '2445c50a-2b58-4969-bff8-24c81e5ce5f4': {
    //                 componentKey: 'textBlock',
    //                 settings: {text: 'my text block content'},
    //                 fromRepeatIn: 'f3d49fff-aac7-4b79-b5c2-f8fa83b4d1a2',
    //             },
    //         };

    //         let derivedLayoutData = specEngine.deriveSpecRepeaters(
    //             componentRepeaters,
    //             savedLayoutData,
    //         );

    //         expect(derivedLayoutData).toEqualSpec(expectedResult);
    //     });
    // });

    // it('performs full deriving and saving roundtrip properly', () => {
    //     const fillers = {
    //         'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf': {
    //             entityId: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //         },
    //         '9d669e16-57ae-4f5d-8792-b60381fbf83a': {
    //             values: {
    //                 'ee4c0011-5486-4de2-b545-294169b924da': [
    //                     'b04c7b1b-db03-45d2-b42f-cb1607b49f73'
    //                 ]
    //             }
    //         }
    //     };
    //     const repeaters = {
    //         '45604fcb-7384-42e3-9950-5b9a7a3cfde5': {
    //             '0725d296-67c6-43b4-8804-e64233e2f37b': [
    //                 '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //             ],
    //             '4095da87-d0ba-4e17-b1cf-b505ab34ae73': [
    //                 '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //             ],
    //             'eea24e3c-edb2-4e3b-bbc9-7e016c6a47dd': [
    //                 '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //             ],
    //             '08674e09-9198-435b-8c6d-5d197c041b9f': [
    //                 '5ffce6d3-8295-43c9-be46-a44f36582f8c',
    //                 '249cc25e-2d4d-45ae-90b9-750d7459cd50',
    //                 '9f684bce-2981-4921-bbcb-3f2374af2f98',
    //                 '100ccf14-8dc8-4125-a2aa-a474b37c1c65',
    //             ],
    //         },
    //         // '5585857b-0346-44b2-9d0a-ef7d27f442c4': {
    //         //     companies: [
    //         //         '5ffce6d3-8295-43c9-be46-a44f36582f8c',
    //         //         '249cc25e-2d4d-45ae-90b9-750d7459cd50',
    //         //     ],
    //         // },
    //         // 'b04c7b1b-db03-45d2-b42f-cb1607b49f73': {
    //         //     companies: [
    //         //         '9f684bce-2981-4921-bbcb-3f2374af2f98',
    //         //         '100ccf14-8dc8-4125-a2aa-a474b37c1c65',
    //         //     ],
    //         // }
    //     };
    //     let savedDataSpec = {
    //         'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf': {
    //             entity: {type: 'portfolio'},
    //             children: [
    //                 'a7a98093-d3a1-46b3-9502-a34abb7efb3c',
    //                 '08674e09-9198-435b-8c6d-5d197c041b9f',
    //                 '9d669e16-57ae-4f5d-8792-b60381fbf83a',
    //                 // '6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a',
    //             ],
    //         },
    //         'a7a98093-d3a1-46b3-9502-a34abb7efb3c': {
    //             parent: 'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf',
    //             values: {
    //                 '0725d296-67c6-43b4-8804-e64233e2f37b': {
    //                     key: 'navs',
    //                     repeatFor: 'userFunds',
    //                     type: 'spanning',
    //                     span: 'time',
    //                     label: 'NAVs',
    //                     format: 'currency',
    //                 },
    //                 '4095da87-d0ba-4e17-b1cf-b505ab34ae73': {
    //                     key: 'contributions',
    //                     repeatFor: 'userFunds',
    //                     type: 'spanning',
    //                     span: 'time',
    //                     label: 'Contributions',
    //                     format: 'currency',
    //                 },
    //                 'eea24e3c-edb2-4e3b-bbc9-7e016c6a47dd': {
    //                     key: 'distributions',
    //                     repeatFor: 'userFunds',
    //                     type: 'spanning',
    //                     span: 'time',
    //                     label: 'Distributions',
    //                     format: 'currency',
    //                 }
    //             }
    //         },
    //         '08674e09-9198-435b-8c6d-5d197c041b9f': {
    //             parent: 'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf',
    //             repeatFor: 'companies',
    //             values: {
    //                 '8a3e23bc-4c1f-4131-a3ee-47eafb8e42e1': {
    //                     key: 'irr',
    //                     type: 'raw',
    //                     label: 'IRR',
    //                     format: 'currency',
    //                 },
    //                 'af3b7c0c-2851-4054-a65e-74b79dc2fbc4': {
    //                     key: 'tvpi',
    //                     type: 'raw',
    //                     label: 'IRR',
    //                     format: 'currency',
    //                 },
    //                 '37db9233-66db-4c16-861e-c9d897630e99': {
    //                     key: 'dpi',
    //                     type: 'raw',
    //                     label: 'IRR',
    //                     format: 'currency',
    //                 }
    //             }
    //         },
    //         // '6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a': {
    //         //     parent: 'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf',
    //         //     repeatFor: 'userFunds',
    //         //     values: {
    //         //         irr: {
    //         //             repeatFor: 'companies',
    //         //             type: 'raw',
    //         //             label: 'IRR',
    //         //             format: 'currency',
    //         //         }
    //         //     }
    //         // },
    //         '9d669e16-57ae-4f5d-8792-b60381fbf83a': {
    //             parent: 'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf',
    //             values: {
    //                 '0b79a435-5fa2-4883-99bf-b1eaf89f06e0': {
    //                     key: 'navs',
    //                     type: 'spanning',
    //                     span: 'time',
    //                     label: 'NAVs',
    //                     format: 'currency',
    //                 },
    //                 'ee4c0011-5486-4de2-b545-294169b924da': {
    //                     key: 'irrs',
    //                     entities: [{
    //                         type: 'userFund',
    //                     }],
    //                     type: 'raw',
    //                     label: 'IRR',
    //                     format: 'currency',
    //                 }
    //             }
    //         },
    //     };

    //     let expectedFilledOutSpec = {
    //         ...savedDataSpec,
    //         'aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf': {
    //             ...savedDataSpec['aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf'],
    //             entity: {
    //                 type: 'portfolio',
    //                 uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //             },
    //         },
    //         '9d669e16-57ae-4f5d-8792-b60381fbf83a': {
    //             ...savedDataSpec['9d669e16-57ae-4f5d-8792-b60381fbf83a'],
    //             values: {
    //                 '0b79a435-5fa2-4883-99bf-b1eaf89f06e0': {
    //                     key: 'navs',
    //                     type: 'spanning',
    //                     span: 'time',
    //                     label: 'NAVs',
    //                     format: 'currency',
    //                 },
    //                 'ee4c0011-5486-4de2-b545-294169b924da': {
    //                     key: 'irrs',
    //                     entities: [{
    //                         type: 'userFund',
    //                         uid: 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //                     }],
    //                     type: 'raw',
    //                     label: 'IRR',
    //                     format: 'currency',
    //                 }
    //             }
    //         },
    //     };

    //     let expectedDerivedSpec = {...savedDataSpec};
    //     expectedDerivedSpec['aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf'] = {
    //         ...expectedFilledOutSpec['aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf'],
    //         children: [
    //             ...expectedFilledOutSpec['aaf6c4c4-2da2-4398-9c2a-1ec32aa7ccaf'].children,
    //             '8550ba94-c3bd-4545-b122-27bf411a0ac4',
    //             '90ce8cbe-6dc7-4d71-807a-dd7aa12ecff3',
    //             'f510c062-20d9-452f-a75e-3b4baab7a4e7',
    //             // '24d7e023-e38c-4b43-a61b-068ebfddfa59',
    //         ],
    //     };
    //     expectedDerivedSpec['a7a98093-d3a1-46b3-9502-a34abb7efb3c'] = {
    //         ...expectedFilledOutSpec['a7a98093-d3a1-46b3-9502-a34abb7efb3c'],
    //         entity: {
    //             type: 'portfolio',
    //             uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //         },
    //         values: {
    //             '0725d296-67c6-43b4-8804-e64233e2f37b': {
    //                 key: 'navs',
    //                 repeatFor: 'userFunds',
    //                 entities: [{
    //                     type: 'userFund',
    //                     uid: '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }, {
    //                     type: 'userFund',
    //                     uid: 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }],
    //                 type: 'spanning',
    //                 span: 'time',
    //                 label: 'NAVs',
    //                 format: 'currency',
    //             },
    //             '4095da87-d0ba-4e17-b1cf-b505ab34ae73': {
    //                 key: 'contributions',
    //                 repeatFor: 'userFunds',
    //                 entities: [{
    //                     type: 'userFund',
    //                     uid: '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }, {
    //                     type: 'userFund',
    //                     uid: 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }],
    //                 type: 'spanning',
    //                 span: 'time',
    //                 label: 'Contributions',
    //                 format: 'currency',
    //             },
    //             'eea24e3c-edb2-4e3b-bbc9-7e016c6a47dd': {
    //                 key: 'distributions',
    //                 repeatFor: 'userFunds',
    //                 entities: [{
    //                     type: 'userFund',
    //                     uid: '5585857b-0346-44b2-9d0a-ef7d27f442c4',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }, {
    //                     type: 'userFund',
    //                     uid: 'b04c7b1b-db03-45d2-b42f-cb1607b49f73',
    //                     repeatFrom: {
    //                         type: 'portfolio',
    //                         uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //                     },
    //                 }],
    //                 type: 'spanning',
    //                 span: 'time',
    //                 label: 'Distributions',
    //                 format: 'currency',
    //             }
    //         }
    //     };

    //     expectedDerivedSpec['08674e09-9198-435b-8c6d-5d197c041b9f'] = {
    //         ...expectedFilledOutSpec['08674e09-9198-435b-8c6d-5d197c041b9f'],
    //         repeatIds: [
    //             '8550ba94-c3bd-4545-b122-27bf411a0ac4',
    //             '90ce8cbe-6dc7-4d71-807a-dd7aa12ecff3',
    //             'f510c062-20d9-452f-a75e-3b4baab7a4e7',
    //         ],
    //         entity: {
    //             type: 'company',
    //             uid: '5ffce6d3-8295-43c9-be46-a44f36582f8c',
    //         },
    //     };
    //     expectedDerivedSpec['f510c062-20d9-452f-a75e-3b4baab7a4e7'] = {
    //         ...expectedFilledOutSpec['08674e09-9198-435b-8c6d-5d197c041b9f'],
    //         fromRepeatIn: '08674e09-9198-435b-8c6d-5d197c041b9f',
    //         entity: {
    //             type: 'company',
    //             uid: '249cc25e-2d4d-45ae-90b9-750d7459cd50',
    //         },
    //     };
    //     delete expectedDerivedSpec['f510c062-20d9-452f-a75e-3b4baab7a4e7'].repeatFor;

    //     expectedDerivedSpec['90ce8cbe-6dc7-4d71-807a-dd7aa12ecff3'] = {
    //         ...expectedFilledOutSpec['08674e09-9198-435b-8c6d-5d197c041b9f'],
    //         fromRepeatIn: '08674e09-9198-435b-8c6d-5d197c041b9f',
    //         entity: {
    //             type: 'company',
    //             uid: '9f684bce-2981-4921-bbcb-3f2374af2f98',
    //         },
    //     };
    //     delete expectedDerivedSpec['90ce8cbe-6dc7-4d71-807a-dd7aa12ecff3'].repeatFor;

    //     expectedDerivedSpec['8550ba94-c3bd-4545-b122-27bf411a0ac4'] = {
    //         ...expectedFilledOutSpec['08674e09-9198-435b-8c6d-5d197c041b9f'],
    //         fromRepeatIn: '08674e09-9198-435b-8c6d-5d197c041b9f',
    //         entity: {
    //             type: 'company',
    //             uid: '100ccf14-8dc8-4125-a2aa-a474b37c1c65',
    //         }
    //     };
    //     delete expectedDerivedSpec['8550ba94-c3bd-4545-b122-27bf411a0ac4'].repeatFor;
    //     // expectedDerivedSpec['6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a'] = {
    //     //     ...expectedFilledOutSpec['6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a'],
    //     //     entity: {
    //     //         type: 'userFund',
    //     //         uid: '5585857b-0346-44b2-9d0a-ef7d27f442c4'
    //     //     },
    //     //     repeatIds: ['24d7e023-e38c-4b43-a61b-068ebfddfa59'],
    //     //     values: {
    //     //         irr: {
    //     //             ...expectedFilledOutSpec['6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a'].values.irr,
    //     //             entities: [{
    //     //                 type: 'company',
    //     //                 uid: '5ffce6d3-8295-43c9-be46-a44f36582f8c',
    //     //             }, {
    //     //                 type: 'company',
    //     //                 uid: '249cc25e-2d4d-45ae-90b9-750d7459cd50',
    //     //             }]
    //     //         }
    //     //     }
    //     // };
    //     // expectedDerivedSpec['24d7e023-e38c-4b43-a61b-068ebfddfa59'] = {
    //     //     ...expectedFilledOutSpec['6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a'],
    //     //     entity: {
    //     //         type: 'userFund',
    //     //         uid: 'b04c7b1b-db03-45d2-b42f-cb1607b49f73'
    //     //     },
    //     //     fromRepeatIn: '6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a',
    //     //     values: {
    //     //         irr: {
    //     //             ...expectedFilledOutSpec['6cd4dfc5-aef4-4f9b-87f5-55b02d87b37a'].values.irr,
    //     //             entities: [{
    //     //                 type: 'company',
    //     //                 uid: '9f684bce-2981-4921-bbcb-3f2374af2f98',
    //     //             }, {
    //     //                 type: 'company',
    //     //                 uid: '100ccf14-8dc8-4125-a2aa-a474b37c1c65',
    //     //             }]
    //     //         }
    //     //     }
    //     // };
    //     // delete expectedDerivedSpec['24d7e023-e38c-4b43-a61b-068ebfddfa59'].repeatFor;

    //     expectedDerivedSpec['9d669e16-57ae-4f5d-8792-b60381fbf83a'] = {
    //         ...expectedFilledOutSpec['9d669e16-57ae-4f5d-8792-b60381fbf83a'],
    //         entity: {
    //             type: 'portfolio',
    //             uid: '45604fcb-7384-42e3-9950-5b9a7a3cfde5',
    //         }
    //     };

    //     // Fill out the spec with the fillers and make sure it's correct
    //     let filledOutSpec = specEngine.insertEntityFillers(fillers, savedDataSpec);
    //     expect(filledOutSpec).toEqual(expectedFilledOutSpec);

    //     let derivedDataSpec = specEngine.deriveDataSpec(repeaters, filledOutSpec);
    //     expect(derivedDataSpec).toEqualSpec(expectedDerivedSpec);

    //     let {cleanedDataSpec, dataSpecFillers} = specEngine.cleanRepeaters(derivedDataSpec);
    //     expect(cleanedDataSpec).toEqualSpec(savedDataSpec);
    //     expect(dataSpecFillers).toEqual(fillers);
    // });

    // describe('calculateEndpoints', () => {
    //     it('single component with single value calls one endpoint', () => {
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '69d28b1c-209d-4494-8e98-95ffeeb2a843': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             }
    //         ]);
    //     });

    //     it('multiple entities with same value only calls one endpoint if possible', () => {
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '115e202e-6c73-4da1-9288-7de95fa206aa': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             },
    //             '41847bbc-37fc-4599-891b-2e8462bee254': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     'a9a7073d-00cd-400f-83af-19be0804c3fd': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             }
    //         ]);
    //     });

    //     it('multiple entities with same value calls endpoint multiple times if required', () => {
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '4c62ac69-1a58-4ea0-82a4-0fd07c74bdde': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             },
    //             '41847bbc-37fc-4599-891b-2e8462bee254': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '259a7418-7330-46d0-bb21-e73332e08cc7',
    //                 },
    //                 values: {
    //                     '33973ee6-b7bb-4e44-b2e3-724be449f645': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 hashParams: new Set(),
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             },
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 hashParams: new Set(),
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '259a7418-7330-46d0-bb21-e73332e08cc7',
    //                 },
    //             },
    //         ]);
    //     });

    //     it('single entity with multiple values only calls required endpoints', () => {
    //         // TODO (Simon 23 April 2018) Add a completely different value from
    //         // another endpoint when we have another endpoint in value-map.
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '61446612-6181-4382-bb6b-a4b8700a2fee': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     },
    //                     '9f9c36b6-0043-45a0-8aa1-5ee78a5e9e36': {
    //                         key: 'contributions',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         format: 'currency',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             }
    //         ]);
    //     });

    //     it('multiple entities with multiple values only calls required endpoints', () => {
    //         // TODO (Simon 23 April 2018) Add a completely different value from
    //         // another endpoint when we have another endpoint in value-map.
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '3926acd5-584b-46b7-817e-1e9bec4e0735': {
    //                         key: 'irr',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     },
    //                     'f3a493a0-0574-469f-a579-ca96f170064d': {
    //                         key: 'tvpi',
    //                         type: 'raw',
    //                         label: 'TVPI',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             },
    //             '41847bbc-37fc-4599-891b-2e8462bee254': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '3b9fa18e-e139-452e-b496-ee73f2919b38',
    //                 },
    //                 values: {
    //                     '133c3885-0c9b-4954-84f4-20545fdf6f05': {
    //                         key: 'tvpi',
    //                         type: 'raw',
    //                         label: 'TVPI',
    //                         format: 'multiple',
    //                     },
    //                     'f6c6aaf6-8bb2-4a13-ae6a-6e3ddbbf6b8a': {
    //                         key: 'distributions',
    //                         type: 'spanning',
    //                         span: 'time',
    //                         label: 'Distributions',
    //                         format: 'currency',
    //                     },
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '3b9fa18e-e139-452e-b496-ee73f2919b38',
    //                 },
    //             },
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             },
    //         ]);
    //     });

    //     it('single entity with repeated values calls multiple endpoints when required', () => {
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '2dde6044-6eaf-49d3-b87c-117828f7a418': {
    //                         key: 'irr',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                         }, {
    //                             type: 'userFund',
    //                             uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                         }],
    //                         repeatFor: 'userFunds',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'user_fund',
    //                     user_fund_uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                 },
    //             },
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'user_fund',
    //                     user_fund_uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                 },
    //             },
    //         ]);
    //     });

    //     it('single entity with repeated values and non-repeated values calls correct endpoints', () => {
    //         let derivedDataSpec = {
    //             'fa0f9e98-2339-4dea-9d20-59667f84c3e7': {
    //                 entity: {
    //                     type: 'portfolio',
    //                     uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //                 values: {
    //                     '5b0ebca1-6335-4d9c-8df5-9ed9b88cb93d': {
    //                         key: 'irr',
    //                         entities: [{
    //                             type: 'userFund',
    //                             uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                         }, {
    //                             type: 'userFund',
    //                             uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                         }],
    //                         repeatFor: 'userFunds',
    //                         type: 'raw',
    //                         label: 'IRR',
    //                         format: 'multiple',
    //                     },
    //                     '1fc19f85-8eb7-43cb-ad6f-e9af8bd3a227': {
    //                         key: 'tvpi',
    //                         type: 'raw',
    //                         label: 'TVPI',
    //                         format: 'multiple',
    //                     }
    //                 }
    //             }
    //         };

    //         const calculatedEndpoints = specEngine.calculateEndpoints(
    //             derivedDataSpec,
    //             generateValueMap({}),
    //         );
    //         expect(calculatedEndpoints).toEqualEndpoints([
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'user_fund',
    //                     user_fund_uid: '7683d850-f58b-4539-b605-b670863f90d3',
    //                 },
    //             },
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'user_fund',
    //                     user_fund_uid: 'fc4374e4-d2e7-4e6d-b99a-a56d2faad560',
    //                 },
    //             },
    //             {
    //                 endpoint: 'dataprovider/vehicle_analysis',
    //                 params: {
    //                     entity_type: 'portfolio',
    //                     portfolio_uid: '9ab16061-db84-4665-9743-812f10590b18',
    //                 },
    //             },
    //         ]);
    //     });
    // });
});
