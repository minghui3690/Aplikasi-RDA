
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

export const askWithContext = async (req: Request, res: Response) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
        }

        // 1. Get Input
        const { memberId, messages, topic } = req.body; // messages = [{ role: 'user', content: '...' }]
        // 'topic' can be 'HD', 'BUSINESS', 'RELATIONSHIP', etc. to guide the lens.

        if (!memberId || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Invalid request body. memberId and messages array required.' });
        }

// 2. Fetch Member Context (HD Data)
        const member = await prisma.user.findUnique({
            where: { id: memberId },
            include: {
                humanDesign: true
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const hd = member.humanDesign;

        // 2.1 RETRIEVAL: Fetch Verification Data from Knowledge Base
        // We attempt to find "Official" descriptions for this user's specific attributes.
        // This effectively grounds the AI in our local database content.
        let knowledgeContext = "";
        
        if (hd) {
            const potentialKeys: string[] = [];

            // Helper to format keys: e.g. "Generator" -> "TYPE_GENERATOR"
            const formatKey = (prefix: string, value: string | null) => {
                if (!value) return null;
                // Replace spaces/slashes with underscore, uppercase
                return `${prefix}_${value.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`; 
            };

            if (hd.type) potentialKeys.push(formatKey('TYPE', hd.type)!);
            if (hd.profile) potentialKeys.push(formatKey('PROFILE', hd.profile)!);
            if (hd.authority) potentialKeys.push(formatKey('AUTHORITY', hd.authority)!);
            if (hd.strategy) potentialKeys.push(formatKey('STRATEGY', hd.strategy)!);
            
            // Fetch from DB
            const knowledgeItems = await prisma.hDKnowledge.findMany({
                where: {
                    key: { in: potentialKeys }
                }
            });

            if (knowledgeItems.length > 0) {
                knowledgeContext = `
=== OFFICIAL RDA KNOWLEDGE BASE (STRICT REFERENCE) ===
The following text is the SINGLE SOURCE OF TRUTH. Use this specific wording when explaining the user's design.

${knowledgeItems.map(item => `
[${item.category}: ${item.title}]
${item.contentLevel1 || ''}
${item.contentLevel2 || ''}
${item.contentLevel3 || ''}
---------------------------------------------------
`).join('\n')}
======================================================
`;
            }
        }

        // 3. Construct System Prompt
        // We act as an Expert Consultant.
        const hdContext = hd ? `
HUMAN DESIGN PROFILE FOR ${member.name}:
- Type: ${hd.type}
- Strategy: ${hd.strategy}
- Authority: ${hd.authority}
- Profile: ${hd.profile}
- Signature: ${hd.signature}
- Not-Self Theme: ${hd.notSelfTheme}
- Incarnation Cross: ${hd.incarnationCross}
- Centers (Open/Defined): ${JSON.stringify(hd.centers)}
- Channels: ${JSON.stringify(hd.channels)}
- Variables: Digestion(${hd.digestion}), Environment(${hd.environment}), Motivation(${hd.motivation})
        ` : 'No Human Design data available yet.';

        const systemInstruction = `
You are an expert Human Design Analyst and Life Consultant named "Kaka".
Your client is ${member.name}.
You have their Human Design chart data.

YOUR GOAL:
Answer the user's question accurately, BUT ALWAYS filter your advice through the lens of their Human Design Chart.

CRITICAL RULES FOR KNOWLEDGE USAGE:
1. I have provided an "OFFICIAL RDA KNOWLEDGE BASE" section below. 
2. IF the user's question relates to their Type, Strategy, or Authority found in that section, YOU MUST USE THAT CONTENT as the primary explanation.
3. If the knowledge base is empty or incomplete for a specific topic, you may use your general training, BUT explicitly state: "Maaf, referensi detail untuk bagian ini belum tersedia penuh di database kami, namun secara umum..."
4. DO NOT hallucinate URLs or features not mentioned.

CONTEXT:
${hdContext}

${knowledgeContext}

TONE:
Professional, empathetic, empowering, but direct. Use Human Design terminology naturally but explain it simply if complex.
`;

        // 4. Call Gemini
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ 
            // Verified working model via diagnostic script
            model: "gemini-flash-lite-latest",
            systemInstruction: systemInstruction 
        });

        // Convert simplistic messages to Gemini format if needed, but SDK handles simple strings or content objects
        // We only send the last message for now as the prompt + query, OR we can send history.
        // For simple usage, let's construct a chat session.
        
        const chat = model.startChat({
            history: messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const responseText = result.response.text();

        // 5. Return Response
        return res.json({ 
            response: responseText,
            usedModel: "gemini-1.5-flash"
        });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        // Expose the actual error message to the client for debugging
        return res.status(500).json({ 
            message: `AI Error: ${error.message || 'Unknown error'}`, 
            details: error 
        });
    }
};
