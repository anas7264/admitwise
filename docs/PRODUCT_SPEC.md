# ADMITWISE — Product & Engineering Specification

**Status:** Approved baseline from the user's ten product decisions  
**Audience:** Israeli high-school matriculation graduates preparing for undergraduate admission  
**Privacy model:** Local-first student profile; remote discovery may process only the selected major, selected institution IDs, and admission year.

## Product outcome

Help a student identify official admission requirements for a selected undergraduate major at one to five explicitly selected Israeli institutions, compare verified requirements with the student's locally stored academic profile, and understand documented gaps and available official preparatory/alternative admission routes.

## Product rules

1. A major must be selected from the maintained multilingual major catalog; free-text major names are not accepted as search identifiers.
2. Each discovery request must contain 1–5 distinct institution IDs from the maintained institution catalog.
3. Discovery is strictly scoped to those institution IDs. The server must reject out-of-scope results, even if a provider returns them.
4. Official institutional sources only: public official institutional pages and official institutional PDFs. No third-party admission aggregators as evidence.
5. Every extracted criterion is tied to an institution, major, academic year, source URL/title, source excerpt, retrieval timestamp, confidence score, and review status.
6. A criterion is eligible for comparison only when its official source domain has been checked, its review status is verified, and its academic year exactly matches the requested year.
7. Missing information is unknown, not fail. An unlocated program is not_found_in_selected_institution, not proof that the institution never offers it.
8. AND/OR alternatives must preserve the source's original logic. Never flatten alternative admission tracks into a single conjunctive rule.
9. Preparatory programs and alternative routes must themselves have official evidence and independent year/source metadata.
10. No admission probability is shown without a defensible, calibrated dataset. “Meets recorded requirements” is not a promise of admission.
11. Student profile data, personal scores, and local comparison outputs must never be sent to discovery providers or remote extraction services.
12. No bypass of login walls, CAPTCHAs, robots restrictions, or access controls. Only publicly accessible official sources are eligible.

## Architecture

- **Catalog layer:** multilingual major catalog and institution registry with stable IDs and official-domain allowlists (domain allowlists require curation before automated verification is enabled).
- **Discovery orchestrator:** validates the requested major, institution IDs (1–5), academic year, and official-only policy; isolates each institution's search results.
- **Source acquisition:** provider adapter for web search plus controlled retrieval of public HTML/PDF pages. Provider credentials remain server-side.
- **Extraction:** deterministic parsing for HTML headings/tables and PDF text, with optional AI-assisted structuring on the server. AI output is an untrusted draft, never an authority.
- **Evidence verification:** domain allowlist, institution/program/year matching, excerpt validation, confidence, and review workflow.
- **Admission rules:** normalize only reviewed evidence to the existing explainable AND/OR criteria engine.
- **Local comparison:** browser-only comparison against IndexedDB profile. No student profile data in discovery requests.
- **Presentation:** dashboard with institution-level result states, source trail, requirement gaps, and officially documented preparation routes.

## Evidence state machine

- pending_review: extracted but not eligible for comparison.
- verified: reviewed and source domain/year/program checks passed.
- rejected: unsupported, conflicting, stale, or incorrectly extracted.

Confidence is an extraction-quality signal, not a substitute for verification. A high-confidence unverified criterion remains excluded from comparison.

## Discovery request contract

The request contains only: majorId, institutionIds, academicYear, and sourcePolicy=official_only.

It intentionally has no student profile, grades, identity, email, or account identifier.

## Phased delivery

### Phase 1 — Safe discovery foundation
- Catalogs and multilingual search.
- Enforced 1–5 institution boundary.
- Evidence schema and verified-only evaluation gate.
- Product specification and automated tests.

### Phase 2 — Real official-source discovery
- Curate and verify official domains for every supported institution.
- Add a server-side search/retrieval provider adapter and secret configuration.
- Add institution-isolated search, official-source filtering, and PDF/HTML acquisition.
- Add timeout, rate limiting, caching, provider failure states, and audit metadata.
- No claim of automatic search until a configured provider is tested end-to-end.

### Phase 3 — Extraction and review
- Structured extraction of thresholds, prerequisites, alternative tracks, and preparatory routes.
- Human-review workflow for ambiguous/conflicting criteria.
- Source citations and exact excerpt/page references.
- Year-specific snapshots and recheck workflow.

### Phase 4 — Local comparison dashboard
- Merge only verified, year-matched criteria into the existing engine.
- Gap analysis and next-step recommendations.
- Institution-level charts with explicit unknown/review states.
- Backup/restore compatibility and offline behavior.

## Acceptance tests

- Reject zero, six, duplicate, or unknown institutions.
- Reject unknown majors and malformed academic years.
- Never return or persist results for an institution outside the request.
- Do not evaluate pending/rejected/unverified criteria.
- Do not evaluate criteria from a different academic year.
- Require official source URL, excerpt, retrieval time, confidence, and review status.
- Preserve AND/OR structure and keep preparatory routes separate.
- Assert that discovery payloads contain no profile or score fields.
- Keep existing IndexedDB data and the current comparison engine backward-compatible.

## Current implementation boundary

Phase 1 establishes the catalog, selection validation, evidence schema, and verified-only gate. It does not yet perform live web search, fetch institutional pages, parse PDFs, or auto-create admission criteria. Those require the Phase 2 provider adapter and curated official-domain registry.
