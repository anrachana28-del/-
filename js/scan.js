
const qr = new Html5Qrcode("reader");

// 🔊 SOUND HERE 👇
let scanSound = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
scanSound.preload = "auto";
scanSound.volume = 1;
const modal = document.getElementById("modal");
const nameInput = document.getElementById("name");
const usdInput = document.getElementById("usd");
const khrInput = document.getElementById("khr");
const noteInput = document.getElementById("note"); // ✅ add this

const tableBody = document.getElementById("tableBody");

let scanned = false;
let cameraRunning = false;
let deleteId = null;
/* TELEGRAM */
const BOT_TOKEN = "7654128263:AAG7Bfl_kPF9aOnE0hltHpCGqQlTE1H9wCg";
const CHAT_ID = "6567570219";


async function sendToTelegram(data){

  // 🔥 បើ USD/KHR អត់មាន មិនបង្ហាញ
  let usdText = "";
  let khrText = "";

  if(Number(data.usd) > 0){
    usdText = `💵 <b>ដុល្លារ:</b> <code>$${data.usd}</code>\n`;
  }
  if(Number(data.khr) > 0){
    khrText = `💴 <b>រៀល:</b> <code>${data.khr}៛</code>\n`;
  }
  const text =
`
🆔 <b>ID:</b> <code>${data.guestId || "-"}</code>
👤 <b>ឈ្មោះ:</b> ${data.name}
${usdText}${khrText}
📝 <b>ចំណាំ:</b> ${data.note || "-"}
━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${new Date().toLocaleString()}
`;

  try{

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: "HTML"
        })
      }
    );

    const result = await res.json();

    console.log("Telegram result:", result);

    if(!result.ok){
      alert("Telegram Error: " + result.description);
    }

  }catch(err){

    console.log("Telegram fetch failed:", err);

    alert("Telegram network error");
  }
}

function searchTable(){

  const filter = document
    .getElementById("searchBox")
    .value
    .toLowerCase()
    .trim();

  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach(row => {

    const idCell = row.cells[0];
    const nameCell = row.cells[1];

    const idText = idCell.innerText;
    const nameText = nameCell.innerText;

    // reset
    idCell.innerHTML = idText;
    nameCell.innerHTML = nameText;

    if(filter === ""){
      row.style.display = "";
      return;
    }

    const found =
      idText.toLowerCase().includes(filter) ||
      nameText.toLowerCase().includes(filter);

    if(found){

      row.style.display = "";

      const regex = new RegExp(
        filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        "gi"
      );

      idCell.innerHTML = idText.replace(regex,
        m => `<span class="highlight">${m}</span>`
      );

      nameCell.innerHTML = nameText.replace(regex,
        m => `<span class="highlight">${m}</span>`
      );

    }else{

      row.style.display = "none";

    }

  });

}
async function getBestCameraId(){

  const cams = await Html5Qrcode.getCameras();

  if(!cams.length){
    throw new Error("No camera found");
  }

  let selected = cams[0].id;

  for(const cam of cams){
    const name = (cam.label || "").toLowerCase();

    if(name.includes("back") || name.includes("rear")){
      return cam.id; // 📱 mobile back camera
    }

    if(name.includes("usb") || name.includes("webcam")){
      selected = cam.id;
    }
  }

  return selected;
}
/* CLEAN */
function goBack(){
  window.location.href = "index.html";
}
function clean(t){
  return (t||"").replace(/[\uFFFD�]/g,"").trim();
}
async function startScan(){
  try{

    const cameraId = await getBestCameraId();

    if(cameraRunning){
      await safeStop();
    }

    scanned = false;
    cameraRunning = true;

    showScanLine();

    // unlock sound
    scanSound.play().then(()=>{
      scanSound.pause();
      scanSound.currentTime = 0;
    });

    await qr.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },

        // 🔥 FULL QR + BARCODE SUPPORT FIX
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ],

        // 🔥 stability boost
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      },

      async (decodedText, decodedResult)=>{

        if(scanned) return;
        scanned = true;

        // sound + vibration
        scanSound.currentTime = 0;
        scanSound.play().catch(()=>{});
        navigator.vibrate?.(150);

        document.getElementById("result").innerText = decodedText;

        await safeStop();
        hideScanLine();

        openModal(decodedText);
      },

      (error)=>{}
    );

  }catch(e){
    hideScanLine();
    cameraRunning = false;
    alert("Camera Error: " + e.message);
  }
}
async function safeStop(){
  try{
    if(cameraRunning){
      await qr.stop();
      await qr.clear();
    }
  }catch(e){
    console.log("stop error:", e);
  }
  cameraRunning = false;
}
function showScanLine(){
  const line = document.querySelector(".scan-line");
  if(line) line.style.display = "block";
}

