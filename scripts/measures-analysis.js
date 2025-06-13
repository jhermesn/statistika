/**
 * Análise de Medidas Estatísticas
 * Cuida do cálculo de medidas de tendência central e dispersão
 */
class MeasuresAnalysis {
    constructor(uiController) {
        this.uiController = uiController;
        this.calculator = null;
    }

    /**
     * Calcula e exibe medidas estatísticas
     */
    calculate() {
        const input = document.getElementById('measuresInput').value;
        const validation = this.uiController.validateInput(input);

        if (!validation.isValid) {
            validation.errors.forEach(error => {
                this.uiController.showAlert(error, 'error');
            });
            return;
        }

        try {
            this.calculator = new StatisticsCalculator();
            this.calculator.setData(validation.data);
            
            // Verificar se é amostra ou população
            const populationType = document.getElementById('populationType').value;
            const isSample = populationType === 'sample';
            
            const stats = this.calculator.getDescriptiveStatistics(isSample);
            const showSteps = document.getElementById('measuresStepsToggle').classList.contains('active');
            
            this.displayResults(stats, showSteps, isSample);
            
            // Criar box plot após exibir resultados
            setTimeout(() => {
                this.createBoxPlot(this.calculator.getData());
            }, 100);

        } catch (error) {
            this.uiController.showAlert('Erro nos cálculos: ' + error.message, 'error');
        }
    }

    /**
     * Exibe os resultados da análise
     * @param {Object} stats - Estatísticas descritivas
     * @param {boolean} showSteps - Se deve mostrar passos detalhados
     * @param {boolean} isSample - Se os dados são amostra ou população
     */
    displayResults(stats, showSteps, isSample) {
        const resultsDiv = document.getElementById('measuresResults');
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Análise Estatística Descritiva</h3>';
        
        // Informação sobre o tipo de dados
        html += '<div class="alert alert-info" style="margin-bottom: 1rem;">';
        html += '<span class="alert-icon">📋</span>';
        if (isSample) {
            html += '<span><strong>Tipo de dados:</strong> Amostra (utilizando fórmulas amostrais com n-1)</span>';
        } else {
            html += '<span><strong>Tipo de dados:</strong> População (utilizando fórmulas populacionais com n)</span>';
        }
        html += '</div>';
        
        // Cards de resumo
        html += this.generateSummaryCards(stats);
        
        if (showSteps) {
            html += this.generateDetailedCalculations(stats, isSample);
        }

        html += this.generateInterpretation(stats);
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }

    /**
     * Gera cards de resumo das estatísticas
     * @param {Object} stats - Estatísticas descritivas
     * @returns {string} HTML dos cards
     */
    generateSummaryCards(stats) {
        let html = '<div class="grid">';
        
        const measures = [
            { label: 'Média (x̄)', value: stats.mean, description: 'Tendência central' },
            { label: 'Mediana (Md)', value: stats.median, description: 'Valor central' },
            { label: 'Moda (Mo)', value: stats.mode.join(', '), description: 'Valor(es) mais frequente(s)' },
            { label: 'Variância (s²)', value: stats.variance, description: 'Dispersão ao quadrado' },
            { label: 'Desvio Padrão (s)', value: stats.standardDeviation, description: 'Dispersão linear' },
            { label: 'Coef. Variação (CV)', value: stats.coefficientOfVariation + '%', description: 'Variabilidade relativa' }
        ];

        measures.forEach(measure => {
            const formattedValue = typeof measure.value === 'string' ? 
                measure.value : this.uiController.formatNumber(measure.value, 4);
                
            html += `<div class="stat-card">
                <div class="stat-label">${measure.label}</div>
                <div class="stat-value">${formattedValue}</div>
                <div style="font-size: 0.8rem; color: var(--secondary); margin-top: 0.5rem;">
                    ${measure.description}
                </div>
            </div>`;
        });

        html += '</div>';
        return html;
    }

