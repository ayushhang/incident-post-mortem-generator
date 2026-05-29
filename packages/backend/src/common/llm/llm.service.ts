import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMProvider {
  generateText(prompt: string, maxTokens?: number): Promise<string>;
}

@Injectable()
export class LLMService {
  private openaiProvider!: LLMProvider;
  private anthropicProvider!: LLMProvider;
  private primaryProvider!: "openai" | "anthropic";

  constructor(private configService: ConfigService) {
    this.primaryProvider =
      (this.configService.get<string>("LLM_PROVIDER") as "openai" | "anthropic") || "openai";
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const anthropicKey = this.configService.get<string>("ANTHROPIC_API_KEY");
    if (anthropicKey) {
      this.anthropicProvider = new AnthropicProvider(anthropicKey);
    }

    // Note: OpenAI would be implemented similarly
    // For now, using Anthropic as primary fallback
  }

  async generate(
    prompt: string,
    options?: { maxTokens?: number; retries?: number }
  ): Promise<string> {
    const maxRetries = options?.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (this.primaryProvider === "anthropic" && this.anthropicProvider) {
          return await this.anthropicProvider.generateText(
            prompt,
            options?.maxTokens
          );
        }

        // Fallback to Anthropic
        if (this.anthropicProvider) {
          return await this.anthropicProvider.generateText(
            prompt,
            options?.maxTokens
          );
        }

        throw new BadRequestException("No LLM provider configured");
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new BadRequestException("LLM generation failed");
  }

  async generateMultiple(
    prompts: string[],
    options?: { maxTokens?: number }
  ): Promise<string[]> {
    return Promise.all(prompts.map((p) => this.generate(p, options)));
  }
}

class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt: string, maxTokens: number = 2000): Promise<string> {
    const message = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return textBlock.text;
  }
}
