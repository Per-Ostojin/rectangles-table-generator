"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const inputFileContent = document.getElementById('input-file-content');
    const generate = document.getElementById('generate-table');
    const output = document.getElementById('output');
    const tbody = document.getElementById('tbody');
    const tstatus = document.getElementById('tstatus');
    const useSpans = document.getElementById('use-spans');
    const useCondensedEmptySpaceMode = document.getElementById('use-condensed-space-mode');
    const useCondensedSpaceHint = document.getElementById('use-collapse-space-hint');
    const fileSelector = document.getElementById('json-file-selector');
    const loadButton = document.getElementById('load-json-file');

    useSpans.addEventListener('change', (ev) => {
        useCondensedEmptySpaceMode.disabled = ev.target.checked;
        useCondensedSpaceHint.style.visibility = ev.target.checked ? 'visible' : 'hidden';
    });

    loadButton.addEventListener('click', () => {
        const selectedFile = fileSelector.value;
        console.log('Selected file:', selectedFile); 

        fetch(`json-files/${selectedFile}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Data loaded:', data);  
                inputFileContent.textContent = JSON.stringify(data, null, 2);
                generate.removeAttribute('disabled');
                console.log('Loaded JSON file:', selectedFile);
            })
            .catch(error => {
                console.error('Error loading JSON file:', error);
                alert('Error loading the file. Please check the console for more details.');
            });
    });

    generate.addEventListener('click', () => {
        output.style.visibility = 'visible';
        console.log('Generating table...');

        const inputData = JSON.parse(inputFileContent.textContent);

        if (inputData) {
            renderRectanglesHtmlTable(inputData, getRectanglesMatrix(inputData), tbody, tstatus, useSpans.checked, useCondensedEmptySpaceMode.checked);
        } else {
            alert('Error occurred while retrieving input data.');
        }

        console.log('Done.');
    });
});

const getRectanglesMatrix = (rectangles) => {
    let rows = 0;
    let cols = 0;

    rectangles.forEach(({ A: [ax, ay], B: [bx, by] }) => {
        rows = Math.max(rows, ay, by);
        cols = Math.max(cols, ax, bx);
    });

    const matrix = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(''));

    const colors = [
        '#ffc',
        '#fcf',
        '#cff',
        '#eed',
        '#ede',
        '#dee',
        '#abf',
    ];

    rectangles.forEach((r, i) => {
        const { A: [ax, ay], B: [bx, by] } = r;
        const h = by - ay + 1;
        const w = bx - ax + 1;

        for (let y = ay; y <= by; y++) {
            for (let x = ax; x <= bx; x++) {
                matrix[y][x] = {
                    color: colors[i % colors.length],
                    colspan: w,
                    rowspan: h,
                    A: [ax, ay],
                    B: [bx, by]
                };
            }
        }
    });
    return matrix;
};

const markSpannedCells = (matrix, rectangles) => {
    rectangles.forEach(({ A: [ax, ay], B: [bx, by] }) => {
        const h = by - ay + 1;
        const w = bx - ax + 1;

        for (let ir = 0; ir < h; ir++) {
            for (let ic = 0; ic < w; ic++) {
                if (ir !== 0 || ic !== 0) {
                    matrix[ay + ir][ax + ic] = null;
                }
            }
        }
    });
    return matrix;
};

const renderRectanglesHtmlTable = (rectangles, matrix, tbody, tstatus, useSpans, useCondensedEmptySpaceMode = true) => {
    const rows = matrix.length;
    const cols = matrix[0].length;

    tbody.innerHTML = ''; 
    tstatus.innerText = `${rectangles.length} rectangles in (${cols}x${rows}) table`;

    
    const hrow = tbody.insertRow();
    for (let c = 0; c < cols + 1; c++) {
        const cellElement = hrow.insertCell();
        cellElement.classList.add('hx');
        if (c > 0) {
            cellElement.innerText = (c - 1).toString(10);
        }
    }

    const tableCells = useSpans ? markSpannedCells(matrix, rectangles) : matrix;

    tableCells.forEach((row, r) => {
        const rowElement = tbody.insertRow();

        // Add coordinate col
        const coordinateYElement = rowElement.insertCell();
        coordinateYElement.classList.add('hy');
        coordinateYElement.innerText = r.toString(10);

        row.forEach((cell, c) => {
            if (cell === null) return;

            const cellElement = rowElement.insertCell();
            if (cell.color) {
                cellElement.style.backgroundColor = cell.color;
                cellElement.classList.add('rectangle');
                cellElement.title = `(${c},${r}) of Rectangle A(${cell.A[0]},${cell.A[1]}), B(${cell.B[0]},${cell.B[1]})`;
            }

            if (useSpans) {
                if (cell.colspan > 1) cellElement.colSpan = cell.colspan;
                if (cell.rowspan > 1) cellElement.rowSpan = cell.rowspan;
            }
        });
    });

    
    if (useCondensedEmptySpaceMode && !useSpans) {
        // Hide rows that contain only empty cells
        for (let i = 1; i < tbody.rows.length; i++) {
            const trElement = tbody.rows[i];
            let containsRectangles = Array.from(trElement.cells).some(cell => cell.classList.contains('rectangle'));
            if (!containsRectangles) trElement.style.display = 'none';
        }

        // Hide columns that contain only empty cells
        const columnContainsRectangles = (col) => matrix.some(row => row[col] !== '');

        for (let c = 1; c < tbody.rows[0].cells.length; c++) {
            if (!columnContainsRectangles(c - 1)) {
                Array.from(tbody.rows).forEach(row => {
                    if (row.cells[c]) row.cells[c].style.display = 'none';
                });
            }
        }
    }
};