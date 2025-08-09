/* components/AdminDashboard/EventReportModal.jsx
   ------------------------------------------------------------
   Event Report
   • Filters: date range, urgency, status (Pending/Accepted/Declined/All)
   • Row expander shows volunteer assignments per event
   • CSV + PDF export
   ------------------------------------------------------------ */

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChevronDown, ChevronRight } from "lucide-react";

const API = "https://cosc-4353-backend.vercel.app";

export default function EventReportModal({ open, onClose }) {
    if (!open) return null;

    /* ----------- FORM STATE (live inputs) ----------- */
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const [from,    setFrom]    = useState(today);
    const [to,      setTo]      = useState(today);
    const [urgency, setUrgency] = useState("All");
    const [status,  setStatus]  = useState("All");

    /* ----------- APPLIED STATE (last run) ----------- */
    const [applied, setApplied] = useState({ from: today, to: today, urgency: "All", status: "All" });

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    /* assignments panel state */
    const [expanded, setExpanded] = useState(null); // event_id | null
    const [peopleByEvent, setPeopleByEvent] = useState({}); // { [eventId]: [] }

    const loadPeople = async (eventId) => {
        if (peopleByEvent[eventId]) return;
        try {
            const { data } = await axios.get(`${API}/requests/event/${eventId}`);
            setPeopleByEvent((prev) => ({ ...prev, [eventId]: Array.isArray(data) ? data : [] }));
        } catch {
            toast.error("Failed to load assignments");
        }
    };

    /* ----------- run query ----------- */
    const run = async () => {
        if (from > to) { toast.error("Start date must be ≤ end date"); return; }

        const qs = new URLSearchParams({ start: from, end: to, urgency, status });
        try {
            setLoading(true);
            const { data } = await axios.get(`${API}/reports/event-summary?`+qs.toString());
            setRows(Array.isArray(data) ? data : []);
            setApplied({ from, to, urgency, status });
            setExpanded(null);
        } catch {
            toast.error("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    /* initial load (defaults) */
    useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

    /* ----------- CSV ----------- */
    const exportCSV = () => {
        const cols = applied.status === "All" ? ["Pending","Accepted","Declined"] : [applied.status];
        const header = ["Event","Urgency","Start","End", ...cols];

        const csv = [
            header.join(","),
            ...rows.map(r=>{
                const base = [`"${r.event_name}"`, r.urgency, r.start_time, r.end_time];
                if (applied.status === "All") base.push(r.pending ?? 0, r.accepted ?? 0, r.declined ?? 0);
                else base.push(r[applied.status.toLowerCase()] ?? 0);
                return base.join(",");
            }),
        ].join("\n");

        const blob = new Blob([csv],{type:"text/csv"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `events_${applied.from}_${applied.to}.csv`;
        a.click();
    };

    /* ----------- PDF (fix: use autoTable function) ----------- */
    const exportPDF = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(12);
        doc.text(`Event Report (${applied.from} → ${applied.to})`, 14, 14);

        const head = applied.status === "All"
            ? [["Event","Urgency","Start","End","Pending","Accepted","Declined"]]
            : [["Event","Urgency","Start","End", applied.status]];

        const body = rows.map(r =>
            applied.status === "All"
                ? [r.event_name, r.urgency, r.start_time, r.end_time, r.pending ?? 0, r.accepted ?? 0, r.declined ?? 0]
                : [r.event_name, r.urgency, r.start_time, r.end_time, r[applied.status.toLowerCase()] ?? 0]
        );

        autoTable(doc, { head, body, startY: 20 });
        doc.save(`events_${applied.from}_${applied.to}.pdf`);
    };

    /* helper */
    const Input = ({label, ...props}) => (
        <div>
            <label className="block text-sm mb-1">{label}</label>
            <input {...props} className="bg-[#222b45] rounded px-3 py-2 w-full"/>
        </div>
    );

    /* dynamic columns */
    const colHeaders = applied.status === "All" ? ["Pending","Accepted","Declined"] : [applied.status];
    const countFor = (r) =>
        applied.status==="Pending"  ? r.pending :
            applied.status==="Accepted" ? r.accepted :
                applied.status==="Declined" ? r.declined : null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-start pt-20">
            <div className="bg-[#1a2035] w-[95%] max-w-6xl p-6 rounded-xl relative">
                <button onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-2xl">&times;</button>

                <h2 className="text-xl font-semibold mb-4">Event Report</h2>

                {/* filters */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Input label="From" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
                    <Input label="To"   type="date" value={to}   onChange={e=>setTo(e.target.value)}/>
                    <div>
                        <label className="block text-sm mb-1">Urgency</label>
                        <select className="bg-[#222b45] rounded px-3 py-2 w-full"
                                value={urgency} onChange={e=>setUrgency(e.target.value)}>
                            {["All","High","Medium","Low"].map(u=><option key={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Status</label>
                        <select className="bg-[#222b45] rounded px-3 py-2 w-full"
                                value={status} onChange={e=>setStatus(e.target.value)}>
                            {["All","Pending","Accepted","Declined"].map(s=><option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 items-end col-span-full">
                        <button onClick={run} className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded">Run</button>
                        {rows.length>0 && (
                            <>
                                <button onClick={exportCSV} className="bg-gray-600 hover:bg-gray-500 px-5 py-2 rounded">Export CSV</button>
                                <button onClick={exportPDF} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded">Export PDF</button>
                            </>
                        )}
                    </div>
                </div>

                {/* results */}
                {loading ? (
                    <p className="text-gray-400">Loading…</p>
                ) : rows.length===0 ? (
                    <p className="text-gray-400">No events match your filters.</p>
                ) : (
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-sm">
                            <thead className="bg-[#222b45] text-gray-300 sticky top-0">
                            <tr>
                                {["", "Event","Urgency","Start","End", ...colHeaders].map(h=>(
                                    <th key={h} className="p-2 text-left">{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(r=>(
                                <>
                                    <tr key={r.event_id} className="border-b border-gray-700">
                                        <td className="p-2 w-8">
                                            <button
                                                onClick={async ()=>{
                                                    const next = expanded === r.event_id ? null : r.event_id;
                                                    setExpanded(next);
                                                    if (next) await loadPeople(r.event_id);
                                                }}
                                                className="text-gray-300 hover:text-white"
                                                title="Show assignments"
                                            >
                                                {expanded === r.event_id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                            </button>
                                        </td>
                                        <td className="p-2">{r.event_name}</td>
                                        <td className="p-2">{r.urgency}</td>
                                        <td className="p-2">{r.start_time}</td>
                                        <td className="p-2">{r.end_time}</td>

                                        {applied.status==="All" ? (
                                            <>
                                                <td className="p-2 text-center">{r.pending ?? 0}</td>
                                                <td className="p-2 text-center">{r.accepted ?? 0}</td>
                                                <td className="p-2 text-center">{r.declined ?? 0}</td>
                                            </>
                                        ) : (
                                            <td className="p-2 text-center">{countFor(r) ?? 0}</td>
                                        )}
                                    </tr>

                                    {expanded === r.event_id && (
                                        <tr className="bg-[#171b2a]">
                                            <td />
                                            <td colSpan={applied.status==="All" ? 7 : 5} className="p-3">
                                                {(() => {
                                                    const people = peopleByEvent[r.event_id] || [];
                                                    if (!people.length) return <p className="text-gray-400">No requests/assignments yet.</p>;
                                                    const by = (s) => people.filter(p => (p.status || "Pending") === s);
                                                    const Chip = ({children}) => (
                                                        <span className="px-2 py-0.5 rounded bg-gray-700 text-xs">{children}</span>
                                                    );
                                                    return (
                                                        <div className="grid sm:grid-cols-3 gap-4">
                                                            <div>
                                                                <div className="mb-2"><Chip>Accepted</Chip></div>
                                                                <ul className="space-y-1">{by("Accepted").map(p=><li key={p.request_id}>{p.full_name}</li>)}</ul>
                                                            </div>
                                                            <div>
                                                                <div className="mb-2"><Chip>Pending</Chip></div>
                                                                <ul className="space-y-1">{by("Pending").map(p=><li key={p.request_id}>{p.full_name}</li>)}</ul>
                                                            </div>
                                                            <div>
                                                                <div className="mb-2"><Chip>Declined</Chip></div>
                                                                <ul className="space-y-1">{by("Declined").map(p=><li key={p.request_id}>{p.full_name}</li>)}</ul>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
