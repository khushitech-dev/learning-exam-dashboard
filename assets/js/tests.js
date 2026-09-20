/* ============================================================
   PERSONAL LEARNING DASHBOARD - TEST QUESTION BANK
   Each topic has a pool of questions. Tests are built from these.
   ============================================================ */

/* Each question:
   {
     q: "question text",
     options: ["A","B","C","D"],
     answer: index of correct option,
     explanation: "why correct / what to revise"
   }
*/

const QUESTION_BANK = {};

const pool = (topicKey, questions) => {
  QUESTION_BANK[topicKey] = QUESTION_BANK[topicKey] || [];
  QUESTION_BANK[topicKey].push(...questions);
};

/* ---------------- HTML ---------------- */
pool('html_structure_&_tags', [
  { q: 'Which element is the root of an HTML document?', options: ['<html>', '<head>', '<body>', '<root>'], answer: 0, explanation: '<html> is the root element; everything lives inside it.' },
  { q: 'Where does the <meta> tag usually live?', options: ['<head>', '<body>', '<footer>', '<section>'], answer: 0, explanation: '<meta> goes inside <head>.' },
  { q: 'Which tag defines a paragraph?', options: ['<p>', '<para>', '<txt>', '<h>'], answer: 0, explanation: '<p> defines a paragraph.' },
  { q: 'Which tag is the largest heading?', options: ['<h1>', '<h6>', '<heading>', '<h>'], answer: 0, explanation: '<h1> is the largest heading.' }
]);
pool('html_links_&_images', [
  { q: 'Which attribute sets the URL in a link?', options: ['href', 'src', 'link', 'url'], answer: 0, explanation: 'Links use href; images use src.' },
  { q: 'Which tag shows an image?', options: ['<img>', '<image>', '<pic>', '<src>'], answer: 0, explanation: '<img> is used for images.' },
  { q: 'What does target="_blank" do?', options: ['Opens in new tab', 'Closes tab', 'Refreshes', 'Goes back'], answer: 0, explanation: '_blank opens the link in a new tab.' }
]);
pool('html_forms', [
  { q: 'Which tag creates a form?', options: ['<form>', '<input>', '<field>', '<submit>'], answer: 0, explanation: '<form> contains input elements.' },
  { q: 'Which attribute specifies where form data is sent?', options: ['action', 'method', 'target', 'data'], answer: 0, explanation: 'action defines the submission URL.' },
  { q: 'Text input uses which <input> type?', options: ['text', 'txt', 'string', 'words'], answer: 0, explanation: 'type="text" is the default text input.' }
]);
pool('html_semantic_html', [
  { q: 'Which tag is semantic for a navigation area?', options: ['<nav>', '<div>', '<span>', '<a>'], answer: 0, explanation: '<nav> describes a navigation section semantically.' },
  { q: 'Which element best represents the main content?', options: ['<main>', '<div>', '<aside>', '<center>'], answer: 0, explanation: '<main> marks the primary content.' },
  { q: 'Aside content is typically placed in?', options: ['<aside>', '<footer>', '<header>', '<nav>'], answer: 0, explanation: '<aside> holds related, secondary content.' }
]);

/* ---------------- CSS ---------------- */
pool('css_selectors', [
  { q: 'How do you select an element by class?', options: ['.class', '#id', 'class', 'element'], answer: 0, explanation: 'A dot (.) targets a class.' },
  { q: 'How do you select an element by id?', options: ['#id', '.id', '*id', 'id='], answer: 0, explanation: 'A hash (#) targets an id.' },
  { q: 'The universal selector is?', options: ['*', '#', '.', '&'], answer: 0, explanation: '* matches every element.' }
]);
pool('css_box_model', [
  { q: 'The box model consists of content, padding, border and ____?', options: ['margin', 'spacing', 'gap', 'offset'], answer: 0, explanation: 'margin is the outermost part.' },
  { q: 'box-sizing: border-box makes width include?', options: ['padding + border', 'margin', 'content only', 'height only'], answer: 0, explanation: 'border-box includes padding and border in width.' },
  { q: 'Space between content and border is called?', options: ['padding', 'margin', 'gap', 'outline'], answer: 0, explanation: 'padding sits between content and border.' }
]);
pool('css_flexbox', [
  { q: 'Which property makes an element a flex container?', options: ['display: flex', 'flex: 1', 'position: flex', 'align: flex'], answer: 0, explanation: 'display: flex enables flexbox.' },
  { q: 'Which property works on the main axis?', options: ['justify-content', 'align-items', 'align-content', 'order'], answer: 0, explanation: 'justify-content aligns along the main axis.' },
  { q: 'align-items aligns items along which axis?', options: ['cross axis', 'main axis', 'z axis', 'diagonal'], answer: 0, explanation: 'align-items works on the cross axis.' }
]);
pool('css_grid', [
  { q: 'Which property defines grid columns?', options: ['grid-template-columns', 'grid-cols', 'columns', 'grid-flow'], answer: 0, explanation: 'grid-template-columns sets the column track sizes.' },
  { q: 'display: grid creates a ____ container?', options: ['grid', 'flex', 'table', 'block'], answer: 0, explanation: 'display: grid activates CSS Grid.' },
  { q: 'gap sets spacing between?', options: ['rows and columns', 'elements only outside', 'just rows', 'just borders'], answer: 0, explanation: 'gap controls row/column gutters.' }
]);
pool('css_responsive_design', [
  { q: 'Which feature makes a site responsive to screen width?', options: ['media queries', 'fixed widths', 'inline styles', 'web fonts'], answer: 0, explanation: 'Media queries adapt styles per viewport.' },
  { q: 'Relative units like % and vw are ____?', options: ['responsive', 'absolute', 'fixed', 'static'], answer: 0, explanation: 'Relative units scale with the viewport.' },
  { q: '@media is used to apply styles based on?', options: ['device conditions', 'browser color', 'server speed', 'cookie size'], answer: 0, explanation: '@media queries respond to device characteristics.' }
]);

