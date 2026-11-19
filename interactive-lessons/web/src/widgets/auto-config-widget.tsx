import { useState } from "react";

/** A hand-written GreetingAutoConfiguration plus Boot's own Jackson config; outcomes from ConditionEvaluationReport, Boot 3.5 (study note 04.03). */
const CASES: { label: string; result: string; report: string; ok: boolean }[] = [
  {
    label: "app không khai báo gì",
    result: "greet() = \"Hello from STARTER default\"",
    report: "@ConditionalOnMissingBean (types: lab.starter.GreetingService; ...) did not find any beans",
    ok: true,
  },
  {
    label: "app tự khai báo @Bean myGreeting()",
    result: "greet() = \"Hello from MY bean\"",
    report: "@ConditionalOnMissingBean ... found beans of type 'lab.starter.GreetingService' myGreeting",
    ok: true,
  },
  {
    label: "--greeting.enabled=false",
    result: "0 bean GreetingService",
    report: "@ConditionalOnProperty (greeting.enabled=true) found different value in property 'enabled'",
    ok: false,
  },
  {
    label: "app khai báo @Bean ObjectMapper myMapper()",
    result: "1 ObjectMapper tên myMapper",
    report: "JacksonObjectMapperConfiguration#jacksonObjectMapper match=false: found beans of type 'com.fasterxml.jackson.databind.ObjectMapper' myMapper",
    ok: false,
  },
];

export function AutoConfigWidget() {
  const [i, setI] = useState(0);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{i === 3
        ? "@Bean ObjectMapper myMapper() { return new ObjectMapper(); }"
        : "@AutoConfiguration\n@ConditionalOnProperty(prefix = \"greeting\", name = \"enabled\",\n        havingValue = \"true\", matchIfMissing = true)\npublic class GreetingAutoConfiguration {\n    @Bean @ConditionalOnMissingBean\n    GreetingService greetingService() { return () -> \"Hello from STARTER default\"; }\n}"}</pre>
      <div className={`result ${c.ok ? "good" : "bad"}`}>
        {c.result}
        <small>
          --debug: {c.report}
          {i === 3 && <><br />Bean của Boot nhường hẳn, nên mọi spring.jackson.* trong yml không còn áp dụng. Chỉ muốn chỉnh thêm thì khai báo Jackson2ObjectMapperBuilderCustomizer.</>}
        </small>
      </div>
    </div>
  );
}
