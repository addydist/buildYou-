-- Drop the old 2-source check constraint and replace with the full list
ALTER TABLE integrations
  DROP CONSTRAINT IF EXISTS integrations_source_check;

ALTER TABLE integrations
  ADD CONSTRAINT integrations_source_check
    CHECK (source IN ('github', 'leetcode', 'codeforces', 'codechef', 'huggingface', 'chesscom'));
