# PocketBase collection: `aml_applications`

This document provides PocketBase settings for storing AML (Anti-Money Laundering) application submissions.

Collection name: aml_applications

Fields (recommended):

- `user` (relation) — relation to `users` collection. Required. Stores owner id.
- `full_name` (text) — required
- `email` (email/text) — required
- `phone` (text) — required
- `address` (text) — required (multiline)
- `client_type` (text/select) — required, values: `individual` or `company`
- `nationality` (text) — required
- `date_of_birth` (date) — optional (required for individuals)
- `company_name` (text) — optional (required for companies)
- `company_cro` (text) — optional (required for companies)
- `activity_description` (text) — optional
- `passport` (file) — file, required, maxSelect 1
- `proof_of_address` (file) — file, required, maxSelect 1
- `consent` (bool/text) — required (stores '1' or '0')

Example import JSON snippet (use pb.collections.import or Admin UI):

```json
{
  "collections": [
    {
      "name": "aml_applications",
      "type": "base",
      "system": false,
      "schema": [
        {
          "name": "user",
          "type": "relation",
          "required": true,
          "unique": false,
          "options": {
            "collectionId": "<USERS_COLLECTION_ID>",
            "cascadeDelete": false,
            "maxSelect": 1,
            "displayFields": ["email"]
          }
        },
        {
          "name": "full_name",
          "type": "text",
          "required": true,
          "unique": false,
          "options": { "min": null, "max": 255, "pattern": "" }
        },
        {
          "name": "email",
          "type": "email",
          "required": true,
          "unique": false,
          "options": { "exceptDomains": null }
        },
        {
          "name": "phone",
          "type": "text",
          "required": true,
          "unique": false,
          "options": { "min": null, "max": 50, "pattern": "" }
        },
        {
          "name": "address",
          "type": "text",
          "required": true,
          "unique": false,
          "options": { "min": null, "max": 2000, "pattern": "" }
        },
        {
          "name": "client_type",
          "type": "text",
          "required": true,
          "unique": false,
          "options": { "min": null, "max": 50, "pattern": "" }
        },
        {
          "name": "nationality",
          "type": "text",
          "required": true,
          "unique": false,
          "options": { "min": null, "max": 100, "pattern": "" }
        },
        { "name": "date_of_birth", "type": "date", "required": false, "unique": false, "options": {} },
        { "name": "date_of_incorporation", "type": "date", "required": false, "unique": false, "options": {} },
        {
          "name": "company_name",
          "type": "text",
          "required": false,
          "unique": false,
          "options": { "min": null, "max": 255, "pattern": "" }
        },
        {
          "name": "company_cro",
          "type": "text",
          "required": false,
          "unique": false,
          "options": { "min": null, "max": 100, "pattern": "" }
        },
        {
          "name": "activity_description",
          "type": "text",
          "required": false,
          "unique": false,
          "options": { "min": null, "max": 2000, "pattern": "" }
        },
        {
          "name": "passport",
          "type": "file",
          "required": true,
          "unique": false,
          "options": { "maxSelect": 1, "maxSize": 52428800, "mimeTypes": [], "thumbs": [] }
        },
        {
          "name": "proof_of_address",
          "type": "file",
          "required": true,
          "unique": false,
          "options": { "maxSelect": 1, "maxSize": 52428800, "mimeTypes": [], "thumbs": [] }
        },
        { "name": "consent", "type": "bool", "required": true, "unique": false, "options": {} }
      ],
      "listRule": "user = @request.auth.id || @request.auth.role = \"admin\"",
      "viewRule": "user = @request.auth.id || @request.auth.role = \"admin\"",
      "createRule": "@request.auth.id != '' && user = @request.auth.id",
      "updateRule": "user = @request.auth.id || @request.auth.role = \"admin\"",
      "deleteRule": "user = @request.auth.id || @request.auth.role = \"admin\"",
      "options": {}
    }
  ]
}
```

Notes on the "Invalid collections configuration" error
- PocketBase's import expects relation fields to reference a collection by its internal collection ID (a UUID), not the collection name. If you left `"collectionId": "users"` (a collection name) the import will fail with "Invalid collections configuration." Replace `<USERS_COLLECTION_ID>` below with the users collection id from your PocketBase instance.

How to get your users collection id
1. Open the PocketBase admin UI for your instance (e.g. http://127.0.0.1:8090/_/).
2. Go to Collections → Users and click the three-dot menu → "Copy ID" (or inspect the URL when editing the collection). That value is the UUID you must paste into `collectionId`.

Importing
- Save the JSON above to a file, e.g. `aml_applications.json`.
- In the PocketBase admin UI use Collections → Import and upload the file, or use the CLI/server-side import endpoint.

If you still see the error after setting the users collection id correctly, check for these common issues:
- Ensure the JSON contains only valid UTF-8 characters (no stray BOM or non-printables).
- Make sure the top-level structure is an object with a `collections` array (as in the example).
- If you previously created a collection with the same name but a different schema, consider removing it first or using a different name.

If you'd like, I can attempt to read your PocketBase instance (if you provide access) and inject the correct users collection id automatically into the import JSON.

Notes and security recommendations:

- The `createRule` both requires authentication and enforces that the `user` relation matches the authenticated user. This prevents clients from spoofing another user's id on create.
- For companies, store the company's incorporation date in `date_of_incorporation`. The form enforces that `date_of_birth` is required for individuals and `date_of_incorporation` is required for companies.
- The admin OR clauses assume you add a `role` field on `users` with value `admin` for admin users. Alternatively, PocketBase super-admins (dashboard) bypass rules.
- For stricter server-side control, you can implement an upload endpoint on your server that uses a server-side admin token to create the record and set the `user` relation based on the authenticated request.
- Files stored in `passport` and `proof_of_address` may need private access; use `pb.files.getToken()` when building URLs for authenticated downloads.
