/**
 * حاسبة معرض الصعيدي الماركة المسجلة
 * نظام التنقل السريع والفوترة الذكية - نسخة منقحة بدون بحث
 */

// 1. المتغيرات العالمية
let currentCo = ''; 
let currentSub = ''; 
let currentSz = '';
window.currentWhatsappMsg = ""; 

// 2. تحديث الساعة والتاريخ (هجري وميلادي)
function updateClock() {
    const now = new Date();
    // عرض التاريخ الهجري
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day:'numeric', month:'long', year:'numeric'}).format(now);
    if(document.getElementById('hijriDate')) document.getElementById('hijriDate').textContent = hijri;
    // عرض الوقت بالعربي
    if(document.getElementById('arabicTime')) document.getElementById('arabicTime').textContent = now.toLocaleTimeString('ar-EG');
}
setInterval(updateClock, 1000);

// 3. نظام اختيار الشركات (المنطق المطور لدمج المجموعات)
function selectCompany(co, el) {
    currentCo = co; currentSub = ''; currentSz = '';
    
    // تمييز الكارت المختار
    document.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');
    
    const subContainer = document.getElementById('subSectionsContainer');
    const szContainer = document.getElementById('sizesContainer');
    const itemsContainer = document.getElementById('itemsContainer');

    subContainer.innerHTML = '';
    szContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    
    // منطق التعامل مع "بيلسا ومجموعتها" أو الشركات العادية
    if (co === 'belissa_group') {
        const brands = [
              { name: "بيلسا ثيرم", key: "belissa", sub: "THERM" },
              { name: "بيلسا وايت", key: "pilsa_white", sub: "WHITE" },
              { name: "أكوا نايل", key: "aqua_nil", sub: "GAWAN" }
        ];
        brands.forEach(brand => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.innerText = brand.name;
            btn.onclick = (e) => {
                currentCo = brand.key;
                selectSub(brand.sub, e.target);
            };
            subContainer.appendChild(btn);
        });
    } else if(productData[co]) {
        Object.keys(productData[co]).forEach(sub => {
            subContainer.innerHTML += `<button class="tab-btn" onclick="selectSub('${sub}', this)">${sub}</button>`;
        });
    }
}

// اختيار القسم الفرعي (بي آر، سمارت، إلخ)
function selectSub(sub, el) {
    currentSub = sub; currentSz = '';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    const szContainer = document.getElementById('sizesContainer');
    szContainer.innerHTML = '';
    document.getElementById('itemsContainer').innerHTML = '';
    
    if (productData[currentCo] && productData[currentCo][currentSub]) {
        const sizes = Object.keys(productData[currentCo][currentSub]);
        sizes.forEach(sz => {
            szContainer.innerHTML += `<div class="chip" onclick="selectSize('${sz}', this)">${sz}</div>`;
        });
    }
}

// اختيار المقاس (المستوى الثالث)
function selectSize(sz, el) {
    currentSz = sz;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');
    
    if (productData[currentCo] && productData[currentCo][currentSub]) {
        renderItems(productData[currentCo][currentSub][sz]);
    }
}

// 4. عرض العناصر (التصميم المدمج)
function renderItems(items) {
    const container = document.getElementById('itemsContainer');
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد أصناف حالياً</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="product-item">
            <div class="item-details">
                <span class="product-name">${item.name}</span>
                <span class="product-info-small">${currentSub} - ${currentSz}</span>
            </div>
            
            <div class="item-action">
                <span class="product-price-tag">${item.price} ج</span>
                <input type="number" class="qty-input" 
                       data-name="${item.name} (${currentSz})" 
                       data-price="${item.price}" 
                       placeholder="0" 
                       inputmode="decimal"
                       min="0"
                       oninput="updateLiveTotal()">
            </div>
        </div>
    `).join('');
}

// 5. الحسابات والواتساب
function updateLiveTotal() {
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(i => {
        const val = parseFloat(i.value);
        if(!isNaN(val) && val > 0) {
            total += (val * parseFloat(i.dataset.price));
        }
    });
    document.getElementById('totalResult').innerText = total.toLocaleString('en-US');
}

function calculateTotal() {
    let total = 0;
    let itemsHtml = "";
    let whatsappMsg = "📝 *فاتورة معرض الصعيدي*\n";
    whatsappMsg += "━━━━━━━━━━━━━━━\n";

    const inputs = document.querySelectorAll('.qty-input');
    let hasItems = false;

    inputs.forEach(i => {
        const q = parseFloat(i.value);
        if(q > 0) {
            hasItems = true;
            const price = parseFloat(i.dataset.price);
            const sub = q * price;
            total += sub;

            itemsHtml += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px; font-size:14px;">
                    <span>${i.dataset.name} <br> <small>(عدد ${q} × ${price})</small></span>
                    <b style="color:#0052cc;">${sub.toLocaleString()} ج</b>
                </div>`;

            whatsappMsg += `🔹 *${i.dataset.name}*\n   الكمية: ${q} × ${price} = *${sub.toLocaleString()} ج.م*\n`;
        }
    });

    if(!hasItems) return alert("يا هندسة، دخل الكميات الأول!");

    document.getElementById('previewContent').innerHTML = itemsHtml + 
        `<div style="text-align:center; font-size:20px; font-weight:bold; color:#0f172a; margin-top:15px; border-top:2px solid #0052cc; padding-top:10px;">
            الإجمالي النهائي: ${total.toLocaleString()} ج.م
        </div>`;
    
    document.getElementById('previewModal').style.display = 'flex';
    window.currentWhatsappMsg = whatsappMsg + "━━━━━━━━━━━━━━━\n" + `💰 *الإجمالي النهائي: ${total.toLocaleString()} جنيه*`;
}

// 6. وظائف مساعدة
function sendToWhatsApp() {
    const phone = "201122019099"; 
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(window.currentWhatsappMsg)}`);
}

function closePreview() { 
    document.getElementById('previewModal').style.display = 'none'; 
}

function startNewOrder() { 
    if(confirm("هل تريد مسح البيانات وبدء طلب جديد؟")) {
        document.querySelectorAll('.qty-input').forEach(i => i.value = '');
        document.getElementById('totalResult').innerText = '0';
        
        // إعادة عرض الأصناف الحالية فارغة لضمان عدم حدوث زغللة
        if(productData[currentCo] && productData[currentCo][currentSub] && currentSz) {
            renderItems(productData[currentCo][currentSub][currentSz]);
        }
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
}

window.onload = () => { 
    updateClock(); 
    console.log("نظام معرض الصعيدي جاهز للعمل ✅");
};
