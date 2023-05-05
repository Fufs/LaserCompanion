// TODO: Support multiple units
// TODO: Display measurements to user; scale based on given dimensions
// TODO: vinylWidth in preview
// TODO: blank canvas stock options
// TODO: Make sure static refrences of object keys are refrenced with . and everything else with []
// TODO: Implement specific svgByFills viewing
// TODO: Implement matching to nearest vinyl colour


//************************************************
//*                 HTML objects                 *
//************************************************

// Preview
const preview                 = document.getElementById("preview");
const canvas                  = document.getElementById("canvas");
const stockImage              = document.getElementById("stockImage");
const svgContainer            = document.getElementById("svgContainer");
const dragOverlay             = document.getElementById("dragOverlay");
// Stock selection
const stockManufacturerSelect = document.getElementById("stock-manufacturer-select");
const stockNameSelect         = document.getElementById("stock-name-select");
const stockSizeSelect         = document.getElementById("stock-size-select");
const stockColorSelect        = document.getElementById("stock-color-select");
// SVG upload
const svgUpload               = document.getElementById("svgUpload");
// Resize
const svgScaleRange           = document.getElementById("svgScaleRange");
const svgScaleNumber          = document.getElementById("svgScaleNumber");
// View
const mirrorViewHCheckbox = document.getElementById("mirrorViewHCheckbox");
const  xrayCheckbox = document.getElementById("xrayCheckbox");
const  documentOutlineCheckbox= document.getElementById("documentOutlineCheckbox");
// Export
const splitSVGByFillCheckbox  = document.getElementById("splitSVGByFillCheckbox");
const mirrorSVGCheckbox       = document.getElementById("mirrorSVGCheckbox");
const svgMarginNumber         = document.getElementById("svgMarginNumber");
const exportTypeSelect        = document.getElementById("exportTypeSelect");
const generateButton          = document.getElementById("generateButton");
// Popup
const spinner     = document.createElement("div");
spinner.className = "spinner";
spinner.innerHTML = '<div class="spinner-outerCircle"></div><div class="spinner-innerCircle"></div>';

// Constants
const vinylWidth = "11in" // TODO: allow changing vinyl width
const svgGroup = ["g","marker","pattern","symbol"];
const svgDraw = ["circle","ellipse","line","path","polygon","polyline","rect","use"];
const svgIgnore = ["altGlyph","altGlyphDef","altGlyphItem","animate","animateMotion","animateTransform","cursor","desc","discard","filter","font-face-format","font-face-name","font-face-src","font-face-uri","font-face","font","foreignObject","glyph","glyphRef","hkern","image","linearGradient","mask","metadata","missing-glyph","mpath","radialGradient","script","set","sodipodi:namedview","stop","switch","text","textPath","title","tref","tspan","vkern"];
const defaultOutlineStyle = {outline: ""};
const documentOutlineStyle = {outline: "solid 1px black"}
const defaultSVGStyle = {};
const xraySVGStyle = {fill: "none", stroke: "black", "stroke-width": "1px"}
const exportSVGStyle = {fill: "none", stroke: "black", "stroke-width": "0.001in"}
const exportFilename = "design";


// Variables
var db;                                     // Object will all the stock information
var stock = {manufacturer: "", name: "", size: "", color: ""};
var svgObj = {loaded: false, width: "", height: "", scale: 1, viewBox: null, orgSVG: "", svgSplitByFills: {}};
var ppmm = 1;
var previousCoordinates = {x: 0, y: 0}; // TODO: rename var
var currentCoordinates = {x: 0, y: 0}; // TODO: rename var
var dragEnabled = false;

fetch("stock.json").then((response) => response.json()).then((data) => {
    db = data;
    for(let key in db) stockManufacturerSelect.add(new Option(key, key));
    stockManufacturerSelect.disabled = false;

    if(stockManufacturerSelect.options.length === 3) {
        stockManufacturerSelect[2].selected = true;
        stockManufacturerSelect.onchange();
    }
});

// Functions
// TODO: Support no width or no height in svg
function loadSVG(svgString) {
    svgObj.loaded = false;
    
    svgContainer.innerHTML = svgString;
    for(let i = childNodes.length-1; i >= 0; i--) {
        if(svgContainer.childNodes[i].tagName !== "svg") svgContainer.removeChild(svgContainer.childNodes[i])
    }
    svgObj.orgSVG = svgContainer.innerHTML;
    parseSVG(svgContainer.firstChild, "100%", "100%", xrayCheckbox.checked ? xraySVGStyle : defaultSVGStyle, mirrorViewHCheckbox.checked);
    resizeSVG();
    // TODO: Align to the center of the stock

    svgObj.loaded = true;
}

