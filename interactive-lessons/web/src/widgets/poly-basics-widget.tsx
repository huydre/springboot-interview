import { useState } from "react";

type Kind = "Dog" | "Cat" | "Animal" | "Bird";

// Output of this exact loop, run on JDK 21.
const SPEAK: Record<Kind, string> = { Dog: "Dog: Gâu gâu", Cat: "Cat: Meo meo", Animal: "Animal: ...", Bird: "Bird: Chíp chíp" };

const CLASSES = `class Animal { void speak() { print("Animal: ..."); } }
class Dog  extends Animal { @Override void speak() { print("Dog: Gâu gâu"); } }
class Cat  extends Animal { @Override void speak() { print("Cat: Meo meo"); } }
class Bird extends Animal { @Override void speak() { print("Bird: Chíp chíp"); } }`;

/** A zoo of Animal variables holding different real objects: one loop, each object runs its own speak(). */
export function PolyBasicsWidget() {
  const [zoo, setZoo] = useState<Kind[]>(["Dog", "Cat"]);
  const [ran, setRan] = useState(false);
  const add = (k: Kind) => { setZoo((z) => [...z, k]); setRan(false); };
  const items = zoo.map((k) => `new ${k}()`).join(", ");
  return (
    <div className="widget">
      <pre className="code">{CLASSES}</pre>
      <p className="muted">Thêm các con vật vào danh sách. Biến trong vòng lặp luôn có kiểu <code>Animal</code>, nhưng object thật bên trong thì khác nhau:</p>
      <div className="seg small">
        {(["Dog", "Cat", "Animal", "Bird"] as Kind[]).map((k) => <button key={k} onClick={() => add(k)}>+ new {k}()</button>)}
        <button onClick={() => { setZoo([]); setRan(false); }}>xoá hết</button>
      </div>
      <pre className="code">{`List<Animal> zoo = List.of(${items});\nfor (Animal a : zoo) {\n  a.speak();      // cùng một dòng code\n}`}</pre>
      <div className="actions">
        <button className="btn primary" disabled={!zoo.length} onClick={() => setRan(true)}>Chạy</button>
      </div>
      {ran && (
        <div className="result good">
          {zoo.map((k, i) => <div key={i}>{SPEAK[k]}</div>)}
          <small>Dòng <code>a.speak()</code> chỉ viết một lần, nhưng mỗi object chạy <code>speak()</code> của chính nó. Thêm <code>Bird</code> không phải sửa vòng lặp. Đó là đa hình.</small>
        </div>
      )}
    </div>
  );
}
