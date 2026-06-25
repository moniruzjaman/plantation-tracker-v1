import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, BadgeCheck, Building2, Award, Download, Edit3, Save, X, TreePine } from 'lucide-react';
import { LS_PROFILE_KEY, toBn, loadSubmissions, countSeedlings } from '../../data/bdData';

interface OfficerProfile {
  // Personal
  name: string;
  nameBn: string;
  designation: string;
  bcsGroup: string;
  bcsSession: string;
  nid: string;
  dob: string;
  gender: string;
  email: string;
  mobile: string;
  altMobile: string;
  photo: string; // base64 or url
  // Posting
  ministry: string;
  department: string;
  division: string;
  district: string;
  upazila: string;
  office: string;
  postingDate: string;
  // Academic
  sscBoard: string;
  sscYear: string;
  hscBoard: string;
  hscYear: string;
  bscCollege: string;
  bscYear: string;
  mbaUniversity: string;
  mbaYear: string;
  // Additional
  specialization: string;
  languages: string;
  trainingCompleted: string;
  awards: string;
  bio: string;
}

const EMPTY: OfficerProfile = {
  name: '', nameBn: '', designation: 'Additional Deputy Director (Horticulture)',
  bcsGroup: 'Agriculture Cadre', bcsSession: '31st BCS', nid: '', dob: '', gender: 'পুরুষ',
  email: '', mobile: '', altMobile: '', photo: '',
  ministry: 'কৃষি মন্ত্রণালয়', department: 'কৃষি সম্প্রসারণ অধিদপ্তর (DAE)',
  division: 'রংপুর', district: 'কুড়িগ্রাম', upazila: '', office: 'DAE, কুড়িগ্রাম',
  postingDate: '',
  sscBoard: '', sscYear: '', hscBoard: '', hscYear: '',
  bscCollege: '', bscYear: '', mbaUniversity: '', mbaYear: '',
  specialization: 'উদ্যানতত্ত্ব (Horticulture)', languages: 'বাংলা, English',
  trainingCompleted: '', awards: '', bio: '',
};

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white transition";
const LABEL = "block text-xs font-semibold text-gray-600 mb-1";

