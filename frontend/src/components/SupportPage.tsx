import { useState } from 'react';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';
import Navigation from './Navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { sendSupportMessage } from '../lib/supportApi';

type Page =
  | 'home'
  | 'support'
  | 'login'
  | 'register'
  | 'events'
  | 'event-detail'
  | 'create-event'
  | 'organizer-dashboard'
  | 'admin-dashboard'
  | 'my-events'
  | 'profile';

interface SupportPageProps {
  onNavigate: (page: Page, eventId?: number) => void;
}

const FAQS = [
  {
    question: 'How do I join an event?',
    answer: 'Open the event, tap Join Event, and your ticket QR will appear on the sidebar.'
  },
  {
    question: 'How do I create an event?',
    answer: 'If you are an organizer, use Create Event from the navigation menu.'
  },
  {
    question: 'Where can I find my tickets?',
    answer: 'Visit any joined event and your QR ticket appears on the right sidebar.'
  }
];

export default function SupportPage({ onNavigate }: SupportPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <Navigation onNavigate={onNavigate} currentPage="support" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-slate-900 mb-2">Support & FAQs</h1>
              <p className="text-slate-600">
                Find quick answers below or reach us directly for help.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-base text-slate-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h2 className="text-slate-900 mb-2">Contact Us</h2>
              <p className="text-slate-600 mb-4">Need help? Send us a message and we will respond soon.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setError(null);
                  setSuccess(false);
                  try {
                    await sendSupportMessage({ name, email, message });
                    setSuccess(true);
                    setName('');
                    setEmail('');
                    setMessage('');
                  } catch (err: any) {
                    setError(err?.message || 'Failed to send message');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                    Thanks! Your message has been sent.
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-slate-900">Live chat</p>
                  <p className="text-slate-600 text-sm">Available weekdays 9am–6pm.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-slate-900">Email support</p>
                  <p className="text-slate-600 text-sm">support@nomozovevent.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
