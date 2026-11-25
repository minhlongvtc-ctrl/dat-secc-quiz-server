const express = require('express');
const QRCode = require('qrcode');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const ANSWER_DURATION_SEC = Number(process.env.ANSWER_DURATION_SEC) || 20;
const REVEAL_DURATION_SEC = Number(process.env.REVEAL_DURATION_SEC) || 5;
const QUESTION_CYCLE_SEC = ANSWER_DURATION_SEC + REVEAL_DURATION_SEC;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DATA PERSISTENCE ====================
const DATA_DIR = path.join(__dirname, 'data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadResults() {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Không thể đọc results.json:', err.message);
  }
  return [];
}

function saveResults(list) {
  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Không thể lưu results.json:', err.message);
  }
}

// ==================== 10 QUIZ QUESTIONS (Khoa Kỹ thuật Điện tử 2, Học viện Công nghệ Bưu chính Viễn thông cơ sở TP.HCM (PTIT HCM)) ====================
const QUIZ_QUESTIONS = [
  {
    id: 1,
    section: 'Phần 01 • Về DAT Group',
    slide: 'Slide 6',
    question: 'Tầm nhìn đến năm 2035 của Tập đoàn DAT Group là gì?',
    options: [
      'Trở thành thương hiệu số 1 Đông Nam Á về hệ sinh thái giải pháp toàn diện trong tự động hóa công nghiệp và năng lượng xanh.',
      'Tập trung sản xuất độc quyền phần mềm kế toán ERP cho doanh nghiệp vừa và nhỏ tại Việt Nam.',
      'Chuyển đổi hoàn toàn sang lĩnh vực thương mại điện tử và dịch vụ giao nhận bán lẻ.',
      'Cung cấp duy nhất thiết bị thang máy dân dụng tại thị trường TP.HCM và Hà Nội.'
    ],
    correct: 0,
    explanation: 'Slide 6 (Tầm nhìn 2035): DAT Group đặt mục tiêu trở thành thương hiệu số 1 Đông Nam Á về hệ sinh thái giải pháp toàn diện trong tự động hóa công nghiệp và năng lượng xanh.'
  },
  {
    id: 2,
    section: 'Phần 01 • Về DAT Group',
    slide: 'Slide 7',
    question: 'Theo số liệu năng lực giai đoạn 2006–2026, DAT Group đã cung cấp ra thị trường bao nhiêu sản phẩm biến tần, tự động hóa, thang máy và năng lượng?',
    options: [
      'Hơn 200.000 sản phẩm',
      'Hơn 2.000.000 sản phẩm',
      'Hơn 20.000.000 sản phẩm',
      'Hơn 50.000.000 sản phẩm'
    ],
    correct: 2,
    explanation: 'Slide 7: DAT Group đã bán ra hơn 20.000.000+ sản phẩm, đồng hành cùng 18.000+ khách hàng doanh nghiệp và 3.000+ đối tác trên toàn quốc.'
  },
  {
    id: 3,
    section: 'Phần 02 • Hiện trạng sản xuất VN',
    slide: 'Slide 9',
    question: 'Theo số liệu thị trường Việt Nam giai đoạn 2025–2031, tốc độ tăng trưởng kép (CAGR) và số lượng Robot công nghiệp lắp đặt mới mỗi năm là bao nhiêu?',
    options: [
      'CAGR 8,5%/năm và khoảng 1.200 Robot/năm',
      'CAGR 12,88%/năm và hơn 3.200 Robot/năm',
      'CAGR 20,5%/năm và hơn 10.000 Robot/năm',
      'CAGR 5,2%/năm và khoảng 500 Robot/năm'
    ],
    correct: 1,
    explanation: 'Slide 9: Thị trường Robot công nghiệp Việt Nam tăng trưởng CAGR +12,88%/năm với hơn 3.200+ Robot lắp đặt mới hàng năm.'
  },
  {
    id: 4,
    section: 'Phần 02 • Hiện trạng sản xuất VN',
    slide: 'Slide 10',
    question: 'Nghịch lý "Ốc đảo tự động hóa" (Automation Islands) tại đa số nhà máy SME Việt Nam hiện nay được hiểu là gì?',
    options: [
      'Nhà máy chưa đầu tư bất kỳ thiết bị điện công nghiệp hay cảm biến nào.',
      'Nhà máy đã có PLC, biến tần, Robot hiện đại nhưng hoạt động cô lập, không kết nối mạng chung và báo cáo Excel trễ 12–24 giờ.',
      'Nhà máy đặt tại khu vực hải đảo xa đất liền nên khó tiếp cận nguồn điện lưới.',
      'Nhà máy chỉ sử dụng công nhân thủ công và không có kế hoạch mở rộng sản xuất.'
    ],
    correct: 1,
    explanation: 'Slide 10: Điểm nghẽn lớn nhất của nhà máy SME (Level 1.5–2.0) là thiết bị hoạt động cô lập, không kết nối mạng chung và báo cáo Excel trễ 12–24 giờ.'
  },
  {
    id: 5,
    section: 'Phần 03 • Xu hướng & Nhà máy tự hành',
    slide: 'Slide 12',
    question: 'Trong lộ trình 3 cấp độ tiến tới Nhà máy tự hành (2026–2031), thứ tự phát triển đúng từ thấp đến cao là gì?',
    options: [
      'Smart Factory → Automated → Autonomous',
      'Autonomous → Smart Factory → Automated',
      'Automated (Tự động hóa cục bộ) → Smart Factory (Kết nối OT–IT) → Autonomous (Nhà máy Tự hành AI)',
      'Manual → ERP → Edge AI'
    ],
    correct: 2,
    explanation: 'Slide 12: Lộ trình 3 cấp độ gồm Automated (Cấp 1) → Smart Factory (Cấp 2) → Autonomous (Cấp 3).'
  },
  {
    id: 6,
    section: 'Phần 03 • Công nghệ trụ cột',
    slide: 'Slide 13',
    question: 'Đặc điểm nổi bật nào của Robot cộng tác (Cobots) giúp tối ưu cho bài toán đổi mã hàng liên tục (High-Mix Low-Volume)?',
    options: [
      'Làm việc chung không gian an toàn với công nhân và hỗ trợ dạy việc nhanh (Lead-through) trong vài phút.',
      'Yêu cầu xây dựng hàng rào bảo vệ cố định và lập trình lại bằng mã máy mất nhiều tuần.',
      'Chỉ hoạt động ở tốc độ cực cao trong môi trường cách ly hoàn toàn con người.',
      'Tự động kết nối thẳng với phần mềm kế toán mà không cần bộ điều khiển.'
    ],
    correct: 0,
    explanation: 'Slide 13: Cobots làm việc chung không gian an toàn với công nhân và hỗ trợ dạy việc nhanh (Lead-through) trong vài phút.'
  },
  {
    id: 7,
    section: 'Phần 04 • Kiến trúc chuẩn ISA-95',
    slide: 'Slide 16',
    question: 'Trong kiến trúc chuẩn quốc tế ISA-95 (IEC/ISO 62264), tầng nào đảm nhiệm Điều hành sản xuất (MES/MOM) gồm quản lý lệnh sản xuất, tính toán OEE, QMS và bảo trì CMMS?',
    options: [
      'Level 0 – Physical Process',
      'Level 1 – Sensing & Manipulation',
      'Level 2 – Supervisory & Control',
      'Level 3 – MES / MOM'
    ],
    correct: 3,
    explanation: 'Slide 16: Level 3 (MES / MOM) phụ trách quản lý lệnh sản xuất tại xưởng, tính toán OEE, chất lượng QMS và bảo trì CMMS.'
  },
  {
    id: 8,
    section: 'Phần 04 • Hội tụ OT–IT & UNS',
    slide: 'Slide 17',
    question: 'Trong kiến trúc hiện đại hóa ISA-95 với IIoT, Unified Namespace (UNS) kết hợp giao thức mở OPC UA & MQTT đóng vai trò gì?',
    options: [
      'Thay thế hoàn toàn phần cứng PLC, biến tần và cảm biến dưới hiện trường.',
      'Đóng vai trò "Nguồn sự thật duy nhất" cập nhật tức thì mọi trạng thái máy, sản lượng, mã lỗi và điện năng cho Historian & AI.',
      'Chỉ dùng để lưu trữ hóa đơn tài chính và quản lý chấm công nhân sự văn phòng.',
      'Tăng chu kỳ quét của PLC lên gấp 10 lần để tiết kiệm băng thông mạng.'
    ],
    correct: 1,
    explanation: 'Slide 17: UNS chuẩn hóa dữ liệu qua OPC UA & MQTT, đóng vai trò "Nguồn sự thật duy nhất" cho Historian và AI Copilot.'
  },
  {
    id: 9,
    section: 'Phần 05 • Giải pháp thực chiến tại xưởng',
    slide: 'Slide 19',
    question: 'Khi kết hợp đội xe tự hành AGV/AMR với hệ thống MES/WMS để tự động cấp phôi lên chuyền, doanh nghiệp có thể giảm bao nhiêu phần trăm nhân sự kéo hàng?',
    options: [
      'Giảm 10–15% nhân sự kéo hàng',
      'Giảm 20–30% nhân sự kéo hàng',
      'Giảm 40–60% nhân sự kéo hàng',
      'Giảm 90–100% toàn bộ nhân sự nhà máy'
    ],
    correct: 2,
    explanation: 'Slide 19: Đội xe AGV/AMR kết nối MES/WMS tự động cấp phôi lên chuyền giúp giảm 40–60% nhân sự kéo hàng.'
  },
  {
    id: 10,
    section: 'Phần 06 • Trợ lý AI & Định hướng nghề nghiệp',
    slide: 'Slide 23 & 25',
    question: 'Theo thông điệp dành cho sinh viên Tự động hóa, yếu tố nào tạo nên "vị thế dẫn đầu khi ra trường" trong kỷ nguyên AI?',
    options: [
      'Chỉ cần học viết câu lệnh AI, không cần hiểu phần cứng điện công nghiệp.',
      'Nắm chắc nền tảng phần cứng (Biến tần, PLC, Servo) kết hợp hiểu dữ liệu OT–IT (Modbus, OPC UA, SCADA) và AI.',
      'Chỉ tập trung vào công việc đấu tủ điện đơn lẻ mà không cần kết nối mạng công nghiệp.',
      'Chờ đến khi tốt nghiệp mới bắt đầu tìm hiểu về thiết bị thực tế tại xưởng.'
    ],
    correct: 1,
    explanation: 'Slide 23 & 25: Nắm chắc phần cứng (Biến tần, PLC, Servo) kết hợp hiểu dữ liệu OT–IT & AI sẽ tạo vị thế dẫn đầu khi ra trường.'
  }
];

