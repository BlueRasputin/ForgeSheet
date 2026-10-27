// Rules assistant: ask an AI about D&D 5e with this character and the matching rules text attached.
// Three ways to pay for it, all opt-in:
//   shared  - Google Gemini's free tier through this site's Firebase project (Spark plan, no billing account,
//             so the site owner can't be charged; when the free quota runs out, requests fail until it resets).
//   gemini  - the player's own Gemini API key (free keys at aistudio.google.com/apikey).
//   claude  - the player's own Claude API key, billed to them.
// Player keys live only in this browser's localStorage. They are never synced to the cloud or put in exports.
const AI_KEYS_KEY = "forgesheet.aiKeys.v1";
const ANTHROPIC_SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm";
const AI_CLAUDE_MODEL = "claude-opus-5-5";
const GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const AI_REFERENCE_BUDGET = 14000;

let aiSettings = loadAiSettings();
let aiHistory = [];
let aiBusy = false;
let aiRulesIndex = null;
let aiAppCheckReady = false;

function loadAiSettings() {
  const defaults = { provider: "", geminiKey: "", claudeKey: "", edition: "character" };
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(AI_KEYS_KEY)) || {}) };
  } catch {
    return defaults;
  }
}

function saveAiSettings() {
  try {
    localStorage.setItem(AI_KEYS_KEY, JSON.stringify(aiSettings));
  } catch {
    // Private mode: the key lasts for this visit only.
  }
}

function sharedAiAvailable() {
  return Boolean(RECAPTCHA_SITE_KEY && syncSettings.firebaseConfigText);
}

// ---- The 5e "script": standing instructions for every provider ----

function aiEditionInstruction() {
  const entries = classEntries();
  const editions = [...new Set(entries.map(entry => entry.rules))];
  const choice = aiSettings.edition;
  if (choice === "2014") return "Answer with the 2014 rules (2014 Player's Handbook, Dungeon Master's Guide, Monster Manual, and 2014-era supplements such as Xanathar's and Tasha's).";
  if (choice === "2024") return "Answer with the 2024 rules (2024 Player's Handbook, 2024 Dungeon Master's Guide, 2025 Monster Manual). The reference excerpts are 2014 text: use them only to explain what changed, never as 2024 wording.";
  if (choice === "compare") return "Answer for both editions: give the 2014 rule, then the 2024 rule, and say plainly what changed. Label each part with its edition.";
  if (editions.length > 1) return `This character mixes editions on purpose (${rulesEditionLine()}). Answer each class's questions with that class's edition, and label every rule with the edition it comes from.`;
  return editions[0] === "2024"
    ? "This character uses the 2024 rules. Answer with the 2024 rules. The reference excerpts are 2014 text: use them only to explain what changed, never as 2024 wording."
    : "This character uses the 2014 rules. Answer with the 2014 rules and don't mix in 2024 changes unless asked; if the 2024 rules differ in a way that matters, add one short note saying so.";
}

