/**
 * Utilitário para tratar categorias de livros de forma robusta.
 * Lida com TODOS os formatos possíveis:
 * 1. Arrays reais: ['A', 'B']
 * 2. Arrays com elementos JSON embutidos: ['["A", "B"]'] (bug da migração)
 * 3. Strings JSON: '["A", "B"]'
 * 4. Strings Postgres array literal: '{A,B}'
 * 5. Strings simples: 'A'
 */
export function parseCategories(category: any): string[] {
    if (!category) return [];
    
    // Se já for um array real, processa cada elemento
    if (Array.isArray(category)) {
        const result: string[] = [];
        for (const item of category) {
            if (!item) continue;
            
            if (typeof item === 'string') {
                const trimmed = item.trim();
                if (trimmed === '') continue;
                
                // Se o elemento do array é um JSON array embutido: '["A", "B"]'
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            result.push(...parsed.filter(Boolean));
                            continue;
                        }
                    } catch (e) {
                        // Não é JSON, trata como string normal
                    }
                }
                
                // Se o elemento é um Postgres literal: '{A,B}'
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    const inner = trimmed.slice(1, -1);
                    if (inner) {
                        const items = inner.split(',').map(s => {
                            const cleaned = s.trim();
                            return cleaned.startsWith('"') && cleaned.endsWith('"') 
                                ? cleaned.slice(1, -1) 
                                : cleaned;
                        }).filter(Boolean);
                        result.push(...items);
                        continue;
                    }
                }
                
                // String simples → categoria direta
                result.push(trimmed);
            } else {
                // Elemento não é string, tenta recursivamente
                const sub = parseCategories(item);
                result.push(...sub);
            }
        }
        return result;
    }

    // Se for uma string, tenta interpretar
    if (typeof category === 'string') {
        const trimmed = category.trim();
        if (trimmed === '') return [];
        
        // Formato JSON array: ["A", "B"]
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.filter(Boolean);
                }
            } catch (e) { /* continua */ }
        }
        
        // Formato Postgres array literal: {A,B}
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1);
            if (inner === '') return [];
            return inner.split(',').map(s => {
                const cleaned = s.trim();
                return cleaned.startsWith('"') && cleaned.endsWith('"') 
                    ? cleaned.slice(1, -1) 
                    : cleaned;
            }).filter(Boolean);
        }
        
        // String simples
        return [trimmed];
    }

    return [];
}
