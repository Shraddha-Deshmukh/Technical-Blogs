// WebGl followes automatic memory management of Javascript

// --------------- Globals --------------------------
    var canvas = null;
    var gl = null;      // syntax sugar , contet la gl nav dile ahe

    var bFullscreen = false;
    var canvas_original_width, canvas_original_height;

    //  WebGL related globals --------------- 
    const VertexAttributesEnum = 
    {
        AMC_ATTRIBUTE_POSITION:0,        // KVC - key value coding - key : seperator and value
        AMC_ATTRIBUTE_COLOR:1,        // KVC - key value coding - key : seperator and value
        AMC_ATTRIBUTE_TEXCOORD:2,        // KVC - key value coding - key : seperator and value
        AMC_ATTRIBUTE_NORMALS:3        // KVC - key value coding - key : seperator and value
    };

    var shaderProgramObject = null;

    var buffer = null;

    var aPos, aCol;
    var uProj, uView;

    var patterns = {
        'Figure Eight': (t) => ({ x: Math.sin(t) * 6, y: Math.sin(t * 2) * 3 }),
        'Rainbow': (t) => ({ x: Math.sin(t) * 7, y: Math.abs(Math.cos(t * 0.5)) * 5 - 2 }),
        'The Snake': (t) => ({ x: -7 + (t % 14), y: Math.sin(t * 12) * 1.5 }),
        'Spiral': (t) => ({ x: Math.cos(t * 5) * 3, y: Math.sin(t * 5) * 3, z: Math.sin(t * 2) * 3 }),
        'Horizontal Wave': (t) => ({ x: Math.sin(t * 2) * 6, y: Math.sin(t * 8) * 0.8 }),
        'Large Circles': (t) => ({ x: Math.cos(t * 3) * 5, y: Math.sin(t * 3) * 5 }),
        'Floor Snake': (t) => ({ x: Math.sin(t * 15) * 2, y: -4.5, z: Math.cos(t * 2) * 2 }),
        'Zig-Zag': (t) => ({ x: Math.sin(t * 3) * 6, y: (Math.sin(t) * 4) }),
        'Loops': (t) => ({ x: Math.cos(t * 4) * (3 + Math.cos(t * 2) * 2), y: Math.sin(t * 4) * (3 + Math.sin(t * 2) * 2) }),
        'Butterfly': (t) => ({ x: Math.sin(t) * Math.cos(t) * 7, y: Math.sin(t * 2) * 3.5 }),
        'Boomerang': (t) => ({ x: Math.sin(t * 1.5) * 7, y: Math.cos(t * 3) * 4 * Math.abs(Math.sin(t * 0.5)) }),
        'Tornado': (t) => ({ x: Math.cos(t * 6) * (Math.sin(t * 0.8) * 4 + 1), y: Math.sin(t * 6) * (Math.sin(t * 0.8) * 4 + 1), z: Math.cos(t * 0.8) * 3 }),
        'Lasso': (t) => ({ x: Math.cos(t * 3) * 6, y: Math.sin(t * 3) * 3 + Math.sin(t * 9) * 1.5 }),
        'Comet': (t) => ({ x: Math.sin(t * 2) * 6, y: -Math.abs(Math.cos(t * 2)) * 5 + Math.sin(t * 0.5) * 2 }),
        'Double Wave': (t) => ({ x: Math.sin(t * 3) * 5, y: Math.sin(t * 6) * 2 + Math.sin(t * 12) * 1 }),
        'Pendulum': (t) => ({ x: Math.sin(t * 2) * 7, y: -Math.cos(t * 2) * 4 - 1 })
    };

    var state = {
        pattern: 'Figure Eight',
        bgEnable: false,
        bgStyle: 'Circular Flow',
        musicEnable: false,
        musicType: 'Ambient Zen',
        volume: 2.0,
        speed: 1.2,
        rainbowMode: true,
        ribbonColor: [0, 255, 255]
    };

    var ribbonSegs = 160;
    var ribbonHistory = Array(ribbonSegs).fill(0).map(() => ({ x: 0, y: 0, z: 0 }));
    var fireworksParticles = [];
    var stardust = Array(1500).fill(0).map(() => ({
        x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, z: (Math.random() - 0.5) * 40,
        v: Math.random() * 0.15 + 0.1
    }));

    var time = 0;

    var audioCtx, osc, gain, lfo;

    var perspectiveProjectionMatrix;

    //  WebGL related globals Ends--------------- 

    var requestAnimationFrame = 
        window.requestAnimationFrame ||             // chrome
        window.webkitRequestAnimationFrame ||       // safari
        window.mozRequestAnimationFrame ||          // mozila
        window.oRequestAnimationFrame ||            // opera
        window.msRequestAnimationFrame;             // edge

