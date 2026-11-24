"""Docker and Kubernetes for Spring developers (1920x1080 world coordinates).

Every number comes from the lesson (web/src/data/lessons/docker-k8s.ts), run on Docker Desktop 29.2.1 (8 CPUs) with
order-service (Spring Boot 3.5.16, Java 21):
layer cache: COPY . . first -> first build mvn step 154.4 s, every code edit re-downloads; pom first -> go-offline 295 s
the first time, CACHED after a code edit, rebuild 31.6 s;
image size: single stage 1.24 GB disk / 427 MB compressed, multi-stage JRE alpine 431 MB / 140 MB;
layered jar: fat jar 71 MB, dependencies 68 MB, loader 604 KB, snapshot empty, application 316 KB; after a code edit only
the application layer is new (410 kB);
JVM: -m 512m -> MaxHeapSize 128 MB (25%), with MaxRAMPercentage=75 -> 384 MB; no limit 1960 MB; --cpus=1.5 -> 2 processors,
no limit 8; -m 512m picks SerialGC, --cpus=2 -m 2g picks G1;
OOM: -m 256m, 75% -> OutOfMemoryError exit=1; -Xmx1g -> allocated MB=100 then exit=137 OOMKilled;
probes: startup 24 x 5 s = 120 s; graceful: 8 s request, SIGTERM 2 s later -> HTTP 200 after 8.29 s, exit 143;
immediate -> HTTP 000 after 2.18 s; preStop sleep 10 + 30 = 40 < terminationGracePeriodSeconds 45.
The Kubernetes YAML was written for the lesson and not applied to a cluster. Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def when(spoken, phrase):
    """Seconds into the narration (at ~14.5 chars/s) where `phrase` starts; fit_to_audio rescales to the real take."""
    return round(spoken.index(phrase) / 14.5, 2)


def B(spoken, caption, fn):
    """A beat whose actions are built from the sentence, so reveals land on the words they illustrate."""
    return (spoken, caption, fn(lambda p: when(spoken, p)))


def S(*names):
    return ", ".join("#" + n for n in names)


def AR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


def AW(id_, d, dur=0.45):
    """Draw a plain arrow and pop its head (no travelling light)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def line(id_, pts):
    return arrow(id_, pts, "muted")


def row(label, text):
    return f'<span class="mono big" style="font-size:40px">{label}</span><span style="font-size:34px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=32):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=32):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


def titled(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=40):
    inner = (f'<span class="mono" style="font-size:26px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700;text-align:center">{esc(main)}</span>'
    inner += f'<span class="mono" style="font-size:26px;color:var(--muted);text-align:center">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=32):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=40, ds=28):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def bar(id_, x, y, w, h, text, tone="cyan", size=30):
    """Left-aligned horizontal bar whose width is the quantity."""
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:700;width:100%;padding-left:22px">{esc(text)}</span>', tone)


def take(p, main, sub):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(main), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(sub), "take-sm r"))


