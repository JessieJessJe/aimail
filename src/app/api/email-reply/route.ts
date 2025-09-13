import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { callZypherAgent } from '@/lib/zypher-agent'
import nodemailer from 'nodemailer'

// Email reply handler that processes incoming emails and responds with Claude
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract email data (format may vary depending on email service webhook)
    const { from, subject, text, html, messageId, inReplyTo } = body
    
    if (!from || !text) {
      return NextResponse.json({ error: 'Missing required email fields' }, { status: 400 })
    }

    console.log('Received email reply from:', from)
    console.log('Subject:', subject)
    console.log('Content:', text)

    // Clean the email content (remove quoted text, signatures, etc.)
    const cleanedContent = cleanEmailContent(text)
    
    if (!cleanedContent.trim()) {
      console.log('No meaningful content found in email')
      return NextResponse.json({ message: 'Email processed but no content to respond to' })
    }

    // Generate Claude response
    const prompt = `You are an AI assistant helping with tech newsletter discussions. A user has replied to a newsletter with the following message:

"${cleanedContent}"

Please provide a thoughtful, engaging response that:
1. Addresses their specific points or questions
2. Provides additional insights about the tech topics mentioned
3. Encourages further discussion
4. Keeps the tone conversational and friendly
5. Limits the response to 2-3 paragraphs

Response:`

    let claudeResponse: string
    try {
      console.log('Calling Zypher agent with prompt:', prompt.substring(0, 100) + '...')
      claudeResponse = await callZypherAgent(prompt)
      console.log('Zypher agent response received:', claudeResponse.substring(0, 100) + '...')
    } catch (error) {
      console.error('Failed to get Claude response:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      claudeResponse = "Thanks for your message! I'm having trouble processing responses right now, but I appreciate your engagement with the newsletter. Please try again later or feel free to reach out directly."
    }

    // Send reply email (only if credentials are configured)
    let emailSent = false
    try {
      await sendReplyEmail(from, subject, claudeResponse, messageId)
      emailSent = true
      console.log('Reply email sent successfully to:', from)
    } catch (emailError) {
      console.error('Failed to send reply email:', emailError)
      // Continue processing even if email fails
    }

    // Log the conversation for future reference
    await logEmailConversation(from, cleanedContent, claudeResponse)

    return NextResponse.json({ 
      message: emailSent ? 'Email reply processed and response sent' : 'Email reply processed (email sending failed)',
      from,
      responseLength: claudeResponse.length,
      claudeResponse: claudeResponse.substring(0, 200) + '...', // Preview of response
      emailSent
    })
  } catch (error) {
    console.error('Failed to process email reply:', error)
    return NextResponse.json({ error: 'Failed to process email reply' }, { status: 500 })
  }
}

// Clean email content by removing quoted text, signatures, etc.
function cleanEmailContent(content: string): string {
  // Remove common email reply patterns
  let cleaned = content
    // Remove quoted text (lines starting with >)
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n')
    // Remove "On [date], [person] wrote:" patterns
    .replace(/On .+? wrote:/gi, '')
    // Remove common signature separators
    .replace(/--\s*$/gm, '')
    // Remove "Sent from my iPhone" type signatures
    .replace(/Sent from my .+$/gim, '')
    // Remove excessive whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return cleaned
}

// Send reply email using nodemailer
async function sendReplyEmail(to: string, originalSubject: string, content: string, inReplyTo?: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_FROM) {
    console.warn('Email configuration missing. Cannot send reply.')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  // Format reply subject
  const replySubject = originalSubject?.startsWith('Re: ') 
    ? originalSubject 
    : `Re: ${originalSubject || 'Newsletter Discussion'}`

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>🤖 AI Assistant Response</strong> - Powered by Claude
        </p>
      </div>
      
      <div style="line-height: 1.6; color: #333;">
        ${content.split('\n').map(paragraph => 
          paragraph.trim() ? `<p>${paragraph}</p>` : ''
        ).join('')}
      </div>
      
      <hr style="margin: 30px 0; border: 1px solid #eee;">
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
        <p style="margin: 0;">💡 <strong>Keep the conversation going!</strong> Reply to this email to continue our discussion about tech news and trends.</p>
      </div>
    </div>
  `

  const headers: any = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: replySubject,
    html: htmlContent
  }

  // Add In-Reply-To header if available for proper threading
  if (inReplyTo) {
    headers['In-Reply-To'] = inReplyTo
    headers['References'] = inReplyTo
  }

  await transporter.sendMail(headers)
  console.log('Reply sent to:', to)
}

// Log email conversation for analytics and improvement
async function logEmailConversation(userEmail: string, userMessage: string, aiResponse: string) {
  try {
    // You could extend the database schema to include email conversations
    // For now, we'll just log to console
    console.log('Email Conversation Log:')
    console.log('User:', userEmail)
    console.log('Message:', userMessage.substring(0, 100) + '...')
    console.log('Response:', aiResponse.substring(0, 100) + '...')
    
    // TODO: Save to database for analytics
    // await prisma.emailConversation.create({
    //   data: {
    //     userEmail,
    //     userMessage,
    //     aiResponse,
    //     timestamp: new Date()
    //   }
    // })
  } catch (error) {
    console.error('Failed to log email conversation:', error)
  }
}

// Webhook endpoint for email services (like SendGrid, Mailgun, etc.)
// This would be called by your email service when a reply is received
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Email reply webhook endpoint is active',
    instructions: 'Configure your email service to POST incoming emails to this endpoint'
  })
}