const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const quiz = await prisma.quiz.create({ data: {} });
  console.log('Created quiz:', quiz.id);

  await prisma.team.create({
    data: {
      name: 'Team Alpha',
      quizId: quiz.id,
      players: {
        create: [
          { name: 'Alice', isCaptain: true },
          { name: 'Bob' },
        ],
      },
    },
  });

  await prisma.team.create({
    data: {
      name: 'Team Beta',
      quizId: quiz.id,
      players: {
        create: [
          { name: 'Charlie', isCaptain: true },
          { name: 'Diana' },
        ],
      },
    },
  });

  console.log('Created teams');

  const domains = [
    { name: 'Science', questions: [
      { text: 'What is the chemical symbol for gold?', answer: 'Au', options: ['Au', 'Ag', 'Fe', 'Cu'] },
      { text: 'What planet is known as the Red Planet?', answer: 'Mars', options: ['Mars', 'Venus', 'Jupiter', 'Saturn'] },
      { text: 'What is the speed of light?', answer: '299792458', options: ['299792458', '300000000', '250000000', '350000000'] },
      { text: 'What is H2O?', answer: 'Water', options: ['Water', 'Hydrogen', 'Oxygen', 'Peroxide'] },
    ]},
    { name: 'History', questions: [
      { text: 'Who was the first President of the USA?', answer: 'George Washington', options: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'] },
      { text: 'In which year did World War II end?', answer: '1945', options: ['1945', '1944', '1946', '1943'] },
      { text: 'Who discovered America?', answer: 'Christopher Columbus', options: ['Christopher Columbus', 'Amerigo Vespucci', 'Leif Erikson', 'Ferdinand Magellan'] },
      { text: 'What year did the Berlin Wall fall?', answer: '1989', options: ['1989', '1990', '1988', '1991'] },
    ]},
    { name: 'Geography', questions: [
      { text: 'What is the capital of France?', answer: 'Paris', options: ['Paris', 'London', 'Berlin', 'Madrid'] },
      { text: 'Which is the largest ocean?', answer: 'Pacific', options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] },
      { text: 'What is the longest river in the world?', answer: 'Nile', options: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'] },
      { text: 'How many continents are there?', answer: '7', options: ['7', '6', '5', '8'] },
    ]},
    { name: 'Sports', questions: [
      { text: 'How many players in a football team?', answer: '11', options: ['11', '10', '12', '9'] },
      { text: 'Where were the first modern Olympics held?', answer: 'Athens', options: ['Athens', 'Paris', 'London', 'Rome'] },
      { text: 'What sport is played at Wimbledon?', answer: 'Tennis', options: ['Tennis', 'Cricket', 'Football', 'Golf'] },
      { text: 'How many rings in the Olympic symbol?', answer: '5', options: ['5', '4', '6', '7'] },
    ]},
  ];

  for (const domain of domains) {
    const d = await prisma.domain.create({
      data: { name: domain.name, quizId: quiz.id },
    });

    for (let i = 0; i < domain.questions.length; i++) {
      await prisma.question.create({
        data: {
          number: i + 1,
          text: domain.questions[i].text,
          answer: domain.questions[i].answer,
          options: domain.questions[i].options,
          domainId: d.id,
        },
      });
    }
  }

  console.log('Created domains and questions');

  const buzzerQuestions = [
    { text: 'What is the largest mammal?', answer: 'Blue Whale' },
    { text: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
    { text: 'What is the smallest prime number?', answer: '2' },
    { text: 'What is the capital of Japan?', answer: 'Tokyo' },
  ];

  for (let i = 0; i < buzzerQuestions.length; i++) {
    await prisma.buzzerQuestion.create({
      data: {
        number: i + 1,
        text: buzzerQuestions[i].text,
        answer: buzzerQuestions[i].answer,
        options: [],
        quizId: quiz.id,
      },
    });
  }

  console.log('Created buzzer questions');
  console.log('\n✅ Seed complete!');
  console.log(`Quiz ID: ${quiz.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
