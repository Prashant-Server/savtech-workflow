# Savtech Field Ops

Field operations app (POs, visits, reports, quotations, invoices, challans, payments, GST).
Data is shared between all users via a Netlify Function (`/api/db`) backed by Netlify Blobs.

## Deploy on Netlify
1. Netlify → Add new site → Import from GitHub → choose this repo.
2. Leave build command empty; publish directory `.` (set in `netlify.toml`).
3. Deploy. Open the site on the admin PC first so existing browser data is uploaded to the cloud.
