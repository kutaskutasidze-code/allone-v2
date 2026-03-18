-- Storage policies for documents bucket
-- Run this in Supabase SQL Editor if policies aren't automatically applied

-- Allow authenticated users to upload to documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update documents
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete documents
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Allow public read access to documents
CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
