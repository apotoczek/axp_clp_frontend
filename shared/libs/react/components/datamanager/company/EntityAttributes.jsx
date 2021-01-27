import React from 'react';

import OverviewAttributeBox from 'components/datamanager/company/OverviewAttributeBox';

import styled from 'styled-components';

const NoAttributeValuesSelected = styled.span`
    opacity: 0.7;
    font-style: italic;
`;

export default function EntityAttributes({
    entity,
    attributes,
    toggleEditModal,
    toggleDeleteModal,
    writeAccess,
}) {
    return (
        <>
            {Object.keys(entity.attributes).length > 0 ? (
                Object.entries(entity.attributes).map(([uid, values]) => {
                    const attribute = attributes[uid];
                    return attribute ? (
                        <OverviewAttributeBox
                            key={uid}
                            attribute={attribute}
                            values={values}
                            toggleEditModal={toggleEditModal}
                            toggleDeleteModal={toggleDeleteModal}
                            writeAccess={writeAccess}
                        />
                    ) : null;
                })
            ) : (
                <NoAttributeValuesSelected>No Attribute Values selected</NoAttributeValuesSelected>
            )}
        </>
    );
}
