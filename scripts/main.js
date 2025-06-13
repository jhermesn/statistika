/**
 * Arquivo principal do Sistema de Estatística Descritiva
 * Inicializa todos os módulos e configura a aplicação
 */

// Módulos globais
window.uiController = null;
window.frequencyAnalysis = null;
window.measuresAnalysis = null;
window.groupedAnalysis = null;
window.specificAnalysis = null;
window.chartManager = null;
window.csvAnalyzer = null;

/**
 * Inicialização da aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApplication();
        setupErrorHandling();
        checkBrowserCompatibility();
        displayWelcomeMessage();
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showCriticalError('Erro ao carregar a aplicação. Recarregue a página.');
    }
});

/**
 * Inicializa todos os módulos
 */
function initializeApplication() {
    console.log('🚀 Carregando Sistema de Estatística...');

    // Inicializar controlador de UI
    window.uiController = new UIController();

    // Inicializar módulos de análise
    window.frequencyAnalysis = new FrequencyAnalysis(window.uiController);
    window.measuresAnalysis = new MeasuresAnalysis(window.uiController);
    window.groupedAnalysis = new GroupedDataAnalysis(window.uiController);
    window.specificAnalysis = new SpecificAnalysis(window.uiController);
    window.chartManager = new ChartManager(window.uiController);
    window.csvAnalyzer = new CSVAnalyzer(window.uiController);

    console.log('✅ Sistema carregado com sucesso');

    // Configurar recursos extras
    setupAdditionalFeatures();
    
    // Verificar dados salvos
    loadSavedData();
}

/**
 * Configura recursos extras
 */
function setupAdditionalFeatures() {
    // Aguardar o DOM estar pronto
    setTimeout(() => {
        // Botão de exemplo para gráficos
        addExampleButtonToCharts();
        
        // Botões de exportação
        addExportButtons();
        
        // Auto-save das configurações
        setupAutoSave();
        
        // Tooltips informativos
        setupTooltips();
    }, 100);
}

/**
 * Adiciona botão de exemplo para gráficos
 */
function addExampleButtonToCharts() {
    const chartSection = document.getElementById('charts');
    const btnGroup = chartSection?.querySelector('.btn-group');
    
    if (btnGroup) {
        const exampleBtn = document.createElement('button');
        exampleBtn.className = 'btn btn-secondary';
        exampleBtn.textContent = '📋 Carregar Exemplo';
        exampleBtn.onclick = () => {
            if (window.chartManager) {
                window.chartManager.showExample();
            }
        };
        btnGroup.appendChild(exampleBtn);
    }
}

/**
 * Adiciona botões de exportação
 */
function addExportButtons() {
    // Botão para exportar gráfico
    const chartSection = document.getElementById('charts');
    const chartBtnGroup = chartSection?.querySelector('.btn-group');
    
    if (chartBtnGroup) {
        const exportChartBtn = document.createElement('button');
        exportChartBtn.className = 'btn btn-secondary';
        exportChartBtn.textContent = '💾 Exportar Gráfico';
        exportChartBtn.onclick = () => {
            if (window.chartManager) {
                window.chartManager.exportAsImage();
            }
        };
        chartBtnGroup.appendChild(exportChartBtn);
    }

    // Botões para exportar resultados das análises
    ['frequency', 'measures', 'grouped', 'analysis'].forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const btnGroup = section?.querySelector('.btn-group');
        
        if (btnGroup) {
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-secondary';
            exportBtn.textContent = '📄 Exportar Resultados';
            exportBtn.onclick = () => {
                if (window.uiController) {
                    window.uiController.exportResults(sectionId);
                }
            };
            btnGroup.appendChild(exportBtn);
        }
    });
}

/**
 * Configura auto-save das preferências
 */
function setupAutoSave() {
    // Salvar estado dos toggles
    const toggles = ['freqStepsToggle', 'measuresStepsToggle', 'groupedStepsToggle', 'analysisStepsToggle'];
    
    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            // Carregar estado salvo
            const savedState = localStorage.getItem(toggleId);
            if (savedState === 'false') {
                toggle.classList.remove('active');
            }
            
            // Salvar mudanças
            toggle.addEventListener('click', () => {
                setTimeout(() => {
                    localStorage.setItem(toggleId, toggle.classList.contains('active'));
                }, 100);
            });
        }
    });
}

/**
 * Configura tooltips informativos
 */
function setupTooltips() {
    // Adicionar tooltips para elementos importantes
    const tooltips = [
        {
            selector: '.toggle-switch',
            text: 'Ativar/desativar exibição detalhada dos cálculos'
        },
        {
            selector: '#chartType',
            text: 'Selecione o tipo de gráfico que melhor representa seus dados'
        },
        {
            selector: '.file-input-label',
            text: 'Aceita arquivos CSV com cabeçalho na primeira linha'
        }
    ];

    tooltips.forEach(tooltip => {
        const elements = document.querySelectorAll(tooltip.selector);
        elements.forEach(element => {
            element.title = tooltip.text;
        });
    });
}

