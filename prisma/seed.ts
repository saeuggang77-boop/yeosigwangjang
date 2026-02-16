import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ==========================================
  // 1. 관리자 (1명)
  // ==========================================
  const admin = await prisma.user.upsert({
    where: { email: "admin@yeosigwangjang.com" },
    update: {},
    create: {
      email: "admin@yeosigwangjang.com",
      nickname: "관리자",
      role: "ADMIN",
      grade: "REGULAR",
      isVerified: true,
    },
  });
  console.log("  Admin:", admin.id);

  // ==========================================
  // 2. 일반회원 (5명)
  // ==========================================
  const userNames = [
    { nickname: "밤하늘별", grade: "REGULAR" as const },
    { nickname: "새벽이슬", grade: "REGULAR" as const },
    { nickname: "달빛소녀", grade: "REGULAR" as const },
    { nickname: "반짝이", grade: "ASSOCIATE" as const },
    { nickname: "꿈나무", grade: "ASSOCIATE" as const },
  ];

  const users = [];
  for (let i = 0; i < userNames.length; i++) {
    const u = await prisma.user.upsert({
      where: { email: `user${i + 1}@test.com` },
      update: {},
      create: {
        email: `user${i + 1}@test.com`,
        nickname: userNames[i].nickname,
        role: "MEMBER",
        grade: userNames[i].grade,
        isVerified: userNames[i].grade === "REGULAR",
      },
    });
    users.push(u);
  }
  console.log(`  Users: ${users.length}명`);

  // ==========================================
  // 3. 업소회원 (3명)
  // ==========================================
  const bizPassword = await bcrypt.hash("biz1234!", 10);

  const bizData = [
    {
      email: "gangnam@biz.com",
      bizName: "강남 클럽 블루",
      region: "서울",
      phone: "010-1111-1111",
      isVerifiedBiz: true,
      hasSeekAccess: true,
      seekAccessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      bumpCredits: 5,
    },
    {
      email: "busan@biz.com",
      bizName: "해운대 라운지 문",
      region: "부산",
      phone: "010-2222-2222",
      isVerifiedBiz: true,
      hasSeekAccess: false,
      bumpCredits: 0,
    },
    {
      email: "hongdae@biz.com",
      bizName: "홍대 바 스카이",
      region: "서울",
      phone: "010-3333-3333",
      isVerifiedBiz: false,
      hasSeekAccess: false,
      bumpCredits: 2,
    },
  ];

  const bizUsers = [];
  for (const b of bizData) {
    const biz = await prisma.bizUser.upsert({
      where: { email: b.email },
      update: {},
      create: { ...b, password: bizPassword },
    });
    bizUsers.push(biz);
  }
  console.log(`  BizUsers: ${bizUsers.length}명`);

  // ==========================================
  // 4. 광고업체 (1명 — 디렉토리용)
  // ==========================================
  const adPassword = await bcrypt.hash("ad1234!", 10);
  const adUser = await prisma.adUser.upsert({
    where: { email: "ad@beauty.com" },
    update: {},
    create: {
      email: "ad@beauty.com",
      password: adPassword,
      bizRegNumber: "123-45-67890",
      representName: "김대표",
      phone: "02-1234-5678",
      bizCategory: "SURGERY_SKIN",
      isApproved: true,
    },
  });
  console.log("  AdUser:", adUser.id);

  // ==========================================
  // 5. 구인글 (20개)
  // ==========================================
  const now = new Date();
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const hireJobs = [
    // ── 긴급 (3개) ──
    {
      tier: "PREMIUM" as const, isUrgent: true, urgentUntil: in7d,
      title: "[급구] 강남 텐프로 여직원 모집", bizName: "강남 클럽 블루",
      region: "서울", subRegion: "강남", bizType: "텐프로",
      salary: "일급 80~120만", workHours: "PM 8:00 ~ AM 3:00",
      description: "강남역 3번 출구 도보 3분. 깔끔하고 안전한 업소입니다.\n\n- 당일 정산\n- 선불 가능\n- 초보 환영, 친절 교육\n- 숙소 제공 (원룸)\n\n면접 후 바로 출근 가능합니다.",
      contact: "sky_gangnam", contactType: "KAKAO" as const,
      benefits: ["숙소 제공", "교통비 지원", "의상 지원"],
      requirements: "경력 무관, 밝은 성격 우대",
      bizIdx: 0,
    },
    {
      tier: "BASIC" as const, isUrgent: true, urgentUntil: in7d,
      title: "[급구] 해운대 라운지 서빙 구합니다", bizName: "해운대 라운지 문",
      region: "부산", subRegion: "해운대", bizType: "라운지",
      salary: "일급 50~70만", workHours: "PM 9:00 ~ AM 4:00",
      description: "해운대 최고급 라운지에서 함께할 직원을 모집합니다.\n\n분위기 좋고 손님 수준 높습니다.\n당일 정산, 교통비 별도 지급.",
      contact: "010-2222-3333", contactType: "PHONE" as const,
      benefits: ["교통비 지원", "식사 제공"],
      requirements: "서빙 경험 우대",
      bizIdx: 1,
    },
    {
      tier: "PREMIUM" as const, isUrgent: true, urgentUntil: in7d,
      title: "[급구] 홍대 바 웨이터/웨이트리스", bizName: "홍대 바 스카이",
      region: "서울", subRegion: "홍대", bizType: "바",
      salary: "시급 15,000원 + 팁", workHours: "PM 7:00 ~ AM 2:00",
      description: "홍대 인기 루프탑바에서 직원 모집합니다.\n젊고 활기찬 분위기, 외국인 손님 많아요.\n영어 가능자 우대.",
      contact: "sky_bar_hd", contactType: "KAKAO" as const,
      benefits: ["식사 제공", "인센티브"],
      requirements: "영어 가능자 우대",
      bizIdx: 2,
    },

    // ── 프리미엄 (4개) ──
    {
      tier: "PREMIUM" as const, isUrgent: false,
      title: "강남 룸싸롱 여직원 대모집", bizName: "강남 클럽 블루",
      region: "서울", subRegion: "강남", bizType: "룸싸롱",
      salary: "TC 협의 (업계 최고 대우)", workHours: "PM 7:30 ~ AM 3:00",
      description: "강남 최대 규모 룸싸롱에서 함께할 분을 찾습니다.\n\n- 1일 보장 TC\n- 경력에 따른 우대\n- 전속 헤어/메이크업 아티스트 상주\n- 안전한 출퇴근 보장\n\n편하게 연락주세요.",
      contact: "club_blue_gn", contactType: "KAKAO" as const,
      benefits: ["숙소 제공", "헤어/메이크업 지원", "교통비 지원", "의상 지원"],
      requirements: "경력 1년 이상 우대",
      bizIdx: 0,
    },
    {
      tier: "PREMIUM" as const, isUrgent: false,
      title: "분당 노래주점 신규 오픈 대모집", bizName: "분당 뮤직홀",
      region: "경기", subRegion: "분당", bizType: "노래주점",
      salary: "일급 60~80만", workHours: "PM 8:00 ~ AM 3:00",
      description: "분당 신규 오픈 노래주점!\n오픈 멤버 특별 대우합니다.\n\n시설 최신, 손님 수준 보장.\n일하기 편한 환경 약속드립니다.",
      contact: "010-5555-6666", contactType: "BOTH" as const,
      benefits: ["숙소 제공", "식사 제공", "인센티브"],
      requirements: "노래 좋아하시는 분",
      bizIdx: 0,
    },
    {
      tier: "PREMIUM" as const, isUrgent: false,
      title: "대구 클럽 MD/홀서빙 모집", bizName: "대구 클럽 나인",
      region: "대구", subRegion: "동성로", bizType: "클럽",
      salary: "일급 40~60만 + 인센티브", workHours: "PM 9:00 ~ AM 5:00",
      description: "대구 최대 규모 클럽에서 MD와 홀서빙 직원을 모집합니다.\n\n인센티브 별도, 능력에 따라 무제한.\n즐겁게 일할 수 있는 환경입니다.",
      contact: "club_nine_dg", contactType: "KAKAO" as const,
      benefits: ["식사 제공", "인센티브", "교통비 지원"],
      requirements: "클럽 경험자 우대",
      bizIdx: 1,
    },
    {
      tier: "PREMIUM" as const, isUrgent: false,
      title: "인천 가라오케 도우미 모집", bizName: "인천 골드 가라오케",
      region: "인천", subRegion: "구월동", bizType: "가라오케",
      salary: "TC 협의", workHours: "PM 7:00 ~ AM 2:00",
      description: "인천 최고급 가라오케에서 모집합니다.\n\n안전하고 깨끗한 환경.\n당일 정산, 선불 가능.\n초보도 편하게 적응할 수 있습니다.",
      contact: "gold_karaoke_ic", contactType: "KAKAO" as const,
      benefits: ["숙소 제공", "의상 지원", "교통비 지원"],
      requirements: "밝은 성격",
      bizIdx: 1,
    },

    // ── 기본 (7개) ──
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "서초 착석바 직원 모집", bizName: "서초 바 미드나잇",
      region: "서울", subRegion: "서초", bizType: "착석바",
      salary: "일급 40~50만", workHours: "PM 8:00 ~ AM 2:00",
      description: "서초 조용한 착석바에서 함께할 분을 찾습니다.\n편안한 분위기, 단골 손님 위주입니다.\n일 끝나면 바로 퇴근 가능.",
      contact: "midnight_sc", contactType: "KAKAO" as const,
      benefits: ["식사 제공", "교통비 지원"],
      requirements: null,
      bizIdx: 0,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "수원 퍼브 서빙 구합니다", bizName: "수원 퍼브 루나",
      region: "경기", subRegion: "수원", bizType: "퍼브",
      salary: "시급 12,000원", workHours: "PM 6:00 ~ AM 1:00",
      description: "수원역 근처 퍼브에서 서빙 직원 모집합니다.\n학생/직장인 부업도 가능합니다.\n주 3일 이상 출근 가능하신 분.",
      contact: "010-7777-8888", contactType: "PHONE" as const,
      benefits: ["식사 제공"],
      requirements: null,
      bizIdx: 2,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "광주 라운지 여직원 모집", bizName: "광주 라운지 별",
      region: "광주", subRegion: "충장로", bizType: "라운지",
      salary: "일급 50~60만", workHours: "PM 8:00 ~ AM 3:00",
      description: "광주 충장로 위치한 라운지에서 모집합니다.\n\n분위기 좋고 손님 매너 좋습니다.\n당일 정산.",
      contact: "star_lounge_gj", contactType: "KAKAO" as const,
      benefits: ["교통비 지원", "숙소 제공"],
      requirements: "경력 우대",
      bizIdx: 1,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "대전 노래주점 파트타임 모집", bizName: "대전 뮤직박스",
      region: "대전", subRegion: "유성", bizType: "노래주점",
      salary: "일급 35~45만", workHours: "PM 9:00 ~ AM 3:00",
      description: "대전 유성구 노래주점에서 파트타임 직원 구합니다.\n주 2~3회 출근 가능하신 분.\n분위기 밝고 재밌어요.",
      contact: "musicbox_dj", contactType: "KAKAO" as const,
      benefits: ["식사 제공"],
      requirements: null,
      bizIdx: 2,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "전주 바 직원 구합니다", bizName: "전주 바 올드문",
      region: "전북", subRegion: "전주", bizType: "바",
      salary: "일급 30~40만", workHours: "PM 7:00 ~ AM 1:00",
      description: "전주 한옥마을 근처 감성 바입니다.\n칵테일 제조 가능하시면 우대합니다.\n소규모 바라 편하게 일할 수 있어요.",
      contact: "oldmoon_jj", contactType: "KAKAO" as const,
      benefits: ["식사 제공"],
      requirements: "바텐딩 가능자 우대",
      bizIdx: 0,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "울산 룸싸롱 직원 모집", bizName: "울산 로얄",
      region: "울산", subRegion: "남구", bizType: "룸싸롱",
      salary: "TC 협의", workHours: "PM 7:00 ~ AM 2:00",
      description: "울산 남구 위치 룸싸롱 직원 모집합니다.\n안정적인 손님 보장.\n편하게 문의주세요.",
      contact: "royal_us", contactType: "KAKAO" as const,
      benefits: ["교통비 지원", "의상 지원"],
      requirements: null,
      bizIdx: 1,
    },
    {
      tier: "BASIC" as const, isUrgent: false,
      title: "창원 클럽 스태프 모집", bizName: "창원 클럽 웨이브",
      region: "경남", subRegion: "창원", bizType: "클럽",
      salary: "일급 35~50만", workHours: "PM 10:00 ~ AM 5:00",
      description: "창원 최대 클럽 웨이브에서 스태프 모집합니다.\nMD, 홀서빙, 바텐더 등.\n경험자 우대.",
      contact: "wave_cw", contactType: "KAKAO" as const,
      benefits: ["식사 제공", "인센티브"],
      requirements: "클럽 경험 6개월 이상 우대",
      bizIdx: 2,
    },

    // ── 라이트 (6개) ──
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "강릉 바 서빙 알바 구합니다", bizName: null,
      region: "강원", subRegion: "강릉", bizType: "바",
      salary: "시급 11,000원", workHours: "PM 7:00 ~ AM 12:00",
      description: "강릉 해변가 바에서 서빙 알바 구합니다. 여름 시즌 한정.",
      contact: "010-9999-0000", contactType: "PHONE" as const,
      benefits: [], requirements: null, bizIdx: 2,
    },
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "제주 펍 직원 모집", bizName: null,
      region: "제주", subRegion: "제주시", bizType: "퍼브",
      salary: "시급 12,000원", workHours: "PM 6:00 ~ AM 12:00",
      description: "제주시 퍼브에서 직원 구합니다. 제주도 거주자 우대.",
      contact: "jeju_pub", contactType: "KAKAO" as const,
      benefits: [], requirements: null, bizIdx: 0,
    },
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "천안 노래방 도우미 구함", bizName: null,
      region: "충남", subRegion: "천안", bizType: "노래주점",
      salary: "일급 25~30만", workHours: "PM 8:00 ~ AM 2:00",
      description: "천안역 근처 노래방 도우미 구합니다.",
      contact: "010-1234-5678", contactType: "PHONE" as const,
      benefits: [], requirements: null, bizIdx: 1,
    },
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "청주 바 알바 급구", bizName: null,
      region: "충북", subRegion: "청주", bizType: "바",
      salary: "시급 10,500원", workHours: "PM 7:00 ~ AM 1:00",
      description: "청주 시내 바에서 알바 구합니다. 주 3일 이상.",
      contact: "cj_bar", contactType: "KAKAO" as const,
      benefits: [], requirements: null, bizIdx: 2,
    },
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "포항 가라오케 직원 모집", bizName: null,
      region: "경북", subRegion: "포항", bizType: "가라오케",
      salary: "일급 30만", workHours: "PM 7:00 ~ AM 2:00",
      description: "포항 가라오케 직원 모집합니다. 초보 가능.",
      contact: "010-3456-7890", contactType: "PHONE" as const,
      benefits: [], requirements: null, bizIdx: 0,
    },
    {
      tier: "LIGHT" as const, isUrgent: false,
      title: "여수 바 서빙 구합니다", bizName: null,
      region: "전남", subRegion: "여수", bizType: "바",
      salary: "시급 11,500원", workHours: "PM 6:00 ~ AM 12:00",
      description: "여수 밤바다 뷰 바에서 서빙 구합니다.",
      contact: "yeosu_bar", contactType: "KAKAO" as const,
      benefits: [], requirements: null, bizIdx: 1,
    },
  ];

  for (const job of hireJobs) {
    await prisma.job.create({
      data: {
        type: "HIRE",
        tier: job.tier,
        title: job.title,
        bizName: job.bizName,
        region: job.region,
        subRegion: job.subRegion || null,
        bizType: job.bizType,
        salary: job.salary,
        workHours: job.workHours,
        requirements: job.requirements || null,
        benefits: job.benefits,
        description: job.description,
        contact: job.contact,
        contactType: job.contactType,
        images: [],
        isUrgent: job.isUrgent,
        urgentUntil: job.urgentUntil || null,
        expiresAt: in30d,
        isActive: true,
        viewCount: Math.floor(Math.random() * 200) + 10,
        bizUserId: bizUsers[job.bizIdx].id,
      },
    });
  }
  console.log(`  구인글: ${hireJobs.length}개`);

  // ==========================================
  // 6. 구직글 (10개)
  // ==========================================
  const seekJobs = [
    { title: "서울/경기 라운지·바 경력 3년", desiredRegions: ["서울", "경기"], desiredBizTypes: ["라운지", "바"], experience: "3년 이상", desiredCondition: "숙소 제공 필수", description: "서울/경기 지역 라운지나 바에서 일하고 싶습니다.\n3년 경력이고 서빙, 칵테일 제조 가능합니다.", contact: "seek_user1" },
    { title: "부산 해운대 텐프로·룸싸롱 구직", desiredRegions: ["부산"], desiredBizTypes: ["텐프로", "룸싸롱"], experience: "1년 이상", desiredCondition: "당일 정산 희망", description: "부산 해운대 지역에서 일하고 싶습니다.\n경력 1년, 성실하게 일하겠습니다.", contact: "seek_user2" },
    { title: "대구 노래주점·가라오케 신입", desiredRegions: ["대구"], desiredBizTypes: ["노래주점", "가라오케"], experience: "신입", desiredCondition: "초보 가능한 곳 희망", description: "대구 지역 노래주점이나 가라오케에서 일해보고 싶습니다.\n신입이지만 열심히 하겠습니다.", contact: "seek_user3" },
    { title: "인천·경기 클럽 MD 경력직", desiredRegions: ["인천", "경기"], desiredBizTypes: ["클럽"], experience: "5년 이상", desiredCondition: "인센티브 위주 희망", description: "클럽 MD 5년 경력입니다.\n인천, 경기 지역 클럽에서 일하고 싶습니다.\n고정 테이블 다수 보유.", contact: "seek_user4" },
    { title: "광주 전남 바·퍼브 구직합니다", desiredRegions: ["광주", "전남"], desiredBizTypes: ["바", "퍼브"], experience: "6개월 미만", desiredCondition: "주 3~4일 가능", description: "광주/전남 지역 바나 퍼브에서 파트타임으로 일하고 싶습니다.", contact: "seek_user5" },
    { title: "전국 어디든 갈 수 있습니다", desiredRegions: ["서울", "부산", "대구", "인천", "광주"], desiredBizTypes: ["텐프로", "룸싸롱", "라운지"], experience: "3년 이상", desiredCondition: "숙소 제공 시 전국 가능", description: "전국 어디든 숙소 제공 시 출근 가능합니다.\n텐프로/룸싸롱/라운지 3년 경력입니다.", contact: "seek_user6" },
    { title: "서울 강남 착석바 구직", desiredRegions: ["서울"], desiredBizTypes: ["착석바", "바"], experience: "1년 이상", desiredCondition: "강남 지역 한정", description: "강남 착석바에서 일한 경력 있습니다.\n단골 손님 관리 잘합니다.", contact: "seek_user7" },
    { title: "제주도 바·퍼브 일하고 싶어요", desiredRegions: ["제주"], desiredBizTypes: ["바", "퍼브"], experience: "신입", desiredCondition: "숙소 필수", description: "제주도에서 일하면서 살고 싶습니다.\n신입이지만 빠르게 배우겠습니다.", contact: "seek_user8" },
    { title: "대전 충남 노래주점 경력직", desiredRegions: ["대전", "충남"], desiredBizTypes: ["노래주점"], experience: "1년 이상", desiredCondition: "일급 35만 이상", description: "대전/천안 지역 노래주점 1년 경력입니다.\n성실히 일하겠습니다.", contact: "seek_user9" },
    { title: "경남 창원 클럽·라운지 구직", desiredRegions: ["경남"], desiredBizTypes: ["클럽", "라운지"], experience: "6개월 미만", desiredCondition: "교통비 지원 희망", description: "창원 지역 클럽이나 라운지에서 일하고 싶습니다.\n짧은 경력이지만 의지가 있습니다.", contact: "seek_user10" },
  ];

  for (let i = 0; i < seekJobs.length; i++) {
    const s = seekJobs[i];
    await prisma.job.create({
      data: {
        type: "SEEK",
        tier: "LIGHT",
        title: s.title,
        region: s.desiredRegions[0],
        bizType: s.desiredBizTypes[0],
        description: s.description,
        contact: s.contact,
        contactType: "KAKAO",
        desiredRegions: s.desiredRegions,
        desiredBizTypes: s.desiredBizTypes,
        experience: s.experience,
        desiredCondition: s.desiredCondition,
        images: [],
        isActive: true,
        viewCount: Math.floor(Math.random() * 50) + 5,
        authorUserId: users[i % users.length].id,
      },
    });
  }
  console.log(`  구직글: ${seekJobs.length}개`);

  // ==========================================
  // 7. 업체 디렉토리 (5개)
  // ==========================================
  const businesses = [
    { name: "리프트 성형외과", slug: "lift-surgery", category: "SURGERY_SKIN" as const, description: "강남역 1번 출구, 눈·코·윤곽 전문 성형외과입니다.\n15년 경력 원장님이 직접 상담·수술합니다.\n\n- 눈 성형 (쌍꺼풀, 눈매교정)\n- 코 성형 (콧대, 코끝)\n- 윤곽 (사각턱, 광대)\n- 실리프팅", phone: "02-555-1234", region: "서울", subRegion: "강남", address: "서울 강남구 강남대로 123", priceTier: "A" as const },
    { name: "글로우 피부과", slug: "glow-skin", category: "SURGERY_SKIN" as const, description: "피부 레이저, 보톡스, 필러 전문 피부과입니다.\n야간진료 가능, 상담 무료.\n\n- 레이저 토닝\n- 보톡스/필러\n- 피부관리 프로그램\n- 여드름/흉터 치료", phone: "02-555-5678", region: "서울", subRegion: "청담", address: "서울 강남구 청담동 456", priceTier: "B" as const },
    { name: "네일아트 쏘쏘", slug: "nail-soso", category: "NAIL_BEAUTY" as const, description: "해운대 네일샵, 젤네일·패디큐어 전문입니다.\n출근 전 시술 가능 (오후 2시 오픈)\n\n- 젤네일\n- 패디큐어\n- 네일아트\n- 속눈썹 연장", phone: "051-777-1234", region: "부산", subRegion: "해운대", address: "부산 해운대구 중동 789", priceTier: "C" as const },
    { name: "헤어살롱 비비드", slug: "hair-vivid", category: "HAIR_MAKEUP" as const, description: "출근 헤어/메이크업 전문 살롱입니다.\n새벽 예약 가능, 업소 제휴 할인.\n\n- 헤어 셋팅\n- 풀메이크업\n- 출근 패키지 (헤어+메이크업)\n- 특수 메이크업", phone: "02-333-4567", region: "서울", subRegion: "강남", address: "서울 강남구 역삼동 321", priceTier: "B" as const },
    { name: "뷰티랩 에스테틱", slug: "beauty-lab", category: "NAIL_BEAUTY" as const, description: "종합 뷰티 케어 전문점입니다.\n피부관리, 왁싱, 체형관리까지.\n\n- 얼굴 관리\n- 바디 관리\n- 브라질리언 왁싱\n- 체형 관리", phone: "02-444-5678", region: "서울", subRegion: "이태원", address: "서울 용산구 이태원동 654", priceTier: "B" as const },
  ];

  for (const biz of businesses) {
    await prisma.business.upsert({
      where: { slug: biz.slug },
      update: {},
      create: {
        name: biz.name,
        slug: biz.slug,
        category: biz.category,
        priceTier: biz.priceTier,
        description: biz.description,
        phone: biz.phone,
        region: biz.region,
        subRegion: biz.subRegion,
        address: biz.address,
        isApproved: true,
        isPremium: biz.priceTier === "A",
        viewCount: Math.floor(Math.random() * 100) + 20,
        ownerId: adUser.id,
      },
    });
  }
  console.log(`  업체 디렉토리: ${businesses.length}개`);

  // ==========================================
  // 8. 게시판 + 글 (10개)
  // ==========================================
  const board1 = await prisma.board.upsert({
    where: { slug: "free-chat" },
    update: {},
    create: { name: "자유수다", slug: "free-chat", description: "자유롭게 수다 떨어요", minGrade: "REGULAR", isPublic: false, sortOrder: 1 },
  });

  const board2 = await prisma.board.upsert({
    where: { slug: "questions" },
    update: {},
    create: { name: "질문있어요", slug: "questions", description: "궁금한 것들 물어보세요", minGrade: "REGULAR", isPublic: false, sortOrder: 2 },
  });

  await prisma.board.upsert({
    where: { slug: "announcements" },
    update: {},
    create: { name: "공지사항", slug: "announcements", description: "여시광장 공지사항", minGrade: "ASSOCIATE", isPublic: true, sortOrder: 0 },
  });

  const freePosts = [
    { title: "오늘 출근했는데 손님 없어서 일찍 끝남", content: "요즘 경기가 안 좋은 건지 월요일인데 손님이 한 테이블도 안 왔어요.\n다들 요즘 어때요?" },
    { title: "숙소 구하기 진짜 힘들다", content: "서울 올라와서 일하려는데 원룸이 다 비싸요.\n숙소 제공하는 데가 제일 좋은 것 같아요.\n다들 숙소 어떻게 구하셨어요?" },
    { title: "업소 옮기려는데 고민돼요", content: "지금 다니는 데가 1년 됐는데 좀 매너리즘이 와서요.\n옮기면 또 적응해야 하니까 고민되네요.\n비슷한 경험 있으신 분?" },
    { title: "퇴근 후 라면이 최고", content: "퇴근하고 집에서 먹는 라면 한 그릇이 진짜 행복이에요.\n다들 퇴근 후 루틴 뭐에요?" },
    { title: "내일 면접인데 떨려요", content: "내일 강남 쪽 라운지 면접 보러 가는데 첫 면접이라 너무 떨려요.\n면접 팁 좀 알려주세요!" },
  ];

  const questionPosts = [
    { title: "TC가 뭔지 정확히 모르겠어요", content: "구인글에 TC 협의라고 써있는 게 많은데\n정확히 어떤 의미인지 잘 모르겠어요.\n알려주실 분 계신가요?" },
    { title: "보도 경험 있으신 분 계세요?", content: "보도 쪽으로 일해보려고 하는데\n실제 경험담 들어보고 싶습니다.\n장단점이 뭔지 궁금해요." },
    { title: "4대보험 가입 가능한 곳 있나요?", content: "이 업계에서 4대보험 가입해주는 곳이 실제로 있나요?\n있다면 어떤 규모의 업소인지 궁금합니다." },
    { title: "해외 일자리 후기 궁금해요", content: "해외 카테고리 구인글이 가끔 보이는데\n실제로 해외에서 일해보신 분 계시면 후기 부탁드려요.\n어떤 나라가 좋았는지도요." },
    { title: "열람권 사야 할까요?", content: "구직글 올렸는데 연락이 없어서\n직접 업소에 연락해보려고 하는데\n열람권 사는 게 낫나요?" },
  ];

  const regularUsers = users.filter((u) => u.grade === "REGULAR");

  for (let i = 0; i < freePosts.length; i++) {
    await prisma.post.create({
      data: {
        title: freePosts[i].title,
        content: freePosts[i].content,
        isAnonymous: i % 2 === 0,
        viewCount: Math.floor(Math.random() * 100) + 10,
        authorId: regularUsers[i % regularUsers.length].id,
        boardId: board1.id,
      },
    });
  }

  for (let i = 0; i < questionPosts.length; i++) {
    await prisma.post.create({
      data: {
        title: questionPosts[i].title,
        content: questionPosts[i].content,
        isAnonymous: i % 3 === 0,
        viewCount: Math.floor(Math.random() * 80) + 5,
        authorId: regularUsers[i % regularUsers.length].id,
        boardId: board2.id,
      },
    });
  }
  console.log("  게시판 글: 10개 (자유수다 5 + 질문있어요 5)");

  // ==========================================
  // 9. 중고거래 (5개)
  // ==========================================
  const marketItems = [
    { title: "원복 드레스 (블랙) 1회 착용", category: "CLOTHING" as const, price: 150000, description: "1회만 착용한 블랙 원복 드레스입니다.\n사이즈 S (55)\n상태 거의 새것.\n직거래 강남역 선호." },
    { title: "명품 클러치백 판매합니다", category: "BAG" as const, price: 280000, description: "출근용으로 쓰던 클러치백이에요.\n상태 양호, 정품 인증 가능.\n택배 가능." },
    { title: "하이힐 240 (레드) 거의 새것", category: "SHOES" as const, price: 50000, description: "사이즈 안 맞아서 판매합니다.\n240, 굽 10cm\n2번 신었어요." },
    { title: "출근 메이크업 풀세트 (나눔)", category: "ACCESSORY" as const, price: 0, description: "안 쓰는 메이크업 제품 정리합니다.\n파운데이션, 아이섀도우 팔레트, 립 5개\n사용감 있지만 쓸만합니다.\n직거래만 (강남)" },
    { title: "실버 이어링+목걸이 세트", category: "ACCESSORY" as const, price: 35000, description: "출근용 실버 주얼리 세트입니다.\n이어링 + 목걸이 함께 판매.\n따로 구매 불가." },
  ];

  for (let i = 0; i < marketItems.length; i++) {
    await prisma.marketItem.create({
      data: {
        title: marketItems[i].title,
        description: marketItems[i].description,
        price: marketItems[i].price,
        category: marketItems[i].category,
        images: [],
        isSoldOut: i === 3,
        viewCount: Math.floor(Math.random() * 50) + 5,
        authorId: regularUsers[i % regularUsers.length].id,
      },
    });
  }
  console.log(`  중고거래: ${marketItems.length}개`);

  // ==========================================
  // 10. 카페 인기글 (3개)
  // ==========================================
  await prisma.cafePost.createMany({
    data: [
      { title: "[공지] 여시광장 이용 규칙 안내", url: "https://cafe.naver.com/bamyeosi/1", category: "공지", isPinned: true },
      { title: "이번 주 인기글 모음", url: "https://cafe.naver.com/bamyeosi/100", category: "인기글" },
      { title: "신입 종사자를 위한 가이드", url: "https://cafe.naver.com/bamyeosi/200", category: "인기글" },
    ],
  });
  console.log("  카페 인기글: 3개");

  console.log("\nSeed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
