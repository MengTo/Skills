#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../../..");
const localSkillsRoot = path.resolve(scriptDirectory, "../..");
const repositoryFamilyFile = path.join(
  repositoryRoot,
  "agent-skills/customer-support/README.md",
);
const repositoryMode = existsSync(repositoryFamilyFile);

const policyFiles = repositoryMode
  ? {
      family: repositoryFamilyFile,
      account: path.join(
        repositoryRoot,
        "agent-skills/customer-support/handle-saas-account-cases/SKILL.md",
      ),
      billing: path.join(
        repositoryRoot,
        "agent-skills/customer-support/handle-saas-billing-cases/SKILL.md",
      ),
      email: path.join(
        repositoryRoot,
        "agent-skills/codex/customer-email-draft-threads/SKILL.md",
      ),
      runbook: path.join(
        repositoryRoot,
        "agent-skills/codex/customer-email-draft-threads/references/runbook.md",
      ),
      verification: path.join(
        repositoryRoot,
        "agent-skills/codex/customer-support-verification/SKILL.md",
      ),
    }
  : {
      account: path.join(
        localSkillsRoot,
        "handle-saas-account-cases/SKILL.md",
      ),
      billing: path.join(
        localSkillsRoot,
        "handle-saas-billing-cases/SKILL.md",
      ),
      email: path.join(
        localSkillsRoot,
        "customer-email-draft-threads/SKILL.md",
      ),
      runbook: path.join(
        localSkillsRoot,
        "customer-email-draft-threads/references/runbook.md",
      ),
      verification: path.join(
        localSkillsRoot,
        "customer-support-verification/SKILL.md",
      ),
    };

const documents = Object.fromEntries(
  Object.entries(policyFiles).map(([name, absoluteFile]) => [
    name,
    readFileSync(absoluteFile, "utf8"),
  ]),
);

function requireText(documentName, expressions) {
  for (const expression of expressions) {
    if (!expression.test(documents[documentName])) {
      throw new Error(`${documentName} is missing policy text: ${expression}`);
    }
  }
}

function validateMermaidFlowchart(markdown) {
  const blocks = [...markdown.matchAll(/```mermaid\n([\s\S]*?)\n```/g)];
  if (blocks.length !== 1) {
    throw new Error(`Expected one Mermaid block, found ${blocks.length}`);
  }

  const lines = blocks[0][1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.shift() !== "flowchart TD") {
    throw new Error("Mermaid block must start with `flowchart TD`");
  }

  const nodePattern = /^([A-Z][A-Z0-9]*)\s*(?:\["[^"]*"\]|\{"[^"]*"\})$/;
  const edgePattern =
    /^([A-Z][A-Z0-9]*)\s+-->(?:\|[^|]+\|)?\s+([A-Z][A-Z0-9]*)$/;
  const nodes = new Set();
  const edges = [];

  for (const line of lines) {
    const node = line.match(nodePattern);
    if (node) {
      if (nodes.has(node[1])) {
        throw new Error(`Duplicate Mermaid node: ${node[1]}`);
      }
      nodes.add(node[1]);
      continue;
    }

    const edge = line.match(edgePattern);
    if (edge) {
      edges.push([edge[1], edge[2]]);
      continue;
    }

    throw new Error(`Unsupported Mermaid syntax in policy flowchart: ${line}`);
  }

  for (const [source, target] of edges) {
    if (!nodes.has(source) || !nodes.has(target)) {
      throw new Error(`Undefined Mermaid edge: ${source} --> ${target}`);
    }
  }

  const chart = blocks[0][1];
  for (const required of [
    /Actionable customer case\?/,
    /Identity and canonical-thread match\?/,
    /Explicit approval for exact financial action and target\?/,
    /Customer explicitly confirms the post-fix outcome is positive\?/,
    /Exactly one positively confirmed product proven by canonical evidence\?/,
    /Prior invitation or closure already sent/,
    /Official configured Trustpilot profile and link match that product\?/,
    /Final closure SENT verification passed\?/,
    /Thread-wide archive read-back passed\?/,
    /No external action/,
  ]) {
    if (!required.test(chart)) {
      throw new Error(`Mermaid flowchart is missing: ${required}`);
    }
  }

  return { nodes: nodes.size, edges: edges.length };
}

let mermaidStats = null;
if (documents.family) {
  requireText("family", [
    /customer's own reply after\s+the fix/i,
    /canonical.*duplicate.*drafts.*`SENT`/is,
    /never send a\s+second invitation/i,
    /official configured Trustpilot profile and review link/i,
    /multiple products.*ambiguous.*omit the invitation/is,
    /Never reuse another product's\s+Trustpilot profile or link/is,
  ]);
  mermaidStats = validateMermaidFlowchart(documents.family);
}
requireText("account", [
  /customer's own reply after\s+the fix/i,
  /never send a\s+second invitation/i,
  /multiple products.*ambiguous.*omit the invitation/is,
  /Never reuse another\s+product's link/is,
  /refunds,\s+failed payments,\s+cancellations.*disputes,\s+complaints/is,
]);
requireText("billing", [
  /Exclude Trustpilot review requests/i,
  /Never add a Trustpilot review invitation/i,
]);
requireText("email", [
  /customer's own new inbound reply after\s+the fix/i,
  /Search canonical and duplicate threads, drafts, and `SENT`/i,
  /never send a\s+second invitation/i,
  /multiple products.*ambiguous.*omit the invitation/is,
  /Never reuse another product's review profile or link/is,
]);
requireText("runbook", [
  /latest inbound message.*customer's own reply after the fix/is,
  /If a prior invitation was sent for this case,\s+never invite again/is,
  /official configured Trustpilot profile and review link/i,
  /multiple products.*ambiguous.*omit the invitation/is,
  /Never reuse another product's review\s+profile or link/is,
  /explicit current approval|request owner approved/i,
]);
requireText("verification", [
  /Trustpilot closure proof/i,
  /customer's own latest positive confirmation after\s+the fix/i,
  /no prior\s+invite/is,
  /exactly one positively confirmed product/is,
  /link belongs to another\s+product/is,
]);

