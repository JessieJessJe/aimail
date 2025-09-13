import { spawn } from 'child_process';
import path from 'path';

// Helper function to safely get environment variables
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

// Helper function to execute Deno script with timeout
async function executeDeno(scriptPath: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const denoPath = '/Users/jessiehan/.deno/bin/deno';
    const fullScriptPath = path.join(process.cwd(), scriptPath);
    
    // Set a timeout of 30 seconds for faster response
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Deno script execution timed out after 30 seconds'));
    }, 30000);
    
    const child = spawn(denoPath, [
      'run',
      '--allow-net',
      '--allow-env', 
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '--allow-sys',
      fullScriptPath,
      JSON.stringify(args)
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env,
        ANTHROPIC_API_KEY: getRequiredEnv('ANTHROPIC_API_KEY')
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Deno output: ${stdout}`));
        }
      } else {
        reject(new Error(`Deno script failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Deno process: ${error.message}`));
    });
  });
}

// HackerNews story interface
interface HNStory {
  title: string;
  url: string;
  points: number;
  comments: number;
  author: string;
  category: string;
  id: number;
}

class HackerNewsService {
  private initialized = false;
  private useZypher = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Temporarily disable Zypher for demo to avoid rate limits
      this.useZypher = false;
      console.log('HackerNews service initialized with mock data (Zypher disabled for demo)');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize HackerNews service:', error);
      throw error;
    }
  }

  async getTopStories(preferences: string[] = [], count: number = 10): Promise<HNStory[]> {
    try {
      if (this.useZypher) {
        // Use Zypher Agent with HackerNews MCP
        try {
          const stories = await executeDeno('scripts/zypher-agent.ts', {
            action: 'getStories',
            preferences,
            count
          });
          return stories;
        } catch (zypherError) {
          console.error('Zypher Agent failed, falling back to direct API:', zypherError);
          // Fall through to direct API
        }
      }
      
      // Direct HackerNews API fallback
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const storyIds = await response.json();
      
      const stories: HNStory[] = [];
      const maxStories = Math.min(count * 2, 30); // Get more stories to filter
      
      for (let i = 0; i < maxStories && stories.length < count; i++) {
        try {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
          const story = await storyResponse.json();
          
          if (story && story.title && story.url) {
            const hnStory: HNStory = {
              id: story.id,
              title: story.title,
              url: story.url,
              points: story.score || 0,
              comments: story.descendants || 0,
              author: story.by || 'unknown',
              category: this.categorizeStory(story.title)
            };
            
            // Filter by preferences if provided
            if (preferences.length === 0 || this.matchesPreferences(hnStory, preferences)) {
              stories.push(hnStory);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch story ${storyIds[i]}:`, error);
          continue;
        }
      }
      
      // If we don't have enough real stories, supplement with mock data
      if (stories.length < count) {
        const mockStories = this.getMockStories(preferences, count - stories.length);
        stories.push(...mockStories);
      }
      
      return stories.slice(0, count);
    } catch (error) {
      console.error('Failed to fetch HackerNews stories:', error);
      // Fallback to mock data if API fails
      return this.getMockStories(preferences, count);
    }
  }
  
  async generateNewsletterContent(userSpec: any, stories?: HNStory[]): Promise<{subject: string, content: string} | null> {
    if (!this.useZypher) {
      return null; // Let the existing logic handle content generation
    }
    
    try {
      const result = await executeDeno('scripts/zypher-agent.ts', {
        action: 'generateContent',
        userSpec,
        preferences: userSpec.preferences?.topics || [],
        count: userSpec.length === 'short' ? 3 : userSpec.length === 'medium' ? 5 : 8
      });
      return result as {subject: string, content: string} | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a rate limit error
      if (errorMessage.includes('Rate limit exceeded')) {
        console.warn('Zypher API rate limit reached, falling back to standard newsletter generation');
      } else {
        console.error('Failed to generate content with Zypher Agent:', error);
      }
      
      return null; // Fall back to existing logic
    }
  }
  
  private categorizeStory(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('ai') || titleLower.includes('machine learning') || titleLower.includes('gpt')) return 'ai';
    if (titleLower.includes('react') || titleLower.includes('vue') || titleLower.includes('frontend')) return 'frontend';
    if (titleLower.includes('backend') || titleLower.includes('api') || titleLower.includes('server')) return 'backend';
    if (titleLower.includes('security') || titleLower.includes('vulnerability') || titleLower.includes('hack')) return 'security';
    if (titleLower.includes('blockchain') || titleLower.includes('crypto') || titleLower.includes('bitcoin')) return 'blockchain';
    if (titleLower.includes('startup') || titleLower.includes('funding') || titleLower.includes('vc')) return 'startups';
    if (titleLower.includes('programming') || titleLower.includes('code') || titleLower.includes('developer')) return 'programming';
    if (titleLower.includes('database') || titleLower.includes('sql') || titleLower.includes('nosql')) return 'databases';
    if (titleLower.includes('cloud') || titleLower.includes('aws') || titleLower.includes('azure')) return 'cloud';
    if (titleLower.includes('mobile') || titleLower.includes('ios') || titleLower.includes('android')) return 'mobile';
    
    return 'technology';
  }
  
  private matchesPreferences(story: HNStory, preferences: string[]): boolean {
    return preferences.some(pref => 
      story.category.toLowerCase().includes(pref.toLowerCase()) ||
      story.title.toLowerCase().includes(pref.toLowerCase())
    );
  }

  private parseStoriesFromResponse(response: string): HNStory[] {
    // This is a simplified parser - in production you'd want more robust parsing
    try {
      // Try to extract JSON if present
      const jsonMatch = response.match(/\[.*\]/);
      if (jsonMatch) {
        const stories = JSON.parse(jsonMatch[0]);
        return stories.map((story: any, index: number) => ({
          id: story.id || index,
          title: story.title || 'Untitled',
          url: story.url || '#',
          points: story.points || 0,
          comments: story.comments || 0,
          author: story.author || 'unknown',
          category: story.category || 'general'
        }));
      }
    } catch (error) {
      console.error('Failed to parse stories response:', error);
    }

    // Fallback parsing or return mock data
    return this.getMockStories([], 5);
  }

  private getMockStories(preferences: string[] = [], count: number = 10): HNStory[] {
    const mockStories = [
      {
        id: 1,
        title: "Show HN: I built a distributed database in Rust",
        url: "https://example.com/rust-db",
        points: 342,
        comments: 89,
        author: "rustdev2024",
        category: "databases"
      },
      {
        id: 2,
        title: "OpenAI releases GPT-5 with breakthrough reasoning capabilities",
        url: "https://example.com/gpt5",
        points: 1247,
        comments: 456,
        author: "airesearcher",
        category: "ai"
      },
      {
        id: 3,
        title: "Why I switched from React to Svelte for my startup",
        url: "https://example.com/react-svelte",
        points: 234,
        comments: 123,
        author: "frontend_dev",
        category: "frontend"
      },
      {
        id: 4,
        title: "The hidden costs of microservices architecture",
        url: "https://example.com/microservices",
        points: 567,
        comments: 234,
        author: "backend_guru",
        category: "architecture"
      },
      {
        id: 5,
        title: "Ask HN: What's your favorite debugging technique?",
        url: "https://example.com/debugging",
        points: 189,
        comments: 167,
        author: "curious_dev",
        category: "programming"
      },
      {
        id: 6,
        title: "Show HN: Real-time collaborative code editor in the browser",
        url: "https://example.com/code-editor",
        points: 445,
        comments: 78,
        author: "webdev_pro",
        category: "web development"
      },
      {
        id: 7,
        title: "The future of blockchain beyond cryptocurrency",
        url: "https://example.com/blockchain-future",
        points: 298,
        comments: 156,
        author: "crypto_analyst",
        category: "blockchain"
      },
      {
        id: 8,
        title: "How we reduced our AWS costs by 80% with smart caching",
        url: "https://example.com/aws-optimization",
        points: 678,
        comments: 234,
        author: "devops_master",
        category: "cloud"
      },
      {
        id: 9,
        title: "Security vulnerability found in popular npm package",
        url: "https://example.com/npm-security",
        points: 892,
        comments: 345,
        author: "security_researcher",
        category: "security"
      },
      {
        id: 10,
        title: "Ask HN: Best practices for remote team management?",
        url: "https://example.com/remote-management",
        points: 156,
        comments: 89,
        author: "startup_cto",
        category: "management"
      }
    ];

    // Filter by preferences if provided
    let filteredStories = mockStories;
    if (preferences.length > 0) {
      filteredStories = mockStories.filter(story => 
        preferences.some(pref => 
          story.category.toLowerCase().includes(pref.toLowerCase()) ||
          story.title.toLowerCase().includes(pref.toLowerCase())
        )
      );
    }

    return filteredStories.slice(0, count);
  }
}

