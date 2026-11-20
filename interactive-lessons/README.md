# Interactive lessons

Bài học tương tác cho phần Java Core: mỗi bài có một video giải thích (HyperFrames + VieNeu-TTS, giọng "Hải Đăng") và một trang trong web React.

| Bài | Video (thư mục) | Trang web |
|---|---|---|
| OOP: 4 tính chất | `oop-video/` | `?bai=oop` |
| equals, hashCode & String | `equals-video/` | `?bai=equals-hashcode` |
| Exception Handling | `exception-video/` | `?bai=exception` |
| HashMap Internals | `hashmap-video/` | `?bai=hashmap` |
| Collections Framework | `collections-video/` | `?bai=collections` |
| Lambda & Stream API | `lambda-video/` | `?bai=stream` |
| Collectors | `collectors-video/` | `?bai=collectors` |
| Optional & Parallel Stream | `optional-video/` | `?bai=optional` |
| Java 17 & 21 | `java21-video/` | `?bai=java21` |
| JVM Memory & GC | `jvm-video/` | `?bai=jvm` |
| Thread Basics | `thread-video/` | `?bai=thread` |
| ThreadPoolExecutor | `threadpool-video/` | `?bai=threadpool` |
| CompletableFuture | `cf-video/` | `?bai=completablefuture` |
| synchronized, volatile, Atomic & ConcurrentHashMap | `sync-video/` | `?bai=sync` |
| Deadlock, ThreadLocal & Virtual Threads | `deadlock-video/` | `?bai=deadlock` |
| Index & EXPLAIN | `index-video/` | `?bai=index` |
| SQL Queries & Pagination | `sql-video/` | `?bai=sql` |
| REST API Design | `rest-video/` | `?bai=rest` |
| Spring Security & JWT | `security-video/` | `?bai=security` |
| Redis Cache | `redis-video/` | `?bai=redis` |
| Kafka Basics | `kafka-video/` | `?bai=kafka` |
| Testing Spring Boot | `testing-video/` | `?bai=testing` |
| IoC & Dependency Injection | `ioc-video/` | `?bai=ioc` |
| Bean Scope & Lifecycle | `bean-video/` | `?bai=bean-lifecycle` |
| Spring Boot Auto-configuration | `autoconfig-video/` | `?bai=auto-config` |
| Spring MVC Request Flow | `mvc-video/` | `?bai=mvc-flow` |
| Exception Handling, Validation & AOP | `advice-video/` | `?bai=advice-aop` |
| Transaction Proxy Mechanism | chưa có video | `?bai=tx-proxy` |
| Khi @Transactional không hoạt động | chưa có video | `?bai=tx-pitfalls` |
| Propagation | chưa có video | `?bai=propagation` |
| Isolation & readOnly | chưa có video | `?bai=isolation` |
| TransactionTemplate & Events | chưa có video | `?bai=tx-template` |
| Entity Lifecycle & Persistence Context | chưa có video | `?bai=entity-lifecycle` |
| Lazy Loading & N+1 | chưa có video | `?bai=n-plus-one` |
| Locking, Batch & Mapping | chưa có video | `?bai=locking` |
| Sơ đồ cơ chế cốt lõi | chưa có video | `?bai=core-diagrams` |
| Bộ câu hỏi ôn tập hằng tuần | chưa có video | `?bai=weekly-quiz` |
| Design Patterns 1: Creational | chưa có video | `?bai=patterns-creational` |
| Design Patterns 2: Structural | chưa có video | `?bai=patterns-structural` |
| Design Patterns 3: Behavioral (1) | chưa có video | `?bai=patterns-behavioral-1` |
| Design Patterns 4: Behavioral (2) | chưa có video | `?bai=patterns-behavioral-2` |
| LLD 1: Khung trả lời, Parking Lot, Rate Limiter | chưa có video | `?bai=lld-1` |
| LLD 2: Movie Ticket, Elevator, Connect Four | chưa có video | `?bai=lld-2` |
| Date-Time API và múi giờ | chưa có video | `?bai=java-time` |
| ClassLoader, JIT, AQS, StampedLock | chưa có video | `?bai=java-runtime` |
| I/O, Charset và Serialization | chưa có video | `?bai=java-io` |
| Redis: cấu trúc dữ liệu | chưa có video | `?bai=redis-structures` |
| Redis: khoá phân tán, rate limit, eviction | chưa có video | `?bai=redis-patterns` |
| OAuth2, OIDC, PKCE và kiểm tra JWT | chưa có video | `?bai=oauth2-oidc` |
| Lỗ hổng web: SQLi, XSS, IDOR, SSRF | chưa có video | `?bai=web-vulns` |
| API: ETag, webhook và OpenAPI | chưa có video | `?bai=api-reliability` |
| Schema, ràng buộc, ACID và connection pool | chưa có video | `?bai=db-design` |
| System Design Concepts | chưa có video | `?bai=sd-concepts` |
| System Design Practice | chưa có video | `?bai=sd-practice` |
| Project Story & STAR | chưa có video | `?bai=star-story` |
| Lab 1: Collections | chưa có video | `?bai=lab-collections` |
| Lab 2: Stream Queries | chưa có video | `?bai=lab-streams` |
| Lab 3: Concurrency | chưa có video | `?bai=lab-concurrency` |
| Lab 4: order-service Setup | chưa có video | `?bai=lab-order-setup` |
| Lab 5: Transaction Bugs | chưa có video | `?bai=lab-tx-bugs` |
| Lab 6: N+1, Locking & Index | chưa có video | `?bai=lab-jpa-perf` |
| Lab 7: JWT, Cache & Tests | chưa có video | `?bai=lab-jwt-cache-tests` |