// ==================== SESSION & LOBBY STATE ====================
let results = loadResults();
let playerProgress = new Map();
for (const [idx, r] of results.entries()) {
  playerProgress.set(r.mssv, {
    name: r.name,
    mssv: r.mssv,
    joinedOrder: idx + 1,
    answers: new Map(),
    submitted: true,
    finalRecord: r
  });
}
let registeredPlayers = []; // { id, name, mssv, joinedAt }
let session = {
  sessionId: 'ses_' + Date.now(),
  status: 'WAITING', // WAITING | LIVE | FINISHED
  startedAt: null,
  finishedAt: null,
  customBaseUrl: ''
};

let cachedQrPlayUrl = '';
let cachedQrDataUrl = '';

async function getQrDataUrl(playUrl) {
  if (playUrl === cachedQrPlayUrl && cachedQrDataUrl) {
    return cachedQrDataUrl;
  }
  const dataUrl = await QRCode.toDataURL(playUrl, {
    width: 340,
    margin: 2,
    color: { dark: '#0E2841', light: '#FFFFFF' }
  });
  cachedQrPlayUrl = playUrl;
  cachedQrDataUrl = dataUrl;
  return dataUrl;
}

function normalizeBaseUrl(rawUrl) {
  return String(rawUrl || '')
    .trim()
    .replace(/\/play\/?$/i, '')
    .replace(/\/+$/, '');
}

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  const virtualRe = /vethernet|wsl|hyper-v|docker|vbox|vmware|virtual|loopback|tailscale|zerotier/i;
  let fallbackIp = '';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!virtualRe.test(name)) {
          return net.address;
        }
        if (!fallbackIp) fallbackIp = net.address;
      }
    }
  }
  return fallbackIp || '127.0.0.1';
}