/* ---------------- JAVASCRIPT ---------------- */
pool('js_variables', [
  { q: 'Which keyword declares a block-scoped variable?', options: ['let', 'var', 'const', 'static'], answer: 0, explanation: 'let is block-scoped.' },
  { q: 'Which keyword declares a constant that cannot be reassigned?', options: ['const', 'let', 'var', 'final'], answer: 0, explanation: 'const prevents reassignment.' },
  { q: 'Which old keyword is function-scoped?', options: ['var', 'let', 'const', 'scope'], answer: 0, explanation: 'var is function-scoped, unlike let/const.' }
]);
pool('js_data_types', [
  { q: 'Which is NOT a primitive data type?', options: ['Object', 'Number', 'String', 'Boolean'], answer: 0, explanation: 'Object is a reference type, not primitive.' },
  { q: 'The type of "5" (quoted) is?', options: ['string', 'number', 'boolean', 'char'], answer: 0, explanation: 'Quoted values are strings.' },
  { q: 'typeof null returns?', options: ['object', 'null', 'undefined', 'boolean'], answer: 0, explanation: 'A historical quirk: typeof null === "object".' }
]);
pool('js_operators', [
  { q: 'What does === check?', options: ['value and type', 'value only', 'type only', 'memory'], answer: 0, explanation: '=== is strict equality (value + type).' },
  { q: 'Which operator adds a value?', options: ['+', '#', '&', '@'], answer: 0, explanation: 'The plus sign is the addition operator.' },
  { q: 'The ?? operator is the nullish ____?', options: ['coalescing', 'assertion', 'spread', 'element'], answer: 0, explanation: '?? returns RHS when LHS is null/undefined.' }
]);
pool('js_conditions', [
  { q: 'Which keyword runs code when if() is false?', options: ['else', 'then', 'case', 'switch-default'], answer: 0, explanation: 'else runs the fallback branch.' },
  { q: 'The ternary operator has how many parts?', options: ['3', '2', '4', '1'], answer: 0, explanation: 'cond ? a : b (3 parts).' },
  { q: 'switch compares using which equality?', options: ['strict ===', 'loose ==', 'abstract', 'reference'], answer: 0, explanation: 'switch uses strict equality.' }
]);
pool('js_loops', [
  { q: 'Which loop guarantees at least one run?', options: ['do...while', 'for', 'while', 'for...in'], answer: 0, explanation: 'do...while checks condition after running.' },
  { q: 'for (let i=0; i<5; i++) runs how many times?', options: ['5', '4', '6', 'infinite'], answer: 0, explanation: '0,1,2,3,4 = 5 iterations.' },
  { q: 'for...of iterates over?', options: ['values', 'keys', 'properties', 'indexes only'], answer: 0, explanation: 'for...of yields values.' }
]);
pool('js_functions', [
  { q: 'Which declares a function?', options: ['function name() {}', 'def name()', 'func name()', 'method name()'], answer: 0, explanation: 'function keyword declares a function.' },
  { q: 'A function can return a value using?', options: ['return', 'give', 'emit', 'output'], answer: 0, explanation: 'return sends a value back.' },
  { q: 'Parameters are the values declared; arguments are?', options: ['passed in', 'returned', 'declared', 'global'], answer: 0, explanation: 'Arguments are the actual values passed.' }
]);
pool('js_arrow_functions', [
  { q: 'Arrow functions use which symbol?', options: ['=>', '->', '<-', '>>'], answer: 0, explanation: '=> is the arrow syntax.' },
  { q: 'Arrow functions do NOT have their own?', options: ['this', 'parameters', 'body', 'return'], answer: 0, explanation: 'Arrow functions inherit this from the enclosing scope.' },
  { q: 'const f = (a,b) => a+b omits the ____?', options: ['return keyword', 'parameters', 'arrow', 'body'], answer: 0, explanation: 'Implicit return omits return for single expressions.' }
]);
pool('js_arrays', [
  { q: 'How do you access the first array element?', options: ['arr[0]', 'arr.first()', 'arr.1', 'arr[1]'], answer: 0, explanation: 'Arrays are 0-indexed.' },
  { q: 'Which method adds to the end?', options: ['push', 'pop', 'shift', 'unshift'], answer: 0, explanation: 'push adds to the end.' },
  { q: 'The length of [1,2,3] is?', options: ['3', '2', '4', '1'], answer: 0, explanation: 'length equals number of elements (3).' }
]);
pool('js_objects', [
  { q: 'Which creates an object?', options: ['{ }', '[ ]', '( )', '< >'], answer: 0, explanation: 'Curly braces create objects.' },
  { q: 'Access a property named "name" via?', options: ['obj.name', 'obj->name', 'obj::name', 'obj(name)'], answer: 0, explanation: 'Dot notation: obj.name.' },
  { q: 'Bracket notation uses?', options: ['obj["name"]', 'obj("name")', 'obj<name>', 'obj#name'], answer: 0, explanation: 'Bracket notation: obj["name"].' }
]);
pool('js_array_methods', [
  { q: 'Which method runs a function on every item?', options: ['map', 'filter', 'reduce', 'forEach'], answer: 0, explanation: 'map transforms each element.' },
  { q: 'Which method keeps items matching a condition?', options: ['filter', 'map', 'find', 'sort'], answer: 0, explanation: 'filter returns items passing the test.' },
  { q: 'Which method finds the first matching item?', options: ['find', 'filter', 'map', 'every'], answer: 0, explanation: 'find returns the first match.' },
  { q: 'reduce reduces the array into?', options: ['a single value', 'a new array', 'nothing', 'a string only'], answer: 0, explanation: 'reduce accumulates to one value.' }
]);
pool('js_string_methods', [
  { q: 'Which method splits a string into an array?', options: ['split', 'slice', 'splice', 'join'], answer: 0, explanation: 'split divides by a separator.' },
  { q: 'Which converts to uppercase?', options: ['toUpperCase', 'upper', 'capitalize', 'toCap'], answer: 0, explanation: 'toUpperCase() converts to uppercase.' },
  { q: 'slice extracts?', options: ['a portion', 'the whole', 'a number', 'a boolean'], answer: 0, explanation: 'slice extracts a substring.' }
]);
pool('js_scope', [
  { q: 'A variable declared inside a function is?', options: ['local', 'global', 'module', 'static'], answer: 0, explanation: 'Function-scoped variables are local.' },
  { q: 'Global variables are accessible?', options: ['everywhere', 'only in one block', 'only in functions', 'never'], answer: 0, explanation: 'Globals are accessible throughout.' },
  { q: 'Block scope applies to?', options: ['let and const', 'var', 'functions', 'objects'], answer: 0, explanation: 'let/const are block-scoped; var is not.' }
]);
pool('js_hoisting', [
  { q: 'Function declarations are hoisted, meaning?', options: ['callable before definition', 'not usable', 'deleted', 'renamed'], answer: 0, explanation: 'Function declarations hoist fully.' },
  { q: 'var variables are hoisted but?', options: ['initialized as undefined', 'given value', 'thrown', 'skipped'], answer: 0, explanation: 'var hoists but stays undefined until assignment.' },
  { q: 'let/const hoisting leads to?', options: ['temporal dead zone', 'immediate value', 'global leak', 'no hoisting'], answer: 0, explanation: 'let/const are in a temporal dead zone.' }
]);
pool('js_dom', [
  { q: 'Which selects by id?', options: ['getElementById', 'getByClass', 'queryBy', 'findById'], answer: 0, explanation: 'document.getElementById selects by id.' },
  { q: 'querySelector returns?', options: ['first match', 'all matches', 'a list', 'the parent'], answer: 0, explanation: 'querySelector returns the first match.' },
  { q: 'document is the entry to the?', options: ['DOM', 'CSS', 'server', 'database'], answer: 0, explanation: 'document represents the DOM.' }
]);
pool('js_events', [
  { q: 'Which adds an event listener?', options: ['addEventListener', 'onEvent', 'listen', 'attach'], answer: 0, explanation: 'addEventListener attaches handlers.' },
  { q: 'A common event for clicks is?', options: ['click', 'press', 'tap', 'select'], answer: 0, explanation: 'The click event fires on clicks.' },
  { q: 'event.target refers to?', options: ['the element the event fired on', 'the parent', 'the window', 'the body'], answer: 0, explanation: 'event.target is the origin of the event.' }
]);
pool('js_es6+', [
  { q: 'Template literals use which quotes?', options: ['backticks', 'single', 'double', 'brackets'], answer: 0, explanation: 'Backticks enable template literals.' },
  { q: 'Default parameters are set with?', options: ['=', ':', '?', '&'], answer: 0, explanation: 'function f(a = 1) sets a default.' },
  { q: 'class is on which side of ES6?', options: ['new syntax', 'old syntax', 'removed', 'browser only'], answer: 0, explanation: 'class syntax was added in ES6.' }
]);
pool('js_destructuring', [
  { q: 'Which destructures an array?', options: ['const [a,b] = arr', 'const a= arr.0', 'const {a} = arr', 'arr.split(a,b)'], answer: 0, explanation: 'Array destructuring uses [] syntax.' },
  { q: 'Object destructuring uses?', options: ['const {a} = obj', 'const [a] = obj', 'obj.a=b', 'const a: obj.a'], answer: 0, explanation: 'Object destructuring uses {} syntax.' },
  { q: 'Destructuring with rest: const [a, ...rest] captures?', options: ['remaining items', 'first item', 'last item', 'none'], answer: 0, explanation: '...rest gathers the remaining items.' }
]);
pool('js_spread_rest', [
  { q: 'Spread (...) copies?', options: ['elements/properties', 'references only', 'functions', 'none'], answer: 0, explanation: 'Spread copies the values into a new collection.' },
  { q: 'const copy = [...arr] creates?', options: ['a shallow copy', 'a deep copy', 'a string', 'an object'], answer: 0, explanation: 'Spread makes a shallow copy.' },
  { q: 'Rest parameters gather into?', options: ['an array', 'an object', 'a string', 'a number'], answer: 0, explanation: 'Rest collects arguments into an array.' }
]);
pool('js_promises', [
  { q: 'A Promise represents?', options: ['an async operation', 'a sync loop', 'an object clone', 'a string'], answer: 0, explanation: 'Promises represent async completion/failure.' },
  { q: 'Which resolves a promise?', options: ['resolve()', 'done()', 'finish()', 'end()'], answer: 0, explanation: 'resolve() fulfills the promise.' },
  { q: '.then() runs when the promise?', options: ['fulfills', 'is created', 'is rejected always', 'never'], answer: 0, explanation: '.then handles fulfillment.' }
]);
pool('js_async_await', [
  { q: 'async function always returns?', options: ['a Promise', 'a string', 'undefined', 'a number'], answer: 0, explanation: 'async functions return a Promise.' },
  { q: 'await can only be used?', options: ['inside async functions', 'in loops', 'in objects', 'anywhere'], answer: 0, explanation: 'await requires an async context.' },
  { q: 'Errors in async are caught with?', options: ['try/catch', 'if/else', 'switch', 'while'], answer: 0, explanation: 'try/catch handles async errors.' }
]);
pool('js_fetch_api', [
  { q: 'fetch() returns?', options: ['a Promise', 'a string', 'a number', 'an array'], answer: 0, explanation: 'fetch returns a Promise resolving to a Response.' },
  { q: 'The default HTTP method for fetch is?', options: ['GET', 'POST', 'PUT', 'DELETE'], answer: 0, explanation: 'fetch defaults to GET.' },
  { q: 'To parse JSON use response?', options: ['.json()', '.text()', '.parse()', '.string()'], answer: 0, explanation: 'response.json() parses JSON.' }
]);
pool('js_error_handling', [
  { q: 'Which block catches errors?', options: ['catch', 'finally', 'throw', 'assert'], answer: 0, explanation: 'catch handles thrown errors.' },
  { q: 'throw is used to?', options: ['raise an error', 'return a value', 'log to console', 'stop the loop'], answer: 0, explanation: 'throw raises a custom error.' },
  { q: 'finally runs?', options: ['always', 'only on error', 'only on success', 'never'], answer: 0, explanation: 'finally runs regardless of outcome.' }
]);
pool('js_modules', [
  { q: 'Which exports a value?', options: ['export const x = 1', 'import x = 1', 'module x', 'public x'], answer: 0, explanation: 'export makes values importable.' },
  { q: 'import { x } from "./f.js" imports?', options: ['a named export', 'everything', 'nothing', 'a class'], answer: 0, explanation: 'Named imports use {} syntax.' },
  { q: 'Default exports are imported?', options: ['without braces', 'with braces only', 'as arrays', 'never'], answer: 0, explanation: 'Default imports omit braces.' }
]);
pool('js_local_storage', [
  { q: 'Which stores data in the browser persistently?', options: ['localStorage', 'sessionStorage', 'cookies', 'cache'], answer: 0, explanation: 'localStorage persists across sessions.' },
  { q: 'localStorage stores data as?', options: ['strings', 'objects', 'numbers', 'arrays'], answer: 0, explanation: 'localStorage only stores strings.' },
  { q: 'To store an object you must?', options: ['JSON.stringify it', 'do nothing', 'freeze it', 'clone it'], answer: 0, explanation: 'Serialize objects with JSON.stringify.' }
]);
pool('js_json', [
  { q: 'JSON stands for?', options: ['JavaScript Object Notation', 'Java Object Network', 'JSON Object Node', 'Jotted Standard'], answer: 0, explanation: 'JavaScript Object Notation.' },
  { q: 'JSON.parse does?', options: ['converts JSON string to object', 'object to string', 'compresses', 'deletes'], answer: 0, explanation: 'JSON.parse parses JSON text into an object.' },
  { q: 'JSON.stringify does?', options: ['object to JSON string', 'string to object', 'formats HTML', 'validates CSS'], answer: 0, explanation: 'JSON.stringify serializes to a string.' }
]);

/* ---------------- REACT ---------------- */
pool('react_jsx', [
  { q: 'JSX is a syntax extension for?', options: ['JavaScript', 'CSS', 'HTML only', 'Python'], answer: 0, explanation: 'JSX lets you write HTML-like markup in JS.' },
  { q: 'JSX expressions are wrapped in?', options: ['{ }', '( )', '[ ]', '< >'], answer: 0, explanation: 'Expressions go inside {} in JSX.' },
  { q: 'A component must return?', options: ['a single root element', 'two roots', 'a string only', 'nothing'], answer: 0, explanation: 'JSX requires one root element (or fragment).' }
]);
pool('react_components', [
  { q: 'Component names must?', options: ['start with a capital letter', 'be lowercase', 'include a dash', 'end with .js'], answer: 0, explanation: 'Capitalize to distinguish from HTML tags.' },
  { q: 'A function component is?', options: ['a function returning JSX', 'a function returning numbers', 'a class only', 'a div'], answer: 0, explanation: 'Function components return JSX.' }
]);
pool('react_props', [
  { q: 'Props are passed to a component via?', options: ['attributes', 'globals', 'state', 'events'], answer: 0, explanation: 'Props are passed like attributes.' },
  { q: 'Props are?', options: ['read-only', 'mutable', 'global', 'async'], answer: 0, explanation: 'Props are immutable.' }
]);
pool('react_state', [
  { q: 'Which hook declares state?', options: ['useState', 'useEffect', 'useRef', 'useMemo'], answer: 0, explanation: 'useState manages state.' },
  { q: 'The first value of useState(0) is?', options: ['the current state (0)', 'a setter', 'a ref', 'an object'], answer: 0, explanation: 'The first value is the current state.' },
  { q: 'The second value returned by useState is?', options: ['the state setter', 'the value', 'a ref', 'a memo'], answer: 0, explanation: 'The second is the function to update state.' }
]);
pool('react_useeffect', [
  { q: 'useEffect runs?', options: ['after render', 'before render', 'never', 'on import'], answer: 0, explanation: 'useEffect runs after the render.' },
  { q: 'An empty dependency array [] means it runs?', options: ['once on mount', 'every render', 'on every click', 'never'], answer: 0, explanation: '[] runs the effect once.' },
  { q: 'Dependencies tell useEffect?', options: ['when to re-run', 'how to render', 'what to import', 'where to store'], answer: 0, explanation: 'Deps control re-runs.' }
]);
pool('react_conditional_rendering', [
  { q: 'Conditional rendering can use?', options: ['&& and ternaries', 'only if/else', 'CSS only', 'loops'], answer: 0, explanation: 'Logical && and ?: render conditionally.' },
  { q: '{cond && <X/>} renders <X/> when cond is?', options: ['truthy', 'falsy', 'null', 'string'], answer: 0, explanation: 'Truthy cond renders the element.' }
]);
pool('react_lists_keys', [
  { q: 'Which method renders a list?', options: ['map', 'filter', 'reduce', 'forEach'], answer: 0, explanation: 'map creates list elements.' },
  { q: 'Keys help React?', options: ['identify items', 'style them', 'import them', 'delete them'], answer: 0, explanation: 'Keys identify each list item.' }
]);
pool('react_useref', [
  { q: 'useRef returns?', options: ['a mutable ref object', 'a setter', 'current state', 'a prop'], answer: 0, explanation: 'useRef gives a persistent mutable object.' },
  { q: 'The current value is accessed via?', options: ['ref.current', 'ref.value', 'ref.data', 'ref.now'], answer: 0, explanation: 'ref.current holds the value.' }
]);

