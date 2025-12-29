/**
 * Nano Banana AI Service
 * Integração com Google Gemini API para geração de resumos e análise de texto
 * 
 * NOTA: Gemini não suporta geração de imagens. Para isso, use serviços como:
 * - DALL-E (OpenAI)
 * - Stable Diffusion
 * - Midjourney API
 */

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
    console.warn('⚠️ VITE_GOOGLE_API_KEY não configurada. Funcionalidades de IA estarão limitadas.');
}

// Modelos disponíveis
const TEXT_MODEL = 'gemini-2.0-flash-exp'; // Para resumos e análise de texto

/**
 * DEPRECATED: Gemini não gera imagens
 * Mantido apenas para compatibilidade com código existente
 */
export const ImageResolutions = {
    COURSE_THUMBNAIL: { width: 1200, height: 675, aspectRatio: '16:9' },
    LESSON_BANNER: { width: 1920, height: 600, aspectRatio: '16:5' },
    PROFILE_AVATAR: { width: 512, height: 512, aspectRatio: '1:1' },
    CERTIFICATE: { width: 1754, height: 1240, aspectRatio: 'A4' },
    SOCIAL_SHARE: { width: 1200, height: 630, aspectRatio: '1.91:1' },
    ICON: { width: 256, height: 256, aspectRatio: '1:1' },
} as const;

export type ImageResolutionType = keyof typeof ImageResolutions;

/**
 * DEPRECATED: Interface mantida para compatibilidade
 */
export interface GenerateImageRequest {
    prompt: string;
    resolution: ImageResolutionType;
    style?: 'realistic' | 'illustration' | 'minimalist' | 'professional' | 'vibrant';
    usePro?: boolean;
}

/**
 * Interface para requisição de resumo de texto
 */
export interface GenerateSummaryRequest {
    text: string;
    maxLength?: number; // Número máximo de palavras
    style?: 'concise' | 'detailed' | 'bullet-points' | 'academic';
    language?: string;
}

/**
 * DEPRECATED: Gemini não suporta geração de imagens
 * Esta função foi mantida apenas para compatibilidade, mas sempre retornará erro
 * 
 * Para geração de imagens, considere usar:
 * - DALL-E 3 (OpenAI): https://platform.openai.com/docs/guides/images
 * - Stable Diffusion: https://stability.ai/
 * - Replicate: https://replicate.com/
 */
/**
 * Gera imagem usando Pollinations.ai (Gratuito, sem API Key)
 */
export async function generateImage(request: GenerateImageRequest): Promise<string> {
    const encodedPrompt = encodeURIComponent(request.prompt);

    // Get resolution from the request type
    const resolution = ImageResolutions[request.resolution];
    const width = resolution.width;
    const height = resolution.height;

    // Construct URL
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    // Validar se a imagem é gerável (ping)
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            return url;
        } else {
            throw new Error('Falha ao conectar com serviço de imagem.');
        }
    } catch (e) {
        console.warn('Pollinations verify failed, returning URL anyway:', e);
        return url;
    }
}

/**
 * Gera texto ou melhoria de conteúdo usando Gemini
 */
export async function generateText(prompt: string, context?: string): Promise<string> {
    try {
        // Fallback para API Key se definida
        if (API_KEY) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: context ? `Contexto: ${context}\n\nTarefa: ${prompt}` : prompt }] }]
                    })
                }
            );
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        throw new Error('API Key não configurada para texto.');
    } catch (error) {
        console.error('Text gen error:', error);
        throw error;
    }
}

/**
 * Gera um resumo de texto usando Gemini via API REST
 */
export async function generateSummary(request: GenerateSummaryRequest): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error('API Key do Google não configurada');
        }

        const stylePrompts = {
            concise: 'Create a brief, concise summary in 2-3 sentences.',
            detailed: 'Create a comprehensive summary covering all main points.',
            'bullet-points': 'Create a summary using bullet points for key takeaways.',
            academic: 'Create an academic-style summary with formal language.'
        };

        const styleInstruction = stylePrompts[request.style || 'concise'];
        const maxLengthInstruction = request.maxLength
            ? `Keep the summary under ${request.maxLength} words.`
            : '';
        const languageInstruction = request.language
            ? `Write the summary in ${request.language}.`
            : 'Write the summary in Portuguese (Brazil).';

        const prompt = `
${styleInstruction}
${maxLengthInstruction}
${languageInstruction}

Text to summarize:
${request.text}

Summary:
    `.trim();

        console.log('📝 Gerando resumo com Gemini:', {
            textLength: request.text.length,
            style: request.style || 'concise',
            maxLength: request.maxLength
        });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return summary.trim();

    } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error);
        throw new Error(`Falha ao gerar resumo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}

/**
 * Gera anotações estruturadas de uma aula
 */
export async function generateLessonNotes(lessonContent: string): Promise<string> {
    try {
        if (!API_KEY) {
            throw new Error('API Key do Google não configurada');
        }

        const prompt = `
Você é um assistente educacional. Analise o conteúdo da aula abaixo e crie anotações estruturadas e úteis para o aluno.

Formato das anotações:
1. **Resumo Geral** (2-3 frases)
2. **Conceitos Principais** (lista com 3-5 pontos)
3. **Pontos-Chave** (detalhes importantes)
4. **Exemplos Práticos** (se aplicável)
5. **Dicas de Estudo** (sugestões para fixação)

Conteúdo da aula:
${lessonContent}

Anotações:
    `.trim();

        console.log('📚 Gerando anotações da aula com Gemini');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const notes = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return notes.trim();

    } catch (error) {
        console.error('❌ Erro ao gerar anotações:', error);
        throw new Error(`Falha ao gerar anotações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}

/**
 * Gera sugestões de imagens baseadas em contexto
 */
export function generateImagePromptSuggestions(context: {
    type: ImageResolutionType;
    title: string;
    description?: string;
    keywords?: string[];
}): string[] {
    const { type, title, description, keywords } = context;

    const basePrompts: Record<ImageResolutionType, string[]> = {
        COURSE_THUMBNAIL: [
            `Professional course thumbnail for "${title}", modern educational design`,
            `Vibrant learning illustration representing ${title}`,
            `Clean minimalist design for ${title} course`,
        ],
        LESSON_BANNER: [
            `Wide banner image for lesson about ${title}`,
            `Educational hero image for ${title}`,
            `Professional header design for ${title} lesson`,
        ],
        PROFILE_AVATAR: [
            `Professional avatar icon for ${title}`,
            `Modern user profile picture representing ${title}`,
        ],
        CERTIFICATE: [
            `Elegant certificate design for ${title}`,
            `Professional achievement certificate for ${title}`,
        ],
        SOCIAL_SHARE: [
            `Social media share image for ${title}`,
            `Engaging preview card for ${title}`,
        ],
        ICON: [
            `Simple icon representing ${title}`,
            `Minimalist logo for ${title}`,
        ],
    };

    let suggestions = basePrompts[type] || [];

    // Adicionar contexto de descrição e keywords
    if (description || keywords?.length) {
        const contextInfo = [description, ...(keywords || [])].filter(Boolean).join(', ');
        suggestions = suggestions.map(s => `${s}. Context: ${contextInfo}`);
    }

    return suggestions;
}

/**
 * Utilitário para verificar se a API está configurada
 */
export function isNanoBananaConfigured(): boolean {
    return !!API_KEY;
}

export default {
    generateImage,
    generateSummary,
    generateLessonNotes,
    generateImagePromptSuggestions,
    isNanoBananaConfigured,
    ImageResolutions,
};
