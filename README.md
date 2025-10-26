Ravenpedia — Pet Talent Stats Calculator
===============================================
A compact web calculator for pet talents in Wizard101 using Astro, Vue and FormKit.

<a href="https://github.com/chris-kretschmer/ravenpedia-pet-stats-calculator/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=chris-kretschmer/ravenpedia-pet-stats-calculator" />
</a>

Key features
--------------
- Interactive talent calculator UI
- Talent data stored in `src/data/talents.json`
- API at `/api/talents` serving talent data as base64-encoded JSON
- Small, fast Astro site with Vue components and FormKit forms


Files of interest
-----------------
- `src/data/talents.json` — talent data
- `src/pages/api/talents.ts` — API serving talents
- `src/components/Calculator.vue` — main calculator UI
- `src/i18n/de.json` — German UI texts

Running locally
--------------
- `npm install`: Installs dependencies.
- `dev`: Starts the Astro dev server (`astro dev`).

Notes
-----
- API responses are base64-encoded by default and include an `X-Content-Encoded: base64` header so clients can detect and decode them.

