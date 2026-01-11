import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FileDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DownloadResumeButton() {
  const [isMounted, setIsMounted] = useState(false);
  const profile = useQuery(api.resume.getProfile);
  const experiences = useQuery(api.resume.getExperiences);
  const education = useQuery(api.resume.getEducation);
  const skills = useQuery(api.skills.listVisible);
  const certifications = useQuery(api.resume.getCertifications);

  const [isGenerating, setIsGenerating] = useState(false);

  // Only render after client mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show skeleton placeholder during SSR and initial hydration
  if (!isMounted) {
    return (
      <div className="terminal-button btn-primary flex items-center gap-2 opacity-50">
        <FileDown size={18} />
        Download PDF
      </div>
    );
  }

  const handleDownload = async () => {
    if (!profile || !experiences || !education || !skills || !certifications) {
      alert('Data still loading, please wait...');
      return;
    }

    setIsGenerating(true);
    try {
      // Lazy load heavy PDF libraries only on demand
      const [reactPdf, { ResumeDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ResumeDocument')
      ]);

      const { pdf, Document, Page, Text, View, StyleSheet } = reactPdf;
      const pdfComponents = { Document, Page, Text, View, StyleSheet };

      const doc = <ResumeDocument 
        profile={profile} 
        experiences={experiences} 
        education={education} 
        skills={skills} 
        certifications={certifications} 
        pdfComponents={pdfComponents}
      />;
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Resume_${profile.fullName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={isGenerating}
      className="terminal-button btn-primary flex items-center gap-2"
      data-umami-event="resume-download"
      data-umami-event-format="pdf"
    >
      {isGenerating ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <FileDown size={18} />
      )}
      Download PDF
    </button>
  );
}
