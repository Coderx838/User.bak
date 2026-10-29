// anti-scam and phishing protection for discord (uses Virustotal.. hmm) //
// Runs full tiem even when "master" is online for safety. //
// IDK if it will work (use your own mind not fully depend on this) //


const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;



const SAFE_WHITELIST_HOSTS = [
  'discord.com',
  'discord.gg',
  'discordapp.com',
  'discordapp.net',
  'media.discordapp.net',
  'cdn.discordapp.com',
  'github.com',
  'raw.githubusercontent.com',
  'google.com',
  'youtube.com',
  'youtu.be',
  'tenor.com',
  'giphy.com',
  'gitlab.com',
  'microsoft.com',
  'npmjs.com',
  'render.com',
  'railway.app',
  'steamcommunity.com',
  'steampowered.com',
  'store.steampowered.com',
];

const HEURISTIC_PATTERNS = [
  // Discord lookalikes (any non-whitelisted domain containing discord typo or discord-nitro)
  { pattern: /(?:discorcl|dlscord|discrod|discorde|discord-app|discord-gift|discord-nitro|nitro-gift|free-nitro|discordgift|discord-drop|discord-claim|nitro-discord|discord-boost)/i, reason: 'Discord phishing lookalike domain' },
  // Steam lookalikes (any non-whitelisted domain mimicking steam community)
  { pattern: /(?:steamcommnunity|steamcommunytu|steamcommunity-trade|steam-trade|steampowered-gift|steam-wallet|tradeoffer-steam|steam-promo|steam-nitro)/i, reason: 'Steam phishing lookalike domain' },
  // Known IP loggers
  { pattern: /(?:grabify\.link|iplogger\.org|2no\.co|yip\.su|iplis\.ru|02ip\.ru|ps3cfw\.com|curiouscat\.live)/i, reason: 'Known IP logger / tracking link' },
  // Suspicious executable download extensions
  { pattern: /\.(?:exe|scr|bat|vbs|cmd|pif|jar)(?:\?.*)?$/i, reason: 'Dangerous executable attachment link' },
  // Fake gift token bait
  { pattern: /\b(?:nitro|airdrop|free-gift|steam-gift)\b.*\.(?:ru|xyz|top|site|click|work|su|link)\b/i, reason: 'Suspicious bait domain' },
];



// In-memory cache for VirusTotal responses (2-hour TTL) to conserver APi quota

const vtCache = new Map();

function isWhitelisted(hostname) {
  if (!hostname) return false;
  const lower = hostname.toLowerCase();
  return SAFE_WHITELIST_HOSTS.some((safe) => lower === safe || lower.endsWith(`.${safe}`));
}

function extractUrls(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return [...new Set(matches)];
}



function scanUrlWithHeuristics(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();

    if (isWhitelisted(host)) {
      return { isThreat: false };
    }

    for (const h of HEURISTIC_PATTERNS) {
      if (h.pattern.test(targetUrl) || h.pattern.test(host)) {
        return { isThreat: true, reason: h.reason, engine: 'Heuristic Engine' };
      }
    }

    return { isThreat: false };
  } catch {
    return { isThreat: false };
  }
}


async function scanUrlWithVirusTotal(targetUrl, apiKey) {
  if (!apiKey || !targetUrl) return { isThreat: false };

  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();
    if (isWhitelisted(host)) return { isThreat: false };

    // Check memory cache first
    const cached = vtCache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) {
      return cached;
    }

    const urlId = Buffer.from(targetUrl).toString('base64url');
    const endpoint = `https://www.virustotal.com/api/v3/urls/${encodeURIComponent(urlId)}`;

    const res = await fetch(endpoint, {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (res.status === 404) {
      // URL not previously scanned in VirusTotal
      return { isThreat: false };
    }

    if (!res.ok) {
      return { isThreat: false };
    }

    const json = await res.json();
    const stats = json?.data?.attributes?.last_analysis_stats;

    if (stats) {
      const maliciousCount = Number(stats.malicious) || 0;
      const suspiciousCount = Number(stats.suspicious) || 0;

      if (maliciousCount > 0 || suspiciousCount > 1) {
        const result = {
          isThreat: true,
          reason: `VirusTotal: ${maliciousCount} engine(s) flagged malicious, ${suspiciousCount} suspicious`,
          engine: 'VirusTotal Cloud Antivirus',
          stats,
          timestamp: Date.now(),
        };
        vtCache.set(targetUrl, result);
        return result;
      }
    }

    const cleanResult = { isThreat: false, timestamp: Date.now() };
    vtCache.set(targetUrl, cleanResult);
    return cleanResult;
  } catch (err) {
    console.error('VirusTotal scan error:', err?.message || err);
    return { isThreat: false };
  }
}


async function inspectUrlsInMessage(text, apiKey = '') {
  const urls = extractUrls(text);
  if (urls.length === 0) return null;

  for (const url of urls) {
    // 1. Instant heuristic check (0ms, 0 tokens)
    const heuristic = scanUrlWithHeuristics(url);
    if (heuristic.isThreat) {
      return {
        url,
        reason: heuristic.reason,
        engine: heuristic.engine,
      };
    }

    // 2. Deep VirusTotal inspection if API key is present
    if (apiKey) {
      const vt = await scanUrlWithVirusTotal(url, apiKey);
      if (vt.isThreat) {
        return {
          url,
          reason: vt.reason,
          engine: vt.engine,
        };
      }
    }
  }

  return null;
}

function formatSecurityAlertCard({
  author,
  authorId,
  url,
  reason,
  engine,
  content,
  location,
  ownerTimeZone = 'UTC',
}) {
  const timeStr = new Date().toLocaleString('en-US', { timeZone: ownerTimeZone });
  const preview = content.length > 180 ? `${content.slice(0, 177)}...` : content;

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SECURITY THREAT DETECTED] - ANTIVIRUS SHIELD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: <@${authorId}> (${author})
Location: ${location}
Time: ${timeStr} (${ownerTimeZone})

• Flagged URL:
${url}

• Detection Engine:
${engine} (${reason})

• Message Content:
"${preview}"

• Action Taken:
User notified privately via DM; incident logged to security audit.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

module.exports = {
  extractUrls,
  scanUrlWithHeuristics,
  scanUrlWithVirusTotal,
  inspectUrlsInMessage,
  formatSecurityAlertCard,
};


/// The End ///
