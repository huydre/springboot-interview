export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

/** Interactive widgets, rendered by name in App (see WIDGETS). */
export type WidgetName =
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
  | "saga-run" | "service-auth" | "trace-propagation";

export type Section = {
  id: string;
  title: string;
  /** Scene id in the lesson video; the section plays only that segment. */
  scene?: string;
  intro: string[];
  widget?: WidgetName;
  widgetTitle?: string;
  after?: string[];
  quiz?: QuizQuestion;
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
};
