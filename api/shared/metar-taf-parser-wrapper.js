let metarTafParser;

async function loadMetarTafParser() {
    if (!metarTafParser) {
        metarTafParser = await import('metar-taf-parser');
    }
    return metarTafParser;
}

module.exports = loadMetarTafParser;
