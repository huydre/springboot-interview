import { useEffect, useState, type ReactNode } from "react";
import { courseHome, courseOf, currentLesson, lessons } from "./data/course";
import { Flashcards } from "./components/flashcards";
import { nextLesson, programOfCourse, programs } from "./data/programs";
import { LAST_KEY, progressUnits, quizKey } from "./progress";
import { useTheme } from "./use-theme";
import { ThemeToggle } from "./components/theme-toggle";
import { OnlineCount } from "./components/online-count";
import { AccountButton } from "./components/account-button";
import type { Section, WidgetName } from "./data/types";
import { Quiz } from "./components/quiz";
import { Comments } from "./components/comments";
import { SectionNote } from "./components/section-note";
import { pushSection, pushLastLesson, markStudyDay } from "./lib/cloud-progress";
import { celebrate, celebrateAt } from "./lib/confetti";
import { toast } from "./lib/toast";
import { ProgressRing } from "./components/ui/progress-ring";
import { NumberTicker } from "./components/ui/number-ticker";
import { RichText } from "./components/rich-text";
import { SqlLab } from "./components/sql-lab";
import { VideoClip } from "./components/video-clip";
import { BankWidget } from "./widgets/bank-widget";
import { InheritWidget } from "./widgets/inherit-widget";
import { InheritBasicsWidget } from "./widgets/inherit-basics-widget";
import { PolyBasicsWidget } from "./widgets/poly-basics-widget";
import { OverloadDrillWidget } from "./widgets/overload-drill-widget";
import { DispatchWidget } from "./widgets/dispatch-widget";
import { GatewayWidget } from "./widgets/gateway-widget";
import { ClassifyWidget } from "./widgets/classify-widget";
import { MemoryWidget } from "./widgets/memory-widget";
import { PointEqualsWidget } from "./widgets/point-equals-widget";
import { IntegerCacheWidget } from "./widgets/integer-cache-widget";
import { HashSetWidget } from "./widgets/hashset-widget";
import { StringCompareWidget } from "./widgets/string-compare-widget";
import { StringBuilderWidget } from "./widgets/string-builder-widget";
import { ExceptionTreeWidget } from "./widgets/exception-tree-widget";
import { TransactionRollbackWidget } from "./widgets/transaction-rollback-widget";
import { ScanRaceWidget } from "./widgets/scan-race-widget";
import { BtreeSearchWidget } from "./widgets/btree-search-widget";
import { FanoutWidget } from "./widgets/fanout-widget";
import { FinallyWidget } from "./widgets/finally-widget";
import { ResourcesWidget } from "./widgets/resources-widget";
import { ExceptionAdviceWidget } from "./widgets/exception-advice-widget";
import { HashIndexWidget } from "./widgets/hash-index-widget";
import { HashMapPutWidget } from "./widgets/hashmap-put-widget";
import { TreeifyWidget } from "./widgets/treeify-widget";
import { ResizeWidget } from "./widgets/resize-widget";
import { MutableKeyWidget } from "./widgets/mutable-key-widget";
import { CollectionPickerWidget } from "./widgets/collection-picker-widget";
import { ListGrowthWidget } from "./widgets/list-growth-widget";
import { SetOrderWidget } from "./widgets/set-order-widget";
import { LruCacheWidget } from "./widgets/lru-cache-widget";
import { FailFastWidget } from "./widgets/fail-fast-widget";
import { FunctionalInterfaceWidget } from "./widgets/functional-interface-widget";
import { MethodRefWidget } from "./widgets/method-ref-widget";
import { LazyPipelineWidget } from "./widgets/lazy-pipeline-widget";
import { SortedPeekWidget } from "./widgets/sorted-peek-widget";
import { FlatMapWidget } from "./widgets/flatmap-widget";
import { ToMapTrapWidget } from "./widgets/tomap-trap-widget";
import { GroupingByWidget } from "./widgets/grouping-by-widget";
import { PartitionWidget } from "./widgets/partition-widget";
import { CollectorDrillWidget } from "./widgets/collector-drill-widget";
import { OptionalChainWidget } from "./widgets/optional-chain-widget";
import { OrElseWidget } from "./widgets/orelse-widget";
import { ParallelRaceWidget } from "./widgets/parallel-race-widget";
import { ParallelFitWidget } from "./widgets/parallel-fit-widget";
import { JavaVersionWidget } from "./widgets/java-version-widget";
import { VarCheckWidget } from "./widgets/var-check-widget";
import { RecordPlayWidget } from "./widgets/record-play-widget";
import { SealedSwitchWidget } from "./widgets/sealed-switch-widget";
import { MemoryPlaceWidget } from "./widgets/memory-place-widget";
import { GcReachWidget } from "./widgets/gc-reach-widget";
import { OomMatchWidget } from "./widgets/oom-match-widget";
import { HeapContainerWidget } from "./widgets/heap-container-widget";
import { ThreadStateWidget } from "./widgets/thread-state-widget";
import { RunStartWidget } from "./widgets/run-start-widget";
import { DaemonWidget } from "./widgets/daemon-widget";
import { SubmitExecuteWidget } from "./widgets/submit-execute-widget";
import { PoolSimWidget } from "./widgets/pool-sim-widget";
import { RejectPolicyWidget } from "./widgets/reject-policy-widget";
import { PoolSizeWidget } from "./widgets/pool-size-widget";
import { CfDashboardWidget } from "./widgets/cf-dashboard-widget";
import { CfErrorWidget } from "./widgets/cf-error-widget";
import { CfThenWidget } from "./widgets/cf-then-widget";
import { RaceCounterWidget } from "./widgets/race-counter-widget";
import { ChmTrapWidget } from "./widgets/chm-trap-widget";
import { LockPickWidget } from "./widgets/lock-pick-widget";
import { DeadlockOrderWidget } from "./widgets/deadlock-order-widget";
import { ThreadLocalLeakWidget } from "./widgets/threadlocal-leak-widget";
import { VtCompareWidget } from "./widgets/vt-compare-widget";
import { ExplainPlanWidget } from "./widgets/explain-plan-widget";
import { LeftmostPrefixWidget } from "./widgets/leftmost-prefix-widget";
import { CoveringIndexWidget } from "./widgets/covering-index-widget";
import { JoinNullWidget } from "./widgets/join-null-widget";
import { RankFunctionsWidget } from "./widgets/rank-functions-widget";
import { PaginationWidget } from "./widgets/pagination-widget";
import { StatusCodeWidget } from "./widgets/status-code-widget";
import { IdempotencyKeyWidget } from "./widgets/idempotency-key-widget";
import { ApiCompatWidget } from "./widgets/api-compat-widget";
import { JwtLabWidget } from "./widgets/jwt-lab-widget";
import { BcryptCostWidget } from "./widgets/bcrypt-cost-widget";
import { CorsPreflightWidget } from "./widgets/cors-preflight-widget";
import { CacheAsideWidget } from "./widgets/cache-aside-widget";
import { CacheWriteRaceWidget } from "./widgets/cache-write-race-widget";
import { CacheStampedeWidget } from "./widgets/cache-stampede-widget";
import { KafkaOrderingWidget } from "./widgets/kafka-ordering-widget";
import { ConsumerGroupWidget } from "./widgets/consumer-group-widget";
import { DeliverySemanticsWidget } from "./widgets/delivery-semantics-widget";
import { TestPyramidWidget } from "./widgets/test-pyramid-widget";
import { MockSpyWidget } from "./widgets/mock-spy-widget";
import { WebmvcSliceWidget } from "./widgets/webmvc-slice-widget";
import { CircularDepWidget } from "./widgets/circular-dep-widget";
import { BeanPickWidget } from "./widgets/bean-pick-widget";
import { ProxyBeanMethodsWidget } from "./widgets/proxy-bean-methods-widget";
import { PrototypeScopeWidget } from "./widgets/prototype-scope-widget";
import { BeanLifecycleWidget } from "./widgets/bean-lifecycle-widget";
import { SingletonStateWidget } from "./widgets/singleton-state-widget";
import { AutoConfigWidget } from "./widgets/auto-config-widget";
import { StartupEventsWidget } from "./widgets/startup-events-widget";
import { PropertyPrecedenceWidget } from "./widgets/property-precedence-widget";
import { MvcTraceWidget } from "./widgets/mvc-trace-widget";
import { FilterInterceptorAopWidget } from "./widgets/filter-interceptor-aop-widget";
import { MvcStatusWidget } from "./widgets/mvc-status-widget";
import { ValidationErrorsWidget } from "./widgets/validation-errors-widget";
import { ProxyReachWidget } from "./widgets/proxy-reach-widget";
import { AsyncTraceWidget } from "./widgets/async-trace-widget";
import { AutocommitWidget } from "./widgets/autocommit-widget";
import { TxStepsWidget } from "./widgets/tx-steps-widget";
import { ProxyKindWidget } from "./widgets/proxy-kind-widget";
import { TxActiveWidget } from "./widgets/tx-active-widget";
import { RollbackRulesWidget } from "./widgets/rollback-rules-widget";
import { TxGroupWidget } from "./widgets/tx-group-widget";
import { PropagationTableWidget } from "./widgets/propagation-table-widget";
import { InnerOuterWidget } from "./widgets/inner-outer-widget";
import { RequiresNewPoolWidget } from "./widgets/requires-new-pool-widget";
import { IsolationReadWidget } from "./widgets/isolation-read-widget";
import { LostUpdateWidget } from "./widgets/lost-update-widget";
import { ReadonlyWidget } from "./widgets/readonly-widget";
import { BatchTxWidget } from "./widgets/batch-tx-widget";
import { EventPhaseWidget } from "./widgets/event-phase-widget";
import { TestTxWidget } from "./widgets/test-tx-widget";
import { MergePersistWidget } from "./widgets/merge-persist-widget";
import { DirtyCheckWidget } from "./widgets/dirty-check-widget";
import { FlushTimingWidget } from "./widgets/flush-timing-widget";
import { NPlusOneWidget } from "./widgets/n-plus-one-widget";
import { OsivWidget } from "./widgets/osiv-widget";
import { FetchTrapWidget } from "./widgets/fetch-trap-widget";
import { LockRaceWidget } from "./widgets/lock-race-widget";
import { BatchInsertWidget } from "./widgets/batch-insert-widget";
import { BulkUpdateWidget } from "./widgets/bulk-update-widget";
import { DiagramRebuildWidget } from "./widgets/diagram-rebuild-widget";
import { DiagramOutcomeWidget } from "./widgets/diagram-outcome-widget";
import { CacheIncidentWidget } from "./widgets/cache-incident-widget";
import { RecallCardsWidget } from "./widgets/recall-cards-widget";
import { FinalMockWidget } from "./widgets/final-mock-widget";
import { StatelessCheckWidget } from "./widgets/stateless-check-widget";
import { CircuitBreakerWidget } from "./widgets/circuit-breaker-widget";
import { SdPickWidget } from "./widgets/sd-pick-widget";
import { ServiceBoundaryWidget } from "./widgets/service-boundary-widget";
import { CallChainWidget } from "./widgets/call-chain-widget";
import { GatewayFiltersWidget } from "./widgets/gateway-filters-widget";
import { SagaRunWidget } from "./widgets/saga-run-widget";
import { ServiceAuthWidget } from "./widgets/service-auth-widget";
import { TracePropagationWidget } from "./widgets/trace-propagation-widget";
import { EstimateCalcWidget } from "./widgets/estimate-calc-widget";
import { Base62Widget } from "./widgets/base62-widget";
import { CheckoutGuardWidget } from "./widgets/checkout-guard-widget";
import { StarBuilderWidget } from "./widgets/star-builder-widget";
import { StarCritiqueWidget } from "./widgets/star-critique-widget";
import { SayOrNotWidget } from "./widgets/say-or-not-widget";
import { Lab1PredictWidget } from "./widgets/lab1-predict-widget";
import { LabChecklistWidget } from "./widgets/lab-checklist-widget";
import { StreamQueriesWidget } from "./widgets/stream-queries-widget";
import { Lab2TrapWidget } from "./widgets/lab2-trap-widget";
import { RaceRunsWidget } from "./widgets/race-runs-widget";
import { JstackReadWidget } from "./widgets/jstack-read-widget";
import { OrderApiWidget } from "./widgets/order-api-widget";
import { ConditionsReportWidget } from "./widgets/conditions-report-widget";
import { TxBugBoardWidget } from "./widgets/tx-bug-board-widget";
import { OrdersFetchWidget } from "./widgets/orders-fetch-widget";
import { StockRaceLabWidget } from "./widgets/stock-race-lab-widget";
import { ExplainStatesWidget } from "./widgets/explain-states-widget";
import { AuthMatrixWidget } from "./widgets/auth-matrix-widget";
import { CacheStepsWidget } from "./widgets/cache-steps-widget";
import { TestSlicesWidget } from "./widgets/test-slices-widget";
import { TellAskWidget } from "./widgets/tell-ask-widget";
import { LspStrategyWidget } from "./widgets/lsp-strategy-widget";
import { RentalWidget } from "./widgets/rental-widget";
import { OopCheatsheetWidget } from "./widgets/oop-cheatsheet-widget";
import { SrpWidget } from "./widgets/srp-widget";
import { OcpWidget } from "./widgets/ocp-widget";
import { LspSolidWidget } from "./widgets/lsp-solid-widget";
import { IspWidget } from "./widgets/isp-widget";
import { ChangeImpact } from "./components/change-impact";
import { CheatSheet } from "./components/cheat-sheet";
import { InfoBoard } from "./components/info-board";
import { ChoiceDrill } from "./components/choice-drill";
import { DipWidget } from "./widgets/dip-widget";
import { SolidCheatsheetWidget } from "./widgets/solid-cheatsheet-widget";

