# Avaliação visual e estrutural — Slime Sage

**Data:** 23/10/2026  
**Escopo:** documentação Markdown do projeto, referência visual, configuração global de estilos e componentes React da PWA.  
**Método:** inspeção estática do código e dos documentos; não foi feita uma avaliação em navegador. Este relatório não altera a interface. “Aparência de site feito por IA” é tratada como percepção causada por padrões visuais genéricos, não como uma forma confiável de provar autoria.

## Síntese

O Slime Sage tem um conceito próprio: um gestor pessoal apresentado como Sistema de progressão de RPG, com Grande Sábio, atributos, maestria, missões, classes, rituais e evolução. Essa identidade aparece no produto e na estrutura de navegação, não apenas no tema. O maior risco visual é a execução literal e repetida da direção de arte: quase tudo recebe borda dourada, cantoneira, brilho, runas, serifada em caixa alta e/ou microtexto monoespaçado. Quando cada elemento tem a mesma intensidade, a interface perde hierarquia e passa a lembrar um kit temático aplicado em série.

As melhorias de maior retorno são: criar uma hierarquia de ornamentação (ornamento raro e associado a momentos narrativos); mostrar mais dados e conteúdo próprios do usuário; diferenciar superfícies de acordo com sua função; tornar a tipografia de leitura mais confortável; e substituir a referência visual atual por arte original ou licenciada. Isso preserva o RPG, mas faz o mundo parecer construído para o Slime Sage.

## Documentos e direção declarada

- **`README.md`** define o produto como gestor pessoal gamificado e explicita a direção “Dark Fantasy Gilded RPG”: obsidiana, ouro, Cinzel, cantos retos, Elder Futhark, cantoneiras e círculos mágicos. A regra de design transforma esses traços em padrão quase universal para containers, painéis e cards. Esse escopo muito amplo explica por que o código tende a repetir a mesma moldura em funções distintas.
- **`plan.md`**, sobretudo a consolidação inicial e as especificações da Fase 3, fixa valores visuais muito específicos — paleta, fontes, molduras, runas, medalhão, cartões e até transliteração. Há bastante especificação de decoração, mas menos definição de hierarquia, densidade de conteúdo, contraste entre áreas e regras para decidir quando um elemento deve ser ornamentado.
- **`handoff.md`** confirma que a direção foi implementada transversalmente em views, modais, cartões e navegação. O documento é útil para rastrear decisões, mas apresenta conclusão técnica da fase como evidência principal; não registra uma avaliação visual comparativa ou critérios de qualidade visual.
- **`feedback.md`** contém feedback direto sobre padding insuficiente nos Skill Cards, cantos arredondados residuais e desejo por mais inscrições nas bordas. A implementação respondeu adicionando ornamento. Esse histórico mostra um risco de ciclo: cada ajuste local aumenta a densidade decorativa sem um princípio global que preserve áreas de respiro e contraste.
- **`roadmap.md`** acompanha entregas funcionais por fase, mas não apresenta uma linha dedicada a direção de arte, legibilidade ou revisão visual entre telas.
- **`docs/planejamento-fase8-onboarding.md`** usa raça e rank como elementos cosméticos/lore e descreve a revelação cerimonial. Há uma oportunidade narrativa real no onboarding; a diferenciação visual pode vir do resultado e da história do usuário, sem acrescentar moldura a todos os controles.
- **`docs/planejamento-voz-sistema.md`** e as decisões de áudio registradas em `plan.md` e `feedback.md` são ativos de identidade: voz, eventos e rituais dão contexto à apresentação visual. A UI pode reservar efeitos mais fortes para esses eventos, em vez de mantê-los permanentemente ativos.
- **`docs/design.png`** é uma prancha genérica intitulada “Dark Fantasy UI Elements” e contém marca d’água repetida de Adobe Stock e identificador de imagem. Além de enfraquecer a originalidade como referência de marca, isso deixa a direção presa a um inventário de ornamentos genéricos. Recomenda-se substituí-la no projeto por moodboard próprio, com referências licenciadas e/ou estudos originais específicos do Slime Sage.

## Observações específicas por arquivo

