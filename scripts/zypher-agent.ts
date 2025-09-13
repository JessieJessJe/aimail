#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

// @ts-ignore - Deno types not available in Node.js environment
declare const Deno: {
  env: { get(key: string): string | undefined };
  args: string[];
  exit(code: number): never;
};

// @ts-ignore - ImportMeta.main is Deno-specific
declare interface ImportMeta {
  main: boolean;
}

// Interface for HackerNews story
interface HNStory {
  title: string;
  url: string;
  points: number;
  comments: number;
  author: string;
  category: string;
  id: number;
}

// Interface for the command arguments
interface CommandArgs {
  action: 'getStories' | 'generateContent' | 'chat';
  preferences?: string[];
  count?: number;
  userSpec?: any;
  prompt?: string;
}

class ZypherHackerNewsService {
  private agent: any = null;
  private initialized = false;
  private AnthropicModelProvider: any;
  private ZypherAgent: any;
  private eachValueFrom: any;
  private rateLimiter: { calls: number; resetTime: number } = { calls: 0, resetTime: Date.now() + 60000 };

  async initialize() {
    if (this.initialized) return;

    try {
      // Import real Zypher dependencies using JSR format for Deno
      // @ts-ignore - Deno JSR imports not recognized by TypeScript in Node.js context
      const { AnthropicModelProvider, ZypherAgent } = await import("jsr:@corespeed/zypher");
      // @ts-ignore - npm imports in Deno
      const { eachValueFrom } = await import("npm:rxjs-for-await");
      
      this.AnthropicModelProvider = AnthropicModelProvider;
      this.ZypherAgent = ZypherAgent;
      this.eachValueFrom = eachValueFrom;

      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY environment variable is not set");
      }

      // Create the agent with Anthropic provider
      this.agent = new this.ZypherAgent(
        new this.AnthropicModelProvider({
          apiKey,
        }),
      );

      // Register HackerNews MCP server
      await this.agent.mcpServerManager.registerServer({
        id: "hackernews",
        type: "command",
        command: {
          command: "npx",
          args: ["-y", "hackernews-mcp"],
          env: {},
        },
      });

      // Initialize the agent
      await this.agent.init();
      this.initialized = true;
      console.error('Zypher Agent with HackerNews MCP initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Zypher Agent:', error);
      throw error;
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();
    
    // Reset counter if minute has passed
    if (now >= this.rateLimiter.resetTime) {
      this.rateLimiter.calls = 0;
      this.rateLimiter.resetTime = now + 60000; // Next minute
    }
    
    // Check if we've exceeded the limit
    if (this.rateLimiter.calls >= 5) {
      const waitTime = this.rateLimiter.resetTime - now;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`);
    }
    
    // Increment call counter
    this.rateLimiter.calls++;
  }

  async getTopStories(preferences: string[] = [], count: number = 10): Promise<HNStory[]> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    // Check rate limit before making API call
    this.checkRateLimit();

    try {
      const preferencesText = preferences.length > 0 
        ? `focusing on topics: ${preferences.join(', ')}` 
        : 'covering all topics';

      const task = `Use the HackerNews MCP to get the top ${count} stories from HackerNews ${preferencesText}. For each story, provide: title, URL, points, comment count, author, and categorize the topic (ai, frontend, backend, security, blockchain, startups, programming, databases, cloud, mobile, or technology). Return the data as a JSON array with this exact structure: [{"id": number, "title": string, "url": string, "points": number, "comments": number, "author": string, "category": string}]`;

      const event$ = this.agent.runTask(task, "claude-3-5-sonnet-20241022");
      
      let result = '';
      for await (const event of this.eachValueFrom(event$)) {
        if (event.type === 'text') {
          result += event.content;
        }
      }

      // Parse the result and convert to HNStory format
      return this.parseStoriesFromResponse(result);
    } catch (error) {
      console.error('Failed to fetch HackerNews stories via Zypher:', error);
      throw error;
    }
  }

  async generateNewsletterContent(userSpec: any, stories: HNStory[]): Promise<{subject: string, content: string}> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    // Check rate limit before making API call
    this.checkRateLimit();

    try {
      const spec = typeof userSpec === 'string' ? JSON.parse(userSpec) : userSpec;
      const preferences = spec.preferences?.topics || [];
      const tone = spec.preferences?.tone || 'professional';
      const length = spec.length || 'medium';
      const analysisEnabled = spec.preferences?.analysis || false;

      // Limit stories to 3 for demo to reduce token usage
      const limitedStories = stories.slice(0, 3);
      const storiesText = limitedStories.map(story => 
        `- ${story.title} (${story.points}pts, ${story.comments}c)`
      ).join('\n');

      // Reduced context prompt to stay within token limits
      const task = `Create newsletter from HN stories:

${storiesText}

Prefs: ${preferences.join(', ')}, ${tone} tone, ${length} length

Return JSON: {"subject": "...", "content": "HTML with story links and brief summaries"}`;

      const event$ = this.agent.runTask(task, "claude-3-5-sonnet-20241022");
      
      let result = '';
      for await (const event of this.eachValueFrom(event$)) {
        if (event.type === 'text') {
          result += event.content;
        }
      }

      // Parse the JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse newsletter content from AI response');
    } catch (error) {
      console.error('Failed to generate newsletter content:', error);
      throw error;
    }
  }

  // Direct chat method for email responses
  async chat(prompt: string): Promise<string> {
    this.checkRateLimit();
    
    if (!this.agent) {
      throw new Error('Zypher Agent not initialized');
    }

    try {
      const event$ = this.agent.runTask(prompt, "claude-3-5-sonnet-20241022");
      let fullResponse = '';
      
      for await (const event of this.eachValueFrom(event$)) {
        if (event.type === 'text') {
          fullResponse += event.content;
        }
      }
      
      return fullResponse.trim();
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  private parseStoriesFromResponse(response: string): HNStory[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const stories = JSON.parse(jsonMatch[0]);
        return stories.map((story: any) => ({
          id: story.id || Math.random(),
          title: story.title || 'Untitled',
          url: story.url || '#',
          points: story.points || 0,
          comments: story.comments || 0,
          author: story.author || 'unknown',
          category: story.category || 'technology'
        }));
      }
      
      // Fallback: try to parse line by line
      const lines = response.split('\n').filter(line => line.trim());
      const stories: HNStory[] = [];
      
      for (const line of lines) {
        if (line.includes('http') && line.includes('points')) {
          // Simple parsing for fallback
          stories.push({
            id: Math.random(),
            title: line.split('http')[0].trim(),
            url: line.match(/https?:\/\/[^\s]+/)?.[0] || '#',
            points: parseInt(line.match(/\d+\s+points/)?.[0] || '0'),
            comments: parseInt(line.match(/\d+\s+comments/)?.[0] || '0'),
            author: 'unknown',
            category: 'technology'
          });
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Failed to parse stories from response:', error);
      return [];
    }
  }
}

// Main execution
async function main() {
  try {
    const args: CommandArgs = JSON.parse(Deno.args[0] || '{}');
    const service = new ZypherHackerNewsService();
    await service.initialize();

    switch (args.action) {
      case 'getStories': {
        const stories = await service.getTopStories(args.preferences || [], args.count || 10);
        console.log(JSON.stringify(stories, null, 2));
        break;
      }
      case 'generateContent': {
        const stories = await service.getTopStories(args.preferences || [], args.count || 5);
        const content = await service.generateNewsletterContent(args.userSpec, stories);
        console.log(JSON.stringify(content, null, 2));
        break;
      }
      case 'chat': {
        if (!args.prompt) {
          throw new Error('Prompt is required for chat action');
        }
        const response = await service.chat(args.prompt);
        console.log(response);
        break;
      }
      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
    Deno.exit(1);
  }
}

// Check if this is the main module
if ((import.meta as any).main) {
  main();
}