function isLocalHostHeader(host) {
  const hostname = String(host || '').split(':')[0].toLowerCase();
  return !hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function getPlayUrl(req) {
  const custom = normalizeBaseUrl(session.customBaseUrl);
  if (custom) {
    return `${custom}/play`;
  }
  const envPublic = normalizeBaseUrl(process.env.PUBLIC_URL);
  if (envPublic) {
    return `${envPublic}/play`;
  }
  if (req) {
    const reqHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
    if (reqHost && !isLocalHostHeader(reqHost)) {
      const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
      return `${proto}://${reqHost}/play`;
    }
  }
  const renderUrl = normalizeBaseUrl(process.env.RENDER_EXTERNAL_URL);
  if (renderUrl) {
    return `${renderUrl}/play`;
  }
  const ip = getLocalIPv4();
  return `http://${ip}:${PORT}/play`;
}

function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.totalTime - b.totalTime;
  });
}

function sortLiveScores(list) {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (a.score > 0 || b.score > 0) {
      if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
    }
    if (b.answeredCount !== a.answeredCount) return b.answeredCount - a.answeredCount;
    return (a.joinedOrder || 0) - (b.joinedOrder || 0);
  });
}

function getQuizClock(now = Date.now()) {
  if (session.status === 'WAITING' || !session.startedAt) {
    return {
      phase: 'WAITING',
      questionIndex: -1,
      phaseRemainingSec: 0,
      elapsedSec: 0,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      totalQuestions: QUIZ_QUESTIONS.length
    };
  }
  if (session.status === 'FINISHED') {
    return {
      phase: 'ENDED',
      questionIndex: QUIZ_QUESTIONS.length - 1,
      phaseRemainingSec: 0,
      elapsedSec: QUIZ_QUESTIONS.length * QUESTION_CYCLE_SEC,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      totalQuestions: QUIZ_QUESTIONS.length
    };
  }
  const elapsedSec = Math.max(0, (now - session.startedAt) / 1000);
  const totalSec = QUIZ_QUESTIONS.length * QUESTION_CYCLE_SEC;
  if (elapsedSec >= totalSec) {
    return {
      phase: 'ENDED',
      questionIndex: QUIZ_QUESTIONS.length - 1,
      phaseRemainingSec: 0,
      elapsedSec,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      totalQuestions: QUIZ_QUESTIONS.length
    };
  }
  const qIdx = Math.floor(elapsedSec / QUESTION_CYCLE_SEC);
  const inQ = elapsedSec - qIdx * QUESTION_CYCLE_SEC;
  if (inQ < ANSWER_DURATION_SEC) {
    return {
      phase: 'ANSWER',
      questionIndex: qIdx,
      phaseRemainingSec: Number((ANSWER_DURATION_SEC - inQ).toFixed(1)),
      elapsedSec,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      totalQuestions: QUIZ_QUESTIONS.length
    };
  }
  return {
    phase: 'REVEAL',
    questionIndex: qIdx,
    phaseRemainingSec: Number((QUESTION_CYCLE_SEC - inQ).toFixed(1)),
    elapsedSec,
    answerDurationSec: ANSWER_DURATION_SEC,
    revealDurationSec: REVEAL_DURATION_SEC,
    totalQuestions: QUIZ_QUESTIONS.length
  };
}

