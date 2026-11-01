# Preserve complete imported CV content during review

The importer previously truncated long sections before the owner could review them. It now keeps the extracted content complete (within the reader's existing 80,000-character input bound), identifies over-limit fields and blocks applying those selected fields until the owner shortens or splits them. Unselected long fields do not block importing other information. The source draft remains unchanged when validation fails.

The existing draft limits, account persistence and publication consent remain unchanged. This is a local file-reading flow and does not call an AI service. Tests cover source preservation, selective import, correction and five synthetic DOCX cases. Browser verification covered a 4,107-character experience, readable English PDF, a no-text PDF error and local draft restoration. All 39 tests and the build passed. Account recovery, cross-device sync and visual PDF export are separate checks.

Synthetic fixture facts are in `tests/fixtures/cv-audit/cases.json`. The no-text PDF contains a rectangle, not a real scanned CV. No real user data is included.
