/**
 * حاسبة معرض الصعيدي - لستة أسعار إيجيك v3.5
 * قائمة منسدلة فورية أسفل خانة البحث مع تحجيم تدريجي واختيار مرن وإرسال الفاتورة عبر واتساب
 */

let allProducts = [];
let filteredProducts = [];
let activeCategory = 'ALL';
let selectedTempProduct = null;
window.currentWhatsappMsg = "";

const SYNONYMS = {
    "1/2": "20 مم 20mm",
    "20": "20 مم 1/2",
    "3/4": "25 مم 25mm",
    "25": "25 مم 3/4",
    "1 بوصه": "32 مم 32mm",
    "1 بوصة": "32 مم 32mm",
    "32": "32 مم 1 بوصه 1 بوصة",
    "1.5": "50 مم 50mm",
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
    "تي": "مشترك",
    "تيه": "مشترك",
    "مشترك": "تي تيه",
    "واطية": "7 سم واطيه",
    "واطيه": "7 سم واطيه",
    "بوش": "مسلوب",
    "87": "87 درجة 87درجة 87.5",
    "87.5": "87 درجة 87درجة 87",
    "45": "45 درجة 45درجة"
};

function normalizeText(text) {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/درجة|درجه/g, '')
        .replace(/[\u064B-\u0652]/g, '')
        .trim();
}

function formatPrice(num) {
    const n = Number(num) || 0;
    return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2).replace(/\.00$/, '');
}

function updateClock() {
    const now = new Date();
    const dayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });
    const gregorian = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(now);
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const timeEl = document.getElementById('arabicTime');
    const hijriEl = document.getElementById('hijriDate');
    if (timeEl) timeEl.textContent = `⏰ ${timeString}`;
    if (hijriEl) hijriEl.textContent = `${dayName} • ${gregorian}م • ${hijri} هـ`;
}

function loadEgicCatalog() {
    allProducts = [];
    const categoriesSet = new Set();

    if (typeof productData !== 'undefined' && productData.egic && productData.egic.BR) {
        const brSections = productData.egic.BR;
        Object.keys(brSections).forEach((sectionKey) => {
            const items = brSections[sectionKey];
            if (Array.isArray(items) && items.length > 0) {
                categoriesSet.add(sectionKey);
                items.forEach((item, idx) => {
                    const cleanName = String(item.name || '').trim().replace(/\s+/g, ' ');
                    const priceVal = parseFloat(item.price) || 0;
                    const extraKeywords = cleanName.includes("مشترك") ? " تي تيه " : "";
                    const id = `egic_${sectionKey}_${idx}`.replace(/[^a-zA-Z0-9\u0600-\u06FF_]/g, '_');

                    allProducts.push({
                        id,
                        name: cleanName,
                        category: sectionKey,
                        price: priceVal,
                        searchable: normalizeText(`${cleanName} ${sectionKey} ${extraKeywords}`)
                    });
                });
            }
        });
    }

    renderCategoryTabs(Array.from(categoriesSet));
    filterAndRenderDropdown(true);
}

function getCategoriesFromData() {
    if (typeof productData !== 'undefined' && productData.egic && productData.egic.BR) {
        return Object.keys(productData.egic.BR);
    }
    return [];
}

