-- Previous Year Papers (PYQ): which exam year a paper belongs to, so the
-- subject page can group papers under year headings. Nullable — only rows
-- with type = "PYQ" set it; every other StudyMaterial stays NULL.
ALTER TABLE "StudyMaterial" ADD COLUMN "year" INTEGER;
