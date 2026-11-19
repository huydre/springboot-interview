import { useState } from "react";

const ORDERS = [["book", "pen"], ["cup"], []];

/** orders.stream().map(...) keeps one element per order; flatMap(List::stream) flattens 0..n items each. JDK 21 output. */
export function FlatMapWidget() {
  const [flat, setFlat] = useState(true);
  return (
    <div className="widget">
      <div className="seg">
        <button className={!flat ? "on" : ""} onClick={() => setFlat(false)}>map(Order::getItems)</button>
        <button className={flat ? "on" : ""} onClick={() => setFlat(true)}>flatMap(o -&gt; o.getItems().stream())</button>
      </div>
      <div className="two">
        <div className="panel">
          {ORDERS.map((items, i) => (
            <div key={i} className="chain">
              <small className="muted">đơn {i + 1}</small>
              {items.length ? items.map((it) => <span key={it}>{it}</span>) : <small className="muted">(rỗng)</small>}
            </div>
          ))}
        </div>
        <div className={`result ${flat ? "good" : "warn"}`}>
          {flat ? "[book, pen, cup]" : "[[book, pen], [cup], []]"}
          <small>{flat ? "Stream<String>: mỗi đơn cho 0..n item, rồi làm phẳng; đơn rỗng không đóng góp gì" : "Stream<List<String>>: mỗi đơn vẫn là đúng một phần tử"}</small>
        </div>
      </div>
    </div>
  );
}
