"""OAuth2, OIDC, PKCE, JWT validation, refresh token rotation, Keycloak explainer (1920x1080 world coordinates).

Every output comes from the lesson (web/src/data/lessons/oauth2-oidc.ts), run on JDK 21 (SecDemo.java):
PKCE S256 of the RFC 7636 appendix B verifier dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk -> E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM;
a guessed verifier gives a challenge that does not match;
HS256 verifier: valid -> ok {"sub":"an","role":"USER",...}; role changed to ADMIN -> rejected: bad signature;
alg none -> rejected: alg not allowed (none); expired -> rejected: expired; other key -> rejected: bad signature;
rotation: refresh(R1) -> new token R2; R1 again -> REUSE DETECTED: family revoked; R2 afterwards -> invalid;
Keycloak converter on Spring Security 6.5.11: default [SCOPE_openid, SCOPE_profile], hasRole(ADMIN) false;
custom [ROLE_ADMIN, ROLE_offline_access, SCOPE_openid, SCOPE_profile], hasRole(ADMIN) true; client role order:read still false.
Theme: mono. Arrows are drawn without travelling dots (no decorative flow/comet effects).
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


def AW(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head; no travelling light."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text):
    return f'<span class="mono big" style="font-size:40px">{label}</span><span style="font-size:36px">{esc(text)}</span>'


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
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text).replace(chr(10), "<br>")}</span>', tone)


def titled(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=40):
    inner = (f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700;text-align:center">{esc(main).replace(chr(10), "<br>")}</span>'
    inner += f'<span style="font-size:28px;color:var(--muted);text-align:center">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px;text-align:center">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc).replace(chr(10), "<br>")}</span>', tone, "card")


def lr(id_, y, left, right, ltone="cyan", rtone="green", lw=560, h=110, size=30):
    """A row: actor/situation on the left, result on the right, joined by an arrow (<id>-a)."""
    return (tag(f"{id_}-l", 90, y, lw, h, left, ltone, size)
            + tag(f"{id_}-r", 90 + lw + 110, y, 1740 - lw - 110, h, right, rtone, size)
            + wires(arrow(f"{id_}-a", [(90 + lw + 10, y + h // 2), (90 + lw + 100, y + h // 2)], "muted")))


TOPICS = [("Code flow", "code trước, token sau"), ("PKCE", "chống chặn code"), ("3 loại token", "access, ID, refresh"),
          ("Kiểm tra JWT", "đừng tin payload"), ("Rotation", "bắt token dùng lại"), ("Keycloak", "server cấp token chung")]

DRILL = [
    ("App mobile đăng nhập bằng Google", "Auth Code + PKCE"),
    ("Job chạy đêm gọi API, không có người dùng", "Client Credentials"),
    ("Gửi kèm mỗi request tới resource server", "Access token"),
    ("Client cần biết ai vừa đăng nhập (sub, email)", "ID token"),
    ("Access token hết hạn, không bắt đăng nhập lại", "Refresh token"),
]
DY = lambda i: 270 + i * 122

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Bảo mật · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("OAuth2, OIDC và JWT"), "h1 r", "font-size:116px"),
        *[box(f"hk-c{i}", 70 + i * 300, 430, 280, 260,
              f'<b style="font-size:34px;text-align:center">{esc(n)}</b><span style="font-size:28px;color:var(--muted);text-align:center">{esc(d)}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TOPICS)],
        chip("hk-p1", 560, 790, "Code chạy thật", "green"),
        chip("hk-p2", 1080, 790, "Token giả bị chặn", "amber"),
        el("hk-t1", 0, 400, 1920, None, "Mật khẩu không đến tay app", "take r"),
        el("hk-t2", 0, 540, 1920, None, "app chỉ cầm token: có phạm vi, có hạn, thu hồi được", "take-sm r"),
        wires(arrow("hk-a1", [(850, 822), (1060, 822)], "muted")),
    ]), beats=[
        B("Bạn bấm đăng nhập bằng Google. Ứng dụng đó có bao giờ thấy mật khẩu của bạn không?",
          "Đăng nhập bằng Google: app có thấy mật khẩu không?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06)]),
        B("Để trả lời, ta đi qua sáu ý: code flow, P K C E, ba loại token, kiểm tra J W T, rotation, và key cloak.",
          "Sáu ý: code flow, PKCE, token, JWT, rotation, Keycloak.",
          lambda w: [IN("#hk-c0", "pop", w("code flow")), IN("#hk-c1", "pop", w("P K C E")), IN("#hk-c2", "pop", w("ba loại")),
                     IN("#hk-c3", "pop", w("kiểm tra")), IN("#hk-c4", "pop", w("rotation")), IN("#hk-c5", "pop", w("key cloak"))]),
        B("Mỗi ý có code chạy thật, để thấy từng token giả bị chặn thế nào.",
          "Code chạy thật: xem token giả bị chặn.",
          lambda w: [IN("#hk-p1", "left", w("code chạy")), *AW("hk-a1", w("để thấy") - 0.3, 0.5), IN("#hk-p2", "pop", w("từng token"))]),
        B("Câu trả lời ngắn: không. Mật khẩu không bao giờ đến tay ứng dụng, nó chỉ cầm token có phạm vi, có hạn, và thu hồi được.",
          "Mật khẩu không đến tay app, app chỉ cầm token.",
          lambda w: [DIM(S("hk-c0", "hk-c1", "hk-c2", "hk-c3", "hk-c4", "hk-c5", "hk-p1", "hk-p2", "hk-q", "hk-eye") + ", " + AR("hk-a1"), 0, 0.07),
                     IN("#hk-t1", "blur", 0.4, 0.8), IN("#hk-t2", "blur", w("nó chỉ cầm"))]),
    ]),
    # ------------------------------------------------------------ flow
    dict(id="flow", world=(1920, 1080), hud="", cam="".join([
        head("fl", "01 · OAuth2", "Authorization Code flow"),
        rule("fl-rule", "Cấp quyền có phạm vi, không đưa mật khẩu", "Như chìa khoá phụ cho người giữ xe: nổ máy được, không mở cốp, lấy lại lúc nào cũng được"),
        tag("fl-app", 160, 300, 700, 120, "login(username, password)", "violet", 34),
        bigerr("fl-err", 160, 470, 1600, "✕ App bị lộ dữ liệu: lộ luôn mật khẩu, mất cả tài khoản<br>✕ Muốn thu hồi: chỉ còn cách đổi mật khẩu, hỏng mọi app khác", 34),
        titled("fl-r0", 60, 270, 420, 150, "Resource owner", "Người dùng", "", "amber", 38),
        titled("fl-r1", 520, 270, 420, 150, "Client", "App muốn truy cập", "", "cyan", 38),
        titled("fl-r2", 980, 270, 420, 150, "Authorization server", "Cấp token", "", "violet", 38),
        titled("fl-r3", 1440, 270, 420, 150, "Resource server", "API giữ dữ liệu", "", "green", 38),
        *[titled(f"fl-s{i}", 60 + i * 460, 490, 380, 170, f"Bước {i + 1}", m, s, t, 32) for i, (m, s, t) in enumerate([
            ("Chuyển đi", "kèm scope, state", "cyan"), ("Đăng nhập", "người dùng đồng ý", "amber"),
            ("Trả code", "qua URL trình duyệt", "amber"), ("Đổi lấy token", "kèm bằng chứng client", "green")])],
        note("fl-n1", 60, 720, 840, "Code đi qua URL trình duyệt:\ndễ lọt vào lịch sử, log, Referer", "red", 32),
        note("fl-n2", 1000, 720, 860, "Đổi code: server gọi server,\ntoken không lên trình duyệt", "green", 32),
        tag("fl-n3", 60, 870, 1800, 90, "Thiếu bằng chứng client (client_secret hoặc PKCE): code lộ cũng vô dụng", "amber", 30),
        card("fl-ca", 90, 280, 840, 420, "OAuth2", "App được làm gì?\nAccess token có scope", "cyan", 54, 36),
        card("fl-cb", 990, 280, 840, 420, "OIDC", "Ai vừa đăng nhập?\nThêm scope openid: ID token (JWT) có sub, email, lúc đăng nhập", "violet", 54, 36),
        note("fl-g", 90, 760, 1740, "Đăng nhập bằng Google chính là OIDC", "green", 36),
        el("fl-t1", 0, 400, 1920, None, letters("Code trước, token sau"), "take r"),
        el("fl-t2", 0, 540, 1920, None, "bỏ implicit và password grant · dùng Auth Code + PKCE", "take-sm r"),
        wires(*[arrow(f"fl-b{i}", [(60 + i * 460 + 385, 575), (60 + (i + 1) * 460 - 5, 575)], "muted") for i in range(3)]),
    ]), beats=[
        B("Một ứng dụng khác muốn đọc danh bạ của bạn. Ô ót hai cho nó quyền có phạm vi mà không cần mật khẩu, giống chìa khoá phụ đưa cho người giữ xe: nổ máy được, nhưng không mở được cốp.",
          "OAuth2: cấp quyền có phạm vi, không đưa mật khẩu.",
          lambda w: [IN("#fl-eye", "blur"), TYPE("#fl-q", 0.2, 0.05), IN("#fl-rule", "up", w("Ô ót hai") + 0.3)]),
        B("Nếu đưa mật khẩu thẳng cho ứng dụng, nó bị lộ là bạn mất cả tài khoản. Muốn thu hồi thì chỉ còn cách đổi mật khẩu, làm hỏng mọi ứng dụng khác.",
          "Đưa mật khẩu: lộ là mất tài khoản, không thu hồi riêng được.",
          lambda w: [OUT("#fl-rule", "blur", 0, 0.4), *shrink("fl", 0), IN("#fl-app", "blur", 0.5, 0.6),
                     IN("#fl-err", "up", w("nó bị lộ")), SHAKE("#fl-err", w("Muốn thu hồi"))]),
        B("Ô ót hai có bốn vai: người dùng, client là ứng dụng muốn truy cập, authorization server cấp token, và resource server là A P I giữ dữ liệu.",
          "Bốn vai: người dùng, client, authorization server, resource server.",
          lambda w: [OUT(S("fl-app", "fl-err"), "blur", 0, 0.4), IN("#fl-r0", "up", w("người dùng")), IN("#fl-r1", "up", w("client là")),
                     IN("#fl-r2", "up", w("authorization")), IN("#fl-r3", "up", w("resource server"))]),
        B("Luồng chuẩn có bốn bước. Client chuyển người dùng sang authorization server, kèm scope và state để chống C S R F. Người dùng đăng nhập ở đó. Server trả về một code ngắn hạn. Rồi client đổi code lấy token.",
          "Chuyển đi, đăng nhập, nhận code, đổi code lấy token.",
          lambda w: [IN("#fl-s0", "up", w("Client chuyển")), *AW("fl-b0", w("Người dùng đăng") - 0.4), IN("#fl-s1", "up", w("Người dùng đăng")),
                     *AW("fl-b1", w("Server trả") - 0.4), IN("#fl-s2", "up", w("Server trả")),
                     *AW("fl-b2", w("Rồi client") - 0.4), IN("#fl-s3", "up", w("Rồi client"))]),
        B("Vì sao không trả token luôn? Code đi qua U R L trên trình duyệt, dễ lọt vào lịch sử hay log. Còn bước đổi token là server gọi server, nên token không bao giờ lên trình duyệt. Code bị lộ cũng vô dụng nếu thiếu bằng chứng client.",
          "Code qua URL dễ lộ; đổi token là server với server.",
          lambda w: [PULSE("#fl-s2", w("Code đi qua")), IN("#fl-n1", "up", w("Code đi qua")), PULSE("#fl-s3", w("Còn bước")), IN("#fl-n2", "up", w("Còn bước")),
                     IN("#fl-n3", "up", w("Code bị lộ"))]),
        B("O I D C xây trên đúng luồng này. Ô ót hai chỉ nói ứng dụng được làm gì. Thêm scope openid thì nhận thêm I D token, cho biết ai vừa đăng nhập. Đăng nhập bằng Google chính là O I D C.",
          "OIDC: thêm scope openid, nhận ID token biết ai đăng nhập.",
          lambda w: [OUT(S("fl-r0", "fl-r1", "fl-r2", "fl-r3", "fl-s0", "fl-s1", "fl-s2", "fl-s3", "fl-n1", "fl-n2", "fl-n3") + ", " + AR("fl-b0", "fl-b1", "fl-b2"), "blur", 0, 0.5),
                     IN("#fl-ca", "up", w("Ô ót hai chỉ")), IN("#fl-cb", "up", w("Thêm scope")), IN("#fl-g", "up", w("Đăng nhập bằng"))]),
        B("Bẫy phỏng vấn: implicit flow và password grant đã bị khuyến cáo bỏ. Hãy dùng Authorization Code kèm P K C E cho ứng dụng có người dùng.",
          "Bỏ implicit và password grant.",
          lambda w: [DIM(S("fl-eye", "fl-q", "fl-ca", "fl-cb", "fl-g"), 0, 0.07), TYPE("#fl-t1", 0.4, 0.05), IN("#fl-t2", "blur", w("Hãy dùng"))]),
    ]),
    # ------------------------------------------------------------ pkce
    dict(id="pkce", world=(1920, 1080), hud="", cam="".join([
        head("pk", "02 · PKCE", "Chống chặn authorization code"),
        rule("pk-rule", "Người đổi code phải là người đã xin code", "Mobile và SPA là public client: không giữ được client_secret"),
        tag("pk-m", 90, 270, 860, 150, "Mobile: app độc đăng ký\ncùng scheme myapp://callback", "violet", 30),
        tag("pk-w", 970, 270, 860, 150, "Web: code lọt qua log,\nlịch sử, Referer", "violet", 30),
        bigerr("pk-err", 90, 470, 1740, "✕ POST /token  code=abc&amp;client_id=app<br>✕ client_id công khai: kẻ chặn code đổi được token", 32),
        titled("pk-s0", 90, 260, 540, 190, "1 · Sinh verifier", "code_verifier", "ngẫu nhiên, giữ kín", "cyan", 34),
        titled("pk-s1", 690, 260, 540, 190, "2 · Lúc xin code", "code_challenge", "BASE64URL(SHA256(verifier))", "amber", 34),
        titled("pk-s2", 1290, 260, 540, 190, "3 · Lúc đổi token", "code_verifier", "server băm lại và so", "green", 34),
        titled("pk-v", 90, 520, 1740, 120, "verifier (RFC 7636)", "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", "", "cyan", 34),
        titled("pk-c", 90, 670, 1740, 120, "S256 → challenge", "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", "", "green", 34),
        tag("pk-ok", 90, 820, 840, 100, "✓ khớp RFC", "green", 32),
        tag("pk-bad", 990, 820, 840, 100, "✕ verifier đoán bừa: không khớp", "red", 32),
        el("pk-t1", 0, 400, 1920, None, letters("S256 cho mọi client"), "take r"),
        el("pk-t2", 0, 540, 1920, None, "không dùng plain: lộ yêu cầu đầu là lộ luôn verifier", "take-sm r"),
        wires(arrow("pk-b0", [(635, 355), (685, 355)], "muted"), arrow("pk-b1", [(1235, 355), (1285, 355)], "muted")),
    ]), beats=[
        B("Bước đổi code ở phần trước dựa vào client secret. Nhưng app mobile và S P A là public client, mã nguồn nằm trên máy người dùng, nên không giữ được secret.",
          "Mobile và SPA không giữ được client secret.",
          lambda w: [IN("#pk-eye", "blur"), TYPE("#pk-q", 0.2, 0.05), IN("#pk-rule", "up", w("Nhưng app") + 0.3)]),
        B("Code bị chặn bằng cách nào? Trên mobile, một app độc đăng ký cùng scheme của redirect U R L và nhận code thay app thật. Trên web, code lọt qua log hay lịch sử. Không có secret thì kẻ chặn code đổi được token.",
          "App độc nhận code thay app thật; không có secret thì đổi được token.",
          lambda w: [OUT("#pk-rule", "blur", 0, 0.4), *shrink("pk", 0), IN("#pk-m", "up", w("Trên mobile")), IN("#pk-w", "up", w("Trên web")),
                     IN("#pk-err", "up", w("Không có secret")), SHAKE("#pk-err", w("Không có secret") + 0.8)]),
        B("P K C E giải quyết bằng ba bước. Client sinh một code verifier ngẫu nhiên và giữ kín. Lúc xin code, gửi challenge là sha hai năm sáu của verifier. Lúc đổi token, gửi verifier thật để server băm lại và so.",
          "Sinh verifier, gửi challenge, đổi token bằng verifier.",
          lambda w: [OUT(S("pk-m", "pk-w", "pk-err"), "blur", 0, 0.4), IN("#pk-s0", "up", w("Client sinh")), *AW("pk-b0", w("Lúc xin") - 0.3),
                     IN("#pk-s1", "up", w("Lúc xin")), *AW("pk-b1", w("Lúc đổi") - 0.3), IN("#pk-s2", "up", w("Lúc đổi"))]),
        B("Đã chạy với ví dụ trong R F C bảy sáu ba sáu: verifier này cho ra đúng challenge E9Mel như trong R F C.",
          "Đã chạy: S256 khớp ví dụ RFC 7636.",
          lambda w: [IN("#pk-v", "up", w("verifier này")), IN("#pk-c", "up", w("cho ra")), IN("#pk-ok", "pop", w("như trong"))]),
        B("Còn kẻ tấn công có code nhưng đoán bừa verifier thì challenge không khớp, đổi token bị từ chối.",
          "Đoán bừa verifier: không khớp, bị từ chối.",
          lambda w: [IN("#pk-bad", "pop", w("đoán bừa")), SHAKE("#pk-bad", w("không khớp"))]),
        B("Nay P K C E được khuyến nghị cho mọi client dùng Authorization Code, kể cả server side. Và dùng S hai năm sáu, đừng dùng plain, vì plain gửi thẳng verifier.",
          "PKCE S256 cho mọi client, không dùng plain.",
          lambda w: [DIM(S("pk-eye", "pk-q", "pk-s0", "pk-s1", "pk-s2", "pk-v", "pk-c", "pk-ok", "pk-bad") + ", " + AR("pk-b0", "pk-b1"), 0, 0.07),
                     TYPE("#pk-t1", 0.4, 0.05), IN("#pk-t2", "blur", w("đừng dùng"))]),
    ]),
    # ------------------------------------------------------------ tokens
    dict(id="tokens", world=(1920, 1080), hud="", cam="".join([
        head("tk", "03 · Token", "Access, ID, refresh: dành cho ai?"),
        card("tk-a", 90, 270, 560, 330, "Access token", "gửi cho API (resource server)\nngắn hạn, mang scope", "cyan", 42, 30),
        card("tk-i", 680, 270, 560, 330, "ID token", "cho client biết ai đăng nhập\nsub, email (OIDC)", "violet", 42, 30),
        card("tk-r", 1270, 270, 560, 330, "Refresh token", "chỉ gửi authorization server\ndài hạn, xoay vòng", "amber", 42, 30),
        bigerr("tk-err", 90, 650, 1740, "✕ Đừng gửi ID token cho API: audience của nó là client", 32),
        tag("tk-cc", 90, 800, 1740, 100, "Không có người dùng (job, service gọi service): Client Credentials", "green", 30),
        card("tk-s", 90, 260, 840, 300, "Scope", "App được làm gì thay tôi?\norders:read, orders:write", "cyan", 48, 32),
        card("tk-o", 990, 260, 840, 300, "Role", "Người này được làm gì?\nUSER, ADMIN", "violet", 48, 32),
        tag("tk-x", 90, 600, 1740, 100, "Quyền thật = phần giao của scope và role", "amber", 34),
        note("tk-sp1", 90, 740, 1740, "✓ Spring tự map scope → SCOPE_orders:write", "green", 34),
        note("tk-sp2", 90, 820, 1740, "✕ claim roles không tự thành ROLE_ADMIN: phải cấu hình converter", "red", 34),
        el("tk-t1", 0, 400, 1920, None, letters("Ai là người nhận token?"), "take r"),
        el("tk-t2", 0, 540, 1920, None, "access cho API · ID cho client · refresh cho authorization server", "take-sm r"),
    ]), beats=[
        B("Luồng trả về nhiều loại token, và ba loại hay bị lẫn. Access token gửi cho A P I, ngắn hạn, mang scope.",
          "Access token: cho API, ngắn hạn, mang scope.",
          lambda w: [IN("#tk-eye", "blur"), TYPE("#tk-q", 0.2, 0.05), *shrink("tk", w("Access token") - 0.5), IN("#tk-a", "up", w("Access token") + 0.3)]),
        B("I D token là của O I D C, cho client biết người dùng là ai. Refresh token sống lâu, chỉ gửi tới authorization server để lấy access token mới.",
          "ID token cho client; refresh token chỉ gửi auth server.",
          lambda w: [IN("#tk-i", "up", w("I D token")), IN("#tk-r", "up", w("Refresh token"))]),
        B("Bẫy hay gặp: gửi I D token cho A P I làm bằng chứng truy cập. Sai, vì audience của nó là client. Còn khi không có người dùng, như job chạy đêm, thì dùng Client Credentials.",
          "Đừng gửi ID token cho API. Không người dùng: Client Credentials.",
          lambda w: [IN("#tk-err", "up", w("Bẫy hay gặp")), SHAKE("#tk-err", w("Sai,")), IN("#tk-cc", "up", w("Còn khi"))]),
        B("Scope và role cũng hay bị nhầm. Scope là ứng dụng được người dùng cho làm gì. Role là bản thân người dùng được làm gì. Quyền thật là phần giao của hai thứ.",
          "Scope: app được làm gì. Role: người dùng được làm gì.",
          lambda w: [OUT(S("tk-a", "tk-i", "tk-r", "tk-err", "tk-cc"), "blur", 0, 0.5), IN("#tk-s", "up", w("Scope là")), IN("#tk-o", "up", w("Role là")),
                     IN("#tk-x", "pop", w("Quyền thật"))]),
        B("Trong Spring, resource server tự chuyển claim scope thành authority SCOPE gạch dưới. Nhưng claim roles thì không tự thành ROLE ADMIN, phải cấu hình converter, nếu không has role luôn ra bốn không ba.",
          "Spring chỉ tự map scope; roles cần converter.",
          lambda w: [IN("#tk-sp1", "up", w("Trong Spring")), IN("#tk-sp2", "up", w("Nhưng claim")), SHAKE("#tk-sp2", w("bốn không ba"))]),
        B("Câu cần nhớ: hỏi xem ai là người nhận token.",
          "Hỏi: ai là người nhận token?",
          lambda w: [DIM(S("tk-eye", "tk-q", "tk-s", "tk-o", "tk-x", "tk-sp1", "tk-sp2"), 0, 0.07), TYPE("#tk-t1", 0.2, 0.05), IN("#tk-t2", "blur", 1.2)]),
    ]),
    # ------------------------------------------------------------ jwt-validate
    dict(id="jwt-validate", world=(1920, 1080), hud="", cam="".join([
        head("jw", "04 · Kiểm tra JWT", "Đừng tin payload"),
        tag("jw-h", 90, 280, 480, 130, "header", "cyan", 40),
        tag("jw-p", 640, 280, 560, 130, "payload", "amber", 40),
        tag("jw-s", 1270, 280, 560, 130, "signature", "green", 40),
        el("jw-d1", 570, 290, 70, None, ".", "note r", "font-size:80px;color:#fff"),
        el("jw-d2", 1200, 290, 70, None, ".", "note r", "font-size:80px;color:#fff"),
        note("jw-n1", 640, 450, 560, "chỉ là base64:\nai cũng đọc, ai cũng sửa", "red", 32),
        note("jw-n2", 1270, 450, 560, "tin cậy đến từ đây", "green", 32),
        *[tag(f"jw-c{i}", 90 + i * 354, 270, 330, 110, t, "cyan", 30) for i, t in enumerate(
            ["chữ ký", "alg cố định", "exp", "iss", "aud"])],
        *[tag(f"jw-r{i}", 90, 430 + i * 104, 1740, 88, t, tone, 30) for i, (t, tone) in enumerate([
            ("token hợp lệ → ok: sub an, role USER", "green"),
            ("đổi role thành ADMIN, giữ chữ ký → rejected: bad signature", "red"),
            ("alg none → rejected: alg not allowed (none)", "red"),
            ("quá hạn → rejected: expired", "red"),
            ("ký bằng khoá khác → rejected: bad signature", "red")])],
        card("jw-tr", 160, 280, 1600, 400, "Nhầm thuật toán", "Server dùng RS256, khoá công khai ai cũng có.\nKẻ tấn công ghi alg HS256 và ký bằng chính khoá công khai đó.\nServer để token tự chọn alg sẽ thấy chữ ký hợp lệ.", "red", 52, 34),
        note("jw-lib", 160, 730, 1600, "Thực tế: Spring Resource Server, Nimbus, khoá công khai qua JWK Set", "green", 32),
        el("jw-t1", 0, 400, 1920, None, letters("Cố định thuật toán ở server"), "take r"),
        el("jw-t2", 0, 540, 1920, None, "chữ ký · alg · exp · iss · aud: thiếu một là mở một cửa", "take-sm r"),
    ]), beats=[
        B("Resource server nhận J W T rồi tin nó thế nào? J W T gồm ba phần: header, payload và chữ ký.",
          "JWT = header . payload . signature",
          lambda w: [IN("#jw-eye", "blur"), TYPE("#jw-q", 0.2, 0.05), *shrink("jw", w("J W T gồm") - 0.6),
                     IN("#jw-h", "up", w("header")), IN("#jw-d1", "fade", w("payload")), IN("#jw-p", "up", w("payload")), IN("#jw-d2", "fade", w("chữ ký")), IN("#jw-s", "up", w("chữ ký"))]),
        B("Payload chỉ là base sáu bốn, đổi cách viết chứ không mã hoá, ai cũng đọc và sửa được. Tính tin cậy đến từ chữ ký.",
          "Payload chỉ là base64. Tin cậy đến từ chữ ký.",
          lambda w: [IN("#jw-n1", "up", w("Payload")), PULSE("#jw-p", w("ai cũng")), IN("#jw-n2", "up", w("Tính tin")), PULSE("#jw-s", w("chữ ký."))]),
        B("Nên khi nhận phải kiểm tra năm thứ: chữ ký so sánh hằng thời gian, thuật toán định trước, exp còn hạn, iss đúng server đã cấp, và aud dành cho chính A P I này.",
          "Năm kiểm tra: chữ ký, alg, exp, iss, aud.",
          lambda w: [OUT(S("jw-h", "jw-p", "jw-s", "jw-d1", "jw-d2", "jw-n1", "jw-n2"), "blur", 0, 0.4),
                     IN("#jw-c0", "up", w("chữ ký")), IN("#jw-c1", "up", w("thuật toán")), IN("#jw-c2", "up", w("exp")),
                     IN("#jw-c3", "up", w("iss")), IN("#jw-c4", "up", w("aud"))]),
        B("Đã chạy với một bộ kiểm tra H S hai năm sáu tự viết. Token hợp lệ thì qua. Sửa role thành admin mà giữ chữ ký cũ thì bị bad signature.",
          "Đã chạy: hợp lệ qua; sửa role → bad signature.",
          lambda w: [IN("#jw-r0", "up", w("Token hợp lệ")), IN("#jw-r1", "up", w("Sửa role")), PULSE("#jw-c0", w("bad signature")), SHAKE("#jw-r1", w("bad signature"))]),
        B("Token khai alg none bị chặn ở bước thuật toán. Token quá hạn bị expired. Ký bằng khoá khác cũng bị bad signature.",
          "alg none, quá hạn, sai khoá: đều bị từ chối.",
          lambda w: [IN("#jw-r2", "up", w("Token khai")), PULSE("#jw-c1", w("bước thuật")), IN("#jw-r3", "up", w("Token quá")), PULSE("#jw-c2", w("Token quá") + 0.5),
                     IN("#jw-r4", "up", w("Ký bằng")), PULSE("#jw-c0", w("Ký bằng") + 0.8)]),
        B("Bẫy nhầm thuật toán: server dùng R S hai năm sáu, khoá công khai thì ai cũng có. Kẻ tấn công ghi alg H S hai năm sáu và ký bằng chính khoá công khai đó. Nếu server để token tự chọn thuật toán, chữ ký sẽ hợp lệ.",
          "Nhầm thuật toán: ký HS256 bằng khoá công khai.",
          lambda w: [OUT(S("jw-c0", "jw-c1", "jw-c2", "jw-c3", "jw-c4", "jw-r0", "jw-r1", "jw-r2", "jw-r3", "jw-r4"), "blur", 0, 0.5), IN("#jw-tr", "up", 0.6)]),
        B("Thực tế ta dùng Spring Resource Server và Nimbus, nhưng phải hiểu nó kiểm tra gì. Và luôn cố định thuật toán ở phía server.",
          "Dùng thư viện, nhưng cố định thuật toán ở server.",
          lambda w: [IN("#jw-lib", "up", 0.3), DIM(S("jw-eye", "jw-q", "jw-tr", "jw-lib"), w("Và luôn"), 0.07),
                     TYPE("#jw-t1", w("Và luôn") + 0.3, 0.04), IN("#jw-t2", "blur", w("Và luôn") + 1.5)]),
    ]),
    # ------------------------------------------------------------ rotation
    dict(id="rotation", world=(1920, 1080), hud="", cam="".join([
        head("ro", "05 · Refresh token rotation", "Bắt quả tang token bị dùng lại"),
        rule("ro-rule", "Mỗi lần dùng: cấp token mới, vô hiệu token cũ", "Token cũ xuất hiện lại nghĩa là có bản sao: thu hồi cả nhóm token (family)"),
        tag("ro-bad", 90, 280, 1740, 110, "POST /refresh  token=R1   → luôn trả access token mới", "violet", 32),
        bigerr("ro-err", 90, 430, 1740, "✕ Kẻ tấn công chép được R1: dùng mãi, người dùng thật không hề biết", 32),
        lr("ro-1", 280, "Người dùng: refresh(R1)", "new token R2 · R1 đánh dấu đã dùng", "cyan", "green"),
        lr("ro-2", 430, "Kẻ tấn công: refresh(R1)", "REUSE DETECTED: family revoked", "red", "amber"),
        lr("ro-3", 580, "Người dùng: refresh(R2)", "invalid · phải đăng nhập lại", "cyan", "red"),
        note("ro-why", 90, 730, 1740, "Server không biết ai là kẻ đánh cắp, nên thu hồi cả nhóm", "", 32),
        *[tag(f"ro-k{i}", 90 + i * 590, 820, 560, 110, t, "green", 30) for i, t in enumerate(
            ["access token ~15 phút", "refresh token xoay vòng", "cookie HttpOnly"])],
        el("ro-t1", 0, 400, 1920, None, letters("Phải nhớ token nào đã dùng"), "take r"),
        el("ro-t2", 0, 540, 1920, None, "xoay vòng mà không phát hiện dùng lại thì vô ích", "take-sm r"),
    ]), beats=[
        B("Access token sống ngắn, nên client cần refresh token để lấy cái mới. Nhưng refresh token sống lâu, bị đánh cắp là nguy hiểm.",
          "Refresh token sống lâu: bị đánh cắp là nguy hiểm.",
          lambda w: [IN("#ro-eye", "blur"), TYPE("#ro-q", 0.2, 0.05)]),
        B("Nếu refresh token dùng đi dùng lại được, kẻ tấn công chép được R một sẽ dùng mãi, và người dùng thật không hề biết.",
          "Dùng đi dùng lại: kẻ chép R1 dùng mãi.",
          lambda w: [*shrink("ro", 0), IN("#ro-bad", "blur", 0.5, 0.6), IN("#ro-err", "up", w("kẻ tấn công")), SHAKE("#ro-err", w("không hề"))]),
        B("Rotation: mỗi lần dùng, server cấp token mới và vô hiệu token cũ. Nếu token cũ xuất hiện lại, nghĩa là có bản sao, server thu hồi cả nhóm.",
          "Rotation: token cũ xuất hiện lại thì thu hồi cả nhóm.",
          lambda w: [OUT(S("ro-bad", "ro-err"), "blur", 0, 0.4), IN("#ro-rule", "up", 0.5)]),
        B("Đã chạy: người dùng đổi R một, nhận R hai. Kẻ tấn công gửi lại R một: reuse detected, cả nhóm bị thu hồi. Người dùng dùng R hai sau đó thì nhận invalid.",
          "Đã chạy: R2, rồi REUSE DETECTED, rồi invalid.",
          lambda w: [OUT("#ro-rule", "blur", 0, 0.4),
                     IN("#ro-1-l", "up", w("người dùng đổi")), *AW("ro-1-a", w("nhận R hai") - 0.3), IN("#ro-1-r", "up", w("nhận R hai")),
                     IN("#ro-2-l", "up", w("Kẻ tấn công")), *AW("ro-2-a", w("reuse") - 0.3), IN("#ro-2-r", "pop", w("reuse")), SHAKE("#ro-2-r", w("cả nhóm")),
                     IN("#ro-3-l", "up", w("Người dùng dùng")), *AW("ro-3-a", w("nhận invalid") - 0.3), IN("#ro-3-r", "up", w("nhận invalid"))]),
        B("Server không biết ai là kẻ đánh cắp, nên thu hồi cả nhóm. Người dùng thật phải đăng nhập lại, đó là cái giá chấp nhận được.",
          "Người dùng thật phải đăng nhập lại: cái giá chấp nhận được.",
          lambda w: [IN("#ro-why", "up", 0.2), PULSE("#ro-3-r", w("phải đăng nhập"))]),
        B("Kết hợp lại: access token khoảng mười lăm phút, refresh token xoay vòng, và lưu trong cookie http only thay vì local storage để javascript không đọc được.",
          "Access ngắn, refresh xoay vòng, cookie HttpOnly.",
          lambda w: [IN("#ro-k0", "up", w("access token")), IN("#ro-k1", "up", w("refresh token")), IN("#ro-k2", "up", w("cookie"))]),
        B("Bẫy: chỉ xoay vòng mà không nhớ token cũ đã dùng thì kẻ tấn công vẫn dùng được nó.",
          "Phải lưu trạng thái đã dùng theo nhóm token.",
          lambda w: [DIM(S("ro-eye", "ro-q", "ro-1-l", "ro-1-r", "ro-2-l", "ro-2-r", "ro-3-l", "ro-3-r", "ro-why", "ro-k0", "ro-k1", "ro-k2") + ", " + AR("ro-1-a", "ro-2-a", "ro-3-a"), 0, 0.07),
                     TYPE("#ro-t1", 0.3, 0.04), IN("#ro-t2", "blur", w("thì kẻ"))]),
    ]),
    # ------------------------------------------------------------ chon-luong
    dict(id="chon-luong", world=(1920, 1080), hud="", cam="".join([
        head("cl", "06 · Bài tập", "Dùng luồng và token nào?"),
        *[box(f"cl-s{i}", 90, DY(i), 1060, 100, f'<span style="font-size:32px">{esc(t)}</span>', "cyan", "card") for i, (t, _) in enumerate(DRILL)],
        *[tag(f"cl-p{i}", 1290, DY(i), 540, 100, p, "green", 32) for i, (_, p) in enumerate(DRILL)],
        wires(*[arrow(f"cl-a{i}", [(1160, DY(i) + 50), (1280, DY(i) + 50)], "muted") for i in range(5)]),
        el("cl-t1", 0, 400, 1920, None, letters("Ba câu hỏi"), "take r"),
        el("cl-t2", 0, 540, 1920, None, "có người dùng không · ai nhận token · token sống bao lâu", "take-sm r"),
    ]), beats=[
        B("Thử nhanh. App mobile cho đăng nhập bằng Google: có người dùng, client công khai, nên dùng Authorization Code kèm P K C E.",
          "Mobile đăng nhập Google: Auth Code + PKCE.",
          lambda w: [IN("#cl-eye", "blur"), TYPE("#cl-q", 0.2, 0.05), *shrink("cl", w("App mobile") - 0.4),
                     IN("#cl-s0", "up", w("App mobile") + 0.4), *AW("cl-a0", w("nên dùng") - 0.3), IN("#cl-p0", "pop", w("nên dùng"))]),
        B("Job chạy đêm gọi A P I nội bộ, không có người dùng: Client Credentials.",
          "Job không người dùng: Client Credentials.",
          lambda w: [IN("#cl-s1", "up", 0.1), *AW("cl-a1", w("Client Credentials") - 0.3), IN("#cl-p1", "pop", w("Client Credentials"))]),
        B("Gửi kèm mỗi request tới resource server: access token. Client cần biết ai vừa đăng nhập: I D token.",
          "Mỗi request: access token. Biết ai đăng nhập: ID token.",
          lambda w: [IN("#cl-s2", "up", 0.1), *AW("cl-a2", w("access token") - 0.3), IN("#cl-p2", "pop", w("access token")),
                     IN("#cl-s3", "up", w("Client cần")), *AW("cl-a3", w("I D token") - 0.3), IN("#cl-p3", "pop", w("I D token"))]),
        B("Access token hết hạn mà không muốn bắt đăng nhập lại: refresh token.",
          "Hết hạn, không đăng nhập lại: refresh token.",
          lambda w: [IN("#cl-s4", "up", 0.1), *AW("cl-a4", w("refresh token") - 0.3), IN("#cl-p4", "pop", w("refresh token"))]),
        B("Mẹo: hỏi ba câu. Có người dùng không, ai là người nhận token, và token sống bao lâu.",
          "Có người dùng không, ai nhận token, sống bao lâu.",
          lambda w: [DIM(S("cl-eye", "cl-q", *[f"cl-s{i}" for i in range(5)], *[f"cl-p{i}" for i in range(5)]) + ", " + AR(*[f"cl-a{i}" for i in range(5)]), 0, 0.07),
                     TYPE("#cl-t1", 0.3, 0.05), IN("#cl-t2", "blur", w("Có người"))]),
    ]),
    # ------------------------------------------------------------ keycloak
    dict(id="keycloak", world=(1920, 1080), hud="", cam="".join([
        head("kc", "07 · Keycloak", "Authorization server dùng chung"),
        *[tag(f"kc-a{i}", 90 + i * 354, 270, 330, 100, t, "violet", 30) for i, t in enumerate(["web bán hàng", "admin", "mobile", "báo cáo", "CRM"])],
        *[note(f"kc-e{i}", 90, 420 + i * 80, 1740, t, "red", 34) for i, t in enumerate([
            "✕ Người dùng đăng nhập 5 lần, nhớ 5 mật khẩu",
            "✕ Nhân viên nghỉ việc: khoá ở 5 chỗ, sót một là lỗ hổng",
            "✕ Mỗi team tự viết hash mật khẩu, MFA: 5 lần cơ hội làm sai"])],
        titled("kc-k", 560, 470, 800, 150, "identity provider", "Keycloak", "", "amber", 52),
        *[tag(f"kc-f{i}", 90 + i * 590, 700, 560, 110, t, "green", 30) for i, t in enumerate(["SSO: đăng nhập một lần", "Quản lý user một chỗ", "App lo nghiệp vụ"])],
        titled("kc-as", 90, 280, 760, 220, "Authorization Server + OpenID Provider", "Keycloak", "cấp access, ID, refresh token", "amber", 50),
        titled("kc-rs", 1070, 280, 760, 220, "Resource Server", "App Spring Boot", "kiểm tra chữ ký bằng JWKS, phân quyền", "cyan", 50),
        bigerr("kc-no", 90, 570, 1740, "✕ Bỏ Spring Security vì \"Keycloak lo rồi\": request đi thẳng tới app, không ai kiểm tra token", 30),
        cbox("kc-tok", 90, 260, 820, "access token (Keycloak)",
             '"realm_access": {\n'
             '  "roles": ["ADMIN", "offline_access"] },\n'
             '"resource_access": {\n'
             '  "order-api": { "roles": ["order:read"] } },\n'
             '"scope": "openid profile"', "violet", 28),
        titled("kc-d", 970, 260, 860, 220, "converter mặc định", "[SCOPE_openid, SCOPE_profile]", "hasRole(ADMIN) = false → 403", "red", 32),
        titled("kc-c", 970, 510, 860, 260, "converter đọc realm_access.roles", "[ROLE_ADMIN, ROLE_offline_access,\nSCOPE_openid, SCOPE_profile]", "hasRole(ADMIN) = true", "green", 30),
        note("kc-keep", 90, 640, 820, "Gọi lại converter mặc định\nđể giữ SCOPE_", "green", 32),
        note("kc-ver", 90, 820, 1740, "Đã chạy trên Spring Security 6.5.11 · client role order:read vẫn false: phải đọc thêm resource_access", "", 30),
        el("kc-t1", 0, 400, 1920, None, letters("Keycloak cấp, Spring kiểm"), "take r"),
        el("kc-t2", 0, 540, 1920, None, "hai thứ bổ sung nhau, không thay thế nhau", "take-sm r"),
        wires(arrow("kc-ar", [(860, 390), (1060, 390)], "muted"),
              *[arrow(f"kc-l{i}", [(960 + (i - 2) * 120, 465), (255 + i * 354, 375)], "muted") for i in range(5)]),
        el("kc-arl", 860, 330, 200, None, "JWKS", "note r", "font-size:28px"),
    ]), beats=[
        B("Trong dự án thật, ai đóng vai authorization server? Thường là một identity provider như key cloak. Thử hình dung công ty có năm app, app nào cũng tự quản lý user.",
          "Năm app, app nào cũng tự quản lý user.",
          lambda w: [IN("#kc-eye", "blur"), TYPE("#kc-q", 0.2, 0.05), *shrink("kc", w("Thử hình dung") - 0.6),
                     IN("#kc-a0, #kc-a1, #kc-a2, #kc-a3, #kc-a4", "up", w("năm app"), 0.5, 0.12)]),
        B("Người dùng đăng nhập năm lần. Nhân viên nghỉ việc phải khoá ở năm chỗ. Và mỗi team tự viết hash mật khẩu, M F A, năm lần cơ hội làm sai.",
          "Năm lần đăng nhập, năm chỗ khoá, năm lần làm sai.",
          lambda w: [IN("#kc-e0", "up", w("Người dùng")), IN("#kc-e1", "up", w("Nhân viên")), IN("#kc-e2", "up", w("Và mỗi team"))]),
        B("Key cloak gom phần đó về một chỗ: đăng nhập một lần cho mọi app, quản lý user tập trung, còn app chỉ lo nghiệp vụ.",
          "Keycloak: SSO, quản lý user một chỗ, app lo nghiệp vụ.",
          lambda w: [OUT(S("kc-e0", "kc-e1", "kc-e2"), "blur", 0, 0.4), IN("#kc-k", "pop", 0.4),
                     *[x for i in range(5) for x in AW(f"kc-l{i}", 0.8 + i * 0.12, 0.4)],
                     IN("#kc-f0", "up", w("đăng nhập một")), IN("#kc-f1", "up", w("quản lý")), IN("#kc-f2", "up", w("còn app"))]),
        B("Về vai trò: key cloak là authorization server, cấp token. App Spring Boot là resource server, kiểm tra chữ ký bằng khoá công khai key cloak công bố, rồi phân quyền.",
          "Keycloak cấp token; Spring Boot là resource server kiểm tra token.",
          lambda w: [OUT(S("kc-a0", "kc-a1", "kc-a2", "kc-a3", "kc-a4", "kc-k", "kc-f0", "kc-f1", "kc-f2") + ", " + AR(*[f"kc-l{i}" for i in range(5)]), "blur", 0, 0.5),
                     IN("#kc-as", "up", w("key cloak là")), IN("#kc-rs", "up", w("App Spring")), *AW("kc-ar", w("khoá công khai"), 0.5), IN("#kc-arl", "fade", w("khoá công khai"))]),
        B("Vậy bỏ Spring Security được không? Không. Request đi thẳng tới app, không qua key cloak. Bỏ đi thì token giả cũng lọt.",
          "Bỏ Spring Security: không ai kiểm tra token.",
          lambda w: [IN("#kc-no", "up", w("Không.")), SHAKE("#kc-no", w("Bỏ đi"))]),
        B("Câu hay hỏi tiếp: gán role admin trên key cloak rồi mà has role admin vẫn ra bốn không ba. Vì key cloak để role trong realm access, còn converter mặc định chỉ đọc scope.",
          "hasRole(ADMIN) ra 403: role nằm ở realm_access.",
          lambda w: [OUT(S("kc-as", "kc-rs", "kc-no", "kc-arl") + ", " + AR("kc-ar"), "blur", 0, 0.5), IN("#kc-tok", "blur", 0.6, 0.7),
                     PULSE("#kc-tok", w("realm access")), IN("#kc-d", "up", w("converter mặc định")), SHAKE("#kc-d", w("chỉ đọc scope"))]),
        B("Cách sửa: viết converter đọc realm access roles, thêm tiền tố ROLE, và gọi lại converter mặc định để giữ scope. Đã chạy: has role admin ra true.",
          "Converter đọc realm_access.roles: hasRole(ADMIN) = true.",
          lambda w: [IN("#kc-c", "up", w("Cách sửa")), IN("#kc-keep", "up", w("gọi lại")), IN("#kc-ver", "up", w("Đã chạy")), PULSE("#kc-c", w("ra true"))]),
        B("Nhớ: key cloak cấp token và quản lý user, Spring kiểm tra token và phân quyền. Hai thứ bổ sung nhau.",
          "Keycloak cấp token, Spring kiểm tra token.",
          lambda w: [DIM(S("kc-eye", "kc-q", "kc-tok", "kc-d", "kc-c", "kc-keep", "kc-ver"), 0, 0.07), TYPE("#kc-t1", 0.3, 0.04), IN("#kc-t2", "blur", w("Hai thứ"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 190 + i * 104, 1660, 88, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Code flow", "code qua trình duyệt, token qua server"), ("PKCE", "S256 cho mọi client"),
                                      ("Token", "access cho API, ID cho client"), ("JWT", "chữ ký, alg, exp, iss, aud"),
                                      ("Rotation", "token cũ dùng lại: thu hồi cả nhóm"), ("Keycloak", "cấp token; Spring vẫn kiểm tra")])],
        el("ou-cta", 0, 860, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        B("Tóm lại. Code flow: code đi qua trình duyệt, token đi qua server. P K C E S hai năm sáu cho mọi client. Access token cho A P I, I D token cho client.",
          "Code flow, PKCE, ba loại token.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "left", w("Code flow")), IN("#ou-r1", "left", w("P K C E")), IN("#ou-r2", "left", w("Access token"))]),
        B("Kiểm tra J W T đủ năm thứ và cố định thuật toán. Refresh token xoay vòng, dùng lại là thu hồi cả nhóm. Và key cloak cấp token, nhưng Spring vẫn phải kiểm tra.",
          "JWT, rotation, Keycloak.",
          lambda w: [IN("#ou-r3", "left", w("Kiểm tra")), IN("#ou-r4", "left", w("Refresh token")), IN("#ou-r5", "left", w("Và key cloak"))]),
        B("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
