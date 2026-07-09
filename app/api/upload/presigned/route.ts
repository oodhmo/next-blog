import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { s3, BUCKET } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, contentType, size } = body as {
    filename: string;
    contentType: string;
    size: number;
  };

  if (!filename || !contentType || typeof size !== "number") {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "허용되지 않는 파일 형식입니다" }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다" }, { status: 400 });
  }

  const ext = EXT_MAP[contentType] ?? "jpg";
  const key = `blog/images/${crypto.randomUUID()}.${ext}`;

  const [uploadUrl, viewUrl] = await Promise.all([
    // PUT URL: 업로드용 (5분)
    getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 }),
    // GET URL: 에디터 미리보기용 (1시간)
    getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 }),
  ]);

  return NextResponse.json({ uploadUrl, viewUrl, key });
}