    /**
     * Gera cálculos detalhados passo a passo
     * @param {Object} stats - Estatísticas descritivas
     * @param {boolean} isSample - Se os dados são amostra ou população
     * @returns {string} HTML dos cálculos detalhados
     */
    generateDetailedCalculations(stats, isSample) {
        const data = this.calculator.getData();
        let html = '';

        // Cálculo da Média
        html += this.generateMeanCalculation(data, stats.mean);
        
        // Cálculo da Mediana
        html += this.generateMedianCalculation(data, stats.median);
        
        // Cálculo da Moda
        html += this.generateModeCalculation(data, stats.mode);
        
        // Cálculo da Variância
        html += this.generateVarianceCalculation(data, stats.mean, stats.variance, isSample);
        
        // Cálculo do Desvio Padrão
        html += this.generateStandardDeviationCalculation(stats.variance, stats.standardDeviation, isSample);
        
        // Cálculo do Coeficiente de Variação
        html += this.generateCoefficientOfVariationCalculation(stats.mean, stats.standardDeviation, stats.coefficientOfVariation, isSample);

        return html;
    }

    /**
     * Gera cálculo detalhado da média
     */
    generateMeanCalculation(data, mean) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📐 Cálculo da Média Aritmética</h4>';
        html += '<div class="formula">x̄ = (Σxᵢ) / n</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Definição:</strong> A média aritmética é uma medida de tendência central que representa o valor típico de um conjunto de dados. É obtida somando todos os valores e dividindo pelo número de observações.</p>';
        html += '<p><strong>🎯 Propriedades importantes:</strong></p>';
        html += '<ul>';
        html += '<li><strong>Sensibilidade a todos os valores:</strong> Qualquer alteração em um valor afeta diretamente a média</li>';
        html += '<li><strong>Soma dos desvios é zero:</strong> Σ(xᵢ - x̄) = 0</li>';
        html += '<li><strong>Ponto de equilíbrio:</strong> A média é o centro de gravidade dos dados</li>';
        html += '<li><strong>Influência de outliers:</strong> Valores extremos podem distorcer significativamente a média</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">Dados:</span> {${data.join(', ')}}</p>`;
        html += `<p><span class="math-expression">n =</span> ${data.length} observações</p>`;
        
        const sum = data.reduce((a, b) => a + b, 0);
        if (data.length <= 20) {
            html += `<p><span class="math-expression">Σxᵢ =</span> ${data.join(' + ')} = ${sum}</p>`;
        } else {
            html += `<p><span class="math-expression">Σxᵢ =</span> ${sum} (soma dos ${data.length} valores)</p>`;
        }
        
        html += `<p><span class="math-expression">x̄ =</span> ${sum} ÷ ${data.length} = <strong>${this.uiController.formatNumber(mean, 4)}</strong></p>`;
        html += '<div class="interpretation">';
        html += `<p><strong>💡 Interpretação:</strong> O valor médio dos dados é ${this.uiController.formatNumber(mean, 4)}. Isso significa que, em média, os valores tendem a se concentrar em torno deste número.</p>`;
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cálculo detalhado da mediana
     */
    generateMedianCalculation(data, median) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📊 Cálculo da Mediana</h4>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Definição:</strong> A mediana é o valor que divide a distribuição ao meio quando os dados estão ordenados. 50% dos dados ficam abaixo da mediana e 50% acima.</p>';
        html += '<p><strong>🎯 Vantagens da mediana:</strong></p>';
        html += '<ul>';
        html += '<li><strong>Resistente a outliers:</strong> Não é afetada por valores extremos</li>';
        html += '<li><strong>Interpretação intuitiva:</strong> Representa o valor central da distribuição</li>';
        html += '<li><strong>Aplicável a dados ordinais:</strong> Pode ser usada mesmo quando não é possível calcular a média</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">Dados ordenados:</span> {${data.join(', ')}}</p>`;
        html += `<p><span class="math-expression">n =</span> ${data.length} (${data.length % 2 === 0 ? 'par' : 'ímpar'})</p>`;
        
