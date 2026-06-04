

/* VARIABLES */
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

let unpaidData = [];

/* MENU */
function openMenu(){
  sidebar.style.left = "0";
  overlay.style.display = "block";
}

function closeMenu(){
  sidebar.style.left = "-260px";
  overlay.style.display = "none";
}

/* PAGE */
function goPage(pageId){

  document.querySelectorAll(".page").forEach(page=>{
    page.style.display = "none";
  });

  document.getElementById(pageId).style.display = "block";

  closeMenu();
}

/* DEFAULT PAGE */
goPage("pending");
/* OPEN OTHER PAGE */
function goIndex(){
  window.location.href = "index.html";
}

/* OPEN OTHER PAGE */
function goScan(){
  window.location.href = "scan.html";
}

function goBarcode(){
  window.location.href = "barcode.html";
}
function goSummary(){
  window.location.href = "summary.html";
}
/* LOAD UNPAID GUEST */
async function showUnpaidGuests(){

  try{

    const qrSnap = await db.collection("qrData").get();
    const paySnap = await db.collection("qr_payments").get();

    let allGuests = [];
    let paidIds = [];

    /* ALL GUESTS */
    qrSnap.forEach(doc=>{

      const d = doc.data();

      allGuests.push({
        id: d.id || "",
        name: d.name || ""
      });

    });

    /* PAID IDS */
    paySnap.forEach(doc=>{

      const d = doc.data();

      if(d.guestId){
        paidIds.push(d.guestId);
      }

    });

    /* FILTER */
    unpaidData = allGuests.filter(g =>
      !paidIds.includes(g.id)
    );

    renderPendingTable(unpaidData);

  }catch(err){

    console.error(err);

  }

}

/* RENDER TABLE */
function renderPendingTable(list){

  let html = "";
  let no = 1;

  list.forEach(item=>{

    html += `
      <tr>

        <td>${no++}</td>

        <td>
          ${item.id}
        </td>

        <td>
          ${item.name}
        </td>

        <td style="color:red;font-weight:bold;">
          ❌ មិនទាន់ចងដៃ
        </td>

      </tr>
    `;

  });

  document.getElementById("pendingTableBody").innerHTML = html;

}

/* SEARCH */
function searchPending(){

  let keyword = document
    .getElementById("pendingSearch")
    .value
    .toLowerCase();

  let filtered = unpaidData.filter(item => {

    let name = String(item.name || "").toLowerCase();
    let id = String(item.id || "").toLowerCase();

    return (
      name.includes(keyword) ||
      id.includes(keyword)
    );

  });

  renderPendingTable(filtered);

}


/* REALTIME */
db.collection("qrData").onSnapshot(()=>{
  showUnpaidGuests();
});

db.collection("qr_payments").onSnapshot(()=>{
  showUnpaidGuests();
});













db.collection("qrData").onSnapshot(()=>{
  livePendingBadge();
});

db.collection("qr_payments").onSnapshot(()=>{
  livePendingBadge();
});
let dashboardUnpaid = 0;
function updateDashboard(){

  document.getElementById("totalQR").innerText =
    dataList.length;

  document.getElementById("totalUnpaid").innerText =
    dashboardUnpaid;

}

function livePendingBadge(){

  db.collection("qrData").get().then(qrSnap=>{
  db.collection("qr_payments").get().then(paySnap=>{

    let allGuests = [];
    let paidIds = [];

    qrSnap.forEach(doc=>{
      let d = doc.data();
      allGuests.push({ id: d.id, name: d.name });
    });

    paySnap.forEach(doc=>{
      let d = doc.data();
      if(d.guestId) paidIds.push(d.guestId);
    });

    let unpaid = allGuests.filter(g =>
      !paidIds.includes(g.id)
    );

    // 🔴 SAVE GLOBAL
    dashboardUnpaid = unpaid.length;
    unpaidData = unpaid;

    // BADGE
    document.getElementById("pendingBadge").innerText =
      unpaid.length;

    // DASHBOARD
    updateDashboard();

  });
  });

}

let user = JSON.parse(localStorage.getItem("user"));

if(!user){
    window.location.href = "login.html";
}
function logout(){

    if(confirm("តើអ្នកចង់ចាកចេញពីប្រព័ន្ធមែនទេ?")){

        localStorage.removeItem("user");
        window.location.href = "login.html";

    }

}