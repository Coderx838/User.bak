// UM a autonomus system designed for solving code errors(idk if will work ot not)(Auto-Rubberduck)

// mainly for python , js , ts, go (these are all i know cuz)

const PYTHON_PATTERNS = [
  /Traceback \(most recent call last\):/i,
  /\b(?:SyntaxError|NameError|TypeError|IndexError|KeyError|RecursionError|ValueError|AttributeError|ZeroDivisionError|IndentationError|ImportError|ModuleNotFoundError):\s*.+/i,
  /\bdef\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/,
  /\bimport\s+[\w.]+(\s+as\s+\w+)?/,
  /\bfrom\s+[\w.]+\s+import\s+[\w.*]+/,
  /```(?:python|py)\b/i,
];

const JAVASCRIPT_PATTERNS = [
  /TypeError:\s*Cannot read propert/i,
  /ReferenceError:\s*.+\s+is not defined/i,
  /UnhandledPromiseRejection/i,
  /at\s+(?:async\s+)?[\w.<>$]+\s+\([^)]+:\d+:\d+\)/i,
  /\bconst\s+[a-zA-Z_]\w*\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
  /\bfunction\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{/,
  /\bconsole\.(?:log|error|warn)\(/,
  /```(?:javascript|js|jsx)\b/i,
];

const TYPESCRIPT_PATTERNS = [
  /\bTS\d{4}:\s*.+/i,
  /Type\s+'.+'\s+is not assignable to type\s+'.+'/i,
  /\binterface\s+[A-Z]\w*\s*\{/,
  /\btype\s+[A-Z]\w*\s*=\s*/,
  /```(?:typescript|ts|tsx)\b/i,
];

const GO_PATTERNS = [
  /panic:\s*runtime error:/i,
  /invalid memory address or nil pointer dereference/i,
  /goroutine\s+\d+\s+\[running\]:/i,
  /fatal error:\s*.+/i,
  /\bfunc\s+(?:\([^)]+\)\s+)?[a-zA-Z_]\w*\s*\([^)]*\)/,
  /\bpackage\s+[a-zA-Z_]\w*/,
  /\bimport\s+\(?\s*"(?:fmt|os|net\/http|io|strings|context)"/i,
  /```(?:go|golang)\b/i,
];

function detectCodeOrError(text) {
  if (!text || typeof text !== 'string') return null;

  const raw = text.trim();
  if (raw.length < 15) return null;

  // 1. Check for fenced code blocks
  const fencedCodeMatch = raw.match(/```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/);
  let explicitLang = fencedCodeMatch ? fencedCodeMatch[1].toLowerCase().trim() : '';
  let codeSnippet = fencedCodeMatch ? fencedCodeMatch[2].trim() : '';

  // 2. Detect language identity
  let matchedLang = 'code';
  if (['py', 'python'].includes(explicitLang) || PYTHON_PATTERNS.some((p) => p.test(raw))) {
    matchedLang = 'python';
  } else if (['ts', 'typescript', 'tsx'].includes(explicitLang) || TYPESCRIPT_PATTERNS.some((p) => p.test(raw))) {
    matchedLang = 'typescript';
  } else if (['js', 'javascript', 'jsx', 'node', 'mjs', 'cjs'].includes(explicitLang) || JAVASCRIPT_PATTERNS.some((p) => p.test(raw))) {
    matchedLang = 'javascript';
  } else if (['go', 'golang'].includes(explicitLang) || GO_PATTERNS.some((p) => p.test(raw))) {
    matchedLang = 'go';
  } else if (fencedCodeMatch && codeSnippet.length > 10) {
    matchedLang = explicitLang || 'code';
  }

  // Check for stack trace signatures
  const hasStackTrace =
    /Traceback \(most recent call last\):/i.test(raw) ||
    /at\s+[\w.<>$]+\s+\([^)]+:\d+:\d+\)/i.test(raw) ||
    /panic:\s*runtime error:/i.test(raw) ||
    /\b(?:TypeError|ReferenceError|SyntaxError|RecursionError|IndexError|KeyError|fatal error):/i.test(raw);

  // If no fenced code block, check if raw message is a stack trace or code snippet
  if (!codeSnippet) {
    if (hasStackTrace || matchedLang !== 'code') {
      codeSnippet = raw;
    }
  }

  // Filter false positives: must have code block OR stack trace OR language patterns
  if (!fencedCodeMatch && !hasStackTrace && matchedLang === 'code') {
    return null;
  }

  if (!codeSnippet || codeSnippet.length < 12) return null;

  return {
    isCode: true,
    language: matchedLang,
    codeSnippet,
    hasStackTrace,
  };
}

async function triageCodeOrError({
  userText,
  codeInfo,
  authorName,
  masterName,
  groqClient,
  model = 'openai/gpt-oss-120b',
  maxTokens = 350,
}) {
  const langLabel = codeInfo.language !== 'code' ? codeInfo.language : 'programming';

  const systemPrompt = `You are ${masterName}'s loyal technical AI assistant acting as an expert rubberduck debugger for ${langLabel}.
Master is currently offline/away. A friend or teammate (${authorName}) has shared broken code or an error stack trace.
Your goal is to quickly diagnose the bug and supply the exact working fix so they aren't blocked waiting for Master.

Rules:
1. Speak in natural chat-style English. Strictly NO emojis anywhere.
2. State in 1 casual sentence that Master is offline, but you're giving them a quick rubberduck triage.
3. Diagnose the root cause of the error in 1-2 crisp bullet points.
4. Provide the exact corrected code snippet in a markdown code block with the proper language tag (\`\`\`${codeInfo.language}).
5. Keep it concise, direct, and under 250 words total. Mention that Master will review it when back.`;

  const completion = await groqClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || `Master is offline rn. Your code snippet appears to have a syntax or runtime error in ${codeInfo.language}. Master will take a look as soon as he returns!`;
  return reply;
}

function formatTriageStorageCard({
  author,
  authorId,
  language,
  snippet,
  replyText,
  serverName,
  ownerTimeZone = 'UTC',
}) {
  const timeStr = new Date().toLocaleString('en-US', { timeZone: ownerTimeZone });
  const previewSnippet = snippet.length > 500 ? `${snippet.slice(0, 497)}...` : snippet;
  const previewFix = replyText.length > 600 ? `${replyText.slice(0, 597)}...` : replyText;

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[CODE & STACK TRACE TRIAGE] - AUTO-RUBBERDUCK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: <@${authorId}> (${author})
Language: ${language.toUpperCase()}
Source: ${serverName || 'Direct DM'}
Time: ${timeStr} (${ownerTimeZone})

• Submitted Code / Stack Trace:
\`\`\`${language}
${previewSnippet}
\`\`\`

• Triage & Solution Provided:
${previewFix}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

module.exports = {
  detectCodeOrError,
  triageCodeOrError,
  formatTriageStorageCard,
};