function renderCategoryTabs(categories) {
    const tabsEl = document.getElementById('categoryTabs');
    if (!tabsEl) return;

    const allTabs = [{ key: 'ALL', label: 'الكل' }, ...categories.map(c => ({ key: c, label: c }))];
    tabsEl.innerHTML = '';

    allTabs.forEach((tab) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cat-tab-btn ${activeCategory === tab.key ? 'active' : ''}`;
        btn.textContent = tab.label;
        btn.onclick = () => {
            activeCategory = tab.key;
            tabsEl.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAndRenderDropdown(true);
        };
        tabsEl.appendChild(btn);
    });
}

function renderDropdownList(items, shouldShow) {
    const dropdown = document.getElementById('searchResultsDropdown');
    const searchInput = document.getElementById('productSearchInput');
    if (!dropdown || !searchInput) return;

    dropdown.innerHTML = '';

    if (!shouldShow) {
        dropdown.style.display = 'none';
        return;
    }

    if (items.length === 0) {
        dropdown.innerHTML = `<li class="dropdown-empty">لا يوجد صنف مطابق، جرّب تزويد حروف أو تغيير الكلمة</li>`;
        dropdown.style.display = 'block';
        return;
    }

    // نعرض حتى 30 نتيجة لسهولة التصفح بالنظر أو إكمال الكتابة
    items.slice(0, 30).forEach((item) => {
        const li = document.createElement('li');
        li.className = 'dropdown-option';
        li.setAttribute('role', 'option');
        li.innerHTML = `
            <span class="dropdown-item-title">${item.name}</span>
            <span class="dropdown-item-price">${formatPrice(item.price)} ج</span>
        `;
        li.addEventListener('click', () => {
            selectedTempProduct = item;
            searchInput.value = item.name;
            updateSelectedItemBar(item);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(li);
    });

    dropdown.style.display = 'block';
}

function filterAndRenderDropdown(resetSelection = false, openList = true) {
    const searchInput = document.getElementById('productSearchInput');
    const countEl = document.getElementById('matchCountText');

    const rawQuery = searchInput ? searchInput.value.trim() : '';
    const normalizedQuery = normalizeText(rawQuery);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const categoryItems = allProducts.filter((item) => {
        return activeCategory === 'ALL' || item.category === activeCategory;
    });

    if (tokens.length === 0) {
        filteredProducts = categoryItems;
        renderDropdownList(filteredProducts, false);
    } else {
        filteredProducts = categoryItems.filter((item) => {
            return tokens.every((token) => {
                const syn = SYNONYMS[token] ? normalizeText(SYNONYMS[token]) : '';
                return (
                    item.searchable.includes(token) ||
                    (syn && item.searchable.includes(syn))
                );
            });
        });

        const firstToken = tokens[0] || '';
        filteredProducts.sort((a, b) => {
            const aStarts = normalizeText(a.name).startsWith(firstToken) ? 0 : 1;
            const bStarts = normalizeText(b.name).startsWith(firstToken) ? 0 : 1;
            return aStarts - bStarts;
        });

        renderDropdownList(filteredProducts, openList);
    }

    if (countEl) {
        const catLabel = activeCategory === 'ALL' ? 'كل الأقسام' : activeCategory;
        if (tokens.length > 0) {
            countEl.textContent = `${catLabel} • المطابق لـ "${rawQuery}": ${filteredProducts.length} صنف (اختر من القائمة أو كمّل كتابة)`;
        } else {
            countEl.textContent = `${catLabel} • إجمالي البنود: ${filteredProducts.length} صنف (ابدأ بالكتابة لفتح القائمة)`;
        }
    }

    if (resetSelection) {
        selectedTempProduct = null;
        updateSelectedItemBar(null);
    }
}

function updateSelectedItemBar(item) {
    const bar = document.getElementById('selectedItemPriceBar');
    const nameEl = document.getElementById('selectedItemName');
    const priceEl = document.getElementById('selectedItemPrice');
    if (!bar || !nameEl || !priceEl) return;

    if (!item) {
        bar.style.display = 'none';
        nameEl.textContent = '';
        priceEl.textContent = '';
        return;
    }

    bar.style.display = 'flex';
    nameEl.textContent = item.name;
    priceEl.textContent = `${formatPrice(item.price)} ج.م`;
}

function stepQuickQty(delta) {
    const qtyInput = document.getElementById('quickQtyInput');
    if (!qtyInput) return;
    const current = parseFloat(qtyInput.value) || 1;
    const next = Math.max(0.5, current + delta);
    qtyInput.value = next;
}

function addSelectedItemToBill() {
    const searchInput = document.getElementById('productSearchInput');
    const qtyInput = document.getElementById('quickQtyInput');
    const qtyVal = parseFloat(qtyInput ? qtyInput.value : 1);

    // لو العميل كتب اسم صنف مطابق تماماً ولم يضغط على القائمة، نلتقطه تلقائياً
    if (!selectedTempProduct && searchInput && searchInput.value.trim()) {
        const normVal = normalizeText(searchInput.value.trim());
        const exactMatch = filteredProducts.find(p => normalizeText(p.name) === normVal);
        if (exactMatch) {
            selectedTempProduct = exactMatch;
        }
    }

    if (!selectedTempProduct) {
        alert("من فضلك اكتب للبحث واختر الصنف من القائمة أولاً.");
        if (searchInput) searchInput.focus();
        return;
    }

    if (!qtyVal || qtyVal <= 0) {
        alert("من فضلك حدد كمية صحيحة أكبر من الصفر.");
        if (qtyInput) qtyInput.focus();
        return;
    }

    const item = selectedTempProduct;
    const container = document.getElementById('itemsContainer');
    const emptyNotice = document.getElementById('emptyBillNotice');
    if (emptyNotice) emptyNotice.remove();

    const existingQtyInput = document.getElementById(`qty_${item.id}`);

    if (existingQtyInput) {
        const currentQty = parseFloat(existingQtyInput.value) || 0;
        existingQtyInput.value = currentQty + qtyVal;
        existingQtyInput.dispatchEvent(new Event('input'));
    } else {
        const card = document.createElement('div');
        card.className = 'product-item';
        card.id = `card_${item.id}`;

        card.innerHTML = `
            <div class="product-details">
                <div class="product-name">${item.name}</div>
                <div class="product-meta">${item.category} • سعر الوحدة: ${formatPrice(item.price)} ج</div>
            </div>
            <div class="product-controls">
                <button type="button" class="mini-step-btn" onclick="changeCardQty('${item.id}', -1)" aria-label="تقليل الكمية">−</button>
                <input
                    type="number"
                    id="qty_${item.id}"
                    class="qty-input"
                    data-name="${item.name}"
                    data-price="${item.price}"
                    value="${qtyVal}"
                    min="0.5"
                    step="any"
                    oninput="updateLiveTotal()"
                >
                <button type="button" class="mini-step-btn" onclick="changeCardQty('${item.id}', 1)" aria-label="زيادة الكمية">+</button>
                <button type="button" class="remove-item-btn" onclick="removeItemCard('card_${item.id}')" aria-label="حذف الصنف">✕</button>
            </div>
        `;
        container.prepend(card);
    }

    updateLiveTotal();

    if (qtyInput) qtyInput.value = '1';
    selectedTempProduct = null;
    if (searchInput) {
        searchInput.value = '';
    }
    updateSelectedItemBar(null);
    renderDropdownList([], false);
}

function changeCardQty(itemId, delta) {
    const input = document.getElementById(`qty_${itemId}`);
    if (!input) return;
    const current = parseFloat(input.value) || 0;
    const next = current + delta;
    if (next <= 0) {
        removeItemCard(`card_${itemId}`);
    } else {
        input.value = next;
        updateLiveTotal();
    }
}

function removeItemCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) card.remove();

    const container = document.getElementById('itemsContainer');
    if (container && container.querySelectorAll('.product-item').length === 0) {
        container.innerHTML = `
            <div id="emptyBillNotice" class="empty-bill-notice">
                لم يتم إضافة أصناف بعد. اختَر القسم وابحث أو اختَر الصنف من القائمة وحدد الكمية لإملاء الفاتورة.
            </div>
        `;
    }
    updateLiveTotal();
}

function updateLiveTotal() {
    let total = 0;
    let itemsCount = 0;

    document.querySelectorAll('[id^="qty_"]').forEach((input) => {
        const q = parseFloat(input.value);
        const price = parseFloat(input.dataset.price);
        if (!isNaN(q) && q > 0 && !isNaN(price)) {
            total += q * price;
            itemsCount += 1;
        }
    });

    const totalEl = document.getElementById('totalResult');
    const countPill = document.getElementById('billItemsCount');
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (countPill) countPill.textContent = `${itemsCount} ${itemsCount === 1 ? 'بند' : 'بنود'}`;
}

function calculateTotal() {
    let total = 0;
    let itemsHtml = "";
    let whatsappMsg = "📝 *فاتورة معرض الصعيدي (لستة أسعار إيجيك)*\n";
    whatsappMsg += "━━━━━━━━━━━━━━━\n";

    const inputs = document.querySelectorAll('[id^="qty_"]');
    let hasItems = false;

    inputs.forEach((input) => {
        const q = parseFloat(input.value);
        if (!isNaN(q) && q > 0) {
            hasItems = true;
            const price = parseFloat(input.dataset.price);
            const sub = q * price;
            total += sub;
            const name = input.dataset.name;

            itemsHtml += `
                <div class="preview-row">
                    <div>
                        <div class="preview-item-name">${name}</div>
                        <div class="preview-item-calc">الكمية: ${q} × ${formatPrice(price)} ج</div>
                    </div>
                    <strong class="preview-item-sub">${formatPrice(sub)} ج</strong>
                </div>
            `;

            whatsappMsg += `• *${name}*\n  الكمية: ${q} × ${formatPrice(price)} = *${formatPrice(sub)} ج.م*\n`;
        }
    });

    if (!hasItems) {
        alert("أضف صنفاً واحداً على الأقل في الفاتورة أولاً.");
        return;
    }

    document.getElementById('previewContent').innerHTML = itemsHtml + `
        <div class="preview-total-box">
            الإجمالي التقديري: ${formatPrice(total)} ج.م
        </div>
    `;

    window.currentWhatsappMsg = whatsappMsg + "━━━━━━━━━━━━━━━\n" + `💰 *الإجمالي التقديري: ${formatPrice(total)} ج.م*`;
    document.getElementById('previewModal').style.display = 'flex';
}

function sendToWhatsApp() {
    const phone = "201122019099";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(window.currentWhatsappMsg)}`, '_blank', 'noopener,noreferrer');
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
}

