import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import { Mail, MailOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const Route = createFileRoute('/admin/messages/')({
  component: AdminMessagesInbox,
});

function AdminMessagesInbox() {
  const messages = useQuery(api.contact.listAll);
  const markAsRead = useMutation(api.contact.markAsRead);
  const removeMessage = useMutation(api.contact.remove);
  
  const [expandedId, setExpandedId] = useState<Id<"contactSubmissions"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"contactSubmissions"> | null>(null);

  const handleToggleRead = async (id: Id<"contactSubmissions">, currentRead: boolean) => {
    try {
      await markAsRead({ id, isRead: !currentRead });
    } catch (error) {
      console.error('Failed to update read status:', error);
    }
  };

  const handleDelete = async (id: Id<"contactSubmissions">) => {
    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await removeMessage({ id });
        if (expandedId === id) setExpandedId(null);
      } catch (error) {
        console.error('Failed to delete message:', error);
        alert('Failed to delete message');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const toggleExpand = (id: Id<"contactSubmissions">, isRead: boolean) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!isRead) {
        markAsRead({ id, isRead: true });
      }
    }
  };

  if (messages === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Messages</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Inbox for your contact form submissions
        </p>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-10">St</th>
              <th>From</th>
              <th>Subject</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-(--color-text-secondary)">
                  No messages found.
                </td>
              </tr>
            ) : (
              messages.map((msg) => {
                const isExpanded = expandedId === msg._id;
                const date = new Date(msg._creationTime);
                
                return (
                  <React.Fragment key={msg._id}>
                    <tr 
                      className={`cursor-pointer transition-colors ${!msg.isRead ? 'bg-(--color-terminal-green) bg-opacity-5 font-bold text-(--color-text-primary)' : 'text-(--color-text-secondary)'} hover:bg-(--color-terminal-bg)`}
                      onClick={() => toggleExpand(msg._id, msg.isRead)}
                    >
                      <td className="text-center">
                        {msg.isRead ? (
                          <MailOpen size={16} className="opacity-40" />
                        ) : (
                          <Mail size={16} className="text-(--color-terminal-green)" />
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span>{msg.name}</span>
                          <span className="text-[10px] font-mono opacity-60 font-normal">{msg.email}</span>
                        </div>
                      </td>
                      <td className="truncate max-w-[300px]">{msg.subject}</td>
                      <td className="text-xs font-mono">{format(date, 'MMM dd, HH:mm')}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleRead(msg._id, msg.isRead)}
                            className="text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors"
                            title={msg.isRead ? 'Mark as unread' : 'Mark as read'}
                          >
                            {msg.isRead ? <Mail size={16} /> : <MailOpen size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            disabled={deletingId === msg._id}
                            className="text-(--color-text-secondary) hover:text-(--color-terminal-red) transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="text-(--color-text-secondary)">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-(--color-terminal-bg) bg-opacity-30 border-t border-(--color-border)">
                        <td colSpan={5} className="p-6">
                          <div className="space-y-4 max-w-3xl">
                            <div className="flex justify-between items-start border-b border-(--color-border) pb-4">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-(--color-text-primary)">
                                  {msg.name} <span className="font-normal text-(--color-text-secondary) ml-2">&lt;{msg.email}&gt;</span>
                                </p>
                                <p className="text-lg text-(--color-text-primary)">{msg.subject}</p>
                              </div>
                              <p className="text-xs font-mono text-(--color-text-secondary)">
                                {format(date, 'PPPP p')}
                              </p>
                            </div>
                            <div className="whitespace-pre-wrap font-sans text-(--color-text-primary) leading-relaxed">
                              {msg.message}
                            </div>
                            <div className="pt-4 flex gap-4">
                              <a 
                                href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                                className="terminal-button primary text-xs"
                              >
                                $ reply_email
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Add React fragment import if needed, or just use <></>
import React from 'react';
