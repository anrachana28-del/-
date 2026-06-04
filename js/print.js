let dataList = [];

/* LOAD DATA */
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

/* FILTER */
function getList(){

  const key = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  if(!key) return dataList;

  return dataList.filter(item => {

    const name = String(item.name || "").toLowerCase();
    const id = String(item.id || "").toLowerCase();

    return (
      name.includes(key) ||
      id.includes(key)
    );

  });

}

/* RENDER */
function render(){

  const list = getList();

  let html = "";

  list.forEach((item,index)=>{

    html += `
      <div class="pair">

        <!-- NAME CARD -->
        <div class="card name-card">
          ${item.name || ""}
        </div>

        <!-- BARCODE CARD -->
       <!-- BARCODE NORMAL -->
<div class="card barcode-card">

  <svg id="barcode${index}"></svg>

  <div class="barcode-id">
    ${item.id || ""}
  </div>

</div>

<!-- BARCODE SMALL -->
<div class="card barcode-card barcode-small">

  <svg id="barcodeSmall${index}"></svg>

  <div class="barcode-id">
    ${item.id || ""}
  </div>

</div>

      </div>
    `;

  });

  document.getElementById("sheet").innerHTML = html;

  /* GENERATE BARCODE */
list.forEach((item,index)=>{

  if(item.id){

    /* NORMAL */
    JsBarcode(`#barcode${index}`, String(item.id), {
      format:"CODE128",
      width:0.8,
      height:25,
      displayValue:false,
      margin:0
    });

    /* SMALL */
    JsBarcode(`#barcodeSmall${index}`, String(item.id), {
      format:"CODE128",
      width:0.8,
      height:25,
      
      displayValue:false,
      margin:0
    });

  }

});

}
function goPage(p){

  document.querySelectorAll(".page").forEach(x=>{
    x.style.display = "none";
  });

  document.getElementById(p).style.display = "block";

  closeMenu();
}

let user = JSON.parse(localStorage.getItem("user"));

if(!user){
    window.location.href = "login.html";
}
