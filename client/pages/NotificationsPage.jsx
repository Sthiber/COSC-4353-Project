import { useEffect, useState } from "react";
const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export default function NotificationsPage() {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.id ?? 1; // allow testing as user 1
    (async () => {
      try {
        const r = await fetch(`${API}/api/notifications/${id}`);
        const data = await r.json().catch(() => []);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && !items.length && <p className="text-gray-500">No notifications.</p>}
      <ul className="grid gap-3">
        {items.map((n) => (
          <li key={n.id} className="border rounded p-3 flex items-start justify-between">
            <div>
              <p className="font-medium">{n.message}</p>
              {n.created_at && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              )}
            </div>
            {(n.is_read === 0 || n.read === false) ? (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">unread</span>
            ) : (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">read</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