/* ---------------- NODE ---------------- */
pool('node_install_setup', [
  { q: 'Node.js runtime runs?', options: ['JavaScript', 'Python', 'Java', 'C#'], answer: 0, explanation: 'Node runs JavaScript outside the browser.' },
  { q: 'The command to check Node version is?', options: ['node -v', 'node --version-check', 'ver node', 'node check'], answer: 0, explanation: 'node -v prints the version.' }
]);
pool('node_npm', [
  { q: 'npm stands for?', options: ['Node Package Manager', 'Node Project Manager', 'New Package Module', 'Node Private Manager'], answer: 0, explanation: 'Node Package Manager.' },
  { q: 'Which installs a package?', options: ['npm install <pkg>', 'npm add <pkg>', 'node get <pkg>', 'npm run <pkg>'], answer: 0, explanation: 'npm install adds a package.' },
  { q: 'package.json stores?', options: ['project metadata and deps', 'the server code', 'the database', 'log files'], answer: 0, explanation: 'package.json is the project manifest.' }
]);
pool('node_modules_require', [
  { q: 'Which imports a module?', options: ['require()', 'import() sync', 'include()', 'use()'], answer: 0, explanation: 'CommonJS uses require().' },
  { q: 'module.exports makes something?', options: ['available to other files', 'private', 'global', 'deleted'], answer: 0, explanation: 'module.exports exports values.' }
]);
pool('node_http_module', [
  { q: 'Which core module creates a server?', options: ['http', 'fs', 'path', 'os'], answer: 0, explanation: 'The http module creates servers.' },
  { q: 'http.createServer returns?', options: ['a server', 'a port', 'an array', 'a file'], answer: 0, explanation: 'It creates a server object.' }
]);
pool('node_express_basics', [
  { q: 'Express is a?', options: ['web framework', 'database', 'compiler', 'test runner'], answer: 0, explanation: 'Express is a minimalist web framework.' },
  { q: 'app.get("/", handler) handles?', options: ['GET requests', 'POST only', 'delete requests', 'websockets'], answer: 0, explanation: 'app.get handles GET routes.' }
]);
pool('node_rest_apis', [
  { q: 'REST APIs use HTTP methods like?', options: ['GET, POST, PUT, DELETE', 'SELECT, FROM', 'CREATE, DROP', 'OPEN, CLOSE'], answer: 0, explanation: 'REST maps actions to HTTP verbs.' },
  { q: 'A typical response format is?', options: ['JSON', 'CSV only', 'XML binary', 'plain text only'], answer: 0, explanation: 'REST commonly returns JSON.' }
]);

/* ---------------- GIT ---------------- */
pool('git_what_is_git', [
  { q: 'Git is a?', options: ['version control system', 'compiler', 'database', 'browser'], answer: 0, explanation: 'Git tracks changes to files over time.' },
  { q: 'Git tracks?', options: ['changes to files', 'only images', 'network traffic', 'memory'], answer: 0, explanation: 'Git records changes to your code.' }
]);
pool('git_setup_config', [
  { q: 'Which sets your name?', options: ['git config --global user.name "x"', 'git user x', 'git set name', 'git name'], answer: 0, explanation: 'git config sets identity.' },
  { q: 'The command to check config is?', options: ['git config --list', 'git list', 'git show config', 'git check'], answer: 0, explanation: 'git config --list shows settings.' }
]);
pool('git_add_commit', [
  { q: 'Which stages changes?', options: ['git add', 'git commit', 'git push', 'git clone'], answer: 0, explanation: 'git add stages files.' },
  { q: 'Which records a snapshot?', options: ['git commit', 'git add', 'git status', 'git log'], answer: 0, explanation: 'git commit saves the staged snapshot.' },
  { q: 'git add . stages?', options: ['all changes', 'nothing', 'only one file', 'the config'], answer: 0, explanation: '. stages all changes.' }
]);
pool('git_branching', [
  { q: 'Which creates a branch?', options: ['git branch name', 'git new name', 'git mk name', 'git switch name'], answer: 0, explanation: 'git branch creates a branch.' },
  { q: 'Which switches branches?', options: ['git checkout name', 'git add name', 'git commit name', 'git log name'], answer: 0, explanation: 'git checkout (or switch) changes branches.' }
]);
pool('git_merging', [
  { q: 'Which merges branches?', options: ['git merge', 'git combine', 'git unite', 'git join'], answer: 0, explanation: 'git merge joins branches.' }
]);
pool('git_remote_push_pull', [
  { q: 'Which uploads commits?', options: ['git push', 'git pull', 'git fetch', 'git clone'], answer: 0, explanation: 'git push uploads to remote.' },
  { q: 'Which downloads commits?', options: ['git pull', 'git push', 'git commit', 'git add'], answer: 0, explanation: 'git pull fetches and merges.' }
]);
pool('git_clone_fork', [
  { q: 'Which copies a remote repo?', options: ['git clone', 'git copy', 'git dup', 'git spawn'], answer: 0, explanation: 'git clone copies a repository.' }
]);

/* ---------------- DSA ---------------- */
pool('dsa_time_complexity', [
  { q: 'Big-O describes?', options: ['growth rate of runtime', 'exact runtime', 'memory only', 'line count'], answer: 0, explanation: 'Big-O expresses how runtime scales.' },
  { q: 'A loop over n items is roughly?', options: ['O(n)', 'O(1)', 'O(n^2)', 'O(log n)'], answer: 0, explanation: 'A single pass is linear.' },
  { q: 'Nested loops over n are?', options: ['O(n^2)', 'O(n)', 'O(1)', 'O(log n)'], answer: 0, explanation: 'Two nested passes give quadratic.' }
]);
pool('dsa_arrays', [
  { q: 'Accessing an array by index is?', options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'], answer: 0, explanation: 'Indexed access is constant time.' },
  { q: 'Arrays store elements?', options: ['contiguously', 'randomly', 'in a tree', 'in a queue'], answer: 0, explanation: 'Arrays are contiguous in memory.' }
]);
pool('dsa_stacks', [
  { q: 'A stack follows which order?', options: ['LIFO', 'FIFO', 'random', 'sorted'], answer: 0, explanation: 'Last In First Out.' },
  { q: 'Which adds to a stack?', options: ['push', 'enqueue', 'insert-front', 'append'], answer: 0, explanation: 'push adds to the top.' }
]);
pool('dsa_queues', [
  { q: 'A queue follows which order?', options: ['FIFO', 'LIFO', 'random', 'stacked'], answer: 0, explanation: 'First In First Out.' },
  { q: 'Which removes from the front of a queue?', options: ['dequeue', 'pop', 'shift-reverse', 'unshift'], answer: 0, explanation: 'dequeue removes the front.' }
]);
pool('dsa_hash_tables', [
  { q: 'A hash table provides average lookup of?', options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'], answer: 0, explanation: 'Average constant-time lookups.' },
  { q: 'The object/map in JS is a type of?', options: ['hash table', 'array', 'tree', 'queue'], answer: 0, explanation: 'JS objects act like hash tables.' }
]);
pool('dsa_recursion', [
  { q: 'Recursion is when a function?', options: ['calls itself', 'calls another', 'never returns', 'loops forever'], answer: 0, explanation: 'A recursive function calls itself.' },
  { q: 'Every recursion needs?', options: ['a base case', 'a loop', 'a global var', 'a class'], answer: 0, explanation: 'A base case stops recursion.' }
]);
pool('dsa_sorting', [
  { q: 'Merge sort has worst-case?', options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)'], answer: 0, explanation: 'Merge sort divides and conquers in n log n.' },
  { q: 'Bubble sort worst case is?', options: ['O(n^2)', 'O(n)', 'O(log n)', 'O(n log n)'], answer: 0, explanation: 'Bubble sort is quadratic.' }
]);
pool('dsa_searching', [
  { q: 'Binary search requires?', options: ['a sorted array', 'an unsorted array', 'a linked list', 'a hash table'], answer: 0, explanation: 'Binary search needs sorted data.' },
  { q: 'Binary search runs in?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n^2)'], answer: 0, explanation: 'Each step halves the range.' }
]);

/* ---------------- SQL ---------------- */
pool('sql_what_is_sql', [
  { q: 'SQL is a language for?', options: ['managing databases', 'styling pages', 'writing games', 'building UI'], answer: 0, explanation: 'SQL manages relational databases.' },
  { q: 'SQL stands for?', options: ['Structured Query Language', 'Simple Query Logic', 'System Query Language', 'Sorted Query List'], answer: 0, explanation: 'Structured Query Language.' }
]);
pool('sql_select', [
  { q: 'Which selects all columns?', options: ['SELECT * FROM t', 'GET ALL t', 'SELECT ALL t', 'FIND t'], answer: 0, explanation: 'SELECT * returns all columns.' },
  { q: 'Which keyword selects a column?', options: ['SELECT', 'FROM', 'WHERE', 'TABLE'], answer: 0, explanation: 'SELECT specifies columns.' }
]);
pool('sql_where', [
  { q: 'Which filters rows?', options: ['WHERE', 'HAVING only', 'FROM', 'ORDER'], answer: 0, explanation: 'WHERE filters rows.' },
  { q: 'Which operator tests equality in SQL?', options: ['=', '==', '===', 'EQ'], answer: 0, explanation: 'SQL uses a single = for equality.' }
]);
pool('sql_joins', [
  { q: 'Which join returns rows matching in both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN'], answer: 0, explanation: 'INNER JOIN returns only matches.' },
  { q: 'LEFT JOIN keeps?', options: ['all left-table rows', 'only matches', 'right rows only', 'nothing'], answer: 0, explanation: 'LEFT JOIN retains all left rows.' }
]);
pool('sql_aggregate_functions', [
  { q: 'Which counts rows?', options: ['COUNT()', 'SUM()', 'AVG()', 'MAX()'], answer: 0, explanation: 'COUNT tallies rows.' },
  { q: 'SUM() computes?', options: ['a total', 'an average', 'a max', 'a count'], answer: 0, explanation: 'SUM adds numeric values.' },
  { q: 'AVG() computes?', options: ['an average', 'a total', 'a max', 'a count'], answer: 0, explanation: 'AVG gives the mean.' }
]);
pool('sql_group_by', [
  { q: 'GROUP BY groups?', options: ['rows by a column', 'columns only', 'databases', 'indexes'], answer: 0, explanation: 'GROUP BY aggregates per group.' },
  { q: 'HAVING filters?', options: ['groups', 'individual rows', 'tables', 'columns'], answer: 0, explanation: 'HAVING filters aggregate groups.' }
]);

/* ---------------- NEXT ---------------- */
pool('next_pages_routing', [
  { q: 'Next.js is built on?', options: ['React', 'Vue', 'Angular', 'Svelte'], answer: 0, explanation: 'Next.js is a React framework.' },
  { q: 'In Next.js a file in pages/ becomes?', options: ['a route', 'a component only', 'an API', 'a style'], answer: 0, explanation: 'File-based routing maps files to routes.' }
]);
pool('next_data_fetching', [
  { q: 'SSG means?', options: ['Static Site Generation', 'Server Sync Group', 'Static Style Sheet', 'Server Side Grid'], answer: 0, explanation: 'SSG pre-builds pages at build time.' },
  { q: 'SSR means?', options: ['Server-Side Rendering', 'Static Site Ready', 'System Style Rendering', 'Spread Sheet Render'], answer: 0, explanation: 'SSR renders on each request.' }
]);
pool('next_link_navigation', [
  { q: 'Which component navigates without full reload?', options: ['<Link>', '<a> only', '<Nav>', '<Router>'], answer: 0, explanation: 'Link enables client-side navigation.' },
  { q: '<Link href="/about"> replaces?', options: ['an <a> tag', 'a div', 'a form', 'an image'], answer: 0, explanation: 'Link is Next.js navigation, similar to <a>.' }
]);

/* ============================================================
   EXTENDED QUESTION POOLS (all topics covered)
   ============================================================ */

