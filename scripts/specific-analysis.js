/**
 * Análises Específicas
 * Cuida de análises percentuais, comparações e consultas específicas
 */
class SpecificAnalysis {
    constructor(uiController) {
        this.uiController = uiController;
    }

    /**
     * Calcula análise específica baseada no tipo selecionado
     */
    calculate() {
        const analysisType = document.getElementById('analysisType').value;
        
        try {
            switch (analysisType) {
                case 'percentages':
                    this.calculatePercentages();
                    break;
                case 'comparison':
                    this.calculateComparison();
                    break;
                case 'specific':
                    this.calculateSpecificQuery();
                    break;
                default:
                    this.uiController.showAlert('Tipo de análise não reconhecido', 'error');
            }
        } catch (error) {
            this.uiController.showAlert('Erro na análise: ' + error.message, 'error');
        }
    }

    /**
     * Calcula análises percentuais
     */
    calculatePercentages() {
        const dataInput = document.getElementById('percentageData').value;
        const criteriaInput = document.getElementById('percentageCriteria').value;

        if (!dataInput.trim() || !criteriaInput.trim()) {
            this.uiController.showAlert('Por favor, insira os dados e critérios', 'error');
            return;
        }

        // Extrair dados - aceitar formato direto ou com "Dados:"
        let dataString = dataInput;
        const dataMatch = dataInput.match(/dados:\s*([0-9,.\s]+)/i);
        if (dataMatch) {
            dataString = dataMatch[1];
        } else {
            // Tentar extrair números diretamente
            dataString = dataInput.replace(/[^0-9,.\s-]/g, '').trim();
        }

        if (!dataString) {
            this.uiController.showAlert('Por favor, insira os dados separados por vírgula', 'error');
            return;
        }

        const data = dataString.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
        const criteria = criteriaInput.trim().split('\n').map(c => c.trim()).filter(c => c);

        if (data.length === 0) {
            this.uiController.showAlert('Nenhum número válido encontrado nos dados', 'error');
            return;
        }

        if (criteria.length === 0) {
            this.uiController.showAlert('Por favor, insira pelo menos um critério de análise', 'error');
            return;
        }

        const results = this.analyzePercentages(data, criteria);
        this.displayPercentageResults(data, criteria, results);
    }

    /**
     * Analisa percentuais baseado nos critérios
     * @param {Array} data - Dados
     * @param {Array} criteria - Critérios
     * @returns {Array} Resultados
     */
    analyzePercentages(data, criteria) {
        const total = data.length;
        const results = [];

        criteria.forEach(criterion => {
            const count = this.countByCriterion(data, criterion);
            const percentage = (count / total) * 100;
            
            results.push({
                criterion,
                count,
                percentage,
                description: this.interpretCriterion(criterion)
            });
        });

        return results;
    }

    /**
     * Conta elementos que atendem o critério
     * @param {Array} data - Dados
     * @param {string} criterion - Critério
     * @returns {number} Contagem
     */
    countByCriterion(data, criterion) {
        let normalizedCriterion = criterion.trim();
        
        // Normalizar operadores
        normalizedCriterion = normalizedCriterion.replace(/≤/g, '<=');
        normalizedCriterion = normalizedCriterion.replace(/≥/g, '>=');
        normalizedCriterion = normalizedCriterion.replace(/\s+/g, ' ');
        
        let count = 0;
        data.forEach(value => {
            try {
                if (this.evaluateCriterion(value, normalizedCriterion)) {
                    count++;
                }
            } catch (error) {
                console.warn('Erro ao avaliar critério:', normalizedCriterion, 'para valor:', value);
            }
        });

        return count;
    }

