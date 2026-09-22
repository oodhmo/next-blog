import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/auth-guard";
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
  try {
    // 이미지 업로드는 에디터(관리자) 전용 기능이므로 로그인만으로는 부족하고 ADMIN이어야 한다.
    const guard = await requireAdmin();
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    const { filename, contentType, size } = (body ?? {}) as {
      filename?: unknown;
      contentType?: unknown;
      size?: unknown;
    };

    if (typeof filename !== "string" || !filename || typeof contentType !== "string" || typeof size !== "number") {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "허용되지 않는 파일 형식입니다" }, { status: 400 });
    }

    if (size <= 0 || size > MAX_SIZE) {
      return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다" }, { status: 400 });
    }

    const ext = EXT_MAP[contentType] ?? "jpg";
    const key = `blog/images/${crypto.randomUUID()}.${ext}`;

    const [uploadUrl, viewUrl] = await Promise.all([
      // PUT URL: 업로드용 (5분). ContentLength를 서명에 포함시켜, 실제 업로드
      // 요청의 Content-Length가 여기서 검증한 값과 다르면 S3가 거부하도록 한다
      // (클라이언트가 size를 속이고 더 큰 파일을 올리는 것을 막는 용도).
      getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
        { expiresIn: 300 }
      ),
      // GET URL: 에디터 미리보기용 (1시간)
      getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 }),
    ]);

    return NextResponse.json({ uploadUrl, viewUrl, key });
  } catch (error) {
    console.error("[POST /api/upload/presigned]", error);
    return NextResponse.json({ error: "업로드 URL 발급 중 오류가 발생했습니다" }, { status: 500 });
  }
}
