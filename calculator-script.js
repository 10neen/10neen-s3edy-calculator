/**
 * حاسبة معرض الصعيدي الماركة المسجلة
 * نظام البحث الشامل والفوترة الذكية
 */

// 1. المتغيرات العالمية
let currentCo = ''; 
let currentSub = ''; 
let currentSz = '';
let allProductsFlat = []; 
window.currentWhatsappMsg = ""; 

// 2. تجهيز البيانات للبحث الشامل (نظام الفلات) - معالجة الأخطاء لضمان استقرار التطبيق
function prepareSearchData() {
    allProductsFlat = [];
    if (typeof productData === 'undefined') {
        console.error("خطأ: لم يتم العثور على ملف productData.js");
        return;
    }

    for (let co in productData) {
        for (let sub in productData[co]) {
            for (let sz in productData[co][sub]) {
                const items = productData[co][sub][sz];
                // التأكد أن البيانات مصفوفة Array لتجنب خطأ forEach is not a function
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        allProductsFlat.push({
                            ...item,
                            brandName: sub,
                            sizeName: sz,
                            companyKey: co
                        });
                    });
                }
            }
        }
    }
}

// 3. تحديث الساعة والتاريخ (هجري وميلادي)
function updateClock() {
    const now = new Date();
    // عرض التاريخ الهجري
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day:'numeric', month:'long', year:'numeric'}).format(now);
    if(document.getElementById('hijriDate')) document.getElementById('hijriDate').textContent = hijri;
    // عرض الوقت بالعربي
    if(document.getElementById('arabicTime')) document.getElementById('arabicTime').textContent = now.toLocaleTimeString('ar-EG');
}
setInterval(updateClock, 1000);

// 4. نظام اختيار الشركات (المنطق المطور لدمج المجموعات)
function selectCompany(co, el) {
    // تحديث مخزن البحث في الخلفية
    prepareSearchData(); 
    
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
    
    // منطق التعامل مع "بيلسا ومجموعتها"
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
        // الشركات العادية (مثل المصرية الألمانية)
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

// 5. عرض العناصر (التصميم المدمج Compact - حل مشكلة الزغللة)
function renderItems(items, isSearch = false) {
    const container = document.getElementById('itemsContainer');
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد نتائج</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="product-item" style="${isSearch ? 'border-right: 5px solid #ffcc00; background:#fffcf0;' : ''}">
            <div class="item-details">
                <span class="product-name">${item.name}</span>
                <span class="product-info-small">${item.brandName || currentSub} - ${item.sizeName || currentSz || 'عام'}</span>
            </div>
            
            <div class="item-action">
                <span class="product-price-tag">${item.price} ج</span>
                <input type="number" class="qty-input" 
                       data-name="${item.name} (${item.sizeName || currentSz || 'عام'})" 
                       data-price="${item.price}" 
                       placeholder="0" 
                       inputmode="decimal"
                       min="0"
                       oninput="updateLiveTotal()">
            </div>
        </div>
    `).join('');
}

// 6. محرك البحث الذكي (فلترة فورية وشاملة)


// 6. محرك البحث الذكي المطور (يدعم الأرقام المتصلة واختلاف المسافات)
function filterProducts() {
    const input = document.getElementById('searchInput').value.trim().toLowerCase();
    const container = document.getElementById('itemsContainer');
    
    if (input.length < 2) {
        if(!currentSub) container.innerHTML = '';
        return;
    }

    // "اللمسة الذكية": تقسيم نص البحث إلى كلمات مستقلة
    // مثلاً "كوع3/4" تتحول إلى ["كوع", "3/4"] باستخدام Regex
    const searchTerms = input.split(/(\d+\/\d+|\d+|\s+)/).filter(t => t.trim().length > 0);

    const results = allProductsFlat.filter(product => {
        const productTitle = (product.name + " " + product.brandName).toLowerCase();
        
        // يجب أن يحتوي المنتج على "كل" الكلمات التي كتبها المستخدم بأي ترتيب
        return searchTerms.every(term => productTitle.includes(term));
    });

    if (results.length === 0) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:#666;">
                <div style="font-size:40px; margin-bottom:10px;">🔍</div>
                <p>للأسف مفيش نتائج مطابقة لـ "<b>${input}</b>"</p>
                <small>جرب تكتب اسم الصنف أو المقاس بطريقة تانية</small>
            </div>`;
    } else {
        renderItems(results.slice(0, 50), true); 
    }
}




// 7. الحسابات والواتساب
function updateLiveTotal() {
    let total = 0;
    document.querySelectorAll('.qty-input').forEach(i => {
        const val = parseFloat(i.value);
        if(!isNaN(val) && val > 0) {
            total += (val * parseFloat(i.dataset.price));
        }
    });
    // تحديث الإجمالي في الفوتر بفاصل آلاف
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

            // بناء المعاينة المرئية
            itemsHtml += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px; font-size:14px;">
                    <span>${i.dataset.name} <br> <small>(عدد ${q} × ${price})</small></span>
                    <b style="color:#003366;">${sub.toLocaleString()} ج</b>
                </div>`;

            // بناء رسالة الواتساب
            whatsappMsg += `🔹 *${i.dataset.name}*\n   الكمية: ${q} × ${price} = *${sub.toLocaleString()} ج.م*\n`;
        }
    });

    if(!hasItems) return alert("يا هندسة، دخل الكميات الأول!");

    // إظهار المودال (النافذة المنبثقة)
    document.getElementById('previewContent').innerHTML = itemsHtml + 
        `<div style="text-align:center; font-size:20px; font-weight:bold; color:#003366; margin-top:15px; border-top:2px solid #003366; padding-top:10px;">
            الإجمالي النهائي: ${total.toLocaleString()} ج.م
        </div>`;
    
    document.getElementById('previewModal').style.display = 'flex';
    
    // حفظ الرسالة لاستخدامها عند الضغط على زر واتساب
    window.currentWhatsappMsg = whatsappMsg + "━━━━━━━━━━━━━━━\n" + `💰 *الإجمالي النهائي: ${total.toLocaleString()} جنيه*`;
}

// 8. وظائف مساعدة
function sendToWhatsApp() {
    const phone = "201122019099"; // رقم المعرض
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(window.currentWhatsappMsg)}`);
}

function closePreview() { 
    document.getElementById('previewModal').style.display = 'none'; 
}

function startNewOrder() { 
    if(confirm("هل تريد مسح البيانات وبدء طلب جديد؟")) {
        location.reload(); 
    }
}

// تشغيل النظام عند التحميل
window.onload = () => { 
    updateClock(); 
    prepareSearchData(); 
    console.log("تم تحميل نظام معرض الصعيدي بنجاح ✅");
};
