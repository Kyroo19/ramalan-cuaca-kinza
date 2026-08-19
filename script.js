// ============================================
// RAMALAN CUACA - BMKG
// ============================================


// ============================================
// ELEMENT
// ============================================

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const results =
    document.getElementById("results");

const weatherCard =
    document.getElementById("weatherCard");

const loading =
    document.getElementById("loading");

const loadingText =
    document.getElementById("loadingText");

const errorBox =
    document.getElementById("error");


// ============================================
// DATABASE WILAYAH
// ============================================

let provinsi = [];
let kabupaten = [];
let kecamatan = [];
let kelurahan = [];


// ============================================
// PARSER CSV
// ============================================

function parseCSV(text) {

    const lines =
        text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);


    if (lines.length < 2) {
        return [];
    }


    const headers =
        lines[0]
            .split(",")
            .map(header =>
                header
                    .trim()
                    .replace(/^"|"$/g, "")
            );


    return lines.slice(1).map(line => {

        const values = [];

        let current = "";

        let insideQuotes = false;


        for (const char of line) {

            if (char === '"') {

                insideQuotes =
                    !insideQuotes;

                continue;
            }


            if (
                char === "," &&
                !insideQuotes
            ) {

                values.push(
                    current.trim()
                );

                current = "";

            } else {

                current += char;

            }

        }


        values.push(
            current.trim()
        );


        const object = {};


        headers.forEach(
            (header, index) => {

                object[header] =
                    (
                        values[index] || ""
                    )
                    .replace(
                        /^"|"$/g,
                        ""
                    );

            }
        );


        return object;

    });
}


// ============================================
// LOAD CSV
// ============================================

async function loadCSV(filename) {

    const response =
        await fetch(
            `wilayah/${filename}`
        );


    if (!response.ok) {

        throw new Error(
            `${filename} - HTTP ${response.status}`
        );

    }


    const text =
        await response.text();


    return parseCSV(text);
}


// ============================================
// LOAD DATABASE
// ============================================

async function loadDatabase() {

    try {

        showLoading(
            "Memuat database wilayah..."
        );


        provinsi =
            await loadCSV(
                "data-provinsi.csv"
            );


        kabupaten =
            await loadCSV(
                "data-kabupaten.csv"
            );


        kecamatan =
            await loadCSV(
                "data-kecamatan.csv"
            );


        kelurahan =
            await loadCSV(
                "data-kelurahan.csv"
            );


        console.log(
            "Database berhasil:",
            {
                provinsi:
                    provinsi.length,

                kabupaten:
                    kabupaten.length,

                kecamatan:
                    kecamatan.length,

                kelurahan:
                    kelurahan.length
            }
        );


        hideLoading();


    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );


        hideLoading();


        showError(
            "Gagal memuat database wilayah."
        );

    }
}


// ============================================
// SEARCH
// ============================================

function searchWilayah() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!keyword) {

        showError(
            "Masukkan nama kota atau kabupaten."
        );

        return;
    }


    hideError();


    weatherCard.classList.add(
        "hidden"
    );


    const hasil =
        kabupaten.filter(item => {

            const nama =
                String(
                    item.nama_kabupaten || ""
                )
                .toLowerCase();


            return nama.includes(
                keyword
            );

        });


    if (hasil.length === 0) {

        showError(
            `Wilayah "${searchInput.value}" tidak ditemukan.`
        );

        return;
    }


    tampilkanKabupaten(
        hasil
    );
}


// ============================================
// TAMPILKAN KABUPATEN
// ============================================

function tampilkanKabupaten(data) {

    results.innerHTML = "";

    results.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        "📍 Pilih Kota / Kabupaten";


    results.appendChild(
        title
    );


    data
        .slice(0, 20)
        .forEach(kab => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "result-item";


            button.innerHTML = `
                <span class="result-icon">
                    📍
                </span>

                <span class="result-content">
                    <strong>
                        ${escapeHTML(
                            kab.nama_kabupaten
                        )}
                    </strong>
                </span>

                <span class="result-arrow">
                    ›
                </span>
            `;


            button.onclick = () => {

                tampilkanKecamatan(
                    kab
                );

            };


            results.appendChild(
                button
            );

        });
}


// ============================================
// KECAMATAN
// ============================================

