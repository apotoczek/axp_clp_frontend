import {conditional_element} from 'src/libs/Utils';
import {OperatorType, TokenType} from 'components/metrics/FormulaEditor';

// Takes a collection `coll`, and a variadic `updates` consisting of pairs `[key1, value1], [key2, value2]`.
// Returns a copy off `coll` with coll[keyN] == valueN for all N
// Works for both arrays and objects but note that invalid array indices may coerce into an object
function assoc(coll, ...updates) {
    return updates.reduce(
        (t, [key, value]) => {
            t[key] = value;
            return t;
        },
        Array.isArray(coll) ? [...coll] : {...coll},
    );
}

// Returns a copy of the collection `coll` with the keys `ixA` and `ixB` swapped in-place
function swap(coll, ixA, ixB) {
    return assoc(coll, [ixA, coll[ixB]], [ixB, coll[ixA]]);
}

// Returns a list `coll` and returns a new array except without any of the indices in `ixs`
function dropIndices(coll, ...ixs) {
    return coll.filter((_, ix) => ixs.indexOf(ix) === -1);
}

const defaultOperator = () => ({
    token_type: TokenType.Operator,
    operator: OperatorType.Addition,
});

const emptyRow = () => ({
    token_type: TokenType.Parenthesis,
    scope: 'row',
    values: [],
});

export function keyify(coll, key) {
    return coll.reduce((acc, value) => {
        acc[value[key]] = value;
        return acc;
    }, {});
}

export const emptyFormula = {
    token_type: TokenType.Parenthesis,
    scope: 'root',
    values: [emptyRow()],
};

export function addNewRow(formula, side) {
    return {
        ...formula,
        values: [
            ...conditional_element(
                [
                    emptyRow(),
                    ...conditional_element([defaultOperator()], formula.values.length > 0),
                ],
                side === 'before',
            ),
            ...formula.values,
            ...conditional_element(
                [
                    ...conditional_element([defaultOperator()], formula.values.length > 0),
                    emptyRow(),
                ],
                side === 'after',
            ),
        ],
    };
}

export function addNewTag(formula, {node, rowIndex, side}) {
    return {
        ...formula,
        values: assoc(formula.values, [
            rowIndex,
            {
                ...formula.values[rowIndex],
                values: [
                    ...conditional_element(
                        [
                            node,
                            ...conditional_element(
                                [defaultOperator()],
                                formula.values[rowIndex].values.length > 0,
                            ),
                        ],
                        side === 'before',
                    ),
                    ...formula.values[rowIndex].values,
                    ...conditional_element(
                        [
                            ...conditional_element(
                                [defaultOperator()],
                                formula.values[rowIndex].values.length > 0,
                            ),
                            node,
                        ],
                        side === 'after',
                    ),
                ],
            },
        ]),
    };
}

export function swapTags(formula, [rowA, colA], [rowB, colB]) {
    let values = assoc(formula.values, [
        rowA,
        {
            ...formula.values[rowA],
            values: assoc(formula.values[rowA].values, [colA, formula.values[rowB].values[colB]]),
        },
    ]);
    values = assoc(values, [
        rowB,
        {
            ...values[rowB],
            values: assoc(values[rowB].values, [colB, formula.values[rowA].values[colA]]),
        },
    ]);
    return assoc(formula, ['values', values]);
}

export function swapRows(formula, rowA, rowB) {
    return {...formula, values: swap(formula.values, rowA, rowB)};
}

export function moveTag(formula, [rowSrc, colSrc], [rowTarget, side]) {
    const value = formula.values[rowSrc].values[colSrc];
    const removed = assoc(formula.values, [
        rowSrc,
        {
            ...formula.values[rowSrc],
            values: dropIndices(
                formula.values[rowSrc].values,
                colSrc,
                colSrc === 0 ? 1 : colSrc - 1,
            ),
        },
    ]);
    const added = assoc(removed, [
        rowTarget,
        {
            ...formula.values[rowTarget],
            values: [
                ...conditional_element(
                    [
                        value,
                        ...conditional_element(
                            [defaultOperator()],
                            removed[rowTarget].values.length > 0,
                        ),
                    ],
                    side === 'before',
                ),
                ...removed[rowTarget].values,
                ...conditional_element(
                    [
                        ...conditional_element(
                            [defaultOperator()],
                            removed[rowTarget].values.length > 0,
                        ),
                        value,
                    ],
                    side === 'after',
                ),
            ],
        },
    ]);
    return {...formula, values: added};
}

export function removeTag(formula, rowA, colA) {
    return {
        ...formula,
        values: assoc(formula.values, [
            rowA,
            {
                ...formula.values[rowA],
                values: dropIndices(formula.values[rowA].values, colA, colA === 0 ? 1 : colA - 1),
            },
        ]),
    };
}

export function removeRow(formula, rowIndex) {
    return {
        ...formula,
        values: dropIndices(formula.values, rowIndex, rowIndex === 0 ? 1 : rowIndex - 1),
    };
}

export function setTag(formula, row, col, value) {
    if (col !== undefined) {
        return {
            ...formula,
            values: assoc(formula.values, [
                row,
                {
                    ...formula.values[row],
                    values: assoc(formula.values[row].values, [col, value]),
                },
            ]),
        };
    }
    return {
        ...formula,
        values: assoc(formula.values, [row, value]),
    };
}

export function isValidSaveState({name, formula}) {
    return (
        name &&
        name !== '' &&
        formula?.values.some(v => v.token_type !== TokenType.Operator && v.values.length > 0)
    );
}

export function sanitizeSaveState({name, formula}) {
    let newValues = [...formula.values];
    let ix;
    while (
        // note the walrus single-equals here, we want to use the index `ix` in the loop body
        (ix = newValues.findIndex(v => v.values?.length < 1)) > -1
    ) {
        newValues.splice(ix ? ix - 1 : 0, 2);
    }
    return {
        name: name?.trim(),
        formula: assoc(formula, ['values', newValues]),
    };
}
