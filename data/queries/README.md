# Data Queries

Each `.sql` file in this directory documents the Databricks query used to generate the corresponding CSV in `data/`.

| SQL file | CSV output | Source tables |
|---|---|---|
| `sxm_talent_content_relationship_ref.sql` | `sxm_talent_content_relationship_ref.csv` | `refined_prod.content_ingestion.tag_talent_contents`, `refined_prod.content_ingestion.talents` |

## CSVs without Databricks lineage (provided externally)

These were provided as exports — re-run queries are unknown:
- `sxm_channel_reference.csv`
- `sxm_channel_genre_landing_reference.csv`
- `sxm_channel_lineup_bridge.csv`
- `sxm_package_reference.csv`
- `sxm_genre_select_channel_landing_ref.csv`

If you have the originating queries for any of these, add a `.sql` file here following the same pattern.

## Convention

- Filename must match the CSV it generates (e.g., `foo.sql` → `data/foo.csv`)
- Include `-- Last run:` date, `-- Purpose:`, and any known `-- MISSING COLUMNS` with instructions
- When adding new columns to an existing query, update both the `.sql` file and re-export the CSV
