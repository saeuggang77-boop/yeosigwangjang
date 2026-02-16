import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 게시판 시드
  const boards = [
    {
      name: "자유수다",
      slug: "free-chat",
      description: "자유롭게 수다 떨어요",
      minGrade: "REGULAR" as const,
      isPublic: false,
      sortOrder: 1,
    },
    {
      name: "질문있어요",
      slug: "questions",
      description: "궁금한 것들 물어보세요",
      minGrade: "REGULAR" as const,
      isPublic: false,
      sortOrder: 2,
    },
    {
      name: "공지사항",
      slug: "announcements",
      description: "여시광장 공지사항",
      minGrade: "ASSOCIATE" as const,
      isPublic: true,
      sortOrder: 0,
    },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: {
        name: board.name,
        description: board.description,
        minGrade: board.minGrade,
        isPublic: board.isPublic,
        sortOrder: board.sortOrder,
      },
      create: board,
    });
    console.log(`Board "${board.name}" (${board.slug}) upserted.`);
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
