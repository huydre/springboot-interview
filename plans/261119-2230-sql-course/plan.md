# Khoá "SQL cơ bản" trên dữ liệu T24 Bank

Status: done (2026-11-20): 13/13 bài có nội dung và video, đã publish, 214/214 bài tập chấm đúng trong trình duyệt

Goal (người dùng): hoàn thành toàn bộ video của tất cả các bài. Khoá gồm 13 bài, mỗi bài có video.

## Hạ tầng (xong)
- Trang chọn khoá học (`?khoa=`), lộ trình riêng cho từng khoá.
- Bộ dữ liệu giả lập T24: `web/src/data/sql/t24-bank.sql` (11 bảng), sinh bằng `web/scripts/gen_t24_dataset.py`, kiểm tra bằng `check-t24-dataset.mjs`.
- Ô chạy SQL trong trình duyệt (PGlite, PostgreSQL 18): `SqlLab`, bài tập có `solution` và tự chấm; `verify` cho INSERT/UPDATE/DELETE.
- Công cụ: `scripts/run-sql.mjs` (chạy thử SQL), `scripts/verify-sql-lessons.mjs` (chạy mọi đáp án của bài).
- Bài mẫu: `sql-foundation`.

## Giai đoạn A: nội dung (agent viết song song, tối đa 4)
Hướng dẫn: `author-guide.md`.
| Đợt | Bài |
|---|---|
| 1 | sql-erd, sql-select, sql-filter, sql-aggregate |
| 2 | sql-join, sql-transform, sql-subquery, sql-set |
| 3 | sql-window, sql-dml, sql-optimize, sql-capstone |

## Giai đoạn B: video (agent tác giả, tối đa 3 song song; render trên máy từ xa)
13 video theo `plans/261119-1459-all-lesson-videos/author-brief.md`, scene id = section id, cộng `hook` và `outro`.

## Acceptance
- `verify-sql-lessons` all good, tsc/lint sạch, kiểm tra trình duyệt.
- 13 bài có video, đã publish, web build sạch.
