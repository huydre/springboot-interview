import { useEffect } from "react";
import "./styles/practice.css";
import { useTheme } from "./use-theme";
import { ThemeToggle } from "./components/theme-toggle";
import { SearchButton } from "./components/command-search";
import { AccountButton } from "./components/account-button";
import { StreakTile } from "./components/streak-tile";
import { DAILY_SIZE, dueCount, todayDeck } from "./lib/review-deck";
import { ReviewSession } from "./practice/review-session";
import { MockInterview } from "./practice/mock-interview";
import { SdGuided } from "./practice/sd-guided";
import { QuestionBank } from "./practice/question-bank";

/** Practice modes, opened with `?luyen=<mode>`. */
const MODES = {
  "on-tap": { title: "Ôn tập mỗi ngày", blurb: `${DAILY_SIZE} câu mỗi ngày theo lịch giãn cách: câu từng sai hỏi lại trước, câu đúng được giãn ra 1, 2, 4, 7, 15, 30 ngày.`, view: ReviewSession },
  "mock": { title: "Mock interview bấm giờ", blurb: "Chọn một chặng, trả lời 5 câu ngẫu nhiên có giới hạn thời gian, nhận báo cáo chỗ yếu kèm link học lại.", view: MockInterview },
  "sd": { title: "System design từng bước", blurb: "5 đề kinh điển: URL shortener, chat, news feed, payment, ticket booking. Đi qua yêu cầu, entity, API, kiến trúc, deep dive; tự chấm theo rubric.", view: SdGuided },
  "cau-hoi": { title: "Câu hỏi hay gặp", blurb: "Mọi câu hỏi mở trong các bài, gom theo chặng, lọc được theo từ khoá.", view: QuestionBank },
} as const;
type Mode = keyof typeof MODES;

function Hub() {
  const deck = todayDeck();
  const left = deck.ids.length - Object.keys(deck.results).length;
  return (
    <>
      <div className="pr-grid">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <a key={m} className="rm-card pr-mode" href={`?luyen=${m}`}>
            <h3>{MODES[m].title}</h3>
            <p className="rm-blurb">{MODES[m].blurb}</p>
            {m === "on-tap" && <small className="pr-badge">{left > 0 ? `Hôm nay còn ${left} câu` : "Hôm nay đã ôn xong"}{dueCount() > 0 ? ` · ${dueCount()} câu đến hạn` : ""}</small>}
          </a>
        ))}
      </div>
      <StreakTile />
    </>
  );
}

/** The practice area: a hub of modes, each mode on its own URL so the browser back button works. */
export default function PracticePage() {
  const [theme, setTheme] = useTheme();
  const mode = new URLSearchParams(location.search).get("luyen") as Mode | "";
  const m = mode && mode in MODES ? MODES[mode as Mode] : null;
  const title = m?.title ?? "Luyện tập";
  useEffect(() => { document.title = `${title} · InterviewLab`; }, [title]);
  const View = m?.view;

  return (
    <div className="rm-page pr-page">
      <header className="rm-top">
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <SearchButton />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <AccountButton />
      </header>
      <section className="rm-hero pr-hero">
        <nav className="pr-crumbs">
          <a href="?khoa=java-interview">Java Interview</a> <span aria-hidden="true">›</span> {m ? <a href="?luyen">Luyện tập</a> : <b>Luyện tập</b>}
          {m && <> <span aria-hidden="true">›</span> <b>{m.title}</b></>}
        </nav>
        <h1>{title}</h1>
        <p className="lead">{m ? m.blurb : "Học xong phải nói ra được. Bốn cách luyện, tất cả tính vào chuỗi ngày học."}</p>
      </section>
      <main className="pr-main">{View ? <View /> : <Hub />}</main>
    </div>
  );
}