function tampilkanKecamatan(kab) {

    const hasil =
        kecamatan.filter(item => {

            return (

                item.kode_provinsi ===
                kab.kode_provinsi

                &&

                item.kode_kabupaten ===
                kab.kode_kabupaten

            );

        });


    if (hasil.length === 0) {

        showError(
            "Kecamatan tidak ditemukan."
        );

        return;
    }


    results.innerHTML = "";

    results.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        `🏘️ Kecamatan - ${kab.nama_kabupaten}`;


    results.appendChild(
        title
    );


    hasil.forEach(kec => {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "result-item";


        button.innerHTML = `
            <span class="result-icon">
                🏘️
            </span>

            <span class="result-content">
                <strong>
                    ${escapeHTML(
                        kec.nama_kecamatan
                    )}
                </strong>
            </span>

            <span class="result-arrow">
                ›
            </span>
        `;


        button.onclick = () => {

            tampilkanKelurahan(
                kab,
                kec
            );

        };


        results.appendChild(
            button
        );

    });
}


// ============================================
// KELURAHAN
// ============================================

function tampilkanKelurahan(
    kab,
    kec
) {

    const hasil =
        kelurahan.filter(item => {

            return (

                item.kode_provinsi ===
                kab.kode_provinsi

                &&

                item.kode_kabupaten ===
                kab.kode_kabupaten

                &&

                item.kode_kecamatan ===
                kec.kode_kecamatan

            );

        });


    if (hasil.length === 0) {

        showError(
            "Kelurahan tidak ditemukan."
        );

        return;
    }


    results.innerHTML = "";

    results.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        `🏠 Kelurahan - ${kec.nama_kecamatan}`;


    results.appendChild(
        title
    );


    hasil.forEach(kel => {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "result-item";


        button.innerHTML = `
            <span class="result-icon">
                🏠
            </span>

            <span class="result-content">

                <strong>
                    ${escapeHTML(
                        kel.nama_kelurahan
                    )}
                </strong>

                <small>
                    Kode Pos:
                    ${escapeHTML(
                        kel.kode_pos || "-"
                    )}
                </small>

            </span>

            <span class="result-arrow">
                ›
            </span>
        `;


        button.onclick = () => {

            ambilCuaca(
                kab,
                kec,
                kel
            );

        };


        results.appendChild(
            button
        );

    });
}


// ============================================
// BMKG
// ============================================

async function ambilCuaca(
    kab,
    kec,
    kel
) {

    const adm4 =
        [
            kab.kode_provinsi,
            kab.kode_kabupaten,
            kec.kode_kecamatan,
            kel.kode_desa
        ].join(".");


    console.log(
        "================================"
    );

    console.log(
        "ADM4:",
        adm4
    );

    console.log(
        "Kelurahan:",
        kel.nama_kelurahan
    );

    console.log(
        "================================"
    );


    showLoading(
        "Mengambil data BMKG..."
    );


    hideError();


    try {

        const url =
            `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `BMKG HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "DATA BMKG:",
            data
        );


        tampilkanCuaca(
            data,
            kab,
            kec,
            kel
        );


        hideLoading();


    } catch (error) {

        console.error(
            "BMKG ERROR:",
            error
        );


        hideLoading();


        showError(
            "Gagal mengambil data BMKG."
        );

    }
}


// ============================================
// PILIH CUACA TERDEKAT
// ============================================

function pilihCuacaSekarang(data) {

    const sekarang =
        new Date();


    const valid =
        data
            .filter(item => {

                const waktu =
                    new Date(
                        item.local_datetime
                    );


                return (
                    !isNaN(
                        waktu.getTime()
                    ) &&
                    waktu >= sekarang
                );

            })
            .sort(
                (a, b) =>
                    new Date(
                        a.local_datetime
                    ) -
                    new Date(
                        b.local_datetime
                    )
            );


    // Kalau masih ada forecast
    // yang belum lewat

    if (valid.length > 0) {

        return valid[0];

    }


    // Fallback:
    // ambil data paling akhir

    return (
        [...data]
            .sort(
                (a, b) =>
                    new Date(
                        b.local_datetime
                    ) -
                    new Date(
                        a.local_datetime
                    )
            )[0]
    );
}


