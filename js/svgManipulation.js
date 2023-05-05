function parseSVG(svg, width, height, styleObj = {}, mirror = false) {
    let svgObj = {};
    svg.innerHTML = "<g>"+svg.innerHTML+"</g>"; 

    svgObj.svgSplitByFills = {template: svg.cloneNode()};
    parseSVGRecursive(svg, svgObj.svgSplitByFills, styleObj);

    svgObj.viewBox = svg.firstChild.getBBox();
    // TODO: support other units
    svgObj.width = convertUnitsFromDimension(svg.width.baseVal.valueAsString, "cp", true, svgObj.viewBox.width/svg.viewBox.baseVal.width);
    svgObj.height = convertUnitsFromDimension(svg.height.baseVal.valueAsString, "cp", true, svgObj.viewBox.height/svg.viewBox.baseVal.height);

    svg.setAttribute("viewBox", "0 0 "+svgObj.viewBox.width+" "+svgObj.viewBox.height);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    svg.firstChild.setAttribute("transform", mirror ? "scale(-1,1) translate("+(-1)*(svgObj.viewBox.x+svgObj.viewBox.width)+" "+(-1)*svgObj.viewBox.y+")" : "translate("+(-1)*svgObj.viewBox.x+" "+(-1)*svgObj.viewBox.y+")");
    svg.firstChild.transform.baseVal.consolidate();
    svg.firstChild.setAttribute("transform", "matrix("+svg.firstChild.transform.baseVal[0].matrix.a+","+svg.firstChild.transform.baseVal[0].matrix.b+","+svg.firstChild.transform.baseVal[0].matrix.c+","+svg.firstChild.transform.baseVal[0].matrix.d+","+svg.firstChild.transform.baseVal[0].matrix.e+","+svg.firstChild.transform.baseVal[0].matrix.f+")");

    svgObj.allFills = svg.cloneNode(true); // TODO: Use for saving the svg when calculating viewBoxes for individual paths

    for(let key in svgObj.svgSplitByFills) {
        if(key === "template") continue;

        let newViewBox = svgObj.svgSplitByFills[key].firstChild.getBBox(); // FIXME: Might not render if not in DOM, somehow temporarily replace svg with it
    
        svgObj.svgSplitByFills[key].setAttribute("viewBox", "0 0 "+newViewBox.width+" "+newViewBox.height);
        svgObj.svgSplitByFills[key].setAttribute("width", convertUnitsFromDimension(width, "cp", true, newViewBox.width/svgObj.viewBox.width));
        svgObj.svgSplitByFills[key].setAttribute("height", convertUnitsFromDimension(height, "cp", true, newViewBox.height/svgObj.viewBox.height));
    
        // move all paths to 0 0 so it's easier to mirror it later
        svgObj.svgSplitByFills[key].firstChild.setAttribute("transform", mirror ? "scale(-1,1) translate("+(-1)*(newViewBox.x+newViewBox.width)+" "+(-1)*newViewBox.y+")" : "translate("+(-1)*newViewBox.x+" "+(-1)*newViewBox.y+")");
        svgObj.svgSplitByFills[key].firstChild.transform.baseVal.consolidate();
        svgObj.svgSplitByFills[key].firstChild.setAttribute("transform", "matrix("+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["a"]+","+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["b"]+","+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["c"]+","+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["d"]+","+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["e"]+","+svgObj.svgSplitByFills[key].firstChild.transform.baseVal[0].matrix["f"]+")");
    }

    return svgObj;
}

