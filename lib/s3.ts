import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export async function getPresignedViewUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 }
  );
}

// S3 key src를 presigned GET URL로 교체하는 공통 로직
async function doReplaceKeys(
  html: string,
  transform: (key: string, url: string) => string
): Promise<string> {
  const KEY_RE = /src="(blog\/images\/[^"]+)"/g;
  const matches = [...html.matchAll(KEY_RE)];
  if (!matches.length) return html;

  const uniqueKeys = [...new Set(matches.map((m) => m[1]))];
  const urlMap = new Map(
    await Promise.all(
      uniqueKeys.map(async (key) => [key, await getPresignedViewUrl(key)] as const)
    )
  );

  return html.replace(KEY_RE, (_, key) => transform(key, urlMap.get(key) ?? key));
}

// 블로그 렌더링용: src만 presigned URL로 교체
export async function replaceKeysWithPresignedUrls(html: string): Promise<string> {
  return doReplaceKeys(html, (_, url) => `src="${url}"`);
}

// 에디터 로딩용: src를 presigned URL로 교체 + data-s3-key 추가 (에디터가 key를 추적)
export async function replaceKeysWithPresignedUrlsForEditor(html: string): Promise<string> {
  return doReplaceKeys(html, (key, url) => `src="${url}" data-s3-key="${key}"`);
}
