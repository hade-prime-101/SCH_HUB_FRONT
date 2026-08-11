CREATE INDEX "materials_departmentId_visibility_isDeleted_createdAt_idx"
  ON "materials" ("departmentId", "visibility", "isDeleted", "createdAt" DESC);

CREATE INDEX "quizzes_departmentId_visibility_isDraft_isActive_createdAt_idx"
  ON "quizzes" ("departmentId", "visibility", "isDraft", "isActive", "createdAt" DESC);

CREATE INDEX "listings_category_isAvailable_isDeleted_createdAt_idx"
  ON "listings" ("category", "isAvailable", "isDeleted", "createdAt" DESC);

CREATE INDEX "community_posts_section_departmentId_isDeleted_createdAt_idx"
  ON "community_posts" ("section", "departmentId", "isDeleted", "createdAt" DESC);

CREATE INDEX "community_posts_section_schoolId_isDeleted_createdAt_idx"
  ON "community_posts" ("section", "schoolId", "isDeleted", "createdAt" DESC);

CREATE INDEX "study_groups_departmentId_isActive_createdAt_idx"
  ON "study_groups" ("departmentId", "isActive", "createdAt" DESC);
