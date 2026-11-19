import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;

/**
 * Lab 1 - Bài 3: tái hiện ConcurrentModificationException rồi sửa.
 * Chạy: java ConcurrentModificationLab.java
 */
public class ConcurrentModificationLab {

    static int passed = 0;
    static int failed = 0;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "PASS " : "FAIL ") + name);
    }

    static List<Integer> data() {
        return new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
    }

    public static void main(String[] args) {
        // 1. SAI: list.remove() bên trong for-each (for-each dùng Iterator ngầm)
        List<Integer> list = data();
        try {
            for (Integer n : list) {
                if (n % 2 == 0) list.remove(n); // remove(Object), modCount tăng
            }
            check("for-each + list.remove throws CME", false);
        } catch (ConcurrentModificationException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName()
                    + ", list now = " + list);
            check("for-each + list.remove throws CME", true);
        }

        // 2. Bẫy: xoá phần tử ÁP CHÓT thì KHÔNG ném lỗi nhưng bỏ sót phần tử cuối
        List<Integer> tricky = new ArrayList<>(List.of(1, 2, 3, 4));
        for (Integer n : tricky) {
            if (n == 3) tricky.remove(n); // sau đó hasNext() = false, vòng lặp dừng
        }
        System.out.println("Remove 2nd-to-last, no exception: " + tricky);
        check("remove 2nd-to-last silently skips last element",
                tricky.equals(List.of(1, 2, 4)));

        // 3. SỬA cách 1: removeIf (Java 8+), gọn và an toàn
        List<Integer> a = data();
        a.removeIf(n -> n % 2 == 0);
        check("removeIf -> " + a, a.equals(List.of(1, 3, 5)));

        // 4. SỬA cách 2: Iterator.remove() (dùng khi cần thêm logic trong vòng lặp)
        List<Integer> b = data();
        Iterator<Integer> it = b.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove(); // iterator tự cập nhật expectedModCount
        }
        check("iterator.remove -> " + b, b.equals(List.of(1, 3, 5)));

        // 5. SỬA cách 3: tạo list mới bằng stream (không sửa list gốc)
        List<Integer> c = data().stream().filter(n -> n % 2 != 0).toList();
        check("stream filter -> " + c, c.equals(List.of(1, 3, 5)));

        System.out.println("Result: " + passed + " passed, " + failed + " failed");
    }
}
