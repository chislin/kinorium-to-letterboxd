document.getElementById('processFiles').addEventListener('click', async () => {
    const moviesFileInput = document.getElementById('moviesFile');
    const resultMessage = document.getElementById('resultMessage');

    const [moviesFile] = moviesFileInput.files;

    if (!moviesFile) {
        resultMessage.innerHTML = `<p style='color: red;'>Not all necessary files have been selected.</p>`;
        return;
    }

    try {
        const moviesData = await fileToText(moviesFile);
        const moviesJson = parseCSV(moviesData, '\t');

        const processedData = processData(moviesJson);

        console.log(processedData);

        saveProcessedData(processedData);

        resultMessage.innerHTML = `<p style='color: green;'>File has been successfully processed and saved!</p>`;
    } catch (error) {
        console.error(error);
        resultMessage.innerHTML = `<p style='color: red;'>An error occurred while processing the file.</p>`;
    }
});

/**
 * @param file {File}
 * @returns {Promise<unknown>}
 */
function fileToText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, 'utf-16le');
    });
}

/**
 * @param data {string}
 * @param delimiter {string}
 * @returns {any[]}
 */
function parseCSV(data, delimiter) {
    const rows = data.split('\n').filter((row) => row.trim() !== '');
    const headers = rows.shift().split(delimiter).map((header) => header.replace(/(^"|"$)/g, '').trim());

    return rows.map((row) => {
        const values = row.split(delimiter).map(value => value.replace(/(^"|"$)/g, '').trim());

        return headers.reduce((acc, header, index) => {
            acc[header] = values[index] || '';
            return acc;
        }, {});
    });
}

/**
 * @param movies {Array<{Type: string; Year: unknown; Title: string; Comment: string; 'Original Title': string; Date: string; 'My rating': string }>}
 * @returns {*}
 */
function processData(movies) {
    const filmTypes = ['Фильм', 'Мультфильм', 'Movie', 'Animation Movie', 'Фільм', 'Мультфільм'];
    const filteredMovies = movies.filter((movie) => filmTypes.includes(movie.Type));

    return filteredMovies.map((movie) => {
        const WatchedDate = movie.Date ? new Date(movie.Date).toISOString().split('T')[0] : '';
        const Rating10 = parseInt(movie['My rating']);
        const Title = movie['Original Title'] || movie.Title;

        return {
            Title,
            Year: movie.Year,
            Rating10: isNaN(Rating10) ? '' : Rating10,
            WatchedDate,
            Review: movie.Comment ?? '',
        };
    });
}

/**
 * @param data {Array<{Title: string; Year: unknown; Rating10: number; WatchedDate: string; Review: string}>}
 */
function saveProcessedData(data) {
    const chunkSize = 1900;
    const timestamp = Date.now();

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const csvContent = toCSV(chunk);
        const fileName = `export_${timestamp}_${Math.ceil((i + 1) / chunkSize)}.csv`;
        downloadCSV(fileName, csvContent);
    }
}

/**
 * @param data {Array<{Title: string; Year: unknown; Rating10: number; WatchedDate: string; Review: string}>}
 * @returns {string}
 */
function toCSV(data) {
    if (data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
        Object.values(item)
            .map((value) => {
                const stringValue = String(value);
                const escaped = stringValue.replace(/"/g, '""');
                return /[",\n]/.test(stringValue) ? `"${escaped}"` : escaped;
            })
            .join(',')
    );

    return [headers, ...rows].join('\n');
}

/**
 * @param filename {string}
 * @param content {string}
 */
function downloadCSV(filename, content) {
    const blob = new Blob([content], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
