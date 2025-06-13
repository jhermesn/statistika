/**
 * Análise de Frequência
 * Cuida dos cálculos de distribuição de frequência
 */
class FrequencyAnalysis {
    constructor(uiController) {
        this.uiController = uiController;
        this.calculator = null;
    }

    /**
     * Calcula e exibe distribuição de frequência
     */
    calculate() {
        const input = document.getElementById('dataInput').value;
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
            
            const distribution = this.calculator.calculateFrequencyDistribution();
            const showSteps = document.getElementById('freqStepsToggle').classList.contains('active');
            
            this.displayResults(distribution, showSteps);
            
            // Criar histograma após exibir resultados
            setTimeout(() => {
                this.createHistogram(distribution);
            }, 100);

        } catch (error) {
            this.uiController.showAlert('Erro nos cálculos: ' + error.message, 'error');
        }
    }

    /**
     * Exibe os resultados da análise
     * @param {Array} distribution - Distribuição de frequência
     * @param {boolean} showSteps - Se deve mostrar passos detalhados
     */
    displayResults(distribution, showSteps) {
        const resultsDiv = document.getElementById('frequencyResults');
        const data = this.calculator.getData();
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Distribuição de Frequência</h3>';
        
        if (showSteps) {
            html += this.generateStepByStepCalculation(data, distribution);
        }

        html += this.generateFrequencyTable(distribution);
        html += this.generateSummaryStatistics();
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }

    /**
     * Gera cálculo passo a passo
     * @param {Array} data - Dados ordenados
     * @param {Array} distribution - Distribuição de frequência
     * @returns {string} HTML dos passos
     */
    generateStepByStepCalculation(data, distribution) {
        let html = '';

        // Passo 1: Ordenar dados (Rol)
        html += '<div class="step-container">';
        html += '<h4 class="step-title">📋 Passo 1: Organizar dados (Rol)</h4>';
        html += '<div class="formula">Rol = {x₁, x₂, x₃, ..., xₙ} em ordem crescente</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 O que é o Rol:</strong> É simplesmente organizar os dados em ordem crescente. É sempre o primeiro passo em qualquer análise estatística.</p>';
        html += '</div>';
        html += `<p><span class="math-expression">Total de dados:</span> ${data.length}</p>`;
        html += `<p><span class="math-expression">Dados organizados:</span> {${data.join(', ')}}</p>`;
        html += '<div class="interpretation">';
        html += '<p><strong>💡 Por que fazer isso:</strong> Com os dados organizados fica muito mais fácil ver o menor e maior valor e entender como estão distribuídos.</p>';
        html += '</div>';
        html += '</div>';

        // Passo 2: Amplitude Total
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        
        html += '<div class="step-container">';
        html += '<h4 class="step-title">📐 Passo 2: Calcular Amplitude Total (AT)</h4>';
        html += '<div class="formula">AT = Maior valor - Menor valor</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 O que é:</strong> A amplitude total é a diferença entre o maior e menor valor. Ela mostra o quanto os dados variam.</p>';
        html += '</div>';
        html += `<p><span class="math-expression">Menor valor:</span> ${min}</p>`;
        html += `<p><span class="math-expression">Maior valor:</span> ${max}</p>`;
        html += `<p><span class="math-expression">AT =</span> ${max} - ${min} = <strong>${range}</strong></p>`;
        html += '<div class="interpretation">';
        html += `<p><strong>💡 O que isso significa:</strong> Os dados variam numa faixa de ${range} unidades. Essa informação vai nos ajudar a definir o tamanho das classes.</p>`;
        html += '</div>';
        html += '</div>';

        // Passo 3: Número de Classes (Regra de Sturges)
        const numClasses = distribution.length;
        const sturgersFormula = 1 + 3.322 * Math.log10(data.length);
        
        html += '<div class="step-container">';
        html += '<h4 class="step-title">🎯 Passo 3: Quantas classes fazer (Regra de Sturges)</h4>';
        html += '<div class="formula">k = 1 + 3,322 × log₁₀(n)</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Regra de Sturges:</strong> Esta fórmula foi criada por Herbert Sturges em 1926 para determinar o número ideal de classes.</p>';
        html += '<p><strong>🎯 O objetivo:</strong> Encontrar um equilíbrio:</p>';
        html += '<ul>';
        html += '<li>Poucas classes: perdemos detalhes da distribuição</li>';
        html += '<li>Muitas classes: fica difícil de interpretar</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">k =</span> 1 + 3,322 × log₁₀(${data.length})</p>`;
        html += `<p><span class="math-expression">k =</span> 1 + 3,322 × ${Math.log10(data.length).toFixed(3)}</p>`;
        html += `<p><span class="math-expression">k ≈</span> ${sturgersFormula.toFixed(2)}</p>`;
        html += '<div class="interpretation">';
        html += `<p><strong>⚖️ Ajustes práticos:</strong> O sistema limita entre 4 e 10 classes para facilitar a interpretação.</p>`;
        html += `<p><strong>🎯 Resultado final:</strong> <strong>${numClasses} classes</strong> para esta análise.</p>`;
        html += '</div>';
        html += '</div>';

        // Passo 4: Amplitude de Classe
        const classWidth = distribution.length > 0 ? 
            distribution[0].upperBound - distribution[0].lowerBound : 0;
        
        html += '<div class="step-container">';
        html += '<h4 class="step-title">📏 Passo 4: Tamanho de cada classe (h)</h4>';
        html += '<div class="formula">h = AT / k</div>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Amplitude de classe:</strong> É o tamanho de cada intervalo. Determina quantas unidades cada classe vai abranger.</p>';
        html += '<p><strong>🔍 Características importantes:</strong></p>';
        html += '<ul>';
        html += '<li>Todas as classes têm o mesmo tamanho</li>';
        html += '<li>O valor deve ser prático para facilitar a interpretação</li>';
        html += '<li>Classes muito pequenas podem ficar vazias</li>';
        html += '<li>Classes muito grandes podem esconder variações importantes</li>';
        html += '</ul>';
        html += '</div>';
        html += `<p><span class="math-expression">h =</span> ${range} ÷ ${numClasses}</p>`;
        html += `<p><span class="math-expression">h ≈</span> ${(range / numClasses).toFixed(3)}</p>`;
        html += `<p><span class="math-expression">h usado =</span> <strong>${classWidth.toFixed(1)}</strong> (valor ajustado)</p>`;
        html += '<div class="interpretation">';
        html += `<p><strong>💡 O que isso significa:</strong> Cada classe abrange ${classWidth.toFixed(1)} unidades. Os dados dentro de cada classe são considerados do mesmo grupo.</p>`;
        html += '</div>';
        html += '</div>';

        // Passo 5: Explicação sobre Tipos de Intervalos
        html += '<div class="step-container">';
        html += '<h4 class="step-title">🔢 Passo 5: Como funcionam os intervalos</h4>';
        html += '<div class="explanation">';
        html += '<p><strong>📖 Notação usada:</strong> [a ⊢ b) significa "a incluído, b não incluído"</p>';
        html += '<p><strong>🎯 Tipos de intervalos:</strong></p>';
        html += '<ul>';
        html += '<li><strong>[a, b]:</strong> Fechado - ambos os limites fazem parte</li>';
        html += '<li><strong>(a, b):</strong> Aberto - nenhum limite faz parte</li>';
        html += '<li><strong>[a, b):</strong> Semi-aberto - só o limite inferior faz parte</li>';
        html += '<li><strong>(a, b]:</strong> Semi-aberto - só o limite superior faz parte</li>';
        html += '</ul>';
        html += '<p><strong>⚠️ O que usamos aqui:</strong> [a ⊢ b), onde:</p>';
        html += '<ul>';
        html += '<li>O limite inferior está incluído na classe</li>';
        html += '<li>O limite superior não está incluído (exceto na última classe)</li>';
        html += '<li>Isso evita que um valor apareça em duas classes</li>';
        html += '</ul>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    /**
     * Gera tabela de distribuição de frequência
     * @param {Array} distribution - Distribuição de frequência
     * @returns {string} HTML da tabela
     */
    generateFrequencyTable(distribution) {
        let html = '<h4 style="margin-top: 2rem; color: var(--primary);">Tabela de Distribuição de Frequências</h4>';
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr>';
        html += '<th>Classes</th>';
        html += '<th>Ponto Médio (x<sub>i</sub>)</th>';
        html += '<th>Freq. Simples (f<sub>i</sub>)</th>';
        html += '<th>Freq. Relativa (%)</th>';
        html += '<th>Freq. Acumulada (F<sub>i</sub>)</th>';
        html += '<th>Freq. Rel. Acum. (%)</th>';
        html += '</tr></thead><tbody>';

        distribution.forEach((row, index) => {
            html += '<tr>';
            html += `<td>${row.class}</td>`;
            html += `<td>${row.midpoint.toFixed(1)}</td>`;
            html += `<td>${row.frequency}</td>`;
            html += `<td>${(row.relativeFrequency * 100).toFixed(1)}%</td>`;
            html += `<td>${row.cumulativeFrequency}</td>`;
            html += `<td>${(row.relativeCumulativeFrequency * 100).toFixed(1)}%</td>`;
            html += '</tr>';
        });

        // Linha de totais
        const totalFreq = distribution.reduce((sum, row) => sum + row.frequency, 0);
        html += '<tr style="font-weight: bold; background: var(--primary-bg); border-top: 2px solid var(--primary);">';
        html += '<td>TOTAL</td>';
        html += '<td>-</td>';
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
     * Gera estatísticas resumo
     * @returns {string} HTML das estatísticas
     */
    generateSummaryStatistics() {
        if (!this.calculator) return '';

        const stats = this.calculator.getDescriptiveStatistics();
        
        let html = '<h4 style="margin-top: 2rem; color: var(--primary);">Estatísticas Resumo</h4>';
        html += '<div class="grid">';
        
        const statItems = [
            { label: 'Tamanho da Amostra (n)', value: stats.count, unit: '' },
            { label: 'Valor Mínimo', value: stats.minimum, unit: '' },
            { label: 'Valor Máximo', value: stats.maximum, unit: '' },
            { label: 'Amplitude Total', value: stats.range, unit: '' },
            { label: 'Média Aritmética', value: stats.mean, unit: '' },
            { label: 'Desvio Padrão', value: stats.standardDeviation, unit: '' }
        ];

        statItems.forEach(item => {
            html += `<div class="stat-card">
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${this.uiController.formatNumber(item.value, 2)}${item.unit}</div>
            </div>`;
        });

        html += '</div>';

        // Interpretação da distribuição
        html += this.generateDistributionInterpretation(stats);

        return html;
    }

    /**
     * Gera interpretação da distribuição
     * @param {Object} stats - Estatísticas descritivas
     * @returns {string} HTML da interpretação
     */
    generateDistributionInterpretation(stats) {
        let html = '<div class="step-container" style="margin-top: 1.5rem;">';
        html += '<h4 class="step-title">📈 Interpretação da Distribuição</h4>';

        // Análise da variabilidade
        const cv = stats.coefficientOfVariation;
        let variabilityText = '';
        if (cv < 15) {
            variabilityText = '✅ <strong>Baixa variabilidade</strong> - Os dados são homogêneos';
        } else if (cv < 30) {
            variabilityText = '⚠️ <strong>Variabilidade moderada</strong> - Os dados apresentam dispersão média';
        } else {
            variabilityText = '🔴 <strong>Alta variabilidade</strong> - Os dados são heterogêneos';
        }

        html += `<p><strong>Coeficiente de Variação:</strong> ${cv.toFixed(2)}% - ${variabilityText}</p>`;

        // Análise de outliers
        if (stats.outliers.hasOutliers) {
            const totalOutliers = stats.outliers.lowerOutliers.length + stats.outliers.upperOutliers.length;
            html += `<p><strong>⚠️ Outliers detectados:</strong> ${totalOutliers} valor(es) atípico(s) encontrado(s)</p>`;
            
            if (stats.outliers.lowerOutliers.length > 0) {
                html += `<p>• Outliers inferiores: ${stats.outliers.lowerOutliers.join(', ')}</p>`;
            }
            if (stats.outliers.upperOutliers.length > 0) {
                html += `<p>• Outliers superiores: ${stats.outliers.upperOutliers.join(', ')}</p>`;
            }
        } else {
            html += '<p><strong>✅ Sem outliers:</strong> Não foram detectados valores atípicos nos dados</p>';
        }

        // Análise do tamanho da amostra
        if (stats.count < 30) {
            html += '<p><strong>📊 Tamanho da amostra:</strong> Amostra pequena (n < 30). Considere coletar mais dados para análises mais robustas.</p>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Cria histograma e polígono de frequência
     * @param {Array} distribution - Distribuição de frequência
     */
    createHistogram(distribution) {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não disponível para criar histograma');
            this.uiController.showAlert('Gráficos não estão disponíveis. Verifique sua conexão com a internet.', 'info');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'histogramChart';
        canvas.width = 800;
        canvas.height = 400;
        canvas.style.maxWidth = '100%';
        canvas.style.height = '400px';
        canvas.style.width = 'auto';
        
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.style.height = '450px';
        container.style.width = '100%';
        container.style.position = 'relative';
        container.innerHTML = '<h4 style="color: var(--primary); margin-bottom: 1rem;">📊 Histograma e Polígono de Frequências</h4>';
        container.appendChild(canvas);
        
        document.getElementById('frequencyResults').appendChild(container);

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (window.histogramChart && typeof window.histogramChart.destroy === 'function') {
            try {
                window.histogramChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir gráfico anterior:', error);
            }
            window.histogramChart = null;
        }

        // Preparar dados para histograma e polígono
        const labels = distribution.map(d => d.class);
        const frequencies = distribution.map(d => d.frequency);
        const midpoints = distribution.map(d => d.midpoint);

        try {
            window.histogramChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        type: 'bar',
                        label: 'Frequência (Histograma)',
                        data: frequencies,
                        backgroundColor: 'rgba(124, 58, 237, 0.7)',
                        borderColor: '#7c3aed',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y'
                    }, {
                        type: 'line',
                        label: 'Polígono de Frequência',
                        data: frequencies,
                        borderColor: '#e11d48',
                        backgroundColor: 'rgba(225, 29, 72, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#e11d48',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,
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
                            text: 'Distribuição de Frequências - Histograma e Polígono',
                            color: '#7c3aed',
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return `Classe: ${context[0].label}`;
                                },
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        return `Frequência: ${context.parsed.y}`;
                                    } else {
                                        const midpoint = midpoints[context.dataIndex];
                                        return `Ponto médio: ${midpoint.toFixed(1)} | Frequência: ${context.parsed.y}`;
                                    }
                                }
                            }
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
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)'
                            },
                            ticks: {
                                precision: 0,
                                stepSize: 1,
                                color: '#64748b'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Classes',
                                color: '#64748b',
                                font: { weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)'
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0,
                                color: '#64748b'
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    onResize: (chart, size) => {
                        // Garantir que o gráfico não exceda a altura máxima
                        if (size.height > 400) {
                            chart.canvas.style.height = '400px';
                        }
                    }
                }
            });

            // Forçar redimensionamento após criação
            setTimeout(() => {
                if (window.histogramChart && window.histogramChart.resize) {
                    window.histogramChart.resize();
                }
            }, 100);

            // Adicionar explicação sobre os gráficos
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'step-container';
            explanationDiv.style.marginTop = '1rem';
            explanationDiv.innerHTML = `
                <h5 style="color: var(--primary);">📊 Explicação dos Gráficos</h5>
                <div class="explanation">
                    <p><strong>📈 Histograma (barras roxas):</strong> Representa as frequências por meio de retângulos adjacentes. A área de cada retângulo é proporcional à frequência da classe.</p>
                    <p><strong>📍 Polígono de Frequência (linha vermelha):</strong> Conecta os pontos médios das classes através de uma linha. É útil para comparar distribuições e visualizar tendências.</p>
                    <p><strong>🎯 Interpretação conjunta:</strong> Ambos os gráficos mostram a mesma informação de formas diferentes, permitindo uma análise mais completa da distribuição dos dados.</p>
                </div>
            `;
            container.appendChild(explanationDiv);

        } catch (error) {
            console.error('Erro ao criar histograma:', error);
            this.uiController.showAlert('Erro ao criar histograma. Verifique se o Chart.js está disponível.', 'warning');
        }
    }

    /**
     * Limpa resultados e gráficos
     */
    clear() {
        document.getElementById('dataInput').value = '';
        document.getElementById('frequencyResults').innerHTML = '';
        
        // Destruir gráfico se existir
        if (window.histogramChart && typeof window.histogramChart.destroy === 'function') {
            try {
                window.histogramChart.destroy();
            } catch (error) {
                console.warn('Erro ao destruir histograma:', error);
            }
            window.histogramChart = null;
        }
    }
}

// Funções globais para compatibilidade
function calculateFrequency() {
    if (window.frequencyAnalysis) {
        window.frequencyAnalysis.calculate();
    }
}

function clearFrequency() {
    if (window.frequencyAnalysis) {
        window.frequencyAnalysis.clear();
    }
} 