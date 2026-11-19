import java.util.*;
import java.util.function.Supplier;
import java.util.stream.*;

import static java.util.stream.Collectors.*;

/**
 * Lab 2: 20 truy vấn Stream trên 50 Employee (dữ liệu cố định, chạy lần nào cũng như nhau).
 * Chạy: java StreamQueriesLab.java
 * Cách luyện: xoá thân một method qNN, tự viết lại, chạy để xem PASS/FAIL.
 */
public class StreamQueriesLab {

    /** salary tính bằng triệu VND; email có thể null; projects có thể rỗng. */
    record Employee(int id, String name, String dept, int salary, int age,
                    String city, String email, List<String> projects) { }

    static Employee e(int id, String name, String dept, int salary, int age,
                      String city, String email, String projects) {
        List<String> p = projects.isEmpty() ? List.of() : List.of(projects.split(","));
        return new Employee(id, name, dept, salary, age, city, email, p);
    }

    static final List<Employee> EMPLOYEES = List.of(
        e(1, "Vu Dung", "SALES", 31, 44, "HN", "dung1@corp.vn", "Order,Mobile"),
        e(2, "Do Mai", "FINANCE", 42, 32, "HCM", "mai2@corp.vn", "CRM,Search"),
        e(3, "Pham Ha", "IT", 44, 29, "HN", "ha3@corp.vn", "Mobile,CRM"),
        e(4, "Bui Khanh", "HR", 29, 24, "HN", "khanh4@corp.vn", "CRM"),
        e(5, "Le Nam", "IT", 35, 23, "DN", null, "Report,CRM"),
        e(6, "Vu Trang", "MARKETING", 23, 41, "HCM", "trang6@corp.vn", "Payment,Search"),
        e(7, "Hoang Nam", "IT", 44, 43, "HN", null, "CRM,Report,Mobile"),
        e(8, "Hoang Trang", "SALES", 26, 43, "HCM", null, "CRM,Order"),
        e(9, "Ngo Dung", "HR", 25, 23, "HN", "dung9@corp.vn", "Search"),
        e(10, "Pham Long", "HR", 22, 37, "HN", "long10@corp.vn", "Report,CRM"),
        e(11, "Le Mai", "MARKETING", 39, 39, "HCM", "mai11@corp.vn", "Search"),
        e(12, "Dang Hoa", "FINANCE", 22, 24, "HN", "hoa12@corp.vn", "Order,Payment,Mobile"),
        e(13, "Ngo Ha", "HR", 18, 31, "HN", null, "CRM,Report"),
        e(14, "Ngo Lan", "IT", 26, 44, "DN", "lan14@corp.vn", "Search,Payment,Mobile"),
        e(15, "Do Long", "IT", 34, 34, "HCM", null, "Mobile,Payment,Order"),
        e(16, "Tran Hieu", "MARKETING", 26, 27, "HN", "hieu16@corp.vn", ""),
        e(17, "Tran An", "SALES", 32, 26, "DN", null, "Report"),
        e(18, "Nguyen Chi", "IT", 49, 28, "DN", "chi18@corp.vn", "CRM,Search,Report"),
        e(19, "Bui Dung", "SALES", 17, 37, "HCM", "dung19@corp.vn", "Payment"),
        e(20, "Le Dung", "MARKETING", 35, 32, "DN", "dung20@corp.vn", "Order,Report,Payment"),
        e(21, "Pham Ngoc", "MARKETING", 23, 26, "DN", "ngoc21@corp.vn", ""),
        e(22, "Do Khanh", "SALES", 34, 24, "DN", "khanh22@corp.vn", "CRM,Order"),
        e(23, "Vu Viet", "MARKETING", 19, 39, "DN", "viet23@corp.vn", "Search"),
        e(24, "Pham Son", "IT", 47, 28, "HN", "son24@corp.vn", "Order,Search,Mobile"),
        e(25, "Vu Tuan", "FINANCE", 18, 22, "HCM", "tuan25@corp.vn", "Search"),
        e(26, "Ngo Linh", "SALES", 28, 45, "HCM", "linh26@corp.vn", "Payment"),
        e(27, "Pham Dung", "HR", 17, 37, "HN", "dung27@corp.vn", "Report,Search"),
        e(28, "Nguyen Nam", "IT", 42, 33, "DN", null, "Payment,Mobile,Order"),
        e(29, "Bui Ha", "FINANCE", 31, 42, "HCM", null, "Mobile,Search,Report"),
        e(30, "Tran Tuan", "SALES", 19, 27, "HN", null, "Mobile,Order"),
        e(31, "Ngo Son", "FINANCE", 33, 43, "HCM", "son31@corp.vn", "Order,Payment"),
        e(32, "Nguyen Tuan", "IT", 42, 25, "DN", "tuan32@corp.vn", "Mobile"),
        e(33, "Pham Hieu", "MARKETING", 12, 30, "HN", "hieu33@corp.vn", "Report"),
        e(34, "Vu Huy", "SALES", 31, 35, "HN", null, "CRM,Mobile,Report"),
        e(35, "Do Giang", "HR", 27, 26, "DN", "giang35@corp.vn", "Order,Report"),
        e(36, "Nguyen Viet", "IT", 47, 26, "HN", null, "Search,Payment"),
        e(37, "Do Binh", "IT", 32, 43, "DN", "binh37@corp.vn", "Payment,Report"),
        e(38, "Nguyen Hoa", "IT", 28, 30, "HN", "hoa38@corp.vn", "Mobile,Report"),
        e(39, "Tran Minh", "HR", 20, 41, "DN", "minh39@corp.vn", "Search"),
        e(40, "Hoang Minh", "MARKETING", 28, 39, "HCM", "minh40@corp.vn", "Search"),
        e(41, "Do Huy", "FINANCE", 35, 28, "HCM", null, ""),
        e(42, "Dang Minh", "SALES", 24, 24, "DN", "minh42@corp.vn", ""),
        e(43, "Pham Thao", "IT", 31, 25, "HN", "thao43@corp.vn", "Search,CRM,Order"),
        e(44, "Hoang Giang", "FINANCE", 32, 29, "DN", "giang44@corp.vn", "Mobile,Order"),
        e(45, "Dang Ngoc", "IT", 34, 32, "HCM", "ngoc45@corp.vn", "Payment"),
        e(46, "Vu An", "IT", 32, 39, "HCM", "an46@corp.vn", ""),
        e(47, "Dang Lan", "FINANCE", 34, 41, "HCM", "lan47@corp.vn", ""),
        e(48, "Tran Hoa", "SALES", 42, 25, "HN", "hoa48@corp.vn", ""),
        e(49, "Le Huy", "IT", 46, 26, "HCM", "huy49@corp.vn", "CRM,Mobile,Order"),
        e(50, "Do Ngoc", "SALES", 32, 37, "DN", "ngoc50@corp.vn", "Payment")
    );

