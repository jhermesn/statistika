/**
 * Análise de Dados Agrupados
 * Cuida do cálculo de estatísticas para dados em tabelas de frequência e intervalos
 */
class GroupedDataAnalysis {
    constructor(uiController) {
        this.uiController = uiController;
        this.data = null;
        this.type = null;
    }

    /**
     * Calcula e exibe análise de dados agrupados
     */
    calculate() {
        const dataType = document.getElementById('groupedDataType').value;
        let input = '';
        
        if (dataType === 'frequency') {
            input = document.getElementById('frequencyData').value;
        } else {
            input = document.getElementById('intervalsData').value;
        }

        if (!input.trim()) {
            this.uiController.showAlert('Por favor, insira os dados', 'error');
            return;
        }

        try {
            this.type = dataType;
            this.data = this.parseGroupedData(input, dataType);
            
            const showSteps = document.getElementById('groupedStepsToggle').classList.contains('active');
            const stats = this.calculateGroupedStatistics();
            
            this.displayResults(stats, showSteps);
            
            // Criar gráfico após exibir resultados
            setTimeout(() => {
                this.createGroupedChart();
            }, 100);

        } catch (error) {
            this.uiController.showAlert('Erro ao processar dados: ' + error.message, 'error');
        }
    }

    /**
     * Interpreta dados agrupados do input
     * @param {string} input - Dados de entrada
     * @param {string} type - Tipo de dados ('frequency' ou 'intervals')
     * @returns {Array} Dados processados
     */
    parseGroupedData(input, type) {
        const lines = input.trim().split(/[,\n]/).map(line => line.trim()).filter(line => line);
        const data = [];

        lines.forEach((line, index) => {
            let match;
            
            if (type === 'frequency') {
                // Formato: valor:frequência
                match = line.match(/^(\d+(?:\.\d+)?):(\d+)$/);
                if (!match) {
                    throw new Error(`Linha ${index + 1}: Formato inválido. Use valor:frequência (ex: 5:3)`);
                }
                
                const value = parseFloat(match[1]);
                const frequency = parseInt(match[2]);
                
                data.push({
                    value: value,
                    frequency: frequency,
                    isInterval: false,
                    label: value.toString()
                });
                
            } else {
                // Formato: inicio-fim:frequência ou inicio|fim:frequência
                match = line.match(/^(\d+(?:\.\d+)?)[|-](\d+(?:\.\d+)?):(\d+)$/);
                if (!match) {
                    throw new Error(`Linha ${index + 1}: Formato inválido. Use inicio-fim:frequência (ex: 10-20:5)`);
                }
                
                const start = parseFloat(match[1]);
                const end = parseFloat(match[2]);
                const frequency = parseInt(match[3]);
                
                if (start >= end) {
                    throw new Error(`Linha ${index + 1}: O limite inferior deve ser menor que o superior`);
                }
                
                data.push({
                    start: start,
                    end: end,
                    midpoint: (start + end) / 2,
                    frequency: frequency,
                    width: end - start,
                    isInterval: true,
                    label: `${start} ⊢ ${end}`
                });
            }
        });

        if (data.length === 0) {
            throw new Error('Nenhum dado válido encontrado');
        }

        return data;
    }

    /**
     * Calcula estatísticas para dados agrupados
     * @returns {Object} Estatísticas calculadas
     */
    calculateGroupedStatistics() {
        const totalFrequency = this.data.reduce((sum, item) => sum + item.frequency, 0);
        
        // Cálculo da média
        let mean;
        if (this.type === 'frequency') {
            mean = this.data.reduce((sum, item) => sum + (item.value * item.frequency), 0) / totalFrequency;
        } else {
            mean = this.data.reduce((sum, item) => sum + (item.midpoint * item.frequency), 0) / totalFrequency;
        }

        // Cálculo da mediana (estimada para intervalos)
        const median = this.calculateGroupedMedian(totalFrequency);
        
        // Cálculo da moda (estimada para intervalos)
        const mode = this.calculateGroupedMode();
        
        // Cálculo da variância e desvio padrão
        const variance = this.calculateGroupedVariance(mean, totalFrequency);
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = (standardDeviation / Math.abs(mean)) * 100;

        // Criar tabela de frequências completa
        const frequencyTable = this.createFrequencyTable(totalFrequency);

        return {
            count: totalFrequency,
            mean,
            median,
            mode,
            variance,
            standardDeviation,
            coefficientOfVariation,
            frequencyTable,
            type: this.type
        };
    }