    /**
     * Avalia se um valor atende a um critério
     * @param {number} value - Valor a ser testado
     * @param {string} criterion - Critério (ex: "< 25", ">= 20 AND < 30")
     * @returns {boolean} Se o valor atende o critério
     */
    evaluateCriterion(value, criterion) {
        // Tratar expressões com AND
        if (criterion.toLowerCase().includes(' and ')) {
            const parts = criterion.toLowerCase().split(' and ').map(p => p.trim());
            return parts.every(part => this.evaluateCriterion(value, part));
        }

        // Normalizar critério
        let normalizedCriterion = criterion.trim();
        
        // Operadores com prioridade (mais específicos primeiro)
        const operators = [
            { pattern: /^<=\s*(.+)$/, fn: (v, target) => v <= target },
            { pattern: /^>=\s*(.+)$/, fn: (v, target) => v >= target },
            { pattern: /^<\s*(.+)$/, fn: (v, target) => v < target },
            { pattern: /^>\s*(.+)$/, fn: (v, target) => v > target },
            { pattern: /^=\s*(.+)$/, fn: (v, target) => v === target },
            { pattern: /^==\s*(.+)$/, fn: (v, target) => v === target }
        ];

        for (const { pattern, fn } of operators) {
            const match = normalizedCriterion.match(pattern);
            if (match) {
                const targetValue = parseFloat(match[1].trim());
                if (!isNaN(targetValue)) {
                    return fn(value, targetValue);
                }
            }
        }

        return false;
    }

    /**
     * Interpreta critério para descrição
     * @param {string} criterion - Critério
     * @returns {string} Descrição
     */
    interpretCriterion(criterion) {
        return `Valores que atendem: ${criterion}`;
    }

    /**
     * Exibe resultados de análise percentual
     */
    displayPercentageResults(data, criteria, results) {
        const resultsDiv = document.getElementById('analysisResults');
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Análise Percentual</h3>';
        
        html += `<p><strong>Dados analisados:</strong> {${data.join(', ')}}</p>`;
        html += `<p><strong>Total de observações:</strong> ${data.length}</p>`;

        html += '<h4 style="margin-top: 1.5rem; color: var(--primary);">Resultados por Critério</h4>';
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr><th>Critério</th><th>Quantidade</th><th>Percentual</th><th>Interpretação</th></tr></thead><tbody>';

        results.forEach(result => {
            html += `<tr>`;
            html += `<td>${result.criterion}</td>`;
            html += `<td>${result.count}</td>`;
            html += `<td>${this.uiController.formatNumber(result.percentage, 1)}%</td>`;
            html += `<td>${result.description}</td>`;
            html += `</tr>`;
        });

        html += '</tbody></table>';
        html += '</div>';

        html += '</div>';
        resultsDiv.innerHTML = html;
    }

    /**
     * Calcula comparação entre grupos
     */
    calculateComparison() {
        const group1Input = document.getElementById('group1Data').value;
        const group2Input = document.getElementById('group2Data').value;
        const comparisonType = document.getElementById('comparisonType').value;

        if (!group1Input.trim() || !group2Input.trim()) {
            this.uiController.showAlert('Por favor, insira dados para ambos os grupos', 'error');
            return;
        }

        const validation1 = this.uiController.validateInput(group1Input);
        const validation2 = this.uiController.validateInput(group2Input);

        if (!validation1.isValid || !validation2.isValid) {
            this.uiController.showAlert('Dados inválidos em um dos grupos', 'error');
            return;
        }

        const calc1 = new StatisticsCalculator();
        const calc2 = new StatisticsCalculator();
        calc1.setData(validation1.data);
        calc2.setData(validation2.data);

        const stats1 = calc1.getDescriptiveStatistics(true);
        const stats2 = calc2.getDescriptiveStatistics(true);

        this.displayComparisonResults(stats1, stats2, comparisonType);
    }

