/**
 * حاسبة معرض الصعيدي الماركة المسجلة v3.3 (مُحدثة بمحرك البحث التراكمي الشامل)
 * دعم الإدخال السريع، التنقل بـ Enter، الفهرسة التلقائية لكيسيل وسمارت، وتحويل الدرجات والمقاسات
 */

let activeCompanyKey = 'egic'; 
let currentCompanyProducts = []; 
window.currentWhatsappMsg = ""; 

// ==========================================
// 1. قاموس المصطلحات والمقاسات والزوايا البديلة (SYNONYMS)
// ==========================================
const SYNONYMS = {
    // المقاسات والتكافؤ (بوصة ↔ مم)
    "1/2": "20 مم 20mm",
    "20": "20 مم 1/2",
    "3/4": "25 مم 25mm",
    "25": "25 مم 3/4",
    "1 بوصه": "32 مم 32mm",
    "1 بوصة": "32 مم 32mm",
    "32": "32 مم 1 بوصه 1 بوصة",
    "1.5": "50 مم 50mm",
    "1.5 بوصه": "50 مم 50mm",
    "1.5 بوصة": "50 مم 50mm",
    "50": "50 مم 1.5",
    "2 بوصه": "63 مم 63mm",
    "2 بوصة": "63 مم 63mm",
    "63": "63 مم 2 بوصه 2 بوصة",
    "3 بوصه": "75 مم 75mm",
    "3 بوصة": "75 مم 75mm",
    "75": "75 مم 3 بوصه 3 بوصة",
    "4 بوصه": "110 مم 110mm",
    "4 بوصة": "110 مم 110mm",
    "110": "110 مم 4 بوصه 4 بوصة",
    "6 بوصه": "160 مم 160mm",
    "6 بوصة": "160 مم 160mm",
    "160": "160 مم 6 بوصه 6 بوصة",

    // المصطلحات الفنية والتجارية
    "تي": "مشترك",
    "تيه": "مشترك",
    "مشترك": "تي تيه",
    "بيبة واطية": "بيبة 7 سم واطيه واطية",
    "بيبه واطيه": "بيبة 7 سم واطيه واطية",
    "واطية": "7 سم واطيه",
    "واطيه": "7 سم واطية",
    "بيبه": "بيبة",
    "جرجوري": "جرجوري مطر",
    "بوش": "مسلوب",

    // درجات الزوايا الشائعة في الصرف (كيسيل وسمارت)
    "87": "87 درجة 87درجة 87.5",
    "87.5": "87 درجة 87درجة 87",
    "45": "45 درجة 45درجة"
};

// دالة تنظيف وتوحيد النصوص لضمان مطابقة التنوين وكلمة "درجة"
function normalizeText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/درجة|درجه/g, '') // إزالة كلمة درجة للتساوي التلقائي مع الأرقام
        .replace(/[\u064B-\u0652]/g, '') // إزالة التشكيل
        .trim();
}



// تحديث الوقت والتاريخ بشكل احترافي ومنسق
function updateClock() {
    const now = new Date();
    
    // اسم اليوم (مثال: الإثنين)
    const optionsDay = { weekday: 'long' };
    const dayName = now.toLocaleDateString('ar-EG', optionsDay);
    
    // التاريخ الميلادي (مثال: 7/9/2026)
    const gregorian = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    
    // التاريخ الهجري (مثال: 26 ربيع الأول 1448 هـ)
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
    }).format(now);
    
    // الوقت (مثال: 07:49:46 م)
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // تجميع النصوص بالترتيب المطلوب
    const fullDateText = `📅 اليوم: ${dayName} | 📆 ميلادي: ${gregorian} | 🌙 هجري: ${hijri} هـ`;
    
    // ضخ الوقت في المنتصف بلون أخضر فسفوري هادئ ومريح للعين
    const timeEl = document.getElementById('arabicTime');
    if(timeEl) {
        timeEl.innerHTML = `⏰ ${timeString}`;
    }
    
    // ضخ التاريخ الكامل في الأسفل
    const hijriEl = document.getElementById('hijriDate');
    if(hijriEl) {
        hijriEl.textContent = fullDateText;
    }
}

setInterval(updateClock, 1000);
updateClock();


const brandDisplayNames = {
    "BR": "إيجيك BR (تغذية بولي)",
    "SMART": "سمارت (صرف أبيض)",
    "KESSEL": "كيسيل (صرف رمادي)"
};