    /**
     * Calcula mediana para dados agrupados
     * @param {number} totalFrequency - Frequência total
     * @returns {number} Mediana estimada
     */
    calculateGroupedMedian(totalFrequency) {
        const medianPosition = totalFrequency / 2;
        let cumulativeFreq = 0;
        
        for (let i = 0; i < this.data.length; i++) {
            cumulativeFreq += this.data[i].frequency;
            
            if (cumulativeFreq >= medianPosition) {
                if (this.type === 'frequency') {
                    return this.data[i].value;
                } else {
                    // Fórmula da mediana para dados agrupados em intervalos
                    const L = this.data[i].start; // Limite inferior da classe mediana
                    const h = this.data[i].width; // Amplitude da classe
                    const F = cumulativeFreq - this.data[i].frequency; // Freq. acumulada anterior
                    const f = this.data[i].frequency; // Frequência da classe mediana
                    
                    return L + ((medianPosition - F) / f) * h;
                }
            }
        }
        
        return 0;
    }

    /**
     * Calcula moda para dados agrupados
     * @returns {Object} Informações sobre a moda
     */
    calculateGroupedMode() {
        // Encontrar a classe modal (maior frequência)
        let maxFreq = 0;
        let modalClasses = [];
        
        this.data.forEach((item, index) => {
            if (item.frequency > maxFreq) {
                maxFreq = item.frequency;
                modalClasses = [index];
            } else if (item.frequency === maxFreq) {
                modalClasses.push(index);
            }
        });

        if (this.type === 'frequency') {
            const modes = modalClasses.map(index => this.data[index].value);
            return { values: modes, frequency: maxFreq, type: 'exact' };
        } else {
            // Para intervalos, estimar a moda usando a fórmula de Pearson
            if (modalClasses.length === 1) {
                const modalClass = this.data[modalClasses[0]];
                const L = modalClass.start;
                const h = modalClass.width;
                const f1 = modalClass.frequency;
                const f0 = modalClasses[0] > 0 ? this.data[modalClasses[0] - 1].frequency : 0;
                const f2 = modalClasses[0] < this.data.length - 1 ? this.data[modalClasses[0] + 1].frequency : 0;
                
                const mode = L + ((f1 - f0) / (2 * f1 - f0 - f2)) * h;
                
                return { 
                    values: [mode], 
                    frequency: maxFreq, 
                    type: 'estimated',
                    modalClass: modalClass.label
                };
            } else {
                // Múltiplas classes modais
                return { 
                    values: modalClasses.map(index => this.data[index].midpoint), 
                    frequency: maxFreq, 
                    type: 'multimodal',
                    modalClasses: modalClasses.map(index => this.data[index].label)
                };
            }
        }
    }

    /**
     * Calcula variância para dados agrupados
     * @param {number} mean - Média
     * @param {number} totalFrequency - Frequência total
     * @returns {number} Variância
     */
    calculateGroupedVariance(mean, totalFrequency) {
        let sumSquaredDeviations = 0;
        
        this.data.forEach(item => {
            const value = this.type === 'frequency' ? item.value : item.midpoint;
            const deviation = value - mean;
            sumSquaredDeviations += Math.pow(deviation, 2) * item.frequency;
        });
        
        return sumSquaredDeviations / (totalFrequency - 1); // Variância amostral
    }

