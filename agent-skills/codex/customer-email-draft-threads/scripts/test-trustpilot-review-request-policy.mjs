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

if (documents.family) {
  requireText("family", [
    /customer's own reply after\s+the fix/i,
    /canonical.*duplicate.*drafts.*`SENT`/is,
    /never send a\s+second invitation/i,
    /official configured Trustpilot review link/i,
  ]);
}
requireText("account", [
  /customer's own reply after\s+the fix/i,
  /never send a\s+second invitation/i,
  /refunds, failed payments, cancellations.*disputes,\s+complaints/is,
]);
requireText("billing", [
  /Exclude Trustpilot review requests/i,
  /Never add a Trustpilot review invitation/i,
]);
requireText("email", [
  /customer's own new inbound reply after\s+the fix/i,
  /Search canonical and duplicate threads, drafts, and `SENT`/i,
  /never send a\s+second invitation/i,
]);
requireText("runbook", [
  /latest inbound message.*customer's own reply after the fix/is,
  /If a prior invitation was sent for this case,\s+never invite again/is,
  /official configured Trustpilot review link/i,
  /explicit current approval|request owner approved/i,
]);
requireText("verification", [
  /Trustpilot closure proof/i,
  /customer's own latest positive confirmation after\s+the fix/i,
  /no prior\s+invite/is,
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
  return (
    candidate.customerConfirmedAfterFix === true &&
    candidate.outcomePositive === true &&
    candidate.fullyResolved === true &&
    candidate.openAsk === false &&
    candidate.canonicalThreadConfirmed === true &&
    candidate.priorInvitationSent === false &&
    candidate.closureAlreadySent === false &&
    candidate.officialConfiguredLinkVerified === true &&
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
  `Trustpilot review-request policy tests passed: ${cases.length} scenarios, two templates, no hard-coded URL.`,
);
