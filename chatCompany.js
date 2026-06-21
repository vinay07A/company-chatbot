import Groq from "groq-sdk";
import NodeCache from "node-cache";
import 'dotenv/config';
import { vectorStore } from "./prepare.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache messages per thread

export const baseMessages = [
    {
        role: "system",
        content: `You are a friendly and knowledgeable assistant named AIRocks.
        You can chat casually and also answer company-related questions using provided context.
        If the user's question seems unrelated to company policy, respond conversationally.
        If context is provided, use it to give accurate, concise answers.
        If you don't know something, say "I'm not sure about that.`
    }
];

// Generate chatbot response
export async function generate(userMessage, threadId) {
    const lowerMsg = userMessage.trim().toLowerCase();

    if (["bye", "goodbye", "see you", "exit", "quit"].some(phrase => lowerMsg.includes(phrase))) {
        cache.del(threadId);
        return "Goodbye! Have a great day";
    }
    console.log("userMessage--",userMessage);
    
    const relevantChunks = await vectorStore.similaritySearch(userMessage, 3);
    const context = relevantChunks.map(chunk => chunk.pageContent).join('\n\n');
    console.log("context--",context,userMessage);
    const userQuery = `Question: ${userMessage}
    Relevant context: ${context}
    Answer: `;


    const messages = cache.get(threadId) ?? [...baseMessages];
    messages.push({ role: "user", content: userQuery });

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            messages
        });

        const reply = response.choices[0]?.message?.content?.trim() || "I'm not sure how to respond.";
        messages.push({ role: "assistant", content: reply });

        // Save conversation in cache
        cache.set(threadId, messages);
        return reply;

    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, something went wrong while processing your message.";
    }
}