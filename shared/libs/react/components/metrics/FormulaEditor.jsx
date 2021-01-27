import React, {Component} from 'react';
import {useState} from 'react';
import styled from 'styled-components';
import {Flex} from '@rebass/grid';
import Button from 'components/basic/forms/Button';
import TextInput from 'components/basic/forms/input/TextInput';
import FilterableDropdownList from 'components/basic/forms/dropdowns/FilterableDropdownList';
import Icon from 'components/basic/Icon';

const getTheme = key => ({theme}) => theme.formulaBuilder[key];
const noBubble = f => e => {
    e.preventDefault();
    e.stopPropagation();
    return f(e);
};

export const OperatorType = {
    Addition: 1,
    Subtraction: 2,
    Multiplication: 3,
    Division: 4,
};
export const TokenType = {
    StaticValue: 1,
    Metric: 2,
    Operator: 3,
    Parenthesis: 4,
};

const ModalKey = {
    NewTag: 1,
};

const Container = styled.div`
    padding: 20px;
    & > div {
        margin: 5px 0;
    }
`;

const Parenthesis = styled(Flex)`
    background-color: ${getTheme('rowBg')};
    border: 1px solid ${getTheme('rowBorder')};
    overflow-x: auto;
    user-select: none;
    position: relative;
`;

const LineOperator = styled(Flex)`
    justify-content: center;
    & > span {
        height: 20px;
        border-left: 1px solid;
        border-color: ${getTheme('rowBorder')};
        width: 1px;
    }
    & hr {
        flex: 1;
        margin: 0 10px;
        justify-self: center;
        align-self: center;
        border-color: ${getTheme('rowBorder')};
    }
`;

const RowWrapper = styled.div`
    padding: 30px;
    min-height: 49px;
    display: inline-flex;
    margin: auto;
`;

const TagWrapper = styled.span`
    color: ${getTheme('tagFg')};
    background-color: ${getTheme('tagBg')};
    display: inline-flex;
    margin-right: 5px;
    margin-left: 5px;
    flex-shrink: 0;
    position: relative;
    cursor: ${({editing}) => (editing ? 'grab' : 'default')};
    border-radius: 5px;
    & + hr {
        margin-left: 2px;
    }
    hr + & {
        margin-left: 0;
    }
    opacity: ${({isDraggingFrom}) => (isDraggingFrom ? '0.2' : '1')};
    transition: all 200ms;
    &::after {
        transition: all 200ms;
        border: 1px solid ${getTheme('dragOverTagOutline')};
        opacity: ${({isDraggingOver}) => (isDraggingOver ? '1' : '0')};
        content: '';
        position: absolute;
        background-color: transparent;
        top: 3px;
        bottom: 3px;
        left: 3px;
        right: 3px;
        border-radius: 5px;
        border-collapse: collapse;
    }
    & > span {
        border-style: ${({selected}) => (selected ? 'dashed' : 'solid')};
    }
`;
const Value = styled.span`
    background-color: transparent;
    border: 1px ${getTheme('tagBorder')};
    padding: 18px;
    border-radius: 5px;
    min-width: 120px;
`;

const RemovedValue = styled.span`
    background-color: transparent;
    border: 1px ${getTheme('removedTagBorder')};
    color: ${getTheme('removedValueText')};
    padding: 18px;
    border-radius: 5px;
    min-width: 120px;
    font-style: oblique;
`;

const AbsoluteButtonContainer = styled.div`
    position: absolute;
    top: 90%;
    left: 7px;
    overflow: hidden;
    border-radius: 5px;
    border: 1px solid ${getTheme('valueActionButtonBorder')};
    background-color: ${getTheme('valueActionButtonBg')};
`;
const ValueActionButton = styled(Icon)`
    color: ${getTheme('valueActionButtonFg')};
    font-size: 13px;
    padding: 6px 9px;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
    &:hover {
        background-color: ${getTheme('valueActionButtonBgHover')};
    }
`;
const RowButton = styled(Icon)`
    cursor: ${({onClick}) => (onClick ? 'pointer' : 'default')};
    opacity: ${({onClick}) => (onClick ? '1' : '0.4')};
    z-index: 1000;
    color: ${({onClick, theme}) =>
        onClick
            ? theme.formulaBuilder.rowActionButtonActiveFg
            : theme.formulaBuilder.rowActionButtonFg};
    background-color: transparent;
    position: absolute;
`;
const MoveRowButton = styled(RowButton)`
    left: 7px;
    padding: 4px 7px;
    top: ${({up}) => (up ? '5px' : 'unset')} !important;
    ${({up}) => (!up ? 'bottom: 5px' : '')};
`;
const RemoveRowButton = styled(RowButton)`
    font-size: 18px;
    right: 7px;
    top: 7px !important;
    padding: 0;
    transform: rotate(45deg);
`;

