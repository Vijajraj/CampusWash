import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import StatusBadge from "../../components/StatusBadge";
import { getReports, resolveReport, getUsersList, updateUserRole } from "../../api/moderation";
import { showToast } from "../../hooks/useBorrow";
import { ArrowLeft, Shield, AlertTriangle, Users } from "lucide-react";
import HeaderActions from "../../components/HeaderActions";

export default function ModerationQueue() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active tab state: "reports" or "users"
  const [activeTab, setActiveTab] = useState("reports");

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Redirect if not moderator or admin
  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "moderator" && user.role !== "admin")) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  // Load Reports
  const loadReports = async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const res = await getReports(statusFilter, reportsPage);
      setReports(res.items || []);
      setReportsTotalPages(res.total_pages || 1);
    } catch (err) {
      setReportsError(err.message || "Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await getUsersList(usersPage);
      setUsers(res.items || []);
      setUsersTotalPages(res.total_pages || 1);
    } catch (err) {
      setUsersError(err.message || "Failed to load users list");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "moderator" || user.role === "admin")) {
      if (activeTab === "reports") {
        loadReports();
      } else {
        loadUsers();
      }
    }
  }, [activeTab, reportsPage, usersPage, statusFilter, user]);

  const handleResolve = async (reportId, action) => {
    try {
      await resolveReport(reportId, action);
      showToast(`Report marked as ${action}`);
      loadReports();
    } catch (err) {
      showToast(err.message || "Failed to resolve report");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showToast("User role updated successfully");
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to update user role");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-sans">
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 bg-border animate-pulse rounded w-1/3 mx-auto"></div>
          <div className="h-24 bg-border animate-pulse rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 border border-border rounded-lg text-text-muted hover:text-text hover:bg-bg transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xl font-bold text-primary flex items-center gap-2">
            <Shield size={20} className="text-accent" />
            <span>Moderation Desk</span>
          </span>
        </div>

        <HeaderActions />
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10">
        
        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-border mb-8">
          <button
            onClick={() => {
              setActiveTab("reports");
              setReportsPage(1);
            }}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "reports"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <AlertTriangle size={16} />
            <span>Reports Queue</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setUsersPage(1);
            }}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Users size={16} />
            <span>User Management</span>
          </button>
        </div>

        {/* Tab Content: Reports */}
        {activeTab === "reports" && (
          <section className="space-y-6">
            {/* Status Filter Bar */}
            <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 shadow-sm w-fit">
              <span className="text-xs font-semibold text-text-muted uppercase">Status:</span>
              {["pending", "resolved", "dismissed"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setReportsPage(1);
                  }}
                  className={`py-1 px-3 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-primary text-surface"
                      : "text-text-muted hover:bg-bg hover:text-text"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {reportsError && (
              <div className="p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
                {reportsError}
              </div>
            )}

            {reportsLoading ? (
              /* Skeleton Loader */
              <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-border animate-pulse rounded w-full"></div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 bg-surface border border-border rounded-xl shadow-sm">
                <p className="text-sm text-text-muted">No reports in this queue.</p>
              </div>
            ) : (
              /* Table Layout */
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-muted font-semibold">
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Target Type</th>
                      <th className="p-4">Preview</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b border-border hover:bg-bg/10 transition-colors">
                        <td className="p-4 font-medium text-text">
                          {report.reporter_email || report.reporter_id}
                        </td>
                        <td className="p-4 text-text-muted max-w-xs truncate" title={report.reason}>
                          {report.reason}
                        </td>
                        <td className="p-4 capitalize text-text font-medium">
                          {report.target_type.replace("_", " ")}
                        </td>
                        <td className="p-4 text-xs text-text-muted max-w-xs truncate">
                          {report.target_preview
                            ? report.target_preview.title || report.target_preview.name || JSON.stringify(report.target_preview)
                            : "Item deleted"}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="p-4 text-right">
                          {report.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleResolve(report.id, "dismissed")}
                                className="py-1 px-3 border border-border hover:bg-bg text-text-muted hover:text-text font-semibold text-xs rounded-lg transition-all cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleResolve(report.id, "resolved")}
                                className="py-1 px-3 bg-primary hover:bg-primary-lt text-surface font-semibold text-xs rounded-lg transition-all cursor-pointer"
                              >
                                Resolve
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted font-medium">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!reportsLoading && reports.length > 0 && reportsTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setReportsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={reportsPage === 1}
                  className="py-1.5 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-xs transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-text-muted">
                  Page {reportsPage} of {reportsTotalPages}
                </span>
                <button
                  onClick={() => setReportsPage((prev) => Math.min(prev + 1, reportsTotalPages))}
                  disabled={reportsPage === reportsTotalPages}
                  className="py-1.5 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-xs transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {/* Tab Content: Users */}
        {activeTab === "users" && (
          <section className="space-y-6">
            {usersError && (
              <div className="p-4 bg-red-50 border border-error/20 text-error text-sm rounded-lg">
                {usersError}
              </div>
            )}

            {usersLoading ? (
              /* Skeleton Loader */
              <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-border animate-pulse rounded w-full"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 bg-surface border border-border rounded-xl shadow-sm">
                <p className="text-sm text-text-muted">No users registered.</p>
              </div>
            ) : (
              /* Users Table */
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-muted font-semibold">
                      <th className="p-4">Email</th>
                      <th className="p-4">Register Number</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4 text-right">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-bg/10 transition-colors">
                        <td className="p-4 font-medium text-text">
                          {u.email}
                        </td>
                        <td className="p-4 text-text-muted">
                          {u.register_number || "Not Complete"}
                        </td>
                        <td className="p-4 text-text-muted text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          {isAdmin ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="py-1 px-2 border border-border rounded focus:outline-none focus:border-primary bg-surface text-text text-xs font-semibold uppercase cursor-pointer"
                            >
                              <option value="student">Student</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-xs font-bold text-primary uppercase bg-bg py-1 px-2.5 rounded border border-border">
                              {u.role}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!usersLoading && users.length > 0 && usersTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                  disabled={usersPage === 1}
                  className="py-1.5 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-xs transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-text-muted">
                  Page {usersPage} of {usersTotalPages}
                </span>
                <button
                  onClick={() => setUsersPage((prev) => Math.min(prev + 1, usersTotalPages))}
                  disabled={usersPage === usersTotalPages}
                  className="py-1.5 px-4 border border-border rounded-lg text-text hover:bg-surface font-semibold text-xs transition-all disabled:bg-border/30 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