        if (data.length % 2 === 0) {
            html += '<div class="formula">Md = (x<sub>[n/2]</sub> + x<sub>[n/2+1]</sub>) / 2</div>';
            const mid1Index = data.length/2 - 1;
            const mid2Index = data.length/2;
            const mid1 = data[mid1Index];
            const mid2 = data[mid2Index];
            html += '<div class="explanation">';
            html += '<p><strong>📋 Procedimento para n par:</strong> Quando o número de observações é par, a mediana é a média aritmética dos dois valores centrais.</p>';
            html += '</div>';
            html += `<p><strong>Posições centrais:</strong> ${mid1Index + 1}ª e ${mid2Index + 1}ª posições</p>`;
            html += `<p><strong>Valores centrais:</strong> ${mid1} e ${mid2}</p>`;
            html += `<p><span class="math-expression">Md =</span> (${mid1} + ${mid2}) ÷ 2 = <strong>${this.uiController.formatNumber(median, 4)}</strong></p>`;
        } else {
            html += '<div class="formula">Md = x<sub>[(n+1)/2]</sub></div>';
            const midIndex = Math.floor(data.length/2);
            html += '<div class="explanation">';
            html += '<p><strong>📋 Procedimento para n ímpar:</strong> Quando o número de observações é ímpar, a mediana é o valor que ocupa a posição central.</p>';
            html += '</div>';
            html += `<p><strong>Posição central:</strong> ${midIndex + 1}ª posição</p>`;
            html += `<p><span class="math-expression">Md =</span> <strong>${this.uiController.formatNumber(median, 4)}</strong></p>`;
        }
        html += '<div class="interpretation">';
        html += `<p><strong>💡 Interpretação:</strong> 50% dos dados são menores ou iguais a ${this.uiController.formatNumber(median, 4)} e 50% são maiores ou iguais a este valor.</p>`;
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cálculo detalhado da moda
     */
    generateModeCalculation(data, mode) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📈 Cálculo da Moda</h4>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Definição:</strong> A moda é o valor que aparece com maior frequência no conjunto de dados. É a única medida de tendência central que pode ser aplicada a dados qualitativos.</p>';
        html += '<p><strong>🎯 Tipos de distribuição modal:</strong></p>';
        html += '<ul>';
        html += '<li><strong>Amodal:</strong> Todos os valores têm a mesma frequência (sem moda)</li>';
        html += '<li><strong>Unimodal:</strong> Um único valor tem a maior frequência</li>';
        html += '<li><strong>Bimodal:</strong> Dois valores têm a mesma maior frequência</li>';
        html += '<li><strong>Multimodal:</strong> Três ou mais valores têm a mesma maior frequência</li>';
        html += '</ul>';
        html += '</div>';
        
