import { useState } from "react";

/** persist, merge and save on new or detached entities; Hibernate 6.6 + PostgreSQL 16 (study note 05.06). */
const CASES: { label: string; code: string; lines: string[]; bad: boolean; why: string }[] = [
  {
    label: "persist(new)",
    code: "Customer c = new Customer(\"New\");\nem.persist(c);",
    lines: ["em.contains(c) = true", "c.getId() != null = true", "INSERT chưa chạy (id lấy từ sequence)"],
    bad: false,
    why: "Object truyền vào trở thành managed. INSERT chờ tới flush.",
  },
  {
    label: "merge(detached)",
    code: "Customer managed = em.merge(detached);\ndetached.setName(\"ignored\");",
    lines: ["managed == detached: false", "contains(detached) = false, contains(managed) = true", "Tên trong DB sau commit: vẫn X"],
    bad: true,
    why: "merge trả về một bản managed khác. Sửa object cũ thì bị bỏ qua: luôn dùng giá trị trả về.",
  },
  {
    label: "save(Tag(\"java\")) id tự gán",
    code: "tagRepo.save(new Tag(\"java\"));   // @Id không có @GeneratedValue",
    lines: ["select t1_0.code from tag t1_0 where t1_0.code=?", "insert into tag (code) values (?)"],
    bad: true,
    why: "Id khác null nên isNew() = false, save gọi merge và merge SELECT trước: 2 câu SQL cho một entity mới. Sửa bằng Persistable<ID> hoặc field @Version.",
  },
  {
    label: "persist(detached)",
    code: "em.persist(detached);",
    lines: ["EntityExistsException: detached entity passed to persist: demo.Customer"],
    bad: true,
    why: "Hay gặp khi gán id thủ công cho entity @GeneratedValue, hoặc cascade PERSIST tới entity con đã có id.",
  },
  {
    label: "remove(detached)",
    code: "em.remove(detached);",
    lines: ["IllegalArgumentException: Removing a detached instance demo.Customer#1"],
    bad: true,
    why: "Load lại hoặc merge trước. repo.delete() của Spring Data tự làm việc đó.",
  },
  {
    label: "setName trên detached",
    code: "Customer d = customers.findById(id).orElseThrow();   // tx của repo đã đóng\ntx().executeWithoutResult(s -> d.setName(\"Dung\"));",
    lines: ["Số UPDATE: 0"],
    bad: true,
    why: "Đứng trong transaction cũng không có tác dụng: object không thuộc persistence context của transaction này.",
  },
];

export function MergePersistWidget() {
  const [i, setI] = useState(1);
  const c = CASES[i];
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <pre className="code">{c.code}</pre>
      <ul className="log">
        {c.lines.map((l) => <li key={l} className={c.bad ? "err" : "ok"}>{l}</li>)}
      </ul>
      <p className="muted">{c.why}</p>
    </div>
  );
}