    static final String TEXT = """
            Spring Boot makes Java easy. Java and Spring work well together.
            Learn Java streams, learn Spring transactions, then learn Spring Boot testing.
            """;

    // ===== Mức 1: Dễ =====

    /** Q01. Số nhân viên mỗi phòng (sắp theo tên phòng). */
    static Object q01() {
        return EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, TreeMap::new, counting()));
    }

    /** Q02. Tên nhân viên phòng IT ở Hà Nội (HN), sắp xếp A-Z. */
    static Object q02() {
        return EMPLOYEES.stream()
                .filter(x -> x.dept().equals("IT") && x.city().equals("HN"))
                .map(Employee::name)
                .sorted()
                .toList();
    }

    /** Q03. Tổng quỹ lương của cả công ty. */
    static Object q03() {
        return EMPLOYEES.stream().mapToInt(Employee::salary).sum();
    }

    /** Q04. Người lương cao nhất (tên). */
    static Object q04() {
        return EMPLOYEES.stream()
                .max(Comparator.comparingInt(Employee::salary))
                .map(Employee::name)
                .orElse("N/A");
    }

    /** Q05. Có ai dưới 23 tuổi không? Mọi người đều lương >= 15 không? */
    static Object q05() {
        boolean anyUnder23 = EMPLOYEES.stream().anyMatch(x -> x.age() < 23);
        boolean allAtLeast15 = EMPLOYEES.stream().allMatch(x -> x.salary() >= 15);
        return anyUnder23 + "," + allAtLeast15;
    }

    /** Q06. Top 3 lương cao nhất toàn công ty: "tên=lương"; hoà lương thì theo id. */
    static Object q06() {
        return EMPLOYEES.stream()
                .sorted(Comparator.comparingInt(Employee::salary).reversed()
                        .thenComparingInt(Employee::id))
                .limit(3)
                .map(x -> x.name() + "=" + x.salary())
                .toList();
    }

    // ===== Mức 2: Trung bình =====

    /** Q07. Lương trung bình mỗi phòng, làm tròn 2 chữ số. */
    static Object q07() {
        Map<String, Double> avg = EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, TreeMap::new,
                        averagingInt(Employee::salary)));
        avg.replaceAll((k, v) -> Math.round(v * 100) / 100.0);
        return avg;
    }

    /** Q08. Mức lương cao thứ 2 (khác mức cao nhất). */
    static Object q08() {
        return EMPLOYEES.stream()
                .map(Employee::salary)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .skip(1)
                .findFirst()
                .orElseThrow();
    }

    /** Q09. Chia 2 nhóm lương >= 30 và < 30, đếm mỗi nhóm. */
    static Object q09() {
        return EMPLOYEES.stream()
                .collect(partitioningBy(x -> x.salary() >= 30, counting()));
    }

    /** Q10. Map phòng -> lương cao nhất bằng toMap + hàm merge. */
    static Object q10() {
        return EMPLOYEES.stream()
                .collect(toMap(Employee::dept, Employee::salary, Math::max, TreeMap::new));
    }

    /** Q11. Danh sách tên phòng HR nối bằng ", " theo id tăng dần. */
    static Object q11() {
        return EMPLOYEES.stream()
                .filter(x -> x.dept().equals("HR"))
                .map(Employee::name)
                .collect(joining(", ", "[", "]"));
    }

    /** Q12. Tất cả project khác nhau, sắp A-Z (flatMap). */
    static Object q12() {
        return EMPLOYEES.stream()
                .flatMap(x -> x.projects().stream())
                .distinct()
                .sorted()
                .toList();
    }

    /** Q13. Mỗi project có bao nhiêu người tham gia. */
    static Object q13() {
        return EMPLOYEES.stream()
                .flatMap(x -> x.projects().stream())
                .collect(groupingBy(p -> p, TreeMap::new, counting()));
    }

    /** Q14. Tần suất từ trong TEXT (không phân biệt hoa thường), 3 từ nhiều nhất. */
    static Object q14() {
        return Arrays.stream(TEXT.toLowerCase().split("\\W+"))
                .filter(w -> !w.isBlank())
                .collect(groupingBy(w -> w, counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(3)
                .map(en -> en.getKey() + "=" + en.getValue())
                .toList();
    }

    /** Q15. Email của id 4, id 5 (email null) và id 999 (không tồn tại); thiếu thì "N/A". */
    static Object q15() {
        return findEmail(4) + "," + findEmail(5) + "," + findEmail(999);
    }

    static String findEmail(int id) {
        return EMPLOYEES.stream()
                .filter(x -> x.id() == id)
                .findFirst()
                .map(Employee::email)      // email null -> Optional rỗng, không NPE
                .orElse("N/A");
    }

    // ===== Mức 3: Khó =====

    /** Q16. Top 3 lương cao nhất MỖI phòng (tên), hoà lương thì theo id. */
    static Object q16() {
        Comparator<Employee> bySalaryDesc = Comparator.comparingInt(Employee::salary)
                .reversed().thenComparingInt(Employee::id);
        return EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, TreeMap::new,
                        collectingAndThen(toList(), list -> list.stream()
                                .sorted(bySalaryDesc)
                                .limit(3)
                                .map(Employee::name)
                                .toList())));
    }

    /** Q17. Người lương cao nhất mỗi phòng: maxBy trả Optional, bóc bằng collectingAndThen. */
    static Object q17() {
        return EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, TreeMap::new,
                        collectingAndThen(maxBy(Comparator.comparingInt(Employee::salary)),
                                opt -> opt.map(Employee::name).orElse("N/A"))));
    }

    /** Q18. Một lần duyệt: lương thấp nhất và cao nhất (teeing, Java 12+). */
    static Object q18() {
        Comparator<Employee> bySalary = Comparator.comparingInt(Employee::salary);
        return EMPLOYEES.stream()
                .collect(teeing(
                        minBy(bySalary),
                        maxBy(bySalary),
                        (min, max) -> "min=" + min.orElseThrow().salary()
                                + ",max=" + max.orElseThrow().salary()));
    }

    /** Q19. Phòng có lương trung bình cao nhất. */
    static Object q19() {
        return EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, averagingInt(Employee::salary)))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    /** Q20. Số người có lương cao hơn trung bình CỦA PHÒNG MÌNH, theo phòng. */
    static Object q20() {
        Map<String, Double> avgByDept = EMPLOYEES.stream()
                .collect(groupingBy(Employee::dept, averagingInt(Employee::salary)));
        return EMPLOYEES.stream()
                .filter(x -> x.salary() > avgByDept.get(x.dept()))
                .collect(groupingBy(Employee::dept, TreeMap::new, counting()));
    }

    // ===== Bộ chấm điểm =====

    static final String[][] EXPECTED = {
            {"q01", "{FINANCE=8, HR=7, IT=16, MARKETING=8, SALES=11}"},
            {"q02", "[Hoang Nam, Nguyen Hoa, Nguyen Viet, Pham Ha, Pham Son, Pham Thao]"},
            {"q03", "1539"},
            {"q04", "Nguyen Chi"},
            {"q05", "true,false"},
            {"q06", "[Nguyen Chi=49, Pham Son=47, Nguyen Viet=47]"},
            {"q07", "{FINANCE=30.88, HR=22.57, IT=38.31, MARKETING=25.63, SALES=28.73}"},
            {"q08", "47"},
            {"q09", "{false=22, true=28}"},
            {"q10", "{FINANCE=42, HR=29, IT=49, MARKETING=39, SALES=42}"},
            {"q11", "[Bui Khanh, Ngo Dung, Pham Long, Ngo Ha, Pham Dung, Do Giang, "
                    + "Tran Minh]"},
            {"q12", "[CRM, Mobile, Order, Payment, Report, Search]"},
            {"q13", "{CRM=13, Mobile=15, Order=14, Payment=13, Report=14, Search=15}"},
            {"q14", "[spring=4, java=3, learn=3]"},
            {"q15", "khanh4@corp.vn,N/A,N/A"},
            {"q16", "{FINANCE=[Do Mai, Do Huy, Dang Lan], HR=[Bui Khanh, Do Giang, "
                    + "Ngo Dung], IT=[Nguyen Chi, Pham Son, Nguyen Viet], MARKETING=[Le Mai, "
                    + "Le Dung, Hoang Minh], SALES=[Tran Hoa, Do Khanh, Tran An]}"},
            {"q17", "{FINANCE=Do Mai, HR=Bui Khanh, IT=Nguyen Chi, MARKETING=Le Mai, "
                    + "SALES=Tran Hoa}"},
            {"q18", "min=12,max=49"},
            {"q19", "IT"},
            {"q20", "{FINANCE=6, HR=3, IT=8, MARKETING=4, SALES=6}"},
    };

    public static void main(String[] args) {
        List<Supplier<Object>> queries = List.of(
                StreamQueriesLab::q01, StreamQueriesLab::q02, StreamQueriesLab::q03,
                StreamQueriesLab::q04, StreamQueriesLab::q05, StreamQueriesLab::q06,
                StreamQueriesLab::q07, StreamQueriesLab::q08, StreamQueriesLab::q09,
                StreamQueriesLab::q10, StreamQueriesLab::q11, StreamQueriesLab::q12,
                StreamQueriesLab::q13, StreamQueriesLab::q14, StreamQueriesLab::q15,
                StreamQueriesLab::q16, StreamQueriesLab::q17, StreamQueriesLab::q18,
                StreamQueriesLab::q19, StreamQueriesLab::q20);
        int passed = 0;
        for (int i = 0; i < queries.size(); i++) {
            String actual;
            try {
                actual = String.valueOf(queries.get(i).get());
            } catch (RuntimeException ex) { // query lỗi vẫn chấm tiếp các câu sau
                actual = ex.toString();
            }
            boolean ok = actual.equals(EXPECTED[i][1]);
            if (ok) passed++;
            System.out.println((ok ? "PASS " : "FAIL ") + EXPECTED[i][0] + " -> " + actual);
            if (!ok) System.out.println("     expected: " + EXPECTED[i][1]);
        }
        System.out.println("Result: " + passed + "/" + queries.size() + " passed");
    }
}
