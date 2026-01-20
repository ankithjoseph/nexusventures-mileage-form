# PocketBase: company_incorporations collection

This document contains an importable PocketBase collection schema and instructions for creating the `company_incorporations` collection used by the Nexus Ventures company incorporation forms.

## What this collection does
- Stores submitted company incorporation forms with the generated PDF copy.
- Records are associated to a `user` relation when the submitting client provides a PocketBase auth token.

## Important notes before importing
- PocketBase requires relation `collectionId` to be the internal collection id (UUID) of the target collection (for the built-in users collection this is typically `_pb_users_auth_`).
- If you use a custom users collection or different id, replace the `collectionId` value in the JSON before importing.

## Files added

- `docs/pb_company_incorporations_import.json` — importable JSON for the PocketBase Collections import tool. Replace `_pb_users_auth_` if necessary.

## How to import
1. Open your PocketBase Admin UI (usually at `http://127.0.0.1:8090/_/`).
2. Go to Collections -> Import.
3. Paste the contents of `docs/pb_company_incorporations_import.json` or upload the file.
4. Update the relation `collectionId` (user) to match your users collection UUID if needed.
5. Import and review the created collection and fields.

## Collection Schema

| Field   | Type        | Required | Description                       |
| ------- | ----------- | -------- | --------------------------------- |
| id      | text (auto) | Yes      | Primary key, auto-generated       |
| user    | relation    | No       | Reference to users collection     |
| name    | text        | Yes      | Applicant name                    |
| email   | email       | Yes      | Applicant email                   |
| pdf     | file        | No       | The generated PDF file (max 50MB) |
| created | autodate    | Yes      | Record creation timestamp         |
| updated | autodate    | Yes      | Record update timestamp           |

## Access Rules
- **listRule**: Authenticated users can only list their own records (or admins can see all)
- **viewRule**: Authenticated users can only view their own records (or admins can see all)
- **createRule**: Authenticated users can create records with their own user id
- **updateRule**: Authenticated users can only update their own records (or admins can update all)
- **deleteRule**: Only admins can delete records

---
Generated: PocketBase import JSON is in `docs/pb_company_incorporations_import.json`.
