-- BF-01: aggregation method and creator
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS aggregation_method TEXT NOT NULL DEFAULT 'count'
    CHECK (aggregation_method IN ('count', 'arr_sum')),
  ADD COLUMN IF NOT EXISTS created_by_user_id TEXT;

-- BF-05: configurable date filter field per board
ALTER TABLE board_config
  ADD COLUMN IF NOT EXISTS date_filter_field TEXT NOT NULL DEFAULT 'activity_date'
    CHECK (date_filter_field IN ('activity_date', 'renewal_date', 'close_date', 'created_at'));

-- BF-03: column type flag
ALTER TABLE board_columns
  ADD COLUMN IF NOT EXISTS column_type TEXT NOT NULL DEFAULT 'crm'
    CHECK (column_type IN ('crm', 'ai', 'system'));
