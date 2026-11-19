import { useState } from "react";

/** Two inserts where the second violates the primary key, H2 via HikariCP (study note 05.01). */
export function AutocommitWidget() {
  const [manual, setManual] = useState(false);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={!manual ? "on" : ""} onClick={() => setManual(false)}>autocommit mặc định</button>
        <button className={manual ? "on" : ""} onClick={() => setManual(true)}>setAutoCommit(false) + rollback()</button>
      </div>
      <pre className="code">{manual
        ? "c.setAutoCommit(false);\ntry {\n    st.executeUpdate(\"insert into acct values (1, 100)\");\n    st.executeUpdate(\"insert into acct values (1, 200)\"); // trùng khoá\n    c.commit();\n} catch (SQLException e) {\n    c.rollback();\n}"
        : "// getAutoCommit() = true\nst.executeUpdate(\"insert into acct values (1, 100)\");  // commit ngay\nst.executeUpdate(\"insert into acct values (1, 200)\");  // trùng khoá → lỗi"}</pre>
      <div className={`result ${manual ? "good" : "bad"}`}>
        {manual ? "Còn 0 dòng" : "Còn 1 dòng: dữ liệu nửa vời"}
        <small>{manual
          ? "Cả khối rollback. @Transactional chính là Spring làm hộ 3 bước này: tắt autocommit, chạy, commit hoặc rollback."
          : "Mỗi câu SQL là một transaction riêng. Không có @Transactional không có nghĩa là không có transaction: mỗi repo.save() tự là một transaction."}</small>
      </div>
    </div>
  );
}
