# Auditoria de fidelidade e legibilidade

**Referência:** `docs/design.png`, pack Dark Fantasy UI Elements.  
**Resultado:** aprovado para avaliação do usuário.  
**Método:** inspeção da imagem em resolução original, revisão do código e comparação com capturas do preview em desktop e em larguras móveis de 320 e 390 px. A verificação de acessibilidade cobre contraste das combinações usadas, teclado, foco e movimento reduzido descritos abaixo.

O auditor pediu duas correções visuais durante a revisão: retirar os retângulos escuros que apareciam atrás dos ornamentos centrais e alongar os banners que estavam quase quadrados. As duas foram aplicadas e confirmadas nas capturas finais. Não restou desvio visual sem justificativa de leitura, acesso ou adaptação funcional.

## Comparação por componente

| Componente                    | Correspondência com a referência                                                            | Simplificação deliberada e motivo                                        | Diferença restante                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Placa com pontas              | Contorno duplo, miolo reto, laterais côncavas e pontas losangulares.                        | Microcurvas reduzidas para manter traço claro nos três tamanhos.         | Sem desvio injustificado.                                                                 |
| Pílula                        | Extremidades curvas, duas linhas e detalhes laterais.                                       | Crescentes densos convertidos em linhas para leitura em tamanho pequeno. | Menos massa preenchida, preservando a silhueta.                                           |
| Linha dupla                   | Cápsula estreita, dois contornos e pequenos encontros nas bordas.                           | Laços e recortes mínimos reduzidos.                                      | Menos detalhes para evitar ruído.                                                         |
| Placa recortada               | Silhueta retangular com degraus, linha dupla e pequenas pontas.                             | Recortes secundários simplificados.                                      | Silhueta principal preservada.                                                            |
| Moldura retangular            | Campo navy sólido, linha externa/interna, cantos e centros dourados.                        | Folhagens pequenas substituídas por encontros geométricos compactos.     | Redução para preservar conteúdo e responsividade.                                         |
| Banner em arco                | Formato vertical, laterais longas, topo com finial e base em U com ponta.                   | Títulos quebram em duas linhas quando necessário.                        | Proporção final próxima de 1:1,86, um pouco mais larga que a prancha para acomodar texto. |
| Card de item                  | Moldura, medalhão e botão seguem as famílias da prancha.                                    | Sem estrelas ou efeitos dentro do card.                                  | Campo sólido protege a leitura.                                                           |
| Card de missão                | Mesmos contornos e botão recortado, com recompensa separada da descrição.                   | Estado e recompensa ocupam o espaço útil.                                | Missões não têm um modelo literal na prancha; derivação coerente.                         |
| Ficha de personagem           | Moldura, medalhão, atributos e barra seguem o ouro e navy.                                  | Tipografia operacional limpa e divisões discretas.                       | Adaptação funcional para dados do produto.                                                |
| Slots                         | Quadrados com bordas, cantos e pequenos encontros centrais.                                 | No celular, retiram linha interna e detalhe inferior.                    | Ícone, rótulo e área clicável mantidos.                                                   |
| Medalhões                     | Anéis concêntricos e marcas cardeais.                                                       | Menos anéis e microentalhes.                                             | Simplificação para avatar e ícone pequenos.                                               |
| Roleta                        | Anéis, triângulos sobrepostos e geometria fina dourada.                                     | Números protegidos por superfície sólida, legenda e resultado externos.  | Interrupções sob números preservam leitura.                                               |
| D20/d6                        | Geometria própria de linhas douradas.                                                       | Número central protegido das linhas; sem giro decorativo.                | Não há dado na prancha; a derivação segue sua geometria. D6 tem silhueta própria.         |
| HP, XP e mana                 | Trilhos finos, extremidades pontudas e losangos.                                            | Rótulos e valores fora do preenchimento.                                 | Recursos separados por nome e valor; a referência não define cores semânticas.            |
| Sliders                       | Trilho dourado e marcador em losango.                                                       | Input nativo mantém teclado; foco destaca o marcador ativo.              | Interação ausente na prancha, construída com a mesma linguagem.                           |
| Formulário                    | Superfície navy e contorno dourado.                                                         | Fonte limpa e ornamento reduzido nos campos.                             | Derivação necessária: a prancha não contém formulários.                                   |
| Navegação                     | Losangos, divisórias e centros ornamentais.                                                 | Rótulos em sans para leitura rápida.                                     | Foco e seleção são estados novos necessários.                                             |
| Modal, tooltip, toast e badge | Molduras e bordas seguem as famílias existentes.                                            | Conteúdo afastado dos cantos; tooltip com contorno simples.              | Componentes ausentes na prancha, derivados de forma consistente.                          |
| Divisórias                    | Linha flexível, centro fixo e pequenos terminais.                                           | Menos curvas nas versões compactas.                                      | Identidade preservada sem esticar o desenho central.                                      |
| Ícones                        | Frasco, taça, elmo e coroa reconhecíveis; espada, escudo, grimório e bússola no mesmo peso. | Mais contorno e menos massa preenchida que os símbolos do pack.          | Redução para leitura em tamanhos menores.                                                 |
| Tipografia                    | Cinzel preserva a serifa romana e versaletes dos títulos e botões.                          | Source Sans 3 no corpo, campos e rótulos.                                | Equivalência gratuita; a fonte exata da prancha é desconhecida.                           |
| Atmosfera                     | Navy, azul nas bordas e estrelas pequenas.                                                  | Azul menos intenso nas áreas de trabalho; estrelas sem interação.        | Movimento desativado com preferência de redução.                                          |
| Comparação                    | Referência integral somente na seção própria, ao lado da família escolhida.                 | Alternância entre famílias evita repetir a imagem.                       | Sem recortes ou uso do raster como interface.                                             |