// ==========================================
// 2. دالة بناء وإعداد بيانات الشركات (معالجة كيسيل وسمارت بذكاء)
// ==========================================
function selectCompany(co, el) {
    activeCompanyKey = 'egic';
    
    const brandsSec = document.getElementById('brandsSection');
    const searchSec = document.getElementById('searchSection');
    if (brandsSec) brandsSec.style.display = 'none';
    if (searchSec) searchSec.style.display = 'block';

    if (document.getElementById('subSectionsContainer')) document.getElementById('subSectionsContainer').style.display = 'none';
    if (document.getElementById('sizesContainer')) document.getElementById('sizesContainer').style.display = 'none';
    document.getElementById('itemsContainer').innerHTML = '';

    const titleEl = document.getElementById('selectedCompanyTitle');
    if (titleEl) {
        titleEl.textContent = `تسعير منتجات: المصرية الألمانية (إيجيك / سمارت / كيسيل)`;
    }

    currentCompanyProducts = [];
    const cKey = 'egic';

    if (typeof productData !== 'undefined' && productData[cKey]) {
        Object.keys(productData[cKey]).forEach(subKey => {
            const brandReadable = brandDisplayNames[subKey] || subKey;
            
            Object.keys(productData[cKey][subKey]).forEach(categoryOrSize => {
                const items = productData[cKey][subKey][categoryOrSize];
                
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const fullNameRaw = `${item.name} ${brandReadable}`;
                        
                        // توليد كلمات مفتاحية إضافية للأصناف التي لا تحتوي اسم البراند صراحة
                        let extraKeywords = "";
                        if (item.name.includes("مشترك") || categoryOrSize.includes("مشترك")) {
                            extraKeywords += " تي تيه ";
                        }
                        if (brandReadable.includes("كيسيل") || subKey.toUpperCase() === "KESSEL") {
                            extraKeywords += " كيسيل kessel صرف رمادي ";
                        }
                        if (brandReadable.includes("سمارت") || subKey.toUpperCase() === "SMART") {
                            extraKeywords += " سمارت smart صرف ابيض ";
                        }

                        const searchIndex = `${item.name} ${categoryOrSize} ${brandReadable} ${extraKeywords}`;

                        currentCompanyProducts.push({
                            id: `${cKey}_${subKey}_${item.name}`.replace(/[^a-zA-Z0-9]/g, '_'),
                            fullName: fullNameRaw,
                            shortName: item.name,
                            size: categoryOrSize,
                            brand: brandReadable,
                            price: item.price,
                            searchableText: normalizeText(searchIndex)
                        });
                    });
                }
            });
        });
    }

    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
}

function resetCompanySelection() {
    document.getElementById('brandsSection').style.display = 'block';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('searchResultsDropdown').style.display = 'none';
    document.getElementById('itemsContainer').innerHTML = '';
    
    document.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

let selectedTempProduct = null;

// ==========================================
// 3. محرك البحث التراكمي المطور (Prefix & Priority Search)
// ==========================================
function setupLiveSearch() {
    const input = document.getElementById('productSearchInput');
    const dropdown = document.getElementById('searchResultsDropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        let rawQuery = this.value.trim();
        dropdown.innerHTML = '';
        selectedTempProduct = null;

        if (rawQuery.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        // تنظيف النص وتفكيكه
        let normalizedQuery = normalizeText(rawQuery);
        const searchTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

        // تصفية المنتجات تراكمياً
        let matches = currentCompanyProducts.filter(product => {
            return searchTokens.every(token => {
                const synonym = SYNONYMS[token] ? normalizeText(SYNONYMS[token]) : "";
                return product.searchableText.includes(token) || 
                      (synonym && product.searchableText.includes(synonym));
            });
        });

        // ترتيب النتائج لتظهر الكلمات التي تبدأ بالحرف المدخل أولاً
        const firstToken = searchTokens[0];
        matches.sort((a, b) => {
            const aStartsWith = normalizeText(a.shortName).startsWith(firstToken);
            const bStartsWith = normalizeText(b.shortName).startsWith(firstToken);

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return 0;
        });

        // عرض القائمة المنسدلة
        if (matches.length > 0) {
            matches.slice(0, 15).forEach((item) => {
                const li = document.createElement('li');
                li.style.cssText = "padding:10px; border-bottom:1px solid #f1f5f9; cursor:pointer; display:flex; justify-content:space-between; align-items:center;";
                li.innerHTML = `
                    <div>
                        <strong style="display:block; color:#0f172a;">${item.shortName}</strong>
                        <small style="color:#64748b;">${item.brand} | ${item.size}</small>
                    </div>
                    <span style="font-weight:bold; color:#0052cc;">${item.price} ج</span>
                `;
                
                li.onclick = () => {
                    selectProductToRow(item);
                };

                dropdown.appendChild(li);
            });
            dropdown.style.display = 'block';
        } else {
            dropdown.innerHTML = `<li style="padding:10px; text-align:center; color:#94a3b8;">لا يوجد صنف مطابق</li>`;
            dropdown.style.display = 'block';
        }
    });

    // اختيار أول صنف عند الضغط على Enter في مربع البحث
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstLi = dropdown.querySelector('li');
            if (firstLi && dropdown.style.display !== 'none') {
                firstLi.click();
            }
        }
    });

    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// ==========================================
