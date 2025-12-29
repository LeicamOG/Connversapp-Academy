/**
 * Exemplo de uso dos componentes de IA
 * Este arquivo demonstra como integrar os componentes de geração de IA
 */

import React, { useState } from 'react';
import AIImageGenerator from './components/AIImageGenerator';
import AISummaryGenerator from './components/AISummaryGenerator';

export function ExemploGeracaoImagem() {
    const [imagemGerada, setImagemGerada] = useState<string | null>(null);

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-white">Exemplo: Geração de Imagem com IA</h1>

            <AIImageGenerator
                resolutionType="COURSE_THUMBNAIL"
                onImageGenerated={(url) => {
                    setImagemGerada(url);
                    console.log('✅ Imagem gerada com sucesso!');
                }}
                context={{
                    title: 'Curso de JavaScript Moderno',
                    description: 'Aprenda JavaScript ES6+ do zero ao avançado',
                    keywords: ['javascript', 'programação', 'web development']
                }}
            />

            {imagemGerada && (
                <div className="mt-6">
                    <h2 className="text-lg font-bold text-white mb-3">Resultado:</h2>
                    <img
                        src={imagemGerada}
                        alt="Imagem gerada"
                        className="rounded-lg border border-white/20 max-w-md"
                    />
                </div>
            )}
        </div>
    );
}

export function ExemploResumo() {
    const textoExemplo = `
    JavaScript é uma linguagem de programação interpretada estruturada, de script em alto nível 
    com tipagem dinâmica fraca e multiparadigma. Juntamente com HTML e CSS, o JavaScript é uma 
    das três principais tecnologias da World Wide Web. JavaScript permite páginas da Web 
    interativas e, portanto, é uma parte essencial dos aplicativos da web. A grande maioria 
    dos sites usa JavaScript, e todos os principais navegadores da Web têm um mecanismo 
    JavaScript dedicado para executá-lo.
    
    Como uma linguagem multiparadigma, o JavaScript suporta estilos de programação orientados 
    a eventos, funcionais e imperativos (incluindo orientado a objetos e prototype-based), 
    apresentando recursos como closures e funções de alta ordem comumente indisponíveis em 
    linguagens populares como Java e C++. Possui APIs para trabalhar com texto, matrizes, 
    datas, expressões regulares e o DOM, mas a linguagem em si não inclui nenhuma E/S, como 
    recursos de rede, armazenamento ou gráficos, contando com isso no ambiente host em que 
    está incorporado.
  `;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-white">Exemplo: Geração de Resumo</h1>

            <div className="bg-brand-card p-4 rounded-lg border border-white/10">
                <h3 className="text-sm font-bold text-gray-400 mb-2">TEXTO ORIGINAL:</h3>
                <p className="text-sm text-gray-300">{textoExemplo}</p>
            </div>

            <AISummaryGenerator
                text={textoExemplo}
                type="summary"
                onGenerated={(resumo) => {
                    console.log('✅ Resumo gerado:', resumo);
                }}
            />
        </div>
    );
}

export function ExemploAnotacoes() {
    const conteudoAula = `
    Nesta aula, vamos aprender sobre Promises em JavaScript. Promises são objetos que 
    representam a eventual conclusão (ou falha) de uma operação assíncrona e seu valor 
    resultante.
    
    Uma Promise pode estar em um de três estados:
    - Pending (pendente): estado inicial, nem cumprida nem rejeitada
    - Fulfilled (realizada): significa que a operação foi concluída com sucesso
    - Rejected (rejeitada): significa que a operação falhou
    
    Para criar uma Promise, usamos o construtor Promise:
    
    const minhaPromise = new Promise((resolve, reject) => {
      // código assíncrono aqui
      if (sucesso) {
        resolve(resultado);
      } else {
        reject(erro);
      }
    });
    
    Para consumir uma Promise, usamos os métodos .then() e .catch():
    
    minhaPromise
      .then(resultado => console.log(resultado))
      .catch(erro => console.error(erro));
    
    Também podemos usar async/await para trabalhar com Promises de forma mais legível:
    
    async function minhaFuncao() {
      try {
        const resultado = await minhaPromise;
        console.log(resultado);
      } catch (erro) {
        console.error(erro);
      }
    }
  `;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-white">Exemplo: Geração de Anotações de Aula</h1>

            <div className="bg-brand-card p-4 rounded-lg border border-white/10">
                <h3 className="text-sm font-bold text-gray-400 mb-2">CONTEÚDO DA AULA:</h3>
                <div className="text-sm text-gray-300 whitespace-pre-line">{conteudoAula}</div>
            </div>

            <AISummaryGenerator
                text={conteudoAula}
                type="notes"
                autoGenerate={false}
                onGenerated={(anotacoes) => {
                    console.log('✅ Anotações geradas:', anotacoes);
                }}
            />
        </div>
    );
}

// Exemplo de uso programático direto
export async function exemploUsoProgramatico() {
    const { generateImage, generateSummary, generateLessonNotes } = await import('./services/nanoBanana');

    try {
        // 1. Gerar imagem
        console.log('🎨 Gerando imagem...');
        const imagem = await generateImage({
            prompt: 'Uma ilustração profissional de um desenvolvedor programando',
            resolution: 'COURSE_THUMBNAIL',
            style: 'professional',
            usePro: false
        });
        console.log('✅ Imagem gerada:', imagem);

        // 2. Gerar resumo
        console.log('📝 Gerando resumo...');
        const resumo = await generateSummary({
            text: 'Texto longo aqui...',
            style: 'concise',
            maxLength: 100
        });
        console.log('✅ Resumo:', resumo);

        // 3. Gerar anotações
        console.log('📚 Gerando anotações...');
        const anotacoes = await generateLessonNotes('Conteúdo da aula aqui...');
        console.log('✅ Anotações:', anotacoes);

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

export default {
    ExemploGeracaoImagem,
    ExemploResumo,
    ExemploAnotacoes,
    exemploUsoProgramatico
};
