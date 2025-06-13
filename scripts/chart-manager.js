/**
 * Gerenciador de Gráficos
 * Cuida da criação e exibição dos gráficos
 */
class ChartManager {
    constructor(uiController) {
        this.uiController = uiController;
        this.currentChart = null;
        this.chartHistory = [];
    }

    /**
     * Cria gráfico baseado nos dados inseridos
     */
    create() {
        const input = document.getElementById('chartDataInput').value;
        const chartType = document.getElementById('chartType').value;

        if (!input.trim()) {
            this.uiController.showAlert('Digite alguns dados para criar o gráfico', 'warning');
            return;
        }

        try {
            const data = this.parseChartData(input);
            this.renderChart(data, chartType);
        } catch (error) {
            this.uiController.showAlert('Erro ao processar dados: ' + error.message, 'error');
        }
    }

    /**
     * Verifica se Chart.js está disponível
     * @returns {boolean} Se Chart.js está disponível
     */
    checkChartAvailability() {
        if (typeof Chart === 'undefined') {
            this.uiController.showAlert(
                'Biblioteca de gráficos não está disponível. Verifique sua conexão com a internet e recarregue a página.',
                'warning'
            );
            return false;
        }
        return true;
    }

    /**
     * Processa dados de entrada do formato "nome:valor"
     * @param {string} input - Dados de entrada
     * @returns {Object} Dados formatados para o gráfico
     */
    parseChartData(input) {
        const pairs = input.split(',').map(pair => pair.trim()).filter(pair => pair);
        
        if (pairs.length === 0) {
            throw new Error('Nenhum dado válido encontrado');
        }

        const labels = [];
        const values = [];

        pairs.forEach((pair, index) => {
            const parts = pair.split(':');
            
            if (parts.length !== 2) {
                throw new Error(`Formato inválido na posição ${index + 1}. Use "nome:valor"`);
            }

            const label = parts[0].trim();
            const value = parseFloat(parts[1].trim());

            if (!label) {
                throw new Error(`Nome vazio na posição ${index + 1}`);
            }

            if (isNaN(value) || !isFinite(value)) {
                throw new Error(`Valor inválido "${parts[1]}" na posição ${index + 1}`);
            }

            labels.push(label);
            values.push(value);
        });

        return { labels, values };
    }

    /**
     * Renderiza o gráfico
     * @param {Object} data - Dados do gráfico
     * @param {string} chartType - Tipo do gráfico
     */
    renderChart(data, chartType) {
        if (!this.checkChartAvailability()) {
            return;
        }

        const canvas = document.getElementById('myChart');
        if (!canvas) {
            this.uiController.showAlert('Canvas do gráfico não encontrado.', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Destruir gráfico anterior
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const config = this.generateChartConfig(data, chartType);
        
        try {
            this.currentChart = new Chart(ctx, config);
            
            // Salvar no histórico
            this.chartHistory.push({
                data: { ...data },
                type: chartType,
                timestamp: new Date().toISOString()
            });

            this.uiController.showAlert('Gráfico criado com sucesso!', 'success');
            
        } catch (error) {
            this.uiController.showAlert('Erro ao renderizar gráfico: ' + error.message, 'error');
        }
    }

    /**
     * Gera configuração do gráfico
     * @param {Object} data - Dados do gráfico
     * @param {string} chartType - Tipo do gráfico
     * @returns {Object} Configuração do Chart.js
     */
    generateChartConfig(data, chartType) {
        const colors = this.generateColors(data.labels.length);
        const title = this.getChartTitle(chartType);

        const baseConfig = {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Valores',
                    data: data.values,
                    backgroundColor: this.getBackgroundColors(chartType, colors),
                    borderColor: this.getBorderColors(chartType, colors),
                    borderWidth: 2,
                    tension: chartType === 'line' ? 0.4 : 0,
                    fill: chartType === 'line',
                    pointBackgroundColor: chartType === 'line' ? '#7c3aed' : undefined,
                    pointBorderColor: chartType === 'line' ? '#fff' : undefined,
                    pointBorderWidth: chartType === 'line' ? 2 : undefined,
                    pointRadius: chartType === 'line' ? 5 : undefined,
                    pointHoverRadius: chartType === 'line' ? 7 : undefined
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#7c3aed',
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: this.shouldShowLegend(chartType),
                        position: 'top',
                        labels: {
                            color: '#64748b',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#7c3aed',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y || context.parsed;
                                return `${context.dataset.label}: ${this.formatValue(value)}`;
                            }
                        }
                    }
                },
                scales: this.getScalesConfig(chartType),
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        // Configurações específicas por tipo
        return this.applyChartSpecificConfig(baseConfig, chartType);
    }

    /**
     * Gera array de cores para o gráfico
     * @param {number} count - Número de cores necessárias
     * @returns {Array} Array de cores
     */
    generateColors(count) {
        const baseColors = [
            '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd',
            '#6d28d9', '#9333ea', '#a855f7', '#c084fc',
            '#5b21b6', '#7e22ce', '#9f7aea', '#b794f6'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }

        return colors;
    }

    /**
     * Obtém cores de fundo baseado no tipo do gráfico
     */
    getBackgroundColors(chartType, colors) {
        if (chartType === 'line') {
            return 'rgba(124, 58, 237, 0.1)';
        }
        return colors.map(color => color + '80'); // Adiciona transparência
    }