## Correções verificadas

### Revisão das junções após feedback do usuário

A inspeção ampliada revelou problemas não identificados na primeira revisão: os fundos dos SVGs de canto encobriam a borda CSS e seus endpoints não coincidiam com ela; caps e linhas dos botões também usavam alinhamentos diferentes. As bordas atenuadas e os traços de 0,7px agravavam a aparência escura.

A correção substituiu esses fragmentos por contornos SVG fechados, medidos nas dimensões reais do componente. Pontas, cristas, cantos e losango do banner compartilham as coordenadas do perímetro; as divisórias também usam um único desenho. Os traços passaram a 1,25px e 1px em ouro pleno. As capturas ampliadas e a captura normal da página confirmam continuidade nos quatro modelos de botão, três tamanhos, molduras, slots, banner e divisórias, incluindo botão alargado e telas de 320/390px. Todos os 12 rótulos foram conferidos e o retorno do foco ao fechar o modal permaneceu funcional. Somente os estados explicitamente desabilitados mantêm atenuação.

O auditor aprovou esta correção de continuidade e contraste. O build passou e não ocorreram erros JavaScript durante o redimensionamento.

### Demais verificações

- Ornamentos centrais transparentes fora da moldura, sem placas de fundo.
- Banners verticais na vitrine, na comparação e no celular.
- Preenchimento escuro acompanhando a silhueta das pontas dos botões.
- `non-scaling-stroke` para preservar a espessura dos tokens ao redimensionar SVGs.
- D6 com emblema quadrado e D20 com geometria própria.
- Foco individual dos dois losangos de faixa.
- Estados desabilitados com opacidade de 0,6, preservando leitura; ouro atenuado próximo de 4,84:1 e texto próximo de 5,88:1 sobre a superfície.
- Tooltip com ponte de hover, fechamento por Escape e reapresentação no próximo hover/foco.
- Modal com nome acessível, foco interno, Escape e retorno ao acionador.
- Cores e durações centralizadas; nenhuma sombra, glow ou degradê dentro de componentes.

## Verificação funcional

O coordenador executou a compilação de produção e verificações com Chromium/Playwright, usando o navegador já disponível no workspace. Nenhuma dependência de teste foi adicionada ao preview.

| Verificação                                                            | Resultado |
| ---------------------------------------------------------------------- | --------- |
| `npm run build`                                                        | Passou    |
| Referência raster apenas em Comparação                                 | Passou    |
| Giro normal, bloqueio durante sorteio e ponteiro alinhado ao resultado | Passou    |
| Roleta por teclado e resultado imediato com movimento reduzido         | Passou    |
| Dado dentro dos limites do tipo selecionado                            | Passou    |
| Sliders por setas e limites da faixa sem cruzamento                    | Passou    |
| Seleção do inventário atualiza o detalhe                               | Passou    |
| Modal: nome, foco, Escape e retorno do foco                            | Passou    |
| Tooltip: hover, persistência ao mover o cursor e Escape                | Passou    |
| Abas: setas alteram seleção e foco                                     | Passou    |
| Toast: anúncio, exibição e fechamento                                  | Passou    |
| Formulário: entrada e confirmação                                      | Passou    |
| Ganho de XP atualiza valor visual e semântico                          | Passou    |
| Estrelas sem animação com movimento reduzido                           | Passou    |
| Botões e painéis sem degradê                                           | Passou    |
| Sem transbordo horizontal em 320 e 390 px                              | Passou    |
| Sem erros JavaScript durante os fluxos exercitados                     | Passou    |

As combinações principais têm contraste de 12,16:1 a 18,39:1 sobre as superfícies sólidas. As adaptações móveis preservam corpo de leitura e alvos de interação, retirando detalhes secundários.

## Limites da fidelidade

A aprovação registra equivalência visual da linguagem do pack, não cópia dos vetores. A imagem não revela a fonte, os estados de interação ou as medidas exatas do arquivo original. As diferenças registradas na tabela são deliberadas para preservar leitura e operação em uma interface real. Os desenhos SVG são originais; a marca d’água continua visível apenas na referência integral de comparação.
