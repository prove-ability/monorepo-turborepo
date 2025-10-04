"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { bulkCreateUsers } from "@/actions/userActions";

export interface BulkRowInput {
  phone: string;
  name: string;
  school: string;
  grade: string | number;
}

interface StudentBulkUploadProps {
  classId: string;
  clientId: string;
  onCompleted?: (result: {
    successCount: number;
    failureCount: number;
  }) => void;
}

interface ParsedRow extends BulkRowInput {
  rowIndex: number; // 1-based excluding header
}

interface ValidatedRow {
  row: ParsedRow;
  valid: boolean;
  errors: string[];
  normalized?: {
    name: string;
    mobile_phone: string;
    affiliation: string;
    grade: string;
  };
}

function parseCSV(text: string): ParsedRow[] {
  // very simple CSV parser: split by newlines, then by comma
  // Expect header: 전화번호,이름,학교,학년
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  // header row is ignored; continue parsing data rows
  const rows = lines.slice(1);
  return rows.map((line, idx) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      rowIndex: idx + 1,
      phone: cols[0] || "",
      name: cols[1] || "",
      school: cols[2] || "",
      grade: cols[3] || "",
    };
  });
}

function validateRows(rows: ParsedRow[]): ValidatedRow[] {
  const phoneRegex = /\d{9,13}/;
  return rows.map((row) => {
    const errors: string[] = [];
    const name = row.name?.trim();
    const phoneRaw = row.phone?.replace(/[^\d]/g, "");
    const affiliation = row.school?.trim();
    const gradeStr = String(row.grade).trim();

    if (!name) errors.push("이름 누락");
    if (!phoneRaw) errors.push("전화번호 누락");
    else if (!phoneRegex.test(phoneRaw)) errors.push("전화번호 형식 오류");
    if (!affiliation) errors.push("소속 누락");
    if (!gradeStr) errors.push("학년 누락");

    return {
      row,
      valid: errors.length === 0,
      errors,
      normalized:
        errors.length === 0
          ? { name, mobile_phone: phoneRaw, affiliation, grade: gradeStr }
          : undefined,
    };
  });
}

export function StudentBulkUpload({
  classId,
  clientId,
  onCompleted,
}: StudentBulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [validated, setValidated] = useState<ValidatedRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasErrors = useMemo(
    () => (validated ? validated.some((v) => !v.valid) : false),
    [validated]
  );
  const validCount = useMemo(
    () => (validated ? validated.filter((v) => v.valid).length : 0),
    [validated]
  );

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = input.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setReading(true);
    const text = await file.text();
    const parsed = parseCSV(text);
    const v = validateRows(parsed);
    setValidated(v);
    setReading(false);
    // reset input so selecting same file again works
    input.value = "";
  };

  const onDownloadSample = () => {
    const csv = "전화번호,이름,학교,학년\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onConfirm = async () => {
    if (!validated) return;
    const payload = validated
      .filter((v) => v.valid && v.normalized)
      .map((v) => ({
        name: v.normalized!.name,
        mobilePhone: v.normalized!.mobile_phone,
        grade: v.normalized!.grade,
        affiliation: v.normalized!.affiliation,
        classId: classId,
      }));

    setSubmitting(true);
    setResultMsg("");
    try {
      const res = await bulkCreateUsers(payload);

      // ActionState 타입 체크 (인증 실패)
      if ("success" in res && !res.success) {
        setResultMsg(res.message || "인증에 실패했습니다.");
        return;
      }

      // 에러 케이스
      if ("error" in res && res.error) {
        setResultMsg(res.error._form?.join("\n") || "업로드에 실패했습니다.");
        return;
      }

      // 성공 케이스 - successCount와 failureCount가 있는지 확인
      if ("successCount" in res && "failureCount" in res) {
        setResultMsg(
          `등록 완료: ${res.successCount}건, 실패: ${res.failureCount}건`
        );
        onCompleted?.({
          successCount: res.successCount,
          failureCount: res.failureCount,
        });
        // 성공 시 모달 닫기
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
      setResultMsg("업로드 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // reset state when opening modal
          setFileName("");
          setValidated(null);
          setResultMsg("");
          setOpen(true);
        }}
      >
        CSV 업로드
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>학생 일괄 업로드 확인</DialogTitle>
            <DialogDescription>
              파일: {fileName || "(파일명 없음)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <Button variant="secondary" size="sm" onClick={onDownloadSample}>
                샘플 CSV 다운로드
              </Button>
              <label className="inline-flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onPickFile}
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  파일 선택
                </Button>
              </label>
              <span className="text-xs text-muted-foreground truncate">
                {fileName
                  ? `선택된 파일: ${fileName}`
                  : "헤더가 포함된 CSV 파일을 선택하세요 (전화번호,이름,학교,학년)"}
              </span>
            </div>

            {!validated ? (
              reading ? (
                <div className="text-sm text-muted-foreground">
                  파일을 읽는 중입니다…
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  파일을 선택하면 검증 결과가 표시됩니다.
                </div>
              )
            ) : (
              <>
                <div className="text-sm">
                  <span className="font-medium">총 행</span>: {validated.length}{" "}
                  /<span className="font-medium ml-2">유효</span>: {validCount}{" "}
                  /<span className="font-medium ml-2">오류</span>:{" "}
                  {validated.length - validCount}
                </div>

                <div className="border rounded-md divide-y">
                  <div className="grid grid-cols-12 text-xs font-medium bg-muted/50 px-3 py-2">
                    <div className="col-span-1">행</div>
                    <div className="col-span-3">이름</div>
                    <div className="col-span-3">전화번호</div>
                    <div className="col-span-3">학교</div>
                    <div className="col-span-1">학년</div>
                    <div className="col-span-12 md:col-span-12 mt-2 md:mt-0">
                      오류
                    </div>
                  </div>
                  {validated.map((v) => (
                    <div
                      key={v.row.rowIndex}
                      className={`px-3 py-2 grid grid-cols-12 items-start text-xs ${v.valid ? "" : "bg-red-50"}`}
                    >
                      <div className="col-span-1">{v.row.rowIndex}</div>
                      <div className="col-span-3">{v.row.name}</div>
                      <div className="col-span-3">{v.row.phone}</div>
                      <div className="col-span-3">{v.row.school}</div>
                      <div className="col-span-1">{v.row.grade}</div>
                      <div className="col-span-12 md:col-span-12 text-red-600">
                        {v.errors.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>

                {resultMsg && <div className="text-sm mt-2">{resultMsg}</div>}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              닫기
            </Button>
            <Button
              onClick={onConfirm}
              disabled={
                submitting || !validated || hasErrors || validCount === 0
              }
            >
              {submitting ? "등록 중…" : "확인 후 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
