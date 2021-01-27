import Aside from 'src/libs/components/basic/Aside';
import HTMLContent from 'src/libs/components/basic/HTMLContent';

export default opts => {
    let instance = opts.instance;

    let title = {
        id: 'title',
        component: HTMLContent,
        html: `<h2 class="text-center" style="padding:20px 0px;">${opts.title}<h2/>`,
    };

    instance.widget = {
        id: opts.widget_id,
        component: Aside,
        template: 'tpl_aside_body',
        layout: {
            body: ['title', 'group_by', 'chart_wrapper', 'table_wrapper'],
        },
        components: [
            title,
            instance.configs.group_by,
            instance.configs.chart_wrapper,
            instance.configs.table_wrapper,
        ],
    };

    return instance;
};
