// Researcher Report - Ahad
import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ResearcherReportDraft({ discoveryId, onSubmitted }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        notes: "",
        budgetRequested: "",
        requestExcavationTeam: false,
    });

    // Ahad_23201016 - finds are logged against the excavation project in
    // Manage Projects, not on the field report.

    const [busy, setBusy] = useState(false);

    useEffect(() => {
        loadReport();
    }, [discoveryId]);

    function loadReport() {
        setLoading(true);
        api
            .get(`/researcher-report/${discoveryId}`)
            .then((data) => {
                setReport(data.report);
                setForm({
                    notes: data.report.notes || "",
                    budgetRequested: data.report.budgetRequested || "",
                    requestExcavationTeam: data.report.requestExcavationTeam || false,
                });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }

    async function handleSaveDraft(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setBusy(true);
        try {
            const data = await api.post(`/researcher-report/${discoveryId}/save`, { ...form });
            setSuccess("Draft saved.");
            setReport(data.report);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitFinal() {
        if (
            !window.confirm(
                "Submit this field report to the heritage authority? It becomes read-only once submitted."
            )
        )
            return;
        setError("");
        setSuccess("");
        setBusy(true);
        try {
            const data = await api.post(`/researcher-report/${discoveryId}/submit`, { ...form });
            setSuccess("Field report submitted to the heritage authority.");
            setReport(data.report);
            // Reload the parent list, so an approved card moves to Previous.
            if (onSubmitted) onSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    if (loading)
        return (
            <p className="loading-state">
                <span className="spinner" aria-hidden="true" /> Loading field report
            </p>
        );
    if (!report)
        return <div className="alert alert-danger">{error || "The field report could not be loaded."}</div>;

    const isDraft = report.status === "Draft";
    const isApproved = report.status === "Approved";
    const isLocked = !isDraft; // Pending or Approved - no more edits allowed

    // A submitted report is read-only, so show it as a summary rather than a
    // locked, empty-looking form.
    if (isLocked) {
        return (
            <div className="panel" style={{ marginTop: "1.25rem" }}>
                <div className="panel-head">
                    <h4>Field report</h4>
                    <span className="chip">{isApproved ? "Approved" : "Under review"}</span>
                </div>
                <div className="panel-body">
                    <div className={`alert ${isApproved ? "alert-success" : "alert-info"}`}>
                        {isApproved
                            ? "Approved by the heritage authority. If an excavation team was requested, a tender will be published for the site."
                            : "Submitted to the heritage authority. You will be notified once it has been reviewed; no further edits can be made."}
                    </div>

                    <dl className="detail-list" style={{ marginBottom: "1rem" }}>
                        <div>
                            <dt>Excavation team requested</dt>
                            <dd>{report.requestExcavationTeam ? "Yes" : "No"}</dd>
                        </div>
                        {report.budgetRequested != null && (
                            <div>
                                <dt>Budget requested</dt>
                                <dd>৳{Number(report.budgetRequested).toLocaleString()}</dd>
                            </div>
                        )}
                        <div>
                            <dt>Submitted</dt>
                            <dd>{new Date(report.updatedAt).toLocaleString()}</dd>
                        </div>
                    </dl>

                    <span className="stat-label">Findings</span>
                    <p className="subtle" style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0" }}>
                        {report.notes || "No findings were recorded on this report."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="panel" style={{ marginTop: "1.25rem" }}>
            <div className="panel-head">
                <h4>Field report</h4>
                <span className="chip">Draft</span>
            </div>
            <div className="panel-body">
                <p className="hint" style={{ marginTop: 0 }}>
                    Build the report up over time and save it as a draft. Once submitted it becomes
                    read-only. Recovered artifacts are catalogued later, against the excavation
                    project itself.
                </p>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="form">
                    <label className="checkline">
                        <input
                            type="checkbox"
                            checked={form.requestExcavationTeam}
                            onChange={(e) => setForm({ ...form, requestExcavationTeam: e.target.checked })}
                            disabled={busy}
                        />
                        Recommend a full excavation of this site
                    </label>

                    <label>
                        Budget requested (৳, optional)
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            value={form.budgetRequested}
                            onChange={(e) => setForm({ ...form, budgetRequested: e.target.value })}
                            disabled={busy}
                            placeholder="e.g. 50000"
                        />
                    </label>

                    <label>
                        Findings and recommendations
                        <textarea
                            rows={5}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            disabled={busy}
                            placeholder="Site condition, stratigraphy observed, dating evidence, and what you recommend"
                        />
                    </label>

                    <div className="actions">
                        <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={busy}>
                            Save draft
                        </button>
                        <button className="btn" onClick={handleSubmitFinal} disabled={busy}>
                            Submit field report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