function hideScanLine(){
  const line = document.querySelector(".scan-line");
  if(line) line.style.display = "none";
}



/* IMAGE */
async function scanImage(input){
  const file=input.files[0];
  const text=await qr.scanFile(file);
  openModal(text);
}

/* MODAL */

async function openModal(qrText){

  modal.style.display = "flex";

  // CLEAN TEXT
  qrText = clean(qrText).trim();

  // 🔥 SHOW ID FIRST
  document.getElementById("guestId").value = qrText;

  // RESET
  nameInput.value = "";
  usdInput.value = "";
  khrInput.value = "";
  noteInput.value = "";

  try{

    // 🔥 SEARCH ID IN FIREBASE
    const snap = await db.collection("qrData")
      .where("id","==",qrText)
      .limit(1)
      .get();

    // ✅ FOUND
    if(!snap.empty){

      const data = snap.docs[0].data();

      // 🔥 AUTO SHOW NAME
      document.getElementById("name").value =
        data.name || "";

    }else{

      // ❌ NOT FOUND
      document.getElementById("name").value =
        "";

    }

  }catch(err){

    console.log(err);

    document.getElementById("name").value =
      "Error Loading";

  }
}


function closeModal(){
  modal.style.display="none";
}



/* REALTIME + TOTAL */
db.collection("qr_payments")
.orderBy("time","desc")
.onSnapshot(snap=>{

  let html="";
  let totalUSD=0;
  let totalKHR=0;
  let count=0;

  snap.forEach(doc=>{
    const d=doc.data();

    count++;
    totalUSD+=Number(d.usd||0);
    totalKHR+=Number(d.khr||0);

html+=`
<tr onclick='editData("${doc.id}", ${JSON.stringify(d)})'>
  <td>${d.guestId || ""}</td>
  <td class="ok">${d.name||""}</td>
  <td style="color:#28a745;font-weight:bold;">${d.usd||0} $</td>
  <td style="color:#ff9800;font-weight:bold;">${d.khr||0} ៛</td>
  <td style="
  color:${d.updated ? 'red' : '#6c757d'};
  font-weight:${d.updated ? 'bold' : 'normal'};
">
  ${d.createdAt || ""}
  ${d.updated ? ' ' : ''}
</td>
  <td style="color:#6c757d;font-size:12px">${d.note||""}</td>
  <td>
  <button class="delete-btn"
  onclick="event.stopPropagation(); openDelete('${doc.id}')">
    <i class="fa fa-trash"></i>
  </button>
</td>
</tr>
`;
  });

  tableBody.innerHTML=html;

  document.getElementById("totalGuest").innerText=count;
  document.getElementById("totalUSD").innerText=totalUSD.toLocaleString();
  document.getElementById("totalKHR").innerText=totalKHR.toLocaleString();

});

let editId = null;
let isEdit = false;

