-- Replace GitHub demo URLs AssemblyAI cannot download with public S3 recordings
UPDATE call_records
SET "audioUrl" = 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3'
WHERE "audioUrl" ILIKE '%github.com%'
   OR "audioUrl" ILIKE '%raw.githubusercontent%';
