"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FREE_DOMAINS = void 0;
exports.normalizeEmail = normalizeEmail;
exports.extractDomain = extractDomain;
exports.isFreeMailDomain = isFreeMailDomain;
exports.normalizeName = normalizeName;
exports.levenshtein = levenshtein;
exports.stringSimilarity = stringSimilarity;
exports.tokenOverlapScore = tokenOverlapScore;
exports.combinedSimilarity = combinedSimilarity;
exports.scoreToConfidence = scoreToConfidence;
exports.rankAccountCandidates = rankAccountCandidates;
exports.rankContactCandidates = rankContactCandidates;
exports.detectAmbiguity = detectAmbiguity;
exports.pickBestCandidate = pickBestCandidate;
exports.inferAccountFromContacts = inferAccountFromContacts;
const FREE_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com',
]);
exports.FREE_DOMAINS = FREE_DOMAINS;
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function extractDomain(email) {
    const n = normalizeEmail(email);
    const at = n.indexOf('@');
    if (at < 0)
        return null;
    return n.slice(at + 1) || null;
}
function isFreeMailDomain(domain) {
    return FREE_DOMAINS.has(domain.toLowerCase());
}
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function levenshtein(a, b) {
    if (a === b)
        return 0;
    const m = a.length;
    const n = b.length;
    if (m === 0)
        return n;
    if (n === 0)
        return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++)
        dp[i][0] = i;
    for (let j = 0; j <= n; j++)
        dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}
function stringSimilarity(a, b) {
    const na = normalizeName(a);
    const nb = normalizeName(b);
    if (!na || !nb)
        return 0;
    if (na === nb)
        return 1;
    const dist = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);
    return maxLen === 0 ? 0 : 1 - dist / maxLen;
}
function tokenOverlapScore(a, b) {
    const ta = new Set(normalizeName(a).split(' ').filter(Boolean));
    const tb = new Set(normalizeName(b).split(' ').filter(Boolean));
    if (ta.size === 0 || tb.size === 0)
        return 0;
    let overlap = 0;
    for (const t of ta)
        if (tb.has(t))
            overlap++;
    return overlap / Math.max(ta.size, tb.size);
}
function combinedSimilarity(a, b) {
    const lev = stringSimilarity(a, b);
    const tok = tokenOverlapScore(a, b);
    return lev * 0.6 + tok * 0.4;
}
function scoreToConfidence(score, high = 0.88, medium = 0.72) {
    if (score >= high)
        return 'high';
    if (score >= medium)
        return 'medium';
    return 'low';
}
function rankAccountCandidates(queryName, queryDomain, accounts, opts = {}) {
    const minScore = opts.minScore ?? 0.72;
    const ignored = new Set((opts.ignoredDomains ?? []).map(d => d.toLowerCase()));
    const candidates = [];
    for (const acc of accounts) {
        const signals = [];
        let score = 0;
        if (queryDomain && acc.domain && acc.domain.toLowerCase() === queryDomain.toLowerCase()) {
            score = 1;
            signals.push('email_domain_exact_match');
        }
        else if (queryName) {
            const sim = combinedSimilarity(queryName, acc.name);
            if (sim >= minScore) {
                score = sim;
                signals.push('fuzzy_company_name');
                if (levenshtein(normalizeName(queryName), normalizeName(acc.name)) <= 2) {
                    signals.push('levenshtein_close');
                }
                if (tokenOverlapScore(queryName, acc.name) >= 0.5) {
                    signals.push('token_overlap');
                }
            }
        }
        if (score >= minScore) {
            candidates.push({
                id: acc.id,
                score,
                confidence: scoreToConfidence(score),
                signals,
                explanation: { queryName, queryDomain, matchedName: acc.name, matchedDomain: acc.domain },
            });
        }
    }
    return candidates.sort((a, b) => b.score - a.score);
}
function rankContactCandidates(queryEmail, queryName, contacts, opts = {}) {
    const minScore = opts.minScore ?? 0.75;
    const candidates = [];
    const qEmail = queryEmail ? normalizeEmail(queryEmail) : undefined;
    for (const c of contacts) {
        const signals = [];
        let score = 0;
        if (qEmail && normalizeEmail(c.email) === qEmail) {
            score = 1;
            signals.push('email_exact_match');
        }
        else if (queryName && c.name) {
            const sim = combinedSimilarity(queryName, c.name);
            if (sim >= minScore) {
                score = sim;
                signals.push('fuzzy_contact_name');
            }
        }
        if (score >= minScore) {
            candidates.push({
                id: c.id,
                score,
                confidence: scoreToConfidence(score),
                signals,
                explanation: { queryEmail: qEmail, queryName, matchedEmail: c.email },
            });
        }
    }
    return candidates.sort((a, b) => b.score - a.score);
}
function detectAmbiguity(candidates, epsilon = 0.05) {
    if (candidates.length < 2)
        return false;
    return Math.abs(candidates[0].score - candidates[1].score) < epsilon;
}
function pickBestCandidate(candidates) {
    if (candidates.length === 0) {
        return { best: null, ambiguous: false, rejected: [] };
    }
    const ambiguous = detectAmbiguity(candidates);
    if (ambiguous) {
        return { best: null, ambiguous: true, rejected: candidates };
    }
    return { best: candidates[0], ambiguous: false, rejected: candidates.slice(1) };
}
function inferAccountFromContacts(contacts) {
    const counts = new Map();
    for (const c of contacts) {
        if (!c.accountId)
            continue;
        counts.set(c.accountId, (counts.get(c.accountId) ?? 0) + 1);
    }
    let best = null;
    let max = 0;
    for (const [id, n] of counts) {
        if (n > max) {
            max = n;
            best = id;
        }
    }
    return max > 0 ? best : null;
}
//# sourceMappingURL=entity-resolution.engine.js.map