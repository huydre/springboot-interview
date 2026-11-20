# Bổ sung cho brief video: khoá SQL cơ bản

Dùng cùng quy trình với `plans/261119-1459-all-lesson-videos/author-brief.md` (đọc trước). Phần dưới chỉ nêu điểm khác cho các video SQL.

## Nguồn nội dung
- Bài web `interactive-lessons/web/src/data/lessons/<slug>.ts` là nguồn duy nhất. **Scene id = `id` của từng section** (mỗi section một scene) cộng `hook` đầu và `outro` cuối. Không có study note.
- Mọi câu SQL và kết quả hiện trên màn hình phải **chạy thật** bằng `cd interactive-lessons/web && node scripts/run-sql.mjs "SQL"` (PostgreSQL 18, dữ liệu T24 giả lập). Chép đúng tên cột, số dòng, giá trị. Không rút gọn giá trị thật trừ khi ghi "..." rõ ràng.
- Video dạy lại ý chính của từng section bằng hình động, không đọc nguyên văn bài. Mỗi section: nêu ý, cho thấy câu SQL gõ ra (từng mệnh đề hiện dần), rồi bảng kết quả (3 đến 6 dòng đủ minh hoạ), rồi bẫy hay gặp. Một mệnh đề hay phần tử được nhấn bằng cách làm mờ các phần khác (`DIM`), không dùng hiệu ứng phát sáng.

## Cách vẽ SQL và bảng kết quả
- Câu SQL: dùng helper hiển thị code của `video-kit` (xem các project video Java để học cách `code()` và `win()` hoạt động); nếu bộ tô màu cú pháp là của Java thì tô thủ công các từ khoá SQL (`SELECT`, `FROM`, `WHERE`, ...) bằng các span màu có sẵn trong template.
- Bảng kết quả: dựng bằng các `box`/`el` xếp thành lưới hoặc một khối HTML `<table>` nhỏ trong `el(...)`, chữ đủ lớn để đọc (tối thiểu 26 px trên khung 1920x1080), tiêu đề cột in đậm, giá trị `NULL` in mờ nghiêng.
- Sơ đồ (ERD, JOIN, gom nhóm): vẽ bằng box và mũi tên `ARROW`; ERD dùng bản số `1` và `N` ghi rõ trên đường nối.

## Âm thanh và thuật ngữ
Giọng đọc tiếng Việt (VieNeu "Hải Đăng") hay đọc sai từ tiếng Anh. Đọc từ khoá SQL bằng cách phiên âm tự nhiên (ví dụ "sờ lếch" không nên; chọn cách viết lời thoại để qc-voice đạt) và cho phép lời thoại khác chữ trên màn hình, miễn nghĩa đúng. Với qc-voice: nếu một từ bị đọc sai, viết lại lời thoại (và phụ đề cho khớp) thay vì cố giữ nguyên.

## Chốt kiểm tra trước khi báo xong
- `overview_poster_at` trong `video.json` phải nằm **trong cảnh hook** (đối chiếu `timeline.json` sau lần `build` cuối: `start <= overview_poster_at < end` của cảnh đầu). Đặt sau khi chốt lời thoại.
- Thời lượng mục tiêu 3 đến 4,5 phút.
- Không render, không publish (controller làm).
