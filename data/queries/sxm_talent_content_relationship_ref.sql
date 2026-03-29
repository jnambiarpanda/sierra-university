-- Source: refined_prod.content_ingestion (Databricks)
-- Output: data/sxm_talent_content_relationship_ref.csv
-- Last run: 2026-03-28
-- Purpose: Maps talent entities (hosts, artists, guests) to the content they are associated with
--          (channels, shows, podcasts). Used by the agent to resolve affinity artist slugs to
--          entity IDs and to build talent attachment cards.
--
-- MISSING COLUMNS — re-run with these added before building talent attachment cards:
--   t.uri         AS talent_slug          -- needed for player_landing_page construction
--   t.imageUrl    AS talent_image_url     -- AEM-relative path; convert to CDN URL via buildCdnImageUrl()
--
-- player_landing_page pattern (once slug is available):
--   https://www.siriusxm.com/player/talent/{talent_slug}/{talent_entity_id}

SELECT
  ttc.talentId        AS talent_entity_id,
  t.name              AS talent_name,
  t.talentTypes[0]    AS talent_type,
  ttc.contentId       AS related_entity_id,
  ttc.contentType     AS related_entity_type,
  ttc.relationship
FROM refined_prod.content_ingestion.tag_talent_contents ttc
JOIN refined_prod.content_ingestion.talents t
  ON ttc.talentId = t.id
  AND t.isDeleted = false
WHERE ttc.contentType IN ('channel-linear', 'channel-xtra', 'show-podcast', 'show', 'team', 'artist')
  AND ttc.relationship IN ('GUEST', 'HOST', 'PERFORMER')
