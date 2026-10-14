import type { Lesson } from "../../shared/lesson";

export const SAMPLE_QUESTION = "Como o useState faz a tela atualizar?";

/**
 * Aula de exemplo (funciona sem chave de API) e também o modelo de formato
 * que o servidor mostra para a Claude como exemplo.
 */
export const sampleLesson: Lesson = {
  title: "Como o useState faz a tela mudar",
  scenes: [
    {
      kind: "title",
      heading: "Como o useState faz a tela mudar",
      subtitle: "React por dentro, em poucos minutos",
      narration:
        "Você clica em um botão, o número na tela muda, e parece mágica. Nos próximos minutos vamos abrir essa caixa preta e ver exatamente o que o React faz quando você chama a função de atualização de um useState.",
    },
    {
      kind: "bullets",
      heading: "O que vamos ver",
      items: [
        "Por que uma variável comum não atualiza a tela",
        "O que é um render",
        "Como o useState guarda valores",
        "O ciclo: evento, estado, render, tela",
        "As armadilhas mais comuns",
      ],
      narration:
        "Primeiro, por que uma variável comum não funciona. Depois, o que é de fato um render. Em seguida, como o useState guarda valores entre um render e outro, o ciclo completo de uma atualização, e por fim as armadilhas que pegam todo mundo.",
    },
    {
      kind: "code",
      heading: "Uma variável comum não basta",
      filename: "Counter.jsx",
      code: `function Counter() {
  let count = 0;

  function handleClick() {
    count = count + 1;
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
      steps: [
        { lines: [2], caption: "Variável local: nasce do zero a cada render" },
        { lines: [4, 5, 6, 7], caption: "O clique muda a variável e o console mostra 1, 2, 3" },
        { lines: [9], caption: "Mas a tela continua mostrando 0" },
      ],
      narration:
        "Veja este contador. A variável count começa em zero. No clique, somamos um, e o console até mostra os números subindo. Mas olhe o botão: continua mostrando zero. A variável mudou, e a tela nem ficou sabendo.",
    },
    {
      kind: "callout",
      heading: "Dois problemas de uma vez",
      tone: "warning",
      text: "O React não é avisado de que algo mudou. E, se a função rodasse de novo, o count voltaria a ser zero.",
      narration:
        "São dois problemas. Primeiro, o React não recebe nenhum aviso de que algo mudou, então não tem motivo para redesenhar. Segundo, mesmo que redesenhasse, a função rodaria do início e a variável nasceria zerada outra vez.",
    },
    {
      kind: "diagram",
      heading: "O que é um render?",
      layout: "row",
      nodes: [
        { id: "a", label: "Props e estado", note: "os dados de agora" },
        { id: "b", label: "Sua função", note: "o componente roda" },
        { id: "c", label: "JSX retornado", note: "a descrição da tela" },
        { id: "d", label: "React atualiza o DOM", note: "só o que mudou" },
      ],
      edges: [
        { from: "a", to: "b", label: "entram" },
        { from: "b", to: "c", label: "devolve" },
        { from: "c", to: "d", label: "compara" },
      ],
      narration:
        "Render não é desenhar pixels. É o React chamar a sua função de componente com as props e o estado atuais. A função devolve um JSX, que é uma descrição da tela. O React compara essa descrição com a anterior e atualiza só o que mudou.",
    },
    {
      kind: "tree",
      heading: "Quem renderiza de novo?",
      nodes: [
        { id: "app", label: "App", parent: "", badge: "" },
        { id: "header", label: "Header", parent: "app", badge: "" },
        { id: "counter", label: "Counter", parent: "app", badge: "count = 1" },
        { id: "button", label: "Button", parent: "counter", badge: "" },
        { id: "display", label: "Display", parent: "counter", badge: "" },
      ],
      steps: [
        { highlight: ["counter"], caption: "O estado mudou aqui, no Counter" },
        { highlight: ["counter", "button", "display"], caption: "Counter e seus filhos rodam de novo" },
      ],
      narration:
        "O estado pertence a um componente. Quando ele muda no Counter, o React chama a função do Counter outra vez, e também a dos filhos dele. O Header e o App ficam de fora, porque nada mudou lá em cima.",
    },
    {
      kind: "code",
      heading: "useState guarda o valor fora da função",
      filename: "Counter.jsx",
      code: `import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
      steps: [
        { lines: [4], caption: "Devolve o valor atual e a função para mudá-lo" },
        { lines: [7], caption: "setCount não muda a variável: pede um novo render" },
        { lines: [10], caption: "No novo render, count já vem atualizado" },
      ],
      narration:
        "Agora com useState. A chamada devolve duas coisas: o valor atual e uma função para alterá-lo. O valor fica guardado pelo React, fora da sua função. Ao chamar setCount, você não muda a variável: pede um novo render, e nele o count já vem com o valor novo.",
    },
    {
      kind: "diagram",
      heading: "O ciclo de uma atualização",
      layout: "cycle",
      nodes: [
        { id: "ev", label: "Evento", note: "um clique" },
        { id: "set", label: "setCount(novo valor)", note: "" },
        { id: "sch", label: "React agenda um render", note: "" },
        { id: "run", label: "Função roda de novo", note: "com o estado novo" },
        { id: "ui", label: "Tela atualizada", note: "" },
      ],
      edges: [
        { from: "ev", to: "set", label: "" },
        { from: "set", to: "sch", label: "" },
        { from: "sch", to: "run", label: "" },
        { from: "run", to: "ui", label: "" },
        { from: "ui", to: "ev", label: "" },
      ],
      narration:
        "Juntando tudo, é um ciclo. Um evento acontece, você chama o set, o React agenda um render, a sua função roda de novo já com o estado atualizado, a tela muda, e ela fica pronta para o próximo evento.",
    },
    {
      kind: "compare",
      heading: "O estado é uma foto do render",
      left: {
        title: "O que parece",
        points: ["setCount muda o count na hora", "A linha seguinte já enxerga o valor novo"],
        code: "setCount(count + 1);\nconsole.log(count); // esperava 1",
      },
      right: {
        title: "O que acontece",
        points: ["count é uma foto deste render", "O valor novo só existe no próximo render"],
        code: "setCount(count + 1);\nconsole.log(count); // ainda 0",
      },
      narration:
        "Aqui está a pegadinha número um. Parece que o set muda o valor na hora, mas não muda. Dentro de um render, o count é uma foto, e ela nunca se altera. O valor novo só aparece no próximo render.",
    },
    {
      kind: "compare",
      heading: "Três cliques em uma chamada",
      left: {
        title: "Usando a foto",
        points: ["As três linhas leem o mesmo count", "Resultado: soma só 1"],
        code: "setCount(count + 1);\nsetCount(count + 1);\nsetCount(count + 1);",
      },
      right: {
        title: "Função atualizadora",
        points: ["Cada chamada recebe o valor mais recente", "Resultado: soma 3"],
        code: "setCount((c) => c + 1);\nsetCount((c) => c + 1);\nsetCount((c) => c + 1);",
      },
      narration:
        "Por causa dessa foto, chamar set três vezes com count mais um soma apenas um, porque as três linhas leem o mesmo valor. Passando uma função, cada chamada recebe o resultado da anterior, e aí a soma é três.",
    },
    {
      kind: "callout",
      heading: "Regra prática",
      tone: "tip",
      text: "Se o novo valor depende do anterior, use a forma com função: setCount((c) => c + 1).",
      narration:
        "Guarde esta regra. Sempre que o novo valor depender do valor anterior, passe uma função para o set. É um hábito simples que evita uma família inteira de bugs.",
    },
    {
      kind: "code",
      heading: "Nunca mude o estado diretamente",
      filename: "Profile.jsx",
      code: `const [user, setUser] = useState({ name: "Ana", age: 30 });

// errado: muda o objeto que já existe
user.age = 31;
setUser(user);

// certo: cria um objeto novo
setUser({ ...user, age: 31 });`,
      steps: [
        { lines: [3, 4, 5], caption: "Mesmo objeto, mesma referência: o React não percebe" },
        { lines: [7, 8], caption: "Objeto novo, referência nova: o React renderiza" },
      ],
      narration:
        "A pegadinha número dois são objetos e listas. Se você altera o objeto que já existe e passa o mesmo objeto, o React compara a referência, vê que é a mesma, e conclui que nada mudou. Crie sempre uma cópia nova, com o espalhamento.",
    },
    {
      kind: "bullets",
      heading: "Armadilhas comuns",
      items: [
        "Mutar objetos e listas diretamente",
        "Ler o valor novo logo depois do set",
        "Guardar em estado o que dá para calcular",
        "Chamar o set durante o render",
      ],
      narration:
        "Resumindo as armadilhas: mutar objetos e listas, esperar o valor novo logo depois do set, guardar em estado algo que poderia ser calculado, e chamar o set durante o render, que cria um loop infinito.",
    },
    {
      kind: "callout",
      heading: "A ideia central",
      tone: "insight",
      text: "Estado é a memória do componente entre um render e o seguinte.",
      narration:
        "Se for para ficar com uma frase só, é esta: estado é a memória do componente entre um render e outro. Tudo o que não precisa ser lembrado pode ser uma variável comum ou um valor calculado.",
    },
    {
      kind: "summary",
      heading: "Para levar",
      takeaways: [
        "Variável comum não sobrevive entre renders",
        "O set pede um render, não muda o valor na hora",
        "Cada render enxerga uma foto do estado",
        "Estado novo é um valor novo, nunca uma mutação",
        "Depende do anterior? Use a função atualizadora",
      ],
      narration:
        "Para fechar: variáveis comuns não sobrevivem entre renders. O set pede um render, não muda nada na hora. Cada render enxerga uma foto do estado. Estado novo é sempre um valor novo. E, quando depende do anterior, use a função atualizadora.",
    },
  ],
};
