import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 为每个单词生成例句
async function generateExampleSentences() {
  console.log("🚀 Starting example sentence generation...");

  // 获取所有词汇
  const vocabularies = await prisma.vocabulary.findMany({
    include: {
      exampleSentences: true,
    },
  });

  console.log(`📚 Found ${vocabularies.length} vocabularies`);

  for (const vocab of vocabularies) {
    // 跳过已经有例句的词汇
    if (vocab.exampleSentences.length >= 2) {
      console.log(`✅ Skipping "${vocab.word}" - already has ${vocab.exampleSentences.length} sentences`);
      continue;
    }

    console.log(`\n📝 Generating sentences for: ${vocab.word}`);

    try {
      // 生成2个例句
      const sentences = generateSentencesForWord(vocab.word);

      for (const sentence of sentences) {
        await prisma.exampleSentence.create({
          data: {
            vocabularyId: vocab.id,
            sentence: sentence,
          },
        });
        console.log(`   ✓ Created: ${sentence}`);
      }
    } catch (error) {
      console.error(`   ❌ Error for "${vocab.word}":`, error);
    }
  }

  console.log("\n✅ Example sentence generation complete!");
}

// 为一年级小孩生成非常简单的例句
function generateSentencesForWord(word: string): string[] {
  // 超级简单的句型，适合一年级非母语小孩
  const templates = [
    `I see a ${word}.`,
    `This is a ${word}.`,
    `I have a ${word}.`,
    `I like ${word}.`,
    `Look! A ${word}.`,
    `My ${word} is red.`,
    `Big ${word}.`,
    `Small ${word}.`,
    `One ${word}.`,
    `Two ${word}s.`,
  ];

  // 针对特殊词汇的优化
  const specialSentences: Record<string, string[]> = {
    // 形容词
    happy: ["I am happy.", "She is happy."],
    sad: ["I am sad.", "He is sad."],
    big: ["It is big.", "The ball is big."],
    small: ["It is small.", "The cat is small."],
    red: ["It is red.", "I like red."],
    blue: ["It is blue.", "I like blue."],
    green: ["It is green.", "The tree is green."],
    // 动词
    run: ["I run fast.", "She can run."],
    jump: ["I can jump.", "Jump high!"],
    sing: ["I can sing.", "She can sing."],
    play: ["I play games.", "Let's play!"],
    eat: ["I eat apples.", "Time to eat."],
    drink: ["I drink water.", "Drink milk."],
    // 代词和特殊词
    I: ["I am here.", "I like you."],
    you: ["You are nice.", "I see you."],
    he: ["He is tall.", "He runs fast."],
    she: ["She is kind.", "She can sing."],
  };

  // 如果有特殊定义，使用特殊例句
  if (specialSentences[word.toLowerCase()]) {
    return specialSentences[word.toLowerCase()]!;
  }

  // 否则使用通用模板，选择最简单的两个
  return [
    `I see a ${word}.`,
    `I like ${word}.`,
  ];
}

// 运行脚本
generateExampleSentences()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