const WIDGETS: Record<Exclude<WidgetName, `sql-${string}`>, () => ReactNode> = {
  bank: () => <BankWidget />,
  inherit: () => <InheritWidget />,
  "inherit-basics": () => <InheritBasicsWidget />,
  "poly-basics": () => <PolyBasicsWidget />,
  "overload-drill": () => <OverloadDrillWidget />,
  "tell-ask": () => <TellAskWidget />,
  "lsp-strategy": () => <LspStrategyWidget />,
  rental: () => <RentalWidget />,
  "oop-cheatsheet": () => <OopCheatsheetWidget />,
  srp: () => <SrpWidget />,
  ocp: () => <OcpWidget />,
  "lsp-solid": () => <LspSolidWidget />,
  isp: () => <IspWidget />,
  dip: () => <DipWidget />,
  "solid-cheatsheet": () => <SolidCheatsheetWidget />,
  dispatch: () => <DispatchWidget />,
  gateway: () => <GatewayWidget />,
  classify: () => <ClassifyWidget />,
  memory: () => <MemoryWidget />,
  "point-equals": () => <PointEqualsWidget />,
  "integer-cache": () => <IntegerCacheWidget />,
  hashset: () => <HashSetWidget />,
  "string-compare": () => <StringCompareWidget />,
  "string-builder": () => <StringBuilderWidget />,
  "exception-tree": () => <ExceptionTreeWidget />,
  "transaction-rollback": () => <TransactionRollbackWidget />,
  "scan-race": () => <ScanRaceWidget />,
  "btree-search": () => <BtreeSearchWidget />,
  "fanout": () => <FanoutWidget />,
  finally: () => <FinallyWidget />,
  resources: () => <ResourcesWidget />,
  "exception-advice": () => <ExceptionAdviceWidget />,
  "hash-index": () => <HashIndexWidget />,
  "hashmap-put": () => <HashMapPutWidget />,
  treeify: () => <TreeifyWidget />,
  resize: () => <ResizeWidget />,
  "mutable-key": () => <MutableKeyWidget />,
  "collection-picker": () => <CollectionPickerWidget />,
  "list-growth": () => <ListGrowthWidget />,
  "set-order": () => <SetOrderWidget />,
  "lru-cache": () => <LruCacheWidget />,
  "fail-fast": () => <FailFastWidget />,
  "functional-interface": () => <FunctionalInterfaceWidget />,
  "method-ref": () => <MethodRefWidget />,
  "lazy-pipeline": () => <LazyPipelineWidget />,
  "sorted-peek": () => <SortedPeekWidget />,
  flatmap: () => <FlatMapWidget />,
  "tomap-trap": () => <ToMapTrapWidget />,
  "grouping-by": () => <GroupingByWidget />,
  "partition-vs-group": () => <PartitionWidget />,
  "collector-drill": () => <CollectorDrillWidget />,
  "optional-chain": () => <OptionalChainWidget />,
  "orelse-trap": () => <OrElseWidget />,
  "parallel-race": () => <ParallelRaceWidget />,
  "parallel-fit": () => <ParallelFitWidget />,
  "java-version": () => <JavaVersionWidget />,
  "var-check": () => <VarCheckWidget />,
  "record-play": () => <RecordPlayWidget />,
  "sealed-switch": () => <SealedSwitchWidget />,
  "memory-place": () => <MemoryPlaceWidget />,
  "gc-reach": () => <GcReachWidget />,
  "oom-match": () => <OomMatchWidget />,
  "heap-container": () => <HeapContainerWidget />,
  "thread-state": () => <ThreadStateWidget />,
  "run-vs-start": () => <RunStartWidget />,
  "daemon-ticks": () => <DaemonWidget />,
  "submit-vs-execute": () => <SubmitExecuteWidget />,
  "pool-sim": () => <PoolSimWidget />,
  "reject-policy": () => <RejectPolicyWidget />,
  "pool-size": () => <PoolSizeWidget />,
  "cf-dashboard": () => <CfDashboardWidget />,
  "cf-error": () => <CfErrorWidget />,
  "cf-then": () => <CfThenWidget />,
  "race-counter": () => <RaceCounterWidget />,
  "chm-trap": () => <ChmTrapWidget />,
  "lock-pick": () => <LockPickWidget />,
  "deadlock-order": () => <DeadlockOrderWidget />,
  "threadlocal-leak": () => <ThreadLocalLeakWidget />,
  "vt-compare": () => <VtCompareWidget />,
  "explain-plan": () => <ExplainPlanWidget />,
  "leftmost-prefix": () => <LeftmostPrefixWidget />,
  "covering-index": () => <CoveringIndexWidget />,
  "join-null": () => <JoinNullWidget />,
  "rank-functions": () => <RankFunctionsWidget />,
  "pagination": () => <PaginationWidget />,
  "status-code": () => <StatusCodeWidget />,
  "idempotency-key": () => <IdempotencyKeyWidget />,
  "api-compat": () => <ApiCompatWidget />,
  "jwt-lab": () => <JwtLabWidget />,
  "bcrypt-cost": () => <BcryptCostWidget />,
  "cors-preflight": () => <CorsPreflightWidget />,
  "cache-aside": () => <CacheAsideWidget />,
  "cache-write-race": () => <CacheWriteRaceWidget />,
  "cache-stampede": () => <CacheStampedeWidget />,
  "kafka-ordering": () => <KafkaOrderingWidget />,
  "consumer-group": () => <ConsumerGroupWidget />,
  "delivery-semantics": () => <DeliverySemanticsWidget />,
  "test-pyramid": () => <TestPyramidWidget />,
  "mock-spy": () => <MockSpyWidget />,
  "webmvc-slice": () => <WebmvcSliceWidget />,
  "circular-dep": () => <CircularDepWidget />,
  "bean-pick": () => <BeanPickWidget />,
  "proxy-bean-methods": () => <ProxyBeanMethodsWidget />,
  "prototype-scope": () => <PrototypeScopeWidget />,
  "bean-lifecycle": () => <BeanLifecycleWidget />,
  "singleton-state": () => <SingletonStateWidget />,
  "auto-config": () => <AutoConfigWidget />,
  "startup-events": () => <StartupEventsWidget />,
  "property-precedence": () => <PropertyPrecedenceWidget />,
  "mvc-trace": () => <MvcTraceWidget />,
  "filter-interceptor-aop": () => <FilterInterceptorAopWidget />,
  "mvc-status": () => <MvcStatusWidget />,
  "validation-errors": () => <ValidationErrorsWidget />,
  "proxy-reach": () => <ProxyReachWidget />,
  "async-trace": () => <AsyncTraceWidget />,
  "autocommit": () => <AutocommitWidget />,
  "tx-steps": () => <TxStepsWidget />,
  "proxy-kind": () => <ProxyKindWidget />,
  "tx-active": () => <TxActiveWidget />,
  "rollback-rules": () => <RollbackRulesWidget />,
  "tx-group": () => <TxGroupWidget />,
  "propagation-table": () => <PropagationTableWidget />,
  "inner-outer": () => <InnerOuterWidget />,
  "requires-new-pool": () => <RequiresNewPoolWidget />,
  "isolation-read": () => <IsolationReadWidget />,
  "lost-update": () => <LostUpdateWidget />,
  "readonly": () => <ReadonlyWidget />,
  "batch-tx": () => <BatchTxWidget />,
  "event-phase": () => <EventPhaseWidget />,
  "test-tx": () => <TestTxWidget />,
  "merge-persist": () => <MergePersistWidget />,
  "dirty-check": () => <DirtyCheckWidget />,
  "flush-timing": () => <FlushTimingWidget />,
  "n-plus-one": () => <NPlusOneWidget />,
  "osiv": () => <OsivWidget />,
  "fetch-trap": () => <FetchTrapWidget />,
  "lock-race": () => <LockRaceWidget />,
  "batch-insert": () => <BatchInsertWidget />,
  "bulk-update": () => <BulkUpdateWidget />,
  "diagram-rebuild": () => <DiagramRebuildWidget />,
  "diagram-outcome": () => <DiagramOutcomeWidget />,
  "cache-incident": () => <CacheIncidentWidget />,
  "recall-cards": () => <RecallCardsWidget />,
  "final-mock": () => <FinalMockWidget />,
  "stateless-check": () => <StatelessCheckWidget />,
  "circuit-breaker": () => <CircuitBreakerWidget />,
  "sd-pick": () => <SdPickWidget />,
  "service-boundary": () => <ServiceBoundaryWidget />,
  "call-chain": () => <CallChainWidget />,
  "gateway-filters": () => <GatewayFiltersWidget />,
  "saga-run": () => <SagaRunWidget />,
  "service-auth": () => <ServiceAuthWidget />,
  "trace-propagation": () => <TracePropagationWidget />,
  "estimate-calc": () => <EstimateCalcWidget />,
  "base62": () => <Base62Widget />,
  "checkout-guard": () => <CheckoutGuardWidget />,
  "star-builder": () => <StarBuilderWidget />,
  "star-critique": () => <StarCritiqueWidget />,
  "say-or-not": () => <SayOrNotWidget />,
  "lab1-predict": () => <Lab1PredictWidget />,
  "lab-checklist": () => <LabChecklistWidget />,
  "stream-queries": () => <StreamQueriesWidget />,
  "lab2-trap": () => <Lab2TrapWidget />,
  "race-runs": () => <RaceRunsWidget />,
  "jstack-read": () => <JstackReadWidget />,
  "order-api": () => <OrderApiWidget />,
  "conditions-report": () => <ConditionsReportWidget />,
  "tx-bug-board": () => <TxBugBoardWidget />,
  "orders-fetch": () => <OrdersFetchWidget />,
  "stock-race-lab": () => <StockRaceLabWidget />,
  "explain-states": () => <ExplainStatesWidget />,
  "auth-matrix": () => <AuthMatrixWidget />,
  "cache-steps": () => <CacheStepsWidget />,
  "test-slices": () => <TestSlicesWidget />,
};

