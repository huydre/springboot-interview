import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Lab 1 - Bài 1: LRU cache bằng LinkedHashMap(accessOrder = true) + removeEldestEntry.
 * Chay: java LruCacheLab.java
 */
public class LruCacheLab {

    /** LRU cache: vượt capacity thì xoá phần tử lâu nhất không được truy cập. */
    static class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;

        LruCache(int capacity) {
            // accessOrder = true: get()/put() key đã có sẽ đưa key xuống cuối danh sách
            super(16, 0.75f, true);
            this.capacity = capacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            // Được gọi sau mỗi put(); trả true thì LinkedHashMap tự xoá phần tử đầu
            return size() > capacity;
        }
    }

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    public static void main(String[] args) {
        // Test 1: vượt capacity thì xoá phần tử cũ nhất
        LruCache<String, Integer> c = new LruCache<>(3);
        c.put("A", 1); c.put("B", 2); c.put("C", 3);
        c.put("D", 4);
        check("evict eldest: " + c.keySet(), !c.containsKey("A") && c.size() == 3);

        // Test 2: get() làm key "trẻ lại", nên key khác bị xoá
        c = new LruCache<>(3);
        c.put("A", 1); c.put("B", 2); c.put("C", 3);
        c.get("A");          // thứ tự truy cập: B, C, A
        c.put("D", 4);       // B là lâu nhất -> bị xoá
        check("get refreshes key: " + c.keySet(),
                c.containsKey("A") && !c.containsKey("B"));

        // Test 3: put() đè lên key cũ cũng tính là truy cập, không tăng size
        c = new LruCache<>(3);
        c.put("A", 1); c.put("B", 2); c.put("C", 3);
        c.put("A", 100);     // thứ tự: B, C, A
        c.put("D", 4);
        check("put existing refreshes: " + c.keySet(),
                c.get("A") == 100 && !c.containsKey("B") && c.size() == 3);

        // Test 4: containsKey() KHÔNG tính là truy cập (không đổi thứ tự)
        c = new LruCache<>(2);
        c.put("A", 1); c.put("B", 2);
        c.containsKey("A");
        c.put("C", 3);
        check("containsKey does not refresh: " + c.keySet(), !c.containsKey("A"));

        // Test 5: quên accessOrder (mặc định false) thì chỉ là FIFO
        LinkedHashMap<String, Integer> fifo = new LinkedHashMap<>(16, 0.75f, false) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Integer> e) {
                return size() > 3;
            }
        };
        fifo.put("A", 1); fifo.put("B", 2); fifo.put("C", 3);
        fifo.get("A");
        fifo.put("D", 4);
        check("accessOrder=false is FIFO: " + fifo.keySet(), !fifo.containsKey("A"));

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
