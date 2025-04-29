import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import OpenAI from 'openai';

interface DocumentationRequest {
    entityType: string;
    entityName: string;
    codeSnippet: string;
    language: string;
}

const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY ?? '';

if (!CHATGPT_API_KEY) {
    throw new Error('CHATGPT_API_KEY environment variable is not configured');
}

const openai = new OpenAI({
    apiKey: CHATGPT_API_KEY
});

export async function generateCodeDocumentation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Code documentation function processed request for url "${request.url}"`);

    try {
        const requestBody = await request.json() as DocumentationRequest;

        if (!requestBody.entityType || !requestBody.entityName || !requestBody.codeSnippet || !requestBody.language) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const prompt = `Here is the source code:

            ${requestBody.codeSnippet}
        
            `;

        const documentation = await callChatGPT(prompt, requestBody);

        return {
            status: 200,
            jsonBody: { documentation }
        };
    } catch (error) {
        context.error('Error in code documentation generation:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to generate documentation', message: error.message })
        };
    }
}

async function callChatGPT(prompt: string, entity: DocumentationRequest): Promise<string> {
    try {
        const model = "gpt-4.1";

        // const instructions = `You are an expert software engineer. Write a professional descriptive comment for the following ${entity.language} ${entity.entityType}. The comment should be concise, clear, and explain the purpose and usage. Return only comments that would be placed above the ${entity.entityType} in the code. Do not include any other text or explanations.`
        const instructions = `You are an expert software engineer. Write a short professional description for the following ${entity.language} ${entity.entityType}. The description should be concise, clear, and explain the purpose and usage. Write description without any ${entity.language} comment syntax. Do not include any other text or explanations.`

        const completion = await openai.responses.create({
            model: model,
            instructions: instructions,
            input: prompt,
        });

        return completion.output_text.trim() ?? '';
    } catch (error) {
        throw new Error(`ChatGPT API request failed: ${error.message}`);
    }
}

app.http('generateCodeDocumentation', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: generateCodeDocumentation
}); 