const lesson = currentLesson();
const course = courseOf(lesson.slug);
const program = programOfCourse(course.id);
const programHref = `?khoa=${program.id}`;
const next = nextLesson(lesson.slug);
const { sections } = lesson;
const units = progressUnits(sections);
const sceneById = (id: string) => lesson.scenes.find((s) => s.id === id);
const posterOf = (id: string) => `/posters/${lesson.slug}/${id}.jpg`;
const clipOf = (id: string) => `${lesson.videoDir}/${id}.mp4?v=${lesson.videoVersion}`;
const PROGRESS_KEY = quizKey(lesson.slug);
localStorage.setItem(LAST_KEY, lesson.slug);
void pushLastLesson(lesson.slug);
// The page shows the video in pieces: the opening scene up top, one scene per section, the closing recap at the end.
const intro = lesson.scenes[0];
const recap = lesson.scenes.at(-1);
const secondsOf = (s: { start: number; end: number }) => Math.round(s.end - s.start);
const tocIds = ["overview", ...sections.map((s) => s.id)];
document.title = `${lesson.title} · InterviewLab`;

// Widgets of the SQL course are picked up by file name (widgets/sql-<name>-widget.tsx -> "sql-<name>"), so lesson authors never edit this file.
const sqlModules = import.meta.glob<Record<string, () => ReactNode>>("./widgets/sql-*-widget.tsx", { eager: true });
const SQL_WIDGETS: Record<string, () => ReactNode> = Object.fromEntries(
  Object.entries(sqlModules).map(([path, mod]) => [path.replace("./widgets/", "").replace("-widget.tsx", ""), Object.values(mod)[0]]),
);
const renderWidget = (name: WidgetName): ReactNode => (name.startsWith("sql-") ? SQL_WIDGETS[name]?.() ?? null : WIDGETS[name as keyof typeof WIDGETS]());

