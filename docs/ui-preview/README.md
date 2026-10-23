# Slime Sage — Dark Fantasy UI

Vitrine React independente, reconstruída a partir de `docs/design.png`, o pack de referência **Dark Fantasy UI Elements**. A referência define a linguagem visual: ouro fino, fundo navy, cantos ornamentados, botões recortados e círculos geométricos. Os desenhos de interface são SVGs e CSS originais. A imagem integral, com sua marca d’água, aparece apenas na seção **Comparação** para revisão visual; nenhum recorte ou parte dela compõe a interface.

## Como rodar

```bash
cd docs/ui-preview
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para validar a compilação, execute `npm run build`. React e React DOM fazem a interface; Vite serve e empacota os arquivos. Não há biblioteca de componentes, ícones ou animação.

## Especificação extraída da referência

### Paleta

O PNG contém antialiasing, transparências visuais e uma iluminação de fundo. Os hex abaixo descrevem cores representativas amostradas ou equivalentes aproximados; não recuperam a paleta vetorial original.

| Papel                | Cor       | Uso                                     |
| -------------------- | --------- | --------------------------------------- |
| Fundo navy           | `#02020E` | Atmosfera da página                     |
| Superfície           | `#060B1A` | Interior sólido dos componentes         |
| Ouro das linhas      | `#FEC077` | Todos os contornos, ornamentos e ícones |
| Azul da luz de borda | `#153D6E` | Somente o fundo da página               |
| Marfim dos títulos   | `#FBFAD0` | Títulos e destaques legíveis            |
| Texto de leitura     | `#E7E3D6` | Corpo, campos e instruções              |
| Estrelas             | `#EBCB9A` | Pontos pequenos na atmosfera            |

O ouro é um único tom sólido: não recebe degradê metálico, glow ou relevo. O azul difuso da imagem também passa por tons próximos de `#112347`; isso pertence à atmosfera, não aos cards.

Contraste calculado pela fórmula de luminância relativa da WCAG: ouro sobre navy **12,80:1**; ouro sobre superfície **12,16:1**; marfim sobre superfície **18,39:1**; texto de leitura sobre superfície **15,28:1**. Essas combinações superam AA para texto comum. Estados, foco e superfícies derivadas são tratados separadamente na revisão.

### Tipografia

Os títulos da referência usam serifa de inspiração romana, alto contraste e letras capitais; os botões se aproximam de versaletes com proporções compactas. A imagem não permite identificar a fonte original.

