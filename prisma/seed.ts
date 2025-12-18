import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      status: 'setup',
      round: 'not_started',
      phase: 'waiting',
    },
  });

  console.log('✅ Quiz created:', quiz.id);

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'Team Alpha', quizId: quiz.id, sequence: 0 } }),
    prisma.team.create({ data: { name: 'Team Beta', quizId: quiz.id, sequence: 1 } }),
    prisma.team.create({ data: { name: 'Team Gamma', quizId: quiz.id, sequence: 2 } }),
    prisma.team.create({ data: { name: 'Team Delta', quizId: quiz.id, sequence: 3 } }),
  ]);

  console.log('✅ Teams created:', teams.length);

  // Domain 1: Linux & System Administration
  const linuxDomain = await prisma.domain.create({
    data: {
      name: 'Linux & System Administration',
      quizId: quiz.id,
      questions: {
        create: [
          {
            number: 1,
            text: 'What command is used to change file permissions in Linux?',
            answer: 'chmod',
            options: ['chmod', 'chown', 'chgrp', 'chattr'],
          },
          {
            number: 2,
            text: 'Which directory contains system configuration files in Linux?',
            answer: '/etc',
            options: ['/etc', '/var', '/usr', '/opt'],
          },
          {
            number: 3,
            text: 'What is the default shell in most Linux distributions?',
            answer: 'bash',
            options: ['bash', 'zsh', 'sh', 'fish'],
          },
          {
            number: 4,
            text: 'Which command displays running processes in real-time?',
            answer: 'top',
            options: ['top', 'ps', 'htop', 'pstree'],
          },
          {
            number: 5,
            text: 'What is the purpose of the cron daemon?',
            answer: 'Schedule recurring tasks',
            options: ['Schedule recurring tasks', 'Manage system logs', 'Handle network requests', 'Monitor disk usage'],
          },
        ],
      },
    },
  });

  // Domain 2: Cloud & Infrastructure
  const cloudDomain = await prisma.domain.create({
    data: {
      name: 'Cloud & Infrastructure',
      quizId: quiz.id,
      questions: {
        create: [
          {
            number: 1,
            text: 'Which AWS service provides object storage?',
            answer: 'S3',
            options: ['S3', 'EBS', 'EFS', 'Glacier'],
          },
          {
            number: 2,
            text: 'What does EC2 stand for in AWS?',
            answer: 'Elastic Compute Cloud',
            options: ['Elastic Compute Cloud', 'Elastic Container Cloud', 'Enterprise Compute Cloud', 'Extended Compute Cloud'],
          },
          {
            number: 3,
            text: 'Which service is used for container orchestration in Kubernetes?',
            answer: 'Control Plane',
            options: ['Control Plane', 'Worker Node', 'Kubelet', 'etcd'],
          },
          {
            number: 4,
            text: 'What is the default port for HTTPS?',
            answer: '443',
            options: ['443', '80', '8080', '22'],
          },
          {
            number: 5,
            text: 'Which cloud provider offers Azure DevOps?',
            answer: 'Microsoft',
            options: ['Microsoft', 'Amazon', 'Google', 'IBM'],
          },
        ],
      },
    },
  });

  // Domain 3: Security & Compliance
  const securityDomain = await prisma.domain.create({
    data: {
      name: 'Security & Compliance',
      quizId: quiz.id,
      questions: {
        create: [
          {
            number: 1,
            text: 'What does SSL stand for?',
            answer: 'Secure Sockets Layer',
            options: ['Secure Sockets Layer', 'System Security Layer', 'Secure System Link', 'Standard Security Layer'],
          },
          {
            number: 2,
            text: 'Which port is commonly used for SSH?',
            answer: '22',
            options: ['22', '23', '21', '25'],
          },
          {
            number: 3,
            text: 'What is the purpose of a firewall?',
            answer: 'Control network traffic',
            options: ['Control network traffic', 'Encrypt data', 'Scan for viruses', 'Backup files'],
          },
          {
            number: 4,
            text: 'Which tool is used for vulnerability scanning?',
            answer: 'Nessus',
            options: ['Nessus', 'Jenkins', 'Docker', 'Ansible'],
          },
          {
            number: 5,
            text: 'What does IAM stand for in cloud security?',
            answer: 'Identity and Access Management',
            options: ['Identity and Access Management', 'Internet Access Manager', 'Internal Authentication Module', 'Integrated Access Method'],
          },
        ],
      },
    },
  });

  // Domain 4: CI/CD & DevOps Tools
  const cicdDomain = await prisma.domain.create({
    data: {
      name: 'CI/CD & DevOps Tools',
      quizId: quiz.id,
      questions: {
        create: [
          {
            number: 1,
            text: 'Which tool is primarily used for continuous integration?',
            answer: 'Jenkins',
            options: ['Jenkins', 'Docker', 'Kubernetes', 'Terraform'],
          },
          {
            number: 2,
            text: 'What does Git use to track changes?',
            answer: 'Commits',
            options: ['Commits', 'Branches', 'Tags', 'Merges'],
          },
          {
            number: 3,
            text: 'Which file format is commonly used for Docker configuration?',
            answer: 'Dockerfile',
            options: ['Dockerfile', 'docker.json', 'docker.xml', 'docker.cfg'],
          },
          {
            number: 4,
            text: 'What is the purpose of Terraform?',
            answer: 'Infrastructure as Code',
            options: ['Infrastructure as Code', 'Container orchestration', 'Continuous integration', 'Log management'],
          },
          {
            number: 5,
            text: 'Which command is used to build a Docker image?',
            answer: 'docker build',
            options: ['docker build', 'docker create', 'docker make', 'docker compile'],
          },
        ],
      },
    },
  });

  // Domain 5: General Knowledge & IQ
  const gkDomain = await prisma.domain.create({
    data: {
      name: 'General Knowledge & IQ',
      quizId: quiz.id,
      questions: {
        create: [
          {
            number: 1,
            text: 'Who is known as the father of modern computing?',
            answer: 'Alan Turing',
            options: ['Alan Turing', 'Charles Babbage', 'John von Neumann', 'Dennis Ritchie'],
          },
          {
            number: 2,
            text: 'In what year was the first version of Linux released?',
            answer: '1991',
            options: ['1991', '1985', '1995', '2000'],
          },
          {
            number: 3,
            text: 'What does API stand for?',
            answer: 'Application Programming Interface',
            options: ['Application Programming Interface', 'Advanced Programming Interface', 'Automated Program Integration', 'Application Process Integration'],
          },
          {
            number: 4,
            text: 'Which company developed Kubernetes?',
            answer: 'Google',
            options: ['Google', 'Amazon', 'Microsoft', 'Docker'],
          },
          {
            number: 5,
            text: 'What is the binary representation of decimal 8?',
            answer: '1000',
            options: ['1000', '1001', '0100', '1100'],
          },
        ],
      },
    },
  });

  console.log('✅ Domains created: 5');

  // Buzzer Round Questions
  const buzzerQuestions = await Promise.all([
    prisma.buzzerQuestion.create({
      data: {
        number: 1,
        text: 'What does DNS stand for?',
        answer: 'Domain Name System',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 2,
        text: 'Which protocol is used for secure file transfer?',
        answer: 'SFTP',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 3,
        text: 'What is the default port for MySQL?',
        answer: '3306',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 4,
        text: 'Which command is used to display network interfaces in Linux?',
        answer: 'ifconfig',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 5,
        text: 'What does YAML stand for?',
        answer: 'YAML Ain\'t Markup Language',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 6,
        text: 'Which AWS service is used for serverless computing?',
        answer: 'Lambda',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 7,
        text: 'What is the name of Docker\'s container registry?',
        answer: 'Docker Hub',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 8,
        text: 'Which tool is used for configuration management by Red Hat?',
        answer: 'Ansible',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 9,
        text: 'What does VPC stand for in AWS?',
        answer: 'Virtual Private Cloud',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 10,
        text: 'Which command shows disk usage in Linux?',
        answer: 'df',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 11,
        text: 'What is the default branch name in Git?',
        answer: 'main',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 12,
        text: 'Which protocol does Kubernetes use for communication?',
        answer: 'HTTP/HTTPS',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 13,
        text: 'What is the file extension for Terraform configuration files?',
        answer: '.tf',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 14,
        text: 'Which command is used to list all Docker containers?',
        answer: 'docker ps',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 15,
        text: 'What does CI/CD stand for?',
        answer: 'Continuous Integration/Continuous Deployment',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 16,
        text: 'Which cloud provider offers GCP?',
        answer: 'Google',
        options: [],
        quizId: quiz.id,
      },
    }),
    prisma.buzzerQuestion.create({
      data: {
        number: 17,
        text: 'What is the purpose of a load balancer?',
        answer: 'Distribute traffic across servers',
        options: [],
        quizId: quiz.id,
      },
    }),
  ]);

  console.log('✅ Buzzer questions created:', buzzerQuestions.length);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📋 Quiz ID: ${quiz.id}`);
  console.log(`👥 Teams: ${teams.length}`);
  console.log(`📚 Domains: 5`);
  console.log(`❓ Domain Questions: 25 (5 per domain)`);
  console.log(`⚡ Buzzer Questions: ${buzzerQuestions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
