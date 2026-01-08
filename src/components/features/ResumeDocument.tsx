import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Doc } from '../../../convex/_generated/dataModel';

// Create styles for ATS-friendly PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e95420',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#e95420',
    marginBottom: 8,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactItem: {
    fontSize: 9,
    color: '#666666',
  },
  section: {
    marginTop: 15,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 2,
    marginBottom: 8,
  },
  entry: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  entryTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#000000',
  },
  entrySubtitle: {
    fontSize: 10,
    color: '#444444',
    fontStyle: 'italic',
  },
  entryDate: {
    fontSize: 9,
    color: '#666666',
  },
  description: {
    marginTop: 4,
    fontSize: 10,
    color: '#333333',
  },
  skillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  skillCategory: {
    marginBottom: 5,
  },
  skillLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  }
});

interface ResumeDocumentProps {
  profile: Doc<"resumeProfile"> | null;
  experiences: Doc<"workExperiences">[];
  education: Doc<"education">[];
  skills: Doc<"skills">[];
  certifications: Doc<"certifications">[];
}

export const ResumeDocument = ({ profile, experiences, education, skills, certifications }: ResumeDocumentProps) => (
  <Document title={`Resume - ${profile?.fullName}`}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{profile?.fullName}</Text>
        <Text style={styles.title}>{profile?.title}</Text>
        <View style={styles.contactGrid}>
          {profile?.email && <Text style={styles.contactItem}>{profile.email}</Text>}
          {profile?.phone && <Text style={styles.contactItem}>{profile.phone}</Text>}
          {profile?.location && <Text style={styles.contactItem}>{profile.location}</Text>}
          {profile?.linkedinUrl && <Text style={styles.contactItem}>LinkedIn: {profile.linkedinUrl}</Text>}
          {profile?.githubUrl && <Text style={styles.contactItem}>GitHub: {profile.githubUrl}</Text>}
        </View>
      </View>

      {/* Summary */}
      {profile?.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.description}>{profile.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Experience</Text>
          {experiences.filter(e => e.isVisible).map((exp, i) => (
            <View key={i} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={styles.entryDate}>
                  {exp.startDate.split('-')[0]} - {exp.endDate ? exp.endDate.split('-')[0] : 'Present'}
                </Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company} {exp.location ? `| ${exp.location}` : ''}</Text>
              {exp.description && <Text style={styles.description}>{exp.description}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Skills (Simplified for ATS) */}
      {skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Skills</Text>
          <View style={styles.skillGroup}>
             <Text>{skills.filter(s => s.isVisible).map(s => s.name).join(', ')}</Text>
          </View>
        </View>
      )}

      {/* Education */}
      {education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.filter(e => e.isVisible).map((edu, i) => (
            <View key={i} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.degree} in {edu.field}</Text>
                <Text style={styles.entryDate}>
                  {edu.startDate.split('-')[0]} - {edu.endDate ? edu.endDate.split('-')[0] : ''}
                </Text>
              </View>
              <Text style={styles.entrySubtitle}>{edu.institution}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {certifications.filter(c => c.isVisible).map((cert, i) => (
            <View key={i} style={styles.entry}>
               <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{cert.name}</Text>
                <Text style={styles.entryDate}>{cert.issueDate.split('-')[0]}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{cert.issuer}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);
