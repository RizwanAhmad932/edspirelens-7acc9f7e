# Architecture rules
- Manage festival selection through one app-root provider backed by the existing app_themes table and activate_theme RPC, so every route shares a single selection and admin authorization remains server-enforced.
- Define festival palettes in global CSS and festival metadata in a shared catalog, so previews and live pages use the same theme without duplicating visual values.
- Keep shared math delimiter parsing in one utility so screen and PDF renderers interpret equations consistently.
- Render Cram Kit PDFs from browser-rendered HTML, so non-ASCII math symbols and numerical notation do not depend on limited PDF fonts.