    /**
     * Obtém cores de borda baseado no tipo do gráfico
     */
    getBorderColors(chartType, colors) {
        if (chartType === 'line') {
            return '#7c3aed';
        }
        return colors;
    }

    /**
     * Verifica se deve mostrar legenda
     */
    shouldShowLegend(chartType) {
        return ['pie', 'doughnut', 'polarArea', 'radar'].includes(chartType);
    }

    /**
     * Obtém título do gráfico
     */
    getChartTitle(chartType) {
        const titles = {
            bar: 'Gráfico de Barras',
            pie: 'Gráfico de Pizza',
            line: 'Gráfico de Linha',
            doughnut: 'Gráfico de Rosca',
            polarArea: 'Gráfico Polar',
            radar: 'Gráfico Radar'
        };
        return titles[chartType] || 'Visualização de Dados';
    }

    /**
     * Obtém configuração das escalas
     */
    getScalesConfig(chartType) {
        if (['pie', 'doughnut', 'polarArea', 'radar'].includes(chartType)) {
            return {};
        }

        return {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valores',
                    color: '#64748b',
                    font: { weight: 'bold' }
                },
                grid: {
                    color: 'rgba(124, 58, 237, 0.1)'
                },
                ticks: {
                    color: '#64748b',
                    callback: (value) => this.formatValue(value)
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Categorias',
                    color: '#64748b',
                    font: { weight: 'bold' }
                },
                grid: {
                    color: 'rgba(124, 58, 237, 0.1)'
                },
                ticks: {
                    color: '#64748b',
                    maxRotation: 45
                }
            }
        };
    }

    /**
     * Aplica configurações específicas por tipo de gráfico
     */
    applyChartSpecificConfig(config, chartType) {
        switch (chartType) {
            case 'bar':
                config.options.plugins.legend.display = false;
                config.data.datasets[0].borderRadius = 4;
                config.data.datasets[0].borderSkipped = false;
                break;

            case 'line':
                config.options.plugins.legend.display = false;
                config.data.datasets[0].pointBackgroundColor = '#7c3aed';
                config.data.datasets[0].pointBorderColor = '#fff';
                break;

            case 'pie':
            case 'doughnut':
                config.options.cutout = chartType === 'doughnut' ? '50%' : '0%';
                config.options.plugins.legend.position = 'right';
                break;

            case 'polarArea':
                config.options.plugins.legend.position = 'right';
                break;

            case 'radar':
                config.options.scales = {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(124, 58, 237, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(124, 58, 237, 0.2)'
                        }
                    }
                };
                break;
        }

        return config;
    }

    /**
     * Formata valores para exibição
     */
    formatValue(value) {
        if (typeof value !== 'number') return value;
        
        if (Math.abs(value) >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else if (value % 1 === 0) {
            return value.toString();
        } else {
            return value.toFixed(2);
        }
    }

    /**
     * Exporta gráfico como imagem
     */
    exportAsImage() {
        if (!this.currentChart) {
            this.uiController.showAlert('Nenhum gráfico para exportar.', 'warning');
            return;
        }

        try {
            const canvas = this.currentChart.canvas;
            const url = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.download = `grafico_${new Date().getTime()}.png`;
            link.href = url;
            link.click();
            
            this.uiController.showAlert('Gráfico exportado com sucesso!', 'success');
            
        } catch (error) {
            this.uiController.showAlert('Erro ao exportar gráfico: ' + error.message, 'error');
        }
    }

    /**
     * Limpa gráfico atual
     */
    clear() {
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        
        document.getElementById('chartDataInput').value = '';
        
        // Resetar canvas
        const canvas = document.getElementById('myChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Mostra dados de exemplo
     */
    showExample() {
        const examples = {
            bar: 'Janeiro:100, Fevereiro:150, Março:120, Abril:180, Maio:200, Junho:175',
            pie: 'Windows:45, macOS:25, Linux:20, Outros:10',
            line: 'Q1:1000, Q2:1200, Q3:1100, Q4:1400',
            doughnut: 'Marketing:30, Vendas:25, TI:20, RH:15, Operações:10',
            polarArea: 'Norte:40, Sul:35, Leste:45, Oeste:30',
            radar: 'Velocidade:8, Potência:6, Eficiência:9, Custo:4, Qualidade:7'
        };

        const chartType = document.getElementById('chartType').value;
        const example = examples[chartType] || examples.bar;
        
        document.getElementById('chartDataInput').value = example;
        this.uiController.showAlert(`Exemplo carregado para ${this.getChartTitle(chartType)}`, 'info');
    }

    /**
     * Obtém informações do gráfico atual
     */
    getCurrentChartInfo() {
        if (!this.currentChart) {
            return null;
        }

        return {
            type: this.currentChart.config.type,
            dataCount: this.currentChart.data.labels.length,
            labels: this.currentChart.data.labels,
            values: this.currentChart.data.datasets[0].data
        };
    }

    /**
     * Redimensiona gráfico
     */
    resize() {
        if (this.currentChart) {
            this.currentChart.resize();
        }
    }
}

// Funções globais para compatibilidade
function createChart() {
    if (window.chartManager) {
        window.chartManager.create();
    }
}

function clearChart() {
    if (window.chartManager) {
        window.chartManager.clear();
    }
}

function showChartExample() {
    if (window.chartManager) {
        window.chartManager.showExample();
    }
}

function exportChart() {
    if (window.chartManager) {
        window.chartManager.exportAsImage();
    }
} 