const allPolicyText = Object.values(documents).join("\n");
if (/https?:\/\/[^\s)]*trustpilot/i.test(allPolicyText)) {
  throw new Error("Policy files must not hard-code a Trustpilot URL");
}

const templateLinkCount =
  documents.runbook.match(/\{verified_trustpilot_review_url\}/g)?.length ?? 0;
if (templateLinkCount !== 2) {
  throw new Error(
    `Expected two verified-link template placeholders, found ${templateLinkCount}`,
  );
}

const templateProductCount =
  documents.runbook.match(/\{verified_product_name\}/g)?.length ?? 0;
if (templateProductCount !== 2) {
  throw new Error(
    `Expected two verified-product template placeholders, found ${templateProductCount}`,
  );
}

const excludedCaseTypes = new Set([
  "refund",
  "failed-payment",
  "cancellation",
  "accidental-renewal",
  "dispute",
  "complaint",
  "mixed-contentious",
]);

function reviewInvitationEligible(candidate) {
  const canonicalProducts = [
    ...new Set(
      candidate.canonicalProducts
        .map((product) => product.trim())
        .filter(Boolean),
    ),
  ];

  return (
    candidate.customerConfirmedAfterFix === true &&
    candidate.outcomePositive === true &&
    candidate.fullyResolved === true &&
    candidate.openAsk === false &&
    candidate.canonicalThreadConfirmed === true &&
    candidate.priorInvitationSent === false &&
    candidate.closureAlreadySent === false &&
    candidate.officialConfiguredLinkVerified === true &&
    canonicalProducts.length === 1 &&
    candidate.confirmedProduct === canonicalProducts[0] &&
    candidate.trustpilotProfileProduct === candidate.confirmedProduct &&
    excludedCaseTypes.has(candidate.caseType) === false
  );
}

const baseline = {
  customerConfirmedAfterFix: true,
  outcomePositive: true,
  fullyResolved: true,
  openAsk: false,
  canonicalThreadConfirmed: true,
  priorInvitationSent: false,
  closureAlreadySent: false,
  officialConfiguredLinkVerified: true,
  canonicalProducts: ["Aura"],
  confirmedProduct: "Aura",
  trustpilotProfileProduct: "Aura",
  caseType: "account-access",
};

const cases = [
  ["self-resolved access with positive customer confirmation", {}, true],
  [
    "successful non-contentious product fix",
    { caseType: "product-help" },
    true,
  ],
  [
    "internal state says fixed but customer has not confirmed",
    { customerConfirmedAfterFix: false },
    false,
  ],
  ["customer reply is neutral", { outcomePositive: false }, false],
  ["case still has an open ask", { openAsk: true }, false],
  ["case is not fully resolved", { fullyResolved: false }, false],
  ["canonical thread is unknown", { canonicalThreadConfirmed: false }, false],
  ["review invitation was already sent", { priorInvitationSent: true }, false],
  ["closure reply was already sent", { closureAlreadySent: true }, false],
  [
    "configured Trustpilot link is missing or unverified",
    { officialConfiguredLinkVerified: false },
    false,
  ],
  [
    "Aura plus Neuform mixed thread cannot use the Aura review link",
    {
      canonicalProducts: ["Aura", "Neuform"],
      confirmedProduct: "Aura",
      trustpilotProfileProduct: "Aura",
    },
    false,
  ],
  [
    "Neuform confirmation cannot use the Aura review link",
    {
      canonicalProducts: ["Neuform"],
      confirmedProduct: "Neuform",
      trustpilotProfileProduct: "Aura",
    },
    false,
  ],
  [
    "ambiguous confirmed product",
    { confirmedProduct: "" },
    false,
  ],
  ["refund", { caseType: "refund" }, false],
  ["failed payment", { caseType: "failed-payment" }, false],
  ["cancellation", { caseType: "cancellation" }, false],
  ["accidental renewal", { caseType: "accidental-renewal" }, false],
  ["dispute", { caseType: "dispute" }, false],
  ["complaint", { caseType: "complaint" }, false],
  ["mixed contentious case", { caseType: "mixed-contentious" }, false],
];

for (const [name, overrides, expected] of cases) {
  const actual = reviewInvitationEligible({ ...baseline, ...overrides });
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, received ${actual}`);
  }
}

console.log(
  `Trustpilot review-request policy tests passed: ${cases.length} scenarios, two same-product templates, no hard-coded URL${mermaidStats ? `, Mermaid ${mermaidStats.nodes} nodes/${mermaidStats.edges} edges` : ""}.`,
);