// ============================================
// TAMPILKAN CUACA
// ============================================

function tampilkanCuaca(
    data,
    kab,
    kec,
    kel
) {

    const semuaCuaca =
        data
            ?.data?.[0]
            ?.cuaca
            ?.flat();


    if (
        !semuaCuaca ||
        semuaCuaca.length === 0
    ) {

        showError(
            "Data prakiraan BMKG kosong."
        );

        return;
    }


    const cuaca =
        pilihCuacaSekarang(
            semuaCuaca
        );


    if (!cuaca) {

        showError(
            "Data cuaca tidak tersedia."
        );

        return;
    }


    console.log(
        "WAKTU BMKG:",
        cuaca.local_datetime
    );


    // ========================================
    // UI
    // ========================================

    results.classList.add(
        "hidden"
    );


    weatherCard.classList.remove(
        "hidden"
    );


    // ========================================
    // LOKASI
    // ========================================

    document.getElementById(
        "locationName"
    ).textContent =
        kel.nama_kelurahan;


    document.getElementById(
        "locationDetail"
    ).textContent =
        `${kec.nama_kecamatan}, ${kab.nama_kabupaten}`;


    // ========================================
    // SUHU
    // ========================================

    document.getElementById(
        "temperature"
    ).textContent =
        cuaca.t ?? "-";


    // ========================================
    // KELEMBAPAN
    // ========================================

    document.getElementById(
        "humidity"
    ).textContent =
        cuaca.hu ?? "-";


    // ========================================
    // ANGIN
    // ========================================

    document.getElementById(
        "wind"
    ).textContent =
        cuaca.ws ?? "-";


    // ========================================
    // ARAH ANGIN
    // ========================================

    document.getElementById(
        "windDirection"
    ).textContent =
        cuaca.wd ?? "-";


    // ========================================
    // VISIBILITY
    // ========================================

    document.getElementById(
        "visibility"
    ).textContent =
        cuaca.vs_text ?? "-";


    // ========================================
    // DESKRIPSI
    // ========================================

    document.getElementById(
        "weatherDescription"
    ).textContent =
        cuaca.weather_desc ?? "-";


    // ========================================
    // ICON
    // ========================================

    document.getElementById(
        "weatherIcon"
    ).textContent =
        getIcon(
            cuaca.weather_desc
        );


    // ========================================
    // ANALISIS
    // ========================================

    buatAnalisis(
        semuaCuaca
    );


    // ========================================
    // FORECAST
    // ========================================

    buatForecast(
        semuaCuaca
    );
}


// ============================================
// ANALISIS CUACA
// ============================================

function buatAnalisis(data) {

    const total =
        data.length;


    if (!total) {
        return;
    }


    const hujan =
        data.filter(item =>
            /hujan|gerimis/i.test(
                item.weather_desc || ""
            )
        ).length;


    const badai =
        data.filter(item =>
            /petir|badai/i.test(
                item.weather_desc || ""
            )
        ).length;


    const kering =
        data.filter(item =>
            /cerah/i.test(
                item.weather_desc || ""
            )
        ).length;


    const hujanPersen =
        Math.round(
            (hujan / total) * 100
        );


    const badaiPersen =
        Math.round(
            (badai / total) * 100
        );


    const keringPersen =
        Math.round(
            (kering / total) * 100
        );


    document.getElementById(
        "rainAnalysis"
    ).textContent =
        `${hujanPersen}%`;


    document.getElementById(
        "stormAnalysis"
    ).textContent =
        `${badaiPersen}%`;


    document.getElementById(
        "dryAnalysis"
    ).textContent =
        `${keringPersen}%`;


    let analisis =
        "🌤️ Kondisi cuaca bervariasi.";


    if (badai > 0) {

        analisis =
            "⛈️ Ada periode prakiraan dengan potensi petir. Tetap perhatikan perubahan cuaca.";

    } else if (hujanPersen >= 50) {

        analisis =
            "🌧️ Potensi hujan cukup tinggi pada periode prakiraan.";

    } else if (keringPersen >= 60) {

        analisis =
            "☀️ Kondisi cenderung cerah dan kering.";

    }


    document.getElementById(
        "analysisText"
    ).textContent =
        analisis;
}


// ============================================
// FORECAST HARI INI + BESOK
// ============================================

