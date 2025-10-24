import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 为一年级小孩生成非常简单的例句
function generateSimpleSentencesForWord(word: string): string[] {
  // 针对特殊词汇的优化
  const specialSentences: Record<string, string[]> = {
    // 形容词
    happy: ["I am happy.", "She is happy."],
    sad: ["I am sad.", "He is sad."],
    excited: ["I am excited.", "We are excited!"],
    tired: ["I am tired.", "He is tired."],
    big: ["It is big.", "The ball is big."],
    small: ["It is small.", "The cat is small."],
    loud: ["It is loud.", "The dog is loud."],
    quiet: ["It is quiet.", "Be quiet!"],
    // 颜色
    red: ["It is red.", "I like red."],
    blue: ["It is blue.", "I like blue."],
    green: ["It is green.", "The tree is green."],
    yellow: ["It is yellow.", "The sun is yellow."],
    orange: ["It is orange.", "I see orange."],
    pink: ["It is pink.", "I like pink."],
    white: ["It is white.", "The snow is white."],
    black: ["It is black.", "The cat is black."],
    // 动词
    run: ["I run fast.", "She can run."],
    jump: ["I can jump.", "Jump high!"],
    sing: ["I can sing.", "She can sing."],
    play: ["I play games.", "Let's play!"],
    eat: ["I eat apples.", "Time to eat."],
    drink: ["I drink water.", "Drink milk."],
    write: ["I can write.", "Write your name."],
    read: ["I can read.", "Read a book."],
    feel: ["I feel good.", "How do you feel?"],
    // 动作/活动
    homework: ["I do homework.", "Finish your homework."],
    practice: ["I practice daily.", "Practice makes perfect."],
    search: ["I can search.", "Search for it."],
    answer: ["I know the answer.", "The answer is yes."],
    question: ["Ask a question.", "I have a question."],
  };

  // 如果有特殊定义，使用特殊例句
  if (specialSentences[word.toLowerCase()]) {
    return specialSentences[word.toLowerCase()]!;
  }

  // 否则使用通用模板，增加多样性
  const templates = [
    `This is a ${word}.`,
    `I have a ${word}.`,
    `Look at the ${word}!`,
    `The ${word} is here.`,
    `Where is the ${word}?`,
    `I want a ${word}.`,
    `I need a ${word}.`,
    `Get the ${word}.`,
  ];

  // 随机选择两个不同的模板
  const shuffled = templates.sort(() => Math.random() - 0.5);
  return [shuffled[0]!, shuffled[1]!];
}

async function regenerateSimpleSentences() {
  console.log("🚀 Regenerating simple sentences for grade 1 kids...");

  // 1. 删除所有现有例句
  console.log("\n🗑️  Deleting old sentences...");
  const deleteResult = await prisma.exampleSentence.deleteMany({});
  console.log(`   Deleted ${deleteResult.count} sentences`);

  // 2. 获取所有词汇
  const vocabularies = await prisma.vocabulary.findMany();
  console.log(`\n📚 Found ${vocabularies.length} vocabularies`);

  // 3. 为每个词汇生成新的简单例句
  for (const vocab of vocabularies) {
    const sentences = generateSimpleSentencesForWord(vocab.word);

    for (const sentence of sentences) {
      await prisma.exampleSentence.create({
        data: {
          vocabularyId: vocab.id,
          sentence: sentence,
        },
      });
    }

    console.log(`✓ ${vocab.word}: ${sentences.join(" | ")}`);
  }

  console.log("\n✅ Simple sentence generation complete!");
}

// 运行脚本
regenerateSimpleSentences()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