function unloadSVG() {
    svgObj = {loaded: false, width: "", height: "", scale: 1, viewBox: null, orgSVG: "", svgSplitByFills: {}}; // FIXME: DON'T REMOVE! Make sure it's the same as the one initialized
    svgContainer.innerHTML = "";
    svgUpload.value = null;
}

// TODO: Don't cut hidden paths
// TODO: Don't refrence svgObj directly, maybe only keep stuff in svgObj that are calculated in this func and override the whole svgObj


function resizeSVG() {
    svgContainer.style.width = (convertUnitsFromDimension(svgObj["width"],"mm")*ppmm*svgObj["scale"])+"px";
    svgContainer.style.height = (convertUnitsFromDimension(svgObj["height"],"mm")*ppmm*svgObj["scale"])+"px";
}

function moveSVG() {
    svgContainer.style.left = (currentCoordinates["x"] < 0 ? 0 : (currentCoordinates["x"] > canvas.offsetWidth-svgContainer.offsetWidth ? canvas.offsetWidth-svgContainer.offsetWidth : currentCoordinates["x"]))+"px";
    svgContainer.style.top = (currentCoordinates["y"] < 0 ? 0 : (currentCoordinates["y"] > canvas.offsetHeight-svgContainer.offsetHeight ? canvas.offsetHeight-svgContainer.offsetHeight : currentCoordinates["y"]))+"px";
}

// TODO: Add margins when exporting option
function prepareSVGForExport(renderElement, mirror = true) {
    renderElement.innerHTML = svgObj["orgSVG"];
    let svg = renderElement.firstChild;

    parseSVG(svg, (convertUnitsFromDimension(svgObj["width"], "mm")*svgObj["scale"]).toFixed(2)+"mm", (convertUnitsFromDimension(svgObj["height"], "mm")*svgObj["scale"]).toFixed(2)+"mm", exportSVGStyle, mirror);

    return svg;
}

function generateSVG(svg) {
    return 'data:text/plain;charset=utf-8,'+encodeURIComponent(svg.outerHTML);
}

// TODO: Support other units
async function generatePDF(svg) {
    const format = [parseFloat(convertUnitsFromDimension(svg.width.baseVal.valueAsString, "mm")), parseFloat(convertUnitsFromDimension(svg.height.baseVal.valueAsString, "mm"))]
    const doc = new jspdf.jsPDF({unit: "mm", format: format, orientation: format[0] > format[1] ? "l" : "p"});
    console.log(format);
    await doc.svg(svg, {x: 0, y: 0, width: format[0], height: format[1]});

    return await doc.output('datauristring');
}

// Setting event listeners
function onWindowResize() {
    if(stockImage.complete) {
        let previewAspectRatio = preview.offsetWidth/preview.offsetHeight;
        let stockAspectRatio = stockImage.naturalWidth/stockImage.naturalHeight;
        let oldOffsetWidth = canvas.offsetWidth;
        
        if(stockAspectRatio >= previewAspectRatio) {
            canvas.style.width = stockImage.style.width = preview.offsetWidth+"px";
            canvas.style.height = stockImage.style.height = (preview.offsetWidth/stockAspectRatio)+"px";
        }
        else {
            canvas.style.height = stockImage.style.height = preview.offsetHeight+"px";
            canvas.style.width = stockImage.style.width = (preview.offsetHeight*stockAspectRatio)+"px";
        }

        if(stock["color"] !== "") ppmm = stockImage.offsetWidth/convertUnitsFromDimension(db[stock["manufacturer"]][stock["name"]][stock["size"]][stock["color"]]["width"],"mm"); // TODO: Support other units

        if(svgObj["loaded"]) {
            let scaleFactor = canvas.offsetWidth/oldOffsetWidth;
            currentCoordinates["x"] *= scaleFactor;
            currentCoordinates["y"] *= scaleFactor;
            
            resizeSVG();
            moveSVG();
        }
    }
}

window.onresize = onWindowResize;

stockImage.onload = onWindowResize;
stockImage.src = "stock-placeholder.png"

// TODO: finish transistioning between old mouse coordinates and new (currentX, currentY, etc.)
// TODO: smooth transition between touch and mouse
function dragMouseEnable(e) {
    if(svgObj["loaded"]) {
        previousCoordinates["x"] = e.clientX;
        previousCoordinates["y"] = e.clientY;
        
        dragTouchDisable();
        dragEnabled = "mouse";
        dragOverlay.className = "dragEnabled";
    }
}

function dragMouseDisable() {
    dragEnabled = false;
    dragOverlay.className = "dragDisabled";
    
    if(svgObj["loaded"]) {
        currentCoordinates["x"] = currentCoordinates["x"] < 0 ? 0 : (currentCoordinates["x"] > canvas.offsetWidth-svgContainer.offsetWidth ? canvas.offsetWidth-svgContainer.offsetWidth : currentCoordinates["x"]);
        currentCoordinates["y"] = currentCoordinates["y"] < 0 ? 0 : (currentCoordinates["y"] > canvas.offsetHeight-svgContainer.offsetHeight ? canvas.offsetHeight-svgContainer.offsetHeight : currentCoordinates["y"]); 
    }
}

