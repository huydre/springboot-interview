import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Lab 1 - Bonus: key mutable bị "mất" trong HashMap sau khi đổi field.
 * Chạy: java MutableKeyLab.java
 */
public class MutableKeyLab {

    /** Key có equals/hashCode đúng, nhưng field lại có setter: đây là gốc của lỗi. */
    static class Point {
        int x;
        int y;

        Point(int x, int y) { this.x = x; this.y = y; }

        @Override
        public boolean equals(Object o) {
            return o instanceof Point p && p.x == x && p.y == y;
        }

        @Override
        public int hashCode() { return Objects.hash(x, y); }
    }

    /** Sửa: key bất biến. record có field final, không có setter. */
    record ImmutablePoint(int x, int y) { }

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    public static void main(String[] args) {
        Map<Point, String> map = new HashMap<>();
        Point key = new Point(1, 2);
        map.put(key, "shop A");

        key.x = 99; // đổi field sau khi put: hashCode đổi, entry vẫn nằm ở bucket cũ

        System.out.println("size=" + map.size()
                + ", get(key)=" + map.get(key)
                + ", get(new Point(1,2))=" + map.get(new Point(1, 2))
                + ", containsValue=" + map.containsValue("shop A"));
        // get(key): tìm ở bucket mới -> không có. get(1,2): đúng bucket nhưng equals sai.
        check("entry is lost (bug reproduced)",
                map.size() == 1 && map.get(key) == null && map.get(new Point(1, 2)) == null);

        Map<ImmutablePoint, String> safe = new HashMap<>();
        safe.put(new ImmutablePoint(1, 2), "shop A");
        check("immutable key works", "shop A".equals(safe.get(new ImmutablePoint(1, 2))));

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
