import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Simple in-memory rate limiter (works without Upstash for now)
// Replace with Upstash when UPSTASH_REDIS_REST_URL is configured
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = requestCounts.get(identifier);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true; // allowed
}

async function searchIndexedContent(query: string, userId: string) {
  try {
    const supabase = createClient();
    const word = query.split(" ").find((w: string) => w.length > 3) || query.split(" ")[0];

    const { data: a } = await supabase
      .from("indexed_content")
      .select("id, title, content, url, tool")
      .eq("user_id", userId)
      .ilike("content", "%" + word + "%")
      .limit(4);

    const { data: b } = await supabase
      .from("indexed_content")
      .select("id, title, content, url, tool")
      .eq("user_id", userId)
      .ilike("title", "%" + word + "%")
      .limit(3);

    const seen = new Set<string>();
    return [...(a || []), ...(b || [])].filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).slice(0, 5);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // On Safari, cookies sometimes don't reach API routes even when the user
    // is logged in. We use user?.id for rate limiting but don't hard-block
    // if session is missing — middleware already protects the dashboard route.
    const userId = user?.id || "anonymous";

    // Rate limit: 20 requests per minute per user
    const allowed = checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery   = lastMessage?.content || "";

    let contextDocs: any[] = [];
    let contextText = "";

    if (userQuery && user) {
      contextDocs = await searchIndexedContent(userQuery, userId);
      if (contextDocs.length > 0) {
        contextText = "\n\nRELEVANT CONTENT FROM YOUR CONNECTED TOOLS:\n" +
          contextDocs.map((doc, i) =>
            "[" + (i + 1) + "] FROM " + doc.tool.toUpperCase() + " — \"" + doc.title + "\"\n" +
            doc.content.slice(0, 800) + "\nSource: " + doc.url
          ).join("\n\n---\n\n");
      }
    }

    const tools       = context?.tools || [];
    const hasRealData = contextDocs.length > 0;

    const systemPrompt = `You are Sypora AI, an intelligent workspace assistant that helps teams find information, summarize documents, analyze data and automate tasks.

${hasRealData
  ? "You have access to REAL content from the user's connected tools. Use this content to give accurate, specific answers. Always cite which tool and document the information came from."
  : "You are connected to: " + (tools.length ? tools.join(", ") : "no tools yet") + ". No content has been indexed yet. Answer helpfully from general knowledge."
}

Guidelines:
- When you have real content, reference it specifically
- Always mention which tool and document your answer came from
- If no relevant content found, say so and answer from general knowledge
- Be concise, clear and actionable
- Format with headers and bullets when appropriate
${contextText}`;

    const completion = await groq.chat.completions.create({
      model:      "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const sources = contextDocs.map(doc => ({ title: doc.title, url: doc.url, tool: doc.tool }));

    return NextResponse.json({ content, sources, usage: completion.usage });

  } catch (error: any) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to process request" },
      { status: 500 }
    );
  }
}
