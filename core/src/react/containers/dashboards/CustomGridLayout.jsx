import GridLayout, {utils} from 'react-grid-layout';

/*
    Overriding the @onDragStop function from RGL. The reason for doing this is
    that we don't want to trigger a layout change if a component is dropped
    outside of the grid. If such a situation occurs the layout will change outside
    of RGL. We want to make sure that we don't override those changes so we give
    the option to prevent the layout change callback.
*/
class CustomGridLayout extends GridLayout {
    onDragStop(i, x, y, {e, node}) {
        const {oldDragItem} = this.state;
        let {layout} = this.state;
        const {cols, preventCollision} = this.props;
        const l = utils.getLayoutItem(layout, i);
        if (!l) {
            return;
        }

        layout = utils.moveElement(
            layout,
            l,
            x,
            y,
            true,
            preventCollision,
            this.compactType(),
            cols,
        );

        // This is the condition
        const preventLayoutChange = this.props.onDragStop(layout, oldDragItem, l, null, e, node);

        // Set state
        const newLayout = utils.compact(layout, this.compactType(), cols);
        const {oldLayout} = this.state;

        this.setState({
            activeDrag: null,
            layout: newLayout,
            oldDragItem: null,
            oldLayout: null,
        });

        // Only callback if we want it
        if (!preventLayoutChange) {
            this.onLayoutMaybeChanged(newLayout, oldLayout);
        }
    }
}

export default CustomGridLayout;
