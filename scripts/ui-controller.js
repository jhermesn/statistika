/**
 * Controlador da Interface
 * Cuida da navegação e interações da tela
 */
class UIController {
    constructor() {
        this.currentSection = 'variables';
        this.init();
    }

    /**
     * Inicializa o controlador
     */
    init() {
        this.setupTabNavigation();
        this.setupToggleSwitches();
        this.setupEventListeners();
        this.addAlertStyles();
        // Chart.js será verificado quando precisar
    }

    /**
     * Adiciona estilos dos alertas
     */
    addAlertStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .alert {
                animation: slideIn 0.3s ease-out;
                border-left: 4px solid;
                font-weight: 500;
            }
            
            .alert-error {
                background-color: #fef2f2 !important;
                color: #991b1b !important;
                border-color: #dc2626 !important;
                border-left-color: #dc2626 !important;
            }
            
            .alert-warning {
                background-color: #fefce8 !important;
                color: #a16207 !important;
                border-color: #eab308 !important;
                border-left-color: #eab308 !important;
            }
            
            .alert-success {
                background-color: #f0fdf4 !important;
                color: #166534 !important;
                border-color: #22c55e !important;
                border-left-color: #22c55e !important;
            }
            
            .alert-info {
                background-color: #eff6ff !important;
                color: #1e40af !important;
                border-color: #3b82f6 !important;
                border-left-color: #3b82f6 !important;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configura navegação entre abas
     */
    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section');
                this.switchSection(sectionId);
            });
        });
    }

    /**
     * Troca seção ativa
     * @param {string} sectionId - ID da seção
     */
    switchSection(sectionId) {
        // Atualizar abas ativas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Mostrar seção correspondente
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
        this.currentSection = sectionId;
        
        // Log simples
        this.trackSectionChange(sectionId);
    }

    /**
     * Configura toggle switches
     */
    setupToggleSwitches() {
        // Toggle para mostrar passos na análise de frequência
        const freqToggle = document.getElementById('freqStepsToggle');
        const freqLabel = freqToggle?.parentElement;
        if (freqToggle && freqLabel) {
            freqLabel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                freqToggle.classList.toggle('active');
                console.log('Freq toggle status:', freqToggle.classList.contains('active'));
            });
        }

        // Toggle para mostrar passos na análise de medidas
        const measuresToggle = document.getElementById('measuresStepsToggle');
        const measuresLabel = measuresToggle?.parentElement;
        if (measuresToggle && measuresLabel) {
            measuresLabel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                measuresToggle.classList.toggle('active');
                console.log('Measures toggle status:', measuresToggle.classList.contains('active'));
            });
        }
    }

    /**
     * Configura outros event listeners
     */
    setupEventListeners() {
        // Listener para redimensionamento da tela
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Listener para teclas de atalho
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Prevenir submit acidental de formulários
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Manipula redimensionamento da tela
     */
    handleResize() {
        try {
            // Verificar se Chart está disponível e se há instâncias
            if (typeof Chart !== 'undefined') {
                // Chart.js v4 não tem Chart.instances - usar Chart.registry
                if (Chart.registry && Chart.registry.getChart) {
                    // Redimensionar gráficos específicos se existirem
                    const chartIds = ['myChart', 'histogramChart', 'boxPlotChart'];
                    chartIds.forEach(id => {
                        const element = document.getElementById(id);
                        if (element) {
                            const chart = Chart.getChart(element);
                            if (chart && chart.resize) {
                                chart.resize();
                            }
                        }
                    });
                } else {
                    // Fallback para outras versões do Chart.js
                    Object.values(Chart.instances || {}).forEach(chart => {
                        if (chart && chart.resize) {
                            chart.resize();
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('Erro ao redimensionar gráficos:', error);
        }
    }

    /**
     * Manipula atalhos de teclado
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + 1-4 para trocar seções
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const sections = ['frequency', 'measures', 'charts', 'csv'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                this.switchSection(sections[sectionIndex]);
            }
        }

        // Escape para limpar resultados da seção atual
        if (e.key === 'Escape') {
            this.clearCurrentSectionResults();
        }
    }

    /**
     * Limpa resultados da seção atual
     */
    clearCurrentSectionResults() {
        switch (this.currentSection) {
            case 'variables':
                if (typeof clearVariableClassification === 'function') {
                    clearVariableClassification();
                }
                break;
            case 'frequency':
                if (typeof clearFrequency === 'function') {
                    clearFrequency();
                }
                break;
            case 'measures':
                if (typeof clearMeasures === 'function') {
                    clearMeasures();
                }
                break;
        }
    }

    /**
     * Exibe alerta para usuário
     * @param {string} message - Mensagem do alerta
     * @param {string} type - Tipo do alerta (info, warning, error, success)
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        const iconMap = {
            info: '💡',
            warning: '⚠️',
            error: '🚨',
            success: '✅'
        };

        alertDiv.innerHTML = `
            <span class="alert-icon">${iconMap[type] || '💡'}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                padding: 0.25rem;
                opacity: 0.7;
            ">×</button>
        `;

        alertDiv.style.display = 'flex';
        alertDiv.style.alignItems = 'center';
        alertDiv.style.gap = '0.75rem';

        // Inserir no topo da seção atual
        const currentSectionElement = document.getElementById(this.currentSection);
        const firstCard = currentSectionElement.querySelector('.card');
        
        if (firstCard) {
            firstCard.insertBefore(alertDiv, firstCard.firstChild);
            
            // Remover após tempo determinado
            const autoRemoveTime = type === 'error' ? 10000 : type === 'warning' ? 8000 : 5000;
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.style.opacity = '0';
                    alertDiv.style.transform = 'translateY(-10px)';
                    setTimeout(() => alertDiv.remove(), 300);
                }
            }, autoRemoveTime);
        }
    }

    /**
     * Exibe loading state
     * @param {string} elementId - ID do elemento para mostrar loading
     * @param {boolean} show - Se true mostra, se false esconde
     */
    showLoading(elementId, show = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (show) {
            element.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--border); border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: var(--secondary);">Processando dados...</p>
                </div>
            `;
        }
    }

    /**
     * Valida entrada de dados
     * @param {string} input - String de entrada
     * @returns {Object} Objeto com validação
     */
    validateInput(input) {
        const validation = {
            isValid: true,
            data: [],
            errors: []
        };

        if (!input || !input.trim()) {
            validation.isValid = false;
            validation.errors.push('Por favor, digite alguns dados para análise.');
            return validation;
        }

        // Tentar parsear os dados
        try {
            const data = input.split(',')
                .map(item => item.trim())
                .filter(item => item !== '')
                .map(Number);

            const validData = data.filter(n => !isNaN(n) && isFinite(n));

            if (validData.length === 0) {
                validation.isValid = false;
                validation.errors.push('Nenhum número válido encontrado. Use vírgulas para separar os valores.');
                return validation;
            }

            if (validData.length !== data.length) {
                const invalidCount = data.length - validData.length;
                validation.errors.push(`${invalidCount} valor(es) inválido(s) foram ignorados.`);
            }

            validation.data = validData;

        } catch (error) {
            validation.isValid = false;
            validation.errors.push('Erro ao processar os dados. Verifique o formato.');
        }

        return validation;
    }

    /**
     * Formata números para exibição
     * @param {number} value - Valor a ser formatado
     * @param {number} decimals - Número de casas decimais
     * @returns {string} Valor formatado
     */
    formatNumber(value, decimals = 4) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'N/A';
        }
        
        return value.toFixed(decimals);
    }

    /**
     * Função debounce para otimizar performance
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Tracking de mudança de seção (para analytics)
     * @param {string} sectionId - ID da seção
     */
    trackSectionChange(sectionId) {
        // Implementar analytics se necessário
        console.log(`Seção alterada para: ${sectionId}`);
    }

    /**
     * Copia texto para clipboard
     * @param {string} text - Texto a ser copiado
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Dados copiados para a área de transferência!', 'success');
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showAlert('Dados copiados para a área de transferência!', 'success');
        }
    }

    /**
     * Exporta resultados como arquivo markdown formatado
     * @param {string} sectionId - ID da seção para exportar
     */
    exportResults(sectionId) {
        const section = document.getElementById(sectionId);
        const results = section.querySelector('[id*="Results"]');
        
        if (!results || !results.innerHTML.trim()) {
            this.showAlert('Nenhum resultado para exportar.', 'warning');
            return;
        }

        // Gerar conteúdo markdown baseado na seção
        let markdownContent = '';
        const timestamp = new Date().toLocaleString('pt-BR');
        
        markdownContent += `# Relatório de Estatística Descritiva\n\n`;
        markdownContent += `**Gerado em:** ${timestamp}\n`;
        markdownContent += `**Sistema:** Sistema de Estatística Descritiva v2.0.2\n\n`;
        
        if (sectionId === 'frequency') {
            markdownContent += this.generateFrequencyMarkdown(section);
        } else if (sectionId === 'measures') {
            markdownContent += this.generateMeasuresMarkdown(section);
        } else if (sectionId === 'csv') {
            markdownContent += this.generateCSVMarkdown(section);
        }
        
        // Adicionar glossário de termos estatísticos
        markdownContent += this.generateStatisticalGlossary();
        
        // Criar e baixar arquivo
        this.downloadMarkdownFile(markdownContent, `relatorio-${sectionId}-${Date.now()}.md`);
    }

    /**
     * Gera markdown para análise de frequência
     */
    generateFrequencyMarkdown(section) {
        let content = `## 📊 Análise de Distribuição de Frequência\n\n`;
        
        content += `### Definição\n`;
        content += `A distribuição de frequência é uma organização dos dados em classes (intervalos) mostrando quantas observações caem em cada classe. É fundamental para compreender a forma da distribuição dos dados.\n\n`;
        
        content += `### Metodologia Aplicada\n`;
        content += `- **Regra de Sturges:** k = 1 + 3.322 × log₁₀(n)\n`;
        content += `- **Limitações:** Mínimo 4 classes, máximo 10 classes\n`;
        content += `- **Amplitude de classe:** h = AT / k\n`;
        content += `- **Amplitude total:** AT = Valor máximo - Valor mínimo\n\n`;
        
        // Extrair dados das tabelas
        const tables = section.querySelectorAll('table');
        tables.forEach((table, index) => {
            content += `### Tabela ${index + 1}\n`;
            content += this.convertTableToMarkdown(table);
            content += `\n`;
        });
        
        // Extrair interpretações
        const interpretations = section.querySelectorAll('.step-container');
        interpretations.forEach((interp, index) => {
            const title = interp.querySelector('.step-title')?.textContent || `Análise ${index + 1}`;
            content += `### ${title}\n`;
            const text = this.extractTextContent(interp);
            content += `${text}\n\n`;
        });
        
        return content;
    }

    /**
     * Gera markdown para análise de medidas
     */
    generateMeasuresMarkdown(section) {
        let content = `## 📊 Análise de Medidas Estatísticas\n\n`;
        
        content += `### Medidas de Tendência Central\n\n`;
        content += `#### Média Aritmética (x̄)\n`;
        content += `- **Fórmula:** x̄ = (Σxi) / n\n`;
        content += `- **Propriedades:** Sensível a outliers, ponto de equilíbrio dos dados\n`;
        content += `- **Interpretação:** Valor típico que representa o centro dos dados\n\n`;
        
        content += `#### Mediana (Md)\n`;
        content += `- **Definição:** Valor que divide a distribuição ao meio\n`;
        content += `- **Cálculo:** Valor central em dados ordenados (n ímpar) ou média dos dois valores centrais (n par)\n`;
        content += `- **Vantagem:** Não é afetada por outliers\n\n`;
        
        content += `#### Moda (Mo)\n`;
        content += `- **Definição:** Valor(es) que aparecem com maior frequência\n`;
        content += `- **Tipos:** Amodal (sem moda), Unimodal (uma moda), Bimodal (duas modas), Multimodal (várias modas)\n\n`;
        
        content += `### Medidas de Dispersão\n\n`;
        content += `#### Variância (s²)\n`;
        content += `- **Fórmula:** s² = Σ(xi - x̄)² / (n-1)\n`;
        content += `- **Unidade:** Quadrado da unidade original\n`;
        content += `- **Interpretação:** Mede a dispersão dos dados em torno da média\n\n`;
        
        content += `#### Desvio Padrão (s)\n`;
        content += `- **Fórmula:** s = √s²\n`;
        content += `- **Vantagem:** Mesma unidade dos dados originais\n`;
        content += `- **Interpretação:** Dispersão típica dos dados em relação à média\n\n`;
        
        content += `#### Coeficiente de Variação (CV)\n`;
        content += `- **Fórmula:** CV = (s / |x̄|) × 100%\n`;
        content += `- **Interpretação:**\n`;
        content += `  - CV < 15%: Baixa variabilidade (dados homogêneos)\n`;
        content += `  - 15% ≤ CV < 30%: Variabilidade moderada\n`;
        content += `  - CV ≥ 30%: Alta variabilidade (dados heterogêneos)\n\n`;
        
        content += `### Detecção de Outliers (Método IQR)\n\n`;
        content += `#### Procedimento\n`;
        content += `1. Calcular quartis: Q1 (25%), Q2 (50%), Q3 (75%)\n`;
        content += `2. Calcular IQR = Q3 - Q1\n`;
        content += `3. Definir limites:\n`;
        content += `   - Limite inferior: Q1 - 1.5 × IQR\n`;
        content += `   - Limite superior: Q3 + 1.5 × IQR\n`;
        content += `4. Valores fora destes limites são outliers\n\n`;
        
        content += `#### Interpretação dos Outliers\n`;
        content += `Os outliers podem indicar:\n`;
        content += `- Erros de medição ou digitação\n`;
        content += `- Casos especiais ou raros\n`;
        content += `- Variabilidade natural extrema\n`;
        content += `- Necessidade de investigação adicional\n\n`;
        
        // Extrair resultados calculados
        const statCards = section.querySelectorAll('.stat-card');
        if (statCards.length > 0) {
            content += `### Resultados Calculados\n\n`;
            statCards.forEach(card => {
                const label = card.querySelector('.stat-label')?.textContent || '';
                const value = card.querySelector('.stat-value')?.textContent || '';
                content += `- **${label}:** ${value}\n`;
            });
            content += `\n`;
        }
        
        // Extrair interpretações detalhadas
        const interpretations = section.querySelectorAll('.step-container');
        interpretations.forEach((interp) => {
            const title = interp.querySelector('.step-title')?.textContent || '';
            if (title) {
                content += `### ${title}\n`;
                const text = this.extractTextContent(interp);
                content += `${text}\n\n`;
            }
        });
        
        return content;
    }

    /**
     * Gera markdown para análise de CSV
     */
    generateCSVMarkdown(section) {
        let content = `## 📁 Análise de Arquivo CSV\n\n`;
        
        content += `### Formato CSV Analisado\n`;
        content += `O sistema processou automaticamente o arquivo CSV seguindo estas especificações:\n\n`;
        content += `- **Estrutura:** Primeira linha como cabeçalho obrigatório\n`;
        content += `- **Separador:** Vírgula (,)\n`;
        content += `- **Decimais:** Ponto (.)\n`;
        content += `- **Detecção:** Colunas com ≥70% valores numéricos são tratadas como numéricas\n\n`;
        
        // Extrair informações das tabelas e análises
        const tables = section.querySelectorAll('table');
        tables.forEach((table, index) => {
            content += `### Tabela ${index + 1}\n`;
            content += this.convertTableToMarkdown(table);
            content += `\n`;
        });
        
        const statCards = section.querySelectorAll('.stat-card');
        if (statCards.length > 0) {
            content += `### Resumo Estatístico\n\n`;
            statCards.forEach(card => {
                const label = card.querySelector('.stat-label')?.textContent || '';
                const value = card.querySelector('.stat-value')?.textContent || '';
                content += `- **${label}:** ${value}\n`;
            });
            content += `\n`;
        }
        
        return content;
    }

    /**
     * Converte tabela HTML para formato markdown
     */
    convertTableToMarkdown(table) {
        let markdown = '';
        const rows = table.querySelectorAll('tr');
        
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('th, td');
            const cellContents = Array.from(cells).map(cell => 
                cell.textContent.trim().replace(/\|/g, '\\|')
            );
            
            markdown += `| ${cellContents.join(' | ')} |\n`;
            
            // Adicionar linha separadora após cabeçalho
            if (rowIndex === 0 && row.querySelectorAll('th').length > 0) {
                const separator = Array(cells.length).fill('---').join(' | ');
                markdown += `| ${separator} |\n`;
            }
        });
        
        return markdown;
    }

    /**
     * Extrai conteúdo de texto de um elemento, preservando estrutura
     */
    extractTextContent(element) {
        let text = '';
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            const content = node.textContent.trim();
            if (content) {
                text += content + ' ';
            }
        }
        
        return text.trim().replace(/\s+/g, ' ');
    }

    /**
     * Gera glossário de termos estatísticos
     */
    generateStatisticalGlossary() {
        return `
## 📚 Glossário de Termos Estatísticos

### Termos Básicos
- **Rol:** Dados organizados em ordem crescente ou decrescente
- **Amplitude Total (AT):** Diferença entre o maior e menor valor
- **Frequência Absoluta (fi):** Número de observações em cada classe
- **Frequência Relativa:** Proporção de observações em cada classe (fi/n)
- **Frequência Acumulada:** Soma das frequências até determinada classe

### Medidas de Posição
- **Quartis:** Dividem os dados em quatro partes iguais
- **Percentis:** Dividem os dados em cem partes iguais
- **Decis:** Dividem os dados em dez partes iguais

### Medidas de Forma
- **Assimetria:** Indica se a distribuição é simétrica ou não
- **Curtose:** Mede o achatamento da distribuição

### Conceitos Avançados
- **IQR (Intervalo Interquartil):** Q3 - Q1, mede a dispersão dos 50% centrais
- **Outliers:** Valores atípicos que se afastam significativamente do padrão
- **Homogeneidade:** Baixa variabilidade relativa entre os dados
- **Heterogeneidade:** Alta variabilidade relativa entre os dados

### Interpretações Práticas
- **CV < 15%:** Dados consistentes, processo controlado
- **15% ≤ CV < 30%:** Variabilidade moderada, aceitável na maioria dos casos
- **CV ≥ 30%:** Alta variabilidade, investigar causas

---
*Relatório gerado pelo Sistema de Estatística Descritiva*
*Baseado nas metodologias estatísticas padrão e boas práticas da área*
`;
    }

    /**
     * Cria e faz download de arquivo markdown
     */
    downloadMarkdownFile(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.showAlert('Relatório markdown exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar markdown:', error);
            this.showAlert('Erro ao exportar relatório: ' + error.message, 'error');
        }
    }
}

// Exportação da classe para uso global
window.UIController = UIController; 