        // Calcular frequências
        const frequency = {};
        data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });

        // Criar tabela de frequências
        html += '<h5 style="color: var(--primary); margin: 1rem 0;">📋 Tabela de Frequências</h5>';
        html += '<div class="table-container">';
        html += '<table style="width: auto; margin: 0 auto;">';
        html += '<thead><tr><th>Valor (xᵢ)</th><th>Frequência (fᵢ)</th></tr></thead><tbody>';
        
        const sortedValues = Object.keys(frequency).map(Number).sort((a, b) => a - b);
        const maxFreq = Math.max(...Object.values(frequency));
        const minFreq = Math.min(...Object.values(frequency));
        
        sortedValues.forEach(value => {
            const freq = frequency[value];
            const isMode = freq === maxFreq && maxFreq > minFreq; // Só é moda se maior que outras frequências
            const style = isMode ? 'background: var(--primary-bg); font-weight: bold;' : '';
            html += `<tr style="${style}"><td>${value}</td><td>${freq}${isMode ? ' ★' : ''}</td></tr>`;
        });
        
        html += '</tbody></table>';
        html += '</div>';
        
        // Análise da distribuição modal
        html += '<div class="interpretation">';
        if (mode.length === 0) {
            html += `<p><strong>📊 Resultado:</strong> <span style="color: var(--secondary);">Distribuição Amodal</span></p>`;
            html += `<p><strong>💡 Interpretação:</strong> Todos os valores aparecem com a mesma frequência (${maxFreq} vez${maxFreq > 1 ? 'es' : ''} cada). Não há valor predominante no conjunto de dados.</p>`;
        } else if (mode.length === 1) {
            html += `<p><strong>📊 Resultado:</strong> <span style="color: var(--primary);">Distribuição Unimodal</span></p>`;
            html += `<p><span class="math-expression">Moda:</span> <strong>${mode[0]}</strong> (aparece ${maxFreq} vez${maxFreq > 1 ? 'es' : ''})</p>`;
            html += `<p><strong>💡 Interpretação:</strong> O valor ${mode[0]} é o mais comum nos dados, indicando uma tendência central clara.</p>`;
        } else if (mode.length === 2) {
            html += `<p><strong>📊 Resultado:</strong> <span style="color: var(--accent);">Distribuição Bimodal</span></p>`;
            html += `<p><span class="math-expression">Modas:</span> <strong>${mode.join(' e ')}</strong> (cada uma aparece ${maxFreq} vezes)</p>`;
            html += `<p><strong>💡 Interpretação:</strong> Existem dois valores predominantes, sugerindo possivelmente duas subpopulações nos dados.</p>`;
        } else {
            html += `<p><strong>📊 Resultado:</strong> <span style="color: var(--warning);">Distribuição Multimodal</span></p>`;
            html += `<p><span class="math-expression">Modas:</span> <strong>${mode.join(', ')}</strong> (cada uma aparece ${maxFreq} vezes)</p>`;
            html += `<p><strong>💡 Interpretação:</strong> Múltiplos valores predominantes indicam uma distribuição complexa com várias concentrações de dados.</p>`;
        }
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cálculo detalhado da variância
     */
    generateVarianceCalculation(data, mean, variance, isSample) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📈 Cálculo da Variância</h4>';
        
        if (isSample) {
            html += '<div class="formula">s² = Σ(xᵢ - x̄)² / (n - 1)</div>';
            html += '<div class="explanation">';
            html += '<p><strong>📖 Variância Amostral:</strong> Utiliza (n-1) no denominador, conhecida como correção de Bessel. Esta correção produz uma estimativa não viesada da variância populacional.</p>';
        } else {
            html += '<div class="formula">σ² = Σ(xᵢ - μ)² / n</div>';
            html += '<div class="explanation">';
            html += '<p><strong>📖 Variância Populacional:</strong> Utiliza n no denominador. É o valor real da variância quando temos dados de toda a população.</p>';
        }
        
        html += '<p><strong>🎯 Características importantes:</strong></p>';
        html += '<ul>';
        html += '<li><strong>Unidade:</strong> Expressa no quadrado da unidade original dos dados</li>';
        html += '<li><strong>Sensibilidade:</strong> Muito sensível a outliers devido ao quadrado dos desvios</li>';
        html += '<li><strong>Interpretação:</strong> Valores maiores indicam maior variabilidade</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">${isSample ? 'x̄' : 'μ'} =</span> ${this.uiController.formatNumber(mean, 4)}</p>`;
        
        if (data.length <= 15) {
            html += '<h5 style="color: var(--primary); margin: 1rem 0;">📋 Cálculo dos Desvios</h5>';
            html += '<div class="table-container">';
            html += '<table>';
            html += `<thead><tr><th>xᵢ</th><th>xᵢ - ${isSample ? 'x̄' : 'μ'}</th><th>(xᵢ - ${isSample ? 'x̄' : 'μ'})²</th></tr></thead><tbody>`;
            
            let sumSquaredDiffs = 0;
            data.forEach(x => {
                const diff = x - mean;
                const squared = diff * diff;
                sumSquaredDiffs += squared;
                html += `<tr>
                    <td>${x}</td>
                    <td>${this.uiController.formatNumber(diff, 4)}</td>
                    <td>${this.uiController.formatNumber(squared, 4)}</td>
                </tr>`;
            });
            
            html += `<tr style="font-weight: bold; background: var(--primary-bg);">
                <td>Σ</td><td>0</td><td>${this.uiController.formatNumber(sumSquaredDiffs, 4)}</td>
            </tr>`;
            html += '</tbody></table>';
            html += '</div>';
        } else {
            const sumSquaredDiffs = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
            html += `<p><span class="math-expression">Σ(xᵢ - ${isSample ? 'x̄' : 'μ'})² =</span> ${this.uiController.formatNumber(sumSquaredDiffs, 4)}</p>`;
        }
        
        const sumSquaredDiffs = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
        const denominator = isSample ? data.length - 1 : data.length;
        const symbol = isSample ? 's²' : 'σ²';
        
        html += `<p><span class="math-expression">${symbol} =</span> ${this.uiController.formatNumber(sumSquaredDiffs, 4)} ÷ ${denominator} = <strong>${this.uiController.formatNumber(variance, 4)}</strong></p>`;
        html += '<div class="interpretation">';
        if (isSample) {
            html += '<p><strong>⚠️ Correção de Bessel:</strong> Utilizamos (n-1) no denominador para calcular a variância amostral. Esta correção torna a estimativa não viesada da variância populacional.</p>';
        } else {
            html += '<p><strong>📊 Variância Populacional:</strong> Como temos dados de toda a população, utilizamos n no denominador para obter o valor real da variância.</p>';
        }
        html += `<p><strong>💡 Interpretação:</strong> A variância de ${this.uiController.formatNumber(variance, 4)} indica o grau de dispersão dos dados. Como está em unidades quadráticas, é mais útil interpretar o desvio padrão para comparações práticas.</p>`;
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cálculo do desvio padrão
     */
    generateStandardDeviationCalculation(variance, stdDev, isSample) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📉 Cálculo do Desvio Padrão</h4>';
        
        const symbol = isSample ? 's' : 'σ';
        const varianceSymbol = isSample ? 's²' : 'σ²';
        
        html += `<div class="formula">${symbol} = √${varianceSymbol}</div>`;
        html += '<div class="explanation">';
        if (isSample) {
            html += '<p><strong>📖 Desvio Padrão Amostral:</strong> Raiz quadrada da variância amostral. Representa a dispersão típica dos dados em relação à média da amostra.</p>';
        } else {
            html += '<p><strong>📖 Desvio Padrão Populacional:</strong> Raiz quadrada da variância populacional. Representa a dispersão real dos dados na população.</p>';
        }
        html += '<p><strong>🎯 Vantagens do desvio padrão:</strong></p>';
        html += '<ul>';
        html += '<li><strong>Mesma unidade:</strong> Está na mesma unidade dos dados originais</li>';
        html += '<li><strong>Interpretação intuitiva:</strong> Indica quanto os dados "se afastam" da média</li>';
        html += '<li><strong>Aplicação prática:</strong> Usado para calcular intervalos de confiança e z-scores</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">${symbol} =</span> √${this.uiController.formatNumber(variance, 4)} = <strong>${this.uiController.formatNumber(stdDev, 4)}</strong></p>`;
        html += '<div class="interpretation">';
        if (isSample) {
            html += `<p><strong>💡 Interpretação:</strong> O desvio padrão amostral de ${this.uiController.formatNumber(stdDev, 4)} indica que, em média, os dados se afastam ±${this.uiController.formatNumber(stdDev, 4)} unidades da média da amostra.</p>`;
        } else {
            html += `<p><strong>💡 Interpretação:</strong> O desvio padrão populacional de ${this.uiController.formatNumber(stdDev, 4)} indica que, em média, os dados se afastam ±${this.uiController.formatNumber(stdDev, 4)} unidades da média populacional.</p>`;
        }
        html += '<p><strong>📊 Aplicação prática:</strong> Aproximadamente 68% dos dados estão no intervalo [média ± 1 desvio padrão] em distribuições normais.</p>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cálculo do coeficiente de variação
     */
    generateCoefficientOfVariationCalculation(mean, stdDev, cv, isSample) {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📊 Coeficiente de Variação</h4>';
        html += '<div class="formula">CV = (s / |x̄|) × 100%</div>';
        html += `<p><span class="math-expression">CV =</span> (${this.uiController.formatNumber(stdDev, 4)} ÷ |${this.uiController.formatNumber(mean, 4)}|) × 100%</p>`;
        html += `<p><span class="math-expression">CV =</span> <strong>${this.uiController.formatNumber(cv, 2)}%</strong></p>`;
        
        html += '<div style="margin-top: 1rem; padding: 1rem; background: var(--primary-bg); border-radius: 8px;">';
        html += '<h5 style="color: var(--primary); margin-bottom: 0.5rem;">Interpretação do CV:</h5>';
        if (cv < 15) {
            html += '<p>✅ <strong>CV < 15%:</strong> Baixa variabilidade - dados homogêneos</p>';
        } else if (cv < 30) {
            html += '<p>⚠️ <strong>15% ≤ CV < 30%:</strong> Variabilidade moderada</p>';
        } else {
            html += '<p>🔴 <strong>CV ≥ 30%:</strong> Alta variabilidade - dados heterogêneos</p>';
        }
        html += '</div>';
        
        html += '</div>';
        return html;
    }

    /**
     * Gera interpretação dos resultados
     */
    generateInterpretation(stats) {
        let html = '<div class="step-container" style="margin-top: 2rem;">';
        html += '<h4 class="step-title">🎯 Interpretação dos Resultados</h4>';

        // Comparação entre medidas de tendência central
        html += '<h5 style="color: var(--primary);">Medidas de Tendência Central:</h5>';
        
        const meanMedianDiff = Math.abs(stats.mean - stats.median);
        const relativeSkew = meanMedianDiff / stats.standardDeviation;
        
        if (relativeSkew < 0.2) {
            html += '<p>📊 <strong>Distribuição aproximadamente simétrica</strong> - Média e mediana são próximas</p>';
        } else if (stats.mean > stats.median) {
            html += '<p>📈 <strong>Distribuição assimétrica positiva</strong> - Cauda alongada à direita</p>';
        } else {
            html += '<p>📉 <strong>Distribuição assimétrica negativa</strong> - Cauda alongada à esquerda</p>';
        }

        // Análise da variabilidade
        html += '<h5 style="color: var(--primary); margin-top: 1rem;">Análise da Variabilidade:</h5>';
        const cv = stats.coefficientOfVariation;
        
        if (cv < 15) {
            html += '<p>✅ Os dados apresentam <strong>baixa variabilidade</strong>, indicando homogeneidade na distribuição.</p>';
        } else if (cv < 30) {
            html += '<p>⚠️ Os dados apresentam <strong>variabilidade moderada</strong>, com dispersão média em relação à média.</p>';
        } else {
            html += '<p>🔴 Os dados apresentam <strong>alta variabilidade</strong>, indicando heterogeneidade na distribuição.</p>';
        }

        // Análise de outliers
        if (stats.outliers.hasOutliers) {
            html += '<h5 style="color: var(--primary); margin-top: 1rem;">Valores Atípicos:</h5>';
            const totalOutliers = stats.outliers.lowerOutliers.length + stats.outliers.upperOutliers.length;
            html += `<p>⚠️ Foram detectados <strong>${totalOutliers} outlier(s)</strong>:</p>`;
            
            if (stats.outliers.lowerOutliers.length > 0) {
                html += `<p>• <strong>Outliers inferiores:</strong> ${stats.outliers.lowerOutliers.join(', ')}</p>`;
            }
            if (stats.outliers.upperOutliers.length > 0) {
                html += `<p>• <strong>Outliers superiores:</strong> ${stats.outliers.upperOutliers.join(', ')}</p>`;
            }
            html += '<p><em>Considere investigar estes valores para verificar possíveis erros de medição ou casos especiais.</em></p>';
        } else {
            html += '<h5 style="color: var(--primary); margin-top: 1rem;">Valores Atípicos:</h5>';
            html += '<p>✅ <strong>Nenhum outlier detectado</strong> - Todos os valores estão dentro do intervalo esperado.</p>';
        }

        // Quartis e distribuição
        html += '<h5 style="color: var(--primary); margin-top: 1rem;">Informações dos Quartis:</h5>';
        html += `<p>• <strong>Q1 (25%):</strong> ${this.uiController.formatNumber(stats.quartiles.Q1, 2)} - 25% dos dados são menores que este valor</p>`;
        html += `<p>• <strong>Q2 (50%):</strong> ${this.uiController.formatNumber(stats.quartiles.Q2, 2)} - Mediana dos dados</p>`;
        html += `<p>• <strong>Q3 (75%):</strong> ${this.uiController.formatNumber(stats.quartiles.Q3, 2)} - 75% dos dados são menores que este valor</p>`;
        
        const iqr = stats.quartiles.Q3 - stats.quartiles.Q1;
        html += `<p>• <strong>IQR:</strong> ${this.uiController.formatNumber(iqr, 2)} - Amplitude interquartil (dispersão dos 50% centrais)</p>`;

        html += '</div>';
        return html;
    }

    /**
     * Cria box plot dos dados
     */
    createBoxPlot(data) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não disponível para criar box plot');
            this.uiController.showAlert('Gráficos não estão disponíveis. Verifique sua conexão com a internet.', 'info');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'boxPlotChart';
        canvas.width = 800;
        canvas.height = 300;
        canvas.style.maxWidth = '100%';
        canvas.style.height = '300px';
        canvas.style.width = 'auto';
        
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.style.height = '350px';
        container.style.width = '100%';
        container.style.position = 'relative';
        container.innerHTML = '<h4 style="color: var(--primary); margin-bottom: 1rem;">📦 Box Plot dos Dados</h4>';
        container.appendChild(canvas);
        
        document.getElementById('measuresResults').appendChild(container);

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (window.boxPlotChart && typeof window.boxPlotChart.destroy === 'function') {
            try {
                window.boxPlotChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir gráfico anterior:', error);
            }
            window.boxPlotChart = null;
        }

        // Criar gráfico de dispersão como alternativa ao box plot
        const sortedData = [...data].sort((a, b) => a - b);

        try {
            window.boxPlotChart = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Valores dos Dados',
                        data: sortedData.map((value, index) => ({ x: index + 1, y: value })),
                        backgroundColor: 'rgba(124, 58, 237, 0.6)',
                        borderColor: '#7c3aed',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2.5,
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribuição dos Dados',
                            color: '#7c3aed',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Valores',
                                color: '#64748b',
                                font: { weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Posição (ordenada)',
                                color: '#64748b',
                                font: { weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)'
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    onResize: (chart, size) => {
                        // Garantir que o gráfico não exceda a altura máxima
                        if (size.height > 300) {
                            chart.canvas.style.height = '300px';
                        }
                    }
                }
            });

            // Forçar redimensionamento após criação
            setTimeout(() => {
                if (window.boxPlotChart && window.boxPlotChart.resize) {
                    window.boxPlotChart.resize();
                }
            }, 100);

        } catch (error) {
            console.error('Erro ao criar box plot:', error);
            this.uiController.showAlert('Erro ao criar gráfico. Verifique se o Chart.js está disponível.', 'warning');
        }
    }

    /**
     * Limpa resultados e gráficos
     */
    clear() {
        document.getElementById('measuresInput').value = '';
        document.getElementById('measuresResults').innerHTML = '';
        
        // Destruir gráfico se existir
        if (window.boxPlotChart && typeof window.boxPlotChart.destroy === 'function') {
            try {
                window.boxPlotChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir box plot:', error);
            }
            window.boxPlotChart = null;
        }
    }
}

// Funções globais para compatibilidade
function calculateMeasures() {
    if (window.measuresAnalysis) {
        window.measuresAnalysis.calculate();
    }
}

function clearMeasures() {
    if (window.measuresAnalysis) {
        window.measuresAnalysis.clear();
    }
} 