/* ---- HTML ---- */
pool('html_headings_paragraphs', [
  { q: 'How many levels of headings exist in HTML?', options: ['6 (h1-h6)', '5 (h1-h5)', '7 (h1-h7)', '3 (h1-h3)'], answer: 0, explanation: 'HTML has six heading levels h1 through h6.' },
  { q: 'Which heading is of highest importance for SEO?', options: ['<h1>', '<h6>', '<strong>', '<title>'], answer: 0, explanation: 'A single <h1> usually represents the main topic of the page.' },
  { q: 'A paragraph tag can contain inline elements like?', options: ['<span>, <a>, <em>', '<div>, <section>', '<h1>, <ul>', '<table>, <form>'], answer: 0, explanation: 'Paragraphs hold phrasing content (inline elements).' }
]);
pool('html_lists', [
  { q: 'Which tag creates an unordered list?', options: ['<ul>', '<ol>', '<li>', '<list>'], answer: 0, explanation: '<ul> is for bullet-style lists.' },
  { q: 'Which tag creates an ordered list?', options: ['<ol>', '<ul>', '<dl>', '<li>'], answer: 0, explanation: '<ol> renders numbered items.' },
  { q: 'Each list item is wrapped in?', options: ['<li>', '<item>', '<row>', '<entry>'], answer: 0, explanation: '<li> defines each item inside a list.' }
]);
pool('html_tables', [
  { q: 'Which tag creates a table?', options: ['<table>', '<grid>', '<row>', '<data>'], answer: 0, explanation: '<table> defines a data table.' },
  { q: 'Which tag defines a table row?', options: ['<tr>', '<td>', '<th>', '<row>'], answer: 0, explanation: '<tr> is a table row.' },
  { q: 'Which tag makes a table header cell?', options: ['<th>', '<td>', '<thead>', '<hc>'], answer: 0, explanation: '<th> is the header cell, <td> is a normal cell.' }
]);
pool('html_input_types', [
  { q: 'Which <input> type shows a checkbox?', options: ['checkbox', 'check', 'box', 'toggle'], answer: 0, explanation: 'type="checkbox" renders a checkbox.' },
  { q: 'Which <input> type is for email?', options: ['email', 'text', 'mail', 'address'], answer: 0, explanation: 'type="email" enables email validation.' },
  { q: 'type="password" does what?', options: ['masks the input', 'encrypts the field', 'stores a hash', 'adds a label'], answer: 0, explanation: 'Password inputs mask the typed characters.' }
]);
pool('html_media_audio_video', [
  { q: 'Which tag embeds a video?', options: ['<video>', '<movie>', '<media>', '<clip>'], answer: 0, explanation: '<video> embeds a video player.' },
  { q: 'Which tag embeds audio?', options: ['<audio>', '<sound>', '<music>', '<voice>'], answer: 0, explanation: '<audio> embeds an audio player.' },
  { q: 'The source file is given in a?', options: ['<source> child tag', '<src> child tag', '<file> tag', 'a linked CSS'], answer: 0, explanation: '<source> inside media tags points to files.' }
]);
pool('html_meta_seo', [
  { q: 'Which tag holds the description for search results?', options: ['<meta name="description">', '<title> only', '<header>', '<footer>'], answer: 0, explanation: 'meta description summarizes the page for search engines.' },
  { q: 'meta viewport is used for?', options: ['responsive scaling', 'page caching', 'preloading', 'favicons'], answer: 0, explanation: 'viewport meta controls how the page scales on mobile.' },
  { q: 'The page title for SEO lives in?', options: ['<title>', '<h1>', '<head> style', '<meta name="title">'], answer: 0, explanation: '<title> is the document/serp title.' }
]);
pool('html_accessibility', [
  { q: 'Which attribute describes an image to screen readers?', options: ['alt', 'title', 'src', 'name'], answer: 0, explanation: 'alt provides accessible text for images.' },
  { q: 'Semantic landmarks help?', options: ['screen readers navigate', 'scripts run faster', 'CSS load', 'forms submit'], answer: 0, explanation: 'Semantic HTML gives screen readers structure.' },
  { q: 'Button labels should be?', options: ['descriptive and unique', 'long sentences', 'icons only', 'empty'], answer: 0, explanation: 'Clear labels make controls usable for assistive tech.' }
]);

/* ---- CSS ---- */
pool('css_colors_backgrounds', [
  { q: 'Which sets text color?', options: ['color', 'text-color', 'font-color', 'bg'], answer: 0, explanation: 'The color property sets foreground text color.' },
  { q: 'Which sets a background color?', options: ['background-color', 'color-background', 'bg', 'back'], answer: 0, explanation: 'background-color fills the element background.' },
  { q: 'An RGBA color adds?', options: ['alpha transparency', 'a gradient', 'a shadow', 'borders'], answer: 0, explanation: 'rgba() includes an alpha channel.' }
]);
pool('css_typography', [
  { q: 'Which sets the font?', options: ['font-family', 'font-style', 'family', 'type'], answer: 0, explanation: 'font-family names the typeface.' },
  { q: 'font-weight controls?', options: ['boldness', 'size', 'spacing', 'shape'], answer: 0, explanation: 'font-weight sets thin to black (100-900).' },
  { q: 'line-height controls?', options: ['vertical spacing between lines', 'letter spacing', 'word breaks', 'indentation'], answer: 0, explanation: 'line-height sets the gap between baselines.' }
]);
pool('css_positioning', [
  { q: 'position: fixed places an element?', options: ['relative to viewport', 'relative to parent', 'in normal flow only', 'at page top'], answer: 0, explanation: 'fixed is positioned against the viewport.' },
  { q: 'position: absolute positions relative to?', options: ['nearest positioned ancestor', 'the viewport', 'the parent always', 'the body only'], answer: 0, explanation: 'absolute anchors to the nearest positioned ancestor.' },
  { q: 'z-index works on?', options: ['positioned elements', 'only inline elements', 'only static', 'table cells'], answer: 0, explanation: 'z-index affects the stacking of positioned elements.' }
]);
pool('css_display_visibility', [
  { q: 'display: none does what?', options: ['removes from layout', 'hides but keeps space', 'fades out', 'shrinks to zero width'], answer: 0, explanation: 'display:none removes the element from layout entirely.' },
  { q: 'visibility: hidden does what?', options: ['hides but keeps layout space', 'removes from flow', 'collapses children', 'disables clicks only'], answer: 0, explanation: 'visibility:hidden keeps the box but makes it invisible.' },
  { q: 'Which is NOT a display value?', options: ['opacity', 'block', 'inline-block', 'flex'], answer: 0, explanation: 'opacity is a separate property.' }
]);
pool('css_media_queries', [
  { q: 'Which keyword starts a media query?', options: ['@media', '@responsive', '@device', '@screen'], answer: 0, explanation: '@media applies styles based on device features.' },
  { q: 'The query targets screen size using?', options: ['min-width / max-width', 'font-size', 'padding', 'grid'], answer: 0, explanation: 'Width conditions in media queries toggle responsive layouts.' },
  { q: 'Print styles use which media type?', options: ['print', 'paper', 'document', 'monochrome'], answer: 0, explanation: 'media="print" styles apply when printing.' }
]);
pool('css_pseudo_classes', [
  { q: 'which is a pseudo-class for a link that is hovered?', options: [':hover', '::hover', '.hover', '#hover'], answer: 0, explanation: ':hover styles the element under the pointer.' },
  { q: 'Which selects the first child?', options: [':first-child', '::first', ':nth(1)', '.first'], answer: 0, explanation: ':first-child targets the first child element.' },
  { q: ':focus applies when an element?', options: ['is focused', 'is hovered', 'is clicked and released', 'scrolls'], answer: 0, explanation: ':focus targets keyboard/mouse-focused elements.' }
]);
pool('css_pseudo_elements', [
  { q: 'Pseudo-elements use which selector syntax?', options: ['::', ':', '--', '..'], answer: 0, explanation: 'Pseudo-elements like ::before use the double colon.' },
  { q: '::before inserts content?', options: ['before the element content', 'after the element', 'outside the page', 'in a different file'], answer: 0, explanation: '::before places content before the element content.' },
  { q: 'Which needs the content property?', options: ['::before / ::after', ':hover', ':first-child', '#id'], answer: 0, explanation: 'Generated content requires the content property.' }
]);
pool('css_transitions', [
  { q: 'Which property animates between states?', options: ['transition', 'transform', 'animation-delay', 'flex'], answer: 0, explanation: 'transition smoothly interpolates property changes.' },
  { q: 'transition: all .3s animates?', options: ['every changing property over 300ms', 'only sizes', 'nothing', 'colors only'], answer: 0, explanation: 'Shortcuts like this animate all changed properties.' },
  { q: 'transition-timing-function defines?', options: ['the easing curve', 'the duration', 'which element', 'the delay'], answer: 0, explanation: 'e.g. ease/ease-in/linear define the curve.' }
]);
pool('css_animations', [
  { q: 'Keyframes are defined with?', options: ['@keyframes', '@animate', 'keyframes()', '@move'], answer: 0, explanation: '@keyframes defines animation frames.' },
  { q: 'Which attaches an animation to an element?', options: ['animation', 'transition', 'transform', 'keyframe'], answer: 0, explanation: 'The animation property runs a keyframe animation.' },
  { q: 'animation-iteration-count: infinite does what?', options: ['loops forever', 'runs once', 'runs twice', 'pauses'], answer: 0, explanation: 'Infinite repeats the animation endlessly.' }
]);
pool('css_variables_custom_props', [
  { q: 'CSS custom properties start with?', options: ['--', '$', '@', '#'], answer: 0, explanation: 'Custom properties are declared as --name.' },
  { q: 'Which reads a custom property?', options: ['var(--name)', 'get(--name)', 'use(--name)', 'value(--name)'], answer: 0, explanation: 'var() resolves the custom property value.' },
  { q: 'Custom properties are inherited by?', options: ['descendants', 'only siblings', 'parents', 'nobody'], answer: 0, explanation: 'Custom property values inherit down the DOM.' }
]);
pool('css_units', [
  { q: 'Which is a relative unit?', options: ['rem', 'px', 'pt', 'mm'], answer: 0, explanation: 'rem is relative to the root font size.' },
  { q: '1rem is usually equal to?', options: ['the root font-size (16px default)', '1px', '10px', '1em of parent'], answer: 0, explanation: 'rem relates to the root element size.' },
  { q: 'vw stands for?', options: ['viewport width', 'variable width', 'vertical width', 'very wide'], answer: 0, explanation: '1vw is 1% of the viewport width.' }
]);
pool('css_sass_scss', [
  { q: 'Sass is a?', options: ['CSS preprocessor', 'CSS framework', 'design tool', 'build system'], answer: 0, explanation: 'Sass compiles into plain CSS.' },
  { q: 'SCSS variables use which sign?', options: ['$', '--', '@', '#'], answer: 0, explanation: 'Sass variables start with $ (e.g. $color).' },
  { q: 'Nesting in Sass allows?', options: ['selectors inside selectors', 'only colors', 'media only', 'nothing'], answer: 0, explanation: 'Nesting keeps related selectors together.' }
]);

