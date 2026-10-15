/* =====================================================================
   Theben motion — Scene 3D iONprime PB (WebGL murni, tanpa library)
   Kamera terbang melewati lorong grid biru, lalu keypad iONprime PB
   berputar menghadap layar dan LED tiap tombol menyala sesuai scroll.
   ===================================================================== */
(function () {
  'use strict';

  var sec = document.querySelector('.lx-scene');
  if (!sec) return;
  var canvas = sec.querySelector('canvas');
  var steps = Array.prototype.slice.call(sec.querySelectorAll('.lx-step'));
  var bar = sec.querySelector('.lx-scene__progress');
  var STATIC = sec.classList.contains('is-static');

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }
  if (!gl) { sec.classList.add('no-webgl'); return; }

  /* ---------------- Matematika matriks (column-major) ---------------- */
  function m4() { var m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function trans(x, y, z) { var m = m4(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function rotX(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function rotY(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function rotZ(a) { var m = m4(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  function persp(fovy, asp, n, f) {
    var t = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
    m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f);
    return m;
  }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    var l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    var m = m4();
    m[0] = xx; m[4] = xy; m[8] = xz;
    m[1] = yx; m[5] = yy; m[9] = yz;
    m[2] = zx; m[6] = zy; m[10] = zz;
    m[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
    m[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
    m[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
    return m;
  }
  function nmat(m) { return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]); }
  function xform(m, x, y, z) {
    return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function range(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

  /* ---------------- Shader ---------------- */
  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var info = { p: p, a: {}, u: {} };
    var n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < n; i++) { var a = gl.getActiveAttrib(p, i); info.a[a.name] = gl.getAttribLocation(p, a.name); }
    n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i); info.u[u.name] = gl.getUniformLocation(p, u.name); }
    return info;
  }

  var MESH = null, LINE = null, PTS = null;
  try {
    MESH = program(
      'attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uModel;uniform mat4 uVP;uniform mat3 uNM;' +
      'varying vec3 vW;varying vec3 vN;' +
      'void main(){vec4 w=uModel*vec4(aPos,1.);vW=w.xyz;vN=uNM*aNor;gl_Position=uVP*w;}',
      'precision highp float;varying vec3 vW;varying vec3 vN;' +
      'uniform vec3 uCam;uniform vec3 uColor;uniform vec3 uEmis;uniform vec3 uFog;uniform vec3 uRim;' +
      'uniform float uSpec;uniform float uShine;uniform vec2 uFogR;' +
      'void main(){vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);' +
      'vec3 L1=normalize(vec3(-.45,.75,.7));vec3 L2=normalize(vec3(.75,-.25,.45));' +
      'float d1=max(dot(N,L1),0.);float d2=max(dot(N,L2),0.);' +
      'float s1=pow(max(dot(N,normalize(L1+V)),0.),uShine);float s2=pow(max(dot(N,normalize(L2+V)),0.),uShine*.5);' +
      'vec3 R=reflect(-V,N);float box=smoothstep(.3,.9,R.y)*smoothstep(1.2,.1,abs(R.x));' +
      'float fr=pow(1.-max(dot(N,V),0.),3.);' +
      'vec3 c=uColor*(.25+d1*.8)+uColor*d2*vec3(.25,.45,.8);' +
      'c+=vec3(1.)*s1*uSpec+vec3(.35,.6,1.)*s2*uSpec*.6+vec3(.8,.9,1.)*box*uSpec*.35+uRim*fr+uEmis;' +
      'float f=smoothstep(uFogR.x,uFogR.y,length(uCam-vW));gl_FragColor=vec4(mix(c,uFog,f),1.);}'
    );
    LINE = program(
      'attribute vec3 aPos;uniform mat4 uVP;uniform vec3 uCam;varying float vD;' +
      'void main(){vD=length(aPos-uCam);gl_Position=uVP*vec4(aPos,1.);}',
      'precision mediump float;varying float vD;uniform vec3 uColor;uniform float uAlpha;uniform vec2 uFogR;' +
      'void main(){float a=(1.-smoothstep(uFogR.x,uFogR.y,vD))*smoothstep(.4,2.5,vD)*uAlpha;gl_FragColor=vec4(uColor*a,a);}'
    );
    PTS = program(
      'attribute vec3 aPos;attribute vec4 aCol;attribute float aSeed;uniform mat4 uVP;uniform float uScale;' +
      'uniform float uTime;uniform vec3 uCam;uniform vec2 uFogR;varying vec3 vC;' +
      'void main(){vec4 c=uVP*vec4(aPos,1.);gl_Position=c;gl_PointSize=min(aCol.a*uScale/max(c.w,.1),256.);' +
      'float tw=aSeed<0.?1.:.45+.55*sin(uTime*1.7+aSeed*40.);' +
      'float f=1.-smoothstep(uFogR.x,uFogR.y,length(aPos-uCam));vC=aCol.rgb*tw*f;}',
      'precision mediump float;varying vec3 vC;' +
      'void main(){float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(0.,1.,r);a*=a;gl_FragColor=vec4(vC*a,1.);}'
    );
  } catch (err) {
    sec.classList.add('no-webgl');
    if (window.console) console.warn('[theben] WebGL scene off:', err);
    return;
  }

  /* ---------------- Geometri: rounded box ---------------- */
  function roundedBox(w, h, d, r, k) {
    k = k || 5;
    var hx = w / 2, hy = h / 2, hz = d / 2;
    function axis(hh) {
      var c = hh - r, out = [];
      for (var i = k; i >= 0; i--) out.push(-c - r * Math.tan(i / k * Math.PI / 4));
      for (i = 0; i <= k; i++) out.push(c + r * Math.tan(i / k * Math.PI / 4));
      return out;
    }
    var ax = axis(hx), ay = axis(hy), az = axis(hz);
    var pos = [], nor = [], idx = [];
    var cx = hx - r, cy = hy - r, cz = hz - r;
    function push(x, y, z) {
      var qx = clamp(x, -cx, cx), qy = clamp(y, -cy, cy), qz = clamp(z, -cz, cz);
      var nx = x - qx, ny = y - qy, nz = z - qz, l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      pos.push(qx + nx * r, qy + ny * r, qz + nz * r);
      nor.push(nx, ny, nz);
    }
    function face(U, V, fixedAxis, fixedVal) {
      var base = pos.length / 3;
      for (var j = 0; j < V.length; j++) for (var i = 0; i < U.length; i++) {
        var p = [0, 0, 0], a = U[i], b = V[j];
        if (fixedAxis === 0) p = [fixedVal, a, b];
        else if (fixedAxis === 1) p = [a, fixedVal, b];
        else p = [a, b, fixedVal];
        push(p[0], p[1], p[2]);
      }
      for (j = 0; j < V.length - 1; j++) for (i = 0; i < U.length - 1; i++) {
        var q = base + j * U.length + i;
        idx.push(q, q + 1, q + U.length, q + 1, q + U.length + 1, q + U.length);
      }
    }
    face(ax, ay, 2, hz); face(ax, ay, 2, -hz);
    face(ax, az, 1, hy); face(ax, az, 1, -hy);
    face(ay, az, 0, hx); face(ay, az, 0, -hx);
    return mesh(new Float32Array(pos), new Float32Array(nor), new Uint16Array(idx));
  }
  function mesh(pos, nor, idx) {
    var o = { n: idx.length };
    o.pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.pb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    o.nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.nb); gl.bufferData(gl.ARRAY_BUFFER, nor, gl.STATIC_DRAW);
    o.ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    return o;
  }

  /* ---------------- Model keypad iONprime PB ---------------- */
  var ROW_H = 0.53, GAP = 0.025, PITCH = ROW_H + GAP;
  var gPlate = roundedBox(2.34, 2.34, 0.07, 0.03, 4);
  var gRocker = roundedBox(2.22, ROW_H, 0.13, 0.035, 6);
  var gLed = roundedBox(0.14, 0.026, 0.02, 0.0099, 2);
  var LED_COL = [[1, 0.88, 0.29], [0.44, 0.83, 0.35], [0.18, 0.76, 0.94], [1, 0.35, 0.29]];
  var IDLE_COL = [[[1, .9, .2], [1, .25, .2]], [[.4, .85, .3], [.4, .85, .3]], [[.15, .7, .95], [.15, .7, .95]], [[1, .9, .2], [1, .25, .2]]];
  var KEY_Z = -46;

  /* ---------------- Lorong grid ---------------- */
  var TW = 7.2, TH = 4.6, Z0 = 8, Z1 = -82, STEP = 2.4;
  var lines = [];
  function L(a, b) { lines.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
  var xs = [-TW / 2, -TW / 6, TW / 6, TW / 2], ys = [-TH / 2, 0, TH / 2];
  for (var z = Z0; z >= Z1; z -= STEP) {
    L([-TW / 2, -TH / 2, z], [TW / 2, -TH / 2, z]); L([-TW / 2, TH / 2, z], [TW / 2, TH / 2, z]);
    L([-TW / 2, -TH / 2, z], [-TW / 2, TH / 2, z]); L([TW / 2, -TH / 2, z], [TW / 2, TH / 2, z]);
  }
  xs.forEach(function (x) { L([x, -TH / 2, Z0], [x, -TH / 2, Z1]); L([x, TH / 2, Z0], [x, TH / 2, Z1]); });
  ys.forEach(function (y) { L([-TW / 2, y, Z0], [-TW / 2, y, Z1]); L([TW / 2, y, Z0], [TW / 2, y, Z1]); });
  var lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
  var lineCount = lines.length / 3;

  /* ---------------- Partikel ---------------- */
  var small = window.innerWidth < 760;
  var NP = small ? 420 : 900;
  var pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 4), pSeed = new Float32Array(NP);
  for (var i = 0; i < NP; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * TW * 0.96;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * TH * 0.96;
    pPos[i * 3 + 2] = Z0 - Math.random() * (Z0 - Z1);
    var t = Math.random();
    var col = t < 0.55 ? [0.35, 0.62, 1] : t < 0.85 ? [0.66, 0.84, 0.96] : [1, 1, 1];
    var b = 0.5 + Math.random() * 0.6;
    pCol[i * 4] = col[0] * b; pCol[i * 4 + 1] = col[1] * b; pCol[i * 4 + 2] = col[2] * b;
    pCol[i * 4 + 3] = 0.03 + Math.random() * 0.07;
    pSeed[i] = Math.random();
  }
  function buf(data, usage) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW); return b; }
  var pPosB = buf(pPos), pColB = buf(pCol), pSeedB = buf(pSeed);

  // Glow (LED + halo belakang keypad), diperbarui tiap frame
  var NG = 9;
  var gPos = new Float32Array(NG * 3), gCol = new Float32Array(NG * 4), gSeed = new Float32Array(NG).fill(-1);
  var gPosB = buf(gPos, gl.DYNAMIC_DRAW), gColB = buf(gCol, gl.DYNAMIC_DRAW), gSeedB = buf(gSeed);

  /* ---------------- State ---------------- */
  var FOG = [0.016, 0.141, 0.243];
  var W = 0, H = 0, dpr = 1, running = false, visible = false;
  var progress = STATIC ? 1 : 0, smoothP = progress;
  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  var led = [0, 0, 0, 0], press = [0, 0, 0, 0], lastStep = -1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    if (STATIC) draw(performance.now() / 1000);
  }
  window.addEventListener('resize', resize);

  sec.addEventListener('pointermove', function (e) {
    var r = sec.getBoundingClientRect();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = ((e.clientY - Math.max(r.top, 0)) / window.innerHeight) * 2 - 1;
  });
  sec.addEventListener('pointerleave', function () { mouse.x = mouse.y = 0; });

  function readProgress() {
    if (STATIC) return 1;
    var r = sec.getBoundingClientRect();
    var total = sec.offsetHeight - window.innerHeight;
    return clamp(-r.top / Math.max(total, 1), 0, 1);
  }

  function updateUI(p) {
    if (bar) bar.style.setProperty('--p', p.toFixed(3));
    sec.classList.toggle('is-past-intro', p > 0.4 && !STATIC);
    sec.classList.toggle('is-steps', p > 0.44 || STATIC);
    sec.classList.toggle('is-done', p > 0.93 || STATIC);
    var s = p < 0.5 ? -1 : Math.min(3, Math.floor((p - 0.5) / 0.1));
    steps.forEach(function (el, i) {
      el.classList.toggle('is-on', STATIC || (s >= i));
      el.classList.toggle('is-current', s === i || (s > 3 && i === 3));
    });
    if (s !== lastStep) {
      if (s > lastStep && s >= 0) press[s] = 1;
      lastStep = s;
    }
    return s;
  }

  /* ---------------- Render ---------------- */
  function useAttr(prog, name, b, size) {
    var loc = prog.a[name];
    if (loc === undefined || loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  function disableAttrs(prog) { for (var k in prog.a) gl.disableVertexAttribArray(prog.a[k]); }

  function draw(time) {
    var p = smoothP;
    var narrow = W / Math.max(H, 1) < 0.85;
    var step = updateUI(progress);

    // LED & tekanan tombol
    for (var i = 0; i < 4; i++) {
      var target = STATIC ? 1 : p < 0.5 ? 0.0 : step >= i ? (step === i ? 1 : 0.55) : 0;
      if (!STATIC && p > 0.93) target = 1;
      led[i] = lerp(led[i], target, 0.12);
      press[i] = Math.max(0, press[i] - 0.035);
    }
    var idleMix = STATIC ? 0 : 1 - range(p, 0.42, 0.52);

    // Kamera
    var approach = ease(range(p, 0, 0.42));
    var finalDist = narrow ? Math.max(8.6, 3.1 / (0.63 * (W / Math.max(H, 1)))) : 6.4;
    var camZ = lerp(Z0 - 2, KEY_Z + finalDist, approach);
    var sway = (1 - approach) * 0.35;
    mouse.sx = lerp(mouse.sx, mouse.x, 0.06);
    mouse.sy = lerp(mouse.sy, mouse.y, 0.06);
    var cam = [Math.sin(time * 0.4) * sway + mouse.sx * 0.35, Math.cos(time * 0.33) * sway * 0.6 - mouse.sy * 0.22, camZ];
    var settle = ease(range(p, 0.38, 0.52));
    var keyX = narrow ? 0 : lerp(0, -1.35, settle);
    var keyY = narrow ? lerp(0, 0.75, settle) : 0;
    if (STATIC) { finalDist = narrow ? finalDist : 8.6; camZ = KEY_Z + finalDist; cam[2] = camZ; keyX = narrow ? 0 : 0.1; keyY = narrow ? 0.75 : -0.45; }
    var look = [lerp(0, keyX * 0.15, settle), lerp(0, keyY * 0.2, settle), KEY_Z];
    var aspect = W / Math.max(H, 1);
    var proj = persp(35 * Math.PI / 180, aspect, 0.1, 120);
    var view = lookAt(cam, look, [Math.sin(time * 0.2) * 0.02 * (1 - settle), 1, 0]);
    var vp = mul(proj, view);

    // Rotasi keypad
    var turn = ease(range(p, 0.12, 0.5));
    // Putaran pelan & terbatas (dulu ikut lama halaman terbuka sehingga makin lama makin cepat)
    var ry = (1 - turn) * (1.1 + Math.sin(time * 0.3) * 0.25) + mouse.sx * 0.22;
    var rx = (1 - turn) * -0.55 - mouse.sy * 0.14;
    var rz = (1 - turn) * 0.25;
    var float = Math.sin(time * 1.1) * 0.04;
    var G = mul(trans(keyX, keyY + float, KEY_Z), mul(rotY(ry), mul(rotX(rx), rotZ(rz))));

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(FOG[0], FOG[1], FOG[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    var fogR = [narrow ? 9 : 7, 34];

    /* Mesh */
    gl.useProgram(MESH.p);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.uniformMatrix4fv(MESH.u.uVP, false, vp);
    gl.uniform3fv(MESH.u.uCam, cam);
    gl.uniform3fv(MESH.u.uFog, FOG);
    gl.uniform2fv(MESH.u.uFogR, fogR);
    function drawMesh(g, model, color, emis, spec, shine, rim) {
      gl.uniformMatrix4fv(MESH.u.uModel, false, model);
      gl.uniformMatrix3fv(MESH.u.uNM, false, nmat(model));
      gl.uniform3fv(MESH.u.uColor, color);
      gl.uniform3fv(MESH.u.uEmis, emis);
      gl.uniform3fv(MESH.u.uRim, rim);
      gl.uniform1f(MESH.u.uSpec, spec);
      gl.uniform1f(MESH.u.uShine, shine);
      useAttr(MESH, 'aPos', g.pb, 3);
      useAttr(MESH, 'aNor', g.nb, 3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
    }
    var rim = [0.05, 0.32, 0.72];
    drawMesh(gPlate, mul(G, trans(0, 0, -0.07)), [0.09, 0.095, 0.1], [0, 0, 0], 0.5, 40, rim);

    var glowN = 0;
    for (var r = 0; r < 4; r++) {
      var y = (1.5 - r) * PITCH;
      var lc = LED_COL[r], li = led[r];
      var pr = Math.sin(press[r] * Math.PI) * 0.05;
      var RM = mul(G, mul(trans(0, y, 0.0), rotX(-pr)));
      var spill = [lc[0] * li * 0.05, lc[1] * li * 0.05, lc[2] * li * 0.05];
      drawMesh(gRocker, mul(RM, trans(0, 0, -pr * 0.4)), [0.165, 0.175, 0.185], spill, 0.85, 70, rim);
      for (var sd = 0; sd < 2; sd++) {
        var x = sd ? 0.62 : -0.62;
        var ic = IDLE_COL[r][sd];
        var c = [lerp(lc[0], ic[0], idleMix), lerp(lc[1], ic[1], idleMix), lerp(lc[2], ic[2], idleMix)];
        var inten = Math.max(li, idleMix * 0.55);
        var LM = mul(RM, trans(x, 0, 0.068));
        drawMesh(gLed, LM, [0.05, 0.05, 0.05], [c[0] * (0.15 + inten * 1.3), c[1] * (0.15 + inten * 1.3), c[2] * (0.15 + inten * 1.3)], 0.2, 20, [0, 0, 0]);
        var wp = xform(LM, 0, 0, 0.03);
        gPos[glowN * 3] = wp[0]; gPos[glowN * 3 + 1] = wp[1]; gPos[glowN * 3 + 2] = wp[2];
        gCol[glowN * 4] = c[0] * inten * 0.9; gCol[glowN * 4 + 1] = c[1] * inten * 0.9; gCol[glowN * 4 + 2] = c[2] * inten * 0.9;
        gCol[glowN * 4 + 3] = 0.28 + inten * 0.5;
        glowN++;
      }
    }
    // Halo besar di belakang keypad
    var halo = xform(G, 0, 0, -1.6);
    gPos[24] = halo[0]; gPos[25] = halo[1]; gPos[26] = halo[2];
    var hb = 0.4 * (1 - settle);
    gCol[32] = 0.03 * hb * 4; gCol[33] = 0.25 * hb * 4; gCol[34] = 0.62 * hb * 4; gCol[35] = 7.5;

    /* Garis lorong (additive, tanpa tulis depth) */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.depthMask(false);
    gl.useProgram(LINE.p);
    gl.uniformMatrix4fv(LINE.u.uVP, false, vp);
    gl.uniform3fv(LINE.u.uCam, cam);
    gl.uniform3fv(LINE.u.uColor, [0.2, 0.5, 0.95]);
    gl.uniform1f(LINE.u.uAlpha, 0.55);
    gl.uniform2fv(LINE.u.uFogR, [6, 40]);
    useAttr(LINE, 'aPos', lineBuf, 3);
    gl.drawArrays(gl.LINES, 0, lineCount);
    disableAttrs(LINE);

    /* Partikel + glow */
    gl.useProgram(PTS.p);
    gl.uniformMatrix4fv(PTS.u.uVP, false, vp);
    gl.uniform1f(PTS.u.uScale, canvas.height * proj[5] * 0.5);
    gl.uniform1f(PTS.u.uTime, time);
    gl.uniform3fv(PTS.u.uCam, cam);
    gl.uniform2fv(PTS.u.uFogR, [8, 40]);
    useAttr(PTS, 'aPos', pPosB, 3);
    useAttr(PTS, 'aCol', pColB, 4);
    useAttr(PTS, 'aSeed', pSeedB, 1);
    gl.drawArrays(gl.POINTS, 0, NP);

    gl.uniform2fv(PTS.u.uFogR, [60, 80]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gPosB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, gColB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gCol);
    useAttr(PTS, 'aPos', gPosB, 3);
    useAttr(PTS, 'aCol', gColB, 4);
    useAttr(PTS, 'aSeed', gSeedB, 1);
    gl.drawArrays(gl.POINTS, 0, NG);
    disableAttrs(PTS);
    gl.depthMask(true);
  }

  function loop() {
    if (!running) return;
    progress = readProgress();
    smoothP = lerp(smoothP, progress, 0.1);
    draw(performance.now() / 1000);
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(function (en) {
    visible = en[0].isIntersecting;
    if (STATIC) return;
    if (visible && !running) { running = true; requestAnimationFrame(loop); }
    else if (!visible) running = false;
  }, { rootMargin: '100px 0px' }).observe(sec);

  /* ---------------- Scroll berhenti di tiap langkah ----------------
     Setiap satu gerakan scroll pindah ke satu titik:
     judul → Lampu → Tirai → Suhu → Scene (semua menyala + tombol). */
  var STOPS = [0, 0.55, 0.65, 0.75, 0.95];
  var snap = { anim: false, endAt: 0, lastWheel: 0 };

  function stopY() {
    var top = sec.getBoundingClientRect().top + window.scrollY;
    var total = sec.offsetHeight - window.innerHeight;
    return STOPS.map(function (p) { return Math.round(top + p * total); });
  }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function goTo(y, dur) {
    var sm = window.__lxSmooth;
    if (sm) sm.active = false;
    var from = window.scrollY, t0 = performance.now();
    snap.anim = true;
    (function step(now) {
      var k = Math.min((now - t0) / dur, 1);
      window.scrollTo(0, from + (y - from) * easeIO(k));
      if (k < 1) requestAnimationFrame(step);
      else {
        snap.anim = false;
        snap.endAt = performance.now();
        if (sm) { sm.current = sm.target = window.scrollY; }
      }
    })(t0);
  }

  // Tujuan berikutnya untuk arah dir (+1 turun, -1 naik); null = lepas ke scroll biasa
  function nextTarget(dir, projected) {
    var ys = stopY(), y = window.scrollY, first = ys[0], lastY = ys[ys.length - 1];
    var vh = window.innerHeight;
    if (dir > 0) {
      if (y >= lastY - 2) return null;                       // sudah di langkah terakhir → lanjut ke bawah
      if (y < first - 2) return projected >= first - vh * 0.6 ? first : null; // masuk dari atas
      for (var i = 0; i < ys.length; i++) if (ys[i] > y + 2) return ys[i];
    } else {
      var end = sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight - vh;
      if (y <= first + 2) return null;                       // sudah di judul → lanjut ke atas
      if (y > end + 2) return projected <= end + vh * 0.6 ? lastY : null;  // masuk dari bawah
      for (var j = ys.length - 1; j >= 0; j--) if (ys[j] < y - 2) return ys[j];
    }
    return null;
  }

  function trySnap(dir, delta, e) {
    var sm = window.__lxSmooth;
    var base = sm && sm.active ? sm.target : window.scrollY;
    var target = nextTarget(dir, base + delta);
    if (target === null) return false;
    if (e) e.preventDefault();
    var dist = Math.abs(target - window.scrollY);
    var dur = clamp(700 + dist / window.innerHeight * 500, 900, 1800);
    goTo(target, dur);
    return true;
  }

  function inZone() {
    var r = sec.getBoundingClientRect(), vh = window.innerHeight;
    return r.top < vh * 0.6 && r.bottom > vh * 0.4;
  }

  if (!STATIC) {
    // Mouse wheel / trackpad (capture: dijalankan sebelum smooth scroll umum)
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX) || !e.deltaY) return;
      var now = performance.now();
      var gap = now - snap.lastWheel;
      snap.lastWheel = now;
      if (snap.anim) { if (inZone()) e.preventDefault(); return; }
      // Abaikan sisa inersia trackpad setelah berhenti
      if (now - snap.endAt < 1200 && gap < 160 && inZone()) { e.preventDefault(); return; }
      var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      trySnap(dy > 0 ? 1 : -1, dy, e);
    }, { passive: false, capture: true });

    // Keyboard
    window.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
      var dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
      if (!dir || !inZone()) return;
      if (snap.anim) { e.preventDefault(); return; }
      trySnap(dir, dir * 60, e);
    }, true);

    // Layar sentuh: satu usapan = satu langkah
    var touchY = null;
    window.addEventListener('touchstart', function (e) {
      touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (touchY === null) return;
      var dy = touchY - e.touches[0].clientY;
      if (snap.anim) { if (inZone()) e.preventDefault(); return; }
      if (Math.abs(dy) < 12) return;
      var dir = dy > 0 ? 1 : -1;
      if (nextTarget(dir, window.scrollY + dir * window.innerHeight * 0.3) !== null && inZone()) {
        e.preventDefault();
      }
    }, { passive: false });
    window.addEventListener('touchend', function (e) {
      if (touchY === null || snap.anim) { touchY = null; return; }
      var dy = touchY - e.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(dy) < 30 || !inZone()) return;
      trySnap(dy > 0 ? 1 : -1, (dy > 0 ? 1 : -1) * window.innerHeight * 0.3, null);
    }, { passive: true });
  }

  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; sec.classList.add('no-webgl'); });

  resize();
  if (STATIC) { smoothP = 1; for (var q = 0; q < 4; q++) led[q] = 1; draw(0); }
})();
