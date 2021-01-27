const flattenMember = member => {
    const current = {
        uid: member.uid,
        parent_uid: member.parent_uid,
        name: member.name,
    };

    if (!member.children) {
        return [current];
    }

    let children = [];
    for (const child of member.children) {
        children = [...children, ...flattenMember(child)];
    }

    return [current, ...children];
};

/**
 * Convert a backend-style member tree to an flat array of members.
 *
 * @param {Array[object]} members - backend-style member tree in the form of:
 * ```js
 * [{
 *     uid: string,
 *     attribute_uid: string,
 *     parent_uid: null,
 *     children: [
 *         {
 *             uid: string
 *             attribute_uid: string
 *             parent_uid: string,
 *             children: [...]
 *         }
 *     ]
 * }]
 * ```
 */
export const flattenMembers = members => {
    let flattened = [];
    for (const member of members) {
        flattened = [...flattened, ...flattenMember(member)];
    }
    return flattened;
};