const OperatorTag = styled(Icon)`
    background-color: ${getTheme('tagBg')};
    color: ${getTheme('operatorFg')};
    border: 1px solid ${getTheme('tagBorder')};
    border-radius: 5px;
    padding: 7px;
    margin-top: 5px;
    margin-bottom: 5px;
    align-self: center;
    position: relative;
    width: 35px;
    ${({bisonicon}) => (bisonicon ? 'font-size: 18px;' : '')}
    &::before {
        display: flex;
        justify-content: center;
        transform: rotate(${({rotate}) => rotate}deg);
    }
`;
const EditOperatorMenu = styled(Icon)`
    background-color: ${getTheme('editOperatorBg')};
    border: 1px dashed ${getTheme('editOperatorBorder')};
    overflow: hidden;
    border-radius: 20px;
    align-self: center;
    position: absolute;
    z-index: 1000;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    & > hr {
        position: absolute;
        left: 50%;
        height: 100%;
        border: none;
        border-left: 1px solid ${getTheme('editOperatorBorder')};
    }
    & hr {
        z-index: 100;
        border-color: ${getTheme('editOperatorBorder')};
        margin: 0;
    }
    & > div {
        z-index: 10;
    }
    & > div > div {
        background-color: transparent;
        margin: 0;
        border: none;
        border-radius: 0;
        padding: 10px 20px;
        &:hover {
            background-color: ${getTheme('editOperatorBgHover')};
        }
    }
`;

const AddNodeTag = styled(Icon)`
    background-color: ${getTheme('newTagBg')};
    border: 1px solid ${getTheme('tagBorder')};
    color: ${getTheme('newTagFg')};
    border-radius: 100%;
    padding: 3px;
    align-self: center;
    position: relative;
    transition: color 0.2s;
    cursor: pointer;
    margin: 15px 0;
    &:hover {
        color: ${getTheme('newTagFgHover')};
    }
`;
const DragTarget = styled.div`
    position: absolute;
    top: ${({pad}) => `-${pad}px`};
    bottom: ${({pad}) => `-${pad}px`};
    left: ${({pad}) => `-${pad}px`};
    right: ${({pad}) => `-${pad}px`};
    border-radius: 100%;
    background-color: ${({draggingOver}) =>
        draggingOver ? 'rgba(155, 255, 255, 0.5);' : 'transparent'};
`;
const AddNodeLine = styled.hr`
    border-color: ${getTheme('rowBorder')};
    margin: 0 7px;
    width: 15px;
    min-width: 20px;
    align-self: center;
`;

const AddRowButton = styled(Button)`
    margin: 7px 0;
`;

const NewTagContainer = styled.div`
    background-color: ${getTheme('newTagMenuBg')};
    border: 1px solid ${getTheme('newTagMenuBorder')};
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    z-index: 9001;
    border-radius: 7px;
    padding: 15px;
    overflow: hidden;
    min-width: 300px;
`;
const NewTagSizeWrapper = styled.div`
    width: 280px;
    height: 50px;
`;

const ModalTabNav = styled.div`
    border: 1px solid ${getTheme('tabNavBorder')};
    display: flex;
    margin: 7px;
    border-radius: 7px;
    overflow: hidden;
`;
const ModalTab = styled.div`
    background-color: ${({theme, selected}) =>
        selected ? theme.formulaBuilder.tabNavActiveBg : theme.formulaBuilder.tabNavBg};
    color: ${({theme, selected}) =>
        selected ? theme.formulaBuilder.tabNavActiveFg : theme.formulaBuilder.tabNavFg};
    border-right: 1px solid ${getTheme('tabNavBorder')};
    padding: 5px;
    flex: 1;
    cursor: pointer;
    display: inline-block;
    text-align: center;
    &:last-child {
        border-right: none;
    }
`;

