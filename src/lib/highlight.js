/**
 * Tiny single-pass syntax highlighter.
 *
 * One alternation regex per language family, scanned once with exec(). Each
 * alternative lives in its own capture group, so the index of the group that
 * matched is the token class — no nested re-scanning of already-tokenised text,
 * which is where naive "run N regexes in sequence" highlighters fall apart.
 *
 * Only covers what the posts on this site actually use. Output is plain token
 * objects; the renderer builds React text nodes, so nothing is ever injected
 * as HTML.
 */

const JAVA_KW =
  'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|' +
  'else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|' +
  'native|new|package|private|protected|public|record|return|sealed|short|static|super|switch|' +
  'synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield|true|false|null';

const JS_KW =
  'async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|' +
  'finally|for|from|function|if|import|in|instanceof|let|new|of|return|super|switch|this|throw|' +
  'try|typeof|var|void|while|yield|true|false|null|undefined';

const COMMENT_C = '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)';
const STRING = '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)';

/** c-like: comment, string, annotation, number, keyword, Type, fn( */
function clike(keywords) {
  return {
    re: new RegExp(
      COMMENT_C +
        '|' + STRING +
        '|(@[A-Za-z_]\\w*)' +
        '|\\b(\\d[\\w.]*)\\b' +
        '|\\b(' + keywords + ')\\b' +
        '|\\b([A-Z][A-Za-z0-9_]*)\\b' +
        '|\\b([a-z_]\\w*)(?=\\s*\\()',
      'g',
    ),
    cls: ['t-com', 't-str', 't-ann', 't-num', 't-kw', 't-typ', 't-fn'],
  };
}

const SPECS = {
  java: clike(JAVA_KW),
  js: clike(JS_KW),
  jsx: clike(JS_KW),

  /* json: quoted key before a colon is styled apart from a string value */
  json: {
    re: new RegExp(
      '("(?:\\\\.|[^"\\\\])*")(?=\\s*:)' +
        '|("(?:\\\\.|[^"\\\\])*")' +
        '|\\b(true|false|null)\\b' +
        '|(-?\\d[\\d.eE+-]*)',
      'g',
    ),
    cls: ['t-key', 't-str', 't-kw', 't-num'],
  },

  /* yaml / .properties: # comment, key before : or =, strings, numbers */
  yaml: {
    re: new RegExp(
      '(#[^\\n]*)' +
        '|^([ \\t]*[\\w.$-]+)(?=[ \\t]*[:=])' +
        '|' + STRING +
        '|\\b(true|false|null)\\b' +
        '|\\b(\\d[\\d.]*)\\b',
      'gm',
    ),
    cls: ['t-com', 't-key', 't-str', 't-kw', 't-num'],
  },

  /* bash: # comment, strings, leading command, flags, $vars */
  bash: {
    re: new RegExp(
      '(#[^\\n]*)' +
        '|' + STRING +
        '|^([ \\t]*[\\w./-]+)' +
        '|(\\s--?[\\w-]+)' +
        '|(\\$\\{?[\\w]+\\}?)',
      'gm',
    ),
    cls: ['t-com', 't-str', 't-fn', 't-ann', 't-num'],
  },

  /* xml: comment, attribute value, tag name, attribute name */
  xml: {
    re: new RegExp(
      '(<!--[\\s\\S]*?-->)' +
        '|("(?:\\\\.|[^"\\\\])*")' +
        '|(<\\/?[\\w:.-]+|\\/?>)' +
        '|([\\w:.-]+)(?==)',
      'g',
    ),
    cls: ['t-com', 't-str', 't-typ', 't-ann'],
  },

  /* http: method + status + header names */
  http: {
    re: new RegExp(
      '^(GET|POST|PUT|PATCH|DELETE|HTTP\\/[\\d.]+)' +
        '|^([\\w-]+)(?=:)' +
        '|\\b([1-5]\\d{2})\\b' +
        '|("(?:\\\\.|[^"\\\\])*")',
      'gm',
    ),
    cls: ['t-kw', 't-key', 't-num', 't-str'],
  },
};

SPECS.properties = SPECS.yaml;
SPECS.yml = SPECS.yaml;
SPECS.sh = SPECS.bash;
SPECS.shell = SPECS.bash;
SPECS.html = SPECS.xml;

/**
 * @returns {Array<{t: string, c?: string}>} tokens in source order
 */
export function tokenize(code, lang) {
  const spec = SPECS[lang];
  if (!spec) return [{ t: code }];

  const out = [];
  const re = spec.re;
  re.lastIndex = 0;

  let last = 0;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[0] === '') {
      re.lastIndex++;
      continue;
    }
    if (m.index > last) out.push({ t: code.slice(last, m.index) });

    // which alternative fired -> which token class
    let gi = 0;
    for (let i = 1; i < m.length; i++) {
      if (m[i] !== undefined) {
        gi = i - 1;
        break;
      }
    }
    out.push({ t: m[0], c: spec.cls[gi] });
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ t: code.slice(last) });
  return out;
}

export const SUPPORTED = Object.keys(SPECS);
