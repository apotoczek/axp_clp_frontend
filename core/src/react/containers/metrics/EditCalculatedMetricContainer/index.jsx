import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {Flex, Box} from '@rebass/grid';
import {useBackendData} from 'utils/backendConnect';

import {createCalculatedMetric, updateCalculatedMetric} from 'api';

import {Container, Content, Page} from 'components/layout';
import Toolbar, {ToolbarItem} from 'components/basic/Toolbar';
import TextInput from 'components/basic/forms/input/TextInput';
import DropdownList from 'components/basic/forms/dropdowns/DropdownList';
import Loader from 'components/basic/Loader';

import FormulaEditor from 'components/metrics/FormulaEditor';
import {Format} from 'src/libs/Enums';

import {
    keyify,
    addNewRow,
    addNewTag,
    emptyFormula,
    isValidSaveState,
    moveTag,
    removeRow,
    removeTag,
    sanitizeSaveState,
    swapRows,
    swapTags,
    setTag,
} from './formulaOperations';

const FormatMap = keyify(
    Object.entries(Format).map(([k, v]) => ({id: v, name: k})),
    'id',
);

const MainView = styled(Page)`
    flex-direction: column;
    overflow-y: auto;
    max-height: calc(100% - 44px);
`;

const ToolbarItems = ({creating, validSaveState, onCreate, onSave}) => {
    if (creating) {
        return (
            <ToolbarItem
                onClick={onCreate}
                icon='floppy-disk'
                right
                glyphicon
                disabled={!validSaveState}
            >
                Save and Create
            </ToolbarItem>
        );
    }
    return (
        <ToolbarItem onClick={onSave} icon='floppy-disk' glyphicon right disabled={!validSaveState}>
            Save
        </ToolbarItem>
    );
};

export default function EditCalculatedMetricContainer({history, match}) {
    const uid = match.params.uid;
    const creating = uid === 'new';

    const {data: calculatedMetric} = useBackendData(
        'calculated-metric/get',
        {calculated_metric_uid: creating ? undefined : uid},
        {initialData: {}, requiredParams: ['calculated_metric_uid']},
    );

    const [formula, setFormula] = useState(creating ? emptyFormula : undefined);
    const [name, setName] = useState(creating ? '' : undefined);
    const [format, setFormat] = useState(creating ? Format.Money : undefined);

    useEffect(() => {
        if (!creating) {
            if (!formula && calculatedMetric.formula) {
                setFormula(calculatedMetric.formula);
            }
            if (!name && calculatedMetric.name) {
                setName(calculatedMetric.name);
            }
            if (!format && calculatedMetric.format) {
                setFormat(calculatedMetric.format);
            }
        }
    }, [
        creating,
        formula,
        calculatedMetric.formula,
        calculatedMetric.name,
        calculatedMetric.format,
        name,
        format,
    ]);

    const {data: metricBasesForClient} = useBackendData(
        'dataprovider/metric_bases_for_client',
        {include_all_system_types: false},
        {initialData: []},
    );
    const userMetrics = metricBasesForClient && keyify(metricBasesForClient, 'base_metric_uid');
    const isLoading = !formula || !metricBasesForClient.length;

    return (
        <Container>
            <Toolbar>
                <ToolbarItems
                    right
                    creating={creating}
                    editing
                    history={history}
                    validSaveState={isValidSaveState({name, formula})}
                    onCreate={() => {
                        const {name: newName, formula: newFormula} = sanitizeSaveState({
                            name,
                            formula,
                        });
                        setName(newName);
                        createCalculatedMetric({name: newName, formula: newFormula, format}).then(
                            ({uid}) => {
                                history.push(`/data-manager/metrics:calculated/${uid}`);
                            },
                        );
                    }}
                    onSave={() => {
                        const {name: newName, formula: newFormula} = sanitizeSaveState({
                            name,
                            formula,
                        });
                        setName(newName);
                        updateCalculatedMetric({
                            name: newName,
                            formula: newFormula,
                            format,
                            uid,
                        }).then(() => setFormula(newFormula));
                    }}
                />
            </Toolbar>
            <MainView>
                <Flex flexWrap='wrap'>
                    <Box pl={15} pr={15} pt={15} flexGrow={1000}>
                        <TextInput
                            leftLabel='Name'
                            placeholder='Enter metric Name'
                            value={name}
                            onValueChanged={name => setName(name)}
                        />
                    </Box>
                    <Box pl={15} pr={15} pt={15} flexBasis={300} flexGrow={1}>
                        <DropdownList
                            label='Metric Format'
                            options={Object.values(FormatMap)}
                            valueKey='id'
                            labelKey='name'
                            manualValue={format && FormatMap[format].name}
                            placeholder='Select a metric format'
                            onValueChanged={v => setFormat(v)}
                        />
                    </Box>
                </Flex>
                <Content>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <FormulaEditor
                            metrics={userMetrics}
                            editing
                            formula={formula}
                            addNewRow={side => setFormula(formula => addNewRow(formula, side))}
                            addNewTag={ob => setFormula(formula => addNewTag(formula, ob))}
                            moveTag={(a, b) => setFormula(formula => moveTag(formula, a, b))}
                            swapTags={(a, b) => setFormula(formula => swapTags(formula, a, b))}
                            swapRows={(a, b) => setFormula(formula => swapRows(formula, a, b))}
                            setTag={(row, col, value) =>
                                setFormula(formula => setTag(formula, row, col, value))
                            }
                            removeTag={(row, col) =>
                                setFormula(formula => removeTag(formula, row, col))
                            }
                            removeRow={row => setFormula(formula => removeRow(formula, row))}
                        />
                    )}
                </Content>
            </MainView>
        </Container>
    );
}
