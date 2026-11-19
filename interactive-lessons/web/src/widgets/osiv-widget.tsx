import { useState } from "react";

/** Same controller touching a lazy collection, called with MockMvc; Spring Boot 3.5 + Hibernate 6.6 (study note 05.07). */
export function OsivWidget() {
  const [on, setOn] = useState(true);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={on ? "on" : ""} onClick={() => setOn(true)}>OSIV bật (mặc định)</button>
        <button className={!on ? "on" : ""} onClick={() => setOn(false)}>spring.jpa.open-in-view=false</button>
      </div>
      <pre className="code">{"@GetMapping(\"/orders/{id}/item-count\")\nint itemCount(@PathVariable Long id) {\n    Order o = orders.findById(id).orElseThrow();   // tx của repository kết thúc ở đây\n    return o.getItems().size();                      // lazy load ở controller\n}"}</pre>
      <div className={`result ${on ? "" : "bad"}`}>
        {on ? "HTTP 200, body 3, 2 query" : "LazyInitializationException"}
        <small>{on
          ? "EntityManager mở suốt request nên query lazy chạy ở controller, ngoài transaction: N+1 ẩn, giữ connection cả request, lỗi bị che. Boot log WARN: spring.jpa.open-in-view is enabled by default."
          : "failed to lazily initialize a collection of role: demo.Order.items: could not initialize proxy - no Session. Sửa đúng: fetch đủ trong service (JOIN FETCH, @EntityGraph) hoặc map sang DTO trong transaction."}</small>
      </div>
    </div>
  );
}
