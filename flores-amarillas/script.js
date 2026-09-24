(function () {
    /* ── DOM & Config ────────────────────── */
    var openBtn   = document.getElementById("open-envelope");
    var petalEl   = document.getElementById("petal-layer");
    var heartEl   = document.getElementById("heart-layer");
    var canvas    = document.getElementById("particle-canvas");
    var ctx       = canvas ? canvas.getContext("2d") : null;
    var opened    = false;
    var audioCtx  = null;
    var master    = null;
    var melTimer  = null;
    var hrtTimer  = null;
    var noMotion  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobile    = window.matchMedia("(max-width: 680px)").matches;

    var FLOWER_SIZES = [70, 86, 74, 96, 78, 84, 64];

    var melodyNotes = [
        { f: 329.63, s: 0,    d: 0.58 },
        { f: 392.00, s: 0.58, d: 0.58 },
        { f: 493.88, s: 1.16, d: 0.92 },
        { f: 440.00, s: 2.08, d: 0.58 },
        { f: 392.00, s: 2.66, d: 0.70 },
        { f: 349.23, s: 3.48, d: 0.58 },
        { f: 392.00, s: 4.06, d: 0.58 },
        { f: 523.25, s: 4.64, d: 1.10 },
        { f: 493.88, s: 5.86, d: 0.58 },
        { f: 440.00, s: 6.44, d: 0.58 },
        { f: 392.00, s: 7.02, d: 1.15 }
    ];

    /* ═══════════════════════════════════════
       CANVAS PARTICLE SYSTEM
       ═══════════════════════════════════════ */
    var sparkles = [];
    var bokehs   = [];
    var bursts   = [];

    function resizeCanvas() {
        if (!canvas) { return; }
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /* ── Sparkle ──────────────────────────── */
    function Sparkle() { this.init(); }

    Sparkle.prototype.init = function () {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        this.sz = 1 + Math.random() * 2.5;
        this.mx = 0.2 + Math.random() * 0.55;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -0.08 - Math.random() * 0.25;
        this.ts = 0.012 + Math.random() * 0.022;
        this.ph = Math.random() * 6.28;
    };

    Sparkle.prototype.tick = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.ph += this.ts;
        if (this.y < -10) { this.y = canvas.height + 10; this.x = Math.random() * canvas.width; }
        if (this.x < -10 || this.x > canvas.width + 10) { this.x = Math.random() * canvas.width; }
    };

    Sparkle.prototype.draw = function () {
        var a = this.mx * (0.35 + 0.65 * Math.sin(this.ph));
        if (a < 0.02) { return; }
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle   = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur  = mobile ? this.sz * 2 : this.sz * 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.sz, 0, 6.28);
        ctx.fill();
        ctx.restore();
    };

    /* ── Bokeh ────────────────────────────── */
    function Bokeh() {
        this.x  = Math.random() * (canvas ? canvas.width  : 800);
        this.y  = Math.random() * (canvas ? canvas.height : 600);
        this.sz = 20 + Math.random() * 55;
        this.a  = 0.025 + Math.random() * 0.045;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.12;
        this.h  = 36 + Math.random() * 24;
    }

    Bokeh.prototype.tick = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.sz) { this.x = canvas.width + this.sz; }
        if (this.x > canvas.width + this.sz) { this.x = -this.sz; }
        if (this.y < -this.sz) { this.y = canvas.height + this.sz; }
        if (this.y > canvas.height + this.sz) { this.y = -this.sz; }
    };

    Bokeh.prototype.draw = function () {
        ctx.save();
        ctx.globalAlpha = this.a;
        ctx.fillStyle = "hsla(" + this.h + ",72%,62%,1)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.sz, 0, 6.28);
        ctx.fill();
        ctx.restore();
    };

    /* ── Burst Particle ───────────────────── */
    function Burst(x, y) {
        var ang = Math.random() * 6.28;
        var spd = 2.5 + Math.random() * 7;
        this.x  = x;
        this.y  = y;
        this.vx = Math.cos(ang) * spd;
        this.vy = Math.sin(ang) * spd;
        this.sz = 1.5 + Math.random() * 3.5;
        this.a  = 0.9;
        this.dk = 0.011 + Math.random() * 0.008;
        this.h  = 38 + Math.random() * 22;
    }

    Burst.prototype.tick = function () {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy += 0.04;
        this.vx *= 0.988;
        this.a  -= this.dk;
    };

    Burst.prototype.draw = function () {
        if (this.a <= 0) { return; }
        ctx.save();
        ctx.globalAlpha = this.a;
        ctx.fillStyle   = "hsla(" + this.h + ",85%,60%,1)";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur  = this.sz * 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.sz, 0, 6.28);
        ctx.fill();
        ctx.restore();
    };

    /* ── Canvas Loop ──────────────────────── */
    function initCanvas() {
        if (!canvas || !ctx || noMotion) { return; }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        var sc = mobile ? 14 : 32;
        var bc = mobile ? 3  : 7;
        var i;
        for (i = 0; i < sc; i++) { sparkles.push(new Sparkle()); }
        for (i = 0; i < bc; i++) { bokehs.push(new Bokeh()); }
        loopCanvas();
    }

    function loopCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var i;
        for (i = 0; i < bokehs.length; i++)   { bokehs[i].tick(); bokehs[i].draw(); }
        for (i = 0; i < sparkles.length; i++)  { sparkles[i].tick(); sparkles[i].draw(); }
        for (i = bursts.length - 1; i >= 0; i--) {
            bursts[i].tick();
            bursts[i].draw();
            if (bursts[i].a <= 0) { bursts.splice(i, 1); }
        }
        requestAnimationFrame(loopCanvas);
    }

    function fireBurst(x, y) {
        var n = mobile ? 35 : 65;
        for (var i = 0; i < n; i++) { bursts.push(new Burst(x, y)); }
    }

    /* ═══════════════════════════════════════
       SVG SUNFLOWER GENERATION
       ═══════════════════════════════════════ */
    var SVG = "http://www.w3.org/2000/svg";

    function makeStop(off, col) {
        var s = document.createElementNS(SVG, "stop");
        s.setAttribute("offset", off);
        s.setAttribute("stop-color", col);
        return s;
    }

    function createSunflower(size, idx) {
        var svg = document.createElementNS(SVG, "svg");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("width",  size);
        svg.setAttribute("height", size);
        svg.setAttribute("class", "sunflower-svg");
        svg.style.overflow = "visible";
        svg.style.setProperty("--sw", (4.2 + Math.random() * 2.2).toFixed(1) + "s");
        svg.style.setProperty("--sd", (3 + idx * 0.35).toFixed(1) + "s");

        /* Gradient definitions */
        var defs = document.createElementNS(SVG, "defs");

        var og = document.createElementNS(SVG, "linearGradient");
        og.id = "og" + idx;
        og.setAttribute("x1","0"); og.setAttribute("y1","1");
        og.setAttribute("x2","0"); og.setAttribute("y2","0");
        og.appendChild(makeStop("0%",  "#b07008"));
        og.appendChild(makeStop("28%", "#e0a020"));
        og.appendChild(makeStop("62%", "#f5d040"));
        og.appendChild(makeStop("100%","#fff380"));
        defs.appendChild(og);

        var ig = document.createElementNS(SVG, "linearGradient");
        ig.id = "ig" + idx;
        ig.setAttribute("x1","0"); ig.setAttribute("y1","1");
        ig.setAttribute("x2","0"); ig.setAttribute("y2","0");
        ig.appendChild(makeStop("0%",  "#c08810"));
        ig.appendChild(makeStop("50%", "#eabd2e"));
        ig.appendChild(makeStop("100%","#ffe650"));
        defs.appendChild(ig);

        var cg = document.createElementNS(SVG, "radialGradient");
        cg.id = "cg" + idx;
        cg.appendChild(makeStop("0%",  "#9a7018"));
        cg.appendChild(makeStop("55%", "#6a4a10"));
        cg.appendChild(makeStop("100%","#483008"));
        defs.appendChild(cg);

        svg.appendChild(defs);

        /* Petals */
        var outerN = 14;
        var innerN = 14;
        var base   = 1400 + idx * 190;
        var i, g, p, a;

        for (i = 0; i < outerN; i++) {
            g = document.createElementNS(SVG, "g");
            a = (360 / outerN) * i;
            g.setAttribute("transform", "rotate(" + a + " 50 50)");
            p = document.createElementNS(SVG, "ellipse");
            p.setAttribute("cx", "50");
            p.setAttribute("cy", "13");
            p.setAttribute("rx", "7.8");
            p.setAttribute("ry", "19");
            p.setAttribute("fill", "url(#og" + idx + ")");
            p.setAttribute("class", "svg-petal");
            p.style.setProperty("--pd", (base + i * 34) + "ms");
            g.appendChild(p);
            svg.appendChild(g);
        }

        for (i = 0; i < innerN; i++) {
            g = document.createElementNS(SVG, "g");
            a = (360 / innerN) * i + (360 / innerN / 2);
            g.setAttribute("transform", "rotate(" + a + " 50 50)");
            p = document.createElementNS(SVG, "ellipse");
            p.setAttribute("cx", "50");
            p.setAttribute("cy", "18");
            p.setAttribute("rx", "6.2");
            p.setAttribute("ry", "14.5");
            p.setAttribute("fill", "url(#ig" + idx + ")");
            p.setAttribute("class", "svg-petal inner");
            p.style.setProperty("--pd", (base + outerN * 34 + i * 28) + "ms");
            g.appendChild(p);
            svg.appendChild(g);
        }

        /* Center */
        var cc = document.createElementNS(SVG, "circle");
        cc.setAttribute("cx", "50");
        cc.setAttribute("cy", "50");
        cc.setAttribute("r",  "15");
        cc.setAttribute("fill", "url(#cg" + idx + ")");
        cc.setAttribute("class", "svg-center");
        svg.appendChild(cc);

        /* Seed dots */
        var rings = [5, 8, 11];
        var counts = [6, 9, 13];
        for (var r = 0; r < rings.length; r++) {
            for (var s = 0; s < counts[r]; s++) {
                var sa = (360 / counts[r]) * s + r * 18;
                var sx = 50 + Math.cos(sa * 0.01745) * rings[r];
                var sy = 50 + Math.sin(sa * 0.01745) * rings[r];
                var sd = document.createElementNS(SVG, "circle");
                sd.setAttribute("cx", sx.toFixed(1));
                sd.setAttribute("cy", sy.toFixed(1));
                sd.setAttribute("r",  "1.1");
                sd.setAttribute("fill", "#3a2208");
                sd.setAttribute("opacity", "0.4");
                sd.setAttribute("class", "svg-center");
                svg.appendChild(sd);
            }
        }

        return svg;
    }

    function buildFlowers() {
        var spots = document.querySelectorAll(".bloom-spot");
        for (var i = 0; i < spots.length; i++) {
            spots[i].appendChild(createSunflower(FLOWER_SIZES[i] || 70, i));
        }
    }

    /* ═══════════════════════════════════════
       INTERACTIONS
       ═══════════════════════════════════════ */

    function openGift() {
        if (opened) { return; }
        opened = true;
        document.body.classList.add("opened");
        openBtn.setAttribute("aria-expanded", "true");

        /* Canvas burst at envelope center */
        if (canvas && !noMotion) {
            var r = openBtn.getBoundingClientRect();
            fireBurst(r.left + r.width / 2, r.top + r.height * 0.4);
        }

        releasePetals();
        window.setTimeout(startHearts, 2200);
        startMelody();
    }

    /* ── Falling Petals ───────────────────── */
    function releasePetals() {
        if (!petalEl) { return; }
        var n = mobile ? 28 : 52;
        for (var i = 0; i < n; i++) {
            var el = document.createElement("span");
            el.className = "petal";
            var w = 12 + Math.random() * 13;
            var h = 16 + Math.random() * 15;
            el.style.width  = w.toFixed(0) + "px";
            el.style.height = h.toFixed(0) + "px";
            el.style.left   = (Math.random() * 100).toFixed(0) + "vw";
            el.style.setProperty("--dx",  (Math.random() * 240 - 120).toFixed(0) + "px");
            el.style.setProperty("--dur", (5.5 + Math.random() * 5).toFixed(1) + "s");
            el.style.setProperty("--del", (Math.random() * 3).toFixed(1) + "s");
            el.style.setProperty("--sp",  ((Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 140)).toFixed(0) + "deg");
            petalEl.appendChild(el);
        }
        window.setTimeout(function () { petalEl.textContent = ""; }, 13000);
    }

    /* ── Hearts ───────────────────────────── */
    function startHearts() {
        if (!heartEl) { return; }
        var batch = mobile ? 5 : 10;

        function spawn() {
            var h  = document.createElement("span");
            h.className = "heart";
            var sz = 8 + Math.random() * 12;
            h.style.width  = sz.toFixed(0) + "px";
            h.style.height = sz.toFixed(0) + "px";
            h.style.left   = (5 + Math.random() * 90).toFixed(0) + "vw";
            h.style.setProperty("--hd", (9 + Math.random() * 8).toFixed(1) + "s");
            h.style.setProperty("--hx", (Math.random() * 80 - 40).toFixed(0) + "px");
            heartEl.appendChild(h);
            window.setTimeout(function () { if (h.parentNode) { h.parentNode.removeChild(h); } }, 18000);
        }

        for (var i = 0; i < batch; i++) {
            (function (d) { window.setTimeout(spawn, d); })(i * 650);
        }
        hrtTimer = window.setInterval(function () {
            if (heartEl.childElementCount < 14) { spawn(); }
        }, 3000);
    }

    /* ═══════════════════════════════════════
       MELODY (unchanged notes, smoother ramp)
       ═══════════════════════════════════════ */

    function startMelody() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC || melTimer) { return; }
        audioCtx = audioCtx || new AC();
        master   = audioCtx.createGain();
        master.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.09, audioCtx.currentTime + 1.6);
        master.connect(audioCtx.destination);
        if (audioCtx.state === "suspended") { audioCtx.resume(); }
        phrase();
        melTimer = window.setInterval(phrase, 9200);
    }

    function phrase() {
        var t = audioCtx.currentTime + 0.08;
        for (var i = 0; i < melodyNotes.length; i++) {
            var n = melodyNotes[i];
            tone(n.f, t + n.s, n.d, i % 3 === 0 ? 0.034 : 0.026);
            if (i % 2 === 0) { tone(n.f / 2, t + n.s, n.d + 0.16, 0.014); }
        }
    }

    function tone(freq, start, dur, vol) {
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        var e = start + dur;
        o.type = "sine";
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(vol, start + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, e);
        o.connect(g);
        g.connect(master);
        o.start(start);
        o.stop(e + 0.06);
    }

    /* ═══════════════════════════════════════
       INIT
       ═══════════════════════════════════════ */

    buildFlowers();
    initCanvas();

    if (openBtn) {
        openBtn.addEventListener("click", openGift);
    }
}());