/* ---- GIT ---- */
pool('git_git_init_status', [
  { q: 'Which starts a new repository?', options: ['git init', 'git create', 'git new', 'git setup'], answer: 0, explanation: 'git init creates a .git repo.' },
  { q: 'Which shows current state?', options: ['git status', 'git view', 'git state', 'git check'], answer: 0, explanation: 'git status shows staged/unstaged changes.' },
  { q: 'A repo can also be created by?', options: ['git clone', 'git fork', 'git merge', 'git checkout'], answer: 0, explanation: 'Cloning an existing remote initializes a repo.' }
]);
pool('git_log_checkout', [
  { q: 'Which shows commit history?', options: ['git log', 'git list', 'git history', 'git past'], answer: 0, explanation: 'git log prints the commit history.' },
  { q: 'git checkout can switch to?', options: ['branches or commits', 'remotes only', 'files only', 'repos'], answer: 0, explanation: 'checkout moves HEAD to a branch or commit.' },
  { q: 'git log --oneline shows?', options: ['short commit summaries', 'full diffs', 'config', 'remotes'], answer: 0, explanation: '--oneline gives a one-line-per-commit view.' }
]);
pool('git_conflicts', [
  { q: 'A conflict occurs when?', options: ['two branches edit the same lines', 'no commit is made', 'a tag exists', 'a file is new'], answer: 0, explanation: 'Conflicts arise from overlapping edits.' },
  { q: 'Conflict markers use?', options: ['<<<<<<< ======= >>>>>>>', '--- +++ ===', '%% %%', '{{{ }}}'], answer: 0, explanation: 'These markers delimit conflicting sections.' },
  { q: 'After resolving, the file is finalized with?', options: ['git add', 'git push', 'git stash', 'git reset'], answer: 0, explanation: 'Staging the resolved file marks it complete.' }
]);
pool('git_pull_requests', [
  { q: 'A Pull Request proposes?', options: ['merging changes into a branch', 'deleting a repo', 'adding a tag', 'reverting all'], answer: 0, explanation: 'PRs propose merging a branch via review.' },
  { q: 'PRs are reviewed and?', options: ['merged or closed', 'deleted', 'committed', 'rebased'], answer: 0, explanation: 'Reviewers approve, merge, or close a PR.' },
  { q: 'Which site hosts PRs for Git?', options: ['GitHub', 'Only Git itself', 'npm', 'Vercel'], answer: 0, explanation: 'GitHub/GitLab provide PR workflows.' }
]);
pool('git_github_issues', [
  { q: 'GitHub Issues track?', options: ['bugs and feature requests', 'only pull requests', 'commits', 'releases'], answer: 0, explanation: 'Issues manage tasks, bugs, and features.' },
  { q: 'Issues can be linked to?', options: ['commits and PRs', 'only labels', 'nothing', 'the local repo'], answer: 0, explanation: 'Closing keywords auto-close issues.' }
]);
pool('git_git_reset_revert', [
  { q: 'git reset moves?', options: ['HEAD to a previous commit', 'files to remote', 'branches up', 'tags over'], answer: 0, explanation: 'reset rewinds the branch pointer.' },
  { q: 'git revert creates?', options: ['a new commit undoing changes', 'a branch', 'a tag', 'a stash'], answer: 0, explanation: 'revert is safe for shared history.' },
  { q: 'git reset --hard discards?', options: ['uncommitted and staged changes', 'only remote commits', 'tags', 'branches'], answer: 0, explanation: '--hard is destructive to local changes.' }
]);
pool('git_stashing', [
  { q: 'git stash saves?', options: ['uncommitted changes aside', 'committed changes', 'remotes', 'branches'], answer: 0, explanation: 'Stash shelves work-in-progress.' },
  { q: 'Which restores a stash?', options: ['git stash pop', 'git stash save', 'git stash add', 'git restore stash'], answer: 0, explanation: 'pop applies and removes the stash.' },
  { q: 'git stash list shows?', options: ['saved stashes', 'branches', 'tags', 'conflicts'], answer: 0, explanation: 'List the shelved changes.' }
]);
pool('git_rebase', [
  { q: 'git rebase?', options: ['replays commits onto another base', 'merges two branches', 'deletes history', 'adds tags'], answer: 0, explanation: 'Rebase linearizes history by replaying commits.' },
  { q: 'Interactive rebase allows?', options: ['squashing/editing commits', 'renaming the repo', 'changing remotes', 'stashing'], answer: 0, explanation: '-i lets you squash, reorder, edit commits.' },
  { q: 'Rebase is best avoided for?', options: ['shared public branches', 'local branches', 'feature branches', 'stashes'], answer: 0, explanation: 'Rewriting shared history breaks collaborators.' }
]);

/* ---- REACT ---- */
pool('react_events', [
  { q: 'React events are attached with?', options: ['onClick etc. on elements', 'addEventListener', 'bind directly', 'nothing'], answer: 0, explanation: 'React uses synthetic events via props like onClick.' },
  { q: 'The event handler receives?', options: ['a synthetic event object', 'a string', 'a component', 'an array'], answer: 0, explanation: 'Handlers get the synthetic event for preventDefault, etc.' }
]);
pool('react_forms', [
  { q: 'Controlled inputs get value from?', options: ['React state', 'the DOM', 'localStorage', 'props only'], answer: 0, explanation: 'In controlled inputs, state drives the value.' },
  { q: 'onChange on an input fires?', options: ['on each value change', 'only on submit', 'on focus', 'on blur'], answer: 0, explanation: 'onChange updates state as you type.' }
]);
pool('react_usestate', [
  { q: 'useState returns?', options: ['[value, setValue]', 'a single value', 'an object', 'a callback'], answer: 0, explanation: 'Destructure the pair [state, setter].' },
  { q: 'The setter triggers?', options: ['a re-render', 'a reload', 'a fetch', 'nothing'], answer: 0, explanation: 'setX updates state and re-renders.' }
]);
pool('react_usecontext', [
  { q: 'Context provides?', options: ['data to many components', 'styles only', 'state splitting', 'routing'], answer: 0, explanation: 'Context shares data without prop drilling.' },
  { q: 'useContext reads?', options: ['the context value', 'the provider component', 'a ref', 'local storage'], answer: 0, explanation: 'useContext(MyContext) returns its current value.' }
]);
pool('react_usereducer', [
  { q: 'useReducer is for?', options: ['complex state logic', 'simple counters only', 'styling', 'routing'], answer: 0, explanation: 'Reducers handle complex state transitions.' },
  { q: 'A reducer takes?', options: ['(state, action)', '(props, children)', '(value, setter)', '(key, value)'], answer: 0, explanation: 'Reducers map state+action to a new state.' }
]);
pool('react_custom_hooks', [
  { q: 'Custom hooks let you?', options: ['reuse stateful logic', 'create components', 'style pages', 'fetch css'], answer: 0, explanation: 'Custom hooks extract re-usable logic.' },
  { q: 'Custom hooks must start with?', options: ['use', 'useCustom', 'hook', 'react'], answer: 0, explanation: 'Naming starting with "use" is a rule.' }
]);
pool('react_routing_react_router', [
  { q: 'React Router provides?', options: ['client-side navigation', 'server requests', 'database access', 'styling'], answer: 0, explanation: 'React Router maps URLs to components.' },
  { q: 'A route is defined with?', options: ['<Route>', '<Page>', '<Nav>', '<Path>'], answer: 0, explanation: '<Route path=... element=...> defines a route.' }
]);
pool('react_props_drilling', [
  { q: 'Prop drilling means?', options: ['passing props through many layers', 'drilling holes in CSS', 'sending data to the server', 'navigating routes'], answer: 0, explanation: 'Props are threaded down component trees.' },
  { q: 'Context helps avoid?', options: ['prop drilling', 're-renders', 'bundling', 'trees'], answer: 0, explanation: 'Context skips intermediate layers.' }
]);
pool('react_lifting_state_up', [
  { q: 'Lifting state up means?', options: ['moving state to a shared ancestor', 'moving state to props', 'deleting state', 'using globals'], answer: 0, explanation: 'Shared state lives in the nearest common parent.' },
  { q: 'The parent controls children via?', options: ['props and callbacks', 'direct DOM', 'events', 'classes'], answer: 0, explanation: 'Parents pass data down and callbacks up.' }
]);
pool('react_lifecycle', [
  { q: 'The old class lifecycle includes?', options: ['componentDidMount', 'componentDidFetch', 'renderState', 'onCreate'], answer: 0, explanation: 'Class components had mount/update/unmount methods.' },
  { q: 'In functional components, effects emulate?', options: ['lifecycle', 'styles', 'routing', 'context'], answer: 0, explanation: 'useEffect covers mount/update/unmount scenarios.' }
]);

/* ---- NODE ---- */
pool('node_event_loop', [
  { q: 'The event loop allows Node to?', options: ['handle many async operations non-blocking', 'run only sync code', 'compile assemblies', 'render HTML'], answer: 0, explanation: 'The event loop makes I/O non-blocking.' },
  { q: 'setTimeout callbacks go to?', options: ['the timers phase', 'the CPU', 'the stack only', 'the disk'], answer: 0, explanation: 'Timers phase runs scheduled callbacks.' }
]);
pool('node_file_system_fs', [
  { q: 'Which reads a file asynchronously?', options: ['fs.readFile', 'fs.get', 'fs.openSync', 'fs.copy'], answer: 0, explanation: 'fs.readFile is the async read API.' },
  { q: 'fs.writeFile writes?', options: ['data to a file', 'to the console', 'to the database', 'to memory'], answer: 0, explanation: 'writeFile persists content to a file.' }
]);
pool('node_routing', [
  { q: 'In Express, routing maps?', options: ['URL paths to handlers', 'files to folders', 'users to roles', 'requests to logs'], answer: 0, explanation: 'Routes tie paths + methods to handlers.' },
  { q: 'Route parameters start with?', options: [':', '#', '$', '&'], answer: 0, explanation: 'e.g. app.get("/users/:id") uses :id.' }
]);
pool('node_middleware', [
  { q: 'Middleware functions?', options: ['process requests in a chain', 'only log errors', 'render views', 'create routes'], answer: 0, explanation: 'Middleware sits between request and response.' },
  { q: 'Middleware calls next() to?', options: ['pass to the next handler', 'end the response', 'stop the server', 'throw errors'], answer: 0, explanation: 'next() continues the pipeline.' }
]);
pool('node_environment_variables', [
  { q: 'Env variables are loaded with?', options: ['dotenv or process.env', 'package.json', 'only hardcoded', 'JSON body'], answer: 0, explanation: 'process.env reads environment values.' },
  { q: 'A .env file stores?', options: ['secrets like API keys', 'the source code', 'logs', 'the database'], answer: 0, explanation: '.env keeps config out of the repo.' }
]);
pool('node_json_handling', [
  { q: 'Express parses JSON bodies with?', options: ['express.json()', 'body.jwt', 'req.parse', 'JSON()'], answer: 0, explanation: 'express.json() middleware parses JSON payloads.' },
  { q: 'res.json() sends?', options: ['a JSON response', 'an HTML page', 'a file', 'a redirect'], answer: 0, explanation: 'res.json serializes and responds with JSON.' }
]);
pool('node_authentication', [
  { q: 'Passwords should be stored?', options: ['hashed', 'in plain text', 'base64 encoded', 'in a cookie'], answer: 0, explanation: 'Hash with bcrypt; never store plain text.' },
  { q: 'JWT is commonly used for?', options: ['tokens/session auth', 'file storage', 'logging', 'routing'], answer: 0, explanation: 'JWTs authorize requests statelessly.' }
]);
pool('node_database_mongo_mysql', [
  { q: 'MongoDB is a?', options: ['NoSQL document database', 'SQL database', 'cache', 'queue'], answer: 0, explanation: 'Mongo stores JSON-like documents.' },
  { q: 'MySQL is a?', options: ['relational SQL database', 'document store', 'file system', 'cache layer'], answer: 0, explanation: 'MySQL uses tables with schemas.' }
]);
pool('node_error_handling', [
  { q: 'Express error middleware has?', options: ['4 params (err, req, res, next)', '3 params', 'no params', '2 params'], answer: 0, explanation: 'Error handlers are recognized by 4 params.' },
  { q: 'process.on("unhandledRejection") catches?', options: ['unhandled promise rejections', 'compile errors', 'HTTP 500s', 'timeouts'], answer: 0, explanation: 'It guards uncaught async failures.' }
]);

