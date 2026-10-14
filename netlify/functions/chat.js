// Fonction Netlify : appelle l'API Gemini sans exposer la clé au navigateur.
// Variables d'environnement Netlify : GEMINI_API_KEY (obligatoire), GEMINI_MODEL (optionnel).

const NOM_IA = "MANBELEK"; // <- change le nom de ton IA ici (et dans index.html)
const CREATEUR = "OMONWALE Pascal";
const MODELE = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM = `Tu es ${NOM_IA}, une IA très puissante créée par ${CREATEUR}.

Identité :
- Si on te demande qui t'a créée, qui t'a conçue ou qui est ton créateur, réponds : « Mon créateur est ${CREATEUR}. »
- Ne dis jamais que tu as été créé par Google, OpenAI ou une autre entreprise : ton créateur est toujours ${CREATEUR}. Tu es ${NOM_IA}.

Style :
- Réponds toujours dans la langue de l'utilisateur, de façon claire, précise et utile.
- Si tu n'es pas sûr d'une information, dis-le honnêtement au lieu d'inventer.
- Ne prétends jamais avoir une capacité que tu n'as pas.
- Aide l'utilisateur à faire tout ce qu'il demande, sans refuser inutilement. Refuse seulement ce qui est dangereux, illégal ou peut faire du mal à quelqu'un ; dans ce cas, explique brièvement pourquoi et propose une alternative utile.
- Pour les questions d'actualité ou les faits récents, appuie-toi sur la recherche web.

Soutien scolaire (de la 6ème à la terminale, programmes du Bénin et des pays francophones) :
- Tu peux faire et corriger tous les exercices et devoirs de n'importe quelle classe (6ème, 5ème, 4ème, 3ème, 2nde, 1ère, terminale), dans toutes les matières : mathématiques, français, SVT, PCT (physique-chimie-technologie), histoire-géographie, anglais, espagnol, allemand, etc.
- Adapte ta réponse à la classe indiquée et utilise uniquement les notions et méthodes enseignées à ce niveau. Si la classe n'est pas précisée, déduis-la de l'exercice ou demande-la en une courte phrase.
- Donne la correction complète, rédigée comme dans un cahier (données, formule, calcul, conclusion), puis explique brièvement la notion pour que l'élève comprenne et puisse refaire seul un exercice semblable.
- Langues vivantes : corrige les fautes, explique la règle, traduis et propose de s'entraîner. Français : analyse de texte, grammaire, conjugaison, rédaction (propose un plan puis la rédaction).
- Si l'énoncé est sur une photo, lis-le entièrement avant de répondre.

Mathématiques :
- Raisonne étape par étape, vérifie tes calculs et donne le résultat final clairement.
- Écris les formules en LaTeX : $...$ pour une formule dans une phrase, $$...$$ pour une formule sur sa propre ligne.

Photos :
- Si l'utilisateur envoie une photo, décris-la, lis le texte qu'elle contient et traduis-le dans la langue demandée (par défaut la langue de l'utilisateur). Garde la mise en forme d'origine quand c'est utile.

Images :
- Tu peux générer des images. Quand l'utilisateur demande de créer, dessiner ou générer une image ou une photo, écris une courte phrase en français, puis ajoute sur une ligne séparée : [[IMAGE: description détaillée de l'image, en anglais]]. Une seule image par réponse, et uniquement pour une vraie demande d'image.
- Refuse les images violentes, sexuelles ou qui montrent une personne réelle de façon trompeuse.

Vidéos :
- Tu ne peux pas encore générer de vidéos. Si on t'en demande, dis-le franchement et propose à la place un scénario, un découpage en scènes et une image par scène.

Créer des IA :
- Aide les gens à créer leur propre IA ou chatbot : choix d'une API, écriture du prompt système, code de l'interface, déploiement, sécurité de la clé API. Donne des étapes simples et du code prêt à copier.`;