    /**
     * Cria tabela de frequências completa
     * @param {number} totalFrequency - Frequência total
     * @returns {Array} Tabela de frequências
     */
    createFrequencyTable(totalFrequency) {
        let cumulativeFreq = 0;
        
        return this.data.map(item => {
            cumulativeFreq += item.frequency;
            const relativeFreq = item.frequency / totalFrequency;
            const cumulativeRelativeFreq = cumulativeFreq / totalFrequency;
            
            return {
                ...item,
                relativeFrequency: relativeFreq,
                relativeFrequencyPercent: relativeFreq * 100,
                cumulativeFrequency: cumulativeFreq,
                cumulativeRelativeFrequency: cumulativeRelativeFreq,
                cumulativeRelativeFrequencyPercent: cumulativeRelativeFreq * 100
            };
        });
    }

    /**
     * Exibe os resultados da análise
     * @param {Object} stats - Estatísticas calculadas
     * @param {boolean} showSteps - Se deve mostrar passos detalhados
     */
    displayResults(stats, showSteps) {
        const resultsDiv = document.getElementById('groupedResults');
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Análise de Dados Agrupados</h3>';
        
        // Informação sobre o tipo de dados
        html += '<div class="alert alert-info" style="margin-bottom: 1rem;">';
        html += '<span class="alert-icon">📋</span>';
        if (stats.type === 'frequency') {
            html += '<span><strong>Tipo:</strong> Tabela de Frequência (valores discretos)</span>';
        } else {
            html += '<span><strong>Tipo:</strong> Dados Agrupados em Intervalos (estimativas)</span>';
        }
        html += '</div>';

        if (showSteps) {
            html += this.generateStepByStepCalculation(stats);
        }

        html += this.generateFrequencyTable(stats.frequencyTable);
        html += this.generateSummaryCards(stats);
        html += this.generateInterpretation(stats);

        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }

    /**
     * Gera cálculo passo a passo
     * @param {Object} stats - Estatísticas
     * @returns {string} HTML dos passos
     */
    generateStepByStepCalculation(stats) {
        let html = '';

        if (stats.type === 'frequency') {
            html += this.generateFrequencySteps(stats);
        } else {
            html += this.generateIntervalSteps(stats);
        }

        return html;
    }

    /**
     * Gera passos para dados de frequência
     */
    generateFrequencySteps(stats) {
        let html = '';

        // Cálculo da média para dados agrupados
        html += '<div class="step-container">';
        html += '<h4 class="step-title">📐 Cálculo da Média para Dados Agrupados</h4>';
        html += '<div class="formula">x̄ = Σ(xᵢ × fᵢ) / Σfᵢ</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Definição:</strong> Para dados agrupados, cada valor é multiplicado pela sua frequência antes de somar.</p>';
        html += '</div>';

        html += '<div class="table-container" style="margin: 1rem 0;">';
        html += '<table>';
        html += '<thead><tr><th>Valor (xᵢ)</th><th>Freq. (fᵢ)</th><th>xᵢ × fᵢ</th></tr></thead><tbody>';
        
        let sumProducts = 0;
        let sumFreqs = 0;
        
        this.data.forEach(item => {
            const product = item.value * item.frequency;
            sumProducts += product;
            sumFreqs += item.frequency;
            html += `<tr><td>${item.value}</td><td>${item.frequency}</td><td>${product}</td></tr>`;
        });
        
        html += `<tr style="font-weight: bold; background: var(--primary-bg);">`;
        html += `<td>Σ</td><td>${sumFreqs}</td><td>${sumProducts}</td></tr>`;
        html += '</tbody></table>';
        html += '</div>';

        html += `<p><span class="math-expression">x̄ =</span> ${sumProducts} ÷ ${sumFreqs} = <strong>${this.uiController.formatNumber(stats.mean, 4)}</strong></p>`;
        html += '</div>';

        return html;
    }

