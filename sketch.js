let mover = [];
let liquid;
let c;
let cw;

// 選單設定
let menu = {
    x: 10,
    y: 10,
    w: 140,
    items: ["作品一.", "作品二.", "作品三."],
    paddingTop: 28,
    lineHeight: 28,
    selected: -1
};
menu.h = menu.paddingTop + menu.items.length * menu.lineHeight + 12;

// 觸發距離（滑鼠距離左邊小於等於此值時顯示選單）
menu.trigger = 100;

// 移除 leftOffset（作品不往右移）
let tx;

// 新增 iframe 相關變數
let iframeContainer = null;
let iframeEl = null;
let iframeCloseBtn = null;

function setup() {
    // 還原為固定大小畫布 600x600
    createCanvas(600, 600);

    // 還原 movers 初始位置（不依賴畫面比例）
    mover = [];
    for (let i = 0; i < 30; i++) {
        mover[i] = new Mover(random(1, 5), random(230, 360), random(160, 170), 45, 70, 6);
    }

    // 還原 water 位置與大小
    liquid = new Water(220, height / 2 - 80, 160, 315, 0.5);

    // 重新建立 tx 圖層（對應 600x600）
    tx = createGraphics(width, height);
    tx.angleMode(DEGREES);
    tx.noStroke();
    tx.clear();
    for (let i = 0; i < width * height * 1 / 10; i++) {
        let x = random(width);
        let y = random(height);
        tx.fill(0, 3);
        tx.ellipse(x, y, random(5), random(5));
    }
}

function draw() {
    background("#212331");

    // 只有當滑鼠靠近左側（距離 <= trigger）時才顯示選單
    if (mouseX <= menu.trigger) {
        drawMenu();
    }

    let wind = createVector(0, 0);
    if (mouseIsPressed) {
        wind = createVector(0, -1);
    }
    bottle();
    for (let i = 0; i < mover.length; i++) {

        if (liquid.contains(mover[i])) {
            let dragForce = liquid.calculateDrag(mover[i]);
            mover[i].applyForce(dragForce);
        }

        let m = mover[i].mass;
        let gravity = createVector(0, 0.1 * m);
        mover[i].applyForce(wind);
        mover[i].applyForce(gravity);
        mover[i].update();
        mover[i].show();
        mover[i].checkEdges();
        liquid.show();
    }
    image(tx, 0, 0);
}

function bottle() {
    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "#f4f1de";
    fill(220);
    noStroke();
    push();

    rectMode(CENTER);
    // 瓶子置中（隨視窗寬度自動置中）
    let bx = width / 2;
    rect(bx, 80, 40, 30, 20);
    rect(bx, 100, 130, 20, 10);
    rect(bx, 130, 100, 50, 10);
    rect(bx, height / 2 + 50, 180, 400, 50);
    rect(bx, height / 2 + 150, 180, 200, 20);
    pop();
    pop();
}

