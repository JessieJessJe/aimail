'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Eye, Send, Plus } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  spec: string
  createdAt: string
  updatedAt: string
}

interface Newsletter {
  id: string
  subject: string
  sentAt: string
  user?: {
    email: string
  }
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editSpecOpen, setEditSpecOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [editedSpec, setEditedSpec] = useState('')
  const [previewContent, setPreviewContent] = useState<{subject: string, content: string} | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users')
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNewsletterHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/newsletter-history')
      const data = await response.json()
      setNewsletters(data)
    } catch (error) {
      console.error('Failed to fetch newsletter history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleEditSpec = (user: User) => {
    setSelectedUser(user)
    setEditedSpec(user.spec)
    setEditSpecOpen(true)
  }

  const handlePreview = async (user: User) => {
    setSelectedUser(user)
    setPreviewLoading(true)
    setPreviewOpen(true)
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
      
      const response = await fetch('/api/preview-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setPreviewContent({
          subject: data.subject,
          content: data.content
        })
      } else {
        console.error('Failed to generate preview')
        setPreviewContent({
          subject: 'Preview Error',
          content: '<p>Failed to generate newsletter preview. Please try again.</p>'
        })
      }
    } catch (error) {
      console.error('Preview error:', error)
      
      let errorMessage = 'Failed to generate newsletter preview. Please try again.'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The newsletter generation is taking longer than expected. Please try again.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        }
      }
      
      setPreviewContent({
        subject: 'Preview Error',
        content: `<p>${errorMessage}</p>`
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSend = async (user: User) => {
    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (response.ok) {
        alert('Newsletter sent successfully!')
      } else {
        alert('Failed to send newsletter')
      }
    } catch (error) {
      console.error('Failed to send newsletter:', error)
      alert('Failed to send newsletter')
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, name: newUserName })
      })
      if (response.ok) {
        setNewUserEmail('')
        setNewUserName('')
        setAddUserOpen(false)
        fetchUsers()
      } else {
        alert('Failed to add user')
      }
    } catch (error) {
      console.error('Failed to add user:', error)
      alert('Failed to add user')
    }
  }

  const handleSaveSpec = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: editedSpec })
      })
      if (response.ok) {
        setEditSpecOpen(false)
        fetchUsers()
      } else {
        alert('Failed to update spec')
      }
    } catch (error) {
      console.error('Failed to update spec:', error)
      alert('Failed to update spec')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Newsletter Admin Dashboard</h1>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name (Optional)</label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={!newUserEmail}>
                  Add User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('history')
                if (newsletters.length === 0) {
                  fetchNewsletterHistory()
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Newsletter History
            </button>
          </nav>
        </div>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSpec(user)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Spec
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(user)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSend(user)}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Newsletter History Table */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading newsletter history...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {newsletters.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No newsletters sent yet. Use the "Send" button to dispatch newsletters to users.
                      </td>
                    </tr>
                  ) : (
                    newsletters.map((newsletter: Newsletter) => (
                      <tr key={newsletter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {newsletter.user?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {newsletter.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(newsletter.sentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sent
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Spec Modal */}
      <Dialog open={editSpecOpen} onOpenChange={setEditSpecOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Specification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User: {selectedUser?.email}</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Specification (JSON)</label>
              <Textarea
                value={editedSpec}
                onChange={(e) => setEditedSpec(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder='{
  "preferences": {
    "topics": ["technology", "startups"],
    "sendTime": "09:00",
    "timezone": "UTC"
  },
  "tone": "professional",
  "length": "medium"
}'
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditSpecOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSpec}>
                Save Spec
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        setPreviewOpen(open)
        if (!open) {
          setPreviewContent(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Newsletter Preview - {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-lg">Generating preview...</div>
              </div>
            ) : previewContent ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Subject: {previewContent.subject}</h3>
                <div className="bg-white p-4 rounded border">
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewContent.content }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Click "Preview" to generate newsletter content
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}