## Quy trình một lệnh

Chạy trong `interactive-lessons/`:

```bash
python3 video-kit/pipeline.py setup                  # 1 lần: cài VieNeu-TTS vào .tts-env/ (dùng chung)
python3 video-kit/pipeline.py equals-video all       # build -> check -> render -> publish sang web/
```

| Lệnh `<project> ...` | Việc |
|---|---|
| `build` | Đọc lời thoại (cache theo từng câu trong `<project>/.tts/`), sinh `index.html`, `assets/voice.wav`, `timeline.json`. Dừng nếu có id trùng |
| `check` | `hyperframes check`; dừng nếu có lỗi |
| `snapshot 10,30,60` | Chụp khung hình, ảnh ở `<project>/.hyperframes/pipeline-snapshots/` |
| `render` | Xuất `<project>/renders/<name>.mp4` |
| `render-remote.sh` | `RENDER_HOST=user@host video-kit/render-remote.sh <project> ...`: chỉ bước render chạy trên máy Linux khác (cần node, ffmpeg trong `~/.local/bin`, Chrome), mp4 được chép về `<project>/renders/`; build và publish vẫn chạy ở máy này. Xác thực bằng `RENDER_KEY=<file key>`, SSH key mặc định hoặc biến `SSHPASS`; mỗi bước tự thử lại 3 lần |
| `remote_tts.py` | Đặt `VIENEU_PYTHON=video-kit/remote_tts.py` (cùng `RENDER_HOST`, `RENDER_KEY`) khi chạy `build` để đọc TTS trên máy render (`~/lesson-render/.tts-env`, cùng bản vieneu); WAV chép về `.tts/` như bình thường |
| `publish` | Cắt mỗi cảnh thành một clip riêng `web/public/videos/<name>/<scene>.mp4` (thanh tua của từng phần đúng thời lượng phần đó), copy timeline, tạo poster, đặt `videoVersion` theo hash, build + lint web |
| `qc-voice` | Whisper (chạy cục bộ) nghe lại từng câu thoại, đánh dấu câu lệch kịch bản (< 0.85) |
| `revoice` | Đọc lại các câu bị đánh dấu (chọn bản tốt nhất trong 4 lần), dựng lại, kiểm tra lại |
| `qc-frames` | Chụp khung hình ở cuối mỗi câu thoại để soát hình |
| `qc-render` | Âm lượng (LUFS), đỉnh âm, khoảng lặng bất thường, thời lượng render và từng clip |

Sau `publish`, khởi động lại `vite preview` nếu đang chạy (nó giữ kích thước file cũ).

## Cấu trúc

- `video-kit/`: phần dùng chung cho mọi video.
  - `motion.py`: hành động chuyển động và hàm dựng markup.
  - `build.py`: sinh GSAP, ghép giọng và trộn hiệu ứng âm thanh (`assets/mix.wav`).
  - `sfx.py`: hiệu ứng âm thanh tổng hợp bằng code (whoosh, pop, tick, boom, shine, buzz, sweep), không cần file ngoài.
  - `template.html`: phong cách hình ảnh.
  - `pipeline.py`, `vieneu_synth.py`.
- `<topic>-video/`: một video.
  - `scenes.py`: các cảnh và lời thoại.
  - `video.json`: tên file mp4, slug bài web, giây lấy ảnh bìa, tên chương.
- `web/`: React + Vite. Chạy `npm install && npm run dev`.
  - Bài học: `src/data/lessons/<slug>.ts`, đăng ký trong `src/data/course.ts`.
  - Widget: `src/widgets/`.

Skill Claude Code cho quy trình này: `.claude/skills/lesson-video/SKILL.md` (ở gốc repo).
