-- Data fix (finding 13): proformas explicitly labelled "(draft)" by editors
-- must enter the lifecycle as DRAFT instead of the default APPROVED, so they
-- are clearly badged "Draft — verify before use" on the public site.

UPDATE "VetProforma"
SET status = 'DRAFT'
WHERE status = 'APPROVED'
  AND (
    lower(title) LIKE '%(draft)%'
    OR lower(coalesce(description, '')) LIKE '%(draft)%'
  );