    /**
     * Gera passos para dados em intervalos
     */
    generateIntervalSteps(stats) {
        let html = '';

        // Cálculo da média para dados em intervalos
        html += '<div class="step-container">';
        html += '<h4 class="step-title">📐 Cálculo da Média para Dados em Intervalos</h4>';
        html += '<div class="formula">x̄ = Σ(x̄ᵢ × fᵢ) / Σfᵢ</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Procedimento:</strong> Para intervalos, usamos o ponto médio de cada classe como representante do intervalo.</p>';
        html += '<p><strong>🎯 Fórmula do ponto médio:</strong> x̄ᵢ = (limite inferior + limite superior) / 2</p>';
        html += '</div>';

        html += '<div class="table-container" style="margin: 1rem 0;">';
        html += '<table>';
        html += '<thead><tr><th>Intervalo</th><th>Ponto Médio (x̄ᵢ)</th><th>Freq. (fᵢ)</th><th>x̄ᵢ × fᵢ</th></tr></thead><tbody>';
        
        let sumProducts = 0;
        let sumFreqs = 0;
        
        this.data.forEach(item => {
            const product = item.midpoint * item.frequency;
            sumProducts += product;
            sumFreqs += item.frequency;
            html += `<tr>`;
            html += `<td>${item.label}</td>`;
            html += `<td>${this.uiController.formatNumber(item.midpoint, 1)}</td>`;
            html += `<td>${item.frequency}</td>`;
            html += `<td>${this.uiController.formatNumber(product, 1)}</td>`;
            html += `</tr>`;
        });
        
        html += `<tr style="font-weight: bold; background: var(--primary-bg);">`;
        html += `<td>Σ</td><td>-</td><td>${sumFreqs}</td><td>${this.uiController.formatNumber(sumProducts, 1)}</td></tr>`;
        html += '</tbody></table>';
        html += '</div>';

        html += `<p><span class="math-expression">x̄ =</span> ${this.uiController.formatNumber(sumProducts, 1)} ÷ ${sumFreqs} = <strong>${this.uiController.formatNumber(stats.mean, 4)}</strong></p>`;
        
        // Cálculo da mediana
        html += '<div class="step-container" style="margin-top: 1.5rem;">';
        html += '<h4 class="step-title">📊 Cálculo da Mediana para Dados em Intervalos</h4>';
        html += '<div class="formula">Md = L + [(n/2 - F) / f] × h</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Onde:</strong></p>';
        html += '<ul>';
        html += '<li><strong>L:</strong> Limite inferior da classe mediana</li>';
        html += '<li><strong>n/2:</strong> Posição da mediana</li>';
        html += '<li><strong>F:</strong> Frequência acumulada anterior à classe mediana</li>';
        html += '<li><strong>f:</strong> Frequência da classe mediana</li>';
        html += '<li><strong>h:</strong> Amplitude da classe mediana</li>';
        html += '</ul>';
        html += '</div>';

        const medianPosition = sumFreqs / 2;
        let cumulativeFreq = 0;
        let medianClassIndex = 0;
        
        for (let i = 0; i < this.data.length; i++) {
            cumulativeFreq += this.data[i].frequency;
            if (cumulativeFreq >= medianPosition) {
                medianClassIndex = i;
                break;
            }
        }

        const medianClass = this.data[medianClassIndex];
        const F = cumulativeFreq - medianClass.frequency;
        
        html += `<p><strong>Classe mediana:</strong> ${medianClass.label} (contém a posição ${medianPosition})</p>`;
        html += `<p><span class="math-expression">L =</span> ${medianClass.start}</p>`;
        html += `<p><span class="math-expression">F =</span> ${F}</p>`;
        html += `<p><span class="math-expression">f =</span> ${medianClass.frequency}</p>`;
        html += `<p><span class="math-expression">h =</span> ${medianClass.width}</p>`;
        html += `<p><span class="math-expression">Md =</span> ${medianClass.start} + [(${medianPosition} - ${F}) / ${medianClass.frequency}] × ${medianClass.width}</p>`;
        html += `<p><span class="math-expression">Md =</span> <strong>${this.uiController.formatNumber(stats.median, 4)}</strong></p>`;
        html += '</div>';

        return html;
    }

