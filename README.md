# Sistema de Estatística Descritiva 📊

Sistema web para análise estatística descritiva com interface moderna e cálculos detalhados.

## 🚀 Funcionalidades

### 🔍 Classificação de Variáveis
- Guia educativo sobre tipos de variáveis
- **Qualitativas**: Nominal e Ordinal
- **Quantitativas**: Discreta e Contínua
- Exemplos práticos para cada tipo
- Dicas para identificação manual

### 📊 Distribuição de Frequência
- Tabelas de frequência com a regra de Sturges
- Histograma e polígono de frequência
- Cálculos passo a passo explicados
- Classes limitadas entre 4 e 10 para melhor interpretação

### 🧮 Medidas Estatísticas
- **Tendência Central**: Média, Mediana, Moda
- **Dispersão**: Variância, Desvio Padrão, CV
- **Quartis** e detecção de outliers (método IQR)
- Escolha entre fórmulas de amostra ou população

### 📈 Gráficos Interativos
- 6 tipos: Barras, Pizza, Linha, Rosca, Polar, Radar
- Interface simples com Chart.js
- Exportação como PNG
- Responsive design

### 📁 Análise de CSV
- Upload e análise automática
- Detecção de colunas numéricas
- Estatísticas para cada coluna
- Gráficos automáticos

## 📱 Design Responsivo

Funciona perfeitamente em:
- **Desktop** (1200px+)
- **Tablet** (768px-1024px) 
- **Mobile** (até 768px)

## 📋 Formato CSV

```csv
Nome,Idade,Altura,Peso
João,25,1.75,70
Maria,30,1.60,55
Pedro,22,1.80,85
```

### Regras
- ✅ Primeira linha com nomes das colunas
- ✅ Vírgula como separador
- ✅ Ponto para decimais
- ✅ Não deixar células vazias
- ❌ Evitar caracteres especiais

## 🛠️ Estrutura

```
├── index.html                      # Página principal
├── exemplo.csv                     # Arquivo de exemplo
├── styles/
│   ├── main.css                    # Estilos principais
│   └── responsive.css              # Mobile/tablet
├── scripts/
│   ├── main.js                     # Inicialização
│   ├── statistics-calculator.js    # Cálculos estatísticos
│   ├── ui-controller.js            # Interface
│   ├── variable-classifier.js      # Classificação de variáveis
│   ├── frequency-analysis.js       # Distribuição de frequência
│   ├── measures-analysis.js        # Medidas estatísticas
│   ├── chart-manager.js            # Gráficos
│   └── csv-analyzer.js             # Análise de CSV
└── README.md
```

## 🚀 Como usar

### 1. Classificação de Variáveis
1. Leia o guia passo a passo
2. Veja os exemplos práticos
3. Use as dicas para identificar tipos

### 2. Distribuição de Frequência
1. Digite os valores separados por vírgula
2. Ative "mostrar passos" se quiser ver os cálculos
3. Clique em "Calcular"

### 3. Medidas Estatísticas
1. Digite os valores
2. Escolha se é amostra ou população
3. Ative "mostrar cálculos detalhados" 
4. Clique em "Calcular"

### 4. Gráficos
1. Digite dados no formato "nome:valor"
2. Escolha o tipo de gráfico
3. Clique em "Criar Gráfico"

### 5. CSV
1. Prepare seu arquivo seguindo o formato
2. Clique em "Escolher arquivo CSV"
3. Aguarde o processamento

## 💻 Tecnologias

- **HTML5** - Estrutura
- **CSS3** - Design responsivo  
- **JavaScript ES6+** - Lógica
- **Chart.js** - Gráficos

## 🏗️ Arquitetura

Seguindo princípios de Clean Code:
- **Separação de responsabilidades**
- **Módulos independentes**
- **Código reutilizável**
- **Fácil manutenção**

## 🎯 Recursos Especiais

### Alertas Coloridos
- 🔴 **Erros** - 10 segundos
- 🟡 **Avisos** - 8 segundos
- 🔵 **Informações** - 5 segundos  
- 🟢 **Sucesso** - 5 segundos

### Tratamento de Erros
- Validação robusta de dados
- Mensagens claras
- Filtragem automática de erros não críticos
- Fallback para Chart.js

### Exportação
- Gráficos como PNG
- Relatórios em Markdown
- Resultados formatados

## 📊 Estatísticas Implementadas

### Distribuição de Frequência
- Regra de Sturges completa
- Limitações inteligentes (4-10 classes)
- Histograma + polígono de frequência
- Interpretação automática

### Medidas de Posição
- Média com propriedades explicadas
- Mediana resistente a outliers
- Moda: amodal, unimodal, bimodal, multimodal

### Medidas de Dispersão
- Variância amostral vs populacional
- Desvio padrão na unidade original
- Coeficiente de variação com interpretação

### Detecção de Outliers
- Método IQR (Q1 - 1.5×IQR, Q3 + 1.5×IQR)
- Classificação em outliers inferiores/superiores
- Interpretação dos achados

## 🔧 Instalação

```bash
git clone https://github.com/jhermesn/statistika.git
cd statistika
```

Abra `index.html` no navegador. Não precisa de servidor.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🐛 Reportar Bugs

Abra uma [issue](https://github.com/jhermesn/statistika/issues) descrevendo:
- O que você estava fazendo
- O que esperava que acontecesse
- O que realmente aconteceu
- Screenshots se possível

## 🎯 Roadmap

- [ ] Testes automatizados
- [ ] PWA (offline)
- [ ] Mais análises estatísticas
- [ ] Comparação entre datasets
- [ ] Exportação para Excel
- [ ] Análise de correlação
- [ ] Regressão linear

## 👥 Autores

Projeto desenvolvido para fins educacionais.

## 🙏 Agradecimentos

- Chart.js pela excelente biblioteca de gráficos
- Comunidade open-source
- professora Michelle Borges da Universidade do Estado do Pará pelas aulas

---

**Versão:** 2.2.0  
**Compatibilidade:** Chrome 60+, Firefox 55+, Safari 12+, Edge 79+ 