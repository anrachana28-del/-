
// ===== FIREBASE =====
firebase.initializeApp({
  apiKey: "AIzaSyBuKVB0z6NVtepmjE33qXxrxs8RcmCOwd0",
  authDomain: "create-db14a.firebaseapp.com",
  projectId: "create-db14a"
});

const db = firebase.firestore();

// ===== VARIABLES =====
let dataList = [];
let editId = null;

// ===== REALTIME LOAD =====
db.collection("qrData").onSnapshot((snap)=>{

  dataList = [];

  snap.forEach(doc=>{

    dataList.push({
      docId: doc.id,
      ...doc.data()
    });

  });

  render();

});




function openMenu(){
  sidebar.style.left="0";
  overlay.style.display="block";
}

function closeMenu(){
  sidebar.style.left="-260px";
  overlay.style.display="none";
}

function showLoading(){
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading(){
  document.getElementById("loadingOverlay").style.display = "none";
}

function showToast(message, type="success"){

  const toast = document.getElementById("toast");

  // reset class
  toast.className = "";

  // set text
  toast.innerText = message;

  // add type
  toast.classList.add(type);

  // show animation
  setTimeout(()=>{
    toast.classList.add("show");
  },10);

  // auto hide
  setTimeout(()=>{

    toast.classList.remove("show");

  },2500);

}
// ===== ADD =====
function addData(){

  let name = document.getElementById("nameInput").value.trim();
  let note = document.getElementById("noteInput").value.trim();

  if(!name){
    return showToast("❌ សូមបញ្ចូលឈ្មោះ!");
  }

  let id = "ID" + String(dataList.length + 1).padStart(3,"0");

  showLoading(); // 🔥 START LOADING

  db.collection("qrData").add({
    id,
    name,
    note
  })
  .then(()=>{
    showToast("✅ រក្សាទុក ជោគជ័យ!");
  })
  .catch(()=>{
    showToast("❌ មាន បញ្ហា!");
  })
  .finally(()=>{
    hideLoading(); // 🔥 STOP LOADING
    closeAddModal();
  });

  document.getElementById("nameInput").value = "";
  document.getElementById("noteInput").value = "";
}

// ===== DELETE =====
function deleteData(docId){

  showConfirm("តើអ្នកចង់លុបទិន្នន័យនេះមែនទេ?", function(){

    showLoading();

    db.collection("qrData")
      .doc(docId)
      .delete()
      .then(()=>{
        showToast("🗑️ លុប ជោគជ័យ!");
      })
      .catch(()=>{
        showToast("❌ លុប បរាជ័យ!");
      })
      .finally(()=>{
        hideLoading();
      });

  });

}
let confirmCallback = null;

function showConfirm(message, callback){
  document.getElementById("confirmText").innerText = message;
  document.getElementById("confirmModal").style.display = "flex";

  confirmCallback = callback;
}

function closeConfirm(){
  document.getElementById("confirmModal").style.display = "none";
  confirmCallback = null;
}

// YES button action
document.getElementById("confirmYes").onclick = function(){
  if(confirmCallback) confirmCallback();
  closeConfirm();
};
// ===== OPEN EDIT =====
function openEdit(id, name, note){

  editId = id;

  document.getElementById("editName").value =
    decodeURIComponent(name || "");

  document.getElementById("editNote").value =
    decodeURIComponent(note || "");

  document.getElementById("editModal").style.display = "flex";

}

// ===== CLOSE EDIT =====
function closeEditModal(){

  document.getElementById("editModal").style.display="none";

}

// ===== UPDATE =====
function updateData(){

  let name =
  document.getElementById("editName").value.trim();

  let note =
  document.getElementById("editNote").value.trim();

  if(!name){
    return showToast("❌ សូមបញ្ចូលឈ្មោះ!", "error");
  }

  showLoading();

  db.collection("qrData")
    .doc(editId)
    .update({
      name,
      note
    })

    .then(()=>{

      showToast("✅ កែប្រែ ជោគជ័យ!");

      closeEditModal();

    })

    .catch((err)=>{

      console.log(err);

      showToast("❌ កែប្រែ បរាជ័យ!", "error");

    })

    .finally(()=>{

      hideLoading();

    });

}

// ===== ADD MODAL =====
function openAddModal(){

  document.getElementById("addModal").style.display="flex";

}

function closeAddModal(){

  document.getElementById("addModal").style.display="none";

}

// ===== SEARCH =====
function getList(){

  let k =
  document.getElementById("searchInput")
  .value
  .toLowerCase();

  if(!k) return dataList;

  return dataList.filter(i =>

    (i.id || "")
    .toLowerCase()
    .includes(k)

    ||

    (i.name || "")
    .toLowerCase()
    .includes(k)

    ||

    (i.note || "")
    .toLowerCase()
    .includes(k)

  );

}




function openPrintPage(){

  window.open(
    "print.html",
    "_blank"
  );

}


// ===== SORT TYPE =====
let sortType = "asc";

// ===== RENDER =====
function render(){

  let html = "";

  let index = 0;

  let list = getList();

  // ===== SORT ID =====
  list.sort((a,b)=>{

    let aNum = parseInt(
      (a.id || "ID0").replace("ID","")
    );

    let bNum = parseInt(
      (b.id || "ID0").replace("ID","")
    );

    return sortType === "asc"
      ? aNum - bNum
      : bNum - aNum;

  });

  list.forEach(item=>{

    html += `

      <tr>

        <td>${item.id}</td>

        <td>${item.name}</td>

        <td>

          <div style="
            display:flex;
            justify-content:center;
          ">

            <svg
              id="bar${index}"

              style="
                cursor:pointer;
                padding:5px;
                background:white;
                border-radius:10px;
                transition:.2s;
              "

              onclick="openBarcode(
                '${item.id}',
                \`${item.name}\`
              )"

              onmouseover="
                this.style.transform='scale(1.08)'
              "

              onmouseout="
                this.style.transform='scale(1)'
              ">
            </svg>

          </div>

        </td>

        <td>${item.note || "-"}</td>

        <td>

          <button
            class="edit-btn"

            onclick="openEdit(
              '${item.docId}',
              \`${encodeURIComponent(item.name)}\`,
              \`${encodeURIComponent(item.note || "")}\`
            )"
          >
            Edit
          </button>

          <button
            class="delete-btn"
            onclick="deleteData('${item.docId}')"
          >
            Delete
          </button>

        </td>

      </tr>

    `;

    index++;

  });

  document.getElementById("tbody").innerHTML = html;

  index = 0;

  list.forEach(item=>{

    JsBarcode(
      "#bar"+index,
      item.id,
      {
        format:"CODE128",
        width:1.5,
        height:40,
        displayValue:false
      }
    );

    index++;

  });

}

// ===== SET SORT =====
function setSort(type){

  sortType = type;

  document
    .getElementById("sortAscBtn")
    .classList.remove("active");

  document
    .getElementById("sortDescBtn")
    .classList.remove("active");

  if(type === "asc"){

    document
      .getElementById("sortAscBtn")
      .classList.add("active");

  }else{

    document
      .getElementById("sortDescBtn")
      .classList.add("active");

  }

  render();

}

db.collection("qrData").onSnapshot(()=>{
  livePendingBadge();
});

db.collection("qr_payments").onSnapshot(()=>{
  livePendingBadge();
});
let dashboardUnpaid = 0;
function updateDashboard(){

  let totalQR =
  document.getElementById("totalQR");

  let totalUnpaid =
  document.getElementById("totalUnpaid");

  if(totalQR){
    totalQR.innerText = dataList.length;
  }

  if(totalUnpaid){
    totalUnpaid.innerText = dashboardUnpaid;
  }

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




let currentBarcode = "";

// ===== OPEN BARCODE =====
function openBarcode(code,name){

currentBarcode = code;

document.getElementById(
"barcodeModal"
).style.display = "flex";

JsBarcode(
"#previewBarcode",
code,
{
format:"CODE128",
width:4,
height:130,
displayValue:true,
fontSize:24,
margin:20
}
);

document.getElementById(
"previewText"
).innerText = code;
document.getElementById(
"previewName"
).innerText = name;

}

// ===== CLOSE =====
function closeBarcodeModal(){

document.getElementById(
"barcodeModal"
).style.display = "none";

}

// ===== DOWNLOAD =====
function downloadBarcode(){

let svg =
document.getElementById(
"previewBarcode"
);

let svgData =
new XMLSerializer()
.serializeToString(svg);

let canvas =
document.createElement("canvas");

let ctx =
canvas.getContext("2d");

let img =
new Image();

img.onload = function(){

canvas.width = img.width;
canvas.height = img.height;

ctx.fillStyle = "white";

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

ctx.drawImage(img,0,0);

let a =
document.createElement("a");

a.download =
currentBarcode + ".png";

a.href =
canvas.toDataURL("image/png");

a.click();

};

img.src =
"data:image/svg+xml;base64," +
btoa(svgData);

}

// ===== SHARE =====
async function shareBarcode(){

let svg =
document.getElementById(
"previewBarcode"
);

let svgData =
new XMLSerializer()
.serializeToString(svg);

let canvas =
document.createElement("canvas");

let ctx =
canvas.getContext("2d");

let img =
new Image();

img.onload = async function(){

canvas.width = img.width;
canvas.height = img.height;

ctx.fillStyle = "white";

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

ctx.drawImage(img,0,0);

canvas.toBlob(async(blob)=>{

let file =
new File(
[blob],
currentBarcode + ".png",
{type:"image/png"}
);

if(navigator.canShare){

try{

await navigator.share({

title:"Barcode",
text:currentBarcode,
files:[file]

});

}catch(e){
console.log(e);
}

}

});

};

img.src =
"data:image/svg+xml;base64," +
btoa(svgData);

}

function goIndex(){
  window.location.href = "index.html";
}
function goBarcode(){
  window.location.href = "barcode.html";
}
function goScan(){
  window.location.href = "scan.html";
}
function goUnpaid(){
  window.location.href = "unpaid.html";
}
function goSummary(){
  window.location.href = "summary.html";
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
