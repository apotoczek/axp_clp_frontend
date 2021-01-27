import AttributeTree, {gatherSubtreeIds} from 'bison/utils/AttributeTree';

describe('AttributeTree', () => {
    let tree;
    let members;
    beforeEach(() => {
        members = [
            {name: 'Europe', uid: '0-eur', parent_uid: null},
            {name: 'Asia', uid: '0-asia', parent_uid: null},
            {name: 'Scandanavia', uid: '1-scandanavia', parent_uid: '0-eur'},
            {name: 'Sweden', uid: '2-sweden', parent_uid: '1-scandanavia'},
            {name: 'Norway', uid: '2-norway', parent_uid: '1-scandanavia'},
            {name: 'East Asia', uid: '1-east-asia', parent_uid: '0-asia'},
            {name: 'China', uid: '2-china', parent_uid: '1-east-asia'},
            {name: 'Japan', uid: '2-japan', parent_uid: '1-east-asia'},
            {name: 'S. Korea', uid: '2-skorea', parent_uid: '1-east-asia'},
            {name: 'Central Asia', uid: '1-central-asia', parent_uid: '0-asia'},
            {name: 'Uzbekistan', uid: '2-uzbekistan', parent_uid: '1-central-asia'},
            {name: 'Turkmenistan', uid: '2-turkmenistan', parent_uid: '1-central-asia'},
            {name: 'Kyrgyzstan', uid: '2-kyrgyzstan', parent_uid: '1-central-asia'},
        ];
        tree = new AttributeTree(members);
    });

    it('constructor generates parent ids', () => {
        expect(tree._ids).toEqual(members.map(m => m.uid));
    });

    it('constructor generates child ids', () => {
        expect(tree._childIds).toEqual([
            ['1-scandanavia'],
            ['1-east-asia', '1-central-asia'],
            ['2-sweden', '2-norway'],
            [],
            [],
            ['2-china', '2-japan', '2-skorea'],
            [],
            [],
            [],
            ['2-uzbekistan', '2-turkmenistan', '2-kyrgyzstan'],
            [],
            [],
            [],
        ]);
    });

    it('getMember returns proper member object', () => {
        expect(tree.getMember('2-sweden')).toEqual({
            name: 'Sweden',
            uid: '2-sweden',
            parent_uid: '1-scandanavia',
        });
    });

    it('getMember returns null for invalid memberUid', () => {
        expect(tree.getMember('bob-johansson')).toEqual(null);
    });

    it('getLineageIds returns proper member_uids', () => {
        expect(tree.getLineageIds('2-sweden')).toEqual(['0-eur', '1-scandanavia', '2-sweden']);
    });

    it('getLineage returns proper members', () => {
        expect(tree.getLineage('2-sweden')).toEqual([
            {name: 'Europe', uid: '0-eur', parent_uid: null},
            {name: 'Scandanavia', uid: '1-scandanavia', parent_uid: '0-eur'},
            {name: 'Sweden', uid: '2-sweden', parent_uid: '1-scandanavia'},
        ]);
    });

    it('getFullMemberName generates proper string', () => {
        expect(tree.getFullMemberName('2-sweden')).toEqual('Europe / Scandanavia / Sweden');
    });

    it('getParentId returns proper uid for parent', () => {
        const parentId = tree.getParentId('2-sweden');
        expect(parentId).toEqual('1-scandanavia');
    });

    it('getParent returns proper member object for parent', () => {
        const parentId = tree.getParent('2-sweden');
        expect(parentId).toEqual({
            name: 'Scandanavia',
            uid: '1-scandanavia',
            parent_uid: '0-eur',
        });
    });

    it('getChildIds for root returns top-level members', () => {
        const childIds = tree.getChildrenIds(null);
        expect(childIds).toEqual(['0-eur', '0-asia']);
    });

    it("gatherSubtreeIds returns member's id and the ids of all descendants", () => {
        const expected = ['1-east-asia', '2-china', '2-japan', '2-skorea'];

        const ids = gatherSubtreeIds(tree, '1-east-asia');
        expect(ids.sort()).toEqual(expected.sort());
    });

    it("dropNode removes node and all of it's descendants", () => {
        tree.dropNode('0-eur');
        expect(tree._ids.length).toEqual(9);
    });

    it('clone creates and returns copy of tree', () => {
        const newTree = tree.clone();
        expect(newTree.members).toEqual(tree.members);
    });
});
