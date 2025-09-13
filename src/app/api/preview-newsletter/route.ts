import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hackerNewsService } from '@/lib/zypher-agent'

// Enhanced newsletter generation with realistic HackerNews content
async function generateNewsletter(userSpec: any): Promise<{ subject: string; content: string }> {
  const spec = typeof userSpec === 'string' ? JSON.parse(userSpec) : userSpec
  
  // Initialize HackerNews service
  await hackerNewsService.initialize();

  // Try AI-powered content generation first
  const aiContent = await hackerNewsService.generateNewsletterContent(spec);
  if (aiContent) {
    return aiContent;
  }

  // Fallback to existing logic
  const userPrefs = spec.preferences?.topics || []
  const storyCount = spec.length === 'short' ? 3 : spec.length === 'medium' ? 5 : 7
  const selectedStories = await hackerNewsService.getTopStories(userPrefs, storyCount)

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
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Generate newsletter preview
    const newsletter = await generateNewsletter(user.spec)
    
    return NextResponse.json({
      subject: newsletter.subject,
      content: newsletter.content,
      user: {
        email: user.email,
        name: user.name
      }
    })
    
  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}