class Mover {
    constructor(m, x, y, radius1, radius2, npoints) {
        this.radius1 = radius1;
        this.radius2 = radius2;
        this.npoints = npoints;
        this.angle = TWO_PI / this.npoints;
        this.halfAngle = this.angle / 2.0;

        this.mass = m;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0.0);
        this.d = this.mass * 8;
        this.yama = this.radius1 * this.mass / 15;
        this.tani = this.radius2 * this.mass / 15;
    }
    applyForce(force) {
        let f = p5.Vector.div(force, this.mass);
        this.acc.add(f);
    }
    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    show() {
        stroke(255);
        c = color("#f4f1de");
        fill(c);
        push();
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = "#f4f1de";
        beginShape();
        for (let a = 0; a < TWO_PI; a += this.angle) {
            let sx = this.pos.x + cos(a) * this.yama;
            let sy = this.pos.y + sin(a) * this.yama;
            vertex(sx, sy);
            sx = this.pos.x + cos(a + this.halfAngle) * this.tani;
            sy = this.pos.y + sin(a + this.halfAngle) * this.tani;
            vertex(sx, sy);
        }
        endShape(CLOSE);
        pop();
    }

    checkEdges() {
        // 使用相對於畫布大小的邊界，避免固定數值在全螢幕下錯位
        let bottom = height * 0.9; // 原本 540 / 600
        let leftBound = width * 0.4; // 原本 240 / 600
        let rightBound = width * 0.6333333; // 原本 380 / 600
        let topBound = height / 2 - 100;

        if (this.pos.y > bottom - this.d) {
            this.vel.y *= -1;
            this.pos.y = bottom - this.d;

        } else if (this.pos.x > rightBound) {
            this.pos.x = rightBound;
            this.vel.x *= -1;

        } else if (this.pos.x < leftBound) {
            this.vel.x *= -1;
            this.pos.x = leftBound;

        } else if (this.pos.y < topBound) {
            this.vel.y *= -1;
            this.pos.y = topBound;
        }
    }
}

class Water {
    constructor(x, y, w, h, c) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.c = c;
    }

    contains(mover) {
        let l = mover.pos;
        return l.x > this.x && l.x < this.x + this.w &&
            l.y > this.y && l.y < this.y + this.h;
    }
    calculateDrag(mover) {
        let speed = mover.vel.mag();
        let dragMagnitude = this.c * speed * speed;

        let dragForce = mover.vel.copy();
        dragForce.mult(-1);
        dragForce.normalize();
        dragForce.mult(dragMagnitude);
        return dragForce;
    }

    show() {
        noStroke();
        cw = color("#91ADC2");
        cw.setAlpha(10);
        fill(cw); //water color
        rect(this.x, this.y, this.w, this.h);
    }
}

// 畫選單並處理滑鼠互動顯示
function drawMenu() {
    push();
    noStroke();
    // 半透明白色背景
    fill(255, 230);
    rect(menu.x, menu.y, menu.w, menu.h, 8);

    // 檢查滑鼠是否在選單範圍內並找出懸停項目
    let hoverIndex = -1;
    if (mouseX > menu.x && mouseX < menu.x + menu.w &&
        mouseY > menu.y && mouseY < menu.y + menu.h) {
        let relativeY = mouseY - (menu.y + menu.paddingTop);
        hoverIndex = floor(relativeY / menu.lineHeight);
        if (hoverIndex < 0 || hoverIndex >= menu.items.length) hoverIndex = -1;
    }

    // 畫懸停高亮
    if (hoverIndex >= 0) {
        fill(0, 10);
        rect(menu.x + 8, menu.y + menu.paddingTop + hoverIndex * menu.lineHeight - 6, menu.w - 16, menu.lineHeight - 4, 6);
    }

    // 標題
    fill(40);
    textSize(12);
    textAlign(LEFT, TOP);
    text("選單", menu.x + 12, menu.y + 6);

    // 畫選項文字（字小，避免重疊）
    textSize(12);
    fill(30);
    for (let i = 0; i < menu.items.length; i++) {
        let ty = menu.y + menu.paddingTop + i * menu.lineHeight;
        text(menu.items[i], menu.x + 14, ty);
    }
    pop();
}

// 點擊選單處理（會在 console.log 顯示選到的項目）
function mousePressed() {
    // 只有當選單可見（滑鼠靠左）時才處理選單點擊
    if (mouseX <= menu.trigger &&
        mouseX > menu.x && mouseX < menu.x + menu.w &&
        mouseY > menu.y && mouseY < menu.y + menu.h) {
        let idx = floor((mouseY - (menu.y + menu.paddingTop)) / menu.lineHeight);
        if (idx >= 0 && idx < menu.items.length) {
            console.log("選擇:", menu.items[idx]);
            menu.selected = idx;

            // 根據選項開啟對應網址（只有作品一與作品二）
            if (idx === 0) {
                openIframe("https://zhang20432-beep.github.io/20251014_2/");
            } else if (idx === 1) {
                openIframe("https://hackmd.io/@P6gPl0KeQ7mpAQk7Nr4c6Q/SkU1MKb3ee");
            } else {
                // 作品三 或其他選項：關閉 iframe（如有開啟）
                closeIframe();
            }
        }
        return; // 若選單被點擊，停止其他點擊處理
    }

    // ...existing code... （若有其他 mousePressed 行為，保留）
}

