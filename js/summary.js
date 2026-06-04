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
function goUnpaid(){
  window.location.href = "unpaid.html";
}
function goSummary(){
  window.location.href = "summary.html";
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




const RATE = 4000;

/* ================= MODAL ================= */
function openModal(){
  document.getElementById("modal").style.display="flex";
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

/* ================= GLOBAL STATE ================= */
let incomeUSD = 0;
let incomeKHR = 0;

let expenseUSD = 0;
let expenseKHR = 0;

/* ================= SAVE ================= */
async function saveExpense(){

  const item = document.getElementById("item").value;
  const usd = Number(document.getElementById("usd").value || 0);
  const khr = Number(document.getElementById("khr").value || 0);

  if(!item){
    alert("សូមបញ្ចូល Item");
    return;
  }

  await db.collection("expenses").add({
    item,
    usd,
    khr,
    time: new Date()
  });

  document.getElementById("item").value="";
  document.getElementById("usd").value="";
  document.getElementById("khr").value="";

  closeModal();
}

/* ================= INCOME ================= */
db.collection("qr_payments").onSnapshot(snap=>{

  let u = 0;
  let k = 0;

  snap.forEach(d=>{
    let x = d.data();
    u += Number(x.usd || 0);
    k += Number(x.khr || 0);
  });

  incomeUSD = u;
  incomeKHR = k;

  document.getElementById("incomeUSD").innerText = incomeUSD;
  document.getElementById("incomeKHR").innerText = incomeKHR;

  updateBalance();
});

/* ================= EXPENSE ================= */
db.collection("expenses").onSnapshot(snap=>{

  let html = "";
  let u = 0;
  let k = 0;
  let i = 1;

  snap.forEach(doc=>{

    let d = doc.data();

    u += Number(d.usd || 0);
    k += Number(d.khr || 0);

    html += `
      <tr>
        <td>${i++}</td>
        <td>${d.item}</td>
        <td>${d.usd}</td>
        <td>${d.khr}</td>
        <td><button class="delete" onclick="del('${doc.id}')">X</button></td>
      </tr>
    `;
  });

  expenseUSD = u;
  expenseKHR = k;

  document.getElementById("list").innerHTML = html;

  document.getElementById("expenseUSD").innerText = expenseUSD;
  document.getElementById("expenseKHR").innerText = expenseKHR;

  updateBalance();

});

/* ================= DELETE ================= */
function del(id){
  db.collection("expenses").doc(id).delete();
}

/* ================= FIXED BALANCE ================= */
function updateBalance(){

  // PURE USD
  const remainUSD = incomeUSD - expenseUSD;

  // PURE KHR
  const remainKHR = incomeKHR - expenseKHR;

  // elements
  const usdEl = document.getElementById("remainUSD");
  const khrEl = document.getElementById("remainKHR");

  const cardUSD = usdEl.parentElement;
  const cardKHR = khrEl.parentElement;

  const labelUSD = cardUSD.querySelector("span");
  const labelKHR = cardKHR.querySelector("span");

  // ===== USD =====
  usdEl.innerText = remainUSD;

  if(remainUSD < 0){
    cardUSD.classList.add("over");
    labelUSD.innerText = "ចំណាយលើស ដុល្លារ";
    usdEl.style.color = "red";
  } else {
    cardUSD.classList.remove("over");
    labelUSD.innerText = "សល់ ដុល្លារ";
    usdEl.style.color = "green";
  }

  // ===== KHR =====
  khrEl.innerText = remainKHR;

  if(remainKHR < 0){
    cardKHR.classList.add("over");
    labelKHR.innerText = "ចំណាយលើស រៀល";
    khrEl.style.color = "red";
  } else {
    cardKHR.classList.remove("over");
    labelKHR.innerText = "សល់ រៀល";
    khrEl.style.color = "green";
  }
}





getRate();
setInterval(getRate, 60000); // refresh every 1 min


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