| Arquivo | Observação encontrada | Oportunidade |
|---|---|---|
| `apps/pwa/src/index.css` | Fundo usa múltiplos gradientes radiais azulados e dourados; `.gilded-card` e `.gilded-card-interactive` aplicam borda, sombra e glow de forma semelhante. A scrollbar também recebe tratamento temático. | Reduzir efeitos globais e definir superfícies por função: fundo, conteúdo, item interativo e evento especial. Reservar glow para foco, seleção e recompensa. Os cards podem ser diferenciados por composição, faixa lateral, ícone contextual ou progressão, em vez de apenas borda e sombra. |
| `apps/pwa/tailwind.config.js` | O tema define `system` e `fantasy` com valores sobrepostos e cores semânticas como ciano e azul, enquanto componentes usam muitas cores diretamente em classes arbitrárias. | Consolidar tokens semânticos únicos (texto principal/secundário, superfície, borda, progresso, sucesso, atenção, magia) e documentar quando cada tom entra. Evita deriva visual e torna decisões de cor intencionais. |
| `apps/pwa/index.html` | Carrega Cinzel e JetBrains Mono; o fallback global do corpo é system sans em `index.css`, mas componentes usam Cinzel e Mono em muitos títulos, rótulos e dados. O favicon continua como `/vite.svg`. | Definir a fonte por função: serif/display em títulos cerimoniais; sans de alta legibilidade em texto, controles e conteúdo longo; mono apenas para valores realmente técnicos. Trocar o favicon de template por símbolo próprio do Slime Sage. |
| `apps/pwa/src/components/system/SystemPanel.tsx` | Painel padrão já cria fundo escuro, borda, sombra, blur, cantoneiras e entalhes. `cornerAccents` fica habilitado por padrão; títulos recebem fonte fantasia e losango. | Tornar painel básico mais quieto e oferecer variantes explícitas de intensidade. Painel comum deve organizar informação; moldura completa deve indicar seção importante ou estado narrativo. |
| `apps/pwa/src/components/system/GildedCorners.tsx` | O componente acumula moldura interna, cantos, diamantes, entalhes, runas superiores/inferiores e glifos laterais. As runas ficam em tamanhos de 7–8px e são decorativas (`aria-hidden`). | Reduzir os modos simultâneos. Ter uma cantoneira simples para elementos comuns e uma variante cerimonial para ocasiões raras. Se runas comunicam conteúdo, não devem depender de tamanho quase ilegível; se são textura, não precisam simular uma inscrição longa em todo card. |
| `apps/pwa/src/components/views/HomeView.tsx` | A Home inclui o rótulo “[ INTERFACE DE COMANDO // VISÃO GERAL ]”, título “PAINEL DO SISTEMA” e banner com nome transliterado para runas. O perfil tem dados pessoais e XP, mas a linguagem de interface genérica compete com eles. | Fazer da Home um retrato da jornada atual: próxima missão com contexto, sequência/progresso recente, área em foco e mensagem contextual da G.S. Usar nome e classe em português legível como destaque; manter runas como selo complementar e opcional, não como substituto do nome. |
| `apps/pwa/src/components/navigation/TabBar.tsx` | O botão central da G.S é um medalhão circular com polígonos geométricos, enquanto as demais abas são ícones planos. É uma diferença intencional, mas o brilho ativo e rótulos em 10px adicionam competição e densidade na navegação principal. | Manter a G.S como ação principal, simplificando o desenho do medalhão e ampliando área/legibilidade dos rótulos. A hierarquia pode ser dada por posição, forma e estado ativo, usando brilho moderado. |
| `apps/pwa/src/components/views/GsChatView.tsx` | Cabeçalho “GRANDE SÁBIO // COMUNICAÇÃO NEURAL”; mensagens da G.S ganham moldura dourada e as do usuário ciano. A conversa é uma das interações mais frequentes, mas cada mensagem do sistema parece um painel temático. | Tratar o chat como conversa primeiro: bolhas mais simples, distinção de autor por avatar/nome e acento discreto. Reservar cartão com moldura para respostas com proposta/ação. Validar ciano contra o resto da paleta e atribuir-lhe significado consistente, ou substituí-lo por um tom já semântico. |
| `apps/pwa/src/components/chat/ProposalCard.tsx` | O cartão de proposta é rico em conteúdo e tem função própria (aprovação de alterações), mas herda borda dourada, moldura rúnica, microtexto, vários badges coloridos e divisórias. | A proposta merece mais destaque que uma mensagem comum, mas pode usar uma só moldura externa e hierarquia de dados clara: resumo da mudança, impacto, evidência e ações. Simplificar badges e ornamentos melhora escaneabilidade sem apagar o aspecto de “decreto”. |
| `apps/pwa/src/components/views/SkillsView.tsx` | A tela é um inventário relevante de habilidades; o próprio feedback pediu mais espaço interno. O código associa graus a runas e a estética dourada. | Fazer a coleção parecer um grimório/journal de habilidades: diferenciar raridade com um marcador consistente e um detalhe de arte/símbolo por habilidade, mostrar progresso e próxima evolução de forma visualmente prioritária. Evitar repetir a sequência de runas como decoração de cada item. |
| `apps/pwa/src/components/status/AttributesRadarChart.tsx` e `apps/pwa/src/components/views/StatusView.tsx` | O radar e os patamares/ranks já são visualizações próprias do sistema e podem criar uma assinatura gráfica. A documentação de feedback pede círculos celestiais, camadas rúnicas por tier e paleta variável por atributo dominante. | Preservar o radar como visual hero da tela, mas manter grade, anéis e cor dependentes de dados/estado. Dar legenda legível e comparação com evolução anterior. Evitar somar ornamentos independentes à visualização sem melhorar leitura de progresso. |
| `apps/pwa/src/components/projects/ProjectsView.tsx`, `ProjectTreeViewer.tsx`, `MissionCard.tsx` | O modelo de missões em árvore/DAG é uma mecânica distintiva e concreta. A linguagem de cartões e bordas douradas pode fazê-la parecer uma lista comum com skin. | Tornar a árvore de missões o elemento de assinatura: linhas de dependência com estados claros, nós de missão com progresso, bloqueio e recompensa. Reduzir cartões paralelos quando a informação pode ser representada na própria árvore. |
| `apps/pwa/src/components/onboarding/OnboardingFlow.tsx` | O progresso é descrito como “Diretriz”, respostas são opções retangulares e a revelação já usa círculo mágico animado. O onboarding tem começo, meio e culminância, combinando naturalmente com RPG. | Criar transição visual clara entre entrevista e revelação. Manter perguntas e opções simples e confortáveis; concentrar animação, arte e som na revelação da classe/raça, refletindo as respostas em detalhes específicos do resultado. |
| `apps/pwa/src/components/skills/HarvestFestivalBanner.tsx`, `EsotericRouletteModal.tsx` e `FusionAltarModal.tsx` | Festival, roleta e altar são momentos de alto valor temático e já têm lugares adequados para efeitos visuais mais dramáticos. | Fazer desses rituais os picos de brilho, movimento e ornamento do produto. A diferença entre o cotidiano e a celebração cria ritmo visual e torna o fantástico mais crível. |

## O que hoje pode gerar “cara de IA”

Esses fatores são sinais de composição genérica, não evidência sobre quem escreveu o código:

1. **Ornamento uniforme:** a mesma borda, brilho, cantoneira e losango aparece em painéis, mensagens, toasts, botões e propostas. Falta uma escala de importância visual.
2. **Palavras temáticas substituindo conteúdo:** frases como “interface de comando”, “comunicação neural”, “diretriz” e “purificar histórico” aparecem em tarefas comuns. Em excesso, soam como camada de copy aplicada em lote em vez de voz natural do produto.
3. **Microtipografia e caixa alta:** rótulos em 9–11px, tracking largo, Cinzel e uppercase frequentes. Isso cria atmosfera, mas reduz leitura e dá aparência de HUD genérico.
4. **Brilho como acabamento padrão:** múltiplas sombras douradas e gradientes procuram “premium/fantasia” sem discriminar estado, relevância ou recompensa.
5. **Mistura de convenções:** Elder Futhark decorativo, termos em inglês (“Skills”), nomenclatura de fantasia em português e ciano de interface sci-fi coexistem. A mistura pode ser parte da proposta, mas ainda precisa de uma gramática visual e verbal que a explique.
6. **Referência visual de banco de imagens:** `docs/design.png` tem marca d’água e formas prontas de dark fantasy. Reproduzir o repertório diretamente tende a aproximar a UI de templates e enfraquecer autoria visual.
7. **Pouca evidência visual da vida do usuário:** os sistemas de progressão são ricos, mas a identidade pode parecer mais real se o conteúdo de projetos, decisões, conquistas e evolução concreta ocupar mais espaço do que molduras e metadados fictícios.

## Direção recomendada

### 1. Dar função narrativa à decoração

- **Cotidiano:** superfícies limpas, bordas discretas, tipografia simples e foco em tarefas, dados e controles.
- **Progressão:** um único acento visual associado a XP, maestria, rank ou desbloqueio.
- **Ritual:** molduras completas, runas, círculo mágico, brilho e movimento em onboarding/revelação, roleta, fusão e Festival da Colheita.

O contraste entre esses níveis cria ritmo. O usuário passa a reconhecer o momento especial porque os efeitos não estão sempre presentes.

### 2. Substituir a referência genérica por um vocabulário próprio

Criar um moodboard original com três ou quatro elementos recorrentes do universo Slime Sage (por exemplo: selo da G.S, forma de slime/essência, mapa de progressão, glifo de classe). Produzir ícones e grafismos próprios em SVG/CSS quando forem simples; usar arte licenciada para ilustrações. Atualizar `docs/design.png` e registrar origem/licença das referências.

### 3. Usar conteúdo como identidade

Priorizar nome e classe escolhidos, projetos reais, missão recomendada, histórico de evolução e conquistas. A interface se torna menos intercambiável quando sua composição muda com a trajetória do usuário. A Home, a árvore de missões e o resultado do onboarding são os melhores lugares para isso.

### 4. Estabelecer uma regra tipográfica

Cinzel para títulos curtos e cerimônia; sans para instruções, texto de conversa, descrição e controles; mono para XP, timestamps, códigos e telemetria. Elevar textos auxiliares que hoje aparecem abaixo de 12px e reduzir o uso de uppercase. As recomendações do USWDS apontam 16px como base confortável para texto geral e sugerem limitar caixa alta; são referências úteis para validar, não valores obrigatórios para cada controle.

### 5. Diferenciar superfícies e cores pela semântica

Consolidar tokens de cor e escolher o que significam ouro, ciano, azul, verde, roxo e vermelho. Usar contraste de superfície e espaçamento para agrupar conteúdo; não depender de bordas douradas em todos os blocos. Escrever uma regra breve por componente para `quiet`, `interactive`, `selected`, `success` e `ceremonial`.

## Ordem sugerida de trabalho

1. **Corrigir a base de identidade:** trocar favicon de template e substituir/recontextualizar `docs/design.png`.
2. **Desenhar hierarquia visual em papel:** definir escalas de superfície, borda, fonte, tamanho e ornamento para cotidiano/progressão/ritual.
3. **Revisar primeiro Home, navegação, chat e cartões de missão:** são áreas de uso recorrente; a melhora nelas afeta a percepção global.
4. **Concentrar efeitos em onboarding, revelação, roleta, altar e Festival:** tornar os momentos narrativos excepcionais.
5. **Rever acessibilidade visual:** tamanho de texto, contraste, foco, estados selecionados e redução de movimento. Checar interface em telas estreitas e com nomes de usuário longos.
6. **Fazer uma revisão lado a lado no navegador:** comparar telas atuais e propostas em mobile e desktop com tarefas reais e dados de exemplo. Esta avaliação estática não confirma problemas de renderização ou comportamento responsivo.

## Referências consultadas

- Unity, [How to immerse your players through effective UI and game design](https://unity.com/blog/games/how-to-immerse-your-players-through-effective-ui-and-game-design): identidade visual e contexto devem sustentar a UI; clareza e adequação da interface importam para a imersão.
- Unity, [Introduction to UI Toolkit best practices](https://docs.unity.com/en-us/engine/6000.7/manual/best-practice-guides/bpg-uiad-index/bpg-uiad-introduction): UI como extensão da identidade do jogo e ponto de acesso a informações centrais.
- U.S. Web Design System, [Typography](https://designsystem.digital.gov/components/typography/): hierarquia tipográfica, tamanho de texto, alinhamento, largura de linha e parcimônia no uso de caixa alta.
- U.S. Web Design System, [Design tokens](https://designsystem.digital.gov/design-tokens/): escalas discretas e consistentes para cor, espaçamento, tipografia e outros atributos visuais.
- Material Design 3, [Applying type](https://m3.material.io/styles/typography/applying-type): papéis tipográficos ajudam a manter hierarquia entre dispositivos.

**Limitação:** a inspeção foi feita nos arquivos fonte e na imagem local de referência. Não foram avaliados screenshots do app em execução, contraste calculado, acessibilidade automatizada ou percepção de usuários.