/* ---- NEXT ---- */
pool('next_install_setup', [
  { q: 'Which command creates a Next app?', options: ['npx create-next-app', 'npm init next', 'npx next init', 'npm run next-create'], answer: 0, explanation: 'create-next-app scaffolds a project.' },
  { q: 'Next runs with?', options: ['npm run dev', 'npm start-dev', 'npx go', 'npm run launch'], answer: 0, explanation: 'npm run dev starts the dev server.' }
]);
pool('next_file_based_routing', [
  { q: 'A file pages/about.js becomes?', options: ['/about', '/pages', '/js', '/file'], answer: 0, explanation: 'Files map directly to URL paths.' },
  { q: 'Dynamic routes use?', options: ['[param].js', '(param).js', '{param}.js', '<param>.js'], answer: 0, explanation: 'Square brackets denote dynamic segments.' }
]);
pool('next_components', [
  { q: 'React/Next components?', options: ['compose the UI', 'hold the database', 'run the server', 'style fonts'], answer: 0, explanation: 'Components build reusable UI.' },
  { q: 'Pages are special components that?', options: ['define routes', 'always fetch', 'only render CSS', 'store data'], answer: 0, explanation: 'Pages map components to routes.' }
]);
pool('next_styling_css_modules', [
  { q: 'CSS Modules scope styles?', options: ['locally to a component', 'globally', 'server-side', 'to the body'], answer: 0, explanation: 'Module classes are locally unique.' },
  { q: 'A module file is named?', options: ['[name].module.css', '[name].style.css', '[name].css.js', 'global.css'], answer: 0, explanation: '.module.css indicates a CSS Module.' }
]);
pool('next_data_fetching_ssg_ssr', [
  { q: 'SSG runs at?', options: ['build time', 'every request', 'on the client', 'after submit'], answer: 0, explanation: 'Static Generation pre-renders at build time.' },
  { q: 'SSR runs on?', options: ['each request', 'build only', 'never', 'client events'], answer: 0, explanation: 'Server-Side Rendering runs per request.' }
]);
pool('next_getstaticprops', [
  { q: 'getStaticProps provides data to?', options: ['a static page', 'the API', 'the CSS', 'the client only'], answer: 0, explanation: 'getStaticProps fetches data for SSG pages.' },
  { q: 'It runs at?', options: ['build time', 'request time', 'click time', 'runtime error'], answer: 0, explanation: 'Static props are evaluated at build.' }
]);
pool('next_getserversideprops', [
  { q: 'getServerSideProps runs?', options: ['on each request', 'only at build', 'in the browser', 'when idle'], answer: 0, explanation: 'SSR data fetching happens per request.' },
  { q: 'This provides?', options: ['fresh dynamic data', 'static files', 'cached assets', 'styles'], answer: 0, explanation: 'SSR gives up-to-date server data.' }
]);
pool('next_api_routes', [
  { q: 'API routes live in?', options: ['pages/api', 'api/', 'server/api', 'routes/'], answer: 0, explanation: 'Files in pages/api become endpoints.' },
  { q: 'An API route handler exports?', options: ['a function(req, res)', 'an array', 'a component', 'a string'], answer: 0, explanation: 'Default-exported function handles requests.' }
]);
pool('next_images_next_image', [
  { q: 'next/image optimizes?', options: ['images (lazy, resized)', 'fonts', 'videos', 'SVGs only'], answer: 0, explanation: 'next/image auto-optimizes and lazy-loads.' },
  { q: 'The Image component requires?', options: ['width and height or fill', 'a loader', 'alt only', 'srcset'], answer: 0, explanation: 'Dimensions are needed to avoid layout shift.' }
]);
pool('next_dynamic_routes', [
  { q: 'A dynamic page file is?', options: ['[id].js', 'id.js', '(id).js', '{id].js'], answer: 0, explanation: 'Brackets create dynamic segments.' },
  { q: 'The dynamic param is received via?', options: ['useRouter().query', 'props directly', 'a global', 'localStorage'], answer: 0, explanation: 'router.query[id] reads the URL segment.' }
]);
pool('next_client_server_components', [
  { q: 'Server Components run?', options: ['on the server', 'in the browser', 'in a worker', 'at build only'], answer: 0, explanation: 'RSC render on the server, reducing JS.' },
  { q: 'Client Components need?', options: ['the "use client" directive', 'an API call', 'a hook always', 'a layout'], answer: 0, explanation: '"use client" marks client-side rendering.' }
]);
pool('next_app_router', [
  { q: 'The App Router uses?', options: ['the app/ directory', 'pages/ only', 'routes/ files', 'components/only'], answer: 0, explanation: 'App Router organizes by folders in app/.',  },
  { q: 'layout.js wraps?', options: ['the page tree below it', 'the entire site root', 'only the footer', 'API routes'], answer: 0, explanation: 'Layouts share UI across nested routes.' }
]);
pool('next_middleware', [
  { q: 'Next Middleware runs?', options: ['before requests complete', 'after render', 'on the client', 'at build'], answer: 0, explanation: 'Middleware intercepts requests early.' },
  { q: 'Useful for?', options: ['auth/redirects', 'styling', 'images', 'fonts'], answer: 0, explanation: 'Common uses: auth, redirects, rewrites.' }
]);
pool('next_deployment_vercel', [
  { q: 'Vercel deploys Next apps?', options: ['automatically from git', 'only with docker', 'manually every build', 'never'], answer: 0, explanation: 'Vercel integrates with Git for auto deploys.' },
  { q: 'Production build command?', options: ['next build', 'next compile', 'npm run prod', 'npx serve'], answer: 0, explanation: 'next build creates the production bundle.' }
]);

/* ---- DSA ---- */
pool('dsa_space_complexity', [
  { q: 'Space complexity measures?', options: ['extra memory used', 'runtime speed', 'lines of code', 'graph edges'], answer: 0, explanation: 'It quantifies memory growth with input size.' },
  { q: 'Storing an array of n items uses?', options: ['O(n) space', 'O(1)', 'O(log n)', 'O(n^2)'], answer: 0, explanation: 'Space scales linearly with the array.' },
  { q: 'A constant number of variables uses?', options: ['O(1) space', 'O(n)', 'O(n log n)', 'O(n^2)'], answer: 0, explanation: 'Fixed variables take constant space.' }
]);
pool('dsa_strings', [
  { q: 'Strings in JS are?', options: ['immutable', 'mutable', 'byte arrays only', 'numbers'], answer: 0, explanation: 'Strings cannot be changed in place.' },
  { q: 'Comparing strings compares?', options: ['character by character', 'length only', 'memory only', 'case only'], answer: 0, explanation: 'Lexicographic comparison examines characters.' }
]);
pool('dsa_linked_lists', [
  { q: 'A linked list stores?', options: ['nodes with references to next', 'contiguous blocks', 'hash buckets', 'characters'], answer: 0, explanation: 'Each node points to the next node.' },
  { q: 'Inserting at the head is?', options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'], answer: 0, explanation: 'Adjusting a pointer is constant time.' },
  { q: 'Accessing a middle element is?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'], answer: 0, explanation: 'Lists must be traversed to reach a node.' }
]);
pool('dsa_trees', [
  { q: 'A tree is?', options: ['a hierarchical structure', 'linear like arrays', 'unordered', 'a hash table'], answer: 0, explanation: 'Trees have parents/children relationships.' },
  { q: 'A node with no children is a?', options: ['leaf', 'root', 'branch', 'heap'], answer: 0, explanation: 'Leaves are nodes without children.' }
]);
pool('dsa_binary_search_trees', [
  { q: 'In a BST, left children are?', options: ['smaller than the parent', 'larger', 'equal', 'random'], answer: 0, explanation: 'Left subtree holds smaller keys.' },
  { q: 'A balanced BST search runs in?', options: ['O(log n)', 'O(n)', 'O(1)', 'O(n^2)'], answer: 0, explanation: 'Each comparison halves the search space.' }
]);
pool('dsa_heaps', [
  { q: 'A min-heap has?', options: ['smallest element at root', 'largest at root', 'no order', 'random roots'], answer: 0, explanation: 'Min-heaps keep the minimum on top.' },
  { q: 'Heaps are great for?', options: ['priority queues', 'sorting arrays only', 'string matching', 'graph colors'], answer: 0, explanation: 'Priority queues use heap ordering.' }
]);
pool('dsa_graphs', [
  { q: 'A graph consists of?', options: ['vertices and edges', 'keys and values', 'rows and columns', 'stacks only'], answer: 0, explanation: 'Graphs connect nodes (vertices) with edges.' },
  { q: 'BFS explores?', options: ['level by level breadth-first', 'depth-first', 'randomly', 'by weight only'], answer: 0, explanation: 'BFS uses a queue to go level by level.' }
]);
pool('dsa_dynamic_programming', [
  { q: 'Dynamic programming solves by?', options: ['combining subproblems', 'recurrence to the end', 'random guessing', 'brute force only'], answer: 0, explanation: 'DP builds solutions from overlapping subproblems.' },
  { q: 'Memoization stores?', options: ['computed results', 'the input', 'the stack', 'the answer only'], answer: 0, explanation: 'Memoization caches subproblem results.' }
]);
pool('dsa_greedy_algorithms', [
  { q: 'Greedy algorithms choose?', options: ['the best local option each step', 'the global optimum always', 'random options', 'no options'], answer: 0, explanation: 'Greedy makes locally optimal choices.' },
  { q: 'Greedy works when?', options: ['local choices lead to global optimum', 'input is small', 'input is sorted', 'never'], answer: 0, explanation: 'It is correct for problems with optimal substructure.' }
]);
pool('dsa_two_pointers', [
  { q: 'Two pointers help when?', options: ['array is sorted or linear', 'tree is binary', 'graph is directed', 'input is nested'], answer: 0, explanation: 'Two-pointer patterns handle ordered arrays efficiently.' },
  { q: 'The technique often improves?', options: ['time from O(n^2) to O(n)', 'space to O(n^2)', 'nothing', 'best case only'], answer: 0, explanation: 'Pointers avoid nested scans.' }
]);
pool('dsa_sliding_window', [
  { q: 'A sliding window processes?', options: ['a fixed/moving subrange', 'the whole array each time', 'just the ends', 'sorted pairs'], answer: 0, explanation: 'The window slides across the input.' },
  { q: 'It is common for?', options: ['subarray/sum problems', 'binary trees', 'hash tables only', 'merging'], answer: 0, explanation: 'Sliding window excels at contiguous subarray problems.' }
]);
pool('dsa_backtracking', [
  { q: 'Backtracking explores?', options: ['choices and retreats', 'only one path', 'sorted data', 'hash buckets'], answer: 0, explanation: 'It tries options and backtracks on dead ends.' },
  { q: 'Used for?', options: ['permutations, combinations, N-queens', 'sorting arrays', 'finding medians', 'hashing'], answer: 0, explanation: 'Backtracking solves constraint-based search.' }
]);

/* ---- SQL ---- */
pool('sql_databases_tables', [
  { q: 'A table stores data in?', options: ['rows and columns', 'documents', 'key-value pairs', 'graphs'], answer: 0, explanation: 'Relational tables organize data in rows/columns.' },
  { q: 'Which creates a table?', options: ['CREATE TABLE', 'NEW TABLE', 'ADD TABLE', 'MAKE TABLE'], answer: 0, explanation: 'CREATE TABLE defines a table.' }
]);
pool('sql_order_by', [
  { q: 'Which sorts results?', options: ['ORDER BY', 'SORT BY', 'ARRANGE', 'GROUP'], answer: 0, explanation: 'ORDER BY sorts the rows.' },
  { q: 'DESC means?', options: ['descending order', 'duplicate entries', 'delete columns', 'double selection'], answer: 0, explanation: 'DESC sorts largest/highest first.' }
]);
pool('sql_insert', [
  { q: 'Which adds a row?', options: ['INSERT INTO', 'ADD ROW', 'PUT INTO', 'CREATE ROW'], answer: 0, explanation: 'INSERT adds new records.' },
  { q: 'VALUES lists?', options: ['the new row data', 'column names only', 'table names', 'indexes'], answer: 0, explanation: 'VALUES provides the row values.' }
]);
pool('sql_update', [
  { q: 'Which changes existing rows?', options: ['UPDATE', 'ALTER DATA', 'CHANGE', 'MODIFY SET'], answer: 0, explanation: 'UPDATE modifies rows.' },
  { q: 'UPDATE without WHERE affects?', options: ['all rows', 'no rows', 'one random row', 'only nulls'], answer: 0, explanation: 'A missing WHERE updates everything.' }
]);
pool('sql_delete', [
  { q: 'Which removes rows?', options: ['DELETE FROM', 'REMOVE', 'DROP ROW', 'ERASE'], answer: 0, explanation: 'DELETE removes rows (DROP removes tables).' },
  { q: 'DELETE without WHERE removes?', options: ['all rows', 'nothing', 'a random row', 'indexes'], answer: 0, explanation: 'Beware: no WHERE deletes every row.' }
]);
pool('sql_group_by_having', [
  { q: 'HAVING filters?', options: ['groups after aggregation', 'individual rows', 'columns', 'joins'], answer: 0, explanation: 'HAVING works on grouped/aggregated results.' },
  { q: 'WHERE cannot use aggregates, so use?', options: ['HAVING', 'ORDER', 'SELECT', 'UNION'], answer: 0, explanation: 'Use HAVING for aggregate conditions.' }
]);
pool('sql_subqueries', [
  { q: 'A subquery is?', options: ['a query inside a query', 'a join result', 'a stored proc', 'an index'], answer: 0, explanation: 'Subqueries nest SELECT statements.' },
  { q: 'Subqueries commonly appear in?', options: ['WHERE and SELECT clauses', 'only at the end', 'stored procedures only', 'triggers'], answer: 0, explanation: 'They provide values for outer queries.' }
]);
pool('sql_indexes', [
  { q: 'An index speeds up?', options: ['lookups on a column', 'inserts always', 'table drops', 'views'], answer: 0, explanation: 'Indexes accelerate reads on indexed columns.' },
  { q: 'Indexes can slow down?', options: ['INSERT/UPDATE', 'SELECT only', 'nothing', 'joins always'], answer: 0, explanation: 'Indexes add write overhead.' }
]);
pool('sql_primary_foreign_keys', [
  { q: 'A primary key?', options: ['uniquely identifies rows', 'links two databases', 'sorts tables', 'caches data'], answer: 0, explanation: 'Primary keys are unique row identifiers.' },
  { q: 'A foreign key?', options: ['references another table primary key', 'is always unique', 'stores an index', 'deletes rows'], answer: 0, explanation: 'Foreign keys establish relationships.' }
]);
pool('sql_normalization', [
  { q: 'Normalization?', options: ['reduces redundancy', 'adds duplicate data', 'renames tables', 'increases rows'], answer: 0, explanation: 'Normalization organizes tables to avoid duplication.' },
  { q: 'The first normal form requires?', options: ['atomic column values', 'no tables', 'only two columns', 'sorted data'], answer: 0, explanation: '1NF means single, atomic values per cell.' }
]);
pool('sql_transactions', [
  { q: 'Transactions group?', options: ['multiple statements atomically', 'queries only', 'indexes', 'views'], answer: 0, explanation: 'Transactions commit or roll back together.' },
  { q: 'COMMIT?', options: ['saves the transaction', 'rolls it back', 'upserts', 'caches'], answer: 0, explanation: 'COMMIT finalizes a transaction.' }
]);

