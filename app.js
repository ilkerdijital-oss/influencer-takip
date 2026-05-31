const STORAGE_KEY = "influencer-dashboard-records-v1";
const RECORDS_TABLE = "influencer_records";
const supabaseConfig = window.SUPABASE_CONFIG || {};
const hasSupabaseConfig =
  window.supabase &&
  supabaseConfig.url &&
  supabaseConfig.anonKey &&
  !supabaseConfig.url.includes("SUPABASE_PROJECT_URL") &&
  !supabaseConfig.anonKey.includes("SUPABASE_ANON_KEY");
const db = hasSupabaseConfig ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
const STATUS_OPTIONS = [
  "teklif iletildi",
  "anlaşma sağlandı",
  "çekim talebi iletildi.",
  "affilate kaydı yapıldı.",
  "ürünler kargoya verildi.",
  "ürün ulaştı, çekim bekleniyor.",
  "çekimler teslim alındı."
];
const COMPLETED_STATUS = "çekimler teslim alındı.";
const LEGACY_STATUS_MAP = {
  Teklif: "teklif iletildi",
  Icerik: "çekim talebi iletildi.",
  Yayinda: "ürünler kargoya verildi.",
  Tamamlandi: "çekimler teslim alındı."
};

const TURKEY_TIME_ZONE = "Europe/Istanbul";

const sampleData = [
  {
    id: crypto.randomUUID(),
    name: "Elif Kara",
    phone: "0532 410 28 14",
    instagram: "@elifkara",
    commission: 12,
    product: "Cilt bakim seti",
    category: "Cilt bakimi",
    channel: "Instagram",
    status: "ürünler kargoya verildi.",
    followers: 128000,
    engagement: 4.8,
    budget: 18000,
    revenue: 74000,
    date: "2026-05-27",
    time: "10:00",
    code: "ELIF15",
    notes: "Reels yayinda, story hatirlatmasi bekleniyor."
  },
  {
    id: crypto.randomUUID(),
    name: "Mert Yildiz",
    phone: "0544 288 71 09",
    instagram: "@mertyildiz",
    commission: 10,
    product: "Oversize sweatshirt",
    category: "Erkek giyim",
    channel: "TikTok",
    status: "çekim talebi iletildi.",
    followers: 94000,
    engagement: 6.1,
    budget: 12500,
    revenue: 39000,
    date: "2026-05-25",
    time: "14:30",
    code: "MERT10",
    notes: "Brief onaylandi, kargo teslim edildi."
  },
  {
    id: crypto.randomUUID(),
    name: "Derya Sari",
    phone: "0551 903 46 82",
    instagram: "@deryasari",
    commission: 15,
    product: "Mutfak duzenleyici",
    category: "Ev yasam",
    channel: "YouTube",
    status: "teklif iletildi",
    followers: 211000,
    engagement: 3.2,
    budget: 32000,
    revenue: 85000,
    date: "2026-06-02",
    time: "11:00",
    code: "DERYA20",
    notes: "Paket icin ikinci teklif gonderilecek."
  },
  {
    id: crypto.randomUUID(),
    name: "Zeynep Aksoy",
    phone: "0538 120 35 67",
    instagram: "@zeynepaksoy",
    commission: 8,
    product: "Bebek uyku tulumu",
    category: "Anne-bebek",
    channel: "Instagram",
    status: "çekimler teslim alındı.",
    followers: 76000,
    engagement: 5.4,
    budget: 9000,
    revenue: 42000,
    date: "2026-05-14",
    time: "16:00",
    code: "ZEYNEP12",
    notes: "Kod performansi iyi, Haziran tekrar teklif edilebilir."
  },
  {
    id: crypto.randomUUID(),
    name: "Can Eren",
    phone: "0507 664 19 33",
    instagram: "@caneren",
    commission: 10,
    product: "Protein shaker",
    category: "Spor",
    channel: "TikTok",
    status: "ürünler kargoya verildi.",
    followers: 153000,
    engagement: 7.2,
    budget: 21000,
    revenue: 68000,
    date: "2026-05-30",
    time: "13:00",
    code: "CANFIT",
    notes: "UGC versiyonu reklam hesabina alinacak."
  }
];

let records = [];
let activeFilter = "all";

const elements = {
  resultCount: document.querySelector("#resultCount"),
  sidePipeline: document.querySelector("#sidePipeline"),
  rows: document.querySelector("#influencerRows"),
  tasks: document.querySelector("#taskList"),
  search: document.querySelector("#searchInput"),
  modal: document.querySelector("#influencerModal"),
  form: document.querySelector("#influencerForm"),
  modalTitle: document.querySelector("#modalTitle"),
  deleteRecord: document.querySelector("#deleteRecord")
};

async function loadRecords() {
  if (db) {
    const { data, error } = await db.from(RECORDS_TABLE).select("*").order("created_at", { ascending: false });
    if (!error) return normalizeRecords(data || []);
    console.warn("Online veri okunamadi, yerel kayitlara geciliyor.", error);
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return normalizeRecords(sampleData);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? normalizeRecords(parsed) : normalizeRecords(sampleData);
  } catch {
    return normalizeRecords(sampleData);
  }
}

