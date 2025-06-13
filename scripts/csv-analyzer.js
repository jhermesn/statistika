/**
 * Analisador de CSV
 * Cuida do processamento e análise de arquivos CSV
 */
class CSVAnalyzer {
    constructor(uiController) {
        this.uiController = uiController;
        this.csvData = null;
        this.numericColumns = [];
        this.textColumns = [];
        this.csvCharts = {};
    }

    /**
     * Processa upload de arquivo CSV
     * @param {Event} event - Evento de upload do arquivo
     */
    handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo do arquivo
        if (!this.validateFileType(file)) {
            this.uiController.showAlert('Por favor, selecione um arquivo CSV válido.', 'error');
            return;
        }

        // Validar tamanho do arquivo (limite de 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.uiController.showAlert('Arquivo muito grande. Limite máximo: 5MB.', 'error');
            return;
        }

        this.uiController.showLoading('csvResults', true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                this.parseCSV(text);
            } catch (error) {
                this.uiController.showAlert('Erro ao ler arquivo: ' + error.message, 'error');
                document.getElementById('csvResults').innerHTML = '';
            }
        };
        
        reader.onerror = () => {
            this.uiController.showAlert('Erro ao carregar arquivo.', 'error');
            document.getElementById('csvResults').innerHTML = '';
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * Valida tipo do arquivo
     * @param {File} file - Arquivo para validar
     * @returns {boolean} Se o arquivo é válido
     */
    validateFileType(file) {
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'text/plain'
        ];
        
        const validExtensions = ['.csv', '.txt'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        return validTypes.includes(file.type) || hasValidExtension;
    }

    /**
     * Faz parsing do CSV
     * @param {string} text - Conteúdo do arquivo CSV
     */
    parseCSV(text) {
        try {
            // Normalizar quebras de linha
            const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const lines = normalizedText.split('\n').filter(line => line.trim());

            if (lines.length === 0) {
                throw new Error('Arquivo está vazio');
            }

            if (lines.length === 1) {
                throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
            }

            // Processar cabeçalho
            const headers = this.parseCSVLine(lines[0]);
            if (headers.length === 0) {
                throw new Error('Cabeçalho não encontrado ou inválido');
            }

            // Validar cabeçalhos
            const headerValidation = this.validateHeaders(headers);
            if (!headerValidation.isValid) {
                throw new Error(headerValidation.error);
            }

            // Processar dados
            const data = [];
            const parseErrors = [];

            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length === 0) continue; // Linha vazia
                    
                    if (values.length !== headers.length) {
                        parseErrors.push(`Linha ${i + 1}: número de colunas (${values.length}) diferente do cabeçalho (${headers.length})`);
                        continue;
                    }

                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    data.push(row);

                } catch (error) {
                    parseErrors.push(`Linha ${i + 1}: ${error.message}`);
                }
            }

            if (data.length === 0) {
                throw new Error('Nenhuma linha de dados válida encontrada');
            }

            // Mostrar avisos se houver erros de parsing
            if (parseErrors.length > 0) {
                const maxErrors = 5;
                const errorMsg = parseErrors.slice(0, maxErrors).join('\n');
                const moreErrors = parseErrors.length > maxErrors ? `\n... e mais ${parseErrors.length - maxErrors} erro(s)` : '';
                this.uiController.showAlert(`Avisos de parsing:\n${errorMsg}${moreErrors}`, 'warning');
            }

            this.csvData = { headers, data };
            this.analyzeColumns();
            this.displayResults();

        } catch (error) {
            this.uiController.showAlert('Erro ao processar CSV: ' + error.message, 'error');
            document.getElementById('csvResults').innerHTML = '';
        }
    }

    /**
     * Faz parsing de uma linha CSV
     * @param {string} line - Linha do CSV
     * @returns {Array} Array de valores
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escape de aspas duplas
                    current += '"';
                    i += 2;
                } else {
                    // Início ou fim de campo com aspas
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Separador de campo
                values.push(current.trim());
                current = '';
                i++;
            } else {
                // Caractere comum
                current += char;
                i++;
            }
        }

        // Adicionar último valor
        values.push(current.trim());

        return values.filter(value => value !== '');
    }

    /**
     * Valida cabeçalhos do CSV
     * @param {Array} headers - Array de cabeçalhos
     * @returns {Object} Resultado da validação
     */
    validateHeaders(headers) {
        const validation = { isValid: true, error: '' };

        // Verificar cabeçalhos vazios
        const emptyHeaders = headers.filter(h => !h.trim());
        if (emptyHeaders.length > 0) {
            validation.isValid = false;
            validation.error = 'Encontrados cabeçalhos vazios. Todos os cabeçalhos devem ter nomes.';
            return validation;
        }

        // Verificar cabeçalhos duplicados
        const uniqueHeaders = new Set(headers);
        if (uniqueHeaders.size !== headers.length) {
            validation.isValid = false;
            validation.error = 'Cabeçalhos duplicados encontrados. Cada coluna deve ter um nome único.';
            return validation;
        }

        // Verificar caracteres especiais problemáticos
        const problematicChars = /[<>{}[\]\\|]/;
        const invalidHeaders = headers.filter(h => problematicChars.test(h));
        if (invalidHeaders.length > 0) {
            validation.isValid = false;
            validation.error = `Cabeçalhos com caracteres inválidos: ${invalidHeaders.join(', ')}`;
            return validation;
        }

        return validation;
    }

    /**
     * Analisa tipos de colunas
     */
    analyzeColumns() {
        this.numericColumns = [];
        this.textColumns = [];

        this.csvData.headers.forEach(header => {
            const columnData = this.csvData.data.map(row => row[header]);
            const numericData = columnData
                .map(value => this.parseNumber(value))
                .filter(n => !isNaN(n) && isFinite(n));

            // Considerar coluna numérica se pelo menos 70% dos valores forem números válidos
            const numericRatio = numericData.length / columnData.length;
            
            if (numericRatio >= 0.7 && numericData.length >= 2) {
                this.numericColumns.push({
                    name: header,
                    data: numericData,
                    validCount: numericData.length,
                    totalCount: columnData.length,
                    numericRatio: numericRatio
                });
            } else {
                this.textColumns.push({
                    name: header,
                    data: columnData,
                    uniqueValues: [...new Set(columnData)].length
                });
            }
        });
    }

    /**
     * Converte string para número
     * @param {string} value - Valor para converter
     * @returns {number} Número convertido ou NaN
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        
        // Remover espaços e caracteres comuns
        const cleaned = value.toString()
            .trim()
            .replace(/,/g, '.') // Vírgula para ponto decimal
            .replace(/[^\d.-]/g, ''); // Manter apenas dígitos, ponto e hífen
        
        return parseFloat(cleaned);
    }

    /**
     * Exibe resultados da análise
     */
    displayResults() {
        const resultsDiv = document.getElementById('csvResults');
        
        let html = '<div class="result-box">';
        html += '<h3 class="result-title">📊 Análise do Arquivo CSV</h3>';
        
        // Informações gerais
        html += this.generateGeneralInfo();
        
        // Análise de colunas numéricas
        if (this.numericColumns.length > 0) {
            html += this.generateNumericAnalysis();
        }
        
        // Informações sobre colunas de texto
        if (this.textColumns.length > 0) {
            html += this.generateTextColumnInfo();
        }
        
        // Recomendações
        html += this.generateRecommendations();
        
        html += '</div>';
        
        // Container para gráficos com melhor layout
        html += `<div class="step-container">
            <h4 class="step-title">📈 Visualizações dos Dados</h4>
            <div id="csvCharts" class="charts-grid"></div>
        </div>`;
        
        resultsDiv.innerHTML = html;
        
        // Criar gráficos para colunas numéricas
        setTimeout(() => {
            this.createChartsForNumericColumns();
        }, 100);
    }

    /**
     * Gera informações gerais do CSV
     */
    generateGeneralInfo() {
        const rowCount = this.csvData.data.length;
        const columnCount = this.csvData.headers.length;
        
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📋 Informações Gerais</h4>';
        html += '<div class="grid">';
        html += `<div class="stat-card">
            <div class="stat-label">Total de Linhas</div>
            <div class="stat-value">${rowCount}</div>
        </div>`;
        html += `<div class="stat-card">
            <div class="stat-label">Total de Colunas</div>
            <div class="stat-value">${columnCount}</div>
        </div>`;
        html += `<div class="stat-card">
            <div class="stat-label">Colunas Numéricas</div>
            <div class="stat-value">${this.numericColumns.length}</div>
        </div>`;
        html += `<div class="stat-card">
            <div class="stat-label">Colunas de Texto</div>
            <div class="stat-value">${this.textColumns.length}</div>
        </div>`;
        html += '</div>';
        
        // Lista de colunas
        html += '<h5 style="margin-top: 1rem; color: var(--primary);">Estrutura das Colunas:</h5>';
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr><th>Coluna</th><th>Tipo</th><th>Observações</th></tr></thead><tbody>';
        
        this.csvData.headers.forEach(header => {
            const numericCol = this.numericColumns.find(col => col.name === header);
            const textCol = this.textColumns.find(col => col.name === header);
            
            if (numericCol) {
                const validPercent = (numericCol.numericRatio * 100).toFixed(1);
                html += `<tr>
                    <td><strong>${header}</strong></td>
                    <td>🔢 Numérica</td>
                    <td>${validPercent}% valores válidos (${numericCol.validCount}/${numericCol.totalCount})</td>
                </tr>`;
            } else if (textCol) {
                html += `<tr>
                    <td><strong>${header}</strong></td>
                    <td>📝 Texto</td>
                    <td>${textCol.uniqueValues} valores únicos</td>
                </tr>`;
            }
        });
        
        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera análise das colunas numéricas
     */
    generateNumericAnalysis() {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">🔢 Análise Estatística das Colunas Numéricas</h4>';
        
        this.numericColumns.forEach(column => {
            try {
                const calculator = new StatisticsCalculator();
                calculator.setData(column.data);
                const stats = calculator.getDescriptiveStatistics();
                
                html += `<h5 style="color: var(--primary); margin: 1.5rem 0 1rem 0;">📊 ${column.name}</h5>`;
                html += '<div class="grid">';
                
                const measures = [
                    { label: 'Média', value: stats.mean },
                    { label: 'Mediana', value: stats.median },
                    { label: 'Desvio Padrão', value: stats.standardDeviation },
                    { label: 'CV (%)', value: stats.coefficientOfVariation }
                ];
                
                measures.forEach(measure => {
                    html += `<div class="stat-card">
                        <div class="stat-label">${measure.label}</div>
                        <div class="stat-value">${this.uiController.formatNumber(measure.value, 2)}</div>
                    </div>`;
                });
                
                html += '</div>';
                
                // Interpretação
                html += '<div style="margin-top: 1rem; padding: 1rem; background: var(--primary-bg); border-radius: 8px;">';
                const cv = stats.coefficientOfVariation;
                if (cv < 15) {
                    html += '<p>✅ <strong>Baixa variabilidade</strong> - Dados homogêneos</p>';
                } else if (cv < 30) {
                    html += '<p>⚠️ <strong>Variabilidade moderada</strong> - Dispersão média</p>';
                } else {
                    html += '<p>🔴 <strong>Alta variabilidade</strong> - Dados heterogêneos</p>';
                }
                
                if (stats.outliers.hasOutliers) {
                    const totalOutliers = stats.outliers.lowerOutliers.length + stats.outliers.upperOutliers.length;
                    html += `<p>⚠️ <strong>${totalOutliers} outlier(s) detectado(s)</strong></p>`;
                }
                html += '</div>';
                
            } catch (error) {
                html += `<p style="color: var(--danger);">Erro ao analisar coluna ${column.name}: ${error.message}</p>`;
            }
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Gera informações sobre colunas de texto
     */
    generateTextColumnInfo() {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">📝 Informações das Colunas de Texto</h4>';
        
        html += '<div class="table-container">';
        html += '<table>';
        html += '<thead><tr><th>Coluna</th><th>Valores Únicos</th><th>Mais Frequente</th></tr></thead><tbody>';
        
        this.textColumns.forEach(column => {
            // Encontrar valor mais frequente
            const frequency = {};
            column.data.forEach(value => {
                frequency[value] = (frequency[value] || 0) + 1;
            });
            
            const mostFrequent = Object.keys(frequency).reduce((a, b) => 
                frequency[a] > frequency[b] ? a : b
            );
            
            html += `<tr>
                <td><strong>${column.name}</strong></td>
                <td>${column.uniqueValues}</td>
                <td>${mostFrequent} (${frequency[mostFrequent]}x)</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gera recomendações
     */
    generateRecommendations() {
        let html = '<div class="step-container">';
        html += '<h4 class="step-title">💡 Recomendações</h4>';
        
        const totalRows = this.csvData.data.length;
        
        if (totalRows < 30) {
            html += '<p>📊 <strong>Amostra pequena:</strong> Com menos de 30 observações, considere coletar mais dados para análises mais robustas.</p>';
        }
        
        if (this.numericColumns.length === 0) {
            html += '<p>🔢 <strong>Sem colunas numéricas:</strong> Nenhuma coluna foi identificada como numérica. Verifique o formato dos dados.</p>';
        }
        
        // Verificar colunas com muitos valores ausentes
        this.numericColumns.forEach(column => {
            if (column.numericRatio < 0.9) {
                const missingPercent = ((1 - column.numericRatio) * 100).toFixed(1);
                html += `<p>⚠️ <strong>Coluna "${column.name}":</strong> ${missingPercent}% dos valores não são numéricos. Considere limpeza dos dados.</p>`;
            }
        });
        
        if (this.numericColumns.length > 0) {
            html += '<p>📈 <strong>Gráficos disponíveis:</strong> Gráficos foram gerados automaticamente para as colunas numéricas abaixo.</p>';
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Cria gráficos para colunas numéricas
     */
    createChartsForNumericColumns() {
        console.log('🔧 Iniciando criação de gráficos...');
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não disponível');
            document.getElementById('csvCharts').innerHTML = `
                <div class="alert alert-warning">
                    <span class="alert-icon">⚠️</span>
                    <span>Gráficos não disponíveis. Verifique sua conexão com a internet.</span>
                </div>
            `;
            return;
        }

        if (this.numericColumns.length === 0) {
            console.log('❌ Nenhuma coluna numérica encontrada');
            document.getElementById('csvCharts').innerHTML = `
                <div class="alert alert-info">
                    <span class="alert-icon">💡</span>
                    <span>Nenhuma coluna numérica encontrada para gerar gráficos.</span>
                </div>
            `;
            return;
        }

        console.log(`✅ Encontradas ${this.numericColumns.length} colunas numéricas`);
        
        const container = document.getElementById('csvCharts');
        if (!container) {
            console.error('❌ Container csvCharts não encontrado');
            return;
        }
        
        container.className = 'charts-grid';
        container.innerHTML = ''; // Limpar conteúdo anterior
        
        console.log('🎨 Criando gráficos individuais...');
        this.numericColumns.forEach((column, index) => {
            console.log(`📊 Criando gráfico para: ${column.name}`);
            this.createAdvancedColumnChart(column, index, container);
        });

        // Adicionar gráfico de comparação se houver múltiplas colunas
        if (this.numericColumns.length > 1) {
            console.log('📊 Criando gráfico de comparação...');
            this.createComparisonChart(container);
        }
        
        console.log('✅ Gráficos criados com sucesso!');
    }

    /**
     * Cria gráfico avançado para uma coluna específica
     */
    createAdvancedColumnChart(column, index, container) {
        const chartId = `csvChart-${index}`;
        
        // Container do gráfico
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-container-advanced';
        
        // Título do gráfico
        const titleElement = document.createElement('div');
        titleElement.className = 'chart-title';
        titleElement.innerHTML = `
            <h5>📊 ${column.name}</h5>
            <small>${column.validCount} valores válidos de ${column.totalCount} totais</small>
        `;

        // Canvas do gráfico
        const canvas = document.createElement('canvas');
        canvas.id = chartId;
        canvas.className = 'chart-canvas';

        // Estatísticas resumidas
        const statsElement = document.createElement('div');
        statsElement.className = 'chart-mini-stats';

        try {
            const calculator = new StatisticsCalculator();
            calculator.setData(column.data);
            const stats = calculator.getDescriptiveStatistics();

            const miniStats = [
                { label: 'Média', value: stats.mean, icon: '📊' },
                { label: 'Mediana', value: stats.median, icon: '📍' },
                { label: 'Mín', value: Math.min(...column.data), icon: '⬇️' },
                { label: 'Máx', value: Math.max(...column.data), icon: '⬆️' }
            ];

            miniStats.forEach(stat => {
                const statDiv = document.createElement('div');
                statDiv.className = 'chart-mini-stat';
                statDiv.innerHTML = `
                    <div class="chart-mini-stat-icon">${stat.icon}</div>
                    <div class="chart-mini-stat-value">${this.uiController.formatNumber(stat.value, 1)}</div>
                    <div class="chart-mini-stat-label">${stat.label}</div>
                `;
                statsElement.appendChild(statDiv);
            });

        } catch (error) {
            console.warn('Erro ao calcular estatísticas:', error);
        }

        // Montar o container
        chartDiv.appendChild(titleElement);
        chartDiv.appendChild(canvas);
        chartDiv.appendChild(statsElement);
        container.appendChild(chartDiv);

        // Criar o gráfico
        this.renderAdvancedChart(canvas, column, index);
    }

    /**
     * Renderiza gráfico avançado com diferentes tipos baseados nos dados
     */
    renderAdvancedChart(canvas, column, index) {
        console.log(`🎨 Renderizando gráfico para ${column.name}...`);
        
        const ctx = canvas.getContext('2d');
        const chartId = canvas.id;
        
        // Remover gráfico anterior se existir
        if (this.csvCharts[chartId]) {
            try {
                this.csvCharts[chartId].destroy();
            } catch (error) {
                console.warn(`Erro ao remover gráfico ${chartId}:`, error);
            }
            this.csvCharts[chartId] = null;
        }

        // Determinar melhor tipo de gráfico baseado nos dados
        const chartType = this.determineOptimalChartType(column);
        const chartData = this.prepareChartData(column, chartType);
        
        console.log(`📈 Tipo de gráfico escolhido: ${chartType}`);

        try {
            // Configuração do gráfico
            const config = {
                type: chartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#7c3aed',
                            borderWidth: 1,
                            cornerRadius: 8,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 12,
                            callbacks: {
                                title: (context) => `${column.name}`,
                                label: (context) => {
                                    if (chartType === 'line') {
                                        return `Valor: ${context.parsed.y.toFixed(2)}`;
                                    } else {
                                        return `Frequência: ${context.parsed.y} observações`;
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
                                text: chartType === 'line' ? 'Valores' : 'Frequência',
                                color: '#64748b',
                                font: { size: 11, weight: 'bold' }
                            },
                            ticks: {
                                color: '#64748b',
                                font: { size: 10 },
                                callback: (value) => {
                                    if (chartType === 'line') {
                                        return value.toFixed(1);
                                    }
                                    return Math.floor(value);
                                }
                            },
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)',
                                lineWidth: 1
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: chartType === 'line' ? 'Observações (ordenadas)' : 'Intervalos de Valores',
                                color: '#64748b',
                                font: { size: 11, weight: 'bold' }
                            },
                            ticks: {
                                color: '#64748b',
                                font: { size: 10 },
                                maxRotation: 0
                            },
                            grid: {
                                color: 'rgba(124, 58, 237, 0.1)',
                                lineWidth: 1
                            }
                        }
                    },
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            };

            // Criar o gráfico
            this.csvCharts[chartId] = new Chart(ctx, config);
            console.log(`✅ Gráfico ${chartId} criado com sucesso!`);

            // Forçar redimensionamento
            setTimeout(() => {
                if (this.csvCharts[chartId]) {
                    this.csvCharts[chartId].resize();
                    console.log(`🔄 Gráfico ${chartId} redimensionado`);
                }
            }, 300);

        } catch (error) {
            console.error(`❌ Erro ao criar gráfico ${chartId}:`, error);
            canvas.parentElement.innerHTML += `
                <div style="text-align: center; color: var(--danger); padding: 1rem;">
                    ⚠️ Erro ao criar gráfico para ${column.name}: ${error.message}
                </div>
            `;
        }
    }

    /**
     * Determina o tipo ideal de gráfico baseado nos dados
     */
    determineOptimalChartType(column) {
        const dataCount = column.data.length;
        const uniqueValues = new Set(column.data).size;
        const range = Math.max(...column.data) - Math.min(...column.data);

        // Se há muitos valores únicos ou dados contínuos, usar linha
        if (uniqueValues > dataCount * 0.7 || range > uniqueValues * 2) {
            return 'line';
        }

        // Se há poucos valores únicos, usar barra
        if (uniqueValues <= 8) {
            return 'bar';
        }

        // Para casos intermediários, usar histograma (aproximado com barra)
        return 'bar';
    }

    /**
     * Prepara dados do gráfico baseado no tipo
     */
    prepareChartData(column, chartType) {
        const colors = this.generateGradientColors(column.data.length);

        if (chartType === 'line') {
            // Dados ordenados para gráfico de linha
            const sortedData = [...column.data].sort((a, b) => a - b);
            return {
                labels: sortedData.map((_, i) => `${i + 1}º`),
                    datasets: [{
                        label: column.name,
                        data: sortedData,
                        borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.15)',
                    tension: 0.4,
                        fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                        pointBackgroundColor: '#7c3aed',
                        pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            };
        } else {
            // Criar histograma/distribuição de frequência
            const histogram = this.createHistogram(column.data);
            return {
                labels: histogram.labels,
                datasets: [{
                    label: 'Frequência',
                    data: histogram.frequencies,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            };
        }
    }

    /**
     * Cria histograma dos dados
     */
    createHistogram(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const bins = Math.min(Math.ceil(Math.sqrt(data.length)), 10);
        const binWidth = (max - min) / bins;

        const histogram = {
            labels: [],
            frequencies: []
        };

        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            const binCenter = (binStart + binEnd) / 2;
            
            const frequency = data.filter(value => 
                i === bins - 1 ? value >= binStart && value <= binEnd : value >= binStart && value < binEnd
            ).length;

            histogram.labels.push(binCenter.toFixed(1));
            histogram.frequencies.push(frequency);
        }

        return histogram;
    }

    /**
     * Gera cores em gradiente
     */
    generateGradientColors(count) {
        const baseColors = [
            '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd',
            '#6d28d9', '#9333ea', '#a855f7', '#c084fc'
        ];

        return {
            background: baseColors.map(color => color + '40'),
            border: baseColors
        };
    }

    /**
     * Cria gráfico de comparação entre colunas
     */
    createComparisonChart(container) {
        if (this.numericColumns.length < 2) return;

        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-container-comparison';

        chartDiv.innerHTML = `
            <div class="chart-title">
                <h5>📊 Comparação entre Colunas Numéricas</h5>
                <small>Visualização das médias e distribuições</small>
            </div>
            <canvas id="comparisonChart" class="chart-canvas"></canvas>
        `;

        container.appendChild(chartDiv);

        // Criar gráfico de comparação
        const canvas = document.getElementById('comparisonChart');
        const ctx = canvas.getContext('2d');

        const labels = this.numericColumns.map(col => col.name);
        const means = this.numericColumns.map(col => {
            try {
                const calculator = new StatisticsCalculator();
                calculator.setData(col.data);
                return calculator.getDescriptiveStatistics().mean;
            } catch {
                return col.data.reduce((a, b) => a + b, 0) / col.data.length;
            }
        });

        const colors = this.generateGradientColors(this.numericColumns.length);

        // Configuração do gráfico
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média dos Valores',
                    data: means,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        callbacks: {
                            label: (context) => `Média: ${context.parsed.y.toFixed(2)}`
                        }
                    }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                            text: 'Valores Médios',
                                color: '#64748b',
                            font: { weight: 'bold' }
                            },
                            ticks: {
                                color: '#64748b',
                            callback: (value) => value.toFixed(1)
                            },
                            grid: {
                            color: 'rgba(124, 58, 237, 0.1)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                            text: 'Colunas Numéricas',
                                color: '#64748b',
                            font: { weight: 'bold' }
                            },
                            ticks: {
                                color: '#64748b',
                            maxRotation: 45
                            },
                            grid: {
                            color: 'rgba(124, 58, 237, 0.1)'
                            }
                        }
                    },
                    animation: {
                    duration: 1000,
                    easing: 'easeOutBounce'
                    }
                }
        };

        // Criar o gráfico
        this.csvCharts['comparisonChart'] = new Chart(ctx, config);

        // Forçar redimensionamento
        requestAnimationFrame(() => {
            if (this.csvCharts['comparisonChart']) {
                this.csvCharts['comparisonChart'].resize();
        }
        });
    }

    /**
     * Limpa resultados
     */
    clear() {
        document.getElementById('csvFile').value = '';
        document.getElementById('csvResults').innerHTML = '';
        
        // Destruir gráficos
        Object.keys(this.csvCharts).forEach(chartId => {
            const chart = this.csvCharts[chartId];
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn(`Erro ao destruir gráfico ${chartId}:`, error);
                }
            }
        });
        this.csvCharts = {};
        
        this.csvData = null;
        this.numericColumns = [];
        this.textColumns = [];
    }
}

// Funções globais para compatibilidade
function handleCSVUpload(event) {
    if (window.csvAnalyzer) {
        window.csvAnalyzer.handleUpload(event);
    }
}

function clearCSV() {
    if (window.csvAnalyzer) {
        window.csvAnalyzer.clear();
    }
} 