function dragMouseMove(e) {
    if(dragEnabled === "mouse") {
        currentCoordinates["x"] += (e.clientX - previousCoordinates["x"]);
        currentCoordinates["y"] += (e.clientY - previousCoordinates["y"]);

        previousCoordinates["x"] = e.clientX;
        previousCoordinates["y"] = e.clientY;

        moveSVG();
    }
};

function dragTouchEnable(e) {
    if(svgObj["loaded"]) {
        previousCoordinates["x"] = e.changedTouches[0]["clientX"];
        previousCoordinates["y"] = e.changedTouches[0]["clientY"];
        
        dragMouseDisable();
        dragEnabled = "touch";
    }
}

function dragTouchDisable() {
    dragEnabled = false;

    if(svgObj["loaded"]) {
        currentCoordinates["x"] = currentCoordinates["x"] < 0 ? 0 : (currentCoordinates["x"] > canvas.offsetWidth-svgContainer.offsetWidth ? canvas.offsetWidth-svgContainer.offsetWidth : currentCoordinates["x"]);
        currentCoordinates["y"] = currentCoordinates["y"] < 0 ? 0 : (currentCoordinates["y"] > canvas.offsetHeight-svgContainer.offsetHeight ? canvas.offsetHeight-svgContainer.offsetHeight : currentCoordinates["y"]);  
    }
}

function dragTouchMove(e) {
    if(dragEnabled === "touch") {
        currentCoordinates["x"] += (e.changedTouches[0]["clientX"] - previousCoordinates["x"]);
        currentCoordinates["y"] += (e.changedTouches[0]["clientY"] - previousCoordinates["y"]);

        previousCoordinates["x"] = e.changedTouches[0]["clientX"];
        previousCoordinates["y"] = e.changedTouches[0]["clientY"];

        moveSVG();
    }
};

dragOverlay.onmousedown = dragMouseEnable;
dragOverlay.onmouseleave = dragMouseDisable;
dragOverlay.onmouseup = dragMouseDisable;
dragOverlay.onmousemove = dragMouseMove;

dragOverlay.addEventListener("touchstart", dragTouchEnable);
dragOverlay.addEventListener("touchend", dragTouchDisable);
dragOverlay.addEventListener("touchcancel", dragTouchDisable);
dragOverlay.addEventListener("touchmove", dragTouchMove);

// });

stockManufacturerSelect.onchange = () => {
    const [option] = stockManufacturerSelect.selectedOptions;
    stock["manufacturer"] = option.value;

    if(stock["manufacturer"] === "") {
        stockNameSelect[0].selected = true;
        stock["name"] = "";
        stockNameSelect.disabled = true;
    }
    else {
        for(let i = 2; i < stockNameSelect.options.length; i++) stockNameSelect.remove(i);
        for(let key in db[stock["manufacturer"]]) stockNameSelect.add(new Option(key, key));

        stockNameSelect.disabled = false;

        if(stockNameSelect.options.length === 3) {
            stockNameSelect[2].selected = true;
            stockNameSelect.onchange();
            return;
        }
    }

    stockSizeSelect[0].selected = true;
    stock["size"] = "";
    stockSizeSelect.disabled = true;
    stockColorSelect[0].selected = true;
    stock["color"] = "";
    stockColorSelect.disabled = true;
    svgUpload.disabled = true;
    unloadSVG();
    generateButton.disabled = true;
    stockImage.src = "stock-placeholder.png";
}

stockNameSelect.onchange = () => {
    const [option] = stockNameSelect.selectedOptions;
    stock["name"] = option.value;

    if(stock["name"] === "") {
        stockSizeSelect[0].selected = true;
        stock["size"] = "";
        stockSizeSelect.disabled = true;
    }
    else {
        for(let i = 2; i < stockSizeSelect.options.length; i++) stockSizeSelect.remove(i);
        for(let key in db[stock["manufacturer"]][stock["name"]]) stockSizeSelect.add(new Option(key, key));

        stockSizeSelect.disabled = false;

        if(stockSizeSelect.options.length === 3) {
            stockSizeSelect[2].selected = true;
            stockSizeSelect.onchange();
            return;
        }
    }

    stockColorSelect[0].selected = true;
    stock["color"] = "";
    stockColorSelect.disabled = true;
    svgUpload.disabled = true;
    unloadSVG();
    generateButton.disabled = true;
    stockImage.src = "stock-placeholder.png";
}