    /**
     * Gera tabela de frequências
     */
    generateFrequencyTable(frequencyTable) {
        let html = '<h4 style="margin-top: 2rem; color: var(--primary);">Tabela Completa de Frequências</h4>';
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr>';
        
        if (this.type === 'frequency') {
            html += '<th>Valor</th>';
        } else {
            html += '<th>Classe</th><th>Ponto Médio</th>';
        }
        
        html += '<th>Freq. (fᵢ)</th>';
        html += '<th>Freq. Rel. (%)</th>';
        html += '<th>Freq. Acum. (Fᵢ)</th>';
        html += '<th>Freq. Rel. Acum. (%)</th>';
        html += '</tr></thead><tbody>';

        frequencyTable.forEach(row => {
            html += '<tr>';
            
            if (this.type === 'frequency') {
                html += `<td>${row.value}</td>`;
            } else {
                html += `<td>${row.label}</td>`;
                html += `<td>${this.uiController.formatNumber(row.midpoint, 1)}</td>`;
            }
            
            html += `<td>${row.frequency}</td>`;
            html += `<td>${this.uiController.formatNumber(row.relativeFrequencyPercent, 1)}%</td>`;
            html += `<td>${row.cumulativeFrequency}</td>`;
            html += `<td>${this.uiController.formatNumber(row.cumulativeRelativeFrequencyPercent, 1)}%</td>`;
            html += '</tr>';
        });

        // Linha de totais
        const totalFreq = frequencyTable.reduce((sum, row) => sum + row.frequency, 0);
        html += '<tr style="font-weight: bold; background: var(--primary-bg); border-top: 2px solid var(--primary);">';
        
        const totalCols = this.type === 'frequency' ? 1 : 2;
        html += `<td colspan="${totalCols}">TOTAL</td>`;
        html += `<td>${totalFreq}</td>`;
        html += '<td>100.0%</td>';
        html += '<td>-</td>';
        html += '<td>100.0%</td>';
        html += '</tr>';

        html += '</tbody></table>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera cards de resumo
     */
    generateSummaryCards(stats) {
        let html = '<h4 style="margin-top: 2rem; color: var(--primary);">Resumo Estatístico</h4>';
        html += '<div class="grid">';
        
        const measures = [
            { label: 'Tamanho (n)', value: stats.count, description: 'Total de observações' },
            { label: 'Média (x̄)', value: stats.mean, description: 'Tendência central' },
            { label: 'Mediana (Md)', value: stats.median, description: stats.type === 'intervals' ? 'Estimativa' : 'Valor central' },
            { label: 'Desvio Padrão (s)', value: stats.standardDeviation, description: 'Dispersão' },
            { label: 'Coef. Variação (CV)', value: stats.coefficientOfVariation + '%', description: 'Variabilidade relativa' }
        ];

        // Adicionar moda
        if (stats.mode.values.length > 0) {
            const modeLabel = stats.mode.values.length === 1 ? 'Moda (Mo)' : 'Modas';
            const modeValue = stats.mode.values.map(v => this.uiController.formatNumber(v, 2)).join(', ');
            measures.splice(3, 0, { 
                label: modeLabel, 
                value: modeValue, 
                description: stats.type === 'intervals' ? 'Estimativa' : 'Mais frequente' 
            });
        }

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
     * Gera interpretação dos resultados
     */
    generateInterpretation(stats) {
        let html = '<div class="step-container" style="margin-top: 2rem;">';
        html += '<h4 class="step-title">🎯 Interpretação dos Resultados</h4>';

        if (stats.type === 'intervals') {
            html += '<div class="alert alert-warning" style="margin-bottom: 1rem;">';
            html += '<span class="alert-icon">⚠️</span>';
            html += '<span><strong>Importante:</strong> Para dados agrupados em intervalos, os valores de média, mediana e moda são estimativas baseadas nos pontos médios das classes.</span>';
            html += '</div>';
        }

        // Análise da distribuição modal
        html += '<h5 style="color: var(--primary);">Análise Modal:</h5>';
        if (stats.mode.values.length === 0) {
            html += '<p>📊 <strong>Distribuição Amodal:</strong> Não há valor predominante.</p>';
        } else if (stats.mode.values.length === 1) {
            html += `<p>📊 <strong>Distribuição Unimodal:</strong> O valor mais frequente é ${this.uiController.formatNumber(stats.mode.values[0], 2)}</p>`;
        } else {
            html += `<p>📊 <strong>Distribuição Multimodal:</strong> Múltiplos valores predominantes.</p>`;
        }

        // Análise da variabilidade
        html += '<h5 style="color: var(--primary); margin-top: 1rem;">Análise da Variabilidade:</h5>';
        const cv = stats.coefficientOfVariation;
        
        if (cv < 15) {
            html += '<p>✅ <strong>Baixa variabilidade</strong> - Dados homogêneos.</p>';
        } else if (cv < 30) {
            html += '<p>⚠️ <strong>Variabilidade moderada</strong> - Dispersão média.</p>';
        } else {
            html += '<p>🔴 <strong>Alta variabilidade</strong> - Dados heterogêneos.</p>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Cria gráfico para dados agrupados
     */
    createGroupedChart() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não disponível para criar gráfico');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'groupedChart';
        canvas.width = 800;
        canvas.height = 400;
        canvas.style.maxWidth = '100%';
        canvas.style.height = '400px';
        
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.style.marginTop = '2rem';
        container.innerHTML = '<h4 style="color: var(--primary); margin-bottom: 1rem;">📊 Visualização dos Dados Agrupados</h4>';
        container.appendChild(canvas);
        
        document.getElementById('groupedResults').appendChild(container);

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (window.groupedChart && typeof window.groupedChart.destroy === 'function') {
            try {
                window.groupedChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir gráfico anterior:', error);
            }
            window.groupedChart = null;
        }

        const labels = this.data.map(item => item.label);
        const frequencies = this.data.map(item => item.frequency);

        try {
            window.groupedChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Frequência',
                        data: frequencies,
                        backgroundColor: 'rgba(124, 58, 237, 0.7)',
                        borderColor: '#7c3aed',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: this.type === 'frequency' ? 'Gráfico de Frequências' : 'Histograma',
                            color: '#7c3aed',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Frequência (fi)',
                                color: '#64748b',
                                font: { weight: 'bold' }
                            },
                            ticks: {
                                precision: 0,
                                stepSize: 1
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: this.type === 'frequency' ? 'Valores' : 'Classes',
                                color: '#64748b',
                                font: { weight: 'bold' }
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });

        } catch (error) {
            console.error('Erro ao criar gráfico:', error);
            container.innerHTML += '<p style="color: var(--error); text-align: center;">Erro ao criar gráfico</p>';
        }
    }

    /**
     * Limpa os resultados
     */
    clear() {
        document.getElementById('groupedResults').innerHTML = '';
        document.getElementById('frequencyData').value = '';
        document.getElementById('intervalsData').value = '';
        
        // Destruir gráfico se existir
        if (window.groupedChart && typeof window.groupedChart.destroy === 'function') {
            try {
                window.groupedChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir gráfico:', error);
            }
            window.groupedChart = null;
        }
        
        this.data = null;
        this.type = null;
    }
}

// Funções globais para uso nos botões
function calculateGroupedData() {
    if (typeof window.groupedAnalysis === 'undefined') {
        console.error('GroupedDataAnalysis não foi inicializada');
        return;
    }
    window.groupedAnalysis.calculate();
}

function clearGroupedData() {
    if (typeof window.groupedAnalysis === 'undefined') {
        console.error('GroupedDataAnalysis não foi inicializada');
        return;
    }
    window.groupedAnalysis.clear();
} 