const OperatorIconMap = {
    [OperatorType.Addition]: {name: 'plus', glyphicon: true},
    [OperatorType.Subtraction]: {name: 'minus', glyphicon: true},
    [OperatorType.Multiplication]: {name: 'remove', glyphicon: true},
    [OperatorType.Division]: {name: 'division', bisonicon: true},
};
const Operator = ({node, data}) => {
    const {Addition, Subtraction, Multiplication, Division} = OperatorType;
    const {operator} = node;
    const {changeSelf, isSelected, setSelected} = data;
    const SetOperator = ({operatorType}) => (
        <OperatorTag
            {...OperatorIconMap[operatorType]}
            onClick={noBubble(() => changeSelf({...node, operator: operatorType}))}
        />
    );
    return (
        <OperatorTag {...OperatorIconMap[operator]} onClick={setSelected}>
            {isSelected && (
                <EditOperatorMenu>
                    <div>
                        <SetOperator operatorType={Addition} />
                        <hr />
                        <SetOperator operatorType={Multiplication} />
                    </div>
                    <hr />
                    <div>
                        <SetOperator operatorType={Subtraction} />
                        <hr />
                        <SetOperator operatorType={Division} />
                    </div>
                </EditOperatorMenu>
            )}
        </OperatorTag>
    );
};

const Tag = ({
    changeSelf,
    editing,
    isDraggingFrom,
    isDraggingOver,
    isSelected,
    metrics,
    nodeData,
    onTagDragEnd,
    onTagDragOver,
    onTagDragStart,
    onTagDrop,
    removeSelf,
    openEditSelf,
    setSelected,
}) => {
    const {Metric, StaticValue} = TokenType;
    const {token_type, uid, value} = nodeData;
    if (token_type === TokenType.Operator) {
        return <Operator node={nodeData} data={{changeSelf, isSelected, setSelected}} />;
    }

    let content;
    switch (token_type) {
        case Metric:
            content = metrics[uid] ? (
                <Value>{metrics[uid].name}</Value>
            ) : (
                <RemovedValue>Removed Metric</RemovedValue>
            );
            break;
        case StaticValue:
            content = <Value>{value}</Value>;
            break;
    }

    return (
        <TagWrapper
            editing={editing}
            draggable={editing}
            onDragStart={onTagDragStart}
            onDragEnd={onTagDragEnd}
            onDragOver={onTagDragOver && noBubble(() => onTagDragOver())}
            onDrop={onTagDrop}
            isDraggingFrom={isDraggingFrom}
            isDraggingOver={isDraggingOver}
            selected={isSelected}
            onClick={setSelected}
        >
            {content}
            {isSelected && (
                <AbsoluteButtonContainer>
                    <ValueActionButton onClick={noBubble(removeSelf)} glyphicon name='trash' />
                    <ValueActionButton
                        onClick={() =>
                            noBubble(
                                openEditSelf({
                                    initialTab: {[Metric]: 'metric', [StaticValue]: 'static'}[
                                        token_type
                                    ],
                                    initialMetric: uid,
                                    initialValue: value,
                                }),
                            )
                        }
                        glyphicon
                        name='edit'
                    />
                </AbsoluteButtonContainer>
            )}
        </TagWrapper>
    );
};

const NewTagModal = ({
    metrics,
    toggleModal,
    modalData: {onConfirm, initialTab, initialValue, initialMetric},
}) => {
    const [tab, setTab] = useState(initialTab ?? 'metric');
    const [value, setValue] = useState(initialValue ?? '');
    const [metric, setMetric] = useState(initialMetric);

    let child, valid, node;
    switch (tab ?? 'metric') {
        case 'metric':
            valid = !!metric;
            child = (
                <FilterableDropdownList
                    onValueChanged={setMetric}
                    options={Object.values(metrics)}
                    keyKey='base_metric_uid'
                    valueKey='base_metric_uid'
                    labelKey='name'
                    manualValue={metric && metrics[metric] ? metrics[metric].name : 'N/A'}
                    mb={1}
                />
            );
            node = {token_type: TokenType.Metric, uid: metric};
            break;
        case 'static':
            valid = !isNaN(value) && value.length > 0;
            child = (
                <TextInput
                    leftLabel='Manual Value'
                    placeholder='Value'
                    onValueChanged={setValue}
                    debounceValueChange={false}
                    value={value}
                />
            );
            node = {
                token_type: TokenType.StaticValue,
                value: parseFloat(value),
            };
            break;
    }

    return (
        <NewTagContainer onClick={noBubble(e => e)}>
            <ModalTabNav>
                <ModalTab selected={tab === 'metric'} onClick={() => setTab('metric')}>
                    Metric
                </ModalTab>
                <ModalTab selected={tab === 'static'} onClick={() => setTab('static')}>
                    Manual Value
                </ModalTab>
            </ModalTabNav>
            <NewTagSizeWrapper>{child}</NewTagSizeWrapper>
            <Flex mt={3} justifyContent='flex-end'>
                <Button mr={1} onClick={toggleModal}>
                    Cancel
                </Button>
                <Button
                    primary
                    disabled={!valid}
                    onClick={() => {
                        onConfirm(node);
                        toggleModal();
                    }}
                >
                    Confirm
                </Button>
            </Flex>
        </NewTagContainer>
    );
};

