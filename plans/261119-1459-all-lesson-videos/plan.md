# Video cho toàn bộ bài học

Status: done (2026-11-19): 48/48 bài có video, đã kiểm tra trên trình duyệt

Goal: mọi bài trong `interactive-lessons/web` có video (21 bài đang `videoVersion: "pending"`), cộng 8 video sửa lời thoại sau đợt rà soát.

## Quy trình mỗi video
1. Agent tác giả (song song, tối đa 3): tạo `<slug>-video/` (theme `mono`), `scenes.py` theo bài web + study note, `build` (TTS trên Mac), `check` 0 lỗi, snapshot từng scene, sửa bố cục. Không render, không publish, không sửa `web/`.
2. Controller: `RENDER_HOST=user@render-host video-kit/render-remote.sh <slug>-video` (render trên máy Linux).
3. Controller: `pipeline.py <slug>-video publish`, nối `import timeline from "../timelines/<slug>.json"` + `scenes: timeline as Scene[]`, build web, kiểm tra trình duyệt.

## Thứ tự
| Đợt | Bài |
|---|---|
| 0 | Sửa lời thoại: index, security, kafka, ioc, redis, threadpool, collectors, java21 ✅ (đã publish) |
| 1 | tx-proxy, tx-pitfalls, propagation |
| 2 | isolation, tx-template, entity-lifecycle |
| 3 | n-plus-one, locking, microservices |
| 4 | sd-concepts, sd-practice, star-story |
| 5 | lab-collections, lab-streams, lab-concurrency |
| 6 | lab-order-setup, lab-tx-bugs, lab-jpa-perf |
| 7 | lab-jwt-cache-tests, core-diagrams, weekly-quiz |

## Acceptance
- `check` 0 lỗi, không có `warning:` beat vượt audio, contact sheet sạch (không chồng chữ, không cắt chữ).
- Số liệu và code trên video khớp bài web/study note đã rà soát; Java chạy thật trên JDK 21.
- Web: mỗi section phát đúng clip của scene, không khung đen, không lỗi console.

## Ràng buộc
Không commit; không sửa `~/Documents/remotion-video/VieNeu-TTS`; giữ `hyperframes@0.9.41`; không glow/overlay trang trí; không lưu mật khẩu máy render.