// TODO: Implement splitByFills, cloneNode() clones nodes without children by default
function parseSVGRecursive(parent, parentsSplitByFills, currentParentsSplitByFills, styleObj) {
    for(let i = parent.childNodes.length-1; i >= 0; i--) {
        let node = parent.childNodes[i];
        if(svgGroup.includes(node.tagName)) {
            let newCurrentParentsSplitByFills = {};
            for(let key in currentParentsSplitByFills) {
                currentParentsSplitByFills[key].insertBefore(node.cloneNode(), currentParentsSplitByFills[key].firstChild);
                newCurrentParentsSplitByFills[key] = currentParentsSplitByFills[key].firstChild;

            }
            parseSVGRecursive(node, parentsSplitByFills, newCurrentParentsSplitByFills, styleObj);
        }
        else if(svgDraw.includes(node.tagName)) {
            let key = "fill" in node.style ? node.style.fill : "noFill";

            
            // TODO: Check fill-opacity
            // if(node.style.fill in currentParentsSplitByFill) key = ; 
            // else key = "noFill";
            
            applyStyle(node, styleObj);
            
            if(!(key in currentParentsSplitByFills)) parentsSplitByFills[key] = parentsSplitByFills.template.cloneNode(true);
            currentParentsSplitByFills[key].insertBefore(node.cloneNode(), currentParentsSplitByFills[key].firstChild);
        }
        else if(svgIgnore.includes(node.tagName)) {
            node.parentNode.removeChild(node);
        }
    }
}

// TODO: Verify regex
const shortHexTest = /^#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]?$/g;
const hexTest = /^#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]?[0-9a-fA-F]?$/g;
const rgbTest = /^rgba?\(([1-9]?[0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.[0-9]*)?(\s*,\s*|\s+)([1-9]?[0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.[0-9]*)?(\s*,\s*|\s+)([1-9]?[0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.[0-9]*)?(\s*,\s*|\s*\/\s*)([1-9]?[0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.[0-9]*)?%?\)$/g;
const hslTest = /^hsla?\(/g;
const hwbTest = /^hwb\(/
// TODO: Fill namedColors
const namedColors = {
    aliceblue: "#F0F8FF",
    antiquewhite: "#FAEBD7",
    aqua: "#00FFFF",
    aquamarine: "#7FFFD4",
    azure: "#F0FFFF",
    beige: ,
    bisque: ,
    black: "#000000",
    blanchedalmond: ,
    blue: "#0000FF",
    blueviolet: "#8A2BE2",
    brown: ,
    burlywood: ,
    cadetblue: ,
    chartreuse: ,
    chocolate: ,
    coral: ,
    cornflowerblue: ,
    cornsilk: ,
    crimson: ,
    cyan: "#00FFFF",
    darkblue: ,
    darkcyan: ,
    darkgoldenrod: ,
    darkgray: ,
    darkgrey: ,
    darkgreen: ,
    darkkhaki: ,
    darkmagenta: ,
    darkolivegreen: ,
    darkorange: ,
    darkorchid: ,
    darkred: ,
    darksalmon: ,
    darkseagreen: ,
    darkslateblue: ,
    darkslategray: ,
    darkslategrey: ,
    darkturquoise: ,
    darkviolet: ,
    deeppink: ,
    deepskyblue: ,
    dimgray: ,
    dimgrey: ,
    dodgerblue: ,
    firebrick: ,
    floralwhite: ,
    forestgreen: ,
    fuchsia: ,
    gainsboro: ,
    ghostwhite: ,
    gold: ,
    goldenrod: ,
    gray: ,
    grey: ,
    green: "#008000",
    greenyellow: ,
    honeydew: ,
    hotpink: ,
    indianred: ,
    indigo: ,
    ivory: ,
    khaki: ,
    lavender: ,
    lavenderblush: ,
    lawngreen: ,
    lemonchiffon: ,
    lightblue: ,
    lightcoral: ,
    lightcyan: ,
    lightgoldenrodyellow: ,
    lightgray: ,
    lightgrey: ,
    lightgreen: ,
    lightpink: ,
    lightsalmon: ,
    lightseagreen: ,
    slightskyblue: ,
    lightslategray: ,
    lightslategrey: ,
    lightsteelblue: ,
    lightyellow: ,
    lime: ,
    limegreen: ,
    linen: ,
    magenta: "#FF00FF",
}

function standarizeColor(color, opacity) {

}

function applyStyle(target, styleObj) {
    for(let key in styleObj) target.style[key] = styleObj[key];
}