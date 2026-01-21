-- Vector similarity search function for RAG
-- Uses pgvector's cosine distance for semantic search

CREATE OR REPLACE FUNCTION match_knowledge_embeddings(
  query_embedding TEXT,
  match_knowledge_base_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  chunk_index INT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  embedding_vector vector(1536);
BEGIN
  -- Parse the JSON string to vector
  embedding_vector := query_embedding::vector(1536);

  RETURN QUERY
  SELECT
    ke.id,
    ke.content,
    1 - (ke.embedding <=> embedding_vector) AS similarity,
    ke.chunk_index,
    ke.metadata
  FROM knowledge_embeddings ke
  WHERE ke.knowledge_base_id = match_knowledge_base_id
    AND 1 - (ke.embedding <=> embedding_vector) > match_threshold
  ORDER BY ke.embedding <=> embedding_vector
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_knowledge_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_embeddings TO service_role;

-- Create optimized index if not exists (HNSW for better performance on larger datasets)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_knowledge_embeddings_hnsw'
  ) THEN
    CREATE INDEX idx_knowledge_embeddings_hnsw ON knowledge_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
  END IF;
END $$;
