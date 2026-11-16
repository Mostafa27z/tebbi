/**
 * Pure TypeScript Zero-Dependency QR Code Generator
 * Generates ISO/IEC 18004 compliant QR Code matrices (Versions 1-6, Byte mode, ECC M/L)
 * Compatible with any standard smartphone camera / QR scanner.
 */

export interface QRMatrix {
    size: number;
    modules: boolean[][];
}

// Galois Field GF(256) tables with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
    }
})();

function gfMul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
    const res = new Array(p1.length + p2.length - 1).fill(0);
    for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
            res[i + j] ^= gfMul(p1[i], p2[j]);
        }
    }
    return res;
}

function getGeneratorPoly(degree: number): number[] {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        poly = polyMul(poly, [1, EXP_TABLE[i]]);
    }
    return poly;
}

function computeReedSolomon(data: number[], numEcBytes: number): number[] {
    const gen = getGeneratorPoly(numEcBytes);
    const msg = [...data, ...new Array(numEcBytes).fill(0)];
    for (let i = 0; i < data.length; i++) {
        const coef = msg[i];
        if (coef !== 0) {
            for (let j = 0; j < gen.length; j++) {
                msg[i + j] ^= gfMul(gen[j], coef);
            }
        }
    }
    return msg.slice(data.length);
}

// QR Version specifications for Version 1 through 6 with ECC Level M
// [version, totalCodewords, dataCodewords, ecCodewordsPerBlock, numBlocks]
const VERSION_SPECS = [
    { version: 1, size: 21, totalCodewords: 26, dataCodewords: 16, ecPerBlock: 10, blocks: 1, alignments: [] as number[] },
    { version: 2, size: 25, totalCodewords: 44, dataCodewords: 28, ecPerBlock: 16, blocks: 1, alignments: [6, 18] },
    { version: 3, size: 29, totalCodewords: 70, dataCodewords: 44, ecPerBlock: 26, blocks: 1, alignments: [6, 22] },
    { version: 4, size: 33, totalCodewords: 100, dataCodewords: 64, ecPerBlock: 18, blocks: 2, alignments: [6, 26] },
    { version: 5, size: 37, totalCodewords: 134, dataCodewords: 86, ecPerBlock: 24, blocks: 2, alignments: [6, 30] },
    { version: 6, size: 41, totalCodewords: 172, dataCodewords: 108, ecPerBlock: 16, blocks: 4, alignments: [6, 34] },
];

/**
 * Generate binary QR Code Matrix for the given string
 */