// --------------- Globals Ends Here -----------------------------------------

// user defined functions
function main()
{
    // 1. Get canvas
    canvas = document.getElementById("SGD_canvas"); // var - automatic inferencing mhnje type sangaychi grj nahi , as per value variable create hote, document navacha inbuild object DOM deto 

    if(canvas == null)
    {
        console.log("Getting canvas failed..!\n");  // console is inbuild object
    }
    else
    {
        console.log("Getting canvas successed..!\n");
    }

    // Set canvas width and height for future use
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;

    // Register for keyboard events
    window.addEventListener(
        "keydown",  // JS cha engine ne dilel
        keyDown,    // apli keydown method name
        false       // event bubble propagation - super prynt JAUDE
    );

    // 11. Register for mouse events
    window.addEventListener(
        "click",     // JS cha engine ne dilel
        mouseDown,   // apli mouse down method name
        false        // event bubble propagation - super prynt JAUDE
    );

    // 
    window.addEventListener(
        "resize",   // JS cha engine ne dilel
        resize,     // apli method resize
        false       // event bubble propagation - super prynt JAUDE
    );

    initialize();
    resize();
    display();
}

// keyboard event listener
function keyDown(event)
{
    //alert("Key is pressed..!");
    
    // code
    switch(event.keyCode)
    {
        case 70:    // F    - fullscreen
        case 102:   // f
            toggleFullscreen();
            break;

        case 81:    // Q    - quit/exit
        case 113:   // q
            uninitialize();
            window.close();
            break;
    }
    
}

// mouse event listener
function mouseDown()
{
    //alert("Mouse key is clicked..!");
}

// toggleFullscreen browser specific
function toggleFullscreen()
{
    var fullscreen_Element =
    document.fullscreenElement ||           // chrome, opera
    document.webkitFullscreenElement ||     // safari
    document.mozFullScreenElement ||        // mozila
    document.msFullscreenElement ||           // IE, Edge
    null;

    // 2. if not fullscreen, then do fullscreen as per browser
    if(fullscreen_Element == null)
    {        
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen();
        }
        else if(canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen();
        }
        else if(canvas.mozRequestFullScreen)
        {
            canvas.mozRequestFullScreen();
        }
        else if(canvas.msRequestFullscreen)
        {
            canvas.msRequestFullscreen();
        }
        
        console.log("Fullscreen ON");
        bFullscreen = true;
    }
    else //  if already fullscreen
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen();
        }
        else if(document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen();
        }
        else if(document.mozCancelFullScreen)
        {
            document.mozCancelFullScreen();
        }
        else if(document.msExitFullscreen)
        {
            document.msExitFullscreen();
        }

        console.log("Fullscreen OFF");
        bFullscreen = false;
    }
}

