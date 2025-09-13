import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

// Enhanced newsletter generation with realistic HackerNews content
function generateNewsletter(userSpec: any): { subject: string; content: string } {
  const spec = typeof userSpec === 'string' ? JSON.parse(userSpec) : userSpec
  
  const mockHNStories = [
    {
      title: "Show HN: I built a distributed database in Rust",
      url: "https://example.com/rust-db",
      points: 342,
      comments: 89,
      author: "rustdev2024",
      category: "databases"
    },
    {
      title: "OpenAI releases GPT-5 with breakthrough reasoning capabilities",
      url: "https://example.com/gpt5",
      points: 1247,
      comments: 456,
      author: "airesearcher",
      category: "ai"
    },
    {
      title: "Why I switched from React to Svelte for my startup",
      url: "https://example.com/react-svelte",
      points: 234,
      comments: 123,
      author: "frontend_dev",
      category: "frontend"
    },
    {
      title: "The hidden costs of microservices architecture",
      url: "https://example.com/microservices",
      points: 567,
      comments: 234,
      author: "backend_guru",
      category: "architecture"
    },
    {
      title: "Ask HN: What's your favorite debugging technique?",
      url: "https://example.com/debugging",
      points: 189,
      comments: 167,
      author: "curious_dev",
      category: "programming"
    }
  ]

  // Filter stories based on user preferences
  const userPrefs = spec.preferences || []
  const filteredStories = userPrefs.length > 0 
    ? mockHNStories.filter(story => 
        userPrefs.some((pref: string) => 
          story.category.toLowerCase().includes(pref.toLowerCase()) ||
          story.title.toLowerCase().includes(pref.toLowerCase())
        )
      )
    : mockHNStories.slice(0, 3)

  const selectedStories = filteredStories.slice(0, spec.length === 'short' ? 3 : spec.length === 'medium' ? 5 : 7)

  const toneStyle = {
    professional: 'Here are the top stories from HackerNews that match your interests:',
    casual: 'Hey! Check out these cool stories I found for you on HN:',
    technical: 'Technical digest: Key developments in your areas of interest:'
  }

  const intro = toneStyle[spec.tone as keyof typeof toneStyle] || toneStyle.professional

  const storyHtml = selectedStories.map(story => `
    <div style="margin: 20px 0; padding: 15px; border-left: 3px solid #ff6600; background: #f9f9f9;">
      <h3 style="margin: 0 0 8px 0; color: #333;">
        <a href="${story.url}" style="color: #000; text-decoration: none;">${story.title}</a>
      </h3>
      <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
        ${story.points} points | ${story.comments} comments | by ${story.author}
      </div>
      ${spec.includeAnalysis ? `<p style="color: #555; font-style: italic; margin: 8px 0 0 0;">💡 This story relates to ${story.category} and aligns with your interest in ${userPrefs.join(', ')}.</p>` : ''}
    </div>
  `).join('')

  return {
    subject: `Your HackerNews Digest: ${selectedStories.length} ${spec.tone} stories - ${new Date().toLocaleDateString()}`,
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6600; margin: 0;">🗞️ Your HackerNews Digest</h1>
          <p style="color: #666; margin: 10px 0 0 0;">${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #333; line-height: 1.6;">${intro}</p>
        
        ${storyHtml}
        
        <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">📊 Your Preferences</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Topics:</strong> ${userPrefs.join(', ') || 'All topics'}<br>
            <strong>Tone:</strong> ${spec.tone}<br>
            <strong>Length:</strong> ${spec.length}<br>
            <strong>Analysis:</strong> ${spec.includeAnalysis ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Reply to this email with feedback to improve your next digest!</p>
        </div>
      </div>
    `
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate newsletter content based on user spec
    const newsletter = generateNewsletter(user.spec)

    // For demo purposes, we'll just log the email instead of actually sending it
    // In production, you would configure nodemailer with your email service
    console.log('Newsletter would be sent to:', user.email)
    console.log('Subject:', newsletter.subject)
    console.log('Content preview:', newsletter.content.substring(0, 200) + '...')

    // Save newsletter to database
    const savedNewsletter = await prisma.newsletter.create({
      data: {
        userId: user.id,
        subject: newsletter.subject,
        content: newsletter.content
      }
    })

    // TODO: Uncomment and configure when ready to send actual emails
    /*
    const transporter = nodemailer.createTransporter({
      // Configure your email service here
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: newsletter.subject,
      html: newsletter.content
    })
    */

    return NextResponse.json({ 
      message: 'Newsletter sent successfully',
      newsletter: savedNewsletter
    })
  } catch (error) {
    console.error('Failed to send newsletter:', error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}