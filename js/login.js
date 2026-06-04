import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* UI */
const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");
const loading = document.getElementById("loading");

/* message function */
function showMsg(text,type){
    msg.innerText = text;
    msg.className = "msg " + type + " show";

    setTimeout(()=>{
        msg.className = "msg";
    },3000);
}

/* LOGIN */
btn.addEventListener("click", async ()=>{

    let u = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value.trim();

    if(!u || !p){
        showMsg("⚠️ សូមបំពេញ គណនីអោយត្រឹមត្រូវ","error");
        return;
    }

    loading.style.display="block";
    btn.disabled=true;

    try{

        const q = query(
            collection(db,"users"),
            where("username","==",u),
            where("password","==",p)
        );

        const snap = await getDocs(q);

        if(snap.empty){
            showMsg("❌ បរាជ័យ","error");

            loading.style.display="none";
            btn.disabled=false;
            return;
        }

        snap.forEach(doc=>{
            localStorage.setItem("user",JSON.stringify(doc.data()));
        });

        showMsg("✅ ចូល បានជោគជ័យ!!","success");

        setTimeout(()=>{
            window.location.href="index.html";
        },1200);

    }catch(e){
        showMsg("❌ Error: "+e.message,"error");
    }

    loading.style.display="none";
    btn.disabled=false;
});


document.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
        btn.click();
    }
});