async function editData(id,data){

  isEdit = true;
  editId = id;

  modal.style.display = "flex";

  // 🔥 ID
  document.getElementById("guestId").value = data.guestId || "";

  // 🔥 NAME
  nameInput.value = data.name || "";

  // 🔥 MONEY
  usdInput.value = data.usd || 0;
  khrInput.value = data.khr || 0;

  // 🔥 NOTE
  noteInput.value = data.note || "";

}
async function saveData(){

  const loading = document.getElementById("loadingOverlay");

  loading.style.display = "flex";

  const guestId = document.getElementById("guestId").value.trim();

  const data = {
    guestId: guestId,
    name: nameInput.value,
    usd: Number(usdInput.value) || 0,
    khr: Number(khrInput.value) || 0,
    note: noteInput.value,
    time: Date.now(),
    createdAt: new Date().toLocaleString()
  };

  // 🔥 ត្រូវមាន USD ឬ KHR យ៉ាងហោចណាស់ 1
  if(data.usd <= 0 && data.khr <= 0){

    loading.style.display = "none";

    showToast("❌ សូមបញ្ចូល ដុល្លារ ឬ រៀល","error");

    return;
  }

  try{

    // 🔥 CHECK DUPLICATE ID
    const checkSnap = await db.collection("qr_payments")
      .where("guestId","==",guestId)
      .get();

    // 🔥 បើមាន ID រួចហើយ
    if(!checkSnap.empty && !isEdit){

      loading.style.display = "none";

      showToast("❌ ID នេះបាន Scan រួចហើយ សូមបង្កើតឈ្មោះថ្មី","error");

      return;
    }

    // 🔥 UPDATE
    if(isEdit){

  await db.collection("qr_payments")
  .doc(editId)
  .update({
    ...data,
    updated:true
  });
  // 🔥 REFRESH
  loadQR();
  showToast("✅ កែប្រែ ជោគជ័យ","success");

}else{

      // 🔥 SAVE
      await db.collection("qr_payments")
      .add(data);

      await sendToTelegram(data);

      showToast("✅ រក្សាទុក ជោគជ័យ","success");
    }

    closeModal();

    isEdit = false;
    editId = null;

  }catch(err){

    console.log(err);

    showToast("❌ រក្សាទុក បរាជ័យ","error");

  }finally{

    loading.style.display = "none";
  }
}
function showToast(message,type="success"){

  const toast = document.getElementById("toast");

  toast.innerText = message;

  toast.className = "";
  toast.classList.add("show",type);

  setTimeout(()=>{
    toast.classList.remove("show");
  },2500);
}



async function confirmDelete(){

  const loading = document.getElementById("loadingOverlay");

  loading.style.display = "flex";

  try{

    await db.collection("qr_payments")
    .doc(deleteId)
    .delete();

    showToast("🗑 លុប បានជោគជ័យ","success");

  }catch(err){

    console.log(err);

    showToast("❌ លុប បរាជ័យ","error");

  }finally{

    loading.style.display = "none";
    closeDeleteModal();
    deleteId = null;
  }
}

function openDelete(id){

  deleteId = id;

  document.getElementById("deleteModal")
  .style.display = "flex";
}
function closeDeleteModal(){
  document.getElementById("deleteModal")
  .style.display = "none";
}





async function exportExcel(){

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("INVOICE");

  // ======================
  // 🧾 TITLE
  // ======================
  sheet.mergeCells("A1:F1");
  const title = sheet.getCell("A1");

  title.value = "បញ្ជីចំណងដៃ";
  title.font = {
    name: "Khmer OS Battambang",
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" }
  };

  title.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1AA4BD" } // blue
  };

  // ======================
  // HEADER ROW
  // ======================
  const headerRow = sheet.addRow([
    "លេខរៀង",
    "ឈ្មោះ",
    "ដុល្លារ",
    "រៀល",
    "បរិច្ចេក",
    "ចំណាំ"
  ]);

  headerRow.eachCell(cell=>{
    cell.font = {
      name: "Khmer OS Battambang",
      bold: true,
      color: { argb: "FFFFFFFF" }
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle"
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D6EFD" }
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" }
    };
  });

  let no = 1;
  let totalUSD = 0;
  let totalKHR = 0;
  let count = 0;

  const snap = await db.collection("qr_payments")
    .orderBy("time","desc")
    .get();

  snap.forEach(doc=>{
    const d = doc.data();

    const row = sheet.addRow([
      no++,
      d.name || "",
      d.usd || 0,
      d.khr || 0,
      d.createdAt || "",
      d.note || ""
    ]);

    totalUSD += Number(d.usd || 0);
    totalKHR += Number(d.khr || 0);
    count++;

    // ======================
    // ROW STYLE (ZEBRA)
    // ======================
    const bg = (no % 2 === 0) ? "FFF5FAFF" : "FFFFFFFF";

    row.eachCell(cell=>{
      cell.font = { name:"Khmer OS Battambang" };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bg }
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" }
      };
    });
  });

  // ======================
  // SUMMARY TITLE
  // ======================
  sheet.addRow([]);
  const summaryTitle = sheet.addRow([" ទិន្នន័យសរុបរួម"]);

  summaryTitle.font = {
    name:"Khmer OS Battambang",
    bold: true,
    size: 14
  };

  summaryTitle.alignment = { horizontal:"center" };

  // ======================
  // SUMMARY DATA
  // ======================
  const s1 = sheet.addRow([" សរុបភ្ញៀវចងដៃ", count]);
  const s2 = sheet.addRow([" សរុបដុល្លារ", totalUSD]);
  const s3 = sheet.addRow([" សរុបរៀល", totalKHR]);

  [s1,s2,s3].forEach(r=>{
    r.eachCell(cell=>{
      cell.font = { name:"Khmer OS Battambang" };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F7FF" }
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" }
      };
    });
  });

  // ======================
  // AUTO COLUMN WIDTH
  // ======================
  sheet.columns.forEach(col=>{
    let max = 10;

    col.eachCell(cell=>{
      const len = cell.value ? cell.value.toString().length : 10;
      if(len > max) max = len;
    });

    col.width = max + 4;
  });

  // ======================
  // DOWNLOAD
  // ======================
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "បញ្ជីចំណងដៃ.xlsx";
  link.click();
}