- **Cinzel**, proposta gratuita equivalente, para títulos, botões e destaques curtos. Suas capitais remetem à inscrição clássica, sem usar glifos rúnicos no conteúdo. [Projeto oficial](https://github.com/NDISCOVER/Cinzel).
- **Source Sans 3**, para texto corrido, inputs, descrições e rótulos pequenos. Sua função é manter leitura confortável dentro das molduras. [Projeto oficial](https://github.com/adobe-fonts/source-sans).

São duas famílias. Os fallbacks são locais caso o carregamento das fontes esteja indisponível. A fonte temática não é usada em parágrafos longos.

### Linhas, bordas e composição

A referência combina uma linha externa próxima de 1px com uma linha interna mais leve, separadas por poucos pixels. Pontas em losango, chamas/folhas estilizadas e pequenos acentos centrais dão identidade aos contornos. Essas medidas são relativas ao PNG; no preview são tokens ajustáveis, com traços suficientemente fortes para permanecerem visíveis em tela.

Os ornamentos são periféricos. As áreas de texto mantêm padding próprio; pontas e cantos não entram na área de leitura nem reduzem a área clicável. Os desenhos escaláveis usam extremidades e cantos de tamanho fixo com segmentos centrais flexíveis, evitando esticar a arte dos cantos.

Os contornos de botões, molduras, banners e divisórias agora são desenhados em SVGs dimensionados pelo tamanho real do componente (`BorderGeometry.jsx`). Cada perímetro é fechado e contínuo: não há junção entre uma linha CSS e um canto SVG, nem fundo de canto que apague a borda. Os ornamentos usam as mesmas coordenadas do contorno ao qual se conectam. O traço externo é de 1,25px e o interno de 1px, ambos em ouro pleno; as bordas normais não recebem mistura escura.

### Catálogo de formas

| Forma da referência     | Regra de recriação                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Placa com pontas        | Miolo reto, dois terminais pontiagudos e pequeno centro ornamental                 |
| Pílula                  | Corpo alongado arredondado, terminais laterais curvos e acentos de ouro            |
| Linha dupla             | Silhueta arredondada com segundo contorno interno claramente separado              |
| Retangular com recortes | Retângulo de cantos escalonados/recortados e linhas paralelas                      |
| Moldura retangular      | Contorno fino com cantos fixos e detalhe central de borda                          |
| Banner em arco          | Formato vertical, topo estruturado e base arredondada/arco alongado                |
| Slot quadrado           | Moldura pequena de duas linhas, cantos e centros discretos                         |
| Medalhão                | Aros concêntricos, poucos acentos nas posições cardeais                            |
| Círculo mágico          | Anéis, triângulos/polígonos e conexões geométricas, separados do resultado textual |
| Divisória               | Linha horizontal com motivo central e terminações simples                          |
| Barra                   | Trilha longa, contorno dourado e sequência de losangos                             |

### Ícones

A referência contém **frasco, taça, elmo e coroa**. São silhuetas compactas, com partes douradas e vazios escuros, mais encorpadas que os contornos dos painéis. O conjunto original do preview inclui esses quatro e **espada, escudo, grimório e bússola**, na mesma malha de 48 unidades e com peso coerente. São SVGs próprios em `currentColor`, sem fonte de ícones ou imagem embutida. A simplificação para contornos e pequenos preenchimentos mantém os símbolos reconhecíveis em tamanhos menores.

### Fundo

A página tem navy profundo, luz azul suave nas bordas e estrelas pequenas de densidade controlada. O degradê é usado somente nessa atmosfera. Botões, molduras, campos e cards mantêm interior sólido escuro ou transparente sobre uma superfície sólida. As estrelas não devem competir com texto ou controles.

### Estrutura e ornamento

**Estrutura:** área clicável, contorno principal, separação de conteúdo, valor de status, segmento de progresso, nome do item e seleção. Esses elementos permanecem em todos os tamanhos de tela.

**Ornamento:** segunda linha fina, ponta lateral, acento central, canto solto, estrela e geometria de cerimônia. Em telas pequenas, a quantidade dessas peças é reduzida. O conteúdo, o alvo de toque e os cantos principais conservam seu tamanho; não se reduz toda a moldura para caber.

## Componentes da vitrine

- Quatro silhuetas de botão em tamanhos pequeno, médio e grande, com normal, hover, foco, pressionado e desabilitado.
- Moldura retangular, banner em arco, card de item, card de missão e ficha de personagem.
- Inventário com slots selecionáveis, medalhão de avatar e medalhão de ícone.
- Roleta geométrica interativa e dado rolável com resultado textual.
- HP, XP e mana com losangos e demonstração de atualização de progresso.
- Slider único e faixa com valores visíveis e marcadores em losango.
- Input, select, checkbox, switch e radio.
- Abas, menu, breadcrumb e divisórias ornamentais.
- Modal, tooltip, toast e badge.
- Fundamentos: paleta, tipografia e catálogo de ícones próprios.
- Comparação: imagem integral ao lado de exemplares correspondentes, sem incorporar a referência nos componentes.

## Interação e acessibilidade

Os controles usam HTML semântico e foco visível. Estados são identificáveis por texto ou forma, além de cor. A roleta e o dado são operáveis por botão nativo; as abas permitem navegação por teclado. O modal mantém foco dentro do diálogo, fecha com Escape e devolve o foco ao acionador. O tooltip tem alternativa por foco e fechamento por Escape.

`prefers-reduced-motion` elimina giro da roleta e transições de progresso; qualquer movimento de estrelas também é desativado. Os resultados continuam visíveis e são anunciados. No celular, detalhes secundários são retirados da moldura para preservar espaço de leitura.

## Decisões de simplificação

1. Pontas, curvas e cantos são redesenhados, não traçados do PNG. O vocabulário da referência é preservado sem reproduzir seus vetores.
2. Ornamentos finos foram agrupados em poucos motivos por borda para que não colidam com conteúdo responsivo.
3. Descrições e rótulos usam Source Sans 3. A referência não oferece um exemplo de texto longo; aplicar a serifa dos botões em todo o app prejudicaria a leitura.
4. O resultado da roleta fica em uma área textual estável, fora do desenho em movimento.
5. O corpo dos cards não recebe estrelas, luz ou textura; a atmosfera fica na página.
6. Hover, foco, ativo e desabilitado são extensões funcionais: o pack mostra apenas estados estáticos. O foco tem marca independente do ornamento.

## Ambiguidades da imagem

- A família tipográfica original não é identificável no PNG. Cinzel e Source Sans 3 são equivalências propostas, não identificação da fonte do pack.
- Espessuras e hex exatos dos vetores originais não estão disponíveis. Os valores documentados são medidas e amostras do raster.
- Os círculos mágicos e símbolos não têm significado mecânico descrito na prancha. O preview usa a geometria como moldura de sorteio, sem atribuir regras de jogo a cada glifo.
- O pack não especifica comportamento interativo, tamanhos móveis ou estados desabilitados. Esses estados foram construídos para legibilidade e acessibilidade e são tratados como extensões, não detalhes observados na imagem.
- Dado, formulário, tooltip e toast não aparecem na prancha. Eles derivam do mesmo vocabulário de linhas e molduras; não há um modelo literal a reproduzir.
- HP, XP e mana não têm cores semânticas definidas na referência. A vitrine conserva o ouro único e diferencia os recursos por nome, número e comprimento.

## Ajustar

Todas as cores, fontes, espessuras de traço e durações ficam em `tokens.css`. O README registra a intenção visual; o [relatório de auditoria](AUDITORIA.md) registra a comparação final por componente e o que foi validado em navegador.
