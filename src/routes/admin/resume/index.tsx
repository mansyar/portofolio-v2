import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import { 
  User as UserIcon, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Save,
  Plus,
} from 'lucide-react';
import { DownloadResumeButton } from '../../../components/features/DownloadResumeButton';

export const Route = createFileRoute('/admin/resume/')({
  component: AdminResumePage,
});

type ResumeTab = 'profile' | 'experience' | 'education' | 'certifications';

function AdminResumePage() {
  const [activeTab, setActiveTab] = useState<ResumeTab>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Resume Management</h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Update your professional profile and history
          </p>
        </div>
        <DownloadResumeButton />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-(--color-border) gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ResumeTab)}
            className={`px-4 py-2 text-sm font-mono flex items-center gap-2 transition-colors relative top-px ${
              activeTab === tab.id
                ? 'border-x border-t border-(--color-border) bg-(--color-bg-primary) text-(--color-ubuntu-orange) font-bold'
                : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'profile' && <ProfileEditor />}
        {activeTab === 'experience' && <ExperienceManager />}
        {activeTab === 'education' && <EducationManager />}
        {activeTab === 'certifications' && <CertificationsManager />}
      </div>
    </div>
  );
}

function ProfileEditor() {
  const profile = useQuery(api.resume.getProfile);
  const updateProfile = useMutation(api.resume.updateProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      setServices(profile.services || []);
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName') as string,
      title: (formData.get('title') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      location: (formData.get('location') as string) || undefined,
      summary: (formData.get('summary') as string) || undefined,
      linkedinUrl: (formData.get('linkedinUrl') as string) || undefined,
      githubUrl: (formData.get('githubUrl') as string) || undefined,
      websiteUrl: (formData.get('websiteUrl') as string) || undefined,
      services: services.length > 0 ? services : undefined,
      interests: interests.length > 0 ? interests : undefined,
    };

    try {
      await updateProfile(data);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile === undefined) return <div className="p-8 font-mono">Loading Profile...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="input-container">
          <label className="input-label">Full Name</label>
          <div className="input-wrapper">
             <span className="input-prompt">{">"}</span>
            <input name="fullName" defaultValue={profile?.fullName || ''} required className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">Title</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="title" defaultValue={profile?.title || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">Email</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="email" defaultValue={profile?.email || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">Phone</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="phone" defaultValue={profile?.phone || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">Location</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="location" defaultValue={profile?.location || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">LinkedIn URL</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="linkedinUrl" defaultValue={profile?.linkedinUrl || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">GitHub URL</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="githubUrl" defaultValue={profile?.githubUrl || ''} className="input" />
          </div>
        </div>
        <div className="input-container">
          <label className="input-label">Website URL</label>
          <div className="input-wrapper">
            <span className="input-prompt">{">"}</span>
            <input name="websiteUrl" defaultValue={profile?.websiteUrl || ''} className="input" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="input-label">Services</label>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={index} className="input-wrapper group">
                <span className="input-prompt text-(--color-terminal-green)">✓</span>
                <input 
                  value={service} 
                  onChange={(e) => {
                    const newServices = [...services];
                    newServices[index] = e.target.value;
                    setServices(newServices);
                  }}
                  className="input flex-1"
                />
                <button 
                  type="button" 
                  onClick={() => setServices(services.filter((_, i) => i !== index))}
                  className="px-2 text-(--color-text-secondary) hover:text-(--color-terminal-red) font-mono"
                >
                  [X]
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => setServices([...services, ''])}
              className="text-xs font-mono text-(--color-ubuntu-orange) hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> ADD_SERVICE
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="input-label">Interests</label>
          <div className="space-y-2">
            {interests.map((interest, index) => (
              <div key={index} className="input-wrapper group">
                <span className="input-prompt text-(--color-ubuntu-orange)">➜</span>
                <input 
                  value={interest} 
                  onChange={(e) => {
                    const newInterests = [...interests];
                    newInterests[index] = e.target.value;
                    setInterests(newInterests);
                  }}
                  className="input flex-1"
                />
                <button 
                  type="button" 
                  onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                  className="px-2 text-(--color-text-secondary) hover:text-(--color-terminal-red) font-mono"
                >
                  [X]
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => setInterests([...interests, ''])}
              className="text-xs font-mono text-(--color-ubuntu-orange) hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> ADD_INTEREST
            </button>
          </div>
        </div>
      </div>

      <div className="input-container">
        <label className="input-label">Summary</label>
        <div className="input-wrapper">
          <span className="input-prompt">{">"}</span>
          <textarea name="summary" defaultValue={profile?.summary || ''} className="input min-h-[100px] py-1" />
        </div>
      </div>
      <button disabled={isSubmitting} className="terminal-button btn-primary flex items-center gap-2">
        <Save size={18} /> Save Profile
      </button>
    </form>
  );
}

function ExperienceManager() {
  const experiences = useQuery(api.resume.listAllExperiences);
  const create = useMutation(api.resume.createExperience);
  const update = useMutation(api.resume.updateExperience);
  const remove = useMutation(api.resume.deleteExperience);

  const [editingId, setEditingId] = useState<Id<"workExperiences"> | null>(null);
  const [formData, setFormData] = useState({
    company: '', role: '', location: '', startDate: '', endDate: '', description: '', displayOrder: 0, isVisible: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await update({ id: editingId, ...formData });
    else await create(formData);
    setEditingId(null);
    setFormData({ company: '', role: '', location: '', startDate: '', endDate: '', description: '', displayOrder: experiences?.length ?? 0, isVisible: true });
  };

  if (experiences === undefined) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-4">
      <div className="admin-table-wrapper">
        <table className="admin-table text-sm">
          <thead><tr><th>Role @ Company</th><th>Period</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {experiences.map((exp: Doc<"workExperiences">) => (
              <tr key={exp._id}>
                <td>{exp.role} <span className="text-xs opacity-50">@ {exp.company}</span></td>
                <td className="text-xs font-mono">{exp.startDate.split('-')[0]} - {exp.endDate ? exp.endDate.split('-')[0] : 'Pres'}</td>
                <td className="text-right">
                   <button onClick={() => { 
                     setEditingId(exp._id); 
                     // eslint-disable-next-line @typescript-eslint/no-unused-vars
                     const { _id, _creationTime, ...data } = exp;
                     setFormData({ ...data, location: exp.location || '', endDate: exp.endDate || '', description: exp.description || '' }); 
                   }} className="hover:text-(--color-ubuntu-orange) mr-2">[edit]</button>
                   <button onClick={() => { if(confirm('Delete?')) remove({ id: exp._id }) }} className="hover:text-(--color-terminal-red)">[del]</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleSubmit} className="terminal-card border border-(--color-border) p-4 space-y-3">
        <h3 className="text-xs font-bold mb-2">{editingId ? 'EDIT EXP' : 'ADD EXP'}</h3>
        <div className="input-wrapper">
          <span className="input-prompt">{">"}</span>
          <input placeholder="Company" value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} required className="input text-xs" />
        </div>
        <div className="input-wrapper">
          <span className="input-prompt">{">"}</span>
          <input placeholder="Role" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} required className="input text-xs" />
        </div>
        <div className="flex gap-2">
          <div className="input-wrapper flex-1">
            <span className="input-prompt">{">"}</span>
            <input type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})} className="input text-xs" />
          </div>
          <div className="input-wrapper flex-1">
            <span className="input-prompt">{">"}</span>
            <input type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate: e.target.value})} className="input text-xs" />
          </div>
        </div>
        <div className="input-wrapper">
          <span className="input-prompt">{">"}</span>
          <textarea placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="input text-xs min-h-[60px]" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="terminal-button btn-primary flex-1 py-1 text-xs"><Save size={14} /> Save</button>
          {editingId && <button type="button" onClick={() => setEditingId(null)} className="terminal-button btn-secondary flex-1 py-1 text-xs">Cancel</button>}
        </div>
      </form>
    </div>
  );
}

function EducationManager() {
  const education = useQuery(api.resume.listAllEducation);
  const create = useMutation(api.resume.createEducation);
  const remove = useMutation(api.resume.deleteEducation);
  const [formData, setFormData] = useState({ institution: '', degree: '', field: '', startDate: '', endDate: '', description: '', displayOrder: 0, isVisible: true });

  if (education === undefined) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-4">
      <div className="admin-table-wrapper">
        <table className="admin-table text-sm">
          <thead><tr><th>Degree</th><th>Institution</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {education.map((edu: Doc<"education">) => (
              <tr key={edu._id}>
                <td>{edu.degree}</td>
                <td>{edu.institution}</td>
                <td className="text-right"><button onClick={() => remove({ id: edu._id })} className="hover:text-(--color-terminal-red)">[del]</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={async e => { 
        e.preventDefault(); 
        await create(formData); 
        setFormData({ institution: '', degree: '', field: '', startDate: '', endDate: '', description: '', displayOrder: education?.length ?? 0, isVisible: true }); 
      }} className="terminal-card border border-(--color-border) p-4 space-y-3">
         <div className="input-wrapper">
           <span className="input-prompt">{">"}</span>
           <input placeholder="Institution" value={formData.institution} onChange={e=>setFormData({...formData, institution: e.target.value})} required className="input text-xs" />
         </div>
         <div className="input-wrapper">
           <span className="input-prompt">{">"}</span>
           <input placeholder="Degree" value={formData.degree} onChange={e=>setFormData({...formData, degree: e.target.value})} required className="input text-xs" />
         </div>
         <button className="terminal-button btn-primary w-full py-1 text-xs">Add Education</button>
      </form>
    </div>
  );
}

function CertificationsManager() {
  const certs = useQuery(api.resume.listAllCertifications);
  const create = useMutation(api.resume.createCertification);
  const remove = useMutation(api.resume.deleteCertification);
  const [formData, setFormData] = useState({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '', displayOrder: 0, isVisible: true });

  if (certs === undefined) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-4">
       <div className="admin-table-wrapper">
        <table className="admin-table text-sm">
          <thead><tr><th>Certification</th><th>Issuer</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {certs.map((c: Doc<"certifications">) => (
              <tr key={c._id}><td>{c.name}</td><td>{c.issuer}</td><td className="text-right"><button onClick={() => remove({ id: c._id })} className="hover:text-(--color-terminal-red)">[del]</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={async e => { 
        e.preventDefault(); 
        await create(formData); 
        setFormData({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialUrl: '', displayOrder: certs?.length ?? 0, isVisible: true }); 
      }} className="terminal-card border border-(--color-border) p-4 space-y-3">
         <div className="input-wrapper">
           <span className="input-prompt">{">"}</span>
           <input placeholder="Cert Name" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required className="input text-xs" />
         </div>
         <div className="input-wrapper">
           <span className="input-prompt">{">"}</span>
           <input placeholder="Issuer" value={formData.issuer} onChange={e=>setFormData({...formData, issuer: e.target.value})} required className="input text-xs" />
         </div>
         <div className="input-wrapper">
           <span className="input-prompt">{">"}</span>
           <input type="date" value={formData.issueDate} onChange={e=>setFormData({...formData, issueDate: e.target.value})} className="input text-xs" />
         </div>
         <button className="terminal-button btn-primary w-full py-1 text-xs">Add Cert</button>
      </form>
    </div>
  );
}