TOPICS = [("Image gọn", "layer, cache, multi-stage"), ("JVM trong container", "heap, CPU, hai loại OOM"),
          ("Kubernetes", "Pod, Deployment, Service"), ("Deploy không 503", "probe, graceful, preStop")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Docker và Kubernetes · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Container 512 MB, heap bao nhiêu?"), "h1 r", "font-size:96px"),
        tag("hk-o0", 90, 420, 400, 120, "512 MB", "cyan", 38),
        tag("hk-o1", 530, 420, 400, 120, "128 MB", "cyan", 38),
        tag("hk-o2", 970, 420, 400, 120, "25% RAM máy", "cyan", 34),
        tag("hk-o3", 1410, 420, 400, 120, "không giới hạn", "cyan", 34),
        note("hk-n", 530, 590, 1300, "MaxHeapSize = 134217728\nba phần tư bộ nhớ bỏ phí", "green", 34),
        *[card(f"hk-c{i}", 90 + i * 440, 400, 410, 300, t, d, "cyan", 36, 28) for i, (t, d) in enumerate(TOPICS)],
        take("hk", "Đóng gói, chạy, tắt cho đúng", "mọi con số trong video đều đã chạy thật"),
    ]), beats=[
        B("Câu hỏi mở màn: container Spring Boot chạy với giới hạn năm trăm mười hai megabyte, không đặt cờ heap nào. Heap tối đa là bao nhiêu?",
          "Container 512 MB, không đặt cờ heap: heap tối đa bao nhiêu?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.2, 0.05),
                     IN("#hk-o0", "up", w("Heap tối đa")), IN("#hk-o1", "up", w("Heap tối đa") + 0.2),
                     IN("#hk-o2", "up", w("Heap tối đa") + 0.4), IN("#hk-o3", "up", w("Heap tối đa") + 0.6)]),
        B("Đáp án là một trăm hai mươi tám megabyte, chỉ hai mươi lăm phần trăm giới hạn. Ba phần tư bộ nhớ bị bỏ phí.",
          "128 MB, tức 25%. Ba phần tư bị bỏ phí.",
          lambda w: [DIM(S("hk-o0", "hk-o2", "hk-o3"), 0.3, 0.2), PULSE("#hk-o1", 0.7),
                     IN("#hk-n", "up", w("Ba phần tư"))]),
        B("Video này đi qua bốn chặng: image gọn, JVM trong container, Kubernetes, và deploy không lỗi năm lẻ ba.",
          "Image gọn · JVM trong container · Kubernetes · deploy không 503.",
          lambda w: [OUT(S("hk-o0", "hk-o1", "hk-o2", "hk-o3", "hk-n"), "blur", 0, 0.5),
                     IN("#hk-c0", "pop", w("image gọn")), IN("#hk-c1", "pop", w("JVM trong")),
                     IN("#hk-c2", "pop", w("Kubernetes")), IN("#hk-c3", "pop", w("và deploy"))]),
        B("Mọi con số đều đã chạy thật. Đóng gói, chạy, và tắt cho đúng.",
          "Đóng gói, chạy, tắt cho đúng.",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-c0", "hk-c1", "hk-c2", "hk-c3"), 0, 0.07),
                     IN("#hk-t2", "blur", 0.3), TYPE("#hk-t1", w("Đóng gói"), 0.04)]),
    ]),
    # ------------------------------------------------------------ container-image
    dict(id="container-image", world=(1920, 1080), hud="", cam="".join([
        head("ci", "Phần 1 · Container và image", "Container khác máy ảo ở đâu?"),
        tag("ci-vh", 110, 260, 780, 90, "Máy ảo (VM)", "violet", 36),
        tag("ci-v1", 110, 370, 780, 84, "App", "cyan", 30),
        tag("ci-v2", 110, 470, 780, 84, "Hệ điều hành riêng", "cyan", 30),
        tag("ci-v3", 110, 570, 780, 84, "Kernel riêng", "cyan", 30),
        tag("ci-v4", 110, 670, 780, 84, "Hypervisor", "cyan", 30),
        note("ci-vn", 110, 780, 780, "cô lập mạnh · nặng · khởi động chục giây tới phút", "red", 28),
        tag("ci-ch", 1030, 260, 780, 90, "Container", "violet", 36),
        tag("ci-c1", 1030, 370, 780, 84, "App = một process", "cyan", 30),
        tag("ci-c2", 1030, 470, 780, 84, "namespaces + cgroups", "cyan", 30),
        tag("ci-c3", 1030, 570, 780, 184, "Kernel chung với máy chủ", "amber", 32),
        note("ci-cn", 1030, 780, 780, "nhẹ · khởi động gần bằng thời gian chạy app", "green", 28),
        bigerr("ci-root", 1030, 780, 780, "Chung kernel: cô lập yếu hơn VM<br>→ đừng chạy container bằng root", 28),
        *[tag(f"ci-l{i}", 260, 260 + i * 110, 900, 90, t, "cyan", 30)
          for i, t in enumerate(["FROM maven:3.9-eclipse-temurin-21", "COPY pom.xml .", "RUN mvn dependency:go-offline",
                                 "COPY src ./src", "RUN mvn package"])],
        *[tag(f"ci-s{i}", 1220, 260 + i * 110, 440, 90, "CACHED", "green", 30) for i in range(3)],
        tag("ci-s3", 1220, 590, 440, 90, "file đổi", "amber", 30),
        tag("ci-s4", 1220, 700, 440, 90, "build lại", "red", 30),
        cbox("ci-bad", 90, 250, 860, "COPY . . trước",
             "FROM maven:3.9-eclipse-temurin-21\n"
             "WORKDIR /app\n"
             "COPY . .\n"
             "RUN mvn -q -DskipTests package", "violet", 26),
        cbox("ci-good", 970, 250, 860, "pom.xml trước, code sau",
             "FROM maven:3.9-eclipse-temurin-21 AS build\n"
             "WORKDIR /src\n"
             "COPY pom.xml .\n"
             "RUN mvn -q dependency:go-offline\n"
             "COPY src ./src\n"
             "RUN mvn -q -DskipTests package", "violet", 26),
        bigerr("ci-be", 90, 600, 860, "✕ Sửa một dòng code: tải lại mọi dependency<br>(lần đầu bước này mất 154,4 s)", 28),
        note("ci-ge", 970, 640, 860, "✓ go-offline CACHED (lần đầu 295 s)\n✓ build lại chỉ 31,6 s", "green", 30),
        take("ci", "Ít đổi ở trên, hay đổi ở dưới", "một file đổi → COPY chứa nó đổi → mọi layer dưới build lại"),
    ]), beats=[
        B("Câu mở màn quen thuộc: container khác máy ảo ở đâu? Máy ảo giả lập cả một máy, mỗi máy có kernel và hệ điều hành riêng. Cô lập mạnh, nhưng nặng, khởi động mất chục giây tới vài phút.",
          "VM: kernel và hệ điều hành riêng. Cô lập mạnh, nhưng nặng.",
          lambda w: [IN("#ci-eye", "blur"), TYPE("#ci-q", 0.2, 0.05), *shrink("ci", w("Máy ảo giả")),
                     IN("#ci-vh", "up", w("Máy ảo giả") + 0.4), IN("#ci-v4", "up", w("giả lập")), IN("#ci-v3", "up", w("kernel")),
                     IN("#ci-v2", "up", w("hệ điều hành")), IN("#ci-v1", "up", w("hệ điều hành") + 0.4), IN("#ci-vn", "up", w("Cô lập mạnh"))]),
        B("Container chỉ là một process trên máy chủ, dùng chung kernel. Linux cô lập nó bằng namespaces, và giới hạn CPU, RAM bằng cgroups. Nên container nhẹ, khởi động gần bằng thời gian chạy app.",
          "Container: một process, chung kernel, namespaces + cgroups.",
          lambda w: [IN("#ci-ch", "up", 0.2), IN("#ci-c1", "up", w("một process")), IN("#ci-c3", "up", w("dùng chung kernel")),
                     IN("#ci-c2", "up", w("namespaces")), PULSE("#ci-c2", w("cgroups")), IN("#ci-cn", "up", w("Nên container"))]),
        B("Đổi lại, chung kernel nên cô lập yếu hơn máy ảo. Đó là lý do không nên chạy container bằng root.",
          "Chung kernel: cô lập yếu hơn. Đừng chạy bằng root.",
          lambda w: [PULSE("#ci-c3", 0.2), OUT("#ci-cn", "fade", 0.3, 0.3), IN("#ci-root", "up", 0.5), SHAKE("#ci-root", w("Đó là"))]),
        B("Image là bản đóng gói chỉ đọc, xếp từ nhiều layer. Mỗi lệnh RUN, COPY, ADD tạo một layer. Khi build lại, Docker đi từ trên xuống: lệnh nào không đổi thì dùng lại cache.",
          "Mỗi RUN, COPY, ADD là một layer. Không đổi thì dùng lại cache.",
          lambda w: [OUT(S("ci-vh", "ci-v1", "ci-v2", "ci-v3", "ci-v4", "ci-vn", "ci-ch", "ci-c1", "ci-c2", "ci-c3", "ci-root"), "blur", 0, 0.5),
                     IN("#ci-l0, #ci-l1, #ci-l2, #ci-l3, #ci-l4", "up", w("xếp từ"), 0.5, 0.15),
                     IN("#ci-s0", "pop", w("Khi build lại") + 1.0), IN("#ci-s1", "pop", w("lệnh nào")), IN("#ci-s2", "pop", w("dùng lại cache"))]),
        B("Gặp lệnh đầu tiên có thay đổi, thì từ đó trở xuống build lại hết.",
          "Từ lệnh đầu tiên có thay đổi trở xuống: build lại hết.",
          lambda w: [IN("#ci-s3", "pop", 0.2), PULSE("#ci-l3", 0.3), IN("#ci-s4", "pop", w("từ đó")), PULSE("#ci-s4", w("build lại") + 0.4)]),
        B("Nên nếu COPY toàn bộ thư mục trước rồi mới chạy maven package, sửa một dòng code là tải lại mọi dependency. Lần build đầu, bước này mất một trăm năm mươi tư giây.",
          "COPY . . trước: sửa một dòng là tải lại mọi dependency.",
          lambda w: [OUT(S("ci-l0", "ci-l1", "ci-l2", "ci-l3", "ci-l4", "ci-s0", "ci-s1", "ci-s2", "ci-s3", "ci-s4"), "blur", 0, 0.5),
                     IN("#ci-bad", "blur", 0.6, 0.6), PULSE("#ci-bad", w("sửa một dòng")), IN("#ci-be", "up", w("sửa một dòng") + 0.5)]),
        B("Tách ra: COPY file pom và tải dependency trước, COPY code sau. Đã chạy: sửa code thì bước tải dependency vẫn CACHED, build lại chỉ ba mươi mốt phẩy sáu giây.",
          "pom trước, code sau: dependency CACHED, build lại 31,6 s.",
          lambda w: [IN("#ci-good", "blur", 0.2, 0.6), PULSE("#ci-good", w("COPY code")), IN("#ci-ge", "up", w("Đã chạy"))]),
        B("Nhớ chuỗi nhân quả: một file đổi, lệnh COPY chứa nó đổi, mọi layer bên dưới build lại. Thứ ít đổi đặt trên, thứ hay đổi đặt dưới.",
          "Ít đổi ở trên, hay đổi ở dưới.",
          lambda w: [DIM(S("ci-eye", "ci-q", "ci-bad", "ci-good", "ci-be", "ci-ge"), 0, 0.07),
                     IN("#ci-t2", "blur", 0.3), TYPE("#ci-t1", w("Thứ ít đổi"), 0.04)]),
    ]),
    # ------------------------------------------------------------ dockerfile-spring
    dict(id="dockerfile-spring", world=(1920, 1080), hud="", cam="".join([
        head("df", "Phần 2 · Dockerfile cho Spring Boot", "Bốn việc của một Dockerfile tốt"),
        card("df-c0", 90, 300, 410, 320, "Multi-stage", "build bằng JDK, chạy bằng JRE", "cyan", 38, 28),
        card("df-c1", 530, 300, 410, 320, "Layered jar", "4 layer theo tần suất đổi", "cyan", 38, 28),
        card("df-c2", 970, 300, 410, 320, "Base nhỏ", "eclipse-temurin:21-jre-alpine", "cyan", 38, 26),
        card("df-c3", 1410, 300, 410, 320, "Non-root", "USER app", "green", 38, 28),
        titled("df-b", 90, 270, 560, 170, "Stage build", "JDK + Maven", "", "violet", 40),
        tag("df-cp", 740, 310, 440, 90, "COPY --from=build", "amber", 30),
        titled("df-r", 1270, 270, 560, 170, "Stage chạy", "JRE alpine", "user app", "green", 40),
        note("df-lbl", 90, 485, 300, "Bỏ lại:", "red", 30),
        *[tag(f"df-x{i}", 300 + i * 290, 470, 260, 76, t, "red", 28) for i, t in enumerate(["Maven", "JDK", "mã nguồn", ".m2"])],
        bar("df-s1", 90, 600, 1300, 96, "Một stage, JDK + Maven: 1,24 GB", "red", 30),
        bar("df-s2", 90, 716, 640, 96, "Multi-stage: 431 MB", "green", 30),
        note("df-z", 780, 724, 1050, "Bản nén lên registry:\n427 MB → 140 MB", "green", 30),
        rule("df-fat", "Fat jar 71 MB, code của bạn chưa tới 1 MB", "Copy nguyên jar: sửa một dòng cũng đẩy lại cả 71 MB"),
        *[tag(f"df-l{i}", 90, 270 + i * 110, 1000, 90, t, "cyan", 30)
          for i, t in enumerate(["dependencies · 68 MB", "spring-boot-loader · 604 KB", "snapshot-dependencies · rỗng", "application · 316 KB"])],
        *[tag(f"df-k{i}", 1140, 270 + i * 110, 680, 90, "CACHED", "green", 30) for i in range(3)],
        tag("df-k3", 1140, 600, 680, 90, "tạo mới · 410 kB", "amber", 30),
        note("df-cmd", 90, 730, 1740, "java -Djarmode=tools -jar app.jar extract --layers --launcher", "", 32),
        note("df-cmd2", 90, 790, 1740, "Spring Boot 3.3 trở lên · mỗi layer là một lệnh COPY riêng", "", 28),
        take("df", "Deploy bản sửa code chỉ vài trăm KB", "multi-stage · layered jar · JRE nhỏ · user thường"),
        wires(line("df-a1", [(655, 355), (735, 355)]), line("df-a2", [(1185, 355), (1265, 355)])),
    ]), beats=[
        B("Phần một đã sửa thứ tự lệnh, nhưng image vẫn chứa JDK, Maven và mã nguồn. Dockerfile tốt cho Spring Boot làm bốn việc: multi stage build, layered jar, base image nhỏ, và user không phải root.",
          "Bốn việc: multi-stage, layered jar, base nhỏ, non-root.",
          lambda w: [IN("#df-eye", "blur"), TYPE("#df-q", 0.2, 0.05), *shrink("df", w("Dockerfile tốt")),
                     IN("#df-c0", "pop", w("multi stage")), IN("#df-c1", "pop", w("layered jar")),
                     IN("#df-c2", "pop", w("base image")), IN("#df-c3", "pop", w("và user"))]),
        B("Multi stage: stage đầu dùng JDK và Maven để build. Stage hai bắt đầu lại từ image chỉ có JRE, và chỉ COPY from build đúng phần cần chạy. Maven, JDK, mã nguồn và thư mục m2 bị bỏ lại.",
          "Build bằng JDK + Maven, chạy bằng JRE. Công cụ build bị bỏ lại.",
          lambda w: [OUT(S("df-c0", "df-c1", "df-c2", "df-c3"), "blur", 0, 0.5),
                     IN("#df-b", "up", w("stage đầu")), *AW("df-a1", w("COPY from")), IN("#df-cp", "pop", w("COPY from")),
                     *AW("df-a2", w("COPY from") + 0.6), IN("#df-r", "up", w("Stage hai")),
                     IN("#df-lbl", "up", w("Maven, JDK, mã")), IN("#df-x0, #df-x1, #df-x2, #df-x3", "up", w("Maven, JDK, mã") + 0.2, 0.5, 0.2)]),
        B("Đã đo: image một stage nặng một phẩy hai bốn gigabyte trên đĩa. Multi stage với JRE alpine còn bốn trăm ba mươi mốt megabyte, nhỏ hơn khoảng ba lần. Bản nén đẩy lên registry từ bốn trăm hai mươi bảy còn một trăm bốn mươi megabyte.",
          "1,24 GB → 431 MB trên đĩa. Bản nén 427 → 140 MB.",
          lambda w: [IN("#df-s1", "left", w("image một stage")), IN("#df-s2", "left", w("Multi stage với")), PULSE("#df-s2", w("nhỏ hơn")),
                     IN("#df-z", "up", w("Bản nén"))]),
        B("Tiếp theo là layered jar. Jar của Spring Boot nặng bảy mươi mốt megabyte, nhưng code của bạn chưa tới một megabyte. Copy nguyên jar thành một layer, thì sửa một dòng cũng phải đẩy lại cả bảy mươi mốt megabyte.",
          "Fat jar 71 MB, code chưa tới 1 MB.",
          lambda w: [OUT(S("df-b", "df-cp", "df-r", "df-lbl", "df-x0", "df-x1", "df-x2", "df-x3", "df-s1", "df-s2", "df-z") + ", " + AR("df-a1", "df-a2"), "blur", 0, 0.5),
                     IN("#df-fat", "up", w("Jar của")), PULSE("#df-fat", w("Copy nguyên"))]),
        B("Spring Boot chia jar thành bốn layer, từ ít đổi tới hay đổi: dependencies sáu mươi tám megabyte, spring boot loader, snapshot dependencies, và application chỉ ba trăm mười sáu kilobyte. Lệnh tách là java jar mode tools, extract layers launcher.",
          "4 layer: dependencies · loader · snapshot · application.",
          lambda w: [OUT("#df-fat", "blur", 0, 0.4), IN("#df-l0", "up", w("dependencies")), IN("#df-l1", "up", w("spring boot loader")),
                     IN("#df-l2", "up", w("snapshot")), IN("#df-l3", "up", w("và application")),
                     IN("#df-cmd", "up", w("Lệnh tách")), IN("#df-cmd2", "up", w("Lệnh tách") + 0.8)]),
        B("Đã build lại sau khi sửa một file Java: ba layer đầu CACHED, chỉ layer application được tạo mới, bốn trăm mười kilobyte.",
          "Sửa code: chỉ layer application tạo mới, 410 kB.",
          lambda w: [IN("#df-k0, #df-k1, #df-k2", "pop", w("ba layer"), 0.5, 0.2), IN("#df-k3", "pop", w("chỉ layer")), PULSE("#df-l3", w("chỉ layer") + 0.4)]),
        B("Vậy mỗi bản deploy chỉ đẩy vài trăm kilobyte. Trong phỏng vấn, nêu đủ bốn việc: multi stage, layered jar, JRE nhỏ, và user thường.",
          "Mỗi bản deploy chỉ đẩy vài trăm KB.",
          lambda w: [DIM(S("df-eye", "df-q", "df-l0", "df-l1", "df-l2", "df-l3", "df-k0", "df-k1", "df-k2", "df-k3", "df-cmd", "df-cmd2"), 0, 0.07),
                     TYPE("#df-t1", 0.3, 0.04), IN("#df-t2", "blur", w("Trong phỏng vấn"))]),
    ]),
    # ------------------------------------------------------------ jvm-in-container
    dict(id="jvm-in-container", world=(1920, 1080), hud="", cam="".join([
        head("jv", "Phần 3 · JVM trong container", "Heap bao nhiêu khi bị giới hạn?"),
        rule("jv-rule", "JVM đọc giới hạn RAM, CPU từ cgroups", "UseContainerSupport bật sẵn từ Java 10 · heap mặc định 25%"),
        tag("jv-k0", 90, 280, 400, 100, "-m 512m", "violet", 32),
        tag("jv-k1", 90, 410, 400, 100, "mặc định 25%", "cyan", 30),
        tag("jv-k2", 90, 540, 400, 100, "MaxRAMPercentage=75", "cyan", 26),
        bar("jv-b0", 530, 280, 1200, 100, "giới hạn container · 512 MB", "violet", 30),
        bar("jv-b1", 530, 410, 300, 100, "128 MB", "red", 30),
        note("jv-w", 870, 425, 900, "ba phần tư bỏ phí", "red", 32),
        bar("jv-b2", 530, 540, 900, 100, "heap 384 MB", "green", 30),
        tag("jv-rest", 1450, 540, 280, 100, "ngoài heap", "amber", 28),
        *[tag(f"jv-n{i}", 90 + i * 350, 700, 320, 90, t, "amber", 28)
          for i, t in enumerate(["metaspace", "thread stack", "code cache", "direct buffer", "bộ nhớ GC"])],
        note("jv-x", 90, 820, 1740, "Dùng MaxRAMPercentage thay vì -Xmx cố định: đổi giới hạn là heap tự đổi theo", "green", 30),
        titled("jv-p1", 90, 270, 820, 160, "--cpus=1.5", "availableProcessors() = 2", "", "cyan", 36),
        titled("jv-p2", 1010, 270, 820, 160, "không giới hạn", "availableProcessors() = 8", "", "cyan", 36),
        titled("jv-g1", 90, 470, 820, 160, "-m 512m", "SerialGC", "một thread GC", "amber", 40),
        titled("jv-g2", 1010, 470, 820, 160, "--cpus=2 -m 2g", "G1", "", "green", 40),
        note("jv-fj", 90, 680, 1740, "Cũng quyết định ForkJoinPool chung: parallelStream(), supplyAsync() không truyền executor", "", 30),
        card("jv-e", 90, 270, 820, 330, "OutOfMemoryError", "JVM ném khi heap chạm trần · có stack trace · process có thể còn sống", "amber", 40, 28),
        card("jv-o", 1010, 270, 820, 330, "OOMKilled", "kernel SIGKILL vì cả process vượt giới hạn cgroup · không log, không heap dump", "red", 40, 28),
        note("jv-er", 90, 640, 820, "-m 256m, 75%: heap 185 MB\njava.lang.OutOfMemoryError\nexit=1 · OOMKilled=false", "", 30),
        note("jv-or", 1010, 640, 820, "-m 256m, -Xmx1g\nallocated MB=100 rồi im lặng\nexit=137 · OOMKilled=true", "red", 30),
        take("jv", "Stack trace là JVM, 137 là kernel", "137 = 128 + 9 (SIGKILL) · heap theo phần trăm, chừa chỗ ngoài heap"),
    ]), beats=[
        B("Image đã gọn, giờ chạy nó với giới hạn tài nguyên. Từ Java mười, JVM đọc giới hạn RAM và CPU từ cgroups. Nhưng heap tối đa mặc định chỉ hai mươi lăm phần trăm.",
          "JVM đọc giới hạn từ cgroups. Heap mặc định: 25%.",
          lambda w: [IN("#jv-eye", "blur"), TYPE("#jv-q", 0.2, 0.05), IN("#jv-rule", "up", w("Từ Java")), PULSE("#jv-rule", w("Nhưng heap"))]),
        B("Đã chạy trên Java hai mốt. Container năm trăm mười hai megabyte, không đặt cờ gì: heap tối đa một trăm hai mươi tám megabyte, ba phần tư còn lại bỏ phí. Đặt Max RAM Percentage bằng bảy mươi lăm: heap ba trăm tám mươi tư megabyte.",
          "-m 512m: heap 128 MB. MaxRAMPercentage=75: 384 MB.",
          lambda w: [OUT("#jv-rule", "blur", 0, 0.4), *shrink("jv", 0), IN("#jv-k0", "up", w("Container")), IN("#jv-b0", "left", w("Container") + 0.2),
                     IN("#jv-k1", "up", w("không đặt")), IN("#jv-b1", "left", w("heap tối đa")), IN("#jv-w", "up", w("ba phần tư")),
                     IN("#jv-k2", "up", w("Đặt Max")), IN("#jv-b2", "left", w("heap ba trăm"))]),
        B("Vì sao không phải một trăm phần trăm? Vì JVM còn dùng bộ nhớ ngoài heap: metaspace, thread stack, code cache, direct buffer, và chính GC. Đặt heap bằng giới hạn thì tổng vượt, container bị kill.",
          "Ngoài heap: metaspace, thread stack, code cache, direct buffer, GC.",
          lambda w: [IN("#jv-rest", "pop", w("ngoài heap")), IN("#jv-n0", "up", w("metaspace")), IN("#jv-n1", "up", w("thread stack")),
                     IN("#jv-n2", "up", w("code cache")), IN("#jv-n3", "up", w("direct buffer")), IN("#jv-n4", "up", w("và chính GC"))]),
        B("Nên dùng phần trăm thay vì Xmx cố định: đổi giới hạn trong YAML, heap tự đổi theo, không phải build lại image.",
          "MaxRAMPercentage thay vì -Xmx cố định.",
          lambda w: [IN("#jv-x", "up", 0.3)]),
        B("CPU cũng vậy. Giới hạn một phẩy năm CPU thì available processors trả về hai, không giới hạn thì tám. Con số này quyết định chọn GC: với năm trăm mười hai megabyte, JVM chọn Serial GC, một thread. Với hai CPU và hai gigabyte thì chọn G1.",
          "--cpus=1.5 → 2 processor. 512 MB → SerialGC, 2 CPU 2 GB → G1.",
          lambda w: [OUT(S("jv-k0", "jv-k1", "jv-k2", "jv-b0", "jv-b1", "jv-b2", "jv-w", "jv-rest", "jv-n0", "jv-n1", "jv-n2", "jv-n3", "jv-n4", "jv-x"), "blur", 0, 0.5),
                     IN("#jv-p1", "up", w("Giới hạn một")), IN("#jv-p2", "up", w("không giới hạn")),
                     IN("#jv-g1", "up", w("với năm trăm")), IN("#jv-g2", "up", w("Với hai CPU"))]),
        B("Nó cũng quyết định kích thước ForkJoinPool chung.",
          "Và kích thước ForkJoinPool chung.",
          lambda w: [IN("#jv-fj", "up", 0.3)]),
        B("OOM Killed khác Out Of Memory Error thế nào? Out Of Memory Error do JVM ném khi heap chạm trần, có stack trace. OOM Killed là kernel giết cả process bằng SIGKILL vì vượt giới hạn, không để lại log.",
          "OutOfMemoryError: JVM ném. OOMKilled: kernel SIGKILL.",
          lambda w: [OUT(S("jv-p1", "jv-p2", "jv-g1", "jv-g2", "jv-fj"), "blur", 0, 0.5),
                     IN("#jv-e", "up", w("Out Of Memory Error do")), IN("#jv-o", "up", w("OOM Killed là"))]),
        B("Đã chạy trong container hai trăm năm mươi sáu megabyte. Với bảy mươi lăm phần trăm, JVM ném Out Of Memory Error, exit một. Với Xmx một gigabyte, lớn hơn container: in tới một trăm megabyte rồi im lặng, exit một trăm ba mươi bảy.",
          "75%: OutOfMemoryError, exit 1. -Xmx1g: im lặng, exit 137.",
          lambda w: [IN("#jv-er", "up", w("Với bảy")), IN("#jv-or", "up", w("Với Xmx")), SHAKE("#jv-or", w("exit một trăm"))]),
        B("Nhớ: lỗi có stack trace là JVM, im lặng với mã một trăm ba mươi bảy là kernel.",
          "Stack trace là JVM, 137 là kernel.",
          lambda w: [DIM(S("jv-eye", "jv-q", "jv-e", "jv-o", "jv-er", "jv-or"), 0, 0.07),
                     TYPE("#jv-t1", 0.2, 0.04), IN("#jv-t2", "blur", w("im lặng"))]),
    ]),
    # ------------------------------------------------------------ k8s-basics
    dict(id="k8s-basics", world=(1920, 1080), hud="", cam="".join([
        head("k8", "Phần 4 · Kubernetes cho dev", "Năm đối tượng cần nắm"),
        *[card(f"k8-c{i}", 90 + i * 350, 300, 330, 340, t, d, tone, 34, 26)
          for i, (t, d, tone) in enumerate([("Pod", "dùng xong vứt, chết là Pod mới, IP mới", "cyan"),
                                            ("Deployment", "giữ đúng số Pod, lo rolling update", "cyan"),
                                            ("Service", "tên DNS ổn định, chỉ gửi tới Pod ready", "cyan"),
                                            ("ConfigMap", "cấu hình qua biến môi trường", "cyan"),
                                            ("Secret", "mặc định chỉ base64", "amber")])],
        note("k8-sn", 90, 690, 1740, "Secret cần mã hoá etcd, giới hạn RBAC, hoặc Vault, External Secrets", "red", 30),
        note("k8-rl", 90, 260, 1740, "replicas: 3 · maxSurge: 1 · maxUnavailable: 0", "", 32),
        *[titled(f"k8-p{i}", 90 + i * 350, 340, 320, 150, "v1", f"Pod {i + 1}", "ready", "cyan", 36) for i in range(3)],
        titled("k8-n", 1140, 340, 320, 150, "v2", "Pod mới", "đang khởi động", "amber", 36),
        titled("k8-nr", 1140, 340, 320, 150, "v2", "Pod mới", "ready", "green", 36),
        note("k8-ok", 90, 540, 1740, "Lúc nào cũng có đủ 3 Pod phục vụ · lặp lại tới khi hết Pod cũ", "green", 32),
        note("k8-undo", 90, 610, 1740, "Bản mới lỗi: kubectl rollout undo deployment/order-service", "", 30),
        titled("k8-rq", 90, 690, 820, 190, "requests", "phần được đảm bảo", "scheduler dựa vào để xếp Pod", "cyan", 36),
        titled("k8-lm", 1010, 690, 820, 190, "limits", "trần", "vượt RAM: OOMKilled · vượt CPU: bị throttle", "red", 36),
        take("k8", "Deployment giữ số Pod, Service giữ địa chỉ", "ConfigMap và Secret tách cấu hình khỏi image"),
    ]), beats=[
        B("Kubernetes nhận image và chạy nó trên cluster. Dev Spring cần nắm năm đối tượng. Pod là đơn vị nhỏ nhất, chết thì tạo Pod mới với IP mới. Deployment giữ đúng số Pod, và lo rolling update.",
          "Pod: dùng xong vứt. Deployment: giữ số Pod, rolling update.",
          lambda w: [IN("#k8-eye", "blur"), TYPE("#k8-q", 0.2, 0.05), *shrink("k8", w("Pod là")),
                     IN("#k8-c0", "pop", w("Pod là") + 0.4), IN("#k8-c1", "pop", w("Deployment giữ"))]),
        B("Service là tên DNS ổn định trước nhóm Pod chọn theo label, và chỉ gửi request tới Pod ready. ConfigMap đưa cấu hình vào Pod qua biến môi trường. Secret dành cho mật khẩu, nhưng mặc định chỉ là base64, không phải mã hoá thật.",
          "Service: địa chỉ ổn định. Secret mặc định chỉ base64.",
          lambda w: [IN("#k8-c2", "pop", w("Service là")), IN("#k8-c3", "pop", w("ConfigMap")), IN("#k8-c4", "pop", w("Secret dành")),
                     IN("#k8-sn", "up", w("không phải")), SHAKE("#k8-c4", w("không phải"))]),
        B("Rolling update với ba replicas, max surge một, max unavailable không. Kubernetes tạo thêm một Pod mới, chờ nó ready, rồi mới tắt một Pod cũ, và lặp lại. Lúc nào cũng đủ ba Pod phục vụ.",
          "maxSurge 1, maxUnavailable 0: thêm một, chờ ready, tắt một.",
          lambda w: [OUT(S("k8-c0", "k8-c1", "k8-c2", "k8-c3", "k8-c4", "k8-sn"), "blur", 0, 0.5),
                     IN("#k8-rl", "up", 0.5), IN("#k8-p0, #k8-p1, #k8-p2", "up", 0.8, 0.5, 0.15),
                     IN("#k8-n", "pop", w("tạo thêm")), OUT("#k8-n", "fade", w("chờ nó ready") + 0.3, 0.2), IN("#k8-nr", "pop", w("chờ nó ready") + 0.4),
                     DIM("#k8-p0", w("tắt một"), 0.15), IN("#k8-ok", "up", w("Lúc nào"))]),
        B("Bản mới lỗi thì rollout undo để quay lại.",
          "Bản mới lỗi: kubectl rollout undo.",
          lambda w: [IN("#k8-undo", "up", 0.2)]),
        B("Còn requests và limits. Requests là phần được đảm bảo, scheduler dựa vào nó để xếp Pod. Limits là trần: vượt RAM thì bị OOM Killed, vượt CPU thì chỉ bị bóp, không bị giết.",
          "requests: đảm bảo. limits: vượt RAM bị kill, vượt CPU bị throttle.",
          lambda w: [IN("#k8-rq", "up", w("Requests là")), IN("#k8-lm", "up", w("Limits là")), PULSE("#k8-lm", w("vượt CPU"))]),
        B("Tóm lại: Deployment giữ số Pod, Service giữ địa chỉ, ConfigMap và Secret tách cấu hình khỏi image.",
          "Deployment giữ số Pod, Service giữ địa chỉ.",
          lambda w: [DIM(S("k8-eye", "k8-q", "k8-rl", "k8-p0", "k8-p1", "k8-p2", "k8-nr", "k8-ok", "k8-undo", "k8-rq", "k8-lm"), 0, 0.07),
                     TYPE("#k8-t1", 0.2, 0.04), IN("#k8-t2", "blur", w("ConfigMap"))]),
    ]),
    # ------------------------------------------------------------ health-probes
    dict(id="health-probes", world=(1920, 1080), hud="", cam="".join([
        head("hp", "Phần 5 · Health probe với Actuator", "Liveness, readiness, startup"),
        *[tag(f"hp-k{i}", 90, 270 + i * 140, 380, 116, t, "violet", 32) for i, t in enumerate(["liveness", "readiness", "startup"])],
        *[tag(f"hp-e{i}", 500, 270 + i * 140, 760, 116, t, "cyan", 28)
          for i, t in enumerate(["/actuator/health/liveness", "/actuator/health/readiness", "/actuator/health/liveness"])],
        tag("hp-r0", 1290, 270, 540, 116, "fail 3 lần → restart", "red", 28),
        tag("hp-r1", 1290, 410, 540, 116, "fail → rút khỏi Service", "amber", 28),
        tag("hp-r2", 1290, 550, 540, 116, "tối đa 24 × 5s = 120s", "green", 28),
        note("hp-q0", 90, 700, 1740, "Liveness: có cần restart không? · Readiness: có nên nhận request không?", "", 32),
        note("hp-nd", 90, 770, 1740, "Mặc định hai group này không kiểm tra database hay Redis", "green", 32),
        titled("hp-db", 90, 360, 440, 200, "liveness có db", "Database", "chậm 30 giây", "amber", 44),
        *[tag(f"hp-p{i}", 690, 270 + i * 130, 440, 110, f"Pod {i + 1}: liveness fail", "red", 28) for i in range(3)],
        bigerr("hp-boom", 1290, 300, 540, "Restart tất cả cùng lúc<br>+ mở lại connection pool<br>+ không Pod nào phục vụ", 30),
        note("hp-fix", 90, 700, 1740, "Lỗi phụ thuộc: timeout, circuit breaker, trả lỗi có kiểm soát", "green", 32),
        take("hp", "Liveness chỉ kiểm tra chính app", "phụ thuộc bên ngoài lỗi thì restart không giúp gì"),
        wires(line("hp-a0", [(535, 430), (685, 325)]), line("hp-a1", [(535, 460), (685, 455)]), line("hp-a2", [(535, 490), (685, 585)])),
    ]), beats=[
        B("Spring Boot Actuator có sẵn hai health group: health liveness và health readiness. Liveness hỏi: có cần restart không. Readiness hỏi: có nên nhận request không.",
          "Liveness: có cần restart? Readiness: có nên nhận request?",
          lambda w: [IN("#hp-eye", "blur"), TYPE("#hp-q", 0.2, 0.05), *shrink("hp", w("hai health")),
                     IN("#hp-k0", "up", w("health liveness")), IN("#hp-e0", "left", w("health liveness") + 0.3),
                     IN("#hp-k1", "up", w("health readiness")), IN("#hp-e1", "left", w("health readiness") + 0.3),
                     IN("#hp-q0", "up", w("Liveness hỏi"))]),
        B("Liveness fail ba lần thì Kubernetes restart container. Readiness fail thì Pod chỉ bị rút khỏi Service, không bị restart.",
          "Liveness fail: restart. Readiness fail: rút khỏi Service.",
          lambda w: [IN("#hp-r0", "pop", w("Liveness fail")), IN("#hp-r1", "pop", w("Readiness fail"))]),
        B("Startup probe dành cho app khởi động chậm: ở đây cho tối đa hai mươi tư lần năm giây, tức hai phút. Trong lúc đó liveness chưa chạy, nên không giết oan Pod đang khởi động.",
          "Startup probe: tối đa 24 × 5s = 120s cho app khởi động chậm.",
          lambda w: [IN("#hp-k2", "up", 0.2), IN("#hp-e2", "left", 0.5), IN("#hp-r2", "pop", w("tối đa"))]),
        B("Hai group này mặc định không kiểm tra database hay Redis. Và đây là cái bẫy: nếu thêm database vào liveness, database chậm ba mươi giây làm liveness của mọi Pod cùng fail.",
          "Bẫy: thêm database vào liveness.",
          lambda w: [IN("#hp-nd", "up", 0.2),
                     OUT(S("hp-k0", "hp-k1", "hp-k2", "hp-e0", "hp-e1", "hp-e2", "hp-r0", "hp-r1", "hp-r2", "hp-q0", "hp-nd"), "blur", w("Và đây"), 0.5),
                     IN("#hp-db", "up", w("nếu thêm") ), *AW("hp-a0", w("làm liveness")), *AW("hp-a1", w("làm liveness") + 0.1), *AW("hp-a2", w("làm liveness") + 0.2),
                     IN("#hp-p0, #hp-p1, #hp-p2", "up", w("mọi Pod"), 0.5, 0.15)]),
        B("Kubernetes restart tất cả cùng lúc. Restart không chữa được database, mà mỗi Pod mới còn mở lại connection pool, dồn thêm tải, và không còn Pod nào phục vụ.",
          "Restart dây chuyền: dồn tải lên database, mất hết Pod.",
          lambda w: [SHAKE("#hp-p0, #hp-p1, #hp-p2", 0.3), IN("#hp-boom", "up", w("Restart không")), SHAKE("#hp-boom", w("không còn"))]),
        B("Lỗi phụ thuộc nên xử lý trong app bằng timeout và circuit breaker. Liveness chỉ kiểm tra chính app.",
          "Liveness chỉ kiểm tra chính app.",
          lambda w: [IN("#hp-fix", "up", 0.2),
                     DIM(S("hp-eye", "hp-q", "hp-db", "hp-p0", "hp-p1", "hp-p2", "hp-boom", "hp-fix") + ", " + AR("hp-a0", "hp-a1", "hp-a2"), w("Liveness chỉ"), 0.07),
                     TYPE("#hp-t1", w("Liveness chỉ") + 0.3, 0.04), IN("#hp-t2", "blur", w("Liveness chỉ") + 1.0)]),
    ]),
    # ------------------------------------------------------------ graceful-shutdown
    dict(id="graceful-shutdown", world=(1920, 1080), hud="", cam="".join([
        head("gs", "Phần 6 · Graceful shutdown", "Đã ready mà deploy vẫn lỗi 503?"),
        tag("gs-s0", 90, 280, 480, 110, "SIGTERM", "amber", 34),
        tag("gs-s1", 690, 280, 540, 110, "chờ tối đa 30s", "cyan", 30),
        tag("gs-s2", 1350, 280, 480, 110, "SIGKILL", "red", 34),
        note("gs-gp", 690, 400, 540, "terminationGracePeriodSeconds", "", 26),
        titled("gs-sp", 90, 480, 1740, 180, "Spring Boot 3.4+ mặc định", "server.shutdown=graceful",
               "ngừng nhận kết nối mới · chờ request đang chạy · tối đa 30s mỗi phase", "green", 40),
        console("gs-log", 90, 260, 1100, ["15:21:21 slow request started", "15:21:23 SIGTERM: Commencing graceful shutdown",
                                           "15:21:29 slow request finished", "Graceful shutdown complete"]),
        tag("gs-ok", 1250, 270, 580, 110, "HTTP 200 sau 8,29s", "green", 32),
        tag("gs-ex", 1250, 400, 580, 110, "exit 143 = 128 + 15", "amber", 30),
        tag("gs-im", 1250, 530, 580, 110, "immediate: HTTP 000 sau 2,18s", "red", 26),
        note("gs-new", 90, 620, 1100, "Request mới trong lúc chờ: Connection refused", "red", 30),
        titled("gs-l1", 90, 270, 820, 180, "kubelet", "preStop → SIGTERM", "", "amber", 38),
        titled("gs-l2", 1010, 270, 820, 180, "control plane", "rút khỏi endpoints", "rồi kube-proxy, ingress mới cập nhật", "cyan", 38),
        bigerr("gs-503", 90, 500, 1740, "SIGTERM tới trước: app đã ngừng nhận, ingress vẫn gửi tới → 502 hoặc 503", 32),
        bar("gs-b0", 90, 270, 400, 110, "preStop sleep 10s", "amber", 28),
        bar("gs-b1", 510, 270, 1000, 110, "SIGTERM → graceful, tối đa 30s", "green", 28),
        tag("gs-b2", 1530, 270, 300, 110, "mốc 45s", "red", 30),
        cbox("gs-y", 90, 420, 1040, "deployment.yaml",
             "terminationGracePeriodSeconds: 45\n"
             "lifecycle:\n"
             "  preStop:\n"
             "    exec:\n"
             "      command: [\"sh\", \"-c\", \"sleep 10\"]", "violet", 28),
        note("gs-sum", 1180, 440, 650, "10 + 30 = 40\nnhỏ hơn 45", "green", 40),
        bigerr("gs-sh", 1180, 620, 650, "ENTRYPOINT java -jar app.jar<br>PID 1 là sh, không nhận SIGTERM", 28),
        note("gs-arr", 1180, 790, 650, "Dùng dạng mảng: [\"java\", ...]", "green", 30),
        take("gs", "Graceful lo request đã vào", "preStop sleep lo request còn đang trên đường tới"),
    ]), beats=[
        B("Rolling update đã chờ Pod mới ready, vậy mà deploy vẫn có vài request lỗi. Lỗi nằm ở Pod cũ bị tắt. Kubernetes gửi SIGTERM, chờ tối đa ba mươi giây, hết giờ thì SIGKILL.",
          "SIGTERM → chờ tối đa 30s → SIGKILL.",
          lambda w: [IN("#gs-eye", "blur"), TYPE("#gs-q", 0.2, 0.05), *shrink("gs", w("Lỗi nằm")),
                     IN("#gs-s0", "up", w("gửi SIGTERM")), IN("#gs-s1", "up", w("chờ tối đa")), IN("#gs-gp", "up", w("chờ tối đa") + 0.6),
                     IN("#gs-s2", "up", w("hết giờ"))]),
        B("Spring Boot nhận SIGTERM. Với server shutdown graceful, mặc định từ Boot ba chấm bốn, web server ngừng nhận kết nối mới, nhưng chờ request đang chạy xong, tối đa ba mươi giây mỗi phase.",
          "server.shutdown=graceful, mặc định từ Boot 3.4.",
          lambda w: [IN("#gs-sp", "up", w("Với server")), PULSE("#gs-sp", w("ngừng nhận"))]),
        B("Đã chạy: một request mất tám giây, hai giây sau gọi docker stop. Log in commencing graceful shutdown, request vẫn chạy xong, trả HTTP hai trăm sau tám phẩy hai chín giây.",
          "Request 8 giây, SIGTERM ở giây thứ 2: vẫn trả 200 sau 8,29s.",
          lambda w: [OUT(S("gs-s0", "gs-s1", "gs-s2", "gs-gp", "gs-sp"), "blur", 0, 0.5), IN("#gs-log", "fade", 0.5, 0.3),
                     IN("#gs-log-1", "type1", w("một request")), IN("#gs-log-2", "type1", w("Log in")),
                     IN("#gs-log-3", "type1", w("request vẫn")), IN("#gs-log-4", "type1", w("request vẫn") + 0.8),
                     IN("#gs-ok", "pop", w("trả HTTP")), IN("#gs-ex", "up", w("trả HTTP") + 1.5)]),
        B("Còn với shutdown immediate, request bị cắt sau hai phẩy một tám giây. Và request mới gửi tới trong lúc chờ thì bị từ chối kết nối.",
          "immediate: HTTP 000 sau 2,18s. Request mới: Connection refused.",
          lambda w: [IN("#gs-im", "pop", 0.3), SHAKE("#gs-im", w("bị cắt")), IN("#gs-new", "up", w("Và request"))]),
        B("Graceful chỉ lo request đã vào. Khi xoá Pod, có hai việc chạy song song: kubelet gửi SIGTERM, còn control plane rút Pod khỏi endpoints, rồi kube proxy và ingress mới cập nhật.",
          "Hai việc song song: SIGTERM và rút Pod khỏi endpoints.",
          lambda w: [OUT(S("gs-log", "gs-ok", "gs-ex", "gs-im", "gs-new"), "blur", 0, 0.5),
                     IN("#gs-l1", "up", w("kubelet")), IN("#gs-l2", "up", w("control plane"))]),
        B("Nếu SIGTERM tới trước, ingress vẫn gửi request tới Pod đã ngừng nhận. Người dùng nhận lỗi năm lẻ hai hoặc năm lẻ ba, đúng lúc deploy.",
          "SIGTERM tới trước: người dùng nhận 502 hoặc 503.",
          lambda w: [PULSE("#gs-l1", 0.2), IN("#gs-503", "up", w("ingress vẫn")), SHAKE("#gs-503", w("Người dùng"))]),
        B("Cách sửa: preStop hook ngủ mười giây. Trong lúc ngủ, app vẫn phục vụ, mạng kịp rút Pod ra. Ngủ xong mới SIGTERM. Termination grace period phải lớn hơn tổng: mười cộng ba mươi là bốn mươi, nhỏ hơn bốn mươi lăm.",
          "preStop sleep 10s, rồi graceful 30s: 40 < 45.",
          lambda w: [OUT(S("gs-l1", "gs-l2", "gs-503"), "blur", 0, 0.5), IN("#gs-b0", "left", w("preStop hook")),
                     IN("#gs-b1", "left", w("Ngủ xong")), IN("#gs-b2", "pop", w("Termination")),
                     IN("#gs-y", "blur", w("Termination") + 0.3, 0.6), IN("#gs-sum", "up", w("mười cộng"))]),
        B("Một bẫy cuối: ENTRYPOINT dạng shell thì PID một là sh, không chuyển SIGTERM cho java, app không bao giờ graceful. Hãy dùng dạng mảng.",
          "Bẫy: ENTRYPOINT dạng shell nuốt SIGTERM. Dùng dạng mảng.",
          lambda w: [IN("#gs-sh", "up", w("ENTRYPOINT")), SHAKE("#gs-sh", w("không chuyển")), IN("#gs-arr", "up", w("Hãy dùng"))]),
        B("Nhớ: graceful lo request đã vào, preStop lo request còn đang trên đường tới.",
          "Graceful lo request đã vào, preStop lo request đang tới.",
          lambda w: [DIM(S("gs-eye", "gs-q", "gs-b0", "gs-b1", "gs-b2", "gs-y", "gs-sum", "gs-sh", "gs-arr"), 0, 0.07),
                     TYPE("#gs-t1", 0.2, 0.04), IN("#gs-t2", "blur", w("preStop lo"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 112, 1660, 96, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Layer", "pom và dependency trước, code sau"),
                                      ("Dockerfile", "multi-stage, layered jar, JRE nhỏ, user app"),
                                      ("JVM", "MaxRAMPercentage khoảng 75, chừa chỗ ngoài heap"),
                                      ("OOM", "OutOfMemoryError do JVM · OOMKilled 137 do kernel"),
                                      ("Kubernetes", "Deployment giữ số Pod, Service giữ địa chỉ"),
                                      ("Tắt Pod", "liveness không check DB · graceful + preStop")])],
        el("ou-cta", 0, 900, 1920, None, "Mở bài học tương tác để làm quiz và luyện câu trả lời mẫu", "cta r"),
    ]), beats=[
        B("Tóm lại. Tải dependency trước, code sau. Dockerfile dùng multi stage, layered jar, JRE nhỏ và user thường.",
          "Layer cache và Dockerfile.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Tải dependency")), IN("#ou-r1", "right", w("Dockerfile dùng"))]),
        B("Trong container, đặt Max RAM Percentage khoảng bảy mươi lăm, và phân biệt Out Of Memory Error với OOM Killed.",
          "JVM trong container và hai loại OOM.",
          lambda w: [IN("#ou-r2", "right", w("đặt Max")), IN("#ou-r3", "right", w("và phân biệt"))]),
        B("Trên Kubernetes, Deployment giữ số Pod, Service giữ địa chỉ. Liveness không kiểm tra database, và khi tắt Pod thì dùng graceful shutdown cộng preStop sleep.",
          "Kubernetes, probe, graceful và preStop.",
          lambda w: [IN("#ou-r4", "right", w("Deployment")), IN("#ou-r5", "right", w("Liveness không"))]),
        B("Mở bài học tương tác để làm quiz và luyện câu trả lời mẫu nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
