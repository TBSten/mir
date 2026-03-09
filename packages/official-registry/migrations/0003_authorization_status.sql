-- snippets テーブルに認可ステータスカラムを追加
-- デフォルトは 'examination' (審査中)
-- 有効な値: 'examination', 'approved', 'rejected'

ALTER TABLE snippets ADD COLUMN authorization_status TEXT NOT NULL DEFAULT 'examination';

CREATE INDEX idx_snippets_authorization_status ON snippets(authorization_status);