class FormulaEditor extends Component {
    state = {
        editingTag: undefined,
        partialModal: undefined,
        selected: undefined,
    };

    clearPopover() {
        if (this.state.partialModal) {
            this.setState({partialModal: undefined});
        }
    }

    startDrag = (rowIndex, colIndex) => () => {
        this.setState({
            dragging: {
                from: [rowIndex, colIndex],
            },
        });
    };

    endDrag() {
        this.setState({
            dragging: undefined,
        });
    }

    onDrop() {
        const {dragging} = this.state;
        if (dragging && dragging.from && dragging.over) {
            const [_, overCol] = dragging.over;
            if (overCol === 'after' || overCol === 'before') {
                this.props.moveTag(dragging.from, dragging.over);
            } else {
                this.props.swapTags(dragging.from, dragging.over);
            }
        }
        this.cancelSelect();
        this.setState({dragging: undefined});
    }

    dragOver = ([overRow, overCol]) => () => {
        const {dragging} = this.state;
        if (dragging?.over?.[0] !== overRow || dragging.over[1] !== overCol) {
            this.setState({
                dragging: {
                    ...dragging,
                    over: [overRow, overCol],
                },
            });
        }
    };

    cancelDragOver() {
        const {dragging} = this.state;
        if (dragging.over) {
            this.setState({
                dragging: {
                    ...dragging,
                    over: undefined,
                },
            });
        }
    }

    setTag = (row, col) => value => {
        this.props.setTag(row, col, value);
        this.cancelSelect();
    };

    removeTag = (row, col) => () => {
        this.props.removeTag(row, col);
        this.cancelSelect();
    };

    cancelSelect() {
        if (this.state.selected) {
            this.setState({
                selected: undefined,
            });
        }
    }

    openNewTag(rowIndex, side = 'after') {
        return this.setState({
            partialModal: {
                key: ModalKey.NewTag,
                selectedMetric: undefined,
                onConfirm: node => this.props.addNewTag({rowIndex, side, node}),
                rowIndex,
                side,
            },
        });
    }

    openEditTag(rowIndex, colIndex) {
        return oldData =>
            this.setState({
                partialModal: {
                    key: ModalKey.NewTag,
                    selectedMetric: undefined,
                    onConfirm: this.setTag(rowIndex, colIndex),
                    ...oldData,
                },
            });
    }

    setSelected = (rowIndex, colIndex) => e => {
        this.setState({
            selected: [rowIndex, colIndex],
        });
        e.stopPropagation();
    };

    renderTag(nodeData, [rowIndex, colIndex]) {
        const {editing, metrics} = this.props;
        const [draggingFromRow, draggingFromCol] = this.state.dragging?.from ?? [-1, -1];
        const [draggingOverRow, draggingOverCol] = this.state.dragging?.over ?? [-1, -1];
        const [selectedRow, selectedCol] = this.state.selected ?? [-1, -1];

        const editingProps = !editing
            ? {}
            : {
                  changeSelf: this.setTag(rowIndex, colIndex),
                  removeSelf: this.removeTag(rowIndex, colIndex),
                  openEditSelf: this.openEditTag(rowIndex, colIndex),
                  setSelected: this.setSelected(rowIndex, colIndex),
                  onTagDragStart: this.startDrag(rowIndex, colIndex),
                  onTagDragOver: this.dragOver([rowIndex, colIndex]),
                  onTagDragEnd: () => this.endDrag(),
                  onTagDrop: () => this.onDrop(),
                  isSelected: selectedRow === rowIndex && selectedCol === colIndex,
                  isDraggingFrom: draggingFromRow === rowIndex && draggingFromCol === colIndex,
                  isDraggingOver: draggingOverRow === rowIndex && draggingOverCol === colIndex,
              };

        return (
            <Tag
                key={`${rowIndex}_${colIndex}`}
                position={[rowIndex, colIndex]}
                nodeData={nodeData}
                metrics={metrics}
                editing={editing}
                {...editingProps}
            />
        );
    }