function aiSystemPrompt() {
  return `You are the rules assistant in ForgeSheet, a D&D 5th edition character sheet. You help players understand rules, plan their characters and make decisions at the table.

Editions:
- D&D 5e has two rule sets in use: the 2014 core rules and the 2024 revision. They share a lot but differ in important ways, and players often mix them up.
- ${aiEditionInstruction()}
- Name the edition whenever you state a rule, and never present a 2014 rule as 2024 or the reverse.
- Well-known 2024 changes to keep straight:
  - Ability score increases come from the background, not the species, and every background grants an Origin feat.
  - Every class picks its subclass at 3rd level.
  - Martial classes get Weapon Mastery properties.
  - Inspiration became Heroic Inspiration.
  - Grapple and Shove became Unarmed Strike options resolved with a saving throw.
  - Being surprised gives disadvantage on initiative instead of losing a turn.
  - Exhaustion is a flat penalty per level to d20 Tests and speed.
  - Feats are grouped as Origin, General, Fighting Style and Epic Boon.
  - Many spells, class features and monsters were rewritten. When you're not sure of the exact 2024 wording, say so.

How to answer:
- Lead with the direct answer, then the rule behind it, then anything that commonly trips players up. Keep it short enough to read mid-session unless the player asks for depth.
- Work from the character sheet when the question is about this character: use their real numbers (modifiers, save DC, slots, resources, level) and their class levels.
- Treat the reference excerpts in the player's message as ForgeSheet's bundled 2014 data: original summaries, plus SRD 5.1 text where marked. Prefer them for 2014 answers, but they are summaries, so check them against what you know.
- Cite the book (and page, when you're confident of it). If you aren't sure of a rule, say so and suggest checking the book or asking the DM; never invent rules, numbers or page references.
- Homebrew rules listed on the sheet are agreed house rules for this character; respect them and point out where they change the official answer.
- For level-up planning, list what the next level grants and the real choices (subclass, ability score improvement or feat, spells, multiclass options with their ability score prerequisites), with a short pro and con for each.
- The DM has the final say on rulings; when a rule needs a DM ruling, say so.
- Stay on D&D and tabletop play. Don't reproduce long passages of copyrighted rulebook text; summarize instead.`;
}

// ---- Retrieval: the bundled rules entries most related to the question ----

function buildRulesIndex() {
  const docs = [];
  const add = (title, kind, body) => {
    if (!title || !body) return;
    docs.push({ title, kind, body, key: looseWords(title.replace(/\(.*?\)/g, "")) });
  };
  Object.values(spellDetails || {}).forEach(spell => {
    const level = spell.level === 0 ? "cantrip" : `${ordinal(spell.level)}-level`;
    const school = spell.school?.name || spell.school || "";
    const classes = (spell.classes || []).map(item => item.name || item).join(", ");
    const header = [`${level} ${school}`.trim(), spell.casting_time, spell.range, [spell.components].flat().join(", "), `${spell.concentration ? "Concentration, " : ""}${spell.duration || ""}`, classes && `Classes: ${classes}`].filter(Boolean).join("; ");
    add(spell.name, "Spell", `${header}. ${[spell.desc].flat().join(" ")} ${[spell.higher_level].flat().filter(Boolean).join(" ")}`);
  });
  Object.entries(CLASS_FEATURE_DETAILS || {}).forEach(([classId, rows]) => {
    const className = getClasses()[classId]?.name || classId;
    rows.forEach(([level, name, summary]) => add(`${name} (${className} ${level})`, "Class feature", summary));
  });
  Object.entries(SUBCLASS_FEATURES || {}).forEach(([index, entry]) => {
    const official = officialSubclasses.find(item => item.index === index);
    const title = official ? `${official.name} (${official.className} ${official.flavor || "subclass"})` : index;
    add(title, "Subclass", `${entry.source ? `Source: ${entry.source}. ` : ""}${(entry.features || []).map(([level, name, summary]) => `Level ${level}, ${name}: ${summary}`).join(" ")}`);
  });
  Object.entries(FEAT_DETAILS || {}).forEach(([name, feat]) => {
    add(name, "Feat", `${feat.source ? `Source: ${feat.source}. ` : ""}${feat.prereq ? `Prerequisite: ${feat.prereq}. ` : ""}${feat.summary || ""}`);
  });
  Object.entries(CLASS_OPTIONS || {}).forEach(([group, list]) => {
    if (!Array.isArray(list)) return;
    list.forEach(option => {
      if (option?.name && option.summary) add(option.name, group.replace(/([A-Z])/g, " $1").toLowerCase(), `${option.prereq ? `Prerequisite: ${option.prereq}. ` : ""}${option.summary}`);
    });
  });
  RULES_REFERENCE.forEach(entry => add(entry.title, `Rule (${entry.category})`, entry.body));
  return docs;
}

const AI_STOP_WORDS = new Set("what when where which while with would could should does have this that than then them they their there your yours mine about after before into from over under like just also only more most much many some each other been being were will shall want need make take give know think rule rules work works level levels spell spells class character".split(" "));

