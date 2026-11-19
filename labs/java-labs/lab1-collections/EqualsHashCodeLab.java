import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Lab 1 - Bài 2: override equals() nhưng quên hashCode() rồi cho vào HashSet.
 * Chạy: java EqualsHashCodeLab.java
 */
public class EqualsHashCodeLab {

    /** LỖI: có equals() theo email nhưng KHÔNG override hashCode(). */
    static class BrokenUser {
        final String email;

        BrokenUser(String email) { this.email = email; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof BrokenUser other)) return false;
            return email.equals(other.email);
        }
        // hashCode() vẫn là của Object: mỗi object một giá trị khác nhau
    }

    /** ĐÃ SỬA: equals() và hashCode() dùng cùng một tập field. */
    static class FixedUser {
        final String email;

        FixedUser(String email) { this.email = email; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof FixedUser other)) return false;
            return email.equals(other.email);
        }

        @Override
        public int hashCode() { return Objects.hash(email); }
    }

    /** Cách gọn nhất từ Java 16: record tự sinh equals/hashCode theo mọi component. */
    record UserRecord(String email) { }

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    public static void main(String[] args) {
        BrokenUser b1 = new BrokenUser("an@mail.com");
        BrokenUser b2 = new BrokenUser("an@mail.com");
        Set<BrokenUser> broken = new HashSet<>();
        broken.add(b1);
        broken.add(b2);
        System.out.println("Broken: equals=" + b1.equals(b2)
                + ", sameHash=" + (b1.hashCode() == b2.hashCode())
                + ", size=" + broken.size()
                + ", contains(new)=" + broken.contains(new BrokenUser("an@mail.com")));
        // Quan sát lỗi: 2 object "bằng nhau" nhưng Set giữ cả 2 và không tìm thấy bản mới
        check("broken set keeps duplicate (bug reproduced)", broken.size() == 2);

        Set<FixedUser> fixed = new HashSet<>();
        fixed.add(new FixedUser("an@mail.com"));
        fixed.add(new FixedUser("an@mail.com"));
        System.out.println("Fixed:  size=" + fixed.size()
                + ", contains(new)=" + fixed.contains(new FixedUser("an@mail.com")));
        check("fixed set has 1 element",
                fixed.size() == 1 && fixed.contains(new FixedUser("an@mail.com")));

        Set<UserRecord> records = new HashSet<>();
        records.add(new UserRecord("an@mail.com"));
        records.add(new UserRecord("an@mail.com"));
        check("record set has 1 element", records.size() == 1);

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