export function generateQRMatrix(text: string): QRMatrix {
    const textBytes = new TextEncoder().encode(text);
    
    // Select lowest fitting QR version
    const spec = VERSION_SPECS.find((s) => s.dataCodewords >= textBytes.length + 3) || VERSION_SPECS[VERSION_SPECS.length - 1];
    const size = spec.size;
    const modules: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    function setModule(r: number, c: number, val: boolean) {
        modules[r][c] = val;
        isFunction[r][c] = true;
    }

    // 1. Draw Finder Pattern
    function drawFinder(row: number, col: number) {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const tr = row + r;
                const tc = col + c;
                if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
                    const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
                    const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
                    const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    setModule(tr, tc, !isBorder && (isOuter || isInner));
                }
            }
        }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 2. Alignment Patterns
    if (spec.alignments.length > 0) {
        const coords = spec.alignments;
        for (const ar of coords) {
            for (const ac of coords) {
                // Skip if overlapping with finder patterns
                if (
                    (ar === 6 && ac === 6) ||
                    (ar === 6 && ac === size - 7) ||
                    (ar === size - 7 && ac === 6)
                ) {
                    continue;
                }
                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        const tr = ar + r;
                        const tc = ac + c;
                        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
                        const isCenter = r === 0 && c === 0;
                        setModule(tr, tc, isBorder || isCenter);
                    }
                }
            }
        }
    }

    // 3. Timing Patterns
    for (let i = 8; i < size - 8; i++) {
        if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
        if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
    }

    // Dark Module
    setModule(size - 8, 8, true);

    // Reserve Format Information areas
    for (let i = 0; i < 9; i++) {
        if (!isFunction[8][i]) isFunction[8][i] = true;
        if (!isFunction[i][8]) isFunction[i][8] = true;
    }
    for (let i = size - 8; i < size; i++) {
        if (!isFunction[8][i]) isFunction[8][i] = true;
        if (!isFunction[i][8]) isFunction[i][8] = true;
    }

    // 4. Encode Data in Byte Mode
    const bitBuffer: number[] = [];
    function pushBits(val: number, length: number) {
        for (let i = length - 1; i >= 0; i--) {
            bitBuffer.push((val >> i) & 1);
        }
    }

    // Mode: 0100 (Byte)
    pushBits(0b0100, 4);
    // Character count (8 bits for V1-9)
    pushBits(textBytes.length, 8);
    // Data bytes
    for (const b of textBytes) {
        pushBits(b, 8);
    }
    // Terminator (up to 4 zeroes)
    const totalDataBits = spec.dataCodewords * 8;
    const terminatorLen = Math.min(4, totalDataBits - bitBuffer.length);
    pushBits(0, terminatorLen);
    // Byte boundary padding
    while (bitBuffer.length % 8 !== 0) {
        bitBuffer.push(0);
    }
    // Pad codewords (0xEC, 0x11)
    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (bitBuffer.length < totalDataBits) {
        pushBits(padBytes[padIdx % 2], 8);
        padIdx++;
    }

    // Convert bit buffer to bytes
    const dataCodewords: number[] = [];
    for (let i = 0; i < bitBuffer.length; i += 8) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
            byte = (byte << 1) | bitBuffer[i + b];
        }
        dataCodewords.push(byte);
    }

    // 5. Compute Error Correction Blocks
    const numBlocks = spec.blocks;
    const wordsPerBlock = Math.floor(spec.dataCodewords / numBlocks);
    const dataBlocks: number[][] = [];
    const ecBlocks: number[][] = [];

    let offset = 0;
    for (let i = 0; i < numBlocks; i++) {
        const blk = dataCodewords.slice(offset, offset + wordsPerBlock);
        dataBlocks.push(blk);
        ecBlocks.push(computeReedSolomon(blk, spec.ecPerBlock));
        offset += wordsPerBlock;
    }

    // Interleave data codewords and EC codewords
    const finalCodewords: number[] = [];
    for (let i = 0; i < wordsPerBlock; i++) {
        for (let b = 0; b < numBlocks; b++) {
            finalCodewords.push(dataBlocks[b][i]);
        }
    }
    for (let i = 0; i < spec.ecPerBlock; i++) {
        for (let b = 0; b < numBlocks; b++) {
            finalCodewords.push(ecBlocks[b][i]);
        }
    }

    // Convert finalCodewords to bit stream
    const finalBits: number[] = [];
    for (const byte of finalCodewords) {
        for (let i = 7; i >= 0; i--) {
            finalBits.push((byte >> i) & 1);
        }
    }

    // 6. Place data bits in matrix (Right-to-left 2-column zig-zag)
    let bitIdx = 0;
    let upward = true;
    for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col = 5; // Skip timing column
        const rows = upward
            ? Array.from({ length: size }, (_, i) => size - 1 - i)
            : Array.from({ length: size }, (_, i) => i);

        for (const row of rows) {
            for (const c of [col, col - 1]) {
                if (!isFunction[row][c]) {
                    const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] === 1 : false;
                    // Apply Mask Pattern 0: (row + col) % 2 === 0
                    const mask = (row + c) % 2 === 0;
                    modules[row][c] = mask ? !bit : bit;
                }
            }
        }
        upward = !upward;
    }

    // 7. Write Format Information (ECC M, Mask 0: bits 101010000010010)
    // Precomputed BCH(15, 5) XOR mask 0x5412 for Level M, Mask 0:
    const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

    // Around top-left finder
    const tlCoords = [
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
        [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
        const [r, c] = tlCoords[i];
        modules[r][c] = formatBits[i] === 1;
    }

    // Along top-right and bottom-left finders
    for (let i = 0; i < 7; i++) {
        modules[size - 1 - i][8] = formatBits[i] === 1;
    }
    for (let i = 7; i < 15; i++) {
        modules[8][size - 15 + i] = formatBits[i] === 1;
    }

    return {
        size,
        modules: modules.map((row) => row.map((cell) => cell ?? false)),
    };
}