// 在視窗大小改變時調整畫布與相關資源
function windowResized() {
    // 移除全螢幕調整，保持 600x600（避免圖片跑掉）
    resizeCanvas(600, 600);

    // 重新建立 tx 圖層以符合固定尺寸
    tx = createGraphics(width, height);
    tx.angleMode(DEGREES);
    tx.noStroke();
    tx.clear();
    for (let i = 0; i < width * height * 1 / 10; i++) {
        let x = random(width);
        let y = random(height);
        tx.fill(0, 3);
        tx.ellipse(x, y, random(5), random(5));
    }

    // 確保 water 回到原始比例位置
    liquid.x = 220;
    liquid.y = height / 2 - 80;
    liquid.w = 160;
    liquid.h = 315;
}

// 新增：建立並顯示 iframe overlay（寬高為視窗的 80%）
function openIframe(url) {
    closeIframe(); // 先移除舊的

    // container 放 iframe 與關閉按鈕
    iframeContainer = createDiv();
    iframeContainer.style("position", "fixed");
    iframeContainer.style("left", "50%");
    iframeContainer.style("top", "50%");
    iframeContainer.style("transform", "translate(-50%, -50%)");
    iframeContainer.style("width", "80vw");
    iframeContainer.style("height", "80vh");
    iframeContainer.style("z-index", "9999");
    iframeContainer.style("box-shadow", "0 8px 30px rgba(0,0,0,0.45)");
    iframeContainer.style("background", "#ffffff");

    // iframe 元件
    iframeEl = createElement("iframe");
    iframeEl.attribute("src", url);
    iframeEl.attribute("frameborder", "0");
    iframeEl.style("width", "100%");
    iframeEl.style("height", "100%");
    iframeEl.style("border", "none");
    iframeEl.parent(iframeContainer);

    // 關閉按鈕
    iframeCloseBtn = createButton("✕");
    iframeCloseBtn.parent(iframeContainer);
    iframeCloseBtn.style("position", "absolute");
    iframeCloseBtn.style("top", "8px");
    iframeCloseBtn.style("right", "8px");
    iframeCloseBtn.style("padding", "6px 10px");
    iframeCloseBtn.style("font-size", "16px");
    iframeCloseBtn.style("background", "rgba(0,0,0,0.6)");
    iframeCloseBtn.style("color", "#fff");
    iframeCloseBtn.style("border", "none");
    iframeCloseBtn.style("border-radius", "4px");
    iframeCloseBtn.style("cursor", "pointer");
    iframeCloseBtn.mousePressed(closeIframe);

    // 按 Esc 也可關閉
    function escHandler(e) {
        if (e.key === "Escape") closeIframe();
    }
    // 綁定到 window（記得解除綁定）
    window.addEventListener("keydown", escHandler, { once: false });
    // 把 handler 暫存在 container 上，方便關閉時移除
    iframeContainer.elt._escHandler = escHandler;
}

// 新增：關閉並移除 iframe overlay
function closeIframe() {
    if (iframeContainer) {
        // 移除 Esc 事件
        if (iframeContainer.elt && iframeContainer.elt._escHandler) {
            window.removeEventListener("keydown", iframeContainer.elt._escHandler);
        }
        iframeContainer.remove();
        iframeContainer = null;
        iframeEl = null;
        iframeCloseBtn = null;
        // 清掉選取（如需保留可移除此行）
        menu.selected = -1;
    }
}
