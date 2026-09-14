-- Enable the two extensions the schema depends on as a standalone migration so a
-- permissions failure surfaces immediately rather than halfway through table create.
-- citext: case-insensitive identity columns (emails, discount codes).
-- pg_trgm: GIN trigram indexes for admin global search (spec §34).

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