/** Highlights the section currently in view (scroll spy for the right-hand table of contents). */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

/** Lesson prose: one paragraph per line; consecutive lines starting with "- " become one bullet list. */
function Prose({ lines }: { lines: string[] }) {
  const blocks: (string | string[])[] = [];
  for (const l of lines) {
    if (l.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (Array.isArray(last)) last.push(l.slice(2));
      else blocks.push([l.slice(2)]);
    } else blocks.push(l);
  }
  return (
    <>
      {blocks.map((b, i) =>
        Array.isArray(b) ? (
          <ul key={i} className="prose-list">{b.map((t) => <li key={t}><RichText text={t} /></li>)}</ul>
        ) : (
          <p key={i}><RichText text={b} /></p>
        ),
      )}
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [solved, setSolved] = useState<Record<string, boolean>>(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"));
  const active = useActiveSection(tocIds);

  const markQuiz = (id: string) => (ok: boolean) => {
    const next = { ...solved, [id]: ok || solved[id] };
    setSolved(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    void markStudyDay();
    if (!ok) return;
    void pushSection(lesson.slug, id, true);
    const done = (m: Record<string, boolean>) => units.every((x) => m[x.id]);
    if (done(next) && !done(solved)) {
      celebrate("big");
      toast.success("Hoàn thành bài học!", `Bạn đã trả lời đúng cả ${units.length} phần của bài này.`);
    } else if (!solved[id]) {
      celebrateAt(document.getElementById(id)?.querySelector(".quiz") ?? null);
    }
  };
  const solvedCount = units.filter((s) => solved[s.id]).length;
  /** Video segment, text, interactive parts, trap and quiz of a section or of one of its follow-up parts. */
  const renderBody = (s: Omit<Section, "parts">) => {
    const scene = s.scene ? sceneById(s.scene) : undefined;
    const notes = (
      <>
        {s.after && <Prose lines={s.after} />}
        {s.trap && <div className="trap"><strong>Bẫy: <RichText text={s.trap.title} /></strong><p><RichText text={s.trap.text} /></p></div>}
      </>
    );
    return (
      <>
        {scene && <VideoClip src={clipOf(scene.id)} poster={posterOf(scene.id)} label={`Đoạn video: ${scene.chapter}`} />}
        <Prose lines={s.intro} />
        {s.predict && <Quiz key={`predict-${s.id}`} quiz={s.predict} title="Dự đoán trước khi xem" />}
        {s.board && <InfoBoard board={s.board} />}
        {s.widget && (
          <div className="widget-wrap">
            <h4 className="widget-title">{s.widgetTitle}</h4>
            {renderWidget(s.widget)}
          </div>
        )}
        {(s.compare || s.cheat || s.drill) && (
          <div className="widget-wrap">
            {s.widgetTitle && <h4 className="widget-title">{s.widgetTitle}</h4>}
            {s.compare && <ChangeImpact variants={s.compare} />}
            {s.cheat && <CheatSheet rows={s.cheat} />}
            {s.drill && <ChoiceDrill {...s.drill} />}
          </div>
        )}
        {/* SQL exercises come last, so the explanation and the trap they rely on are read before them. */}
        {s.sql && notes}
        {s.sql && (
          <div className="widget-wrap">
            <h4 className="widget-title">{s.widgetTitle ?? "Thực hành SQL trên dữ liệu T24"}</h4>
            <SqlLab exercises={s.sql} />
          </div>
        )}
        {!s.sql && notes}
        {s.takeaway && (
          <div className="takeaway">
            <strong>{s.takeaway.title ?? "Điều rút ra"}</strong>
            {s.takeaway.lines.map((l) => <p key={l}><RichText text={l} /></p>)}
          </div>
        )}
        {s.quiz && <Quiz quiz={s.quiz} onAnswered={markQuiz(s.id)} />}
      </>
    );
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
        <a className="back-roadmap" href={programHref}>
          <span aria-hidden="true">←</span> {programs.length > 1 ? program.title : "Lộ trình học"}
        </a>
        <h2>{course.title}</h2>
        <div className="progress-card ring-card">
          <ProgressRing value={solvedCount / units.length} size={58} stroke={7} tone={solvedCount === units.length ? "var(--green)" : "var(--accent)"} label={`Đã đúng ${solvedCount} trên ${units.length} quiz`}>
            <b>{Math.round((solvedCount / units.length) * 100)}%</b>
          </ProgressRing>
          <div>
            <span>Tiến độ quiz</span>
            <strong><NumberTicker value={solvedCount} />/{units.length} phần</strong>
          </div>
        </div>
        <nav>
          {course.lessons.map((l) => (
            <a key={l.slug} className={`lesson-link ${l.slug === lesson.slug ? "active" : ""} ${lessons[l.slug] ? "" : "locked"}`} href={lessons[l.slug] ? `?bai=${l.slug}` : undefined} onClick={() => setMenuOpen(false)}>
              <span>{l.title}</span>
              {!lessons[l.slug] && <small>sắp có</small>}
            </a>
          ))}
        </nav>
      </aside>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="icon-btn menu" aria-label="Mở menu bài học" onClick={() => setMenuOpen(true)}>☰</button>
          <nav className="crumbs">
            <a className="crumb-program" href={programHref}>{program.title}</a><i className="crumb-sep crumb-program">›</i><a href={courseHome(course)}>{course.crumb}</a><i className="crumb-sep">›</i><b>{lesson.crumb}</b>
          </nav>
          <OnlineCount />
        <ThemeToggle theme={theme} setTheme={setTheme} />
          <AccountButton />
        </header>

        <article>
          <section id="overview">
            <h1>{lesson.title}</h1>
            <p className="lead">{lesson.subtitle}</p>
            {intro && <VideoClip src={clipOf(intro.id)} poster={posterOf("overview")} label="Video mở đầu" />}
            <Quiz quiz={lesson.openingQuiz} />
            <h2>Lộ trình bài học</h2>
            <ol className="roadmap">
              {lesson.roadmap.map((r) => <li key={r}><RichText text={r} /></li>)}
            </ol>
          </section>

          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              {renderBody(s)}
              {s.parts?.map((p) => (
                <div key={p.id} id={p.id} className="sub-part">
                  <h3>{p.title}</h3>
                  {renderBody(p)}
                </div>
              ))}
              <SectionNote lessonSlug={lesson.slug} sectionId={s.id} />
            </section>
          ))}

          <footer className="end">
            {recap && recap !== intro && (
              <>
                <h2>Tổng kết</h2>
                <VideoClip src={clipOf(recap.id)} poster={posterOf(recap.id)} label={`Tổng kết (${secondsOf(recap)} giây)`} />
              </>
            )}
            <h2>{lesson.summaryTitle ?? "Trả lời mẫu (~60 giây)"}</h2>
            <blockquote>{lesson.summaryTitle ? lesson.modelAnswer : `"${lesson.modelAnswer}"`}</blockquote>
            {lesson.cards && (
              <>
                <h2>Thẻ ôn nhanh</h2>
                <Flashcards cards={lesson.cards} />
              </>
            )}
            <Comments lessonSlug={lesson.slug} sections={units.map((x) => ({ id: x.id, title: x.title }))} />
            {next ? <a className="next-lesson" href={`?bai=${next.slug}`}>Bài tiếp theo: {next.title} →</a> : <a className="next-lesson" href={programHref}>Về lộ trình {program.title} →</a>}
          </footer>
        </article>
      </main>

      <nav className="toc" aria-label="Mục lục">
        {tocIds.map((id, i) => (
          <a key={id} href={`#${id}`} className={active === id ? "on" : ""} title={i === 0 ? "Tổng quan" : sections[i - 1].title}>
            <i />
            <span>{i === 0 ? "Tổng quan" : `Phần ${i}`}{i > 0 && solved[id] ? " ✓" : ""}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