function buatForecast(data) {

    const todayContainer =
        document.getElementById(
            "forecastToday"
        );

    const tomorrowContainer =
        document.getElementById(
            "forecastTomorrow"
        );


    const todayDate =
        document.getElementById(
            "todayDate"
        );

    const tomorrowDate =
        document.getElementById(
            "tomorrowDate"
        );


    todayContainer.innerHTML = "";

    tomorrowContainer.innerHTML = "";


    const sekarang =
        new Date();


    const besok =
        new Date(
            sekarang
        );


    besok.setDate(
        besok.getDate() + 1
    );


    const todayKey =
        getDateKey(
            sekarang
        );


    const tomorrowKey =
        getDateKey(
            besok
        );


    // ========================================
    // PISAH DATA
    // ========================================

    const forecastToday =
        data.filter(item => {

            return (
                getDateKey(
                    new Date(
                        item.local_datetime
                    )
                ) === todayKey
            );

        });


    const forecastTomorrow =
        data.filter(item => {

            return (
                getDateKey(
                    new Date(
                        item.local_datetime
                    )
                ) === tomorrowKey
            );

        });


    // ========================================
    // HEADER TANGGAL
    // ========================================

    todayDate.textContent =
        formatDate(
            sekarang
        );


    tomorrowDate.textContent =
        formatDate(
            besok
        );


    // ========================================
    // RENDER
    // ========================================

    renderForecast(
        forecastToday,
        todayContainer,
        "Belum ada data prakiraan hari ini."
    );


    renderForecast(
        forecastTomorrow,
        tomorrowContainer,
        "Belum ada data prakiraan besok."
    );
}


// ============================================
// DATE KEY
// ============================================

function getDateKey(date) {

    if (
        !date ||
        isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");
}


// ============================================
// FORMAT TANGGAL
// ============================================

function formatDate(date) {

    return date.toLocaleDateString(
        "id-ID",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


// ============================================
// RENDER FORECAST
// ============================================

function renderForecast(
    data,
    container,
    emptyText
) {

    container.innerHTML = "";


    const sorted =
        [...data]
            .filter(item =>
                item.local_datetime
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.local_datetime
                    ) -
                    new Date(
                        b.local_datetime
                    )
            );


    if (sorted.length === 0) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "forecast-empty";


        empty.textContent =
            emptyText;


        container.appendChild(
            empty
        );


        return;
    }


    sorted.forEach(item => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "forecast-item";


        div.innerHTML = `

            <strong>
                ${formatTime(
                    item.local_datetime
                )}
            </strong>

            <span class="forecast-icon">
                ${getIcon(
                    item.weather_desc
                )}
            </span>

            <span class="forecast-temp">
                ${item.t ?? "-"}°C
            </span>

            <small>
                ${escapeHTML(
                    item.weather_desc || "-"
                )}
            </small>

        `;


        container.appendChild(
            div
        );

    });
}


// ============================================
// ICON CUACA
// ============================================

function getIcon(weather) {

    const text =
        String(
            weather || ""
        ).toLowerCase();


    if (
        text.includes("petir") ||
        text.includes("badai")
    ) {

        return "⛈️";

    }


    if (
        text.includes("hujan")
    ) {

        return "🌧️";

    }


    if (
        text.includes("kabut")
    ) {

        return "🌫️";

    }


    if (
        text.includes("berawan")
    ) {

        return "☁️";

    }


    if (
        text.includes("cerah")
    ) {

        return "☀️";

    }


    return "🌤️";
}


// ============================================
// FORMAT WAKTU
// ============================================

function formatTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleTimeString(
        "id-ID",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}


// ============================================
// LOADING
// ============================================

function showLoading(text) {

    loading.classList.remove(
        "hidden"
    );


    loadingText.textContent =
        text;
}


function hideLoading() {

    loading.classList.add(
        "hidden"
    );
}


// ============================================
// ERROR
// ============================================

function showError(text) {

    errorBox.textContent =
        text;


    errorBox.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );
}


// ============================================
// EVENT SEARCH
// ============================================

searchButton.addEventListener(
    "click",
    searchWilayah
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            searchWilayah();

        }

    }
);


// ============================================
// START
// ============================================

loadDatabase();