stockSizeSelect.onchange = () => {
    const [option] = stockSizeSelect.selectedOptions;
    stock["size"] = option.value;

    if(stock["size"] === "") {
        stockColorSelect[0].selected = true;
        stock["color"] = "";
        stockColorSelect.disabled = true;
    }
    else {
        for(let i = 2; i < stockColorSelect.options.length; i++) stockColorSelect.remove(i);
        for(let key in db[stock["manufacturer"]][stock["name"]][stock["size"]]) stockColorSelect.add(new Option(key, key));

        stockColorSelect.disabled = false;

        if(stockColorSelect.options.length === 3) {
            stockColorSelect[2].selected = true;
            stockColorSelect.onchange();
            return;
        }
    }

    svgUpload.disabled = true;
    unloadSVG();
    generateButton.disabled = true;
    stockImage.src = "stock-placeholder.png";
}

stockColorSelect.onchange = () => {
    const [option] = stockColorSelect.selectedOptions;
    stock["color"] = option.value;
    
    if(stock["color"] === "") {
        svgUpload.disabled = true;
        unloadSVG();
        generateButton.disabled = true;
        stockImage.src = "stock-placeholder.png";
    }
    else {
        stockImage.src = db[stock["manufacturer"]][stock["name"]][stock["size"]][stock["color"]]["src"];
        ppmm = stockImage.offsetWidth/convertUnitsFromDimension(db[stock["manufacturer"]][stock["name"]][stock["size"]][stock["color"]]["width"],"mm"); // TODO: Support other units
        
        svgUpload.disabled = false;
    }
}


svgUpload.onchange = () => {
    const reader = new FileReader();
    const [file] = svgUpload.files;

    reader.onload = () => loadSVG(reader.result);

    if(file) {
        reader.readAsText(file);
        generateButton.disabled = false;
    }
    else generateButton.disabled = true;
};

svgScaleRange.oninput = () => {
    svgObj["scale"] = svgScaleNumber.value = svgScaleRange.value;
    svgObj["scale"] /= 100;
    if(svgObj["loaded"]) {
        resizeSVG();
        moveSVG();
    }
}

svgScaleNumber.oninput = () => {
    svgObj["scale"] = svgScaleRange.value = svgScaleNumber.value;
    svgObj["scale"] /= 100;
    if(svgObj["loaded"]) {
        resizeSVG();
        moveSVG();
    }
}

function setView() {
    if(svgObj["loaded"]) {
        svgContainer.innerHTML = svgObj["orgSVG"];
        parseSVG(svgContainer.firstChild, "100%", "100%", xrayCheckbox.checked ? xraySVGStyle : defaultSVGStyle, mirrorViewHCheckbox.checked);
    }
}

mirrorViewHCheckbox.onchange = setView;

xrayCheckbox.onchange = setView;

documentOutlineCheckbox.onchange = (e) => {
    applyStyle(svgContainer, e.target.checked ? documentOutlineStyle : defaultOutlineStyle);
}

function createPopup() {
    let popupOverlay = document.createElement("div")
    popupOverlay.className = "popupOverlay";
    popupOverlay.onclick = (e) => {
        if(e.target === e.currentTarget) popupOverlay.remove();
    };

    let popupBody = document.createElement("div");
    popupBody.className = "popupBody";
    
    
    let popupCloseButton = document.createElement("div");
    popupCloseButton.className = "popupCloseButton";
    popupCloseButton.onclick = () => {
        popupOverlay.remove();
    }
    
    // TODO: center icon in CSS
    let popupCloseButtonIcon = document.createElement("span");
    popupCloseButtonIcon.className = "iconify"
    popupCloseButtonIcon.setAttribute("data-icon", "mdi-window-close");
    
    let popupContent = document.createElement("div");
    popupContent

    popupCloseButton.appendChild(popupCloseButtonIcon);
    popupBody.appendChild(popupCloseButton);
    popupBody.appendChild(popupContent);
    popupOverlay.appendChild(popupBody);

    document.body.appendChild(popupOverlay);


    return popupContent;
}

generateButton.onclick = async () => {
    let popupContent = createPopup();
    let renderDiv = document.createElement("div");
    renderDiv.className = "renderDiv";
    popupContent.appendChild(renderDiv);
    
    
    // TODO: remove old a
    let downloadA = document.createElement("a");
    downloadA.innerText="Click here to download!";
    
    let svg = prepareSVGForExport(renderDiv, mirrorSVGCheckbox.checked)
    if(splitSVGByFillCheckbox.checked) {

    }
    else {
        switch(exportTypeSelect.selectedOptions[0].value) {
            case "SVG":
                downloadA.href = generateSVG(svg);
                downloadA.download = exportFilename+".svg"
                break;
            case "PDF":
                downloadA.href = await generatePDF(svg);
                downloadA.download = exportFilename+".pdf"
                break;
        }
    }
    
    popupContent.innerHTML = "";
    popupContent.appendChild(downloadA);
};  