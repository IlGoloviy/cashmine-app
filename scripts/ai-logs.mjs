#!/usr/bin/env node
/**
 * Export a Claude Code session transcript to readable, redacted Markdown in ai-logs/.
 *
 *   npm run ai-logs -- --out ai-logs/01-task.md --title "2-hour task"
 *   npm run ai-logs -- --session <id | path/to/session.jsonl> --out ai-logs/00-project-setup.md
 *
 * Defaults to the most recently modified session of the current project
 * (~/.claude/projects/<cwd-slug>/*.jsonl).
 *
 * Redaction (the repo is public): values of secret-looking keys (TOKEN / KEY / SECRET /
 * PASSWORD / AUTH) in every .env* file — raw, URL-encoded and JSON-escaped — plus any
 * `--redact <value>`, Bearer tokens, JWTs and long opaque strings next to "token".
 * Fails closed: refuses to write when no secret was found, unless `--no-secrets-ok`.
 * ALWAYS skim the output before committing.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const extraSecrets = args.flatMap((a, i) => (a === '--redact' && args[i + 1] ? [args[i + 1]] : []));
const outPath = opt('out', 'ai-logs/01-task.md');
const title = opt('title', path.basename(outPath, '.md'));

// ---------- locate transcript ----------
const projectsDir = path.join(os.homedir(), '.claude', 'projects');
function resolveSession(ref) {
  if (ref && fs.existsSync(ref)) return path.resolve(ref);
  if (ref) {
    for (const dir of fs.readdirSync(projectsDir)) {
      const candidate = path.join(projectsDir, dir, `${ref}.jsonl`);
      if (fs.existsSync(candidate)) return candidate;
    }
    throw new Error(`Session "${ref}" not found under ${projectsDir}`);
  }
  const slug = process.cwd().replace(/[^A-Za-z0-9]/g, '-');
  const dir = path.join(projectsDir, slug);
  if (!fs.existsSync(dir)) throw new Error(`No Claude Code sessions for this folder (${dir})`);
  const newest = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl') && !f.startsWith('agent-'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (!newest) throw new Error(`No session files in ${dir}`);
  return path.join(dir, newest.f);
}

// ---------- redaction ----------
/**
 * dotenv-style line parser: optional `export `, double/single/unquoted values,
 * inline `# comments` only for unquoted values.
 */