// ===============================
// 🔥 QR DATA + AUTO REALTIME
// ===============================

let qrList = [];
let paidSet = new Set();


// 🔥 AUTO REALTIME RELOAD
db.collection("qr_payments")
.onSnapshot(()=>{

  loadQR();

});

db.collection("qrData")
.onSnapshot(()=>{

  loadQR();

});


// ===============================
// 🔥 LOAD QR + PAYMENT
// ===============================
async function loadQR(){

  try{

    const qrSnap = await db.collection("qrData").get();
    const paySnap = await db.collection("qr_payments").get();

    qrList = [];
    paidSet = new Set();

    // 🔹 QR DATA
    qrSnap.forEach(doc=>{

      const d = doc.data();

      qrList.push({
        id: (d.id || "").toString().trim(),
        name: (d.name || "").toString().trim()
      });

    });

    // 🔹 PAYMENT DATA
    paySnap.forEach(doc=>{

      const d = doc.data();

      const paidId = (d.guestId || "")
        .toString()
        .trim();

      if(paidId){
        paidSet.add(paidId);
      }

    });

    // 🔥 RENDER
    renderModal();

  }catch(err){

    console.log("LOAD ERROR:", err);

  }

}


// ===============================
// 🔥 OPEN ALL MODAL
// ===============================
function openAllModal(){

  document.getElementById("allModal")
    .style.display = "flex";

  renderModal();

}


// ===============================
// ❌ CLOSE MODAL
// ===============================
function closeAllModal(){

  document.getElementById("allModal")
    .style.display = "none";

}


// ===============================
// 🔍 SEARCH FILTER
// ===============================
function filterModal(){

  renderModal();

}


