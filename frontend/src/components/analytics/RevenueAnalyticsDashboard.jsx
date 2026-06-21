import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRevenueOverview,
  fetchRevenueTrend,
  fetchRevenueByTeacher,
  fetchRevenueByStudent,
  fetchRevenueByCourse,
  fetchWeeklyPayoutPreview,
  releaseWeeklyPayouts,
} from "../../store";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const RevenueAnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { revenueOverview, revenueTrend, revenueByTeacher, revenueByStudent, revenueByCourse, loading, error } =
    useSelector((state) => state.analytics);
  const { weeklyPayoutPreview, lastPayoutRelease, loading: paymentsLoading } =
    useSelector((state) => state.payments);

  const [preset, setPreset] = useState("30");
  const [groupBy, setGroupBy] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryParams = useMemo(() => {
    if (preset === "custom" && startDate && endDate) {
      return { startDate, endDate };
    }
    return { days: parseInt(preset, 10) || 30 };
  }, [preset, startDate, endDate]);

  useEffect(() => {
    if (preset === "custom" && (!startDate || !endDate)) return;
    dispatch(fetchRevenueOverview(queryParams));
    dispatch(fetchRevenueTrend({ ...queryParams, groupBy }));
    dispatch(fetchRevenueByTeacher({ ...queryParams, limit: 10 }));
    dispatch(fetchRevenueByStudent({ ...queryParams, limit: 10 }));
    dispatch(fetchRevenueByCourse({ ...queryParams, limit: 10 }));
    dispatch(fetchWeeklyPayoutPreview());
  }, [dispatch, queryParams, groupBy, preset, startDate, endDate]);

  const handleReleaseWeeklyPayouts = async () => {
    const result = await dispatch(releaseWeeklyPayouts());
    if (releaseWeeklyPayouts.fulfilled.match(result)) {
      dispatch(fetchWeeklyPayoutPreview());
      dispatch(fetchRevenueOverview(queryParams));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1rem" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>Revenue Analytics</h1>
        <p style={{ color: "#64748b" }}>Profit and transaction breakdown by student, course, instructor, and time.</p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <select value={preset} onChange={(e) => setPreset(e.target.value)} className="status-filter">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 1 year</option>
          <option value="custom">Custom dates</option>
        </select>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="status-filter">
          <option value="day">Group by day</option>
          <option value="month">Group by month</option>
          <option value="year">Group by year</option>
        </select>
        {preset === "custom" && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="status-filter" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="status-filter" />
          </>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="metrics-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green"><div className="stat-content"><h3>Gross Revenue</h3><p className="stat-value">${(revenueOverview?.grossRevenue || 0).toFixed(2)}</p></div></div>
        <div className="stat-card blue"><div className="stat-content"><h3>Net Revenue</h3><p className="stat-value">${(revenueOverview?.netRevenue || 0).toFixed(2)}</p></div></div>
        <div className="stat-card purple"><div className="stat-content"><h3>Platform Profit</h3><p className="stat-value">${(revenueOverview?.platformProfit || 0).toFixed(2)}</p></div></div>
        <div className="stat-card orange"><div className="stat-content"><h3>Transactions</h3><p className="stat-value">{revenueOverview?.totalTransactions || 0}</p></div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Revenue Time Series</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="grossRevenue" stroke="#10b981" fill="#d1fae5" name="Gross" />
              <Area dataKey="netRevenue" stroke="#3b82f6" fill="#dbeafe" name="Net" />
              <Area dataKey="platformProfit" stroke="#8b5cf6" fill="#ede9fe" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Transactions Count Time Series</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueTrend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="transactionCount" fill="#f59e0b" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Profit by Instructor</h2>
        <div className="table-card">
          <table className="analytics-table">
            <thead><tr><th>Instructor</th><th>Net Revenue</th><th>Platform Profit</th><th>Transactions</th></tr></thead>
            <tbody>
              {(revenueByTeacher || []).map((r) => (
                <tr key={r.teacherId}><td>{r.teacherName}</td><td>${r.netRevenue.toFixed(2)}</td><td>${r.platformProfit.toFixed(2)}</td><td>{r.totalTransactions}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Weekly Instructor Payouts</h2>
          <button
            type="button"
            onClick={handleReleaseWeeklyPayouts}
            disabled={paymentsLoading || !weeklyPayoutPreview?.length}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "0.65rem 1rem",
              background: "#0f172a",
              color: "white",
              fontWeight: 700,
              cursor: paymentsLoading || !weeklyPayoutPreview?.length ? "not-allowed" : "pointer",
              opacity: paymentsLoading || !weeklyPayoutPreview?.length ? 0.55 : 1,
            }}
          >
            Release Due Payouts
          </button>
        </div>
        {lastPayoutRelease?.batches?.length > 0 && (
          <p style={{ color: "#047857", fontWeight: 600 }}>
            Released {lastPayoutRelease.batches.length} weekly payout batch(es).
          </p>
        )}
        <div className="table-card">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Due Amount</th>
                <th>Transactions</th>
                <th>Currency</th>
                <th>Next Due</th>
              </tr>
            </thead>
            <tbody>
              {(weeklyPayoutPreview || []).map((payout) => (
                <tr key={payout.teacherId}>
                  <td>{payout.teacherName}</td>
                  <td>${(payout.instructorAmount || 0).toFixed(2)}</td>
                  <td>{payout.transactionCount}</td>
                  <td>{payout.currency}</td>
                  <td>{payout.nextDueAt ? new Date(payout.nextDueAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
              {(!weeklyPayoutPreview || weeklyPayoutPreview.length === 0) && (
                <tr>
                  <td colSpan={5}>No instructor payouts are due yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Profit by Course</h2>
        <div className="table-card">
          <table className="analytics-table">
            <thead><tr><th>Course</th><th>Subject</th><th>Net Revenue</th><th>Platform Profit</th><th>Transactions</th></tr></thead>
            <tbody>
              {(revenueByCourse || []).map((r) => (
                <tr key={r.courseId}><td>{r.courseTitle}</td><td>{r.subject}</td><td>${r.netRevenue.toFixed(2)}</td><td>${r.platformProfit.toFixed(2)}</td><td>{r.totalTransactions}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Profit by Student</h2>
        <div className="table-card">
          <table className="analytics-table">
            <thead><tr><th>Student</th><th>Email</th><th>Net Revenue</th><th>Platform Profit</th><th>Transactions</th></tr></thead>
            <tbody>
              {(revenueByStudent || []).map((r) => (
                <tr key={r.studentId}><td>{r.studentName}</td><td>{r.studentEmail}</td><td>${r.netRevenue.toFixed(2)}</td><td>${r.platformProfit.toFixed(2)}</td><td>{r.totalTransactions}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p>Loading revenue analytics...</p>}
    </div>
  );
};

export default RevenueAnalyticsDashboard;