// 4. إدارة الفاتورة والإضافة
// ==========================================
function selectProductToRow(item) {
    selectedTempProduct = item;
    const input = document.getElementById('productSearchInput');
    const qtyInput = document.getElementById('quickQtyInput');
    const dropdown = document.getElementById('searchResultsDropdown');

    input.value = `${item.shortName} (${item.size})`;
    dropdown.style.display = 'none';
    
    if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
    }
}

function addSelectedItemToBill() {
    const input = document.getElementById('productSearchInput');
    const qtyInput = document.getElementById('quickQtyInput');
    const qtyVal = parseFloat(qtyInput ? qtyInput.value : 1) || 1;

    if (!selectedTempProduct) {
        alert("يرجى اختيار صنف من القائمة أولاً يا هندسة!");
        input.focus();
        return;
    }

    const item = selectedTempProduct;
    const container = document.getElementById('itemsContainer');
    const existingQtyInput = document.getElementById(`qty_${item.id}`);

    if (existingQtyInput) {
        const currentQty = parseFloat(existingQtyInput.value) || 0;
        existingQtyInput.value = currentQty + qtyVal;
    } else {
        const itemCard = document.createElement('div');
        itemCard.className = 'product-item';
        itemCard.id = `card_${item.id}`;
        
        itemCard.innerHTML = `
            <div class="product-details">
                <div class="product-name">${item.shortName}</div>
                <div style="font-size:12px; color:#64748b;">${item.brand} - ${item.size}</div>
            </div>
            
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="product-price-tag">${item.price} ج</span>
                <input type="number" 
                       id="qty_${item.id}"
                       class="qty-input"
                       data-name="${item.shortName} (${item.size} - ${item.brand})" 
                       data-price="${item.price}" 
                       value="${qtyVal}"
                       min="1"
                       style="width:60px; text-align:center;"
                       oninput="updateLiveTotal()"
                       onkeydown="handleQtyEnter(event)">
                <button onclick="removeItemCard('card_${item.id}')" style="background:none; border:none; color:#ef4444; font-size:18px; cursor:pointer;">✕</button>
            </div>
        `;
        container.prepend(itemCard);
    }

    updateLiveTotal();
    selectedTempProduct = null;
    input.value = '';
    if (qtyInput) qtyInput.value = '1';
    input.focus();
}

function handleQtyEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchInput = document.getElementById('productSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
            window.scrollTo({ top: searchInput.offsetTop - 20, behavior: 'smooth' });
        }
    }
}

function removeItemCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.remove();
        updateLiveTotal();
    }
}

function updateLiveTotal() {
    let total = 0;
    document.querySelectorAll('[id^="qty_"]').forEach(i => {
        const val = parseFloat(i.value);
        if(!isNaN(val) && val > 0) {
            total += (val * parseFloat(i.dataset.price));
        }
    });
    const totalEl = document.getElementById('totalResult');
    if (totalEl) totalEl.innerText = total.toLocaleString('en-US');
}

function calculateTotal() {
    let total = 0;
    let itemsHtml = "";
    let whatsappMsg = "📝 *فاتورة معرض الصعيدي (منتجات إيجيك)*\n";
    whatsappMsg += "━━━━━━━━━━━━━━━\n";

    const inputs = document.querySelectorAll('[id^="qty_"]');
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

    if(!hasItems) return alert("يا هندسة، اختار أصناف ودخل الكميات الأول!");

    document.getElementById('previewContent').innerHTML = itemsHtml + 
        `<div style="text-align:center; font-size:20px; font-weight:bold; color:#0f172a; margin-top:15px; border-top:2px solid #0052cc; padding-top:10px;">
            الإجمالي النهائي: ${total.toLocaleString()} ج.م
        </div>`;
    
    document.getElementById('previewModal').style.display = 'flex';
    window.currentWhatsappMsg = whatsappMsg + "━━━━━━━━━━━━━━━\n" + `💰 *الإجمالي النهائي: ${total.toLocaleString()} جنيه*`;
}

function sendToWhatsApp() {
    const phone = "201122019099"; 
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(window.currentWhatsappMsg)}`);
}

function closePreview() { 
    document.getElementById('previewModal').style.display = 'none'; 
}

function startNewOrder() { 
    if(confirm("هل تريد مسح البيانات وبدء طلب جديد؟")) {
        document.getElementById('itemsContainer').innerHTML = '';
        if (document.getElementById('totalResult')) document.getElementById('totalResult').innerText = '0';
        
        const searchInput = document.getElementById('productSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
}

window.onload = () => { 
    updateClock(); 
    setupLiveSearch();
    selectCompany('egic');
};
