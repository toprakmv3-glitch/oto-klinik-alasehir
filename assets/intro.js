window.OTO_LOGO_SRC = 'assets/oto-logo.webp';
window.OI_LOGO_HD = 'assets/oto-logo-intro.webp';

    (function () {
        var INTRO_ONCE_PER_SESSION = false; // true yaparsan intro oturum başına yalnızca 1 kez oynar
        var root = document.getElementById('oi-intro');
        if (!root) return;
        var html = document.documentElement;
        var skip = false;
        try { if (INTRO_ONCE_PER_SESSION && sessionStorage.getItem('oiSeen')) skip = true; } catch (e) {}
        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) skip = true;

        var finished = false;
        function done() {
            if (finished) return; finished = true;
            try { sessionStorage.setItem('oiSeen', '1'); } catch (e) {}
            html.classList.remove('oi-lock');
            if (root.parentNode) root.parentNode.removeChild(root);
        }
        if (skip) { done(); return; }
        html.classList.add('oi-lock');

        var src = window.OTO_LOGO_SRC;
        var logo = root.querySelector('.oi-logo');
        var tilt = root.querySelector('.oi-tilt');
        var sheen = root.querySelector('.oi-sheen');

        // Başlık harfleri
        var title = root.querySelector('.oi-title'), txt = 'OTO KLİNİK';
        for (var k = 0; k < txt.length; k++) {
            var s = document.createElement('span');
            s.className = 'oi-ch' + (txt[k] === ' ' ? ' sp' : '');
            s.style.setProperty('--i', k);
            s.textContent = txt[k] === ' ' ? '\u00A0' : txt[k];
            title.appendChild(s);
        }

        // Arka katmanlar için koyu kopya: canvas ile bir kez üretilir (data URL kullanılır; uygulama içi görüntüleyicilerde de çalışır)
        function makeDark(u) {
            return new Promise(function (res) {
                var im = new Image();
                im.onload = function () {
                    try {
                        var cv2 = document.createElement('canvas');
                        cv2.width = im.naturalWidth; cv2.height = im.naturalHeight;
                        var x = cv2.getContext('2d');
                        x.drawImage(im, 0, 0);
                        x.globalCompositeOperation = 'source-atop';
                        x.fillStyle = 'rgba(25,0,0,.66)'; x.fillRect(0, 0, cv2.width, cv2.height);
                        res(cv2.toDataURL('image/png'));
                    } catch (e) { res(u); }
                };
                im.onerror = function () { res(u); };
                im.src = u;
            });
        }
        // Logo katmanları: üst üste dizilen kopyalarla 3D kalınlık (extrude) hissi
        function build(u, isFallback) {
            return makeDark(u).then(function (d) {
                var N = 5, front;
                for (var i = N - 1; i >= 0; i--) {
                    var im = new Image();
                    im.alt = ''; im.draggable = false; im.decoding = 'async';
                    im.className = 'oi-layer' + (i === 0 ? ' front' : '');
                    im.style.setProperty('--z', (-i * 3.5) + 'px');
                    im.src = i === 0 ? u : d;
                    tilt.insertBefore(im, sheen);
                    if (i === 0) front = im;
                }
                return new Promise(function (res) {
                    front.onerror = function () {
                        // Yüklenemezse: katmanları sil, gömülü yedek logoyla bir kez daha dene
                        var ls = tilt.querySelectorAll('.oi-layer');
                        for (var q = 0; q < ls.length; q++) ls[q].parentNode.removeChild(ls[q]);
                        if (!isFallback && src && u !== src) build(src, true).then(res); else res();
                    };
                    if (front.decode) front.decode().then(res, function () { if (front.complete && front.naturalWidth) res(); });
                    else front.onload = function () { res(); };
                });
            });
        }

        // Hız çizgileri
        var warp = root.querySelector('.oi-warp');
        for (var w = 0; w < 18; w++) {
            var l = document.createElement('i');
            l.style.setProperty('--a', (Math.random() * 360).toFixed(1) + 'deg');
            l.style.setProperty('--t', (0.05 + Math.random() * 0.7).toFixed(2) + 's');
            l.style.setProperty('--d', (0.45 + Math.random() * 0.35).toFixed(2) + 's');
            l.style.width = (30 + Math.random() * 25).toFixed(0) + 'vmax';
            warp.appendChild(l);
        }

        // Çarpma anındaki kıvılcım patlaması
        var cv, ctx, CW, CH, lr;
        function prep() {
            cv = root.querySelector('.oi-sparks'); if (!cv || !cv.getContext) return;
            ctx = cv.getContext('2d');
            var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
            CW = window.innerWidth; CH = window.innerHeight;
            cv.width = CW * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            lr = logo.getBoundingClientRect();
        }
        function burst() {
            if (!ctx || finished) return;
            var r = lr, cx = r.left + r.width / 2, cy = r.top + r.height / 2, W = CW, H = CH;
            var cols = ['239,68,68', '249,115,22', '234,88,12', '220,38,38', '251,146,60'], P = [];
            for (var n = 0; n < 70; n++) {
                var a = Math.random() * Math.PI * 2, sp = 70 + Math.random() * Math.min(W, H) * 0.5;
                P.push({ x: cx + Math.cos(a) * r.width * 0.3, y: cy + Math.sin(a) * r.height * 0.3,
                         vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.8 + Math.random() * 0.9, age: 0,
                         w: 1 + Math.random() * 1.8, col: cols[(Math.random() * cols.length) | 0] });
            }
            var last = performance.now();
            (function frame(now) {
                var dt = Math.min(0.033, (now - last) / 1000); last = now;
                ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
                var alive = 0;
                for (var j = 0; j < P.length; j++) {
                    var p = P[j]; p.age += dt; if (p.age >= p.life) continue; alive++;
                    var px = p.x, py = p.y;
                    p.vx *= 0.975; p.vy = p.vy * 0.975 + 160 * dt;
                    p.x += p.vx * dt; p.y += p.vy * dt;
                    ctx.strokeStyle = 'rgba(' + p.col + ',' + (1 - p.age / p.life).toFixed(2) + ')';
                    ctx.lineWidth = p.w;
                    ctx.beginPath(); ctx.moveTo(px - p.vx * 0.02, py - p.vy * 0.02); ctx.lineTo(p.x, p.y); ctx.stroke();
                }
                if (alive && !finished) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
            })(last);
        }

        var warmed = false;
        function start() {
            if (finished || root.classList.contains('oi-run')) return;
            if (!warmed) {
                warmed = true; prep(); root.classList.add('oi-warm');
                setTimeout(function () { requestAnimationFrame(function () { requestAnimationFrame(start); }); }, 90);
                return;
            }
            root.classList.remove('oi-warm');
            if (!lr) prep();
            var r = lr || logo.getBoundingClientRect();
            root.style.setProperty('--cx', (r.left + r.width / 2) + 'px');
            root.style.setProperty('--cy', (r.top + r.height / 2) + 'px');
            root.classList.add('oi-run');
            // Kare hızı izleme: cihaz yavaşsa ağır efektleri otomatik kapat
            var fs = [], lite = false;
            (function mon(t) {
                fs.push(t);
                if (fs.length > 1 && fs.length <= 30 && !finished) {
                    if (fs.length === 30) {
                        var avg = (fs[29] - fs[1]) / 28;
                        if (avg > 30) { lite = true; root.classList.add('oi-lite'); }
                    } else requestAnimationFrame(mon);
                } else if (fs.length === 1) requestAnimationFrame(mon);
            })(performance.now());
            setTimeout(function () { if (!root.classList.contains('oi-lite')) burst(); }, 1080);
            setTimeout(done, 3080);
        }
        // Önce logoyu hazırla, sayfa yüklenince (ya da en geç 1.6 sn) başlat: takılma olmaz
        var logoReady = new Promise(function (res) {
            var HD = window.OI_LOGO_HD;
            if (!HD) return res(src);
            var t = new Image(); t.onload = function () { res(HD); }; t.onerror = function () { res(src); }; t.src = HD;
        }).then(function (s) { return s ? build(s) : Promise.resolve(); });
        var pageReady = new Promise(function (res) {
            var loaded = new Promise(function (r2) {
                if (document.readyState === 'complete') r2(); else window.addEventListener('load', r2);
            });
            var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
            Promise.all([loaded, fonts]).then(res, res); setTimeout(res, 1600);
        });
        Promise.all([logoReady, pageReady]).then(function () {
            setTimeout(function () { requestAnimationFrame(function () { requestAnimationFrame(start); }); }, 60);
        });
        setTimeout(start, 2200);

        document.getElementById('oi-skip').addEventListener('click', function () {
            root.classList.add('oi-skipnow'); setTimeout(done, 260);
        });
    })();
    