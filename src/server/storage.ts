/** Keep private document keys separate from public catalogue image keys. */
export function getStorage(bucket: R2Bucket | undefined): R2Bucket {
  if (!bucket)
    throw new Error('R2 is not configured. Connect the BUCKET binding before uploading files.');
  return bucket;
}