function isQuestionRevealable(qIdx, now = Date.now()) {
  if (session.status === 'FINISHED') return true;
  if (session.status !== 'LIVE' || !session.startedAt) return false;
  const revealAtMs = session.startedAt + (qIdx * QUESTION_CYCLE_SEC + ANSWER_DURATION_SEC) * 1000;
  return now + 250 >= revealAtMs;
}

function getMaxRevealedIndex(clock) {
  if (session.status === 'FINISHED' || clock.phase === 'ENDED') {
    return QUIZ_QUESTIONS.length - 1;
  }
  if (clock.phase === 'REVEAL') {
    return clock.questionIndex;
  }
  if (clock.phase === 'ANSWER') {
    return clock.questionIndex - 1;
  }
  return -1;
}

function computeTotalsUpTo(state, maxQIdx) {
  if (!state) {
    return { score: 0, correctCount: 0, answeredCount: 0, totalTime: 0 };
  }
  if (state.finalRecord && maxQIdx >= QUIZ_QUESTIONS.length - 1 && state.answers.size === 0) {
    return {
      score: state.finalRecord.score,
      correctCount: state.finalRecord.correctCount,
      answeredCount: state.finalRecord.totalQuestions,
      totalTime: state.finalRecord.totalTime
    };
  }
  if (maxQIdx < 0) {
    return { score: 0, correctCount: 0, answeredCount: 0, totalTime: 0 };
  }
  const limit = Math.min(maxQIdx, QUIZ_QUESTIONS.length - 1);
  let score = 0;
  let correctCount = 0;
  let answeredCount = 0;
  let totalTime = 0;
  for (let i = 0; i <= limit; i += 1) {
    const ans = state.answers.get(i);
    if (ans) {
      score += ans.earned;
      if (ans.isRight) correctCount += 1;
      answeredCount += 1;
      totalTime += ans.spent;
    } else {
      totalTime += ANSWER_DURATION_SEC;
    }
  }
  return {
    score,
    correctCount,
    answeredCount,
    totalTime: Number(totalTime.toFixed(2))
  };
}

