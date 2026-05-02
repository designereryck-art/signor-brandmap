# Signor Brand Map

Apresentacao web interativa em formato slide-to-slide para o Brand Map da Signor.

## Como rodar localmente

```bash
python3 -m http.server 5173
```

Depois abra:

```text
http://localhost:5173
```

## Estrutura

- `index.html`: entrada da aplicacao.
- `src/App.jsx`: componentes, navegacao e layouts dos slides.
- `src/signor-content.js`: conteudo estruturado do Brand Map.
- `src/styles.css`: direcao visual, grid, responsividade e microinteracoes.

## Navegacao

- Seta direita: proximo slide.
- Seta esquerda: slide anterior.
- Sumario clicavel: acesso direto as paginas e blocos.
