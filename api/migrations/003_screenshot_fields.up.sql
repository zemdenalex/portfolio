ALTER TABLE style_references ADD COLUMN screenshot_url TEXT;
ALTER TABLE style_references ADD COLUMN embeddable BOOLEAN NOT NULL DEFAULT false;
