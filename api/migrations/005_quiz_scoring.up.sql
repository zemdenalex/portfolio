ALTER TABLE quiz_options
  ADD COLUMN style_weights JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE quiz_options
  ADD COLUMN project_type project_type NULL;
