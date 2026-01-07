import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # Contact
      </h1>

      <Card title="contact_form.sh" variant="terminal">
        <form className="space-y-6">
          <div className="font-mono text-sm text-[var(--color-terminal-green)] mb-4">
            # Fill out the form below to send a message
          </div>
          
          <Input 
            label="Name" 
            placeholder="John Doe" 
          />
          
          <Input 
            label="Email" 
            type="email" 
            placeholder="john@example.com" 
          />
          
          <Input 
            label="Subject" 
            placeholder="Project inquiry" 
          />
          
          <div className="space-y-2">
            <label className="font-mono text-sm text-[var(--color-text-secondary)]">Message</label>
            <div className="bg-[rgba(0,0,0,0.2)] p-3 rounded border border-[var(--color-border)] focus-within:border-[var(--color-ubuntu-orange)]">
              <textarea 
                className="w-full bg-transparent border-none outline-none font-mono text-white min-h-[150px]"
                placeholder="Write your message here..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Send Message
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-12 text-center font-mono space-y-2">
        <p className="text-[var(--color-text-secondary)]">Or email me directly:</p>
        <a 
          href="mailto:contact@ansyar-world.top" 
          className="text-[var(--color-terminal-cyan)] hover:underline block text-lg"
        >
          contact@ansyar-world.top
        </a>
      </div>
    </div>
  )
}
