# PocketBase: expense_reports collection

This document contains an importable PocketBase collection schema and instructions for creating the `expense_reports` collection used by the Nexus Ventures mileage/expense forms.

What this collection does
- Stores submitted expense reports with structured fields and an uploaded PDF copy.
- Records are associated to a `user` relation when the submitting client provides a PocketBase auth token.

Important notes before importing
- PocketBase requires relation `collectionId` to be the internal collection id (UUID) of the target collection (for the built-in users collection this is typically `_pb_users_auth_`).
- If you use a custom users collection or different id, replace the `collectionId` value in the JSON before importing.

Files added

- `docs/pb_expense_reports_import.json` — importable JSON for the PocketBase Collections import tool. Replace `_pb_users_auth_` if necessary.

How to import
1. Open your PocketBase Admin UI (usually at `http://127.0.0.1:8090/_/`).
2. Go to Collections -> Import.
3. Paste the contents of `docs/pb_expense_reports_import.json` or upload the file.
4. Update the relation `collectionId` (user) to match your users collection UUID if needed.
5. Import and review the created collection and fields.

Recommended collection rules
- listRule: `request.auth != null && ((record.user && record.user == request.auth.record.id) || request.auth.isAdmin)`
- viewRule: `request.auth != null && ((record.user && record.user == request.auth.record.id) || request.auth.isAdmin)`
- createRule: `request.auth != null && (record.user == request.auth.record.id || request.auth.isAdmin)`
- updateRule: `request.auth != null && ((record.user && record.user == request.auth.record.id) || request.auth.isAdmin)`
- deleteRule: `request.auth != null && request.auth.isAdmin`

Server-side integration notes
- The server already maps incoming frontend fields (Spanish names) to English field ids when creating records. No frontend changes are required.
- To have the record linked to the submitting user, the client includes the PocketBase token in the Authorization header; the server applies the token and the `user` relation will be set automatically if present in the incoming record (the server can also append `user` to the form when the token is valid).

If you want I can also:
- Add a one-time script to POST this collection to PocketBase programmatically (requires admin credentials).
- Update the server to explicitly append the `user` relation field before creating the record (if you prefer that flow).

---
Generated: PocketBase import JSON is in `docs/pb_expense_reports_import.json`.