export function parseEnvLine(line) {
  const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) return null;
  const [, key, raw] = m;
  const trimmed = raw.trim();
  const double = trimmed.match(/^"((?:[^"\\]|\\.)*)"/);
  if (double) {
    return { key, value: double[1].replace(/\\n/g, '\n').replace(/\\(["\\])/g, '$1') };
  }
  const single = trimmed.match(/^'([^']*)'/);
  if (single) return { key, value: single[1] };
  return { key, value: trimmed.replace(/\s+#.*$/, '').trim() };
}

/** Secret-looking values from every .env* file in the project root. */
function secretsFromEnvFiles(dir = '.') {
  return fs
    .readdirSync(dir)
    .filter((f) => /^\.env(\..+)?$/.test(f))
    .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/))
    .map(parseEnvLine)
    .filter((e) => e && /TOKEN|KEY|SECRET|PASSWORD|AUTH/i.test(e.key) && e.value.length >= 8)
    .map((e) => e.value);
}

/** Every textual form a secret can take inside a transcript. */
const variants = (s) => [s, encodeURIComponent(s), JSON.stringify(s).slice(1, -1)];

const rawSecrets = [...new Set([...secretsFromEnvFiles(), ...extraSecrets])];
if (!rawSecrets.length && !args.includes('--no-secrets-ok')) {
  // Fail closed: the repo is public, so an export with nothing to redact is suspicious.
  console.error(
    '✖ No secrets found in .env* files. Put the API token in .env.local, pass --redact <value>,\n' +
      '  or --no-secrets-ok if this session truly never contained one.',
  );
  process.exit(1);
}
const secrets = [...new Set(rawSecrets.flatMap(variants))].sort((a, b) => b.length - a.length);
const PATTERNS = [
  [/(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}/gi, '$1[REDACTED]'],
  [/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[REDACTED_JWT]'],
  [/((?:token|api[_-]?key|secret)["'\s:=]{1,4})[A-Za-z0-9._~+/-]{20,}/gi, '$1[REDACTED]'],
];
let redactions = 0;
function redact(text) {
  let out = text;
  for (const s of secrets) {
    if (out.includes(s)) {
      redactions += out.split(s).length - 1;
      out = out.split(s).join('[REDACTED]');
    }
  }
  for (const [re, rep] of PATTERNS) {
    out = out.replace(re, (...m) => {
      redactions++;
      return rep.replace('$1', m[1] ?? '');
    });
  }
  return out;
}

// ---------- formatting ----------
const stripInjected = (text) =>
  text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<\/?pasted_content[^>]*>/g, '\n---\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function userText(content) {
  if (typeof content === 'string') return stripInjected(content);
  const parts = [];
  for (const block of content) {
    if (block.type === 'text') parts.push(stripInjected(block.text));
    if (block.type === 'image') parts.push('_[screenshot attached]_');
  }
  return parts.filter(Boolean).join('\n\n');
}

function describeTool({ name, input = {} }) {
  const short = name.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, '');
  const detail =
    input.description ??
    input.file_path ??
    input.url ??
    input.action ??
    (typeof input.command === 'string' ? input.command.split('\n')[0].slice(0, 100) : '');
  return `\`${short}\`${detail ? ` — ${String(detail).replace(/\s+/g, ' ')}` : ''}`;
}

const time = (iso) =>
  iso ? new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '';

// ---------- main ----------
const sessionFile = resolveSession(opt('session'));
const entries = fs
  .readFileSync(sessionFile, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .filter((e) => (e.type === 'user' || e.type === 'assistant') && e.message && !e.isSidechain);

const body = [];
let pendingTools = [];
let turns = 0;
const models = new Set();
const flushTools = () => {
  if (!pendingTools.length) return;
  body.push(`<details><summary>${pendingTools.length} tool call(s)</summary>\n`);
  body.push(pendingTools.map((t) => `- ${t}`).join('\n'), '\n</details>\n');
  pendingTools = [];
};

for (const e of entries) {
  if (e.type === 'user') {
    if (e.isMeta) continue;
    const content = e.message.content;
    if (Array.isArray(content) && content.every((b) => b.type === 'tool_result')) continue;
    const text = userText(content);
    if (!text) continue;
    flushTools();
    turns++;
    body.push(`## 🧑 User — ${time(e.timestamp)}\n`, text, '');
  } else {
    if (e.message.model) models.add(e.message.model);
    for (const block of e.message.content ?? []) {
      if (block.type === 'text' && block.text.trim()) {
        flushTools();
        body.push(`### 🤖 Claude\n`, block.text.trim(), '');
      } else if (block.type === 'tool_use') {
        pendingTools.push(describeTool(block));
      }
    }
  }
}
flushTools();

const first = entries[0]?.timestamp;
const last = entries.at(-1)?.timestamp;
const minutes = first && last ? Math.round((new Date(last) - new Date(first)) / 60000) : 0;
const header = [
  `# AI log — ${title}`,
  '',
  `- **Tool:** Claude Code (${[...models].filter((m) => !m.startsWith('<')).join(', ') || 'unknown model'})`,
  `- **Session:** \`${path.basename(sessionFile, '.jsonl')}\``,
  `- **Time:** ${time(first)} → ${time(last)} (${minutes} min, ${turns} user messages)`,
  '- **Format:** user messages and Claude replies verbatim; tool calls collapsed to one line each;',
  '  tool outputs and model reasoning omitted; secrets redacted.',
  '',
  '---',
  '',
].join('\n');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, redact(header + body.join('\n')) + '\n');
console.log(`✔ ${outPath} ← ${sessionFile}`);
console.log(`  ${turns} user messages, ${minutes} min, ${redactions} redaction(s)`);
if (!secrets.length)
  console.log('  ⚠ ran with --no-secrets-ok: nothing project-specific was redacted');
console.log('  Review the file before committing — the repo is public.');
