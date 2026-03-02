import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import type { AlertItem, AnnouncementItem } from '../types';

type Props = {
  onLogout: () => void;
};

export default function DashboardPage({ onLogout }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');
  const [alertCategory, setAlertCategory] = useState('typhoon');
  const [alertSeverity, setAlertSeverity] = useState('high');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');

  async function loadFeed() {
    const [alertsResponse, announcementsResponse] = await Promise.all([
      api.get('/content/alerts'),
      api.get('/content/announcements'),
    ]);
    setAlerts(alertsResponse.data);
    setAnnouncements(announcementsResponse.data);
  }

  useEffect(() => {
    loadFeed();
  }, []);

  async function submitAlert(event: FormEvent) {
    event.preventDefault();
    await api.post('/content/alerts', {
      title: alertTitle,
      body: alertBody,
      category: alertCategory,
      severity: alertSeverity,
    });
    setAlertTitle('');
    setAlertBody('');
    await loadFeed();
  }

  async function submitNews(event: FormEvent) {
    event.preventDefault();
    await api.post('/content/announcements', {
      title: newsTitle,
      body: newsBody,
    });
    setNewsTitle('');
    setNewsBody('');
    await loadFeed();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl p-5 shadow flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">CDRRMD Content Dashboard</h1>
            <p className="text-slate-500">Dynamic alerts and news for the mobile app.</p>
          </div>
          <button onClick={onLogout} className="bg-slate-800 text-white px-4 py-2 rounded-lg">
            Logout
          </button>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={submitAlert} className="bg-white rounded-2xl p-5 shadow space-y-3">
            <h2 className="text-xl font-semibold text-slate-800">Post Latest Alert</h2>
            <input value={alertTitle} onChange={(e) => setAlertTitle(e.target.value)} placeholder="Alert title" className="w-full border rounded-xl p-3" required />
            <textarea value={alertBody} onChange={(e) => setAlertBody(e.target.value)} placeholder="Details" className="w-full border rounded-xl p-3 h-24" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={alertCategory} onChange={(e) => setAlertCategory(e.target.value)} className="border rounded-xl p-3">
                <option value="typhoon">Typhoon</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="earthquake">Earthquake</option>
              </select>
              <select value={alertSeverity} onChange={(e) => setAlertSeverity(e.target.value)} className="border rounded-xl p-3">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button className="bg-red-600 text-white rounded-xl px-4 py-3 font-semibold">Publish Alert</button>
          </form>

          <form onSubmit={submitNews} className="bg-white rounded-2xl p-5 shadow space-y-3">
            <h2 className="text-xl font-semibold text-slate-800">Post News & Announcement</h2>
            <input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="News title" className="w-full border rounded-xl p-3" required />
            <textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} placeholder="Details" className="w-full border rounded-xl p-3 h-24" required />
            <button className="bg-sky-700 text-white rounded-xl px-4 py-3 font-semibold">Publish News</button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl p-5 shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Latest Alerts</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((item) => (
                <article key={item.id} className="border rounded-xl p-3">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.body}</p>
                  <p className="text-xs text-slate-500 mt-2">{item.category} • {item.severity}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">News & Announcement</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {announcements.map((item) => (
                <article key={item.id} className="border rounded-xl p-3">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