    /**
     * Exibe resultados de comparação
     */
    displayComparisonResults(stats1, stats2, comparisonType) {
        const resultsDiv = document.getElementById('analysisResults');
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Comparação entre Grupos</h3>';

        // Tabela comparativa
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr><th>Medida</th><th>Grupo 1</th><th>Grupo 2</th><th>Diferença</th></tr></thead><tbody>';

        const measures = [
            { label: 'Tamanho (n)', prop: 'count', format: 0 },
            { label: 'Média', prop: 'mean', format: 4 },
            { label: 'Mediana', prop: 'median', format: 4 },
            { label: 'Desvio Padrão', prop: 'standardDeviation', format: 4 },
            { label: 'Coef. Variação (%)', prop: 'coefficientOfVariation', format: 2 }
        ];

        measures.forEach(measure => {
            const val1 = stats1[measure.prop];
            const val2 = stats2[measure.prop];
            const diff = measure.prop !== 'count' ? Math.abs(val1 - val2) : Math.abs(val1 - val2);
            
            html += `<tr>`;
            html += `<td>${measure.label}</td>`;
            html += `<td>${this.uiController.formatNumber(val1, measure.format)}</td>`;
            html += `<td>${this.uiController.formatNumber(val2, measure.format)}</td>`;
            html += `<td>${this.uiController.formatNumber(diff, measure.format)}</td>`;
            html += `</tr>`;
        });

        html += '</tbody></table>';
        html += '</div>';

        // Interpretação
        html += '<h4 style="margin-top: 1.5rem; color: var(--primary);">Interpretação</h4>';
        
        if (comparisonType === 'variability' || comparisonType === 'complete') {
            const cv1 = stats1.coefficientOfVariation;
            const cv2 = stats2.coefficientOfVariation;
            
            html += '<h5>Comparação de Variabilidade (Coeficiente de Variação):</h5>';
            if (cv1 < cv2) {
                html += `<p>✅ <strong>Grupo 1 é mais homogêneo</strong> (CV = ${this.uiController.formatNumber(cv1, 2)}% < ${this.uiController.formatNumber(cv2, 2)}%)</p>`;
            } else if (cv2 < cv1) {
                html += `<p>✅ <strong>Grupo 2 é mais homogêneo</strong> (CV = ${this.uiController.formatNumber(cv2, 2)}% < ${this.uiController.formatNumber(cv1, 2)}%)</p>`;
            } else {
                html += `<p>⚖️ <strong>Ambos os grupos têm variabilidade similar</strong> (CV ≈ ${this.uiController.formatNumber(cv1, 2)}%)</p>`;
            }
        }

        if (comparisonType === 'central' || comparisonType === 'complete') {
            html += '<h5>Comparação de Tendência Central:</h5>';
            const meanDiff = Math.abs(stats1.mean - stats2.mean);
            const medianDiff = Math.abs(stats1.median - stats2.median);
            
            html += `<p><strong>Diferença nas médias:</strong> ${this.uiController.formatNumber(meanDiff, 4)}</p>`;
            html += `<p><strong>Diferença nas medianas:</strong> ${this.uiController.formatNumber(medianDiff, 4)}</p>`;
        }

        html += '</div>';
        resultsDiv.innerHTML = html;
    }

    /**
     * Calcula consulta específica
     */
    calculateSpecificQuery() {
        const dataInput = document.getElementById('specificData').value;
        const queryType = document.getElementById('specificQuery').value;

        if (!dataInput.trim()) {
            this.uiController.showAlert('Por favor, insira os dados', 'error');
            return;
        }

        const validation = this.uiController.validateInput(dataInput);
        if (!validation.isValid) {
            this.uiController.showAlert('Dados inválidos', 'error');
            return;
        }

        const calculator = new StatisticsCalculator();
        calculator.setData(validation.data);

        this.executeSpecificQuery(calculator, queryType);
    }

