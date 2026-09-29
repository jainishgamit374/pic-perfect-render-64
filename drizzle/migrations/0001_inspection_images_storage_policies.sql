CREATE POLICY "own inspection images read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own inspection images insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own inspection images update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own inspection images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inspection-images' AND auth.uid()::text = (storage.foldername(name))[1]);