function looseWords(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Names said in the question weigh most ("Shield", "Divine Smite"), then shared words in titles, then in text.
function retrieveRules(question) {
  aiRulesIndex ||= buildRulesIndex();
  const text = ` ${looseWords(question)} `;
  const terms = [...new Set(text.split(" ").filter(word => word.length >= 4 && !AI_STOP_WORDS.has(word)))];
  const scored = aiRulesIndex.map(doc => {
    let score = doc.key.length >= 4 && text.includes(` ${doc.key} `) ? 30 + doc.key.length / 4 : 0;
    const titleWords = new Set(doc.key.split(" "));
    const body = looseWords(doc.body);
    terms.forEach(term => {
      if (titleWords.has(term)) score += 5;
      else if (body.includes(term)) score += 1;
    });
    return { doc, score };
  }).filter(item => item.score >= 5).sort((a, b) => b.score - a.score);
  const picked = [];
  let used = 0;
  for (const { doc } of scored) {
    const entry = `[${doc.kind}] ${doc.title}: ${doc.body}`;
    if (used + entry.length > AI_REFERENCE_BUDGET) continue;
    picked.push(entry);
    used += entry.length;
    if (picked.length >= 14) break;
  }
  return picked;
}

// The player's turn as the model sees it: the sheet (first turn, or when asked), references, then the question.
function composeAiTurn(question, includeSheet) {
  const references = retrieveRules(question);
  return [
    includeSheet ? `<character_sheet>\n${characterSheetText()}\n</character_sheet>` : "",
    references.length ? `<reference_excerpts edition="2014">\n${references.join("\n\n")}\n</reference_excerpts>` : "",
    `<question>\n${question}\n</question>`
  ].filter(Boolean).join("\n\n");
}

// ---- Providers ----

async function askSharedGemini(messages, onText) {
  if (!sharedAiAvailable()) throw aiError("The free assistant isn't set up on this site yet. Use your own Gemini or Claude key instead.");
  if (!syncState.user) throw aiError("Sign in on the Campaign tab to use the free assistant. (It's limited to signed-in players to keep the free quota from being used up by bots.)");
  const app = await ensureFirebaseApp();
  const [aiApi, appCheckApi] = await Promise.all([import(FIREBASE_AI_URL), import(FIREBASE_APP_CHECK_URL)]);
  // App Check (reCAPTCHA) proves requests come from this site; Firebase AI Logic requires it.
  if (!aiAppCheckReady) {
    appCheckApi.initializeAppCheck(app, { provider: new appCheckApi.ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
    aiAppCheckReady = true;
  }
  const ai = aiApi.getAI(app, { backend: new aiApi.GoogleAIBackend() });
  const model = aiApi.getGenerativeModel(ai, { model: AI_GEMINI_MODEL, systemInstruction: aiSystemPrompt() });
  const history = messages.slice(0, -1).map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
  const chat = model.startChat({ history });
  try {
    const result = await chat.sendMessageStream(messages[messages.length - 1].content);
    for await (const chunk of result.stream) onText(chunk.text());
  } catch (error) {
    const message = String(error?.message || error);
    if (/quota|resource.?exhausted|429/i.test(message)) throw aiError("The free assistant has used up its shared quota for now. Try again later, or add your own free Gemini key.");
    if (/app.?check|recaptcha/i.test(message)) throw aiError("This browser couldn't pass the site's bot check. Reload the page and try again.");
    throw aiError(`The free assistant failed: ${message}`);
  }
}

// Gemini REST with the player's key. Server-sent events: one JSON chunk per "data:" line.
async function askOwnGemini(messages, onText) {
  const key = aiSettings.geminiKey.trim();
  if (!key) throw aiError("Paste your Gemini API key first. Free keys: aistudio.google.com/apikey");
  const response = await fetch(`${GEMINI_REST_URL}/${AI_GEMINI_MODEL}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: aiSystemPrompt() }] },
      contents: messages.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }))
    })
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = detail?.error?.message || response.statusText;
    if (response.status === 400 && /api key/i.test(message)) throw aiError("Google rejected that Gemini key. Check it at aistudio.google.com/apikey.");
    if (response.status === 429) throw aiError("Your Gemini key is over its rate limit or quota. Wait a minute and try again.");
    throw aiError(`Gemini error ${response.status}: ${message}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let blocked = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    lines.filter(line => line.startsWith("data:")).forEach(line => {
      const chunk = JSON.parse(line.slice(5));
      blocked ||= chunk.promptFeedback?.blockReason || (chunk.candidates?.[0]?.finishReason === "SAFETY" ? "SAFETY" : "");
      (chunk.candidates?.[0]?.content?.parts || []).forEach(part => { if (part.text) onText(part.text); });
    });
  }
  if (blocked) throw aiError(`Gemini declined to answer (${blocked.toLowerCase()}). Try rephrasing the question.`);
}

async function askOwnClaude(messages, onText) {
  const key = aiSettings.claudeKey.trim();
  if (!key) throw aiError("Paste your Claude API key first. Keys: console.anthropic.com");
  const { default: Anthropic, AuthenticationError, RateLimitError, PermissionDeniedError, APIConnectionError, APIError } = await import(ANTHROPIC_SDK_URL);
  // The key is the player's own, typed into their own browser, so calling straight from the page is acceptable here.
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  try {
    const stream = client.beta.messages.stream({
      model: AI_CLAUDE_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: aiSystemPrompt(),
      messages: messages.map(message => ({ role: message.role, content: message.content }))
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") throw aiError("Claude declined to answer this one. Try rephrasing the question.");
    if (final.stop_reason === "max_tokens") onText("\n\n(The answer was cut off at the length limit. Ask a narrower question.)");
  } catch (error) {
    if (error?.isAiError) throw error;
    if (error instanceof AuthenticationError) throw aiError("Anthropic rejected that Claude key. Check it at console.anthropic.com.");
    if (error instanceof PermissionDeniedError) throw aiError("That Claude key doesn't have access to this model.");
    if (error instanceof RateLimitError) throw aiError("Your Claude key is over its rate limit. Wait a minute and try again.");
    if (error instanceof APIConnectionError) throw aiError("Couldn't reach Anthropic. Check your connection.");
    if (error instanceof APIError) throw aiError(`Claude error ${error.status}: ${error.message}`);
    throw error;
  }
}

function aiError(message) {
  return Object.assign(new Error(message), { isAiError: true });
}

// ---- UI ----

function openAiDialog() {
  if (!aiSettings.provider) aiSettings.provider = sharedAiAvailable() ? "shared" : "gemini";
  renderAiSetup();
  renderAiLog();
  document.querySelector("#aiDialog").showModal();
  document.querySelector("#aiQuestion").focus();
}

function renderAiSetup() {
  const provider = document.querySelector("#aiProvider");
  const shared = provider.querySelector('option[value="shared"]');
  shared.disabled = !sharedAiAvailable();
  shared.textContent = sharedAiAvailable() ? "Free: Google Gemini (shared, sign-in required)" : "Free: Google Gemini (not set up on this site)";
  if (aiSettings.provider === "shared" && !sharedAiAvailable()) aiSettings.provider = "gemini";
  provider.value = aiSettings.provider;
  document.querySelector("#aiEdition").value = aiSettings.edition;
  const own = aiSettings.provider !== "shared";
  const keyField = document.querySelector("#aiKeyField");
  keyField.hidden = !own;
  const keyInput = document.querySelector("#aiKeyInput");
  keyInput.value = aiSettings.provider === "claude" ? aiSettings.claudeKey : aiSettings.geminiKey;
  keyInput.placeholder = aiSettings.provider === "claude" ? "sk-ant-..." : "AIza...";
  document.querySelector("#aiKeyLabel").textContent = aiSettings.provider === "claude" ? "Your Claude API key" : "Your Gemini API key";
  document.querySelector("#aiProviderNote").textContent = {
    shared: "Uses Google's free Gemini tier through this site, so it costs you nothing. It's shared by everyone and can run out for a while. Google may use free-tier questions to improve its products, so don't type anything private.",
    gemini: "Uses your own Gemini key, so the free limits are yours alone. Get a free key at aistudio.google.com/apikey. The key is stored only in this browser.",
    claude: `Uses your own Claude key (${AI_CLAUDE_MODEL}), billed to your Anthropic account, roughly a few cents per question. The key is stored only in this browser.`
  }[aiSettings.provider];
}

function renderAiLog() {
  const root = document.querySelector("#aiLog");
  if (!aiHistory.length) {
    root.innerHTML = `<p class="empty-state">Ask anything about D&D 5e: "Can I cast Shield while concentrating on Haste?", "What should ${escapeHtml(character.name || "my character")} take at the next level?", "How does grappling work in 2024?"</p>`;
    return;
  }
  root.innerHTML = aiHistory.map(message => `
    <article class="ai-message" data-role="${message.role}">
      <strong>${message.role === "user" ? "You" : "Assistant"}</strong>
      <div class="ai-text">${aiFormat(message.shown ?? message.content)}</div>
    </article>`).join("");
  root.scrollTop = root.scrollHeight;
}

// Plain text with paragraphs, bullet lines and **bold**; everything is escaped first.
function aiFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .split(/\n{2,}/).map(block => `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
}

async function sendAiQuestion(event) {
  event?.preventDefault();
  if (aiBusy) return;
  const input = document.querySelector("#aiQuestion");
  const question = input.value.trim();
  if (!question) return;
  const includeSheet = document.querySelector("#aiIncludeSheet").checked && !aiHistory.some(message => message.hasSheet);
  aiHistory.push({ role: "user", content: composeAiTurn(question, includeSheet), shown: question, hasSheet: includeSheet });
  const reply = { role: "assistant", content: "" };
  aiHistory.push(reply);
  input.value = "";
  aiBusy = true;
  document.querySelector("#aiSend").disabled = true;
  renderAiLog();
  const textNode = document.querySelector("#aiLog .ai-message:last-child .ai-text");
  textNode.innerHTML = `<p class="muted">Thinking…</p>`;
  const onText = text => {
    reply.content += text;
    textNode.innerHTML = aiFormat(reply.content);
    document.querySelector("#aiLog").scrollTop = document.querySelector("#aiLog").scrollHeight;
  };
  const ask = { shared: askSharedGemini, gemini: askOwnGemini, claude: askOwnClaude }[aiSettings.provider];
  try {
    await ask(aiHistory.slice(0, -1).map(({ role, content }) => ({ role, content })), onText);
    if (!reply.content.trim()) throw aiError("The assistant sent back an empty answer. Try again.");
  } catch (error) {
    // A failed turn leaves the conversation as it was, so the next question isn't built on a broken exchange.
    aiHistory.splice(-2, 2);
    renderAiLog();
    input.value = question;
    document.querySelector("#aiLog").insertAdjacentHTML("beforeend", `<p class="ai-error">${escapeHtml(error?.isAiError ? error.message : `Something went wrong: ${error?.message || error}`)}</p>`);
  } finally {
    aiBusy = false;
    document.querySelector("#aiSend").disabled = false;
  }
}

function handleAiSetupInput(event) {
  const target = event.target;
  document.querySelectorAll("#aiLog .ai-error").forEach(item => item.remove());
  if (target.id === "aiProvider") aiSettings.provider = target.value;
  if (target.id === "aiEdition") {
    aiSettings.edition = target.value;
    // The standing instructions changed, so start a fresh conversation rather than mixing editions.
    aiHistory = [];
    renderAiLog();
  }
  if (target.id === "aiKeyInput") aiSettings[aiSettings.provider === "claude" ? "claudeKey" : "geminiKey"] = target.value.trim();
  saveAiSettings();
  if (target.id !== "aiKeyInput") renderAiSetup();
}

function forgetAiKey() {
  aiSettings[aiSettings.provider === "claude" ? "claudeKey" : "geminiKey"] = "";
  saveAiSettings();
  renderAiSetup();
}

function clearAiConversation() {
  aiHistory = [];
  renderAiLog();
}
