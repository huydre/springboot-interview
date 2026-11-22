import type { Variant } from "../components/change-impact";
import type { Board } from "../components/info-board";
import type { CheatRow } from "../components/cheat-sheet";
import type { ChoiceItem } from "../components/choice-drill";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

/** Interactive widgets, rendered by name in App (see WIDGETS). */
export type WidgetName =
  | "scan-race" | "btree-search" | "fanout" | "nested-loop" | "pho-map"
  | "bank" | "inherit" | "dispatch" | "gateway" | "classify" | "memory"
  | "point-equals" | "integer-cache" | "hashset" | "string-compare" | "string-builder"
  | "exception-tree" | "transaction-rollback" | "finally" | "resources" | "exception-advice"
  | "hash-index" | "hashmap-put" | "treeify" | "resize" | "mutable-key"
  | "collection-picker" | "list-growth" | "set-order" | "lru-cache" | "fail-fast"
  | "functional-interface" | "method-ref" | "lazy-pipeline" | "sorted-peek" | "flatmap"
  | "tomap-trap" | "grouping-by" | "partition-vs-group" | "collector-drill"
  | "optional-chain" | "orelse-trap" | "parallel-race" | "parallel-fit"
  | "java-version" | "var-check" | "record-play" | "sealed-switch"
  | "memory-place" | "gc-reach" | "oom-match" | "heap-container"
  | "thread-state" | "run-vs-start" | "daemon-ticks" | "submit-vs-execute"
  | "pool-sim" | "reject-policy" | "pool-size"
  | "cf-dashboard" | "cf-error" | "cf-then"
  | "race-counter" | "chm-trap" | "lock-pick"
  | "deadlock-order" | "threadlocal-leak" | "vt-compare"
  | "explain-plan" | "leftmost-prefix" | "covering-index"
  | "join-null" | "rank-functions" | "pagination"
  | "status-code" | "idempotency-key" | "api-compat"
  | "jwt-lab" | "bcrypt-cost" | "cors-preflight"
  | "cache-aside" | "cache-write-race" | "cache-stampede"
  | "kafka-ordering" | "consumer-group" | "delivery-semantics"
  | "test-pyramid" | "mock-spy" | "webmvc-slice"
  | "circular-dep" | "bean-pick" | "proxy-bean-methods"
  | "prototype-scope" | "bean-lifecycle" | "singleton-state"
  | "auto-config" | "startup-events" | "property-precedence"
  | "mvc-trace" | "filter-interceptor-aop" | "mvc-status"
  | "validation-errors" | "proxy-reach" | "async-trace"
  | "autocommit" | "tx-steps" | "proxy-kind"
  | "tx-active" | "rollback-rules" | "tx-group"
  | "propagation-table" | "inner-outer" | "requires-new-pool"
  | "isolation-read" | "lost-update" | "readonly"
  | "batch-tx" | "event-phase" | "test-tx"
  | "merge-persist" | "dirty-check" | "flush-timing"
  | "n-plus-one" | "osiv" | "fetch-trap"
  | "lock-race" | "batch-insert" | "bulk-update"
  | "diagram-rebuild" | "diagram-outcome" | "cache-incident"
  | "recall-cards" | "final-mock"
  | "stateless-check" | "circuit-breaker" | "sd-pick"
  | "estimate-calc" | "base62" | "checkout-guard"
  | "star-builder" | "star-critique" | "say-or-not"
  | "lab1-predict" | "lab-checklist"
  | "stream-queries" | "lab2-trap"
  | "race-runs" | "jstack-read"
  | "order-api" | "conditions-report"
  | "tx-bug-board"
  | "orders-fetch" | "stock-race-lab" | "explain-states"
  | "auth-matrix" | "cache-steps" | "test-slices"
  | "poly-basics" | "overload-drill" | "inherit-basics" | "service-boundary" | "call-chain" | "gateway-filters"
  | "saga-run" | "service-auth" | "trace-propagation"
  | "tell-ask" | "lsp-strategy" | "rental" | "oop-cheatsheet"
  | "srp" | "ocp" | "lsp-solid" | "isp" | "dip" | "solid-cheatsheet"
  | "heap-order" | "composite-ladder" | "sargable-rewrite" | "plan-cache" | "index-write-cost"
  /** SQL-course widgets are found by file name: widgets/sql-<name>-widget.tsx provides widget "sql-<name>". */
  | `sql-${string}`;

/** One task in a SQL lab: the learner edits `starter`, runs it on the T24 bank dataset, and the result is compared with `solution`. */
export type SqlExercise = {
  prompt: string;
  starter: string;
  solution: string;
  hint?: string;
  /** Row order matters when comparing (use for ORDER BY and window ranking tasks). */
  ordered?: boolean;
  /** For INSERT/UPDATE/DELETE tasks: a SELECT run after the learner's statements and after the solution; those two results are compared. */
  verify?: string;
};

export type Section = {
  id: string;
  title: string;
  /** Scene id in the lesson video; the section plays only that segment. */
  scene?: string;
  intro: string[];
  widget?: WidgetName;
  widgetTitle?: string;
  /** A runnable SQL lab with tasks, shown where a widget would be. */
  sql?: SqlExercise[];
  /** Infographic board with numbered, animated cards (InfoBoard), shown after the intro. */
  board?: Board;
  /** Two ways to write the same thing, with the change requests answered side by side. Shown under `widgetTitle`. */
  compare?: [Variant, Variant];
  /** A cheat sheet (idea, one line, and the sentence to say in an interview). */
  cheat?: CheatRow[];
  /** "Which pattern fits?" drill: each item is a situation, `choices` are shared. */
  drill?: { items: ChoiceItem[]; choices: readonly string[]; summary: string };
  after?: string[];
  /** A named pitfall shown as its own callout after the text, so the trap is easy to find and remember. */
  trap?: { title: string; text: string };
  quiz?: QuizQuestion;
  /** A question asked before the widget ("Dự đoán trước khi xem"), so the learner commits to a guess first. Not counted in progress. */
  predict?: QuizQuestion;
  /** Short "what to remember" callout after the text, e.g. a cause-and-effect chain. Each string is one line. */
  takeaway?: { title?: string; lines: string[] };
  /** Follow-up parts shown inside this section under their own heading (h3), each with its own video segment and quiz. */
  parts?: Omit<Section, "parts">[];
};

/** One scene of a rendered lesson video, from the pipeline's timeline.json. */
export type Scene = { id: string; chapter: string; start: number; end: number };

export type Lesson = {
  slug: string;
  /** Short name for the breadcrumb. */
  crumb: string;
  /** Folder of per-scene clips: `${videoDir}/${scene.id}.mp4`. */
  videoDir: string;
  /** Content hash of the clips, appended as ?v= so browsers drop stale copies; written by the pipeline. */
  videoVersion: string;
  scenes: Scene[];
  title: string;
  subtitle: string;
  openingQuiz: QuizQuestion;
  roadmap: string[];
  sections: Section[];
  modelAnswer: string;
  /** Heading of the closing block; the default is the interview answer ("Trả lời mẫu"). A custom title shows modelAnswer as a plain summary. */
  summaryTitle?: string;
  /** Flashcards shown at the end of the lesson: tap a card to see the answer. */
  cards?: { q: string; a: string }[];
  /** LeetCode practice at the end of the lesson, grouped by pattern; each problem has a hint, not a solution. */
  practice?: PracticeGroup[];
};

export type PracticeProblem = { id: number; title: string; slug: string; level: "Easy" | "Medium" | "Hard"; hint: string };
export type PracticeGroup = { title: string; problems: PracticeProblem[] };
