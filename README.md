# Product R&D Tracker

This repository now contains **Step 1: project setup** for a beginner-friendly web app.

## Simplest stack selected

- HTML
- CSS
- Vanilla JavaScript
- JSON (temporary local data source)

This stack is easy to learn because it runs directly in the browser and does not require setup tooling.

## Current project structure

```text
product-rd-tracker/
├── data/
│   └── products.json
├── docs/
│   └── PROJECT_STRUCTURE.md
├── scripts/
│   └── app.js
├── styles/
│   └── main.css
└── index.html
```

## What has been prepared (and what has not)

Prepared in this step:
- basic dashboard placeholder section
- basic products placeholder section
- starter product record format including all requested fields
- foundation styles and JS wiring

Not built yet:
- full product list rendering
- status color system
- visual progress bars
- editing/adding/deleting products

These will be built gradually in future steps.

## CSV import flow (Google Sheets export)

The dashboard now supports importing a CSV into the product table:

1. Open `dashboard.html` in your browser.
2. In **Product Initiatives**, click **Choose CSV file** and select your exported Google Sheets CSV.
3. Map your CSV columns to app fields (`Product name`, `Stage`, `Owner`, `Due date`, etc.).
4. Click **Apply mapping**.

Your imported rows are rendered in the table, KPI cards, stage breakdown, and milestone list.

### Updating data later

- Re-export the latest CSV from Google Sheets and import again with the same flow.
- Click **Apply mapping** to overwrite current table data with the new import.
- The imported result is saved in browser `localStorage`, so refreshes keep the latest import.
- Use **Reset sample data** if you want to clear imported data and return to built-in examples.
