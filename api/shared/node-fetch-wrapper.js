let nodeFetch;

async function loadNodeFetch() {
    if (!nodeFetch) {
        nodeFetch = await import('node-fetch');
    }
    return nodeFetch;
}

module.exports = loadNodeFetch;
