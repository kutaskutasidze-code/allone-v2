-- Harden doc_number: a unique index so two concurrent drafts can never share
-- a number (which would overwrite the same offers/<doc_number>.pdf). Partial
-- index (NULLs allowed) so rows without a number yet are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_proposals_doc_number
  ON proposals (doc_number)
  WHERE doc_number IS NOT NULL;
