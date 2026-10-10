(function () {
  'use strict';

  /* Set this to your checkout page (Stripe, Shopify, or your own) before launch. */
  var CHECKOUT_URL = '';

  var MODELS = [
    { id: 'iphone-17', name: 'iPhone 17', brand: 'iphone' },
    { id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'iphone' },
    { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', brand: 'iphone' },
    { id: 'galaxy-s25', name: 'Galaxy S25', brand: 'galaxy' },
    { id: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra', brand: 'galaxy' },
    { id: 'pixel-10', name: 'Pixel 10', brand: 'pixel' },
    { id: 'pixel-10-pro', name: 'Pixel 10 Pro', brand: 'pixel' }
  ];
  var BRAND_LABELS = { iphone: 'Apple', galaxy: 'Samsung', pixel: 'Google' };

  var COLORS = {
    sand:   { name: 'Sand',   hex: '#D8C6A0' },
    slate:  { name: 'Slate',  hex: '#56626C' },
    moss:   { name: 'Moss',   hex: '#52663F' },
    rust:   { name: 'Rust',   hex: '#A94A2C' },
    ink:    { name: 'Ink',    hex: '#1D2124' },
    cobalt: { name: 'Cobalt', hex: '#2450C8' },
    tan:    { name: 'Tan',    hex: '#A8703F' },
    clear:  { name: 'Clear',  hex: '#FFFFFF' }
  };

  var PRODUCTS = [
    { id: 'slim', name: 'Slim', price: 20, style: 'slim',
      desc: 'A thin matte shell that keeps the phone close to its original size.',
      colors: ['sand', 'slate', 'moss', 'ink'] },
    { id: 'silicone', name: 'Soft silicone', price: 24, style: 'silicone',
      desc: 'A soft, grippy case with a lip that sits above the screen.',
      colors: ['sand', 'slate', 'moss', 'rust', 'ink', 'cobalt'] },
    { id: 'clear', name: 'Clear', price: 22, style: 'clear',
      desc: 'A transparent shell that shows the color of your phone.',
      colors: ['clear'] },
    { id: 'rugged', name: 'Rugged', price: 34, style: 'rugged',
      desc: 'Thick corners and a textured back for rougher days.',
      colors: ['slate', 'moss', 'ink', 'rust'] },
    { id: 'leather', name: 'Leather', price: 42, style: 'leather',
      desc: 'A leather back with contrast stitching around the edge.',
      colors: ['tan', 'ink'] },
    { id: 'wallet', name: 'Card wallet', price: 36, style: 'wallet',
      desc: 'A slim case with a pocket on the back for one or two cards.',
      colors: ['ink', 'slate', 'tan'] }
  ];

  var STORE_KEY = 'holdfast-state-v1';
  var MAX_QTY = 10;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    model: $('model'), grid: $('grid'), heroArt: $('heroArt'),
    shopTitle: $('shopTitle'), shopLede: $('shopLede'),
    cartOpen: $('cartOpen'), cartCount: $('cartCount'), cart: $('cart'),
    backdrop: $('backdrop'), cartClose: $('cartClose'), cartBody: $('cartBody'),
    subtotal: $('subtotal'), checkout: $('checkout'), checkoutNote: $('checkoutNote'),
    live: $('live'), page: $('page')
  };

  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  var moneyExact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  var state = { model: MODELS[0].id, cart: [] };
  var picks = {};

  function findModel(id) { return MODELS.filter(function (m) { return m.id === id; })[0]; }
  function findProduct(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && findModel(saved.model)) state.model = saved.model;
      if (saved && Array.isArray(saved.cart)) {
        state.cart = saved.cart.filter(function (i) {
          var p = findProduct(i.id);
          return p && p.colors.indexOf(i.color) !== -1 && findModel(i.model) &&
            typeof i.qty === 'number' && i.qty >= 1 && i.qty <= MAX_QTY;
        });
      }
    } catch (e) { /* storage unavailable: continue without saving */ }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------- Case artwork (schematic SVG, no photos) ---------- */

  function lens(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#3D474D"/>' +
           '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 3) + '" fill="#0A0C0D"/>';
  }

  function camera(brand) {
    var dark = '#1F2529';
    if (brand === 'iphone') {
      return '<rect x="30" y="30" width="78" height="78" rx="22" fill="' + dark + '"/>' +
             lens(56, 56, 13) + lens(82, 82, 13) +
             '<circle cx="84" cy="55" r="4" fill="#CFD3D6"/>';
    }
    if (brand === 'galaxy') {
      return [58, 98, 138].map(function (y) {
        return '<circle cx="52" cy="' + y + '" r="18" fill="' + dark + '"/>' + lens(52, y, 13);
      }).join('');
    }
    return '<rect x="22" y="58" width="156" height="58" rx="29" fill="' + dark + '"/>' +
           lens(62, 87, 16) + lens(104, 87, 16) +
           '<circle cx="148" cy="87" r="5" fill="#CFD3D6"/>';
  }

  function details(style) {
    var out = '';
    var i;
    if (style === 'silicone') {
      out += '<rect x="21" y="21" width="158" height="358" rx="32" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>';
    } else if (style === 'rugged') {
      out += '<rect x="14" y="14" width="172" height="372" rx="38" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="10"/>';
      for (i = 0; i < 6; i++) {
        out += '<line x1="46" x2="154" y1="' + (240 + i * 15) + '" y2="' + (240 + i * 15) + '" stroke="#000" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/>';
      }
    } else if (style === 'leather') {
      out += '<rect x="25" y="25" width="150" height="350" rx="30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="4 4"/>';
    } else if (style === 'wallet') {
      out += '<rect x="44" y="236" width="112" height="116" rx="8" fill="#000" fill-opacity=".16"/>' +
             '<line x1="44" x2="156" y1="262" y2="262" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>';
    }
    return out;
  }

  function caseSVG(brand, colorKey, style, label) {
    var clear = colorKey === 'clear';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" role="img" aria-label="' + label + '">';
    if (clear) s += '<rect x="22" y="22" width="156" height="356" rx="32" fill="#2B3237"/>';
    s += '<rect x="14" y="14" width="172" height="372" rx="38" fill="' + COLORS[colorKey].hex + '"' +
         (clear ? ' fill-opacity=".22" stroke="#15201C" stroke-opacity=".55" stroke-width="2"' : '') + '/>';
    s += details(style);
    s += camera(brand);
    return s + '</svg>';
  }

  function label(p, colorKey, model) {
    return p.name + ' case in ' + COLORS[colorKey].name + ' for ' + model.name;
  }

  /* ---------- Rendering ---------- */

  function renderModelSelect() {
    var html = '';
    ['iphone', 'galaxy', 'pixel'].forEach(function (b) {
      html += '<optgroup label="' + BRAND_LABELS[b] + '">';
      MODELS.filter(function (m) { return m.brand === b; }).forEach(function (m) {
        html += '<option value="' + m.id + '">' + m.name + '</option>';
      });
      html += '</optgroup>';
    });
    els.model.innerHTML = html;
    els.model.value = state.model;
  }

  function renderHero() {
    var m = findModel(state.model);
    els.heroArt.innerHTML = caseSVG(m.brand, 'sand', 'silicone', 'Soft silicone case in Sand for ' + m.name);
  }

  function cardHTML(p, m) {
    var colorKey = picks[p.id] || p.colors[0];
    var swatches = p.colors.map(function (k) {
      var isClear = k === 'clear';
      return '<label class="sw"><input type="radio" name="color-' + p.id + '" value="' + k + '"' + (k === colorKey ? ' checked' : '') + '>' +
        '<span class="sw-chip' + (isClear ? ' sw-clear' : '') + '"' + (isClear ? '' : ' style="background:' + COLORS[k].hex + '"') + '></span>' +
        '<span class="sr">' + COLORS[k].name + '</span></label>';
    }).join('');
    return '<article class="product" data-id="' + p.id + '">' +
      '<div class="panel">' + caseSVG(m.brand, colorKey, p.style, label(p, colorKey, m)) + '</div>' +
      '<div class="info">' +
        '<div class="row"><h3>' + p.name + '</h3><p class="price">' + money.format(p.price) + '</p></div>' +
        '<p class="desc">' + p.desc + '</p>' +
        '<fieldset class="colors"><legend>Color: <span class="cname">' + COLORS[colorKey].name + '</span></legend><div class="sws">' + swatches + '</div></fieldset>' +
        '<button type="button" class="btn add" data-add="' + p.id + '" aria-label="Add to cart, ' + p.name + '">Add to cart</button>' +
      '</div></article>';
  }

  function renderGrid() {
    var m = findModel(state.model);
    els.shopTitle.textContent = 'Cases for ' + m.name;
    els.shopLede.textContent = PRODUCTS.length + ' styles. Every case shown fits the ' + m.name + '.';
    els.grid.innerHTML = PRODUCTS.map(function (p) { return cardHTML(p, m); }).join('');
  }

  function renderCartCount() {
    var n = state.cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
    els.cartCount.textContent = n;
  }

  function renderCart() {
    var total = 0;
    if (!state.cart.length) {
      els.cartBody.innerHTML = '<div class="cart-empty"><p>Your cart is empty. Pick a case from the shop.</p>' +
        '<button type="button" class="btn-quiet" data-action="close">Continue shopping</button></div>';
    } else {
      els.cartBody.innerHTML = state.cart.map(function (i, idx) {
        var p = findProduct(i.id);
        var m = findModel(i.model);
        var lineTotal = p.price * i.qty;
        total += lineTotal;
        return '<div class="line">' +
          '<div class="line-art">' + caseSVG(m.brand, i.color, p.style, label(p, i.color, m)) + '</div>' +
          '<div>' +
            '<p class="line-name">' + p.name + '</p>' +
            '<p class="line-meta">' + COLORS[i.color].name + ', for ' + m.name + '</p>' +
            '<div class="qty">' +
              '<button type="button" data-action="dec" data-idx="' + idx + '" aria-label="Decrease quantity of ' + p.name + ', ' + COLORS[i.color].name + '">-</button>' +
              '<span aria-label="Quantity">' + i.qty + '</span>' +
              '<button type="button" data-action="inc" data-idx="' + idx + '" aria-label="Increase quantity of ' + p.name + ', ' + COLORS[i.color].name + '"' + (i.qty >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
              '<button type="button" class="remove" data-action="remove" data-idx="' + idx + '" aria-label="Remove ' + p.name + ', ' + COLORS[i.color].name + ' from cart">Remove</button>' +
            '</div>' +
          '</div>' +
          '<p class="line-price">' + moneyExact.format(lineTotal) + '</p>' +
        '</div>';
      }).join('');
    }
    els.subtotal.textContent = moneyExact.format(total);
    var ready = !!CHECKOUT_URL && state.cart.length > 0;
    els.checkout.disabled = !ready;
    els.checkoutNote.textContent = CHECKOUT_URL ? '' : 'Checkout is not connected yet.';
  }

  function announce(msg) {
    els.live.textContent = '';
    window.setTimeout(function () { els.live.textContent = msg; }, 30);
  }

  /* ---------- Cart actions ---------- */

  function addToCart(pid) {
    var p = findProduct(pid);
    var m = findModel(state.model);
    var color = picks[pid] || p.colors[0];
    var existing = state.cart.filter(function (i) { return i.id === pid && i.color === color && i.model === m.id; })[0];
    if (existing) {
      if (existing.qty >= MAX_QTY) { announce('Maximum quantity of ' + MAX_QTY + ' reached for this item.'); return; }
      existing.qty += 1;
    } else {
      state.cart.push({ id: pid, color: color, model: m.id, qty: 1 });
    }
    save(); renderCartCount(); renderCart();
    announce('Added ' + label(p, color, m) + ' to your cart.');
  }

  var lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    renderCart();
    els.page.inert = true;
    els.cart.hidden = false;
    els.backdrop.hidden = false;
    document.body.classList.add('lock');
    els.cartClose.focus();
  }
  function closeCart() {
    els.cart.hidden = true;
    els.backdrop.hidden = true;
    els.page.inert = false;
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Events ---------- */

  els.model.addEventListener('change', function () {
    state.model = els.model.value;
    save(); renderHero(); renderGrid();
    announce('Showing cases for ' + findModel(state.model).name + '.');
  });

  els.grid.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.matches('input[type="radio"]')) return;
    var card = input.closest('.product');
    var p = findProduct(card.getAttribute('data-id'));
    var m = findModel(state.model);
    picks[p.id] = input.value;
    card.querySelector('.panel').innerHTML = caseSVG(m.brand, input.value, p.style, label(p, input.value, m));
    card.querySelector('.cname').textContent = COLORS[input.value].name;
  });

  els.grid.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (btn) addToCart(btn.getAttribute('data-add'));
  });

  els.cartOpen.addEventListener('click', openCart);
  els.cartClose.addEventListener('click', closeCart);
  els.backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !els.cart.hidden) closeCart();
  });

  els.cartBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'close') { closeCart(); return; }
    var idx = parseInt(btn.getAttribute('data-idx'), 10);
    var item = state.cart[idx];
    if (!item) return;
    if (action === 'inc' && item.qty < MAX_QTY) item.qty += 1;
    if (action === 'dec') item.qty -= 1;
    if (action === 'remove' || item.qty < 1) state.cart.splice(idx, 1);
    save(); renderCartCount(); renderCart();
    var stillThere = state.cart[idx] === item;
    var target = stillThere && els.cartBody.querySelector('[data-action="' + action + '"][data-idx="' + idx + '"]:not(:disabled)');
    if (!target && stillThere) target = els.cartBody.querySelector('[data-action="dec"][data-idx="' + idx + '"]');
    (target || els.cartClose).focus();
  });

  els.checkout.addEventListener('click', function () {
    if (CHECKOUT_URL && state.cart.length) window.location.href = CHECKOUT_URL;
  });

  /* ---------- Start ---------- */

  load();
  renderModelSelect();
  renderHero();
  renderGrid();
  renderCartCount();
  renderCart();
})();