    /**
     * Executa consulta específica
     */
    executeSpecificQuery(calculator, queryType) {
        const resultsDiv = document.getElementById('analysisResults');
        let html = '<div class="result-box">';
        
        switch (queryType) {
            case 'amplitude':
                const data = calculator.getData();
                const min = Math.min(...data);
                const max = Math.max(...data);
                const amplitude = max - min;
                
                html += '<h3 class="result-title">📏 Amplitude Total</h3>';
                html += `<p><strong>Menor valor:</strong> ${min}</p>`;
                html += `<p><strong>Maior valor:</strong> ${max}</p>`;
                html += `<p><strong>Amplitude Total:</strong> ${amplitude}</p>`;
                html += `<p><strong>Interpretação:</strong> Os dados variam numa faixa de ${amplitude} unidades.</p>`;
                break;

            case 'quartiles':
                const quartiles = calculator.calculateQuartiles();
                const iqr = quartiles.Q3 - quartiles.Q1;
                
                html += '<h3 class="result-title">📊 Análise de Quartis</h3>';
                html += `<p><strong>Q1 (25%):</strong> ${this.uiController.formatNumber(quartiles.Q1, 4)}</p>`;
                html += `<p><strong>Q2 (50% - Mediana):</strong> ${this.uiController.formatNumber(quartiles.Q2, 4)}</p>`;
                html += `<p><strong>Q3 (75%):</strong> ${this.uiController.formatNumber(quartiles.Q3, 4)}</p>`;
                html += `<p><strong>IQR (Q3 - Q1):</strong> ${this.uiController.formatNumber(iqr, 4)}</p>`;
                break;

            case 'outliers':
                const outlierData = calculator.detectOutliers();
                html += '<h3 class="result-title">🔍 Detecção de Outliers</h3>';
                html += `<p><strong>Método:</strong> ${outlierData.method}</p>`;
                html += `<p><strong>Limite inferior:</strong> ${this.uiController.formatNumber(outlierData.lowerBound, 4)}</p>`;
                html += `<p><strong>Limite superior:</strong> ${this.uiController.formatNumber(outlierData.upperBound, 4)}</p>`;
                
                if (outlierData.hasOutliers) {
                    html += `<p><strong>❌ Outliers detectados:</strong></p>`;
                    if (outlierData.lowerOutliers.length > 0) {
                        html += `<p>• Inferiores: ${outlierData.lowerOutliers.join(', ')}</p>`;
                    }
                    if (outlierData.upperOutliers.length > 0) {
                        html += `<p>• Superiores: ${outlierData.upperOutliers.join(', ')}</p>`;
                    }
                } else {
                    html += `<p><strong>✅ Nenhum outlier detectado</strong></p>`;
                }
                html += `<p><strong>Interpretação:</strong> ${outlierData.interpretation}</p>`;
                break;

            case 'percentile':
                const percentileValue = parseFloat(document.getElementById('percentileValue').value);
                if (isNaN(percentileValue) || percentileValue < 0 || percentileValue > 100) {
                    html += '<h3 class="result-title">❌ Percentil Inválido</h3>';
                    html += '<p>Por favor, insira um valor entre 0 e 100.</p>';
                } else {
                    const percentileResult = calculator.calculatePercentile(percentileValue);
                    html += '<h3 class="result-title">📊 Cálculo de Percentil</h3>';
                    html += `<p><strong>Percentil ${percentileValue}:</strong> ${this.uiController.formatNumber(percentileResult, 4)}</p>`;
                    html += `<p><strong>Interpretação:</strong> ${percentileValue}% dos dados são menores ou iguais a ${this.uiController.formatNumber(percentileResult, 4)}</p>`;
                    
                    // Calcular quantos valores estão abaixo/acima
                    const dataValues = calculator.getData();
                    const countBelow = dataValues.filter(x => x <= percentileResult).length;
                    const countAbove = dataValues.filter(x => x > percentileResult).length;
                    html += `<p><strong>Verificação:</strong> ${countBelow} valores ≤ ${this.uiController.formatNumber(percentileResult, 4)} e ${countAbove} valores > ${this.uiController.formatNumber(percentileResult, 4)}</p>`;
                }
                break;

            case 'distribution':
                const stats = calculator.getDescriptiveStatistics(true);
                html += '<h3 class="result-title">📈 Análise de Distribuição</h3>';
                html += `<p><strong>Tipo de distribuição:</strong> ${stats.modalType}</p>`;
                html += `<p><strong>Simetria:</strong> ${stats.symmetryAnalysis.type}</p>`;
                html += `<p><strong>Descrição:</strong> ${stats.symmetryAnalysis.description}</p>`;
                html += `<p><strong>Variabilidade:</strong> ${stats.variabilityLevel.level} (${stats.variabilityLevel.description})</p>`;
                break;

            default:
                html += '<h3 class="result-title">❌ Consulta não implementada</h3>';
        }

        html += '</div>';
        resultsDiv.innerHTML = html;
    }

    /**
     * Limpa os resultados
     */
    clear() {
        document.getElementById('analysisResults').innerHTML = '';
        
        // Limpar inputs
        const inputs = [
            'percentageData', 'percentageCriteria',
            'group1Data', 'group2Data',
            'specificData'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    }
}

// Funções globais
function calculateSpecificAnalysis() {
    if (typeof window.specificAnalysis === 'undefined') {
        console.error('SpecificAnalysis não foi inicializada');
        return;
    }
    window.specificAnalysis.calculate();
}

function clearSpecificAnalysis() {
    if (typeof window.specificAnalysis === 'undefined') {
        console.error('SpecificAnalysis não foi inicializada');
        return;
    }
    window.specificAnalysis.clear();
} 