// ===============================
// 📋 RENDER MODAL LIST
// ===============================
function renderModal(){

  const box = document.getElementById("modalList");

  const search = document
    .getElementById("modalSearch")
    .value
    .toLowerCase()
    .trim();

  box.innerHTML = "";

  // 🔥 FILTER + REMOVE PAID
  const list = qrList

    .filter(item=>{

      const match =
        item.id.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search);

      const unpaid =
        !paidSet.has(item.id);

      return match && unpaid;

    })

    // 🔥 SORT NAME
    .sort((a,b)=>
      a.name.localeCompare(b.name)
    );

  // ❌ EMPTY
  if(list.length === 0){

    box.innerHTML = `
      <div style="
        padding:40px 20px;
        text-align:center;
        color:#999;
      ">

        <div style="
          font-size:50px;
          margin-bottom:10px;
        ">
          📭
        </div>

        <div style="
          font-size:18px;
          font-weight:bold;
        ">
          No Data
        </div>

        <small>
          មិនមានទិន្នន័យ
        </small>

      </div>
    `;

    return;
  }

  // 🔥 RENDER ITEMS
  list.forEach(item=>{

    const div = document.createElement("div");

    div.className = "modal-item";

    // 🔥 SEARCH HIGHLIGHT
    let showName = item.name;
    let showId = item.id;

    if(search){

      const regex = new RegExp(
        `(${search})`,
        "gi"
      );

      showName = item.name.replace(
        regex,
        `<span style="
          background:yellow;
          color:black;
          padding:1px 4px;
          border-radius:4px;
        ">$1</span>`
      );

      showId = item.id.replace(
        regex,
        `<span style="
          background:yellow;
          color:black;
          padding:1px 4px;
          border-radius:4px;
        ">$1</span>`
      );

    }

    div.style.cssText = `
      padding:14px;
      border-bottom:1px solid #eee;
      cursor:pointer;
      transition:.2s;
      background:white;
    `;

    div.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
      ">

        <div>

          <div style="
            font-size:17px;
            font-weight:bold;
            color:#0d6efd;
          ">
            👤 ${showName}
          </div>

          <div style="
            margin-top:4px;
            color:#666;
            font-size:13px;
          ">
            ${showId}
          </div>

        </div>

        <div style="
          font-size:18px;
          color:#0d6efd;
        ">
          ➜
        </div>

      </div>

    `;

    // 🔥 HOVER
    div.onmouseenter = ()=>{

      div.style.background = "#f1f7ff";
      div.style.transform = "scale(1.01)";

    };

    div.onmouseleave = ()=>{

      div.style.background = "#fff";
      div.style.transform = "scale(1)";

    };

    // 🔥 CLICK SELECT
    div.onclick = ()=>{

      // 🔥 OPEN FORM
      modal.style.display = "flex";

      // 🔥 AUTO FILL
      document.getElementById("guestId").value =
        item.id;

      document.getElementById("name").value =
        item.name;

      // 🔥 RESET
      document.getElementById("usd").value = "";
      document.getElementById("khr").value = "";
      document.getElementById("note").value = "";

      // 🔥 CLOSE ALL MODAL
      closeAllModal();

    };

    box.appendChild(div);

  });

}


// ===============================
// 🔥 FIRST LOAD
// ===============================
loadQR();

window.onload = () => {
  loadQR();
};




















/* OPEN */
function openAddNewModal(){

  document.getElementById("addNewModal")
    .style.display = "flex";

}

/* CLOSE */
function closeAddNewModal(){

  document.getElementById("addNewModal")
    .style.display = "none";

}

/* AUTO GENERATE ID */
async function generateNextId(){

  const snap = await db.collection("qrData")
    .orderBy("created","desc")
    .limit(1)
    .get();

  let next = 1;

  if(!snap.empty){

    const last = snap.docs[0].data();

    const lastId = last.id || "ID0000";

    const num = parseInt(
      lastId.replace("ID","")
    );

    next = num + 1;
  }

  return "ID" + String(next).padStart(4,"0");
}

/* SAVE NEW */
async function saveNewGuest(){

  const loading = document.getElementById("loadingOverlay");
  loading.style.display = "flex";

  const name = document.getElementById("newName").value.trim();
  const usd = Number(document.getElementById("newUsd").value) || 0;
  const khr = Number(document.getElementById("newKhr").value) || 0;
  const note = document.getElementById("newNote").value.trim();

  if(!name){
    loading.style.display = "none";
    showToast("❌ សូមបញ្ចូលឈ្មោះ","error");
    return;
  }

  if(usd <= 0 && khr <= 0){
    loading.style.display = "none";
    showToast("❌ សូមបញ្ចូលលុយ","error");
    return;
  }

  try{

    // 🔥 AUTO ID
    const newId = await generateNextId();

    const data = {
      guestId: newId,
      name,
      usd,
      khr,
      note,

      time: Date.now(),
      createdAt: new Date().toLocaleString()
    };

    // 🔥 SAVE TO qrData
    await db.collection("qrData").add({
      id: newId,
      name: name,
      note: note,
      created: Date.now(),
      createdAt: new Date().toLocaleString()
    });

    // 🔥 SAVE TO qr_payments
    await db.collection("qr_payments").add(data);

    // 🔥 SEND TO TELEGRAM (SYNC)
    await sendToTelegram(data);

    showToast("✅ បង្កើតបានជោគជ័យ","success");

    // RESET FORM
    document.getElementById("newName").value = "";
    document.getElementById("newUsd").value = "";
    document.getElementById("newKhr").value = "";
    document.getElementById("newNote").value = "";

    closeAddNewModal();

    // 🔥 AUTO REFRESH DATA
    await loadQR();

  }catch(err){

    console.log("SAVE ERROR:", err);
    showToast("❌ Save Error","error");

  }finally{

    loading.style.display = "none";
  }
}



const usbInput = document.getElementById("usbScan");

usbInput.addEventListener("keydown", function(e){

  if(e.key === "Enter"){

    const scannedText = this.value.trim();

    if(scannedText){

      openModal(scannedText);

      scanSound.currentTime = 0;
      scanSound.play().catch(()=>{});

      navigator.vibrate?.(150);

      this.value = "";
    }
  }

});

document.addEventListener("click",(e)=>{

  // 🔥 បើ click input/textarea កុំ focus usb
  if(
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA"
  ){
    return;
  }

  usbInput.focus();

});
window.onload = ()=>{
  usbInput.focus();
};

document.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        btn.click();
    }
});