import { useState } from "react";
import { Code } from "../components/code-block";

// Output of this exact code, run on JDK 21.
const CODE = `class Animal {
  void eat()   { print("Animal.eat: đang ăn"); }
  void speak() { print("Animal.speak: ..."); }
}

class Dog extends Animal {          // Dog kế thừa Animal
  void bark()  { print("Dog.bark: Gâu gâu"); }
  @Override
  void speak() {                    // viết đè speak() của cha
    super.speak();                  // gọi lại bản của cha
    print("Dog.speak: Gâu");
  }
}

class Cat extends Animal { }        // không viết thêm gì`;

type Call = { code: string; out: string[]; who: string; why: string; error?: boolean };

const CALLS: Call[] = [
  { code: "dog.eat()", out: ["Animal.eat: đang ăn"], who: "Chạy code của Animal", why: "Dog không tự viết eat(), nên dùng bản thừa hưởng từ Animal. Đây là lợi ích chính của kế thừa: không phải chép lại code." },
  { code: "dog.bark()", out: ["Dog.bark: Gâu gâu"], who: "Chạy code của Dog", why: "bark() là đồ riêng của Dog. Class con có thể thêm method mà class cha không có." },
  { code: "dog.speak()", out: ["Animal.speak: ...", "Dog.speak: Gâu"], who: "Chạy code của Dog, và Dog gọi tiếp code của Animal", why: "Dog viết đè (override) speak() nên Java chạy bản của Dog trước. Bên trong có super.speak() nên bản của Animal chạy luôn. Bỏ dòng super.speak() thì dòng đầu sẽ không in." },
  { code: "cat.eat()", out: ["Animal.eat: đang ăn"], who: "Chạy code của Animal", why: "Cat rỗng nhưng vẫn ăn được, vì thừa hưởng toàn bộ method của Animal." },
  { code: "cat.bark()", out: ["Lỗi biên dịch: Cat không có method bark()"], who: "Không chạy được", why: "bark() là của riêng Dog. Hai class con của cùng một cha không chia sẻ đồ riêng cho nhau.", error: true },
];

/** Call methods on Dog and Cat and see whose code runs: inherited, own, overridden, or missing. */
export function InheritBasicsWidget() {
  const [picked, setPicked] = useState<number | null>(null);
  const c = picked === null ? null : CALLS[picked];
  return (
    <div className="widget">
      <Code>{CODE}</Code>
      <p className="muted">Giả sử đã có <code>Dog dog = new Dog();</code> và <code>Cat cat = new Cat();</code>. Bấm một lời gọi để xem điều gì xảy ra:</p>
      <div className="seg small">
        {CALLS.map((x, i) => <button key={x.code} className={picked === i ? "on" : ""} onClick={() => setPicked(i)}>{x.code}</button>)}
      </div>
      {c && (
        <div className={`result ${c.error ? "bad" : "good"}`}>
          {c.out.map((l) => <div key={l}>{l}</div>)}
          <small><b>{c.who}.</b> {c.why}</small>
        </div>
      )}
    </div>
  );
}
