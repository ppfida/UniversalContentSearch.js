var plugin = new Lampa.Plugin({
    name: 'UniversalContentSearch',
    version: '2.0',
    description: 'Поиск фильмов, сериалов, аниме и мультфильмов через внешний конфиг'
});

let SOURCES_URL = "https://gist.githubusercontent.com/YOUR_USERNAME/YOUR_GIST_ID/raw/sources.json"; 
// 👆 замените на raw-ссылку своего Gist с sources.json

async function loadSources() {
    try {
        let res = await fetch(SOURCES_URL);
        let data = await res.json();
        return data.sources || [];
    } catch (e) {
        console.error("Ошибка загрузки источников:", e);
        return [];
    }
}

plugin.search = async function(query, callback) {
    let sources = await loadSources();
    let results = [];

    let tasks = sources.map(source => {
        let url = source.url.replace("{query}", encodeURIComponent(query));
        return fetch(url)
            .then(res => res.text())
            .then(html => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(html, 'text/html');

                doc.querySelectorAll(source.rows).forEach(item => {
                    results.push({
                        title: item.querySelector(source.title)?.textContent || "Без названия",
                        url: item.querySelector(source.link)?.href || "",
                        image: item.querySelector(source.image)?.src || "",
                        year: item.querySelector(source.year)?.textContent || "",
                        type: source.type || "unknown"
                    });
                });
            })
            .catch(err => console.error("Ошибка парсинга:", source.name, err));
    });

    Promise.all(tasks).then(() => callback(results));
};

Lampa.plugins.register(plugin);
