-- At most one featured post (minimum-one is guaranteed by the seed + /api/home fallback).
CREATE UNIQUE INDEX "Post_one_featured" ON "Post" ("featured") WHERE "featured" = true;
