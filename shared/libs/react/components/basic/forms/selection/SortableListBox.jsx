import React from 'react';
import SortableListItem from 'components/basic/forms/selection/SortableListItem';
import ListBox from 'components/basic/forms/selection/ListBox';

const SortableListBox = props => <ListBox listItem={SortableListItem} {...props} />;

SortableListBox.propTypes = {...ListBox.propTypes};

export default SortableListBox;