// Export singleton instance
// Export function to call Zypher Agent directly for email responses
export async function callZypherAgent(prompt: string): Promise<string> {
  // Temporary mock response for testing - replace with actual Zypher call once performance is optimized
  console.log('Mock Claude response for prompt:', prompt.substring(0, 50) + '...')
  
  // Simulate a realistic AI response based on the prompt content
  if (prompt.toLowerCase().includes('ai') || prompt.toLowerCase().includes('artificial intelligence')) {
    return `Thanks for your question about AI developments! Here are some key trends I'm seeing:

• **Large Language Models**: Continued improvements in reasoning capabilities and multimodal understanding
• **AI Agents**: More sophisticated autonomous systems that can perform complex tasks
• **Edge AI**: Bringing AI capabilities directly to devices for better privacy and performance

The field is moving incredibly fast, with new breakthroughs happening regularly. What specific aspect of AI interests you most?

Best regards,
Newsly AI Assistant`
  }
  
  if (prompt.toLowerCase().includes('tech') || prompt.toLowerCase().includes('technology')) {
    return `Great question about current tech trends! Here's what's catching my attention:

• **AI Integration**: Every industry is finding ways to incorporate AI tools
• **Quantum Computing**: Making steady progress toward practical applications
• **Sustainable Tech**: Green energy solutions and carbon-neutral computing

These developments are reshaping how we work and live. Are there any particular areas you'd like to explore further?

Best,
Newsly AI Assistant`
  }
  
  return `Thanks for reaching out! I appreciate your engagement with the newsletter.

Your message has been received and I'm here to help with any questions about technology, startups, or the latest developments in the tech world.

Feel free to ask about specific topics you're interested in, and I'll do my best to provide insights and analysis.

Best regards,
Newsly AI Assistant`
}

export const hackerNewsService = new HackerNewsService();
export type { HNStory };