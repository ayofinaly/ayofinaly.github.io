let fileContent = '';

document.getElementById('fileInput').addEventListener('change', handleFile, false);
document.getElementById('textInputFile').addEventListener('change', handleTextFile, false);

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        fileContent = e.target.result;
        extractMrkTags(); // Automatically extract tags after file is loaded
    };

    reader.readAsText(file);
}

function handleTextFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const textContent = e.target.result.trim().split('\n');

        const rows = document.getElementById('output').getElementsByTagName('tr');
                if (textContent.length !== rows.length) {
        
        alert('Lỗi: file .txt được chọn chưa hợp lý (Sai số đoạn hoặc sai định dạng)');
        location.reload(); // Reload the page
    return;
}

        for (let i = 0; i < rows.length; i++) {
            const cell3 = rows[i].getElementsByTagName('td')[2]; // Third column (User Input)
            const cell4 = rows[i].getElementsByTagName('td')[3]; // Fourth column (Processed Input)

            if (i < textContent.length) {
                const userInput = textContent[i].trim();
                cell3.textContent = userInput;

                const mid = rows[i].getElementsByTagName('td')[1].textContent.match(/mid="([^"]*)"/)[1];
                cell4.textContent = `<mrk mtype="seg" mid="${mid}">${userInput}</mrk>`;
            } else {
                cell3.textContent = ''; // Clear cell3 if fewer lines in file than rows in table
                cell4.textContent = ''; // Clear cell4 correspondingly
            }
        }                        
    };

    reader.readAsText(file);

}

function extractMrkTags() {
    if (!fileContent) {
        alert('Please load an SDLXLIFF file first.');
        return;
    }

    const mrkPattern = /<mrk mtype="seg" mid="([^"]*)">(.*?)<\/mrk>/g;
    const matches = {};
    let match;

    while ((match = mrkPattern.exec(fileContent)) !== null) {
        const mid = match[1];
        const tag = match[0];
        if (!matches[mid]) {
            matches[mid] = [];
        }
        matches[mid].push(tag);
    }

    const output = document.getElementById('output');
    output.innerHTML = '';

    for (const mid in matches) {
        if (matches[mid].length === 2) {
            const row = document.createElement('tr');
            const cell1 = document.createElement('td');
            const cell2 = document.createElement('td');
            const cell3 = document.createElement('td');
            const cell4 = document.createElement('td');

            cell1.textContent = matches[mid][0].replace(/<[^>]*>/g, '');
            cell2.textContent = matches[mid][1];

            cell3.contentEditable = true;
            cell3.classList.add('editable');
            cell3.textContent = '';
            cell3.oninput = function() {
                cell4.textContent = `<mrk mtype="seg" mid="${mid}">${cell3.textContent.trim()}</mrk>`;
            };

            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);
            row.appendChild(cell4);
            output.appendChild(row);
        }
    }

}

function generateNewSDLXLIFF() {
    const output = document.getElementById('output');
    const rows = output.getElementsByTagName('tr');

    let newContent = fileContent;

    for (let i = rows.length - 1; i >= 0; i--) {
        const originalText = rows[i].cells[1].textContent;
        const newText = rows[i].cells[3].textContent;

        // Find and replace all occurrences of originalText with newText
        let index = newContent.lastIndexOf(originalText);
        while (index !== -1) {
            newContent = newContent.substring(0, index) + newText + newContent.substring(index + originalText.length);
            index = newContent.lastIndexOf(originalText, index - 1);
        }
    }

    // Replace any status words not required
    const seguPattern = /<sdl:seg id="\d+"[^>]*>/g;
    newContent = newContent.replace(seguPattern, '<sdl:seg id="$1">');

    const blob = new Blob([newContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modified.sdlxliff';
    a.click();
    URL.revokeObjectURL(url);
}



function copyColumnToClipboard() {
    const outputTable = document.getElementById('outputTable');
    const rows = outputTable.getElementsByTagName('tr');
    let columnData = '';

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
        const cell = rows[i].getElementsByTagName('td')[0]; // First column
        if (cell) {
            columnData += cell.textContent + '\n';
        }
    }

    // Copy to clipboard
    navigator.clipboard.writeText(columnData).then(() => {
        showCopyTick();
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showCopyTick() {
    const copyTick = document.getElementById('copyTick');
    copyTick.classList.add('show');
    setTimeout(() => {
        copyTick.classList.remove('show');
    }, 1000); // Fade out after 2 seconds
}