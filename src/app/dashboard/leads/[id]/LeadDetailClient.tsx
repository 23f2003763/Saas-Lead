'use client'

import { useState } from 'react'
import { Send, Save, Bot, User, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LeadDetailClient({ lead }: { lead: any }) {
  const [draft, setDraft] = useState(lead.draft_message || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState(lead.status)
  
  const supabase = createClient()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ draft_message: draft })
        .eq('id', lead.id)
      
      if (error) throw error
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!draft) return alert('Cannot send empty message')
    
    // In a real app, this contact info might come from the Apify scrape.
    // We'll prompt for an email just for testing purposes.
    const toEmail = lead.prospect_contact || prompt('Enter prospect email to send to (for testing):')
    if (!toEmail) return

    setIsSending(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          to_email: toEmail,
          subject: 'Exploring a potential fit',
          message: draft
        })
      })

      const data = await res.json()
      if (data.success) {
        setStatus('sent')
        alert('Outreach sent successfully!')
      } else {
        throw new Error(data.error || 'Failed to send')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send outreach.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      {/* Intent Signal Panel */}
      <div className="glass p-6 rounded-xl flex flex-col gap-4 border border-border">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-border/50">
          <User className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-lg">Intent Signal</h2>
        </div>
        
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Prospect</span>
          <p className="font-medium text-foreground">{lead.prospect_username || 'Unknown'}</p>
        </div>
        
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Source</span>
          <p className="font-medium text-foreground">{lead.source}</p>
        </div>
        
        <div className="flex-1 bg-background/50 p-4 rounded-lg border border-border mt-2">
          <p className="text-sm italic text-muted-foreground">"{lead.content}"</p>
        </div>
      </div>

      {/* AI Draft Panel */}
      <div className="glass p-6 rounded-xl flex flex-col gap-4 border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]" />
        
        <div className="flex items-center justify-between mb-2 pb-4 border-b border-border/50 relative z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">AI Drafted Outreach</h2>
          </div>
          {status === 'sent' && (
            <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
              Sent
            </span>
          )}
        </div>
        
        <div className="flex-1 relative z-10">
          <textarea 
            className="w-full h-full min-h-[250px] p-4 bg-input/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all font-mono"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={status === 'sent'}
          />
        </div>
        
        <div className="flex items-center gap-3 justify-end pt-4 relative z-10">
          {status !== 'sent' && (
            <>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-secondary hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button 
                onClick={handleSend}
                disabled={isSending || !draft}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors text-sm font-medium shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Outreach
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
