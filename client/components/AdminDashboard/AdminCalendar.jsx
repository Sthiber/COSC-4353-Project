/* AdminCalendar.jsx  –  unified calendar
   • Add / Edit / Delete events (EventForm with skill search + scrollable modal)
   • Volunteer requests with detailed modal
   Leo Nguyen
   ------------------------------------------------------------ */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AccordionPicker from "./AccordianPicker.jsx";

const API = "https://cosc-4353-backend.vercel.app";

/* ====================================================================
   Calendar root
==================================================================== */
export default function CalendarView({ allEvents = [], currentUserId, refreshEvents }) {
    const [month, setMonth] = useState(new Date());

    /* modal state */
    const [mode, setMode] = useState(null);           // 'add' | 'edit' | 'vol' | null
    const [selDate, setSelDate] = useState(null);     // Date when adding
    const [selEvent, setSelEvent] = useState(null);   // event object when editing / volunteers

    /* volunteer state */
    const [cands, setCands]     = useState([]);
    const [picked, setPicked]   = useState([]);
    const [loading, setLoading] = useState(false);

    /* calendar helpers */
    const daysIn  = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstWd = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const prev = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    const next = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

    /* fetch candidates */
    const loadCandidates = useCallback(async (ev) => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API}/events/${ev.event_id}/candidates`);
            setCands(data);
        } catch (err) {
            console.error("candidate load:", err.message);
            setCands([]);
        } finally { setLoading(false); }
    }, []);

    /* bulk-send */
    const sendRequests = async () => {
        if (!picked.length) return;
        try {
            setLoading(true);
            await axios.post(`${API}/events/${selEvent.event_id}/requests/bulk`, {
                volunteerIds: picked,
                requestedBy:  currentUserId,
            });
            toast.success(`Sent ${picked.length} request${picked.length>1?"s":""}`);
            closeModal();
        } catch (err) {
            console.error("bulk send:", err.message);
            toast.error("Failed to send");
        } finally { setLoading(false); }
    };

    const closeModal = () => {
        setMode(null); setSelDate(null); setSelEvent(null);
        setCands([]); setPicked([]);
    };

    /* build cells */
    const cells = [];
    for (let i = 0; i < firstWd; i++) cells.push(<div key={`e-${i}`} />);
    for (let d = 1; d <= daysIn; d++) {
        const dt   = new Date(month.getFullYear(), month.getMonth(), d);
        const list = allEvents.filter(
            (e) =>
                e.date.getDate()   === d &&
                e.date.getMonth()  === month.getMonth() &&
                e.date.getFullYear() === month.getFullYear()
        );

        cells.push(
            <div key={d} className="h-24 relative border border-[#1a2035] p-1">
                <button
                    onClick={()=>{ setMode("add"); setSelDate(dt); }}
                    className="absolute top-1 right-1 text-gray-400 hover:text-indigo-400"
                ><Plus size={14}/></button>

                <span className="text-xs">{d}</span>

                {list.slice(0,3).map(ev=>(
                    <button
                        key={ev.details.event_id}
                        onClick={()=>{ setMode("vol"); setSelEvent(ev.details); loadCandidates(ev.details); }}
                        className="block w-full truncate text-left text-xs text-indigo-300 hover:text-indigo-200"
                    >• {ev.title}</button>
                ))}
                {list.length>3 && <span className="block text-xs text-gray-400">+{list.length-3} more</span>}
            </div>
        );
    }

    /* render */
    return (
        <>
            <div className="bg-[#222b45] rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Admin Calendar</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={prev} className="p-1 rounded-full bg-[#1a2035] hover:bg-indigo-700">
                            <ChevronLeft size={20}/>
                        </button>
                        <span>
              {month.toLocaleString("default",{month:"long"})} {month.getFullYear()}
            </span>
                        <button onClick={next} className="p-1 rounded-full bg-[#1a2035] hover:bg-indigo-700">
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-[#1a2035]">
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                        <div key={d} className="text-center text-xs py-1 bg-[#1a2035] text-gray-400">{d}</div>
                    ))}
                    {cells}
                </div>
            </div>

            {/* modals */}
            {mode==="add"  && (
                <EventForm
                    onClose={closeModal}
                    onSaved={()=>{ closeModal(); refreshEvents(); }}
                    defaultDate={selDate}
                />
            )}
            {mode==="edit" && selEvent && (
                <EventForm
                    event={selEvent}
                    onClose={closeModal}
                    onSaved={()=>{ closeModal(); refreshEvents(); }}
                />
            )}
            {mode==="vol" && selEvent && (
                <VolunteerModal
                    event={selEvent}
                    candidates={cands}
                    picked={picked}
                    setPicked={setPicked}
                    loading={loading}
                    onSend={sendRequests}
                    onEdit={()=> setMode("edit")}
                    onClose={closeModal}
                />
            )}
        </>
    );
}

/* ====================================================================
   Event add / edit form  (with skills search + scrollable content)
==================================================================== */
function EventForm({ event=null, defaultDate, onClose, onSaved }) {
    const isEdit   = !!event;
    const today    = defaultDate || new Date();

    const [name, setName]    = useState(event?.event_name || "");
    const [desc, setDesc]    = useState(event?.event_description || "");
    const [loc,  setLoc]     = useState(event?.event_location || "");
    const [urg,  setUrg]     = useState(event?.urgency || "Low");
    const [skills, setSkills]= useState(
        (event?.required_skills || "").split(",").map(s=>s.trim()).filter(Boolean)
    );
    const [start,setStart]   = useState(
        event ? event.start_time.slice(0,16) : today.toISOString().slice(0,16)
    );
    const [end,  setEnd]     = useState(
        event ? event.end_time.slice(0,16)   : today.toISOString().slice(0,16)
    );
    const [busy,setBusy]     = useState(false);

    /* skills data + search */
    const [skillOpts,setSkillOpts] = useState([]);
    const [skillQuery,setSkillQuery] = useState("");

    useEffect(()=>{
        axios.get(`${API}/skills`)
            .then(r=>setSkillOpts(Array.isArray(r.data)?r.data:[]))
            .catch(()=>setSkillOpts([]));
    },[]);

    const filteredSkills = skillOpts.filter(s =>
        s.toLowerCase().includes(skillQuery.toLowerCase())
    );

    const toggleSkill = (s)=>
        setSkills(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);

    const save = async () => {
        if (!name.trim()) return toast.error("Event name required");
        try {
            setBusy(true);
            if (isEdit) {
                await axios.put(`${API}/events/${event.event_id}`,{
                    event_name:name,event_description:desc,event_location:loc,
                    urgency:urg,start_time:start,end_time:end,skills,
                });
            } else {
                await axios.post(`${API}/events`,{
                    event_name:name,event_description:desc,event_location:loc,
                    urgency:urg,start_time:start,end_time:end,
                    created_by:Number(localStorage.getItem("userId")||0),
                    skills,
                });
            }
            toast.success("Saved");
            onSaved();
        } catch(err){ console.error(err); toast.error("Save failed"); }
        finally { setBusy(false); }
    };

    const del = async () => {
        if (!window.confirm("Delete this event?")) return;
        try {
            await axios.delete(`${API}/events/${event.event_id}`);
            toast.success("Deleted");
            onSaved();
        } catch(err){ console.error(err); toast.error("Delete failed"); }
    };

    return (
        <Modal onClose={onClose}>
            <div className="max-h-[85vh] overflow-y-auto pr-1"> {/* <-- scrollable */}
                <h3 className="text-xl font-semibold mb-4">{isEdit?"Edit Event":"Add Event"}</h3>

                <div>
                    <label className="block text-sm mb-1">Event Name</label>
                    <input
                        value={name}
                        maxLength={50}
                        onChange={e=>setName(e.target.value)}
                        className="bg-[#222b45] w-full rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-400 text-right">{name.length}/50 characters</p>
                </div>

                <Textarea label="Event Description" value={desc} onChange={setDesc}/>
                <Input label="Location" value={loc} onChange={setLoc}/>
                <Select label="Urgency" value={urg} onChange={setUrg} options={["High","Medium","Low"]}/>

                {/* skills + search */}
                <div className="mb-4">
                    <label className="block text-sm mb-1">Skills &amp; Interests</label>

                    <input
                        placeholder="Search skills…"
                        value={skillQuery}
                        onChange={(e)=>setSkillQuery(e.target.value)}
                        className="w-full bg-[#222b45] rounded px-3 py-2 mb-2"
                    />

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto rounded-lg p-2 bg-[#222b45]">
                        {filteredSkills.length === 0 ? (
                            <span className="text-xs text-gray-400">No skills match your search.</span>
                        ) : (
                            filteredSkills.map(s=>(
                                <button key={s}
                                        type="button"
                                        onClick={()=>toggleSkill(s)}
                                        className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                            skills.includes(s)
                                                ? "bg-emerald-600"
                                                : "bg-gray-600 hover:bg-gray-500"
                                        }`}
                                >{s}</button>
                            ))
                        )}
                    </div>

                    {skills.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                            Selected: {skills.join(", ")}
                        </p>
                    )}
                </div>

                <Input label="Start" type="datetime-local" value={start} onChange={setStart}/>
                <Input label="End"   type="datetime-local" value={end}   onChange={setEnd}/>

                <div className="flex justify-between mt-6">
                    {isEdit && (
                        <button onClick={del} className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded">
                            Delete
                        </button>
                    )}
                    <button
                        onClick={save}
                        disabled={busy}
                        className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-40"
                    >
                        {busy ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ====================================================================
   Volunteer picker modal  (detailed header)
==================================================================== */
function VolunteerModal({ event,candidates,picked,setPicked,loading,onSend,onEdit,onClose }) {
    const reqSkills = (event.required_skills || "")
        .split(",").map(s=>s.trim()).filter(Boolean);

    return (
        <Modal onClose={onClose}>
            <div className="max-h-[85vh] overflow-y-auto pr-1"> {/* safety scroll */}
                {/* header details */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-indigo-400">{event.event_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                        event.urgency==="High"   ? "bg-red-600"   :
                            event.urgency==="Medium" ? "bg-amber-600" : "bg-emerald-600"
                    }`}>{event.urgency}</span>
                </div>
                <p className="text-sm">
                    <strong>Date:</strong>{" "}
                    {new Date(event.start_time).toLocaleString()}
                    {event.end_time && " – "+new Date(event.end_time).toLocaleString()}
                </p>
                {event.event_location && (
                    <p className="text-sm"><strong>Location:</strong> {event.event_location}</p>
                )}
                {reqSkills.length>0 && (
                    <p className="text-sm"><strong>Skills:</strong> {reqSkills.join(", ")}</p>
                )}
                {event.event_description && (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{event.event_description}</p>
                )}

                <h4 className="font-medium mt-4 mb-1">Volunteers</h4>
                {loading && <p className="text-xs text-gray-400">Loading…</p>}
                {!loading && candidates.length===0 && (
                    <p className="text-xs text-gray-400 mb-2">No volunteers match this event.</p>
                )}

                <AccordionPicker
                    multi
                    candidates={candidates}
                    requiredSkills={reqSkills}
                    onChangeSelection={setPicked}
                />

                <div className="flex justify-between mt-5">
                    <button onClick={onEdit}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded">
                        Edit Event
                    </button>

                    {candidates.length>0 && (
                        <button
                            onClick={onSend}
                            disabled={!picked.length||loading}
                            className={`px-4 py-2 ml-auto rounded ${
                                picked.length
                                    ? "bg-violet-600 hover:bg-violet-500"
                                    : "bg-gray-600 cursor-not-allowed"
                            }`}
                        >
                            {loading?"Sending…":`Send Request${picked.length>1?"s":""}`}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

/* ====================================================================
   Shared modal / input helpers
==================================================================== */
function Modal({ children,onClose }) {
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
            {/* inner is scrollable; keeps header/close visible enough */}
            <div className="bg-[#1a2035] text-white rounded-xl p-6 w-[92%] max-w-md relative shadow-lg">
                <button onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl">&times;</button>
                {children}
            </div>
        </div>
    );
}
function Input({ label,type="text",value,onChange }) {
    return (
        <div className="mb-4">
            <label className="block text-sm mb-1">{label}</label>
            <input type={type} value={value}
                   onChange={e=>onChange(e.target.value)}
                   className="bg-[#222b45] rounded px-3 py-2 w-full"/>
        </div>
    );
}
function Textarea({label,value,onChange}) {
    return (
        <div className="mb-4">
            <label className="block text-sm mb-1">{label}</label>
            <textarea rows={3} value={value}
                      onChange={e=>onChange(e.target.value)}
                      className="bg-[#222b45] rounded px-3 py-2 w-full"/>
        </div>
    );
}
function Select({label,value,onChange,options}) {
    return (
        <div className="mb-4">
            <label className="block text-sm mb-1">{label}</label>
            <select value={value} onChange={e=>onChange(e.target.value)}
                    className="bg-[#222b45] rounded px-3 py-2 w-full">
                {options.map(o=><option key={o}>{o}</option>)}
            </select>
        </div>
    );
}
