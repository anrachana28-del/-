

/* UI */
function openMenu(){
  sidebar.style.left="0";
  overlay.style.display="block";
}

function closeMenu(){
  sidebar.style.left="-260px";
  overlay.style.display="none";
}
function goPage(p){

  document.querySelectorAll(".page").forEach(x=>{
    x.style.display = "none";
  });

  document.getElementById(p).style.display = "block";

  closeMenu();
}


/* OPEN SCAN PAGE */
function goScan(){
  window.location.href = "scan.html";
}

/* OPEN BARCODE PAGE */
function goBarcode(){
  window.location.href = "barcode.html";
}

/* OPEN BARCODE PAGE */
function goUnpaid(){
  window.location.href = "unpaid.html";
}
function goSummary(){
  window.location.href = "summary.html";
}
/* REALTIME */
db.collection("qrData").onSnapshot(snap=>{
  dataList=[];
  snap.forEach(d=>{
    dataList.push({
  docId: d.id,
  ...d.data()
});
  });
  render();
  document.getElementById("totalQR").innerText=dataList.length;
  // CALL CHART
renderCharts(
  dataList.length,
  Number(document.getElementById("totalList").innerText) || 0,
  Number(document.getElementById("totalUSD").innerText.replace(/,/g,'')) || 0,
  Number(document.getElementById("totalKHR").innerText.replace(/,/g,'')) || 0
);
});



db.collection("qr_payments")
.onSnapshot(snap=>{

  let count = 0;
  let totalUSD = 0;
  let totalKHR = 0;

  snap.forEach(doc=>{
    const d = doc.data();

    count++;
    totalUSD += Number(d.usd || 0);
    totalKHR += Number(d.khr || 0);
  });

  document.getElementById("totalList").innerText = count;
  document.getElementById("totalUSD").innerText = totalUSD.toLocaleString();
  document.getElementById("totalKHR").innerText = totalKHR.toLocaleString();

// CALL CHART
renderCharts(
  dataList.length,
  count,
  totalUSD,
  totalKHR
);
});
let barChart, pieChart;
const RATE = 4000;

function renderCharts(totalQR, totalList, totalUSD, totalKHR){

  if(barChart) barChart.destroy();
  if(pieChart) pieChart.destroy();

  // ======================
  // CALCULATION
  // ======================
  let unpaid = Math.max(0, Number(totalQR) - Number(totalList));

  let usdValueKHR = Number(totalUSD) * RATE;
  let totalValueKHR = usdValueKHR + Number(totalKHR);

  // ======================
  // BAR CHART (ABA STYLE MIX)
  // ======================
  barChart = new Chart(document.getElementById("barChart"), {
  type: "bar",
  data: {
    labels: [
      "ភ្ញៀវសរុប",
      "ភ្ញៀវចងដៃ",
      "មិនទាន់ចងដៃ"
    ],
    datasets: [{
      label: "ចំនួន",
      data: [
        totalQR,
        totalList,
        unpaid
      ],
      backgroundColor: [
        "#2196F3",
        "#4CAF50",
        "#F44336"
      ],
      borderRadius: 10
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.raw.toLocaleString()
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: v => v.toLocaleString()
        }
      }
    }
  }
});

  // ======================
  // PIE CHART (VALUE SHARE)
  // ======================

let usdToKhr = Number(totalUSD) * RATE;

pieChart = new Chart(document.getElementById("pieChart"), {
  type: "pie",
  data: {
    labels: [
      "ដុល្លារ ($)",
      "រៀល (៛)"
    ],
    datasets: [{
      data: [
        usdToKhr,        // hidden conversion
        Number(totalKHR)
      ],
      backgroundColor: [
        "#4CAF50",
        "#FF9800"
      ],
      borderWidth: 2
    }]
  },

  options: {
    responsive: true,

    plugins: {
      legend: {
        position: "bottom"
      },

      tooltip: {
        callbacks: {

          label: function(context) {

            if (context.dataIndex === 0) {
              // USD slice
              return `💵 ${totalUSD} $`;
            }

            // KHR slice
            return `💴 ${Number(totalKHR).toLocaleString()} ៛`;
          }
        }
      }
    }
  }
});
}
function openUnpaidPage(){
  goPage('pending');   // 👉 switch page
  showUnpaidGuests();  // 👉 load data
}


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