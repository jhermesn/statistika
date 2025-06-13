/**
 * Calculadora de Estatísticas
 * Faz os cálculos estatísticos básicos
 */
class StatisticsCalculator {
    constructor() {
        this.data = [];
        this.sortedData = [];
    }

    /**
     * Define os dados para cálculo
     * @param {Array} data - Array de números
     */
    setData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Dados devem ser um array não vazio');
        }
        
        // Pegar só números válidos
        this.data = data.filter(value => {
            const num = Number(value);
            return !isNaN(num) && isFinite(num);
        });
        
        if (this.data.length === 0) {
            throw new Error('Nenhum número válido encontrado nos dados');
        }
        
        this.sortedData = [...this.data].sort((a, b) => a - b);
    }

    /**
     * Retorna os dados ordenados
     * @returns {Array} Dados ordenados (rol)
     */
    getData() {
        return [...this.sortedData];
    }

    /**
     * Calcula a média aritmética
     * Fórmula: x̄ = (Σxi) / n
     * @returns {number} Média aritmética
     */
    calculateMean() {
        const sum = this.data.reduce((acc, value) => acc + value, 0);
        return sum / this.data.length;
    }

    /**
     * Calcula a mediana
     * - Se n é ímpar: mediana = valor na posição (n+1)/2
     * - Se n é par: mediana = média dos dois valores centrais
     * @returns {number} Mediana
     */
    calculateMedian() {
        const n = this.sortedData.length;
        const middle = Math.floor(n / 2);
        
        if (n % 2 === 0) {
            // n par: média dos dois valores centrais
            return (this.sortedData[middle - 1] + this.sortedData[middle]) / 2;
        } else {
            // n ímpar: valor central
            return this.sortedData[middle];
        }
    }

    /**
     * Calcula a moda (valor que mais aparece)
     * - Se todos têm mesma frequência: Amodal (array vazio)
     * - Se um valor tem maior frequência: Unimodal
     * - Se dois ou mais valores têm mesma maior frequência: Multimodal
     * @returns {Array} Array com o(s) valor(es) modal(is)
     */
    calculateMode() {
        const frequency = {};
        
        // Contar frequências
        this.data.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        const frequencies = Object.values(frequency);
        const maxFrequency = Math.max(...frequencies);
        const minFrequency = Math.min(...frequencies);
        
        // Se todas as frequências são iguais: Amodal
        if (maxFrequency === minFrequency) {
            return []; // Amodal
        }
        
        // Encontrar valores com frequência máxima
        const modes = Object.keys(frequency)
            .filter(value => frequency[value] === maxFrequency)
            .map(Number)
            .sort((a, b) => a - b);
        
        return modes;
    }

    /**
     * Calcula a variância
     * @param {boolean} isSample - Se true, calcula variância amostral (n-1), se false, populacional (n)
     * @returns {number} Variância
     */
    calculateVariance(isSample = true) {
        const mean = this.calculateMean();
        const squaredDifferences = this.data.map(value => Math.pow(value - mean, 2));
        const sumSquaredDifferences = squaredDifferences.reduce((acc, value) => acc + value, 0);
        
        // Usar (n-1) para amostra ou (n) para população
        const denominator = isSample ? this.data.length - 1 : this.data.length;
        return sumSquaredDifferences / denominator;
    }

    /**
     * Calcula o desvio padrão
     * @param {boolean} isSample - Se true, calcula desvio padrão amostral, se false, populacional
     * @returns {number} Desvio padrão
     */
    calculateStandardDeviation(isSample = true) {
        return Math.sqrt(this.calculateVariance(isSample));
    }

    /**
     * Calcula o coeficiente de variação
     * @param {boolean} isSample - Se true, usa desvio padrão amostral, se false, populacional
     * @returns {number} Coeficiente de variação em porcentagem
     */
    calculateCoefficientOfVariation(isSample = true) {
        const mean = this.calculateMean();
        const stdDev = this.calculateStandardDeviation(isSample);
        
        if (Math.abs(mean) < 1e-10) {
            return 0; // Evitar divisão por zero
        }
        
        return (stdDev / Math.abs(mean)) * 100;
    }

    /**
     * Calcula os quartis usando o método dos percentis
     * - Q1 (25%): Primeiro quartil
     * - Q2 (50%): Segundo quartil (mediana)
     * - Q3 (75%): Terceiro quartil
     * @returns {Object} Objeto com Q1, Q2, Q3
     */
    calculateQuartiles() {
        const n = this.sortedData.length;
        
        // Função para calcular percentil
        const percentile = (p) => {
            const index = (p / 100) * (n - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;
            
            if (upper >= n) return this.sortedData[n - 1];
            if (lower < 0) return this.sortedData[0];
            
            return this.sortedData[lower] * (1 - weight) + this.sortedData[upper] * weight;
        };
        
        return {
            Q1: percentile(25),
            Q2: percentile(50), // Mediana
            Q3: percentile(75)
        };
    }

    /**
     * Detecta outliers usando o método IQR (Intervalo Interquartil)
     * 
     * Método IQR:
     * 1. Calcula IQR = Q3 - Q1
     * 2. Define limites: 
     *    - Limite inferior = Q1 - 1.5 × IQR
     *    - Limite superior = Q3 + 1.5 × IQR
     * 3. Valores fora destes limites são considerados outliers
     * 
     * Interpretação:
     * - Outliers inferiores: valores abaixo de Q1 - 1.5×IQR
     * - Outliers superiores: valores acima de Q3 + 1.5×IQR
     * - O fator 1.5 é o padrão estatístico para detecção moderada
     * 
     * @returns {Object} Objeto com informações sobre outliers
     */
    detectOutliers() {
        const quartiles = this.calculateQuartiles();
        const iqr = quartiles.Q3 - quartiles.Q1;
        
        // Limites para detecção de outliers (regra 1.5×IQR)
        const lowerBound = quartiles.Q1 - 1.5 * iqr;
        const upperBound = quartiles.Q3 + 1.5 * iqr;
        
        const lowerOutliers = this.sortedData.filter(value => value < lowerBound);
        const upperOutliers = this.sortedData.filter(value => value > upperBound);
        
        return {
            hasOutliers: lowerOutliers.length > 0 || upperOutliers.length > 0,
            lowerOutliers,
            upperOutliers,
            lowerBound,
            upperBound,
            iqr,
            method: 'IQR (Q1 - 1.5×IQR, Q3 + 1.5×IQR)',
            interpretation: this.interpretOutliers(lowerOutliers, upperOutliers)
        };
    }

    /**
     * Interpreta os outliers detectados
     * @param {Array} lowerOutliers - Outliers inferiores
     * @param {Array} upperOutliers - Outliers superiores
     * @returns {string} Interpretação dos outliers
     */
    interpretOutliers(lowerOutliers, upperOutliers) {
        const totalOutliers = lowerOutliers.length + upperOutliers.length;
        
        if (totalOutliers === 0) {
            return 'Não há valores atípicos nos dados. Todos os valores estão dentro do intervalo esperado.';
        }
        
        let interpretation = `Detectados ${totalOutliers} valor(es) atípico(s): `;
        
        if (lowerOutliers.length > 0) {
            interpretation += `${lowerOutliers.length} outlier(s) inferior(es) [${lowerOutliers.join(', ')}]`;
        }
        
        if (upperOutliers.length > 0) {
            if (lowerOutliers.length > 0) interpretation += ' e ';
            interpretation += `${upperOutliers.length} outlier(s) superior(es) [${upperOutliers.join(', ')}]`;
        }
        
        interpretation += '. Estes valores podem indicar erros de medição, casos especiais ou variabilidade natural extrema.';
        
        return interpretation;
    }

    /**
     * Calcula distribuição de frequência com intervalos de classe
     * Baseado na Regra de Sturges com limitações práticas
     * 
     * Passos do cálculo:
     * 1. Organizar dados em rol (ordem crescente)
     * 2. Calcular amplitude total: AT = máximo - mínimo
     * 3. Determinar número de classes: k = 1 + 3.322 × log₁₀(n)
     * 4. Calcular amplitude de classe: h = AT / k
     * 5. Construir intervalos e contar frequências
     * 
     * Limitações aplicadas:
     * - Mínimo de 4 classes (para dados pequenos)
     * - Máximo de 10 classes (para facilitar interpretação)
     * 
     * @returns {Array} Array com as classes e suas frequências
     */
    calculateFrequencyDistribution() {
        if (this.data.length < 4) {
            throw new Error('Dados insuficientes para criar distribuição de frequência (mínimo 4 valores)');
        }
        
        const min = Math.min(...this.sortedData);
        const max = Math.max(...this.sortedData);
        const range = max - min;
        
        if (range === 0) {
            throw new Error('Todos os valores são iguais. Não é possível criar intervalos de classe.');
        }
        
        // Regra de Sturges: k = 1 + 3.322 × log₁₀(n)
        let numClasses = Math.ceil(1 + 3.322 * Math.log10(this.data.length));
        
        // Aplicar limitações: mínimo 4, máximo 10 classes
        numClasses = Math.max(4, Math.min(10, numClasses));
        
        const classWidth = range / numClasses;
        const distribution = [];
        
        for (let i = 0; i < numClasses; i++) {
            const lowerBound = min + i * classWidth;
            const upperBound = i === numClasses - 1 ? max : min + (i + 1) * classWidth;
            
            // Contar valores no intervalo [lowerBound, upperBound)
            // Para a última classe, incluir o limite superior
            const valuesInClass = this.sortedData.filter(value => {
                if (i === numClasses - 1) {
                    return value >= lowerBound && value <= upperBound;
                } else {
                    return value >= lowerBound && value < upperBound;
                }
            });
            
            const frequency = valuesInClass.length;
            const relativeFrequency = frequency / this.data.length;
            const cumulativeFrequency = distribution.reduce((sum, item) => sum + item.frequency, 0) + frequency;
            const relativeCumulativeFrequency = cumulativeFrequency / this.data.length;
            
            distribution.push({
                class: `${lowerBound.toFixed(1)} ⊢ ${upperBound.toFixed(1)}`,
                lowerBound,
                upperBound,
                midpoint: (lowerBound + upperBound) / 2,
                frequency,
                relativeFrequency,
                cumulativeFrequency,
                relativeCumulativeFrequency,
                values: valuesInClass
            });
        }
        
        return distribution;
    }

    /**
     * Retorna todas as estatísticas descritivas
     * @param {boolean} isSample - Se true, usa fórmulas amostrais, se false, populacionais
     * @returns {Object} Objeto com todas as estatísticas
     */
    getDescriptiveStatistics(isSample = true) {
        const mean = this.calculateMean();
        const median = this.calculateMedian();
        const mode = this.calculateMode();
        const variance = this.calculateVariance(isSample);
        const standardDeviation = this.calculateStandardDeviation(isSample);
        const coefficientOfVariation = this.calculateCoefficientOfVariation(isSample);
        const quartiles = this.calculateQuartiles();
        const outliers = this.detectOutliers();
        
        return {
            count: this.data.length,
            minimum: Math.min(...this.data),
            maximum: Math.max(...this.data),
            range: Math.max(...this.data) - Math.min(...this.data),
            mean,
            median,
            mode,
            variance,
            standardDeviation,
            coefficientOfVariation,
            quartiles,
            outliers,
            isSample, // Adicionar informação sobre o tipo de cálculo
            // Informações adicionais para interpretação
            modalType: this.getModalType(mode),
            symmetryAnalysis: this.analyzeSymmetry(mean, median, standardDeviation),
            variabilityLevel: this.getVariabilityLevel(coefficientOfVariation)
        };
    }

    /**
     * Determina o tipo de distribuição modal
     * @param {Array} mode - Array com valores modais
     * @returns {string} Tipo modal
     */
    getModalType(mode) {
        if (mode.length === 0) return 'Amodal (sem moda)';
        if (mode.length === 1) return 'Unimodal';
        if (mode.length === 2) return 'Bimodal';
        return 'Multimodal';
    }

    /**
     * Analisa a simetria da distribuição
     * @param {number} mean - Média
     * @param {number} median - Mediana
     * @param {number} stdDev - Desvio padrão
     * @returns {Object} Análise de simetria
     */
    analyzeSymmetry(mean, median, stdDev) {
        const difference = Math.abs(mean - median);
        const relativeSkew = difference / stdDev;
        
        let type, description;
        
        if (relativeSkew < 0.2) {
            type = 'Aproximadamente simétrica';
            description = 'A média e mediana são próximas, indicando distribuição equilibrada.';
        } else if (mean > median) {
            type = 'Assimétrica positiva (à direita)';
            description = 'A média é maior que a mediana, indicando cauda alongada à direita.';
        } else {
            type = 'Assimétrica negativa (à esquerda)';
            description = 'A média é menor que a mediana, indicando cauda alongada à esquerda.';
        }
        
        return { type, description, skewness: relativeSkew };
    }

    /**
     * Determina o nível de variabilidade
     * @param {number} cv - Coeficiente de variação
     * @returns {Object} Nível de variabilidade
     */
    getVariabilityLevel(cv) {
        let level, description;
        
        if (cv < 15) {
            level = 'Baixa';
            description = 'Dados homogêneos com pouca dispersão.';
        } else if (cv < 30) {
            level = 'Moderada';
            description = 'Dados com dispersão média.';
        } else {
            level = 'Alta';
            description = 'Dados heterogêneos com grande dispersão.';
        }
        
        return { level, description, value: cv };
    }
} 