function normalizeRecords(list) {
  return list.map((record) => ({
    ...record,
    phone: record.phone || "Telefon eklenecek",
    instagram: record.instagram || "",
    commission: Number(record.commission || 0),
    product: record.product || record.category || "Urun eklenecek",
    time: record.time || getTurkeyNow().time,
    status: LEGACY_STATUS_MAP[record.status] || record.status || STATUS_OPTIONS[0]
  }));
}

function saveRecordsLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function saveRecord(record) {
  if (db) {
    const { data, error } = await db.from(RECORDS_TABLE).upsert(record).select().single();
    if (error) {
      alert("Kayit online olarak kaydedilemedi. Baglanti ayarlarini kontrol edin.");
      console.warn(error);
      return false;
    }
    records = [data, ...records.filter((item) => item.id !== data.id)];
    return true;
  }

  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }
  saveRecordsLocal();
  return true;
}

async function deleteRecord(id) {
  if (db) {
    const { error } = await db.from(RECORDS_TABLE).delete().eq("id", id);
    if (error) {
      alert("Kayit online olarak silinemedi. Baglanti ayarlarini kontrol edin.");
      console.warn(error);
      return false;
    }
  }

  records = records.filter((record) => record.id !== id);
  saveRecordsLocal();
  return true;
}

function formatCommission(value) {
  const number = Number(value || 0);
  return number ? `%${number} komisyon` : "Komisyon yok";
}

function getTurkeyNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TURKEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .formatToParts(new Date())
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function formatDateTime(record) {
  const date = new Date(record.date).toLocaleDateString("tr-TR");
  return `${date} ${record.time || getTurkeyNow().time}`;
}

function getFilteredRecords() {
  const term = elements.search.value.trim().toLocaleLowerCase("tr-TR");

  return records.filter((record) => {
    const matchesFilter = activeFilter === "all" || record.status === activeFilter;
    const haystack = `${record.name} ${record.phone} ${record.instagram} ${record.commission} ${record.product} ${record.category} ${record.channel} ${record.status} ${record.code}`
      .toLocaleLowerCase("tr-TR");
    return matchesFilter && haystack.includes(term);
  });
}

function renderStatusBarems() {
  const active = records.filter((record) => record.status !== COMPLETED_STATUS);
  elements.sidePipeline.textContent = `${active.length} aktif is birligi`;

  const statusCounts = STATUS_OPTIONS.map((status) => ({
    status,
    count: records.filter((record) => record.status === status).length
  }));
  const maxCount = Math.max(1, ...statusCounts.map((item) => item.count));

  statusCounts.forEach(({ status, count }) => {
    const countElement = document.querySelector(`[data-status-count="${status}"]`);
    const barElement = document.querySelector(`[data-status-bar="${status}"]`);

    if (countElement) countElement.textContent = count;
    if (barElement) barElement.style.width = `${Math.max(8, (count / maxCount) * 100)}%`;
  });
}