    renderRowOperator(node, rowIndex) {
        const [selectedRow, selectedCol] = this.state.selected ?? [-1, -1];
        const editingOptions = !this.props.editing
            ? {}
            : {
                  changeSelf: this.setTag(rowIndex),
                  setSelected: this.setSelected(rowIndex, 'row'),
                  isSelected: selectedRow === rowIndex && selectedCol === 'row',
              };

        return (
            <LineOperator key={rowIndex}>
                <Operator node={node} data={editingOptions} />
            </LineOperator>
        );
    }

    renderRow({values}, rowIndex, isSoleRow) {
        const [draggingOverRow, draggingOverCol] = this.state.dragging?.over ?? [-1, -1];
        const removeSelf =
            this.props.editing && !isSoleRow && (() => this.props.removeRow(rowIndex));
        const moveSelfUp = rowIndex > 0 && (() => this.props.swapRows(rowIndex, rowIndex - 2));
        const moveSelfDown =
            rowIndex < this.props.formula.values.length - 1 &&
            (() => this.props.swapRows(rowIndex, rowIndex + 2));
        const AddButton = ({side}) => (
            <AddNodeTag name='plus' onClick={noBubble(() => this.openNewTag(rowIndex, side))}>
                <DragTarget
                    pad={15}
                    draggingOver={draggingOverRow === rowIndex && draggingOverCol === side}
                    onDrop={() => this.onDrop()}
                    onDragEnd={() => this.endDrag()}
                    onDragOver={noBubble(() => this.dragOver([rowIndex, side])())}
                />
            </AddNodeTag>
        );

        return (
            <div key={rowIndex} style={{position: 'relative'}}>
                {this.props.editing && (
                    <>
                        <MoveRowButton
                            onClick={moveSelfUp ? noBubble(moveSelfUp) : undefined}
                            up
                            glyphicon
                            name='arrow-up'
                        />
                        <MoveRowButton
                            onClick={moveSelfDown ? noBubble(moveSelfDown) : undefined}
                            glyphicon
                            name='arrow-down'
                        />
                        <RemoveRowButton
                            onClick={removeSelf ? noBubble(removeSelf) : undefined}
                            glyphicon
                            name='plus-sign'
                        />
                    </>
                )}
                <Parenthesis>
                    <RowWrapper>
                        {!values.length && this.props.editing && <AddButton side='before' />}
                        {!!values.length && this.props.editing && (
                            <>
                                <AddButton key='before' side='before' />
                                <AddNodeLine key='line-before' />
                            </>
                        )}
                        {values.map((value, ix) => this.renderTag(value, [rowIndex, ix]))}
                        {!!values.length && this.props.editing && (
                            <>
                                <AddNodeLine key='line-after' />
                                <AddButton key='after' side='after' />
                            </>
                        )}
                    </RowWrapper>
                </Parenthesis>
            </div>
        );
    }

    render() {
        const {formula, metrics, editing, addNewRow} = this.props;
        const {partialModal} = this.state;
        const {values} = formula;

        let lines = values.map((v, ix) =>
            v.token_type === TokenType.Operator
                ? this.renderRowOperator(v, ix)
                : this.renderRow(v, ix, values.length < 2),
        );
        if (editing) {
            lines = [
                <LineOperator key='before_add'>
                    <AddRowButton
                        primary
                        onClick={() => addNewRow('before')}
                        disabled={values.first().values.length < 1}
                    >
                        Add row
                    </AddRowButton>
                </LineOperator>,
                ...lines,
                <LineOperator key='after_add'>
                    <AddRowButton
                        primary
                        onClick={() => addNewRow('after')}
                        disabled={values.last().values.length < 1}
                    >
                        Add row
                    </AddRowButton>
                </LineOperator>,
            ];
        }

        return (
            <Container
                onDragOver={() => {
                    this.cancelDragOver();
                    this.clearPopover();
                }}
                onClick={() => {
                    this.cancelSelect();
                    this.clearPopover();
                }}
            >
                {lines}
                {partialModal && partialModal.key === ModalKey.NewTag && (
                    <NewTagModal
                        toggleModal={() => this.setState({partialModal: undefined})}
                        metrics={metrics}
                        modalData={partialModal}
                    />
                )}
            </Container>
        );
    }
}

export default FormulaEditor;
