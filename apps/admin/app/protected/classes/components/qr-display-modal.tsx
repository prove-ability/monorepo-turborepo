"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/common/modal";
import { Button } from "@repo/ui";
import { generateQRToken } from "@/actions/classActions";

interface QRDisplayModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  classId: string;
  className: string;
  webAppUrl: string;
}

export function QRDisplayModal({
  isOpen,
  setIsOpen,
  classId,
  className,
  webAppUrl,
}: QRDisplayModalProps) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const generateToken = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateQRToken(classId);

      if ("error" in result && result.error) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "오류가 발생했습니다."
        );
        return;
      }

      if (
        "success" in result &&
        result.success &&
        "qrToken" in result &&
        result.qrToken
      ) {
        setQrToken(result.qrToken);
        setExpiresAt(
          "qrExpiresAt" in result ? result.qrExpiresAt || null : null
        );
      }
    } catch (err) {
      setError("QR 코드 생성 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateToken();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setQrToken(null);
      setExpiresAt(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const qrUrl = qrToken
    ? `${webAppUrl}/qr-login?token=${qrToken}&classId=${classId}`
    : "";

  const formatExpiryTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="QR 코드 로그인"
      size="xl"
    >
      <div className="space-y-6">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={generateToken} disabled={isLoading}>
              다시 시도
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">QR 코드 생성 중...</p>
          </div>
        ) : qrToken ? (
          <>
            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📱 학생들에게 QR 코드를 보여주세요
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • 학생들이 휴대폰으로 QR 코드를 스캔하면 자동으로 접속됩니다
                </li>
                <li>• 닉네임만 입력하면 바로 게임을 시작할 수 있습니다</li>
                <li>• 이 QR 코드는 12시간 동안 유효합니다</li>
              </ul>
            </div>

            {/* QR 코드 */}
            <div className="flex flex-col items-center justify-center bg-white p-8 rounded-lg border-2 border-gray-200">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {className}
                </h2>
                <p className="text-sm text-gray-600">수업 QR 코드</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <QRCodeSVG
                  value={qrUrl}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {expiresAt && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    만료 시간: {formatExpiryTime(expiresAt)}
                  </p>
                </div>
              )}
            </div>

            {/* 전체 화면 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  // 전체 화면 모드로 전환
                  const elem = document.documentElement;
                  if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                  }
                }}
                className="flex-1"
              >
                🖥️ 전체 화면으로 보기
              </Button>

              <Button
                onClick={generateToken}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                🔄 새로고침 (새 QR 생성)
              </Button>
            </div>

            {/* 수동 입력 옵션 */}
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                수동 입력 링크 보기
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">
                  QR 스캔이 안 되는 경우 아래 링크를 직접 입력하세요:
                </p>
                <div className="relative">
                  <code
                    onClick={copyToClipboard}
                    className="text-xs break-all bg-white p-2 rounded border block cursor-pointer hover:bg-gray-100 transition-colors"
                    title="클릭하여 복사"
                  >
                    {qrUrl}
                  </code>
                  {isCopied && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded shadow-lg">
                      ✓ 복사됨!
                    </div>
                  )}
                </div>
              </div>
            </details>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