/**
 * Carrega dados salvos localmente
 */
function loadSavedData() {
    try {
        // Carregar último tipo de gráfico usado
        const lastChartType = localStorage.getItem('lastChartType');
        if (lastChartType) {
            const chartTypeSelect = document.getElementById('chartType');
            if (chartTypeSelect && chartTypeSelect.querySelector(`option[value="${lastChartType}"]`)) {
                chartTypeSelect.value = lastChartType;
            }
        }

        // Salvar tipo de gráfico quando mudar
        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => {
                localStorage.setItem('lastChartType', chartTypeSelect.value);
            });
        }

    } catch (error) {
        console.warn('Não foi possível carregar dados salvos:', error);
    }
}

/**
 * Configura tratamento de erros global
 */
function setupErrorHandling() {
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', function(event) {
        // Filtrar erros comuns que não são críticos para a aplicação
        const ignoredErrors = [
            'Failed to load resource',
            'Script error',
            'ResizeObserver loop limit exceeded',
            'Network request failed'
        ];
        
        const errorMessage = event.error?.message || event.message || '';
        const shouldIgnore = ignoredErrors.some(ignored => 
            errorMessage.includes(ignored)
        );
        
        if (!shouldIgnore) {
            console.error('Erro não tratado:', {
                message: errorMessage,
                filename: event.filename,
                line: event.lineno,
                col: event.colno,
                error: event.error
            });
            
            if (window.uiController) {
                window.uiController.showAlert(
                    'Ocorreu um erro inesperado. Tente recarregar a página se o problema persistir.',
                    'error'
                );
            }
        }
    });

    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason?.message || event.reason || '';
        
        // Filtrar erros conhecidos de recursos externos
        const ignoredReasons = [
            'Chart.js não disponível',
            'Failed to load resource',
            'Network request failed'
        ];
        
        const shouldIgnore = ignoredReasons.some(ignored => 
            reason.toString().includes(ignored)
        );
        
        if (!shouldIgnore) {
            console.error('Promise rejeitada:', event.reason);
            
            if (window.uiController) {
                window.uiController.showAlert(
                    'Erro ao processar operação. Tente novamente.',
                    'warning'
                );
            }
        }
        
        event.preventDefault();
    });
}

/**
 * Verifica compatibilidade do navegador
 */
function checkBrowserCompatibility() {
    const features = {
        'Array.from': typeof Array.from === 'function',
        'Promise': typeof Promise !== 'undefined',
        'localStorage': typeof localStorage !== 'undefined',
        'FileReader': typeof FileReader !== 'undefined',
        'Canvas': !!document.createElement('canvas').getContext
    };

    const missingFeatures = Object.keys(features).filter(feature => !features[feature]);

    if (missingFeatures.length > 0) {
        const message = `Seu navegador não suporta algumas funcionalidades necessárias: ${missingFeatures.join(', ')}. ` +
                       'Recomendamos usar uma versão mais recente do Chrome, Firefox, Safari ou Edge.';
        
        showCriticalError(message);
        return false;
    }

    console.log('✅ Compatibilidade do navegador verificada');
    return true;
}

/**
 * Verifica se Chart.js está disponível (chamado quando necessário)
 */
function checkChartAvailability() {
    if (typeof Chart === 'undefined') {
        if (window.uiController) {
            window.uiController.showAlert(
                'Biblioteca de gráficos não está disponível. Funcionalidades de gráfico podem não funcionar. Verifique sua conexão com a internet.',
                'warning'
            );
        }
        return false;
    }
    return true;
}

/**
 * Exibe mensagem de boas-vindas
 */
function displayWelcomeMessage() {
    if (localStorage.getItem('hideWelcome') === 'true') {
        return;
    }

    setTimeout(() => {
        if (window.uiController) {
            const message = '👋 Bem-vindo ao Sistema de Estatística Descritiva! ' +
                          'Use as abas acima para navegar entre as diferentes análises.';
            window.uiController.showAlert(message, 'info');
            
            // Não mostrar novamente nesta sessão
            localStorage.setItem('hideWelcome', 'true');
        }
    }, 1000);
}

/**
 * Exibe erro crítico
 */
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fef2f2;
        border: 2px solid #dc2626;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        z-index: 10000;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        text-align: center;
        font-family: system-ui, sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h3 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Erro Crítico</h3>
        <p style="color: #7f1d1d; margin-bottom: 1.5rem;">${message}</p>
        <button onclick="location.reload()" style="
            background: #dc2626;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        ">Recarregar Página</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Informações da aplicação
 */
window.APP_INFO = {
    version: '2.3.0',
    modules: ['UIController', 'FrequencyAnalysis', 'MeasuresAnalysis', 'GroupedDataAnalysis', 'SpecificAnalysis', 'ChartManager', 'CSVAnalyzer']
};

console.log('📊 Sistema de Estatística Descritiva v2.3.0');
console.log('🚀 Aplicação inicializada com sucesso!'); 