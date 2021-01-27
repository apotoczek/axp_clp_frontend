import 'hooks';
import 'extenders';

let testsContext = require.context('./', true, /test_.+\.js$/i);
testsContext.keys().forEach(testsContext);