function initialize()
{
    // code
    gl = canvas.getContext("webgl", { antialias: true });   // webgl1 - vimp

    if(gl == null)
    {
        console.log("Getting WebGL context failed..!\n")
    }
    else
    {
        console.log("Getting WebGL context successed..!\n")
    }

    // Set webgl context chi view width ani view height
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    // Vertex Shader   
    var vertexShaderSourceCode = 
        "attribute vec3 aPos;" +
        "attribute vec4 aCol;" +
        "uniform mat4 uProj, uView;" +
        "varying vec4 vCol;" +
        "void main() {" +
        "gl_Position = uProj * uView * vec4(aPos, 1.0);" +
        "gl_PointSize = 3.5;" +
        "vCol = aCol;" +
        "}";
        // vertex shader string ends here

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);

    gl.compileShader(vertexShaderObject);

    if(gl.getShaderParameter(vertexShaderObject,gl.COMPILE_STATUS) == false)
    {
	var error = gl.getShaderInfoLog(vertexShaderObject);
        if(error.length > 0 )
        {
            var log = "Vertex shader compilation error : " + error;
            alert(log);
            uninitialize();
        }
    }
    else{
        console.log("Vetex shader compiled successfully...!");
    }

    // fragment shader
    var fragmentShaderSourceCode = 
        "precision mediump float;" +
        "varying vec4 vCol;" +
        "void main() {" +
        "gl_FragColor = vCol;" +
        "}";
        // fragment shader string ends here

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);

    gl.compileShader(fragmentShaderObject);

    if(gl.getShaderParameter(fragmentShaderObject,gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if(error.length > 0 )
        {
            var log = "Fragment shader compilation error : " + error;
            alert(log);
            uninitialize();
        }
    }
    else{
        console.log("Fragment shader compiled successfully...!");
    }

    // shader program
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    gl.bindAttribLocation(shaderProgramObject, VertexAttributesEnum.AMC_ATTRIBUTE_POSITION, "aPos");
    gl.bindAttribLocation(shaderProgramObject, VertexAttributesEnum.AMC_ATTRIBUTE_COLOR, "aCol");

	gl.linkProgram(shaderProgramObject);

    if(gl.getProgramParameter(shaderProgramObject,gl.LINK_STATUS) == false)
    {
        var error = gl.getProgramInfoLog(shaderProgramObject);
        if(error.length > 0 )
        {
            var log = "Shader linking error : " + error;
            alert(log);
            uninitialize();
        }
    }
    else{
        console.log("Shader linked successfully...!");
    }

    // get shader uniform locations - varying:-uniform
    aPos = gl.getAttribLocation(shaderProgramObject, "aPos");
    aCol = gl.getAttribLocation(shaderProgramObject, "aCol");
    uProj = gl.getUniformLocation(shaderProgramObject, "uProj");
    uView = gl.getUniformLocation(shaderProgramObject, "uView");

    // VBO for position
    buffer = gl.createBuffer();

    // Depth enable settings
    gl.clearDepth(1.0);             // ithe donhi f IMP
    gl.enable(gl.DEPTH_TEST);  // depth test enable kraychi
    gl.depthFunc(gl.LEQUAL);

    // enable backface culling  // backface la render kru nkos, embeded mdhe memory kmi aste mhnun better hide kra backface
    //gl.enable(gl.CULL_FACE);

    // set clear color
    gl.clearColor(0, 0, 0, 1);

    // initialize perspectiveProjectionMatrix
    perspectiveProjectionMatrix = mat4.create(); // gl-matrix-min.js    he function inititialize ani identity hoto

    // dat.GUI setup
    var gui = new dat.GUI();
    gui.add(state, 'pattern', Object.keys(patterns)).name('Dance Move');
    gui.add(state, 'bgEnable').name('Background ON');
    gui.add(state, 'bgStyle', ['Stardust', 'Neon Flow', 'Circular Flow', 'Particle Fireworks']).name('Background');
    gui.add(state, 'musicEnable').name('Music ON');
    gui.add(state, 'musicType', ['Techno Pulse', 'Ambient Zen', 'Cyber Sine']).name('Music Style');
    gui.add(state, 'volume', 0, 5.0).name('Music Volume');
    gui.add(state, 'speed', 0.5, 3.0);
    gui.add(state, 'rainbowMode').name('Multicolor');
    gui.addColor(state, 'ribbonColor');

    // audio init - canvas mousedown listener from original ribbonstudio
    canvas.addEventListener('mousedown', () => {
        if (audioCtx) return;
        audioCtx = new AudioContext();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        lfo = audioCtx.createOscillator();
        const lfoG = audioCtx.createGain();
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); lfo.start();
    });
}

function resize()
{
    // code      
	if(window.innerHeight <= 0)
    {
        window.innerHeight = 1;
    }

    if(bFullscreen == true)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;

        // set viewport
        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );

    }
}

