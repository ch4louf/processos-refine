import React from 'react';
import { ReceiptText } from 'lucide-react';

const BillingPage: React.FC = () => {
  return (
    <div className="p-20 flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10">
        <ReceiptText size={48} />
      </div>
      <h1 className="text-4xl font-light text-slate-900 tracking-tighter mb-4">
        Finance & Subscription
      </h1>
      <p className="text-slate-500 text-lg max-w-lg text-center leading-relaxed">
        Centralized management of your SaaS subscription, invoices, and payment methods. 
        This view is only accessible to <strong>Admins</strong> and <strong>Finance Administrators</strong>.
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan</div>
          <div className="text-2xl font-bold text-indigo-600">Enterprise Scale</div>
          <div className="text-xs text-slate-400">Unlimited users & processes</div>
          <button className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
            Manage Subscription
          </button>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Invoice</div>
          <div className="text-2xl font-bold text-slate-900">$2,499.00</div>
          <div className="text-xs text-slate-400">Scheduled for April 1st, 2025</div>
          <button className="mt-4 px-6 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 justify-center">
            <ReceiptText size={14}/> View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