/* ============================================================
   BUILD TESTS FROM QUESTION BANK
   ============================================================ */

/* Normalize a topic id for matching against pool keys.
   Pool keys may use '&'/'/'-' etc; real ids use underscores. */
function normKey(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getQuestionsForTopic(topicKey, count) {
  const nk = normKey(topicKey);
  const list = Object.keys(QUESTION_BANK)
    .filter(k => normKey(k) === nk)
    .reduce((acc, k) => acc.concat(QUESTION_BANK[k]), []);
  if (!list.length) return [];
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* Fallback questions when a topic has no bank */
function genericQuestion(topicTitle) {
  return {
    q: `Describe the key concept behind "${topicTitle}". Which statement is most accurate?`,
    options: [
      `"${topicTitle}" is an important foundational concept to understand and practice.`,
      `"${topicTitle}" is not relevant to this technology.`,
      `"${topicTitle}" only applies to databases.`,
      `"${topicTitle}" is a styling framework.`
    ],
    answer: 0,
    explanation: `This is a self-assessment question to confirm you studied "${topicTitle}". Review your notes and retake the test.`
  };
}

function buildTopicTest(program, topic, count) {
  let questions = getQuestionsForTopic(topic.id, count);
  // pad with generic if needed
  const target = Math.min(count, Math.max(3, count));
  while (questions.length < Math.min(count, 5)) {
    questions.push(genericQuestion(topic.title));
    if (questions.length >= count) break;
  }
  return questions.map((q, i) => ({ id: 'q' + i, ...q, selected: null }));
}

function buildWeeklyTest(programs, topicIds, count) {
  const poolAll = topicIds
    .map(tid => {
      const nk = normKey(tid);
      const keys = Object.keys(QUESTION_BANK).filter(k => normKey(k) === nk);
      if (!keys.length) return null;
      return keys.reduce((acc, k) => acc.concat(QUESTION_BANK[k]), []);
    })
    .filter(Boolean)
    .flat();
  const complete = [...poolAll];
  // also include generic for any topic without bank
  const missing = topicIds.filter(tid => !Object.keys(QUESTION_BANK).some(k => normKey(k) === normKey(tid)));
  missing.forEach(tid => {
    const tp = findTopicById(tid);
    if (tp) complete.push(genericQuestion(tp.title));
  });
  const shuffled = complete.sort(() => Math.random() - 0.5);
  const qs = shuffled.slice(0, count);
  while (qs.length < count) {
    qs.push(genericQuestion('this week'));
  }
  return qs.map((q, i) => ({ id: 'wq' + i, ...q, selected: null, topicId: topicIds[i % topicIds.length] }));
}

function findTopicById(topicId) {
  for (const p of window.LD.state.programs) {
    const found = p.topics.find(tp => tp.id === topicId);
    if (found) return found;
  }
  return null;
}

window.QUESTION_BANK = QUESTION_BANK;
window.buildTopicTest = buildTopicTest;
window.buildWeeklyTest = buildWeeklyTest;
window.getQuestionsForTopic = getQuestionsForTopic;

/* ============================================================
   ADDITIONAL QUESTIONS (topics need >=3 for solid tests)
   ============================================================ */
pool('git_what_is_git', [
  { q: 'Git stores project snapshots called?', options: ['commits', 'branches', 'forks', 'stacks'], answer: 0, explanation: 'Each commit is a snapshot of your files.' }
]);
pool('git_setup_config', [
  { q: 'user.email sets your?', options: ['commit email', 'repository name', 'branch', 'remote'], answer: 0, explanation: 'The email attached to your commits.' }
]);
pool('git_branching', [
  { q: 'Which lists local branches?', options: ['git branch', 'git list-b', 'git branches', 'git ls'], answer: 0, explanation: 'git branch shows available branches.' }
]);
pool('git_merging', [
  { q: 'After merging, the merged branch?', options: ['still exists unless deleted', 'is deleted automatically', 'is renamed', 'locks'], answer: 0, explanation: 'Merge keeps both branches; delete manually.' },
  { q: 'git merge integrates?', options: ['a branch into the current one', 'two remotes', 'two records', 'configs'], answer: 0, explanation: 'Merging brings another branch into HEAD.' }
]);
pool('git_remote_push_pull', [
  { q: 'git fetch downloads?', options: ['remote commits without merging', 'the entire disk', 'config files', 'nothing'], answer: 0, explanation: 'fetch updates refs; pull merges too.' }
]);
pool('git_clone_fork', [
  { q: 'Forking copies a repo?', options: ['to your GitHub account', 'locally only', 'to npm', 'to a branch'], answer: 0, explanation: 'A fork is a GitHub-side copy you own.' },
  { q: 'git clone copies?', options: ['a full repository to your machine', 'only one commit', 'only branches', 'the wiki'], answer: 0, explanation: 'Clone downloads the whole repo.' }
]);
pool('git_github_issues', [
  { q: 'Labels on issues help?', options: ['categorize and filter', 'delete them', 'merge them', 'rename the repo'], answer: 0, explanation: 'Labels like bug/feature group issues.' }
]);
pool('react_components', [
  { q: 'A component can be reused?', options: ['as many times as needed', 'only once', 'twice only', 'never'], answer: 0, explanation: 'Components are reusable building blocks.' }
]);
pool('react_props', [
  { q: 'Destructuring props in a function looks like?', options: ['function Card({ title })', 'function Card(props.title)', 'function Card(import title)', 'function Card(t = props)'], answer: 0, explanation: 'Param destructuring reads specific props.' }
]);
pool('react_events', [
  { q: 'To pass the current value, handlers often use?', options: ['an arrow function', 'a global', 'a string', 'nothing'], answer: 0, explanation: 'Arrows capture the needed value.' }
]);
pool('react_conditional_rendering', [
  { q: 'Ternary inside JSX looks like?', options: ['{cond ? <A/> : <B/>}', '{if(cond) A}', '{<A> or <B>}', '{cond && <A> || B}'], answer: 0, explanation: 'The ? : operator selects between outputs.' }
]);
pool('react_lists_keys', [
  { q: 'Using index as key can cause?', options: ['incorrect re-renders with reordering', 'slower CSS', 'larger bundles', 'nothing'], answer: 0, explanation: 'Index keys misalign items when lists change.' }
]);
pool('react_forms', [
  { q: 'An uncontrolled input is read from?', options: ['the DOM via ref', 'React state', 'props', 'a reducer'], answer: 0, explanation: 'Uncontrolled inputs keep their value in the DOM.' }
]);
pool('react_usestate', [
  { q: 'functional setState setX(prev => prev + 1) uses?', options: ['the previous state', 'no state', 'a prop', 'a global'], answer: 0, explanation: 'Updater functions read the prior value.' }
]);
pool('react_useref', [
  { q: 'useRef can store?', options: ['any mutable value', 'only strings', 'only JSX', 'style objects'], answer: 0, explanation: 'Refs hold values that persist across renders.' }
]);
pool('react_usecontext', [
  { q: 'Context value changes trigger?', options: ['re-renders of consumers', 'full reloads', 'CSS updates', 'nothing'], answer: 0, explanation: 'Consumers update when context changes.' }
]);
pool('react_usereducer', [
  { q: 'Actions usually have?', options: ['a type and optional payload', 'only a value', 'a component', 'a class'], answer: 0, explanation: 'Action objects describe the change.' }
]);
pool('react_custom_hooks', [
  { q: 'A custom hook can call?', options: ['other hooks', 'only JSX', 'CSS functions', 'class components'], answer: 0, explanation: 'Custom hooks compose built-in hooks.' }
]);
pool('react_routing_react_router', [
  { q: 'useNavigate() provides?', options: ['programmatic navigation', 'styles', 'context', 'state'], answer: 0, explanation: 'useNavigate moves between routes in code.' }
]);
pool('react_props_drilling', [
  { q: 'A symptom of deep drilling is?', options: ['verbose props chains', 'fast renders', 'small bundles', 'no re-renders'], answer: 0, explanation: 'Long prop chains are hard to maintain.' }
]);
pool('react_lifting_state_up', [
  { q: 'Children update shared state via?', options: ['callbacks passed from parent', 'direct DOM writes', 'global events', 'CSS'], answer: 0, explanation: 'Parent passes setters down as callbacks.' }
]);
pool('react_lifecycle', [
  { q: 'componentWillUnmount handles?', options: ['cleanup like timers', 'initial fetch', 'routing', 'styling'], answer: 0, explanation: 'Unmount lifecycle clears subscriptions.' }
]);
pool('node_install_setup', [
  { q: 'LTS stands for?', options: ['Long Term Support', 'Latest Test Server', 'Loop Thread Sync', 'Local Try Setup'], answer: 0, explanation: 'LTS versions are stable for production.' }
]);
pool('node_modules_require', [
  { q: 'Destructured require looks like?', options: ['const { readFile } = require("fs")', 'require("fs").{readFile}', 'import require.readFile', 'get fs.readFile()'], answer: 0, explanation: 'You can pull named exports from require.' }
]);
pool('node_event_loop', [
  { q: 'process.nextTick runs?', options: ['before the next loop phase', 'after all timers', 'on the client', 'never'], answer: 0, explanation: 'nextTick executes before I/O callbacks.' }
]);
pool('node_file_system_fs', [
  { q: 'fs.readFileSync?', options: ['blocks until read completes', 'returns a promise', 'runs async only', 'errors always'], answer: 0, explanation: 'Sync variants block the thread.' }
]);
pool('node_http_module', [
  { q: 'Which listens on a port?', options: ['server.listen(port)', 'server.start(port)', 'http.open(port)', 'server.bind(port)'], answer: 0, explanation: 'listen() begins accepting requests.' }
]);
pool('node_express_basics', [
  { q: 'To run express, use?', options: ['app.listen(3000)', 'app.run()', 'express.start(3000)', 'app.serve()'], answer: 0, explanation: 'app.listen starts the Express server.' }
]);
pool('node_routing', [
  { q: 'app.delete("/x") handles?', options: ['DELETE requests', 'GET only', 'all methods', 'websockets'], answer: 0, explanation: 'Method-specific handlers match verb + path.' }
]);
pool('node_middleware', [
  { q: 'Middleware commonly used for?', options: ['logging, auth, parsing', 'rendering only', 'caching only', 'nothing'], answer: 0, explanation: 'Middleware layers handle cross-cutting concerns.' }
]);
pool('node_environment_variables', [
  { q: 'process.env.PORT reads?', options: ['the PORT variable', 'the current file', 'the OS name', 'the node path'], answer: 0, explanation: 'Env values are accessed on process.env.' }
]);
pool('node_rest_apis', [
  { q: 'A resource in REST is identified by?', options: ['a URL', 'a method', 'a header', 'a cookie'], answer: 0, explanation: 'Endpoints identify resources by path.' }
]);
pool('node_json_handling', [
  { q: 'Reading a request body needs?', options: ['parsing middleware', 'just req.body', 'a URL', 'a header'], answer: 0, explanation: 'JSON bodies must be parsed first.' }
]);
pool('node_authentication', [
  { q: 'A session stores?', options: ['server-side auth state', 'source code', 'uploads', 'routes'], answer: 0, explanation: 'Sessions keep authenticated state.' }
]);
pool('node_database_mongo_mysql', [
  { q: 'A SQL schema defines?', options: ['table structure upfront', 'no structure', 'styles', 'routes'], answer: 0, explanation: 'Relational schemas fix columns and types.' }
]);
pool('node_error_handling', [
  { q: 'try/catch around await catches?', options: ['async rejections', 'memory leaks', 'syntax errors', 'nothing'], answer: 0, explanation: 'try/catch handles rejected promises in async code.' }
]);
pool('next_install_setup', [
  { q: 'The dev server auto?', options: ['reloads on file changes', 'deploys', 'minifies only', 'runs tests'], answer: 0, explanation: 'Dev mode hot-reloads changes.' }
]);
pool('next_pages_routing', [
  { q: 'index.js maps to?', options: ['the root path /', '/index', '/home', '/page'], answer: 0, explanation: 'index files map to their folder root.' }
]);
pool('next_file_based_routing', [
  { q: 'Nested folders pages/blog/post.js map to?', options: ['/blog/post', '/blog/post.js', '/pages/blog/post', '/post/blog'], answer: 0, explanation: 'Folder structure mirrors URL paths.' }
]);
pool('next_components', [
  { q: 'Shared UI can be extracted into?', options: ['reusable components', 'only layouts', 'only pages', 'CSS only'], answer: 0, explanation: 'Components promote reuse.' }
]);
pool('next_styling_css_modules', [
  { q: 'Module class names are?', options: ['locally hashed', 'global', 'randomized servers', 'inline'], answer: 0, explanation: 'Hashing prevents class collisions.' }
]);
pool('next_data_fetching_ssg_ssr', [
  { q: 'A hybrid mix of SSG + SSR is?', options: ['possible per route', 'impossible', 'only static', 'deprecated'], answer: 0, explanation: 'Each page can choose its strategy.' }
]);
pool('next_getstaticprops', [
  { q: 'Consumers of static props get?', options: ['the props object at build', 'a stream', 'a closure', 'the DOM'], answer: 0, explanation: 'Page components receive props at build.' }
]);
pool('next_getserversideprops', [
  { q: 'SSR is good for?', options: ['personalized or fast-changing data', 'static marketing pages', 'images', 'fonts'], answer: 0, explanation: 'SSR serves fresh data per request.' }
]);
pool('next_api_routes', [
  { q: 'These endpoints cannot run?', options: ['browser-only APIs', 'node APIs', 'DB queries', 'JSON responses'], answer: 0, explanation: 'API routes run server-side Node.' }
]);
pool('next_link_navigation', [
  { q: 'Links prefetch routed pages?', options: ['in the background', 'at build', 'on click only', 'never'], answer: 0, explanation: 'Next prefetches for snappy navigation.' }
]);
pool('next_images_next_image', [
  { q: 'Responsive images get?', options: ['multiple sized srcsets', 'a single fixed file', 'no alt', 'base64'], answer: 0, explanation: 'next/image generates responsive sizes.' }
]);
pool('next_dynamic_routes', [
  { q: 'getStaticPaths lists?', options: ['valid dynamic paths', 'all users', 'assets', 'routes only'], answer: 0, explanation: 'getStaticPaths defines SSG dynamic paths.' }
]);
pool('next_client_server_components', [
  { q: 'Server components reduce?', options: ['client JS bundle size', 'server CPU', 'network only', 'fonts'], answer: 0, explanation: 'Less JS ships to the browser.' }
]);
pool('next_app_router', [
  { q: 'page.js defines?', options: ['the route UI', 'the API', 'the layout', 'the middleware'], answer: 0, explanation: 'page.js renders each route.' }
]);
pool('next_middleware', [
  { q: 'Middleware runs in?', options: ['the edge/runtime before render', 'the browser', 'React lifecycle', 'build only'], answer: 0, explanation: 'Edge middleware intercepts by the server.' }
]);
pool('next_deployment_vercel', [
  { q: 'Preview deployments appear on?', options: ['each PR/branch', 'only main', 'never', 'manual triggers'], answer: 0, explanation: 'Vercel previews each commit/PR.' }
]);
pool('dsa_arrays', [
  { q: 'Inserting at the start of an array is?', options: ['O(n) — shifts items', 'O(1)', 'O(log n)', 'O(n^2)'], answer: 0, explanation: 'Array shifts ripple through the rest.' }
]);
pool('dsa_strings', [
  { q: 'Dynamic programming on strings often uses?', options: ['substring tables', 'graphs', 'stacks only', 'hashing'], answer: 0, explanation: '2D DP tables solve substring problems.' }
]);
pool('dsa_stacks', [
  { q: 'Which removes from a stack?', options: ['pop', 'dequeue', 'shift', 'unshift'], answer: 0, explanation: 'pop removes the top (LIFO).' }
]);
pool('dsa_queues', [
  { q: 'Which adds to a queue?', options: ['enqueue', 'push-top', 'prepend', 'pop'], answer: 0, explanation: 'enqueue adds at the tail (FIFO).' }
]);
pool('dsa_hash_tables', [
  { q: 'Hash functions map?', options: ['keys to buckets', 'values to colors', 'nodes to edges', 'nothing'], answer: 0, explanation: 'Hashing places keys into buckets.' }
]);
pool('dsa_trees', [
  { q: 'Traversals include?', options: ['preorder, inorder, postorder', 'only DFS', 'only random', 'sorted only'], answer: 0, explanation: 'Tree visits can be ordered several ways.' }
]);
pool('dsa_binary_search_trees', [
  { q: 'Right children are?', options: ['larger than the parent', 'smaller', 'equal', 'deleted'], answer: 0, explanation: 'Right subtree holds larger keys.' }
]);
pool('dsa_heaps', [
  { q: 'Heapify runs in?', options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(n log n)'], answer: 0, explanation: 'Building a heap is linear time.' }
]);
pool('dsa_graphs', [
  { q: 'DFS uses?', options: ['a stack (or recursion)', 'only queues', 'sorted lists', 'heaps'], answer: 0, explanation: 'Depth-first relies on a stack.' }
]);
pool('dsa_sorting', [
  { q: 'Quick sort average is?', options: ['O(n log n)', 'O(n)', 'O(n^2) always', 'O(log n)'], answer: 0, explanation: 'Quicksort averages n log n.' }
]);
pool('dsa_searching', [
  { q: 'Linear search runs in?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'], answer: 0, explanation: 'Linear scans compare each element.' }
]);
pool('dsa_recursion', [
  { q: 'Factorial is a classic?', options: ['recursive problem', 'sorting problem', 'graph problem', 'hash problem'], answer: 0, explanation: 'Factorial(n) = n * factorial(n-1).' }
]);
pool('dsa_dynamic_programming', [
  { q: 'Top-down DP is known as?', options: ['memoization', 'tabulation', 'divide-and-conquer', 'greedy'], answer: 0, explanation: 'Recursion + cache = memoization.' }
]);
pool('dsa_greedy_algorithms', [
  { q: 'Dijkstra uses a greedy?', options: ['shortest-path approach', 'sorting approach', 'hash approach', 'none'], answer: 0, explanation: 'Dijkstra greedily picks nearest nodes.' }
]);
pool('dsa_two_pointers', [
  { q: 'A classic problem is?', options: ['removing duplicates from sorted array', 'flattening trees', 'hashing strings', 'merging heaps'], answer: 0, explanation: 'Two-pointer works on sorted sequences.' }
]);
pool('dsa_sliding_window', [
  { q: 'The window expands and?', options: ['contracts in one pass', 'never shrinks', 'doubles', 'jumps'], answer: 0, explanation: 'Sliding keeps a moving valid range.' }
]);
pool('dsa_backtracking', [
  { q: 'Backtracking prunes?', options: ['dead branches early', 'no paths', 'sorted order', 'heaps'], answer: 0, explanation: 'Pruning skips impossible branches.' }
]);
pool('sql_what_is_sql', [
  { q: 'SQL can also be used to?', options: ['define and manipulate table structures', 'only read data', 'style pages', 'write games'], answer: 0, explanation: 'SQL covers DDL/DML for schemas and data.' }
]);
pool('sql_databases_tables', [
  { q: 'A database contains?', options: ['tables, views, indexes', 'only rows', 'only sheets', 'scripts'], answer: 0, explanation: 'Databases organize many objects.' }
]);
pool('sql_select', [
  { q: 'SELECT DISTINCT removes?', options: ['duplicate rows', 'nulls', 'columns', 'indexes'], answer: 0, explanation: 'DISTINCT returns unique values.' }
]);
pool('sql_where', [
  { q: 'LIKE matches?', options: ['patterns with wildcards', 'only exact values', 'numbers', 'nothing'], answer: 0, explanation: 'LIKE allows % and _ wildcards.' }
]);
pool('sql_order_by', [
  { q: 'ORDER BY can sort by?', options: ['multiple columns', 'only one', 'only ids', 'aggregate views'], answer: 0, explanation: 'List multiple columns with priority.' }
]);
pool('sql_insert', [
  { q: 'Inserting specific columns requires?', options: ['listing the column names', 'no syntax', 'a view', 'an index'], answer: 0, explanation: 'INSERT INTO t (col) VALUES (v).' }
]);
pool('sql_update', [
  { q: 'UPDATE SET assigns?', options: ['new column values', 'row order', 'indexes', 'table names'], answer: 0, explanation: 'SET defines the new values.' }
]);
pool('sql_delete', [
  { q: 'To delete all rows but keep the table, use?', options: ['DELETE FROM t (no WHERE)', 'DROP TABLE', 'TRUNCATE VIEW', 'REMOVE TABLE'], answer: 0, explanation: 'DELETE clears rows; DROP removes the table.' }
]);
pool('sql_joins', [
  { q: 'Which keeps all right rows?', options: ['RIGHT JOIN', 'INNER JOIN', 'FULL only', 'SELF'], answer: 0, explanation: 'RIGHT JOIN keeps unmatched right rows.' }
]);
pool('sql_group_by_having', [
  { q: 'GROUP BY with COUNT + HAVING COUNT(*) > 1 finds?', options: ['duplicates', 'indexes', 'views', 'nulls'], answer: 0, explanation: 'Aggregate filters isolate duplicate groups.' }
]);
pool('sql_subqueries', [
  { q: 'IN (subquery) compares?', options: ['against a result set', 'against a text', 'columns', 'indexes'], answer: 0, explanation: 'IN checks membership in a set.' }
]);
pool('sql_indexes', [
  { q: 'A unique index enforces?', options: ['no duplicates in a column', 'faster inserts', 'larger tables', 'views'], answer: 0, explanation: 'Unique indexes constrain values.' }
]);
pool('sql_primary_foreign_keys', [
  { q: 'A foreign key must match?', options: ['an existing primary key value', 'any column', 'a row id only', 'nothing'], answer: 0, explanation: 'FKs reference PKs elsewhere.' }
]);
pool('sql_normalization', [
  { q: 'Third normal form removes?', options: ['transitive dependencies', 'all columns', 'primary keys', 'indexes'], answer: 0, explanation: '3NF eliminates non-key dependencies.' }
]);
pool('sql_transactions', [
  { q: 'ACID includes?', options: ['Atomicity, Consistency, Isolation, Durability', 'Any, Copy, Insert, Delete', 'Atoms, Cells, Ions, Dots', 'Access, Cache, Index, Data'], answer: 0, explanation: 'ACID guarantees transactional integrity.' }
]);
