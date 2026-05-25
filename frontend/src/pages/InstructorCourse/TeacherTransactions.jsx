import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeacherTransactions, fetchTeacherPaymentSummary } from "../../store";

const TeacherTransactions = () => {
  const dispatch = useDispatch();
  const { teacherTransactions, teacherSummary, loading, error } = useSelector(
    (state) => state.payments,
  );

  useEffect(() => {
    dispatch(fetchTeacherTransactions());
    dispatch(fetchTeacherPaymentSummary());
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Transaction Revenue</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total Transactions</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{teacherSummary?.totalTransactions || 0}</div>
        </div>
        <div style={{ background: "#fff", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Gross Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${(teacherSummary?.grossRevenue || 0).toFixed(2)}</div>
        </div>
        <div style={{ background: "#fff", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Pending Payout</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>${(teacherSummary?.pendingPayouts || 0).toFixed(2)}</div>
        </div>
      </div>

      {loading && <p>Loading transactions...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 10 }}>Reference</th>
              <th style={{ textAlign: "left", padding: 10 }}>Course</th>
              <th style={{ textAlign: "left", padding: 10 }}>Student</th>
              <th style={{ textAlign: "left", padding: 10 }}>Amount</th>
              <th style={{ textAlign: "left", padding: 10 }}>Payout Status</th>
            </tr>
          </thead>
          <tbody>
            {teacherTransactions.map((txn) => (
              <tr key={txn._id}>
                <td style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>{txn.reference}</td>
                <td style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>{txn.courseId?.title || "-"}</td>
                <td style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>{txn.studentId?.name || "-"}</td>
                <td style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>${(txn.amount || 0).toFixed(2)}</td>
                <td style={{ padding: 10, borderTop: "1px solid #f3f4f6" }}>{txn.payoutStatus}</td>
              </tr>
            ))}
            {!loading && teacherTransactions.length === 0 && (
              <tr>
                <td style={{ padding: 14 }} colSpan={5}>
                  No transaction revenue yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherTransactions;