function startNewOrder() {
    const hasItems = document.querySelectorAll('[id^="qty_"]').length > 0;
    if (!hasItems || confirm("هل تريد مسح الفاتورة الحالية وبدء فاتورة جديدة؟")) {
        const container = document.getElementById('itemsContainer');
        if (container) {
            container.innerHTML = `
                <div id="emptyBillNotice" class="empty-bill-notice">
                    لم يتم إضافة أصناف بعد. اختَر القسم وابحث أو اختَر الصنف من القائمة وحدد الكمية لإملاء الفاتورة.
                </div>
            `;
        }
        const searchInput = document.getElementById('productSearchInput');
        if (searchInput) searchInput.value = '';
        const qtyInput = document.getElementById('quickQtyInput');
        if (qtyInput) qtyInput.value = '1';

        activeCategory = 'ALL';
        renderCategoryTabs(getCategoriesFromData());
        filterAndRenderDropdown(true, false);
        updateLiveTotal();
    }
}

function bindControls() {
    const searchInput = document.getElementById('productSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('searchResultsDropdown');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            selectedTempProduct = null;
            updateSelectedItemBar(null);
            filterAndRenderDropdown(false, true);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                filterAndRenderDropdown(false, true);
            }
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            selectedTempProduct = null;
            updateSelectedItemBar(null);
            renderDropdownList([], false);
            filterAndRenderDropdown(false, false);
            searchInput.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (
            dropdown &&
            searchInput &&
            !searchInput.contains(e.target) &&
            !dropdown.contains(e.target)
        ) {
            dropdown.style.display = 'none';
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 60000);
    bindControls();
    loadEgicCatalog();
    updateLiveTotal();
});
