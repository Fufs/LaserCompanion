const absoluteUnits = ["cm", "mm", "Q", "in", "pc", "pt", "px"];
const relativeUnits = ["ex", "em", "ch", "rem", "lh", "rlh", "vw", "vh", "vmin", "vmax", "vb", "vi", "svw", "svh", "lvw", "lvh", "dvw", "dvh", "%"];

// Note: Assuming 96dpi (1px = 1/96in)
const unitChart = {
    cm: {
        cm: 1,
        mm: 10,
        Q: 40,
        in: 0.39370078740157477, // 1/2.54
        pc: 2.3622047244094486, // 6/2.54
        pt: 28.346456692913385, // 72/2.54
        px: 37.795275590551185 // 96/2.54
    },
    mm: {
        cm: 0.1,
        mm: 1,
        Q: 4,
        in: 0.039370078740157477, // 1/25.4
        pc: 0.23622047244094486, // 6/25.4
        pt: 2.8346456692913385, // 72/25.4
        px: 3.7795275590551185 // 96/25.4
    },
    Q: {
        cm: 0.025,
        mm: 0.25,
        Q: 1,
        in: 0.00984251968503937, // 1/101.6
        pc: 0.05905511811023623, // 6/101.6
        pt: 0.7086614173228347, // 72/101.6
        px: 0.9448818897637796 // 96/101.6
    },
    in: {
        cm: 2.54,
        mm: 25.4,
        Q: 101.6,
        in: 1,
        pc: 6,
        pt: 72,
        px: 96
    },
    pc: {
        cm: 0.42333333333333333, // 2.54/6
        mm: 4.233333333333333, // 25.4/6
        Q: 16.933333333333333, // 101.6/6
        in: 0.16666666666666667, // 1/6
        pc: 1,
        pt: 12,
        px: 16
    },
    pt: {
        cm: 0.035277777777777778, // 2.54/72
        mm: 0.35277777777777778, // 25.4/72
        Q: 1.411111111111111, // 101.6/72
        in: 0.013888888888888889, // 1/72
        pc: 0.08333333333333333, // 1/12
        pt: 1,
        px: 1.3333333333333333 // 4/3
    },
    px: {
        cm: 0.026458333333333333, // 2.54/96
        mm: 0.26458333333333333, // 25.4/96
        Q: 1.0583333333333333, // 101.6/96
        in: 0.010416666666666667, // 1/96
        pc: 0.0625,
        pt: 0.75,
        px: 1
    }
}

function verifyChart(precision = 16) {
    const calculationChart = {
        mm: {
            mm: 1,
            cm: 1/10,
            Q: 4,
            in: 1/25.4,
            pc: 6/25.4,
            pt: 72/25.4,
            px: 96/25.4
        },
        cm: {
            mm: 10,
            cm: 1,
            Q: 40,
            in: 1/2.54,
            pc: 6/2.54,
            pt: 72/2.54,
            px: 96/2.54
        },
        Q: {
            mm: 1/4,
            cm: 1/40,
            Q: 1,
            in: 1/101.6,
            pc: 6/101.6,
            pt: 72/101.6,
            px: 96/101.6
        },
        in: {
            mm: 25.4,
            cm: 25.4/10,
            Q: 101.6,
            in: 1,
            pc: 6,
            pt: 72,
            px: 96
        },
        pc: {
            mm: 25.4/6,
            cm: 2.54/6,
            Q: 101.6/6,
            in: 1/6,
            pc: 1,
            pt: 12,
            px: 16
        },
        pt: {
            mm: 25.4/72,
            cm: 2.54/72,
            Q: 101.6/72,
            in: 1/72,
            pc: 1/12,
            pt: 1,
            px: 4/3,
        },
        px: {
            mm: 25.4/96,
            cm: 2.54/96,
            Q: 101.6/96,
            in: 1/96,
            pc: 1/16,
            pt: 3/4,
            px: 1
        }
    }
    let units = Object.keys(unitChart);

    for(let fromUnits of units) {
        for (let toUnits of units) {
            console.log(fromUnits, toUnits, "\t", unitChart[fromUnits][toUnits], calculationChart[fromUnits][toUnits], "\t", Math.abs(unitChart[fromUnits][toUnits] - calculationChart[fromUnits][toUnits]));
        }
    }
}

function splitDimension(dimension) {
    return dimension.toString().match(/-?\d+(\.\d*)?|[A-Za-z%]+/g);
}

function convertUnitsFromValue(value, fromUnits, toUnits) {
    let num = isNaN(value) ? NaN : parseFloat(value);
    
    return num*unitChart[fromUnits][toUnits];
}

function convertUnitsFromDimension(dimension, toUnits = "cp", includeUnits = false, scale = 1) {
    let dimArray = splitDimension(dimension);
    let fromUnits = dimArray.length >= 2 ? dimArray[1] : "px";
    toUnits = toUnits === "cp" ? fromUnits : toUnits;

    let returnValue; // TODO: rename var
    if(relativeUnits.includes(fromUnits) || relativeUnits.includes(toUnits)) {
        if(fromUnits !== toUnits) {
            console.error("Cannot convert between relative, nor relative and absolute units.");
            return NaN;
        }

        returnValue = dimArray.length >= 1 ? dimArray[0]*scale : NaN;
    }
    else returnValue = dimArray.length >= 1 ? convertUnitsFromValue(dimArray[0]*scale, fromUnits, toUnits) : NaN;

    return includeUnits && returnValue !== NaN ? returnValue+toUnits : returnValue;
}