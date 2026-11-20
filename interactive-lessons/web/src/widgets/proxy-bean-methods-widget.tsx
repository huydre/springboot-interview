import { useState } from "react";
import { Code } from "../components/code-block";

/** svc() calls repo() directly inside @Configuration; class names and identity checks measured on Spring Boot 3.5 (study note 04.01). */
export function ProxyBeanMethodsWidget() {
  const [full, setFull] = useState(true);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={full ? "on" : ""} onClick={() => setFull(true)}>proxyBeanMethods = true (mặc định)</button>
        <button className={!full ? "on" : ""} onClick={() => setFull(false)}>proxyBeanMethods = false</button>
      </div>
      <Code>{`@Configuration(proxyBeanMethods = ${full})\nclass ${full ? "FullCfg" : "LiteCfg"} {\n    @Bean Repo repo() { return new Repo(); }\n    @Bean Svc svc()   { return new Svc(repo()); }\n}\n\nbean config: ${full ? "FullCfg$$SpringCGLIB$$0" : "LiteCfg"}\nsvc.repo == repo trong context: ${full}`}</Code>
      <div className={`result ${full ? "good" : "bad"}`}>
        {full ? "Một instance Repo" : "Hai instance Repo"}
        <small>{full
          ? "CGLIB subclass chặn lời gọi repo() và trả singleton đã có trong container."
          : "Không có proxy: repo() là method Java thường, chạy new Repo() lần nữa. Auto-configuration của Boot đều dùng false để khởi động nhanh, và lấy phụ thuộc qua tham số: @Bean Svc svc(Repo repo)."}</small>
      </div>
    </div>
  );
}