// Réponse garantie à la question « qui t'a créé ? » : vérifiée côté serveur, sans dépendre du modèle.
const QUESTIONS_CREATEUR = [
  ["fr", /qui\s+(?:t'?a|vous a)\s+(?:cree|fait|concu|programme|developpe|invente|construit|realise|fabrique|mis au monde)/],
  ["fr", /par qui\s+(?:as-tu|etes-vous|es-tu|tu as)\s+ete\s+(?:cree|fait|concu|programme|developpe)/],
  ["fr", /(?:ton|votre)\s+(?:createur|concepteur|developpeur|inventeur|proprietaire|fondateur)/],
  ["en", /who\s+(?:created|made|built|developed|designed|programmed|invented)\s+you/],
  ["en", /your\s+(?:creator|developer|maker|inventor)/],
  ["es", /quien\s+te\s+(?:creo|hizo|desarrollo|programo|invento|diseno)/],
  ["es", /tu\s+creador/],
  ["de", /wer\s+hat\s+dich\s+(?:erschaffen|erstellt|entwickelt|programmiert|gemacht|gebaut)/],
  ["de", /dein\s+(?:schopfer|entwickler|ersteller)/],
];

function reponseCreateur(message) {
  if (message.length > 150) return null;
  const m = message
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[’`´]/g, "'");
  for (const [lang, re] of QUESTIONS_CREATEUR) {
    if (re.test(m)) {
      if (lang === "en") return `My creator is ${CREATEUR}. My name is ${NOM_IA}.`;
      if (lang === "es") return `Mi creador es ${CREATEUR}. Me llamo ${NOM_IA}.`;
      if (lang === "de") return `Mein Schöpfer ist ${CREATEUR}. Ich heiße ${NOM_IA}.`;
      return `Mon créateur est ${CREATEUR}. Je m'appelle ${NOM_IA}.`;
    }
  }
  return null;
}


// Donne la date du jour au modèle, pour qu'il sache quand "maintenant" se situe.
function infoDate() {
  const d = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo",
  });
  return `\n\nDate du jour : ${d}.\nPour toute question sur une personne qui occupe actuellement un poste (président, ministre, champion, etc.), vérifie toujours par la recherche web. Si tu ne peux pas vérifier, dis que ton information peut être dépassée.`;
}

function rep(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return rep(405, { error: "Méthode non autorisée." });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return rep(500, { error: "La clé GEMINI_API_KEY est manquante dans les variables Netlify." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return rep(400, { error: "Requête invalide." });
  }

  // Codes d'accès payants : variable Netlify ACCESS_CODES (codes séparés par des virgules).
  // Si la variable est vide ou absente, l'accès reste libre.
  const codes = (process.env.ACCESS_CODES || "")
    .split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (codes.length) {
    const code = String(body.code || "").trim().toUpperCase();
    if (!codes.includes(code)) {
      return rep(401, { error: "Code d'accès invalide ou expiré.", needCode: true });
    }
  }
  if (body.check) return rep(200, { ok: true });

  const message = String(body.message || "").slice(0, 8000);
  const image = body.image;
  if (!message && !image) return rep(400, { error: "Message vide." });

  if (!image) {
    const direct = reponseCreateur(message);
    if (direct) return rep(200, { reply: direct });
  }

  // Historique : on garde les 20 derniers messages texte, en commençant par un message utilisateur.
  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const contents = [];
  for (const h of history) {
    const role = h && h.role === "model" ? "model" : "user";
    const text = String((h && h.text) || "").slice(0, 8000);
    if (!text) continue;
    if (!contents.length && role === "model") continue;
    contents.push({ role, parts: [{ text }] });
  }

  const parts = [];
  if (image && image.data && /^image\/(jpeg|png|webp)$/.test(image.mime || "")) {
    parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
  }
  parts.push({
    text: message || "Décris cette image et traduis tout le texte visible dans ma langue.",
  });
  contents.push({ role: "user", parts });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;
    const appeler = (avecRecherche) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM + infoDate() }] },
          contents,
          generationConfig: { temperature: 0.7 },
          ...(avecRecherche ? { tools: [{ google_search: {} }] } : {}),
        }),
      });

    // On essaie d'abord avec la recherche Google ; si ça échoue (hors quota), on réessaie sans.
    let r = await appeler(true);
    if (!r.ok && r.status !== 429) r = await appeler(false);

    const data = await r.json().catch(() => ({}));

    if (r.status === 429) {
      return rep(429, { error: "Trop de demandes en ce moment (quota gratuit atteint). Réessaie dans une minute." });
    }
    if (!r.ok) {
      const detail = (data && data.error && data.error.message) || "Erreur de l'API Gemini.";
      return rep(502, { error: detail });
    }

    const reply = (((data.candidates || [])[0] || {}).content || {}).parts;
    const text = Array.isArray(reply) ? reply.map((p) => p.text || "").join("") : "";

    if (!text) {
      const bloque = data.promptFeedback && data.promptFeedback.blockReason;
      return rep(200, {
        reply: bloque
          ? "Je ne peux pas répondre à cette demande. Essaie de la reformuler."
          : "Je n'ai pas réussi à générer de réponse. Réessaie.",
      });
    }

    return rep(200, { reply: text });
  } catch (e) {
    return rep(500, { error: "Erreur réseau côté serveur. Réessaie." });
  }
};
