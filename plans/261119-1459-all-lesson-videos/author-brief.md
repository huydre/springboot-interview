# Brief cho agent tác giả video

Repo: `/Users/hnam/orca/projects/springboot-interview` (macOS). Project video: `interactive-lessons/`. Chạy lệnh pipeline từ `interactive-lessons/`.

## Đọc trước
1. `.claude/skills/lesson-video/SKILL.md` (đọc hết: helpers, quy tắc layout, Verification).
2. `interactive-lessons/README.md` (phần pipeline).
3. Một project mẫu gần nhất: `interactive-lessons/index-video/` và `interactive-lessons/kafka-video/` (`scenes.py`, `video.json`, `meta.json`, `package.json`). Học cách viết beat, cách phiên âm thuật ngữ tiếng Anh cho giọng Việt (ví dụ "B crypt", "to map", "at least once").
4. Bài web `interactive-lessons/web/src/data/lessons/<slug>.ts` và study note được ghi trong comment đầu file (`docs/study-notes/...`). Đây là nguồn sự thật đã được rà soát.

## Việc cần làm
- Tạo `interactive-lessons/<slug>-video/`: copy `hyperframes.json`, `CLAUDE.md`, `AGENTS.md` từ `index-video/`; viết `package.json`, `meta.json` (đổi tên); `video.json` với `name` = phần cuối của `videoDir` trong bài web, `slug` = slug bài, `theme: "mono"`, `chapters` có key đúng bằng scene id, `overview_poster_at` nằm trong scene mở đầu.
- `scenes.py` (bắt đầu bằng `from motion import *`): scene `hook` + một scene cho MỖI section của bài với id ĐÚNG BẰNG giá trị `scene:` trong file bài + scene `outro`. Tổng khoảng 3 đến 4,5 phút. Comment đầu file ghi nguồn số liệu (như các project mẫu).
- Nội dung: dạy lại ý chính của từng section bằng hình động (cơ chế, luồng, so sánh, bẫy hay gặp khi phỏng vấn), không đọc lại nguyên văn bài. Mọi con số, output, mã lỗi phải lấy từ bài web/study note; không tự bịa số đo. Java hiển thị trên màn hình mà có output thì phải chạy thật trên JDK 21 (`java` có sẵn) và dùng output thật.
- Lời thoại tiếng Việt tự nhiên, câu ngắn, không dùng gạch ngang dài (—).
- Phong cách: theo các video `mono` hiện có. KHÔNG thêm glow, viền phát sáng, lưới/crosshair/nhãn trang trí đè lên nội dung (người dùng đã từ chối). Khung hình sạch.

## Kiểm tra (bắt buộc trước khi báo xong)
```bash
cd interactive-lessons
python3 video-kit/pipeline.py <slug>-video build      # TTS chạy trên Mac, mỗi câu 15-45 s; sửa mọi dòng "warning: ... beat ends ... but its audio is ..."
python3 video-kit/pipeline.py <slug>-video check      # phải 0 error(s)
python3 video-kit/pipeline.py <slug>-video snapshot <giây1>,<giây2>,...   # giữa mỗi beat có thêm/di chuyển phần tử, mọi scene
```
Đọc từng ảnh contact sheet trong `<slug>-video/.hyperframes/pipeline-snapshots/`, sửa chữ chồng nhau, chữ bị cắt, chữ đè lên mũi tên, phần tử ra ngoài khung; lặp tới khi sạch. Nếu `qc-voice` chạy được thì chạy và sửa câu bị gắn cờ (không bắt buộc nếu công cụ lỗi; ghi lại).

## Không được
- Không `render`, không `publish` (controller làm trên máy render riêng).
- Không sửa gì trong `interactive-lessons/web/`, `video-kit/`, hoặc project video khác. Chỉ đụng thư mục `<slug>-video/` của mình. Các agent khác đang chạy song song.
- Không commit git. Không sửa `~/Documents/remotion-video/VieNeu-TTS`. Không nâng `hyperframes@0.9.41`.

## Báo cáo cuối (ngắn)
```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Video: <slug>-video, <thời lượng>s, scenes: hook,...,outro
check: 0 errors (n warnings, loại gì)
Snapshots đã đọc: n ảnh; đã sửa: ...
Java đã chạy: ... (hoặc không có)
Concerns: ...
```