function ensurePlayerProgress(name, mssv) {
  const cleanMssv = String(mssv || '').trim().toUpperCase();
  const cleanName = String(name || '').trim();
  let state = playerProgress.get(cleanMssv);
  if (!state) {
    state = {
      name: cleanName,
      mssv: cleanMssv,
      joinedOrder: registeredPlayers.length + 1,
      answers: new Map(),
      submitted: false,
      finalRecord: null
    };
    playerProgress.set(cleanMssv, state);
  } else if (cleanName) {
    state.name = cleanName;
  }
  return state;
}

function checkAutoFinalize() {
  if (session.status !== 'LIVE' || registeredPlayers.length === 0) return false;
  const submittedSet = new Set(results.map(r => r.mssv));
  const allDone = registeredPlayers.every(p => submittedSet.has(p.mssv));
  if (allDone) {
    session.status = 'FINISHED';
    session.finishedAt = Date.now();
    return true;
  }
  return false;
}

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.redirect('/host');
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/healthz', (req, res) => {
  res.json({ ok: true, status: session.status });
});

// Lấy thông tin phiên + QR Code DataURL + đồng hồ đồng bộ
app.get('/api/session', async (req, res) => {
  checkAutoFinalize();
  const now = Date.now();
  const clock = getQuizClock(now);

  if (req.query.lite === '1') {
    return res.json({
      sessionId: session.sessionId,
      status: session.status,
      finalized: session.status === 'FINISHED',
      serverNow: now,
      startedAt: session.startedAt,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      clock,
      completedCount: results.length,
      registeredCount: registeredPlayers.length
    });
  }

  const playUrl = getPlayUrl(req);
  try {
    const qrDataUrl = await getQrDataUrl(playUrl);
    const submittedSet = new Set(results.map(r => r.mssv));
    const lobbyPlayers = registeredPlayers
      .map((p, idx) => ({
        ...p,
        order: idx + 1,
        hasSubmitted: submittedSet.has(p.mssv)
      }))
      .slice(-500)
      .reverse();
    res.json({
      sessionId: session.sessionId,
      status: session.status,
      finalized: session.status === 'FINISHED',
      serverNow: now,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      answerDurationSec: ANSWER_DURATION_SEC,
      revealDurationSec: REVEAL_DURATION_SEC,
      clock,
      playUrl,
      customBaseUrl: session.customBaseUrl,
      lanUrl: `http://${getLocalIPv4()}:${PORT}/play`,
      qrDataUrl,
      registeredCount: registeredPlayers.length,
      registeredPlayers: lobbyPlayers,
      completedCount: results.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo mã QR.' });
  }
});

// Host cập nhật Base URL (ví dụ link Render / VS Code Dev Tunnel / Cloudflare Tunnel)
app.post('/api/session/url', (req, res) => {
  session.customBaseUrl = normalizeBaseUrl(req.body.customBaseUrl);
  res.json({ ok: true, customBaseUrl: session.customBaseUrl });
});

function handleStartChallenge(req, res) {
  const now = Date.now();
  session.status = 'LIVE';
  session.startedAt = now;
  session.finishedAt = null;
  res.json({
    ok: true,
    status: session.status,
    startedAt: session.startedAt,
    serverNow: now,
    answerDurationSec: ANSWER_DURATION_SEC,
    revealDurationSec: REVEAL_DURATION_SEC
  });
}

// Host bấm "Bắt đầu thử thách" cho toàn bộ sinh viên trong phòng chờ cùng làm bài
app.post('/api/session/start-challenge', handleStartChallenge);
app.post('/api/session/start-now', handleStartChallenge);

// Host mở lại phòng chờ (nếu cần)
app.post('/api/session/open-lobby', (req, res) => {
  session.status = 'WAITING';
  session.startedAt = null;
  session.finishedAt = null;
  res.json({ ok: true, status: session.status });
});

// Host chốt kết quả thủ công (dự phòng khi có sinh viên rớt mạng giữa chừng)
app.post('/api/session/finalize', (req, res) => {
  const submittedSet = new Set(results.map(r => r.mssv));
  let promoted = false;
  for (const state of playerProgress.values()) {
    if (!submittedSet.has(state.mssv) && state.answers.size > 0) {
      const totals = computeTotalsUpTo(state, QUIZ_QUESTIONS.length - 1);
      const record = {
        id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: state.name,
        mssv: state.mssv,
        score: totals.score,
        correctCount: totals.correctCount,
        totalQuestions: QUIZ_QUESTIONS.length,
        totalTime: totals.totalTime,
        finishedAt: new Date().toISOString()
      };
      results.push(record);
      submittedSet.add(state.mssv);
      state.submitted = true;
      state.finalRecord = record;
      promoted = true;
    }
  }
  session.status = 'FINISHED';
  session.finishedAt = Date.now();
  if (promoted) {
    saveResults(results);
  }
  res.json({
    ok: true,
    finalized: true,
    status: session.status,
    completedCount: results.length,
    registeredCount: registeredPlayers.length
  });
});

// Lấy danh sách câu hỏi cho sinh viên (ẨN hoàn toàn correct và explanation chống F12/DevTools)
app.get('/api/questions', (req, res) => {
  const safeQuestions = QUIZ_QUESTIONS.map(({ id, section, slide, question, options }) => ({
    id,
    section,
    slide,
    question,
    options
  }));
  res.json(safeQuestions);
});

// Sinh viên đăng ký sau khi quét QR
app.post('/api/register', (req, res) => {
  if (session.status === 'FINISHED') {
    return res.status(400).json({ error: 'Phiên thi này đã kết thúc. Vui lòng chờ Ban Tổ Chức mở phiên mới!' });
  }

  const name = String(req.body.name || '').trim();
  const mssv = String(req.body.mssv || '').trim().toUpperCase();
  if (!name || !mssv) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Họ tên và Mã số sinh viên (MSSV).' });
  }

  let player = registeredPlayers.find(p => p.mssv === mssv);
  if (!player) {
    player = {
      id: 'sv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name,
      mssv,
      joinedAt: new Date().toISOString()
    };
    registeredPlayers.push(player);
  } else {
    player.name = name;
  }

  ensurePlayerProgress(name, mssv);

  res.json({
    ok: true,
    player,
    sessionStatus: session.status,
    startedAt: session.startedAt,
    serverNow: Date.now(),
    answerDurationSec: ANSWER_DURATION_SEC,
    revealDurationSec: REVEAL_DURATION_SEC,
    registeredCount: registeredPlayers.length
  });
});

// Pha 1: Ghi nhận lựa chọn trung tính (KHÔNG trả đáp án đúng/sai hay điểm để chống nhìn bài)
app.post('/api/answer', (req, res) => {
  if (session.status !== 'LIVE' || !session.startedAt) {
    return res.status(400).json({ error: 'Phiên thi chưa bắt đầu hoặc đã kết thúc.' });
  }

  const name = String(req.body.name || '').trim();
  const mssv = String(req.body.mssv || '').trim().toUpperCase();
  const qIdx = Number(req.body.questionIndex);
  const sel = Number(req.body.selected);

  if (!name || !mssv || !Number.isInteger(qIdx) || qIdx < 0 || qIdx >= QUIZ_QUESTIONS.length) {
    return res.status(400).json({ error: 'Thông tin câu trả lời không hợp lệ.' });
  }
  const q = QUIZ_QUESTIONS[qIdx];
  if (!Number.isInteger(sel) || sel < 0 || sel >= q.options.length) {
    return res.status(400).json({ error: 'Phương án chọn không hợp lệ.' });
  }

  const clock = getQuizClock(Date.now());
  const qStart = qIdx * QUESTION_CYCLE_SEC;
  const qAnswerEnd = qStart + ANSWER_DURATION_SEC;
  if (clock.elapsedSec < qStart - 0.5 || clock.elapsedSec > qAnswerEnd + 1.0) {
    return res.status(400).json({ error: 'Hết thời gian trả lời câu hỏi này.' });
  }

  const state = ensurePlayerProgress(name, mssv);
  if (state.answers.has(qIdx)) {
    const prev = state.answers.get(qIdx);
    return res.json({
      ok: true,
      alreadyAnswered: true,
      questionIndex: qIdx,
      selected: prev.selected,
      spent: prev.spent
    });
  }

  const spent = Number(Math.min(ANSWER_DURATION_SEC, Math.max(0.1, clock.elapsedSec - qStart)).toFixed(2));
  const timeLeft = Math.max(0, ANSWER_DURATION_SEC - spent);
  const isRight = sel === q.correct;
  const earned = isRight ? 500 + Math.round((timeLeft / ANSWER_DURATION_SEC) * 500) : 0;

  state.answers.set(qIdx, { selected: sel, spent, isRight, earned });

  res.json({
    ok: true,
    questionIndex: qIdx,
    selected: sel,
    spent
  });
});

// Pha 2: Công bố đáp án & giải thích (CHỈ mở sau khi Pha Trả Lời 20s của câu hỏi kết thúc)
app.get('/api/reveal/:qIdx', (req, res) => {
  const qIdx = Number(req.params.qIdx);
  if (!Number.isInteger(qIdx) || qIdx < 0 || qIdx >= QUIZ_QUESTIONS.length) {
    return res.status(400).json({ error: 'Chỉ số câu hỏi không hợp lệ.' });
  }
  if (!isQuestionRevealable(qIdx)) {
    return res.status(403).json({ error: 'Chưa hết thời gian trả lời, chưa thể công bố đáp án.' });
  }

  const q = QUIZ_QUESTIONS[qIdx];
  const cleanMssv = String(req.query.mssv || '').trim().toUpperCase();
  let playerResult = null;
  if (cleanMssv) {
    const state = playerProgress.get(cleanMssv);
    const totals = computeTotalsUpTo(state, qIdx);
    const ans = state ? state.answers.get(qIdx) : null;
    playerResult = {
      selected: ans ? ans.selected : -1,
      spent: ans ? ans.spent : ANSWER_DURATION_SEC,
      isRight: ans ? ans.isRight : false,
      earned: ans ? ans.earned : 0,
      totalScore: totals.score,
      correctCount: totals.correctCount,
      totalTime: totals.totalTime
    };
  }

  res.json({
    ok: true,
    questionIndex: qIdx,
    correct: q.correct,
    explanation: q.explanation,
    playerResult
  });
});

// Sinh viên nộp kết quả Quiz (tính điểm chuẩn xác ở server)
app.post('/api/submit', (req, res) => {
  const { name, mssv, score, correctCount, totalQuestions, totalTime } = req.body;
  if (!name || !mssv) {
    return res.status(400).json({ error: 'Thiếu thông tin sinh viên.' });
  }

  const cleanMssv = String(mssv).trim().toUpperCase();
  const state = ensurePlayerProgress(name, cleanMssv);
  const hasServerAnswers = state.answers.size > 0;
  const totals = hasServerAnswers
    ? computeTotalsUpTo(state, QUIZ_QUESTIONS.length - 1)
    : {
        score: Number(score) || 0,
        correctCount: Number(correctCount) || 0,
        totalTime: Number(Number(totalTime || 0).toFixed(2))
      };

  const record = {
    id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: String(name).trim(),
    mssv: cleanMssv,
    score: totals.score,
    correctCount: totals.correctCount,
    totalQuestions: Number(totalQuestions) || QUIZ_QUESTIONS.length,
    totalTime: totals.totalTime,
    finishedAt: new Date().toISOString()
  };

  // Nếu cùng MSSV chơi lại, giữ lượt có điểm cao hơn
  const existingIdx = results.findIndex(r => r.mssv === cleanMssv);
  if (existingIdx >= 0) {
    const prev = results[existingIdx];
    const isBetter =
      record.score > prev.score ||
      (record.score === prev.score && record.correctCount > prev.correctCount) ||
      (record.score === prev.score && record.correctCount === prev.correctCount && record.totalTime < prev.totalTime);
    if (isBetter) results[existingIdx] = record;
  } else {
    results.push(record);
  }

  const saved = existingIdx >= 0 ? results[existingIdx] : record;
  state.submitted = true;
  state.finalRecord = saved;

  saveResults(results);
  checkAutoFinalize();

  const finalized = session.status === 'FINISHED';
  const sorted = sortLeaderboard(results);
  const rank = finalized ? sorted.findIndex(r => r.mssv === cleanMssv) + 1 : null;
  const totalPlayers = finalized ? sorted.length : Math.max(registeredPlayers.length, results.length);

  res.json({
    ok: true,
    finalized,
    rank,
    completedCount: results.length,
    registeredCount: registeredPlayers.length,
    totalPlayers,
    record: saved
  });
});

// Thí sinh đã nộp bài hỏi lại thứ hạng chính thức khi người cuối hoàn thành
app.get('/api/my-rank', (req, res) => {
  checkAutoFinalize();
  const cleanMssv = String(req.query.mssv || '').trim().toUpperCase();
  const finalized = session.status === 'FINISHED';
  const sorted = sortLeaderboard(results);
  const rank = finalized && cleanMssv ? sorted.findIndex(r => r.mssv === cleanMssv) + 1 : null;
  res.json({
    finalized,
    status: session.status,
    rank: rank && rank > 0 ? rank : null,
    totalPlayers: finalized ? sorted.length : Math.max(registeredPlayers.length, results.length),
    completedCount: results.length,
    registeredCount: registeredPlayers.length
  });
});

// Lấy bảng Live Score tạm thời Top 10 (CHỈ tính các câu đã qua Pha Công Bố để không lộ đáp án)
app.get('/api/live-scores', (req, res) => {
  const maxIdx = getMaxRevealedIndex(getQuizClock(Date.now()));
  const list = Array.from(playerProgress.values()).map(state => {
    const totals = computeTotalsUpTo(state, maxIdx);
    return {
      name: state.name,
      mssv: state.mssv,
      score: totals.score,
      correctCount: totals.correctCount,
      answeredCount: totals.answeredCount,
      totalQuestions: QUIZ_QUESTIONS.length,
      totalTime: totals.totalTime,
      finished: state.submitted,
      joinedOrder: state.joinedOrder
    };
  });
  const top10 = sortLiveScores(list).slice(0, 10);
  res.json(top10);
});

// Lấy bảng xếp hạng chính thức (chỉ trả dữ liệu sau khi người chơi cuối cùng xong hoặc Host chốt)
app.get('/api/leaderboard', (req, res) => {
  checkAutoFinalize();
  const finalized = session.status === 'FINISHED';
  res.json({
    finalized,
    status: session.status,
    completedCount: results.length,
    registeredCount: registeredPlayers.length,
    leaderboard: finalized ? sortLeaderboard(results) : []
  });
});

// Xuất CSV Excel
app.get('/api/export-csv', (req, res) => {
  const sorted = sortLeaderboard(results);
  const headers = ['Hang', 'Ho_va_Ten', 'MSSV', 'So_Cau_Dung', 'Tong_Thoi_Gian_Giay', 'Tong_Diem', 'Thoi_Diem'];
  const rows = sorted.map((r, i) => [
    i + 1,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.mssv.replace(/"/g, '""')}"`,
    `${r.correctCount}/${r.totalQuestions}`,
    r.totalTime.toFixed(2),
    r.score,
    `"${new Date(r.finishedAt).toLocaleString('vi-VN')}"`
  ].join(','));

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="DAT_PTIT_HCM_KT_DienTu2_Leaderboard.csv"');
  res.send(csv);
});

// Reset phiên & xóa dữ liệu
app.post('/api/reset', (req, res) => {
  results = [];
  playerProgress.clear();
  registeredPlayers = [];
  session.sessionId = 'ses_' + Date.now();
  session.status = 'WAITING';
  session.startedAt = null;
  session.finishedAt = null;
  saveResults(results);
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIPv4();
  const publicBase = normalizeBaseUrl(process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL);
  console.log('\n======================================================');
  console.log('  DAT GROUP SMART FACTORY QUIZ SERVER');
  console.log('  Khoa Kỹ thuật Điện tử 2, Học viện Công nghệ Bưu chính Viễn thông cơ sở TP.HCM (PTIT HCM)');
  console.log('======================================================');
  console.log(`  Man hinh chieu (Host) : http://localhost:${PORT}/host`);
  console.log(`  Link Sinh vien (LAN)  : http://${ip}:${PORT}/play`);
  if (publicBase) {
    console.log(`  Link Public (Host)    : ${publicBase}/host`);
    console.log(`  Link Public (Play)    : ${publicBase}/play`);
  }
  console.log('======================================================\n');
});
