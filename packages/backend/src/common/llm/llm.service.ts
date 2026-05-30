import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

export interface LLMProvider {
  generateText(prompt: string, maxTokens?: number): Promise<string>;
}

@Injectable()
export class LLMService {
  private logger = new Logger(LLMService.name);
  private providers: Map<string, LLMProvider> = new Map();
  private providerOrder: string[] = [];

  constructor(private configService: ConfigService) {
    this.initializeProviders();
    this.setupProviderOrder();
    this.logger.log(`LLM Provider Order: ${this.providerOrder.join(" → ")}`);
  }

  private initializeProviders(): void {
    const googleKey = this.configService.get<string>("GOOGLE_API_KEY");
    if (googleKey) {
      this.logger.log("✓ Google Gemini provider available");
      this.providers.set("google", new GoogleProvider(googleKey));
    } else {
      this.logger.warn("✗ Google Gemini provider not configured (no API key)");
    }

    const mistralKey = this.configService.get<string>("MISTRAL_API_KEY");
    if (mistralKey) {
      this.logger.log("✓ Mistral provider available");
      const model = this.configService.get<string>("MISTRAL_MODEL") || "mistral-large-latest";
      this.providers.set("mistral", new MistralProvider(mistralKey, model));
    } else {
      this.logger.warn("✗ Mistral provider not configured (no API key)");
    }

    const anthropicKey = this.configService.get<string>("ANTHROPIC_API_KEY");
    if (anthropicKey) {
      this.logger.log("✓ Anthropic provider available");
      const model = this.configService.get<string>("ANTHROPIC_MODEL") || "claude-3-5-sonnet-20241022";
      this.providers.set("anthropic", new AnthropicProvider(anthropicKey, model));
    } else {
      this.logger.warn("✗ Anthropic provider not configured (no API key)");
    }
  }

  private setupProviderOrder(): void {
    const primary = this.configService.get<string>("LLM_PRIMARY_PROVIDER") || "mistral";
    const secondary = this.configService.get<string>("LLM_SECONDARY_PROVIDER") || "google";
    const tertiary = this.configService.get<string>("LLM_TERTIARY_PROVIDER") || "anthropic";

    // Add primary
    if (this.providers.has(primary)) {
      this.providerOrder.push(primary);
    }

    // Add secondary (avoid duplicates)
    if (this.providers.has(secondary) && secondary !== primary) {
      this.providerOrder.push(secondary);
    }

    // Add tertiary (avoid duplicates)
    if (this.providers.has(tertiary) && tertiary !== primary && tertiary !== secondary) {
      this.providerOrder.push(tertiary);
    }

    // Add any remaining available providers
    for (const provider of this.providers.keys()) {
      if (!this.providerOrder.includes(provider)) {
        this.providerOrder.push(provider);
      }
    }

    if (this.providerOrder.length === 0) {
      throw new BadRequestException(
        "No LLM providers configured. Please set API keys for at least one provider (MISTRAL_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY)"
      );
    }
  }

  async generate(
    prompt: string,
    options?: { maxTokens?: number; retries?: number }
  ): Promise<string> {
    const maxRetries = options?.retries ?? 3;
    const maxTokens = options?.maxTokens ?? 2000;
    let lastError: Error | null = null;

    // Try each provider in order
    for (const providerName of this.providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      this.logger.log(`Attempting generation with ${providerName} provider`);

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await provider.generateText(prompt, maxTokens);
          this.logger.log(`✓ Successfully generated text using ${providerName}`);
          return result;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `${providerName} attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`
          );

          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      // Move to next provider
      this.logger.warn(`${providerName} exhausted all retries, trying next provider...`);
    }

    this.logger.error("All LLM providers failed after retries");
    throw lastError || new BadRequestException("All LLM providers failed. Please check your API keys and configuration.");
  }

  async generateMultiple(
    prompts: string[],
    options?: { maxTokens?: number }
  ): Promise<string[]> {
    return Promise.all(prompts.map((p) => this.generate(p, options)));
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderOrder(): string[] {
    return [...this.providerOrder];
  }
}

class GoogleProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private logger = new Logger(GoogleProvider.name);

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt: string, maxTokens: number = 2000): Promise<string> {
    const model = this.client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No text response from Gemini");
    }

    return text;
  }
}

class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;
  private logger = new Logger(AnthropicProvider.name);

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateText(prompt: string, maxTokens: number = 2000): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
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

class MistralProvider implements LLMProvider {
  private client: Mistral;
  private model: string;
  private logger = new Logger(MistralProvider.name);

  constructor(apiKey: string, model: string) {
    this.client = new Mistral({ apiKey });
    this.model = model;
  }

  async generateText(prompt: string, maxTokens: number = 2000): Promise<string> {
    const message = await this.client.chat.complete({
      model: this.model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens,
    });

    const content = message.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No text response from Mistral");
    }

    // Handle both string and array responses
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      // Extract text from content chunks
      const textContent = content
        .filter((chunk: any) => chunk.type === "text")
        .map((chunk: any) => chunk.text)
        .join("");

      if (!textContent) {
        throw new Error("No text content in Mistral response");
      }

      return textContent;
    }

    throw new Error("Unexpected content format from Mistral");
  }
}
