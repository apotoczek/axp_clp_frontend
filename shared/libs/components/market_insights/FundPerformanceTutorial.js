/* Automatically transformed from AMD to ES6. Beware of code smell. */
import BaseComponent from 'src/libs/components/basic/BaseComponent';

export default function(opts, components) {
    let self = new BaseComponent(opts, components);

    self.define_default_template(`
            <table class="callout-table callout-info">
               <tr>
                   <td><span class="icon-info"></td>
                   <td style="padding-left: 0px !important;">
                       <span>Hello Please, i tell you things about this page</span>
                   </td>
               </tr>
           </table>

            <h1> Blah Blah wahtever im a chart, just work with me here</h1>
            <table class="callout-table callout-info">
                <tr>
                    <td><span class="icon-info"></td>
                    <td style="padding-left: 0px !important;">
                        <span>Cant have too much info</span>
                    </td>
                </tr>
            </table>
        `);

    return self;
}
