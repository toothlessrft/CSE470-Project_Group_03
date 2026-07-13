//Researcher Report: Ahad
import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ResearcherReportDraft({ discoveryId, onSubmitted }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        possibleArtifact: false,
        notes: "",
        budgetRequested: "",
        requestExcavationTeam: false,
    });

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
                    possibleArtifact: data.report.possibleArtifact || false,
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
            const data = await api.post(`/researcher-report/${discoveryId}/save`, form);
            setSuccess("Draft saved successfully.");
            setReport(data.report);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmitFinal() {
        if (!window.confirm("Are you sure you want to submit the final report? No more edits can be made.")) return;
        setError("");
        setSuccess("");
        setBusy(true);
        try {
            const data = await api.post(`/researcher-report/${discoveryId}/submit`);
            setSuccess("Final report submitted successfully.");
            setReport(data.report);
            // Notify parent to reload list so the card moves to Previous Projects
            if (onSubmitted) onSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <p className="hint">Loading researcher report...</p>;
    if (!report) return <div className="alert alert-danger">{error || "Failed to load report"}</div>;

    const isSubmitted = report.status === "Submitted";

    return (
        <div className="card" style={{ marginTop: "1rem", border: "2px dashed #c98a4b", backgroundColor: "#fdf8f2" }}>
            <h3 style={{ color: "#7c4a2d", marginTop: 0 }}>Researcher Report</h3>
            <p className="hint">
                {isSubmitted
                    ? "This report has been finalized and submitted."
                    : "Work on your findings below piece by piece. Save as draft until you are completely finished."
                }
            </p>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form">
                <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", cursor: isSubmitted ? "not-allowed" : "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.possibleArtifact}
                        onChange={(e) => setForm({ ...form, possibleArtifact: e.target.checked })}
                        disabled={isSubmitted || busy}
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span style={{ fontWeight: 600 }}>Is there a possible artifact here? (Notify Admin)</span>
                </label>

                <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", cursor: isSubmitted ? "not-allowed" : "pointer" }}>
                    <input
                        type="checkbox"
                        checked={form.requestExcavationTeam}
                        onChange={(e) => setForm({ ...form, requestExcavationTeam: e.target.checked })}
                        disabled={isSubmitted || busy}
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span style={{ fontWeight: 600 }}>Request Excavation Team (Engineers)</span>
                </label>

                <label>
                    Requested Budget (৳) - optional
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={form.budgetRequested}
                        onChange={(e) => setForm({ ...form, budgetRequested: e.target.value })}
                        disabled={isSubmitted || busy}
                        placeholder="e.g. 50000"
                    />
                </label>

                <label>
                    Detailed Notes &amp; Draft Information
                    <textarea
                        rows={5}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        disabled={isSubmitted || busy}
                        placeholder="Gradually update your information about the site here..."
                    />
                </label>

                {!isSubmitted && (
                    <div className="actions">
                        <button className="btn" onClick={handleSaveDraft} disabled={busy}>Save Draft</button>
                        <button className="btn btn-approve" onClick={handleSubmitFinal} disabled={busy}>Submit Final Report</button>
                    </div>
                )}
            </div>
        </div>
    );
}
