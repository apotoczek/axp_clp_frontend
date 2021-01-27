export const gatherSubtreeIds = (tree, memberUid) => {
    let ids = [memberUid];

    const childIds = tree.getChildrenIds(memberUid);

    if (!childIds) {
        return [];
    }

    for (const childId of childIds) {
        const subids = gatherSubtreeIds(tree, childId);
        ids = [...ids, ...subids];
    }
    return ids;
};

export default class AttributeTree {
    constructor(members) {
        this.members = members;
        this._rootIds = members.filter(m => !m.parent_uid).map(m => m.uid);
        this._ids = this._initializeIds(members);
        this._parentIds = this._initializeParents(members);
        this._childIds = this._initializeChildren(members);
    }

    getChildrenIds = parentUid => {
        if (parentUid === null) {
            return this.members.filter(m => m.parent_uid === null).map(m => m.uid);
        }
        const memberIndex = this._getMemberIndex(parentUid);
        return this._childIds[memberIndex];
    };

    getChildren = parentUid => {
        const childIds = this.getChildrenIds(parentUid);

        if (!childIds) {
            return [];
        }

        const children = this.members.filter(m => childIds.includes(m.uid)) || [];
        return children;
    };

    getMember(uid) {
        const memberIndex = this._getMemberIndex(uid);
        return this.members[memberIndex] || null;
    }

    getParentId(childUid) {
        const index = this._getMemberIndex(childUid);
        const parentId = this._parentIds[index];
        return parentId || null;
    }

    getParent(childUid) {
        const parentId = this.getParentId(childUid);
        const parentIdx = this._getMemberIndex(parentId);

        if (parentIdx > -1) {
            return this.members.find(m => m.uid === parentId);
        }

        return null;
    }

    getLineageIds(childUid) {
        let memberUid = childUid;
        const pathIds = [memberUid];
        while (memberUid) {
            memberUid = this.getParentId(memberUid);
            if (memberUid) {
                pathIds.push(memberUid);
            }
        }
        return pathIds.reverse();
    }

    getLineage(childUid) {
        const pathIds = this.getLineageIds(childUid);
        return pathIds.map(id => this.getMember(id));
    }

    getFullMemberName(memberUid) {
        if (!memberUid) {
            return;
        }
        const lineage = this.getLineage(memberUid);
        return lineage.map(m => m.name).join(' / ');
    }

    dropNode = nodeId => {
        const nodeIds = gatherSubtreeIds(this, nodeId);
        nodeIds.map(this._removeNode);
    };

    _removeNode = nodeId => {
        const idx = this._getMemberIndex(nodeId);
        this._ids.splice(idx, 1);
        this._parentIds.splice(idx, 1);
        this._childIds.splice(idx, 1);
        this.members.splice(idx, 1);
    };

    _initializeIds(members) {
        return members.map(m => m.uid);
    }

    _initializeParents(members) {
        return members.map(m => m.parent_uid);
    }

    _initializeChildren(members) {
        const children = [];
        for (const member of members) {
            const memberChildren = [];
            for (const child of members.filter(m => m.uid !== member.uid)) {
                if (child.parent_uid === member.uid) {
                    memberChildren.push(child.uid);
                }
            }
            children.push(memberChildren);
        }
        return children;
    }

    _getMemberIndex(memberUid) {
        return this._ids.findIndex(m => m === memberUid);
    }

    clone = () => {
        return new AttributeTree(JSON.parse(JSON.stringify(this.members)));
    };
}