function renderRows() {
  const filtered = getFilteredRecords();
  elements.resultCount.textContent = `${filtered.length} kayit`;

  elements.rows.innerHTML = filtered
    .map(
      (record) => `
        <tr>
          <td>
            <div class="person">
              <strong>${record.name}</strong>
              <span>${record.instagram || "Instagram adresi yok"}</span>
            </div>
          </td>
          <td>${record.phone}</td>
          <td>
            <div class="person">
              <strong>${record.product}</strong>
              <span>${formatCommission(record.commission)}</span>
            </div>
          </td>
          <td>${record.channel}</td>
          <td><span class="status-pill status-${getStatusClass(record.status)}">${record.status}</span></td>
          <td>${formatDateTime(record)}</td>
          <td>
            <div class="row-actions">
              <select class="row-status-select" data-action="status-select" data-id="${record.id}" aria-label="${record.name} durum sec">
                ${renderStatusOptions(record.status)}
              </select>
              <button class="icon-button" data-action="edit" data-id="${record.id}" aria-label="${record.name} duzenle">E</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderTasks() {
  const upcoming = [...records]
    .filter((record) => record.status !== COMPLETED_STATUS)
    .sort((a, b) => {
      const fallbackTime = getTurkeyNow().time;
      return new Date(`${a.date}T${a.time || fallbackTime}`) - new Date(`${b.date}T${b.time || fallbackTime}`);
    })
    .slice(0, 4);

  elements.tasks.innerHTML = upcoming.length
    ? upcoming
        .map(
          (record) => `
            <div class="task-item">
              <span class="task-dot" aria-hidden="true"></span>
              <div>
                <strong>${record.name} - ${record.status}</strong>
                <span>${formatDateTime(record)} - ${record.notes || record.code}</span>
              </div>
            </div>
          `
        )
        .join("")
    : `<div class="task-item"><span class="task-dot" aria-hidden="true"></span><div><strong>Aktif is yok</strong><span>Yeni kayit eklenebilir.</span></div></div>`;
}

function render() {
  renderStatusBarems();
  renderRows();
  renderTasks();
}

function openModal(record = null) {
  elements.form.reset();
  elements.modalTitle.textContent = record ? "Influencer duzenle" : "Yeni influencer";
  elements.deleteRecord.hidden = !record;

  document.querySelector("#recordId").value = record?.id || "";
  document.querySelector("#name").value = record?.name || "";
  document.querySelector("#phone").value = record?.phone || "";
  document.querySelector("#instagram").value = record?.instagram || "";
  document.querySelector("#commission").value = record?.commission || "";
  document.querySelector("#product").value = record?.product || "";
  document.querySelector("#channel").value = record?.channel || "Instagram";
  document.querySelector("#status").value = record?.status || STATUS_OPTIONS[0];
  const turkeyNow = getTurkeyNow();
  document.querySelector("#date").value = record?.date || turkeyNow.date;
  document.querySelector("#time").value = record?.time || turkeyNow.time;
  document.querySelector("#notesField").value = record?.notes || "";

  elements.modal.showModal();
}

function closeModal() {
  elements.modal.close();
}

function getFormRecord() {
  const id = document.querySelector("#recordId").value || crypto.randomUUID();
  const existing = records.find((record) => record.id === id);
  const product = document.querySelector("#product").value.trim();

  return {
    id,
    name: document.querySelector("#name").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    instagram: document.querySelector("#instagram").value.trim(),
    commission: Number(document.querySelector("#commission").value || 0),
    product,
    category: existing?.category || product || "Urun",
    channel: document.querySelector("#channel").value,
    status: document.querySelector("#status").value,
    followers: Number(existing?.followers || 0),
    engagement: Number(existing?.engagement || 0),
    budget: Number(existing?.budget || 0),
    revenue: Number(existing?.revenue || 0),
    date: document.querySelector("#date").value,
    time: document.querySelector("#time").value,
    code: existing?.code || "",
    notes: document.querySelector("#notesField").value.trim()
  };
}

async function updateRecordStatus(id, status) {
  if (db) {
    const { error } = await db.from(RECORDS_TABLE).update({ status }).eq("id", id);
    if (error) {
      alert("Durum online olarak guncellenemedi. Baglanti ayarlarini kontrol edin.");
      console.warn(error);
      return;
    }
  }

  records = records.map((record) => (record.id === id ? { ...record, status } : record));
  saveRecordsLocal();
  render();
}

function getStatusClass(status) {
  return `step-${Math.max(STATUS_OPTIONS.indexOf(status), 0) + 1}`;
}

function renderStatusOptions(selectedStatus) {
  return STATUS_OPTIONS.map(
    (status) => `<option value="${status}" ${status === selectedStatus ? "selected" : ""}>${status}</option>`
  ).join("");
}

function downloadCsv() {
  const headers = [
    "Isim",
    "Tel No",
    "Instagram",
    "Komisyon Orani",
    "Urun",
    "Kategori",
    "Kanal",
    "Durum",
    "Takipci",
    "Etkilesim",
    "Butce",
    "Beklenen Ciro",
    "Tarih",
    "Saat",
    "Kod",
    "Not"
  ];
  const rows = records.map((record) =>
    [
      record.name,
      record.phone,
      record.instagram,
      record.commission,
      record.product,
      record.category,
      record.channel,
      record.status,
      record.followers,
      record.engagement,
      record.budget,
      record.revenue,
      record.date,
      record.time,
      record.code,
      record.notes
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "influencer-takip-paneli.csv";
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelector("#openModal").addEventListener("click", () => openModal());
document.querySelector("#openListModal").addEventListener("click", () => openModal());
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelModal").addEventListener("click", closeModal);
document.querySelector("#exportCsv").addEventListener("click", downloadCsv);

document.querySelector("#resetData").addEventListener("click", () => {
  if (db) {
    alert("Online modda ornek veriyi geri yukleme kapali. Ekip verisini korumak icin bu islem yapilmadi.");
    return;
  }

  records = normalizeRecords(sampleData).map((record) => ({ ...record, id: crypto.randomUUID() }));
  saveRecordsLocal();
  render();
});

elements.search.addEventListener("input", renderRows);

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderRows();
  });
});

elements.rows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const record = records.find((item) => item.id === button.dataset.id);
  if (!record) return;

  if (button.dataset.action === "edit") {
    openModal(record);
  }
});

elements.rows.addEventListener("change", async (event) => {
  const select = event.target.closest('[data-action="status-select"]');
  if (!select) return;

  await updateRecordStatus(select.dataset.id, select.value);
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const record = getFormRecord();
  const saved = await saveRecord(record);
  if (!saved) return;

  closeModal();
  render();
});

elements.deleteRecord.addEventListener("click", async () => {
  const id = document.querySelector("#recordId").value;
  const deleted = await deleteRecord(id);
  if (!deleted) return;

  closeModal();
  render();
});

function subscribeRealtime() {
  if (!db) return;

  db.channel("influencer-dashboard-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: RECORDS_TABLE }, async () => {
      records = await loadRecords();
      render();
    })
    .subscribe();
}

async function bootstrap() {
  records = await loadRecords();
  render();
  subscribeRealtime();
}

bootstrap();