export default function MyTab() {
  const [profile, setProfile] = useState<OfficerProfile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OfficerProfile>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [submissions] = useState(() => loadSubmissions());
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(LS_PROFILE_KEY);
    if (raw) { try { setProfile(JSON.parse(raw)); } catch {} }
    else setEditing(true); // First-time setup
  }, []);

  const startEdit = () => { setDraft({ ...profile }); setEditing(true); setSaved(false); };
  const cancelEdit = () => { setEditing(false); };
  const saveProfile = () => {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(draft));
    setProfile({ ...draft });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  const set = (k: keyof OfficerProfile, v: string) => setDraft(d => ({ ...d, [k]: v }));

  // Submission stats
  const stats = (() => {
    let totalSeedlings = 0;
    submissions.forEach(s => { totalSeedlings += countSeedlings(s).total; });
    return { total: submissions.length, totalSeedlings };
  })();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const exportProfile = () => {
    const content = `DAE OFFICER PROFILE
===================
Name: ${profile.nameBn} (${profile.name})
Designation: ${profile.designation}
BCS: ${profile.bcsGroup} | ${profile.bcsSession}
NID: ${profile.nid}
Email: ${profile.email}
Mobile: ${profile.mobile}
Department: ${profile.department}
District: ${profile.district}
Office: ${profile.office}
Specialization: ${profile.specialization}

ACTIVITY SUMMARY
Total Plantation Entries: ${stats.total}
Total Seedlings Recorded: ${stats.totalSeedlings.toLocaleString()}
Generated: ${new Date().toLocaleString('bn-BD')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'officer_profile.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const SECTIONS = ['ব্যক্তিগত', 'পদায়ন', 'শিক্ষা', 'অতিরিক্ত'];

  const p = editing ? draft : profile;
  const isEmpty = !profile.name && !profile.nameBn;

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Avatar / Photo */}
          <div className="relative shrink-0">
            {p.photo ? (
              <img src={p.photo} alt="প্রোফাইল" className="w-16 h-16 rounded-full object-cover border-3 border-white/30 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black border-2 border-white/30">
                {p.nameBn ? p.nameBn[0] : p.name ? p.name[0] : <User className="w-8 h-8 opacity-60" />}
              </div>
            )}
            {editing && (
              <label className="absolute -bottom-1 -right-1 bg-white text-green-700 rounded-full p-1 cursor-pointer shadow-lg hover:bg-green-50 transition">
                <Edit3 className="w-3 h-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-base leading-tight">{p.nameBn || 'প্রোফাইল সেটআপ করুন'}</h1>
            {p.name && <p className="text-green-200 text-xs">{p.name}</p>}
            <p className="text-green-100 text-xs mt-0.5">{p.designation}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-semibold">{p.bcsSession}</span>
              <span className="bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-semibold">{p.bcsGroup}</span>
              {p.district && <span className="bg-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">📍 {p.district}</span>}
            </div>
          </div>
          {!editing && (
            <button onClick={startEdit} className="shrink-0 p-2 bg-white/15 hover:bg-white/25 rounded-xl transition">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 border-t border-white/15 pt-4">
          <div className="text-center">
            <p className="text-xl font-extrabold">{toBn(stats.total)}</p>
            <p className="text-green-200 text-xs">মোট এন্ট্রি</p>
          </div>
          <div className="text-center border-x border-white/15">
            <p className="text-xl font-extrabold">{toBn(stats.totalSeedlings)}</p>
            <p className="text-green-200 text-xs">মোট চারা</p>
          </div>
          <div className="text-center">
            <TreePine className="w-5 h-5 mx-auto mb-0.5 text-green-300" />
            <p className="text-green-200 text-xs">বৃক্ষ কর্মসূচি</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" /> প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!
        </div>
      )}

      {isEmpty && !editing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-700 font-semibold text-sm mb-2">প্রোফাইল এখনো সেটআপ করা হয়নি</p>
          <button onClick={startEdit} className="bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-green-800 transition">প্রোফাইল তৈরি করুন</button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {SECTIONS.map((s, i) => (
          <button key={i} onClick={() => setActiveSection(i)} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeSection === i ? 'bg-white text-green-700 shadow' : 'text-gray-500'}`}>{s}</button>
        ))}
      </div>

      {/* Section 0: Personal */}
      {activeSection === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <SectionHeader icon={<User className="w-4 h-4" />} title="ব্যক্তিগত ও যোগাযোগ" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="পূর্ণ নাম (বাংলা)"><input value={p.nameBn} onChange={e => set('nameBn', e.target.value)} disabled={!editing} className={INPUT} placeholder="মোঃ আবু মোঃ মনিরুজ্জামান" /></F>
            <F label="Full Name (English)"><input value={p.name} onChange={e => set('name', e.target.value)} disabled={!editing} className={INPUT} placeholder="Abu Md. Moniruzzaman" /></F>
            <F label="পদবী">
              <select value={p.designation} onChange={e => set('designation', e.target.value)} disabled={!editing} className={INPUT}>
                {['Additional Deputy Director','Deputy Director','Agricultural Extension Officer','Sub-Assistant Agricultural Officer','Upazila Agricultural Officer','Additional Deputy Director (Horticulture)'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </F>
            <F label="লিঙ্গ">
              <select value={p.gender} onChange={e => set('gender', e.target.value)} disabled={!editing} className={INPUT}>
                <option>পুরুষ</option><option>মহিলা</option><option>অন্যান্য</option>
              </select>
            </F>
            <F label="জাতীয় পরিচয়পত্র নম্বর (NID)"><input value={p.nid} onChange={e => set('nid', e.target.value)} disabled={!editing} className={INPUT} placeholder="১৭ ডিজিটের NID" inputMode="numeric" /></F>
            <F label="জন্ম তারিখ"><input type="date" value={p.dob} onChange={e => set('dob', e.target.value)} disabled={!editing} className={INPUT} /></F>
            <F label="ইমেইল">
              <div className="relative"><Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" /><input type="email" value={p.email} onChange={e => set('email', e.target.value)} disabled={!editing} className={INPUT + ' pl-8'} placeholder="officer@dae.gov.bd" /></div>
            </F>
            <F label="মোবাইল নম্বর">
              <div className="relative"><Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" /><input type="tel" value={p.mobile} onChange={e => set('mobile', e.target.value)} disabled={!editing} className={INPUT + ' pl-8'} placeholder="01XXXXXXXXX" /></div>
            </F>
            <F label="বিকল্প মোবাইল"><input type="tel" value={p.altMobile} onChange={e => set('altMobile', e.target.value)} disabled={!editing} className={INPUT} placeholder="01XXXXXXXXX" /></F>
          </div>
        </div>
      )}

      {/* Section 1: Posting */}
      {activeSection === 1 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <SectionHeader icon={<Building2 className="w-4 h-4" />} title="পদায়ন ও কর্মস্থল" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="মন্ত্রণালয়"><input value={p.ministry} onChange={e => set('ministry', e.target.value)} disabled={!editing} className={INPUT} /></F>
            <F label="বিভাগ/দপ্তর"><input value={p.department} onChange={e => set('department', e.target.value)} disabled={!editing} className={INPUT} /></F>
            <F label="BCS ব্যাচ"><input value={p.bcsSession} onChange={e => set('bcsSession', e.target.value)} disabled={!editing} className={INPUT} placeholder="৩১তম BCS" /></F>
            <F label="ক্যাডার গ্রুপ"><input value={p.bcsGroup} onChange={e => set('bcsGroup', e.target.value)} disabled={!editing} className={INPUT} placeholder="Agriculture Cadre" /></F>
            <F label="বিভাগ (প্রশাসনিক)">
              <select value={p.division} onChange={e => set('division', e.target.value)} disabled={!editing} className={INPUT}>
                {['ঢাকা','চট্টগ্রাম','খুলনা','রাজশাহী','বরিশাল','সিলেট','রংপুর','ময়মনসিংহ'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </F>
            <F label="জেলা"><input value={p.district} onChange={e => set('district', e.target.value)} disabled={!editing} className={INPUT} placeholder="কুড়িগ্রাম" /></F>
            <F label="উপজেলা"><input value={p.upazila} onChange={e => set('upazila', e.target.value)} disabled={!editing} className={INPUT} placeholder="(প্রযোজ্য ক্ষেত্রে)" /></F>
            <F label="কার্যালয়"><input value={p.office} onChange={e => set('office', e.target.value)} disabled={!editing} className={INPUT} placeholder="DAE, কুড়িগ্রাম" /></F>
            <F label="যোগদানের তারিখ"><input type="date" value={p.postingDate} onChange={e => set('postingDate', e.target.value)} disabled={!editing} className={INPUT} /></F>
            <F label="বিশেষজ্ঞতা"><input value={p.specialization} onChange={e => set('specialization', e.target.value)} disabled={!editing} className={INPUT} placeholder="উদ্যানতত্ত্ব (Horticulture)" /></F>
          </div>
        </div>
      )}

      {/* Section 2: Education */}
      {activeSection === 2 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <SectionHeader icon={<Award className="w-4 h-4" />} title="শিক্ষাগত যোগ্যতা" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="SSC বোর্ড"><input value={p.sscBoard} onChange={e => set('sscBoard', e.target.value)} disabled={!editing} className={INPUT} placeholder="যশোর বোর্ড" /></F>
            <F label="SSC পাশের সাল"><input value={p.sscYear} onChange={e => set('sscYear', e.target.value)} disabled={!editing} className={INPUT} placeholder="২০০০" /></F>
            <F label="HSC বোর্ড"><input value={p.hscBoard} onChange={e => set('hscBoard', e.target.value)} disabled={!editing} className={INPUT} placeholder="যশোর বোর্ড" /></F>
            <F label="HSC পাশের সাল"><input value={p.hscYear} onChange={e => set('hscYear', e.target.value)} disabled={!editing} className={INPUT} placeholder="২০০২" /></F>
            <F label="B.Sc Agriculture কলেজ/বিশ্ববিদ্যালয়"><input value={p.bscCollege} onChange={e => set('bscCollege', e.target.value)} disabled={!editing} className={INPUT} placeholder="HSTU, দিনাজপুর" /></F>
            <F label="B.Sc পাশের সাল"><input value={p.bscYear} onChange={e => set('bscYear', e.target.value)} disabled={!editing} className={INPUT} placeholder="২০০৮" /></F>
            <F label="MBA বিশ্ববিদ্যালয়"><input value={p.mbaUniversity} onChange={e => set('mbaUniversity', e.target.value)} disabled={!editing} className={INPUT} placeholder="North South University" /></F>
            <F label="MBA পাশের সাল"><input value={p.mbaYear} onChange={e => set('mbaYear', e.target.value)} disabled={!editing} className={INPUT} placeholder="২০১৫" /></F>
          </div>
        </div>
      )}

      {/* Section 3: Additional */}
      {activeSection === 3 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <SectionHeader icon={<BadgeCheck className="w-4 h-4" />} title="অতিরিক্ত তথ্য" />
          <div className="grid grid-cols-1 gap-3">
            <F label="ভাষাগত দক্ষতা"><input value={p.languages} onChange={e => set('languages', e.target.value)} disabled={!editing} className={INPUT} placeholder="বাংলা, English" /></F>
            <F label="সম্পন্ন প্রশিক্ষণ">
              <textarea value={p.trainingCompleted} onChange={e => set('trainingCompleted', e.target.value)} disabled={!editing} rows={3} className={INPUT} placeholder="যেমন: Foundation Training, Advanced Horticulture, ICT in Agriculture..." />
            </F>
            <F label="পুরস্কার ও স্বীকৃতি"><textarea value={p.awards} onChange={e => set('awards', e.target.value)} disabled={!editing} rows={2} className={INPUT} placeholder="জাতীয় পুরস্কার / মন্ত্রণালয় সম্মাননা..." /></F>
            <F label="সংক্ষিপ্ত পরিচিতি (Bio)">
              <textarea value={p.bio} onChange={e => set('bio', e.target.value)} disabled={!editing} rows={4} className={INPUT} placeholder="কৃষি সম্প্রসারণ কার্যক্রম, AI কৃষি সরঞ্জাম, YouTube চ্যানেল ইত্যাদি..." />
            </F>
          </div>

          {/* Digital Presence */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-2">
            <p className="text-xs font-bold text-green-800 mb-2">🌐 ডিজিটাল কার্যক্রম</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span className="text-red-500">▶</span> YouTube: @AgriWisdomBd</div>
              <div className="flex items-center gap-2"><span>🤖</span> KrishiAI Platform: web.krishiai.live</div>
              <div className="flex items-center gap-2"><span>📱</span> DAE Field Apps: DAE, কুড়িগ্রাম</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Actions */}
      {editing && (
        <div className="flex gap-3 sticky bottom-4">
          <button onClick={saveProfile} className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition">
            <Save className="w-4 h-4" /> সংরক্ষণ করুন
          </button>
          {!isEmpty && (
            <button onClick={cancelEdit} className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition">
              <X className="w-4 h-4" /> বাতিল
            </button>
          )}
        </div>
      )}

      {/* Export */}
      {!editing && !isEmpty && (
        <button onClick={exportProfile} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition">
          <Download className="w-4 h-4" /> প্রোফাইল এক্সপোর্ট করুন
        </button>
      )}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      <span className="text-green-600">{icon}</span>
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