function display()
{
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgramObject);

    time += 0.015 * state.speed;

    var aspect = canvas.width / canvas.height;
    var fov = Math.tan(35 * Math.PI / 180);
    var proj = [1 / (fov * aspect), 0, 0, 0, 0, 1 / fov, 0, 0, 0, 0, -1.01, -1, 0, 0, -0.2, 0];
    var view = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -14, 1];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniformMatrix4fv(uView, false, view);

    var data = [];
    var pos = patterns[state.pattern](time);
    ribbonHistory.unshift({ x: pos.x, y: pos.y, z: pos.z || 0 }); ribbonHistory.pop();

    // Ribbon
    for (var i = 0; i < ribbonSegs - 1; i++) {
        var p = ribbonHistory[i], w = 0.35 * (1 - i / ribbonSegs);
        var c = state.rainbowMode ? hsv((time * 0.3 - i * 0.01) % 1, 0.9, 0.9) : [state.ribbonColor[0] / 255, state.ribbonColor[1] / 255, state.ribbonColor[2] / 255];
        data.push(p.x - w, p.y, p.z, ...c, 1.0 - i / ribbonSegs);
        data.push(p.x + w, p.y, p.z, ...c, 1.0 - i / ribbonSegs);
    }

    // --- Background Styles ---
    if (state.bgEnable) {
    if (state.bgStyle === 'Stardust') {
        stardust.forEach(p => {
            p.z += p.v * 10 * state.speed;
            if (p.z > 10) p.z = -30;
            data.push(p.x, p.y, p.z, 0.6, 0.6, 1.0, 0.5);
        });
    } else if (state.bgStyle === 'Neon Flow') {
        stardust.forEach((p, i) => {
            var wave = Math.sin(time + i * 0.1) * 3;
            var nc = hsv((time * 0.15 + i * 0.002) % 1, 1, 1);
            data.push(p.x + wave, p.y + Math.cos(time + i * 0.1) * 3, p.z, ...nc, 0.3);
        });
    } else if (state.bgStyle === 'Circular Flow') {
        stardust.forEach((p, i) => {
            var radius = 10 + Math.sin(time * 0.5 + i) * 2;
            var x = Math.cos(i + time) * radius;
            var y = Math.sin(i + time) * radius;
            data.push(x, y, p.z, 0.2, 0.8, 1.0, 0.4);
        });
    } else if (state.bgStyle === 'Particle Fireworks') {
        // High-intensity explosion logic inspired by tksiiii
        if (Math.random() > 0.90) {
            var origin = { x: (Math.random() - 0.5) * 25, y: (Math.random() - 0.5) * 15, z: (Math.random() - 0.5) * 10 };
            var fCol = hsv(Math.random(), 1, 1);
            // Create hundreds of tiny particles for a true sparkle effect
            for (var i = 0; i < 150; i++) {
                var angle = Math.random() * Math.PI * 2;
                var strength = Math.random() * 0.5;
                fireworksParticles.push({
                    ...origin,
                    vx: Math.cos(angle) * strength,
                    vy: Math.sin(angle) * strength,
                    vz: (Math.random() - 0.5) * 0.5,
                    life: 1.0,
                    col: fCol,
                    decay: 0.01 + Math.random() * 0.02
                });
            }
        }
        for (var i = fireworksParticles.length - 1; i >= 0; i--) {
            var f = fireworksParticles[i];
            f.x += f.vx; f.y += f.vy; f.z += f.vz;
            f.vx *= 0.98; f.vy *= 0.98; f.vz *= 0.98; // Air resistance
            f.vy -= 0.003; // Light gravity
            f.life -= f.decay;
            if (f.life <= 0) fireworksParticles.splice(i, 1);
            else data.push(f.x, f.y, f.z, ...f.col, f.life);
        }
    }
    }

    if (osc && state.musicEnable) {
        osc.type = state.musicType === 'Techno Pulse' ? 'square' : (state.musicType === 'Ambient Zen' ? 'sine' : 'sawtooth');
        lfo.frequency.value = state.musicType === 'Techno Pulse' ? 12 : (state.musicType === 'Ambient Zen' ? 0.4 : 6);
        osc.frequency.setTargetAtTime(140 + (pos.y + 5) * 50, audioCtx.currentTime, 0.1);
        gain.gain.setTargetAtTime(state.volume * 0.12, audioCtx.currentTime, 0.1);
    }
    if (osc && !state.musicEnable) {
        gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0); gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, 28, 12); gl.enableVertexAttribArray(aCol);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, (ribbonSegs - 1) * 2);
    gl.drawArrays(gl.POINTS, (ribbonSegs - 1) * 2, (data.length / 7) - (ribbonSegs - 1) * 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
     
    gl.useProgram(null);


    // update 
    update();

    // do double buffering
    requestAnimationFrame(
        display,     // recurretion, game loop
        canvas
    );
}

function update()
{
    // code
}

function uninitialize()
{
    // code 
    if(shaderProgramObject)     // if(shaderProgramObject != null)
    {
        gl.useProgram(shaderProgramObject);

        var shaderObjects = gl.getAttachedShaders(shaderProgramObject);
        if(shaderObjects && shaderObjects.length > 0)
        {
            for(let i = 0; i < shaderObjects.length; i++)
            {
                gl.detachShader(shaderProgramObject, shaderObjects[i]);
                gl.deleteShader(shaderObjects[i]);
                shaderObjects[i] = null;   // rikam bhand swacch krne
            }
        }
       
        gl.useProgram(null);                    // unuse program
        gl.deleteProgram(shaderProgramObject);  // delete program
        shaderProgramObject = null;             // rikam bhand swacch krne
    }
    
    if(buffer)
    {
        gl.deleteBuffer(buffer);
        buffer = null;
    }

}

function hsv(h, s, v)
{
    var r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break; case 1: r = q, g = v, b = p; break; case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break; case 4: r = t, g = p, b = v; break; case 5: r = v, g = p, b = q; break;
    } return [r, g, b];
}

function degreeToRad ( degrees )
{
    return( degrees * Math.PI / 180.0);
}
