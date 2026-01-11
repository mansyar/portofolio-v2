import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { api } from '../../convex/_generated/api'
import { useToastMutation } from '../hooks/use-toast-mutation'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Seo } from '../components/seo'
import { Terminal, Send, CheckCircle, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

// Server function to get client IP from Traefik headers
const getClientIp = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  if (!request) return "unknown";
  
  // Traefik adds X-Forwarded-For with the client IP first
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
});

export const Route = createFileRoute('/contact')({
  component: Contact,
})

// Client-side validation using Zod (optional but good practice)
const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

function Contact() {
  const submitMessage = useToastMutation(api.contact.submit, {
    successMessage: 'message sent successfully',
    errorMessage: 'failed to send message'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '' // honeypot field
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    // Validate
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      setStatus('error');
      return;
    }

    try {
      // Get client IP server-side
      const clientIp = await getClientIp();

      await submitMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        honeypot: formData.website,
        clientIp
      });
      
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-12 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Contact | Portfolio" 
        description="Get in touch for freelance opportunities or just to say hi." 
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="flex flex-col gap-8">
           <div className="flex flex-col gap-4">
            <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
              <Terminal className="text-(--color-ubuntu-orange)" />
              Contact
            </h1>
            <p className="text-lg text-(--color-text-secondary)">
              Have a project in mind or want to collaborate? <br/>
              Fill out the form or reach out directly.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6">
             <div className="flex items-center gap-4">
               <div className="rounded-full border border-(--color-border) bg-(--color-surface-dark) p-3">
                 <Mail className="text-(--color-ubuntu-orange)" size={24} />
               </div>
               <div>
                 <h3 className="font-bold">Email</h3>
                 <p className="text-(--color-text-secondary)">ansyar.work@gmail.com</p>
               </div>
             </div>
             
             <div className="flex items-center gap-4">
               <div className="rounded-full border border-(--color-border) bg-(--color-surface-dark) p-3">
                 <MapPin className="text-(--color-terminal-green)" size={24} />
               </div>
               <div>
                 <h3 className="font-bold">Location</h3>
                 <p className="text-(--color-text-secondary)">Remote / Worldwide</p>
               </div>
             </div>
          </div>
        </div>

        {/* Contact Form */}
        <Card title="Send Message" className="w-full">
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-terminal-green)/20">
                  <CheckCircle className="text-(--color-terminal-green)" size={32} />
                </div>
                <h3 className="text-xl font-bold">Message Sent!</h3>
                <p className="text-(--color-text-secondary)">
                  Thanks for reaching out. I'll get back to you as soon as possible.
                </p>
                <Button onClick={() => setStatus('idle')} variant="secondary">Send another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-mono text-sm text-(--color-text-secondary)">Name</label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="Your Name"
                  />
                </div>

                {/* Honeypot field - hidden from humans */}
                <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                  <Input 
                    name="website" 
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-mono text-sm text-(--color-text-secondary)">Email</label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    placeholder="your@email.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="font-mono text-sm text-(--color-text-secondary)">Subject</label>
                  <Input 
                    id="subject" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    required 
                    placeholder="Project Inquiry"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="font-mono text-sm text-(--color-text-secondary)">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    required 
                    rows={5}
                    className="flex w-full rounded-md border border-(--color-border) bg-(--color-surface-dark) px-3 py-2 font-sans text-sm text-(--color-text-primary) placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-(--color-ubuntu-orange) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell me about your project..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="mt-2 w-full" 
                  disabled={status === 'submitting'}
                  data-umami-event="contact-submit"
                >
                  {status === 'submitting' ? (
                     <>Sending...</>
                  ) : (
                     <><Send size={16} className="mr-2" /> Send Message</>
                  )}
                </Button>
              </form>
            )}
        </Card>
      </div>
    </div>
  )
}
