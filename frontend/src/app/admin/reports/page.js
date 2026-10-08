const reportItems = [
  { title: 'Monthly revenue', value: '₹180K', change: '+14%' },
  { title: 'Order approvals', value: '1,230', change: '+9%' },
  { title: 'Active listings', value: '4,520', change: '+6%' }
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 p-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Reports</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Reports panel</h1>
            <p className="mt-2 text-sm text-slate-600">Review platform performance, revenue, and activity with easy-to-read summaries.</p>
          </div>
          <button className="inline-flex items-center justify-center rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-xl">
            Generate report
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {reportItems.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.title}</p>
            <p className="mt-4 text-3xl font-black text-slate-900">{item.value}</p>
            <p className="mt-3 text-sm text-slate-500">Growth {item.change}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Report overview</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Key metrics</h2>
          </div>
          <button className="rounded-3xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
            Download summary
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Top earning crop</p>
            <p className="mt-3 text-2xl font-black text-slate-900">Wheat</p>
            <p className="mt-2 text-sm text-slate-600">Wheat brought the highest revenue this month through marketplace orders.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Highest region</p>
            <p className="mt-3 text-2xl font-black text-slate-900">Punjab</p>
            <p className="mt-2 text-sm text-slate-600">Punjab leads with the most active sellers and order volume this week.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
